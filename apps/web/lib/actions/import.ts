"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const MAX_ROWS = 500;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((v) => v.trim());
}

export async function importCompaniesCsv(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ไม่ได้เข้าสู่ระบบ");

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("ไม่พบข้อมูลผู้ใช้ในระบบ");

  const file = formData.get("file") as File;
  if (!file || file.size === 0) throw new Error("กรุณาเลือกไฟล์ CSV");

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("ไฟล์ CSV ไม่มีข้อมูล");

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const nameIdx = headers.indexOf("name");
  if (nameIdx === -1) throw new Error("ไฟล์ CSV ต้องมีคอลัมน์ 'name'");

  const countryIdx = headers.indexOf("country");
  const businessTypeIdx = headers.indexOf("business_type");
  const websiteIdx = headers.indexOf("website");
  const emailIdx = headers.indexOf("email");
  const phoneIdx = headers.indexOf("phone");

  const dataLines = lines.slice(1, 1 + MAX_ROWS);

  const { data: importJob } = await supabase
    .from("import_jobs")
    .insert({
      organization_id: profile.organization_id,
      source_type: "csv",
      uploaded_by: user.id,
      file_name: file.name,
      status: "running",
    })
    .select("id")
    .single();

  const companies = dataLines
    .map((line) => parseCsvLine(line))
    .filter((cols) => cols[nameIdx]?.trim())
    .map((cols) => ({
      organization_id: profile.organization_id,
      name: cols[nameIdx].trim(),
      country: countryIdx >= 0 ? cols[countryIdx] || null : null,
      business_type: businessTypeIdx >= 0 ? cols[businessTypeIdx] || null : null,
      website: websiteIdx >= 0 ? cols[websiteIdx] || null : null,
      email: emailIdx >= 0 ? cols[emailIdx] || null : null,
      phone: phoneIdx >= 0 ? cols[phoneIdx] || null : null,
      source: "import",
    }));

  if (companies.length === 0) throw new Error("ไม่พบข้อมูลบริษัทที่นำเข้าได้ในไฟล์");

  const { error: insertError } = await supabase.from("companies").insert(companies);

  if (importJob) {
    await supabase
      .from("import_jobs")
      .update({
        status: insertError ? "failed" : "completed",
        row_count: companies.length,
      })
      .eq("id", importJob.id);
  }

  if (insertError) throw new Error(`นำเข้าข้อมูลไม่สำเร็จ: ${insertError.message}`);

  redirect("/companies");
}
