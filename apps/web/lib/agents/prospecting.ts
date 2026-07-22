import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  PRODUCT_CATEGORIES,
  BUSINESS_TYPE_SEARCH_TERMS,
  SERVICE_SEARCH_PROFILES,
  EXCLUDED_DOMAINS,
} from "@/lib/constants";
import { suggestKnownCompanies } from "@/lib/agents/company-knowledge";
import { analyzeAndFilterCandidates, type RawCandidateInput } from "@/lib/agents/lead-intelligence";
import { crawlCompanyWebsite } from "@/lib/agents/website-crawler";

const SERPER_ENDPOINT = "https://google.serper.dev/search";
const PLACES_FIND_ENDPOINT = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json";
const MAX_RAW_CANDIDATES = 40; // gathered before crawling + the evidence-gate filter runs
const MAX_FINAL_CANDIDATES = 30; // inserted into candidate_leads after filtering/scoring
const CRAWL_CONCURRENCY = 5; // parallel site crawls per batch, to keep total run time bounded

// Excludes institutional/government/associations noise that ranks well for these search terms
// but is never an actual prospective customer.
const NEGATIVE_TERMS =
  "-council -chamber -\"trade administration\" -government -bank -guide -blog -association -ministry";

type GoogleSearchItem = { title: string; link: string; snippet?: string };

export async function runProspectingAgent(jobId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: job } = await supabase
    .from("search_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (!job) throw new Error("ไม่พบ Search Job");

  await supabase
    .from("search_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", jobId);

  try {
    const typeTerms = (job.business_types ?? [])
      .map((t: string) => BUSINESS_TYPE_SEARCH_TERMS[t] ?? t)
      .join(" ");

    const productCodes: string[] = (job.wizard_filters as { product_categories?: string[] } | null)
      ?.product_categories ?? [];
    const services: string[] = (job.services ?? []) as string[];

    const seen = new Set<string>();
    const rawCandidates: RawCandidateInput[] = [];
    let refCounter = 0;

    for (const productCode of productCodes) {
      if (rawCandidates.length >= MAX_RAW_CANDIDATES) break;

      const product = PRODUCT_CATEGORIES.find((p) => p.code === productCode);
      const productNameEn = product?.nameEn ?? productCode;
      const productNameTh = product?.name ?? productCode;

      // Ask Claude directly for well-known Thai companies in this category, straight from
      // its own knowledge — no web search. These still go through the same evidence-gate
      // analysis below, so a famous brand with no real export evidence still gets dropped.
      try {
        const knownCompanies = await suggestKnownCompanies(
          productNameTh,
          productNameEn,
          job.trade_direction
        );

        for (const company of knownCompanies) {
          if (rawCandidates.length >= MAX_RAW_CANDIDATES) break;
          if (company.website && isExcludedDomain(company.website)) continue;

          const dedupeKey = dedupeKeyFor(company.website, company.name);
          if (seen.has(dedupeKey)) continue;
          seen.add(dedupeKey);

          rawCandidates.push({
            ref: refCounter++,
            name: company.name,
            website: company.website,
            source: "llm_knowledge",
            searchedProduct: productNameTh,
            searchedService: null,
            evidenceSnippets: [
              {
                title: "แนะนำโดย AI จากความรู้ทั่วไป (Claude)",
                link: company.website ?? "",
                snippet: `ความมั่นใจ: ${company.confidence}, จังหวัด: ${company.province ?? "ไม่ทราบ"}, ตลาดส่งออกที่ทราบ: ${(company.export_markets ?? []).join(", ") || "ไม่ทราบ"}`,
              },
            ],
            knownFacebook: company.has_facebook,
            knownInstagram: company.has_instagram,
            knownExportMarkets: company.export_markets ?? [],
          });
        }
      } catch (err) {
        console.error("suggestKnownCompanies failed", err);
      }

      // Each logistics service targets a different shipment profile (B2C parcel vs B2B bulk
      // cargo), so the search itself is driven by the selected service(s), not just the product.
      for (const service of services) {
        if (rawCandidates.length >= MAX_RAW_CANDIDATES) break;

        const profile = SERVICE_SEARCH_PROFILES[service] ?? {
          keywordsEn: "",
          directorySites: [] as string[],
        };

        const directionPhrase =
          job.trade_direction === "export"
            ? `Thailand exporter sell ${productNameEn} ${profile.keywordsEn}`
            : `Thailand importer buyer ${productNameEn} ${profile.keywordsEn}`;

        const queries: string[] = [];

        if (profile.directorySites.length > 0) {
          const siteFilter = profile.directorySites.map((s) => `site:${s}`).join(" OR ");
          queries.push(`(${siteFilter}) ${directionPhrase} ${typeTerms} ${NEGATIVE_TERMS}`.trim());
        }

        // Open web search (no site restriction) — finds standalone company websites, which is
        // the only kind of page the AI is allowed to score (see EXCLUDED_DOMAINS).
        queries.push(
          `${directionPhrase} ${typeTerms} ${NEGATIVE_TERMS} -directory -wikipedia -news -forum`.trim()
        );

        for (const query of queries) {
          if (rawCandidates.length >= MAX_RAW_CANDIDATES) break;

          const items = await serperSearch(query);

          for (const item of items) {
            if (rawCandidates.length >= MAX_RAW_CANDIDATES) break;

            let domain: string;
            try {
              domain = new URL(item.link).hostname;
            } catch {
              continue;
            }
            if (isExcludedDomain(domain)) continue;

            const dedupeKey = `${domain}${item.link}`;
            if (seen.has(dedupeKey)) continue;
            seen.add(dedupeKey);

            rawCandidates.push({
              ref: refCounter++,
              name: cleanTitle(item.title),
              website: item.link,
              source: "web_search",
              searchedProduct: productNameTh,
              searchedService: service,
              evidenceSnippets: [{ title: item.title, link: item.link, snippet: item.snippet ?? "" }],
            });
          }
        }
      }
    }

    // Crawl each candidate's own website (home + Shipping/About/Wholesale/Contact-style
    // subpages) so scoring is based on what the site actually says, not just a search snippet.
    // Batched with limited concurrency — crawling is the slowest step in this pipeline.
    for (let i = 0; i < rawCandidates.length; i += CRAWL_CONCURRENCY) {
      const batch = rawCandidates.slice(i, i + CRAWL_CONCURRENCY);
      await Promise.all(
        batch.map(async (candidate) => {
          if (!candidate.website) return;
          try {
            const pages = await crawlCompanyWebsite(candidate.website);
            candidate.crawledPages = pages;
          } catch {
            // best-effort — a site that fails to crawl still gets scored on search evidence alone
          }
        })
      );
    }

    // Evidence-gated analysis: Claude decides, per real evidence only, which candidates have
    // genuine export/logistics-opportunity proof, scores them, and drops anything without
    // evidence entirely — those never reach the database (per product decision: don't save
    // unverifiable leads).
    const analyzed = await analyzeAndFilterCandidates(rawCandidates);
    const rawByRef = new Map(rawCandidates.map((c) => [c.ref, c]));

    const candidates: Record<string, unknown>[] = analyzed.slice(0, MAX_FINAL_CANDIDATES).map((lead) => {
      const raw = rawByRef.get(lead.ref);
      return {
        organization_id: job.organization_id,
        search_job_id: job.id,
        name: lead.name,
        website: lead.website ?? raw?.website ?? null,
        country: "Thailand",
        province_state: lead.province,
        main_products: [lead.product_category],
        business_type: lead.industry ?? job.business_types?.[0] ?? null,
        facebook_url: lead.facebook,
        linkedin_url: lead.linkedin,
        email: lead.email,
        phone: lead.phone,
        employee_count_est: lead.employees ?? null,
        revenue_est: lead.revenue_estimate ?? null,
        has_factory: lead.has_factory ?? null,
        export_markets: lead.export_countries ?? [],
        export_evidence: lead.export_evidence ?? [],
        marketplace_platforms: lead.marketplaces ?? [],
        recommended_logistics_service: lead.recommended_logistics_service ?? null,
        lead_score: lead.opportunity_score ?? null,
        export_score: lead.export_score ?? null,
        logistics_score: lead.logistics_score ?? null,
        lead_reason: lead.reason ?? null,
        sources: raw?.evidenceSnippets ?? [],
        raw_source_data: {
          source_type: raw?.source ?? "web_search",
          searched_product: raw?.searchedProduct,
          searched_service: raw?.searchedService,
          is_manufacturer: lead.is_manufacturer,
          crawled_pages: (raw?.crawledPages ?? []).map((p) => p.url),
          current_logistics_provider: lead.current_logistics_provider,
        },
        status: "pending_review",
      };
    });

    // Best-effort Google Maps enrichment — failures here must never fail the whole job
    for (const candidate of candidates) {
      try {
        const place = await findPlace(`${candidate.name} ${candidate.country}`);
        if (place) {
          candidate.province_state = candidate.province_state ?? place.provinceState;
          candidate.raw_source_data = {
            ...(candidate.raw_source_data as Record<string, unknown>),
            maps_place_id: place.placeId,
          };
        }
      } catch {
        // enrichment is optional, ignore failures
      }
    }

    if (candidates.length > 0) {
      const { error: insertError } = await supabase.from("candidate_leads").insert(candidates);
      if (insertError) throw insertError;
    }

    await supabase
      .from("search_jobs")
      .update({
        status: "completed",
        result_count: candidates.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  } catch (err) {
    console.error("Prospecting Agent failed", err);
    await supabase.from("search_jobs").update({ status: "failed" }).eq("id", jobId);
  }
}

// A real company website only — marketplace listings and social "shop" pages carry none of
// the Shipping/About/Wholesale page content this agent needs to read, and per the product
// requirement those platforms must never be treated as the candidate's own website.
function isExcludedDomain(domainOrUrl: string): boolean {
  const domain = domainOrUrl.includes("://") ? safeHostname(domainOrUrl) : domainOrUrl;
  if (!domain) return true;
  return EXCLUDED_DOMAINS.some((excluded) => domain.includes(excluded));
}

function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

async function serperSearch(query: string): Promise<GoogleSearchItem[]> {
  const res = await fetch(SERPER_ENDPOINT, {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: 10 }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Serper API error (${res.status}): ${body}`);
  }
  const data = await res.json();
  const organic = (data.organic ?? []) as { title: string; link: string; snippet?: string }[];
  return organic.map((item) => ({ title: item.title, link: item.link, snippet: item.snippet }));
}

async function findPlace(query: string) {
  const url = new URL(PLACES_FIND_ENDPOINT);
  url.searchParams.set("input", query);
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", "place_id,formatted_address");
  url.searchParams.set("key", process.env.GOOGLE_MAPS_API_KEY!);

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = await res.json();
  const candidate = data.candidates?.[0];
  if (!candidate) return null;

  return {
    placeId: candidate.place_id as string,
    provinceState: extractProvince(candidate.formatted_address as string | undefined),
  };
}

function cleanTitle(title: string) {
  return title
    .replace(/\s*[-|–]\s*LinkedIn.*$/i, "")
    .replace(/\s*[-|–]\s*Alibaba\.com.*$/i, "")
    .replace(/\s*[-|–]\s*Thaitrade\.com.*$/i, "")
    .trim();
}

function dedupeKeyFor(website: string | null, name: string): string {
  if (website) {
    try {
      return new URL(website).hostname;
    } catch {
      // fall through to name-based key
    }
  }
  return name.trim().toLowerCase();
}

function extractProvince(address?: string) {
  if (!address) return null;
  const parts = address.split(",").map((p) => p.trim());
  return parts.length >= 2 ? parts[parts.length - 2] : null;
}
