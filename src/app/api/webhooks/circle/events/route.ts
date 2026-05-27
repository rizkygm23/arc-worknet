import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getServiceClientOrResponse,
  parseJson,
  requireCircleWebhookSecret,
  validationError,
} from "@/lib/api";
import { invalidateBootstrapCache } from "@/lib/server/cache";
import { rateLimit } from "@/lib/server/rate-limit";
import { TABLES } from "@/lib/supabase/tables";

const circleEventSchema = z.object({
  events: z
    .array(
      z.object({
        contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
        eventSignature: z.string().min(1),
        eventSignatureHash: z.string().optional(),
        transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
        userOpHash: z.string().optional(),
        blockHash: z.string().optional(),
        blockNumber: z.number().int().nonnegative(),
        logIndex: z.number().int().nonnegative(),
        topics: z.array(z.string()).default([]),
        data: z.string().optional(),
        decoded: z.record(z.string(), z.unknown()).default({}),
        firstConfirmDate: z.string().datetime().optional(),
      }),
    )
    .default([]),
});

export async function POST(request: Request) {
  const secretResponse = requireCircleWebhookSecret(request);
  if (secretResponse) return secretResponse;
  const limited = await rateLimit(request, {
    key: "circle:webhook",
    limit: 120,
    windowSeconds: 60,
  });
  if (limited) return limited;

  const parsed = await parseJson(request, circleEventSchema);
  if (!parsed.success) return validationError(parsed.error);

  const { supabase, response } = getServiceClientOrResponse();
  if (response) return response;

  if (parsed.data.events.length === 0) {
    return NextResponse.json({ inserted: 0 });
  }

  const rows = parsed.data.events.map((event) => ({
    contract_address: event.contractAddress,
    event_signature: event.eventSignature,
    event_signature_hash: event.eventSignatureHash,
    tx_hash: event.transactionHash,
    user_op_hash: event.userOpHash,
    block_hash: event.blockHash,
    block_number: event.blockNumber,
    log_index: event.logIndex,
    topics: event.topics,
    data: event.data,
    decoded: event.decoded,
    first_confirm_date: event.firstConfirmDate,
  }));

  const { error } = await supabase
    .from(TABLES.events)
    .upsert(rows, { onConflict: "chain_id,tx_hash,log_index" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await invalidateBootstrapCache();
  return NextResponse.json({ inserted: rows.length });
}
