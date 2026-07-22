import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function escapeCsvField(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const COLUMNS = [
  "name",
  "country",
  "business_type",
  "website",
  "email",
  "phone",
  "source",
  "created_at",
] as const;

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: companies } = await supabase
    .from("companies")
    .select("name, country, business_type, website, email, phone, source, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const rows = (companies ?? []).map((c) =>
    COLUMNS.map((col) => escapeCsvField((c as unknown as Record<string, unknown>)[col])).join(",")
  );
  const csv = [COLUMNS.join(","), ...rows].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="companies-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
