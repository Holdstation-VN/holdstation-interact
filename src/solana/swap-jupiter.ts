import { Connection, VersionedTransaction } from "@solana/web3.js";
import { BigNumber } from "bignumber.js";
import { OverrideParams, SwapParams, Swapper } from "../types";
import type { QuoteResponse, SwapInfoResponse } from "./swap-jupiter.types";

export class Jupiter implements Swapper<"solana"> {
  private swapUrl = "https://lite-api.jup.ag/swap/v1/swap";

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
      addons: {
        amountOut: quote.outAmount,
        amountOutUsd: quote.swapUsdValue,
        minAmountOut: quote.outAmount,
        protocols: quote.routePlan.map((rp) => {
          return {
            amount: new BigNumber(rp.swapInfo.outAmount).multipliedBy(rp.percent).div(100).toString(),
            swaps: [
              {
                amount: rp.swapInfo.outAmount,
                from: rp.swapInfo.inputMint,
                pool: rp.swapInfo.ammKey,
                protocol: rp.swapInfo.label,
                to: rp.swapInfo.outputMint,
              },
            ],
          };
        }),
      },
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
    const url = new URL("https://lite-api.jup.ag/swap/v1/quote");
    url.searchParams.append("inputMint", params.fromToken.toString());
    url.searchParams.append("outputMint", params.toToken.toString());
    url.searchParams.append("amount", params.amount.toString());
    url.searchParams.append("slippageBps", params.slippage.toString());
    // url.searchParams.append("onlyDirectRoutes", "false");
    url.searchParams.append("restrictIntermediateTokens", "true");
    // https://dev.jup.ag/docs/api/swap-api/quote
    // url.searchParams.append("swapMode", "ExactIn");
    // url.searchParams.append("onlyDirectRoutes", "false");
    // url.searchParams.append("asLegacyTransaction", "false");
    // url.searchParams.append("maxAccounts", "64");

    console.debug(`Jupiter quote: ${url.toString()}`);

    const resp = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      const msg = await resp
        .json()
        .then((data) => {
          if (data.error && data.errorCode) {
            return `${data.errorCode}: ${data.error}`;
          }

          return `Unexpected error: ${resp.status}`;
        })
        .catch((e) => e.message);

      throw new Error(msg);
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
        // https://dev.jup.ag/docs/api/swap-api/swap
        // wrapAndUnwrapSol: true,

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
