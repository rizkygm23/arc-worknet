import { hasSupabaseServiceConfig } from "@/lib/env";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const BOOTSTRAP_CHANNEL = "arcworknet:bootstrap";
export const BOOTSTRAP_EVENT = "bump";

let warned = false;

export async function broadcastBootstrapBump() {
  if (!hasSupabaseServiceConfig()) {
    if (!warned) {
      console.warn("[realtime] Supabase service config missing; skipping broadcast.");
      warned = true;
    }
    return;
  }

  try {
    const supabase = createSupabaseServiceClient();
    const channel = supabase.channel(BOOTSTRAP_CHANNEL, {
      config: { broadcast: { self: false, ack: false } },
    });
    await channel.send({
      type: "broadcast",
      event: BOOTSTRAP_EVENT,
      payload: { at: Date.now() },
    });
    await supabase.removeChannel(channel);
  } catch (error) {
    console.warn("[realtime] broadcastBootstrapBump failed", error);
  }
}
