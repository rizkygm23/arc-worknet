import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));
const optionalSecret = z.string().min(1).optional().or(z.literal(""));
const optionalAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/)
  .optional()
  .or(z.literal(""));

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NEXT_PUBLIC_ARC_CHAIN_ID: z.coerce.number().int().positive().default(5042002),
  NEXT_PUBLIC_ARC_RPC_URL: z.string().url().default("https://rpc.testnet.arc.network"),
  ARC_WS_URL: z.string().url().default("wss://rpc.testnet.arc.network"),
  NEXT_PUBLIC_ARC_EXPLORER_URL: z.string().url().default("https://testnet.arcscan.app"),
  NEXT_PUBLIC_ARC_USDC_ADDRESS: optionalAddress.default(
    "0x3600000000000000000000000000000000000000",
  ),
  ERC8183_CONTRACT_ADDRESS: optionalAddress.default(
    "0x0747EEf0706327138c69792bF28Cd525089e4583",
  ),
  ERC8004_IDENTITY_REGISTRY: optionalAddress.default(
    "0x8004A818BFB912233c491871b3d84c89A494BD9e",
  ),
  ERC8004_REPUTATION_REGISTRY: optionalAddress.default(
    "0x8004B663056A597Dffe9eCcC1965A193B7388713",
  ),
  ERC8004_VALIDATION_REGISTRY: optionalAddress.default(
    "0x8004Cb1BF31DAf7788923b405b754f57acEB4272",
  ),
  CIRCLE_API_KEY: z.string().optional(),
  CIRCLE_ENTITY_SECRET: z.string().optional(),
  CIRCLE_APP_KIT_KEY: z.string().optional(),
  CIRCLE_WEBHOOK_SECRET: optionalSecret,
  AI_PROVIDER_API_KEY: optionalSecret,
  ADMIN_API_SECRET: optionalSecret,
  DATA_ENCRYPTION_KEY: z.string().min(32).optional().or(z.literal("")),
  REDIS_REST_URL: optionalUrl,
  REDIS_REST_TOKEN: optionalSecret,
  PLATFORM_FEE_BPS: z.coerce.number().int().min(0).max(10000).default(100),
  PLATFORM_FEE_RECIPIENT_ADDRESS: optionalAddress,
  NEXT_PUBLIC_ENABLE_DEMO_DATA: z
    .enum(["true", "false"])
    .optional()
    .default("false"),
});

export const env = envSchema.parse(process.env);

export function hasSupabaseBrowserConfig() {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function hasSupabaseServiceConfig() {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL &&
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function requireSupabaseServiceConfig() {
  if (!hasSupabaseServiceConfig()) {
    throw new Error(
      "Missing Supabase production env. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
}

export function isDemoDataEnabled() {
  return env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true";
}
