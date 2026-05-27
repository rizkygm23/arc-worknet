export const USDC_DECIMALS = 6;
export const ARC_USDC_GAS_BUFFER_UNITS = 10_000;

export function usdcUnitsFromInput(input: string | number): number {
  const raw = String(input).trim();
  if (!raw) return 0;

  const [wholePart, fractionPart = ""] = raw.split(".");
  const whole = Number.parseInt(wholePart || "0", 10);
  const fraction = Number.parseInt(fractionPart.padEnd(USDC_DECIMALS, "0").slice(0, USDC_DECIMALS) || "0", 10);

  if (!Number.isFinite(whole) || !Number.isFinite(fraction)) return 0;
  return whole * 10 ** USDC_DECIMALS + fraction;
}

export function formatUsdc(units: number, options?: { compact?: boolean }) {
  const amount = units / 10 ** USDC_DECIMALS;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: options?.compact ? 0 : 2,
  }).format(amount);
}

export function formatUsdcUnits(units: number, options?: { compact?: boolean }) {
  return `${formatUsdc(units, options)} USDC`;
}
