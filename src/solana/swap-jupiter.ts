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
        simulationError: swapInfo?.simulationError,
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

    // https://dev.jup.ag/docs/api/swap-api/quote
    url.searchParams.append("restrictIntermediateTokens", params?.restrictIntermediateTokens ? params?.restrictIntermediateTokens.toString() : "true");
    url.searchParams.append("onlyDirectRoutes", params?.onlyDirectRoutes ? params?.onlyDirectRoutes.toString() : "false");
    url.searchParams.append("asLegacyTransaction", params?.asLegacyTransaction ? params?.asLegacyTransaction.toString() : "false");

    if (params?.prefferRouters) {
      url.searchParams.append("dexes", params?.prefferRouters.toString());
    }
    if (params?.swapMode) {
      url.searchParams.append("swapMode", params?.swapMode.toString());
    }
    if (params?.maxAccounts) {
      url.searchParams.append("maxAccounts", params?.maxAccounts.toString());
    }

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
    const bodyObject = {
      quoteResponse: quote,
      userPublicKey: override?.from,

      // Giá trị mặc định là false, nếu override có đặt true thì lấy true
      dynamicSlippage: override?.dynamicSlippage ?? false,
      dynamicComputeUnitLimit: override?.dynamicComputeUnitLimit ?? false,

      ...(!override?.computeUnitPriceMicroLamports && {
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: override?.maxLamports ?? 10_000_000,
            priorityLevel: "veryHigh",
          },
        },
      }),

      ...(override?.computeUnitPriceMicroLamports && {
        computeUnitPriceMicroLamports: override.computeUnitPriceMicroLamports,
      }),
    };

    const resp = await fetch(this.swapUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 'x-api-key': '' // enter api key here
      },
      body: JSON.stringify(bodyObject),
    });

    if (!resp.ok) {
      throw new Error("Failed to get swap info");
    }

    const data: SwapInfoResponse = await resp.json();
    console.debug("getSwapInfo ", data);
    return data;
  }
}
