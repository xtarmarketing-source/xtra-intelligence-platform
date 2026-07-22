"use server";

import { redirect } from "next/navigation";
import { runProspectingAgent } from "@/lib/agents/prospecting";

export async function startProspecting(jobId: string) {
  await runProspectingAgent(jobId);
  redirect(`/prospecting/${jobId}`);
}
