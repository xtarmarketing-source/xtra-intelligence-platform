"use server";

import { revalidatePath } from "next/cache";
import { scoreLead } from "@/lib/agents/scoring";

export async function scoreLeadAction(leadId: string) {
  await scoreLead(leadId);
  revalidatePath("/leads");
}
