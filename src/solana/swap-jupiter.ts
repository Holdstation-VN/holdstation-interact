import { Connection, VersionedTransaction } from "@solana/web3.js";
import { BigNumber } from "bignumber.js";
import { config } from "../config";
import { OverrideParams, SwapParams, Swapper } from "../types";
import type { QuoteResponse, SwapInfoResponse } from "./swap-jupiter.types";

export class Jupiter implements Swapper<"solana"> {
  private swapUrl = "https://api.jup.ag/swap/v1/swap";

  constructor(private connection: Connection) {}

  async estimate(params: SwapParams<"solana">, override?: Partial<OverrideParams<"solana">>) {
    const quote = await this.getQuote(params);
    const swapInfo = await this.getSwapInfo(quote, override, params?.feeAddress, params?.apiKey);

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
        // protocols is a list of pathways that funds take when swapping between two tokens.
        protocols: [
          {
            // amount: refers to the amount of funds received when using this pathway.
            amount: new BigNumber(quote.routePlan?.[quote.routePlan.length - 1].swapInfo.outAmount).toString(),
            // swaps: provides details about the transaction routes, specifying through which tokens the funds are exchanged and by which protocols the swaps are executed.
            swaps: quote.routePlan.map((rp) => {
              return {
                amount: rp.swapInfo.outAmount,
                from: rp.swapInfo.inputMint,
                pool: rp.swapInfo.ammKey,
                protocol: rp.swapInfo.label,
                to: rp.swapInfo.outputMint,
              };
            }),
          },
        ],
      },
    };
  }

  name(): string {
    return "jupiter";
  }

  enabled(): boolean {
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
    // url.searchParams.append("onlyDirectRoutes", "false");
    url.searchParams.append("restrictIntermediateTokens", "true");
    // platformFeeBps to 20 which equates to 0.2%.
    if (params?.fee) {
      url.searchParams.append("platformFeeBps", params.fee.toString());
    }

    console.debug(`Jupiter quote: ${url.toString()}`);
    // part 1 fetch data without api key
    let resp = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!resp?.ok) {
      // part 1 fail => part 2 fetch data witch api key
      if (params?.apiKey) {
        resp = await fetch(url.toString(), {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": params.apiKey ?? config.SOLANA_JUPITER_API_KEY,
          },
        });
      }
      // handle error fetch data
      if (!resp?.ok) {
        let errorMessage = "Failed to get quote info";
        try {
          const errorData = await resp.json();
          console.log("errorData ", errorData);
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch {
          const errorText = await resp?.text();
          if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }
    }

    const data: QuoteResponse = await resp.json();
    return data;
  }

  // https://dev.jup.ag/docs/api/swap-api/swap
  private async getSwapInfo(quote: QuoteResponse, override?: Partial<OverrideParams<"solana">>, feeAccount?: string, apiKey?: string) {
    if (!override?.from) {
      throw new Error("Unknown user public key");
    }

    const body = JSON.stringify({
      quoteResponse: quote,
      userPublicKey: override.from,
      feeAccount: feeAccount,
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
    });
    // part 1 fetch data without api key
    let resp = await fetch(this.swapUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    if (!resp?.ok) {
      if (apiKey) {
        // part 1 fail => part 2 fetch data witch api key
        resp = await fetch(this.swapUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey, // enter api key here
          },
          body,
        });
      }
      // handle error fetch data
      if (!resp?.ok) {
        let errorMessage = "Failed to get swap info";
        try {
          const errorData = await resp.json();
          console.log("errorData ", errorData);
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch {
          const errorText = await resp?.text();
          if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }
    }

    const data: SwapInfoResponse = await resp.json();

    return data;
  }
}
