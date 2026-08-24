import { createAdminClient } from "@/lib/supabase/admin";

export type JobKind = "questions" | "voices";
export type JobStatus = "running" | "cancelled" | "completed";

export async function createJob(kind: JobKind): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("generation_jobs")
    .insert({ kind })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

/** Checked between every generated item — the core of "cancel takes effect at
 * the next item boundary, never mid-item". */
export async function isJobCancelled(jobId: string | null | undefined): Promise<boolean> {
  if (!jobId) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("generation_jobs")
    .select("status")
    .eq("id", jobId)
    .single();
  return data?.status === "cancelled";
}

export async function cancelJob(jobId: string) {
  const admin = createAdminClient();
  await admin
    .from("generation_jobs")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", jobId);
}

export async function finishJob(jobId: string | null | undefined, status: JobStatus) {
  if (!jobId) return;
  const admin = createAdminClient();
  await admin
    .from("generation_jobs")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", jobId);
}
