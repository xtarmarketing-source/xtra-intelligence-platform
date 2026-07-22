"use server";

import { revalidatePath } from "next/cache";
import { analyzeCompetitor } from "@/lib/agents/competitor-intelligence";

export async function analyzeCompetitorAction(companyId: string) {
  await analyzeCompetitor(companyId);
  revalidatePath(`/companies/${companyId}`);
}
