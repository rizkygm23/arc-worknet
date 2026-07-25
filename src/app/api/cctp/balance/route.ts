import { NextResponse } from "next/server";
import { createPublicClient, http, getAddress, parseAbi } from "viem";
import { CCTP_TESTNET_NETWORKS } from "@/lib/cctp-bridge";

const erc20BalanceAbi = parseAbi([
  "function balanceOf(address account) external view returns (uint256)",
]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chainIdStr = searchParams.get("chainId");
    const userAddressParam = searchParams.get("userAddress");

    if (!chainIdStr || !userAddressParam) {
      return NextResponse.json({ error: "Missing chainId or userAddress" }, { status: 400 });
    }

    const chainId = parseInt(chainIdStr, 10);
    const network = CCTP_TESTNET_NETWORKS.find((n) => n.chainId === chainId);

    if (!network) {
      return NextResponse.json({ error: "Unsupported chainId" }, { status: 400 });
    }

    const userAddress = getAddress(userAddressParam);

    const client = createPublicClient({
      transport: http(network.rpcUrl),
    });

    const balance = await client.readContract({
      address: network.usdcAddress,
      abi: erc20BalanceAbi,
      functionName: "balanceOf",
      args: [userAddress],
    });

    const balanceBigInt = BigInt(balance.toString());
    const formatted = (Number(balanceBigInt) / 1_000_000).toString();

    return NextResponse.json({
      success: true,
      chainId,
      userAddress,
      balanceUnits: balanceBigInt.toString(),
      formatted,
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.warn("API CCTP balance fetch failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Could not read source-chain USDC balance.",
    }, { status: 502 });
  }
}
