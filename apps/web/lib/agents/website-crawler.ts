// Fetches a company's own website (home + a few high-signal subpages) and returns plain text
// for the Lead Intelligence agent to read — this is what lets scoring be based on what a site
// actually says (its own Shipping/About/Wholesale pages) instead of just a Google snippet.
const FETCH_TIMEOUT_MS = 7000;
const MAX_SUBPAGES = 4;
const MAX_TEXT_PER_PAGE = 3000;

// Keywords used to find subpage links on the homepage worth reading — ranked so the most
// logistics-relevant pages (shipping, wholesale, dealer) get fetched first within the budget.
const SUBPAGE_KEYWORDS = [
  "shipping",
  "wholesale",
  "dealer",
  "distributor",
  "export",
  "about",
  "contact",
  "faq",
  "terms",
  "product",
  "catalog",
];

export type CrawledPage = { url: string; text: string };

export async function crawlCompanyWebsite(homepageUrl: string): Promise<CrawledPage[]> {
  const pages: CrawledPage[] = [];

  const homeHtml = await fetchWithTimeout(homepageUrl);
  if (!homeHtml) return pages;

  pages.push({ url: homepageUrl, text: htmlToText(homeHtml).slice(0, MAX_TEXT_PER_PAGE) });

  const subpageUrls = findSubpageUrls(homeHtml, homepageUrl);
  for (const url of subpageUrls.slice(0, MAX_SUBPAGES)) {
    const html = await fetchWithTimeout(url);
    if (html) {
      pages.push({ url, text: htmlToText(html).slice(0, MAX_TEXT_PER_PAGE) });
    }
  }

  return pages;
}

async function fetchWithTimeout(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; XtraProspectingBot/1.0; +https://xtramarketing.example/bot)",
        Accept: "text/html",
      },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) return null;
    return await res.text();
  } catch {
    return null; // timed out, blocked, DNS failure, etc. — best-effort only
  } finally {
    clearTimeout(timeout);
  }
}

function findSubpageUrls(html: string, baseUrl: string): string[] {
  const base = safeUrl(baseUrl);
  if (!base) return [];

  const hrefMatches = [...html.matchAll(/href=["']([^"'#]+)["']/gi)].map((m) => m[1]);
  const scored: { url: string; rank: number }[] = [];
  const seen = new Set<string>();

  for (const href of hrefMatches) {
    let resolved: URL;
    try {
      resolved = new URL(href, base);
    } catch {
      continue;
    }
    if (resolved.hostname !== base.hostname) continue; // stay on the same site only

    const lowerPath = resolved.pathname.toLowerCase();
    const rank = SUBPAGE_KEYWORDS.findIndex((kw) => lowerPath.includes(kw));
    if (rank === -1) continue;

    const key = resolved.toString();
    if (seen.has(key)) continue;
    seen.add(key);
    scored.push({ url: key, rank });
  }

  return scored.sort((a, b) => a.rank - b.rank).map((s) => s.url);
}

function safeUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
