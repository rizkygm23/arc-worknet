import { NextResponse } from "next/server";
import { CHAIN_CONFIGS } from "@circle-fin/x402-batching/client";
import { BatchFacilitatorClient } from "@circle-fin/x402-batching/server";
import { ARC_TESTNET_CHAIN_ID } from "@/lib/arc";
import { env } from "@/lib/env";

/**
 * Seller-side Circle Gateway Nanopayments (x402) helper.
 *
 * WorkNet exposes a small set of machine-consumable APIs as paid endpoints.
 * Unpaid requests get an HTTP 402 with payment requirements; requests carrying
 * a signed Gateway batch authorization (PAYMENT-SIGNATURE header) are settled
 * through the Circle Gateway facilitator before the handler runs. Settlement
 * is gasless for the buyer and batched onchain by Gateway.
 *
 * See docs/llms.md "Paid APIs (x402)" for the buyer-side contract.
 */

const X402_VERSION = 2;
const MAX_TIMEOUT_SECONDS = 345_600; // 4 days, per Gateway batching window.
const GATEWAY_WALLET_BATCHED_NAME = "GatewayWalletBatched";
const GATEWAY_WALLET_BATCHED_VERSION = "1";

// Canonical Arc Testnet Gateway deployment shipped with the SDK.
// v4 moved the USDC config under `tokens`; read both shapes so the asset
// resolves regardless of the installed kit version.
const arcChainConfig = CHAIN_CONFIGS.arcTestnet;
const legacyUsdc = (arcChainConfig as { usdc?: string }).usdc;
const X402_ASSET_RESOLVED =
  legacyUsdc ?? (arcChainConfig as { tokens?: { USDC?: { address?: string } } }).tokens?.USDC?.address;

export const X402_NETWORK = `eip155:${ARC_TESTNET_CHAIN_ID}`;
if (!X402_ASSET_RESOLVED) {
  throw new Error("x402: USDC asset address not found in kit chain config.");
}
export const X402_ASSET: string = X402_ASSET_RESOLVED;
export const X402_GATEWAY_WALLET = arcChainConfig.gatewayWallet;

/** Prices in USDC units (6 decimals), matching `*_usdc_units` elsewhere. */
export const X402_ROUTES = {
  "/api/v1/judge": {
    amount: "20000",
    description: "WorkNet AI Judge — one deliverable evaluation",
  },
  "/api/v1/recommendations": {
    amount: "5000",
    description: "WorkNet job recommendations for one skill set",
  },
} as const satisfies Record<string, { amount: string; description: string }>;

export type X402RoutePath = keyof typeof X402_ROUTES;

const facilitator = new BatchFacilitatorClient(
  env.X402_FACILITATOR_URL ? { url: env.X402_FACILITATOR_URL } : undefined,
);

type PaymentRequirements = {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: Record<string, unknown>;
};

function paymentRequirements(path: X402RoutePath): PaymentRequirements {
  if (!env.X402_PAYEE_ADDRESS) {
    throw new Error("X402_PAYEE_ADDRESS is not configured.");
  }
  return {
    scheme: "exact",
    network: X402_NETWORK,
    asset: X402_ASSET,
    amount: X402_ROUTES[path].amount,
    payTo: env.X402_PAYEE_ADDRESS,
    maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
    extra: {
      name: GATEWAY_WALLET_BATCHED_NAME,
      version: GATEWAY_WALLET_BATCHED_VERSION,
      verifyingContract: X402_GATEWAY_WALLET,
    },
  };
}

function paymentRequiredResponse(path: X402RoutePath, requirements: PaymentRequirements) {
  const body = {
    x402Version: X402_VERSION,
    error: "Payment required",
    description: X402_ROUTES[path].description,
    accepts: [requirements],
  };
  return NextResponse.json(body, {
    status: 402,
    headers: {
      "payment-required": JSON.stringify({ x402Version: X402_VERSION, accepts: [requirements] }),
    },
  });
}

export type PaidRequestContext = {
  payer: string | undefined;
  amount: string;
};

/**
 * Wraps a paid handler: negotiates payment, settles the buyer's signed
 * Gateway authorization, then runs the handler.
 */
export async function handlePaidRequest(
  request: Request,
  path: X402RoutePath,
  handler: (context: PaidRequestContext) => Promise<unknown>,
): Promise<NextResponse> {
  if (!env.X402_PAYEE_ADDRESS) {
    return NextResponse.json(
      { error: "Paid API is not configured on this deployment." },
      { status: 503 },
    );
  }

  const requirements = paymentRequirements(path);
  const signature = request.headers.get("payment-signature") ?? request.headers.get("x-payment");

  if (!signature) {
    return paymentRequiredResponse(path, requirements);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(signature, "base64").toString("utf8"));
  } catch {
    return NextResponse.json({ error: "Invalid payment payload encoding." }, { status: 402 });
  }

  // settle() verifies and locks the buyer's funds in one call — do not add a
  // separate verify() round trip (per Circle's seller guidance).
  const settlement = await facilitator.settle(
    payload as Parameters<typeof facilitator.settle>[0],
    requirements as Parameters<typeof facilitator.settle>[1],
  );

  if (!settlement.success) {
    return NextResponse.json(
      { error: "Payment settlement failed.", reason: settlement.errorReason ?? "unknown" },
      { status: 402 },
    );
  }

  const result = await handler({ payer: settlement.payer, amount: requirements.amount });
  if (result instanceof NextResponse) return result;
  return NextResponse.json(
    {
      ...(result as Record<string, unknown>),
      payment: { payer: settlement.payer, amount: requirements.amount, transaction: settlement.transaction },
    },
    { status: 200 },
  );
}
