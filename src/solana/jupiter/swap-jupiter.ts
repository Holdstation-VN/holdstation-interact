import { Connection, VersionedTransaction } from "@solana/web3.js";
import { BigNumber } from "bignumber.js";
import { OverrideParams, SwapParams, Swapper } from "../../types";
import { quoteResponseSchema, swapInfoResponseSchema } from "./validateResponse";
import * as Yup from "yup";
import { config } from "../../config";
import { BodyObject } from "./swap-jupiter.type";

type SwapInfoResponse = Yup.InferType<typeof swapInfoResponseSchema>;
export type QuoteResponse = Yup.InferType<typeof quoteResponseSchema>;

export class Jupiter implements Swapper<"solana"> {
  private swapUrl = "https://lite-api.jup.ag";
  private swapUrlPro = "https://quote-api.jup.ag";

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
    if (!override?.from) {
      throw new Error("Unknown user public key");
    }

    const quote = await this.getQuote(params, override);
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
      to: this.name(),
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  enabled(chainId: number): boolean {
    // alway on for solana
    return true;
  }

  createQuoteSearchParams(url: URL, params: SwapParams<"solana">, override: Partial<OverrideParams<"solana">>) {
    url.searchParams.append("inputMint", params.fromToken.toString());
    url.searchParams.append("outputMint", params.toToken.toString());
    url.searchParams.append("amount", params.amount.toString());

    // https://dev.jup.ag/docs/swap-api/add-fees-to-swap#2-set-your-fee-in-quote
    url.searchParams.append("platformFeeBps", (Number(params?.fee ?? 0.02) * 100).toString());

    // The number of basis points you can tolerate to lose during time of execution. e.g. 1% = 100bps
    url.searchParams.append("slippageBps", (Number(params.slippage) * 100).toString());

    // https://dev.jup.ag/docs/api/swap-api/quote
    url.searchParams.append("restrictIntermediateTokens", override?.restrictIntermediateTokens?.toString() ?? "true");
    url.searchParams.append("onlyDirectRoutes", override?.onlyDirectRoutes?.toString() ?? "false");
    url.searchParams.append("asLegacyTransaction", override?.asLegacyTransaction?.toString() ?? "false");
    if (override?.swapMode) {
      url.searchParams.append("swapMode", override?.swapMode.toString());
    }
    if (override?.maxAccounts) {
      url.searchParams.append("maxAccounts", override?.maxAccounts.toString());
    }

    return url;
  }

  // https://dev.jup.ag/docs/api/swap-api/quote
  private async getQuote(params: SwapParams<"solana">, override: Partial<OverrideParams<"solana">>) {
    const url = new URL(`${this.swapUrl}/swap/v1/quote`);
    this.createQuoteSearchParams(url, params, override);
    console.debug(`Jupiter quote: ${url.toString()}`);
    // part 1 fetch data without api key
    let resp = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
      },
    });

    // 2) Nếu fail và có apiKey, thử fetch lần hai với apiKey
    if (!resp.ok && override.apiKey) {
      const swapUrlPro = new URL(`${this.swapUrlPro}/v6/quote`);
      this.createQuoteSearchParams(swapUrlPro, params, override);
      console.debug(`Jupiter quote: ${swapUrlPro.toString()}`);

      resp = await fetch(swapUrlPro.toString(), {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": override.apiKey ?? config.SOLANA_JUPITER_API_KEY,
        },
      });
    }

    // handle error fetch data
    if (!resp.ok) {
      const errorData = await resp.json();
      console.debug("errorData getQuote", errorData);
      const errorMessage = errorData.error || JSON.stringify(errorData);
      throw new Error(errorMessage);
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
    const bodyObject: BodyObject = {
      quoteResponse: quote,
      userPublicKey: override?.from.toString(),
      dynamicSlippage: override?.dynamicSlippage ?? false,
      dynamicComputeUnitLimit: override?.dynamicComputeUnitLimit ?? false,
    };

    if (override?.feeAccount) {
      bodyObject.feeAccount = override.feeAccount;
    }

    if (!override?.computeUnitPriceMicroLamports) {
      bodyObject.prioritizationFeeLamports = {
        priorityLevelWithMaxLamports: {
          maxLamports: override?.maxLamports ?? 15_000_000,
          priorityLevel: "veryHigh",
        },
      };
    }

    if (override?.computeUnitPriceMicroLamports) {
      bodyObject.computeUnitPriceMicroLamports = override.computeUnitPriceMicroLamports;
    }
    console.log("bodyObject ", bodyObject);
    // part 1 fetch data without api key
    let resp = await fetch(`${this.swapUrl}/swap/v1/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 'x-api-key': '' // enter api key here
      },
      body: JSON.stringify(bodyObject),
    });

    if (!resp.ok && override?.apiKey) {
      // part 1 fail => part 2 fetch data witch api key
      resp = await fetch(`${this.swapUrlPro}/v6/swap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": override.apiKey, // enter api key here
        },
        body: JSON.stringify(bodyObject),
      });
    }

    // handle error fetch data
    if (!resp.ok) {
      const errorData = await resp.json();
      console.debug("errorData getQuote", errorData);
      const errorMessage = errorData.error || JSON.stringify(errorData);
      throw new Error(errorMessage);
    }

    const data = await resp.json();
    const validatedData = await swapInfoResponseSchema.validate(data, {
      abortEarly: false,
    });
    console.debug("getSwapInfo ", validatedData);
    return validatedData;
  }
}
