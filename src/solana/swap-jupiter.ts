import { Connection, VersionedTransaction } from "@solana/web3.js";
import { OverrideParams, SwapParams, Swapper } from "../types";
import type { QuoteResponse, SwapInfoResponse } from "./swap-jupiter.types";

// TODO: add hold.so
export class Jupiter implements Swapper<"solana"> {
  private swapUrl = "https://api.jup.ag/swap/v1/swap";

  constructor(private connection: Connection) {}

  async estimate(params: SwapParams<"solana">, override?: Partial<OverrideParams<"solana">>) {
    const quote = await this.getQuote(params);
    const swapInfo = await this.getSwapInfo(quote, override);

    const buffer = Buffer.from(swapInfo.swapTransaction, "base64");
    const versionedTx = VersionedTransaction.deserialize(Uint8Array.from(buffer));
    const feeResult = await this.connection.getFeeForMessage(versionedTx.message, "confirmed");

    return {
      to: "",
      gas: (feeResult.value || 5000).toString(),
      data: swapInfo.swapTransaction,
    };
  }

  name(): string {
    return "jupiter";
  }

  enabled(chainId: number): boolean {
    // alway on for solana
    return true;
  }

  // https://dev.jup.ag/docs/api/swap-api/quote
  private async getQuote(params: SwapParams<"solana">) {
    const url = new URL("https://api.jup.ag/swap/v1/quote");
    url.searchParams.append("inputMint", params.fromToken.toString());
    url.searchParams.append("outputMint", params.toToken.toString());
    url.searchParams.append("amount", params.amount.toString());
    url.searchParams.append("slippageBps", params.slippage.toString());
    url.searchParams.append("onlyDirectRoutes", "false");
    url.searchParams.append("restrictIntermediateTokens", "true");

    const resp = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      throw new Error("Failed to get quote");
    }

    const data: QuoteResponse = await resp.json();
    return data;
  }

  // https://dev.jup.ag/docs/api/swap-api/swap
  private async getSwapInfo(quote: QuoteResponse, override?: Partial<OverrideParams<"solana">>) {
    if (!override?.from) {
      throw new Error("Unknown user public key");
    }

    const resp = await fetch(this.swapUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 'x-api-key': '' // enter api key here
      },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: override.from,

        // ADDITIONAL PARAMETERS TO OPTIMIZE FOR TRANSACTION LANDING
        // See next guide to optimize for transaction landing
        dynamicComputeUnitLimit: true,
        dynamicSlippage: true,
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: 1000000,
            priorityLevel: "veryHigh",
          },
        },
      }),
    });

    if (!resp.ok) {
      throw new Error("Failed to get swap info");
    }

    const data: SwapInfoResponse = await resp.json();

    return data;
  }
}
