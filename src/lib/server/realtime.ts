import { hasSupabaseServiceConfig } from "@/lib/env";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const BOOTSTRAP_CHANNEL = "worknet:bootstrap";
export const BOOTSTRAP_EVENT = "bump";
export const jobChannel = (jobId: string) => `worknet:job:${jobId}`;
export const JOB_EVENT = "bump";

let warned = false;

export async function broadcastBootstrapBump() {
  await broadcastBump(BOOTSTRAP_CHANNEL);
}

export async function broadcastJobBump(jobId: string) {
  await broadcastBump(jobChannel(jobId));
}

async function broadcastBump(channelName: string) {
  if (!hasSupabaseServiceConfig()) {
    if (!warned) {
      console.warn("[realtime] Supabase service config missing; skipping broadcast.");
      warned = true;
    }
    return;
  }

  try {
    const supabase = createSupabaseServiceClient();
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false, ack: false } },
    });
    await channel.send({
      type: "broadcast",
      event: BOOTSTRAP_EVENT,
      payload: { at: Date.now() },
    });
    await supabase.removeChannel(channel);
  } catch (error) {
    console.warn("[realtime] broadcast failed", error);
  }
}
