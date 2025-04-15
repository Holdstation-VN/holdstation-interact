import { Connection, VersionedTransaction } from "@solana/web3.js";
import { BigNumber } from "bignumber.js";
import { OverrideParams, SwapParams, Swapper } from "../types";
import { quoteResponseSchema, swapInfoResponseSchema } from "./validateResponse";
import * as Yup from "yup";

type SwapInfoResponse = Yup.InferType<typeof swapInfoResponseSchema>;
type QuoteResponse = Yup.InferType<typeof quoteResponseSchema>;

export class Jupiter implements Swapper<"solana"> {
  private swapUrl = "https://lite-api.jup.ag/swap/v1/swap";

  constructor(private connection: Connection) {}

  estimateComputeLamports(swapInfo: SwapInfoResponse): number {
    const { computeUnitLimit, prioritizationType } = swapInfo;
    const { microLamports } = prioritizationType.computeBudget;

    // Tính từ công thức:
    // computeUnitLimit × (microLamports / 1,000,000)
    // (vì 1 lamport = 1,000,000 microLamports)
    const lamports = Math.round(computeUnitLimit * (microLamports / 1_000_000));

    return lamports;
  }

  async estimate(params: SwapParams<"solana">, override?: Partial<OverrideParams<"solana">>) {
    const quote = await this.getQuote(params);
    const swapInfo = await this.getSwapInfo(quote, override);

    if (swapInfo?.simulationError) {
      throw new Error(swapInfo?.simulationError.error);
    }
    const estimateLamports = this.estimateComputeLamports(swapInfo);

    const buffer = Buffer.from(swapInfo.swapTransaction, "base64");
    const versionedTx = VersionedTransaction.deserialize(Uint8Array.from(buffer));
    const feeResult = await this.connection.getFeeForMessage(versionedTx.message, "confirmed");

    let totalEstimateFee = feeResult?.value ?? 5000;
    if (estimateLamports > 0) {
      totalEstimateFee += estimateLamports;
    }

    console.debug("result ", {
      to: "",
      gas: totalEstimateFee.toString(),
      data: swapInfo.swapTransaction,
    });

    return {
      to: "",
      gas: totalEstimateFee.toString(),
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

    const data = await resp.json();
    const validatedData = await quoteResponseSchema.validate(data, {
      abortEarly: false,
    });

    return validatedData;
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
            maxLamports: override?.maxLamports ?? 15_000_000,
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

    const data = await resp.json();
    const validatedData = await swapInfoResponseSchema.validate(data, {
      abortEarly: false,
    });
    console.debug("getSwapInfo ", validatedData);
    return validatedData;
  }
}
