import { Connection } from "@solana/web3.js";
import { BigNumber } from "bignumber.js";
import { OverrideParams, SwapParams, Swapper } from "../../types";

import cryptoJS from "crypto-js";
import { OkxSolanaParams, OxkApiConfig } from "./swap-okx.type";
import { swapResponseSchema } from "./validateResponse";

export class Okx implements Swapper<"solana"> {
  private swapUrl = "https://web3.okx.com";

  constructor(private connection: Connection) {}

  async estimate(params: SwapParams<"solana">, override?: Partial<OverrideParams<"solana">>) {
    if (!override?.from) {
      throw new Error("Unknown user public key");
    }

    const swapInfo = await this.getSwapInfo(params, override);

    if (!swapInfo?.data?.[0]) {
      throw new Error("Okx have swap data");
    }

    const swapData = swapInfo.data[0];
    console.debug("swapInfo ", swapData);

    const amountOutUsd =
      new BigNumber(swapData?.routerResult.toTokenAmount).dividedBy(Math.pow(10, Number(swapData?.routerResult?.toToken.decimal) || 9)).toNumber() *
      (Number(swapData?.routerResult?.toToken?.tokenUnitPrice) || 0);

    return {
      to: this.name(),
      gas: swapData.routerResult.estimateGasFee,
      data: swapInfo.data[0].tx.data,

      addons: {
        amountOut: swapData.routerResult.toTokenAmount,
        amountOutUsd: amountOutUsd.toString(),
        minAmountOut: swapData.tx.minReceiveAmount,
        simulationError: swapInfo?.msg,
        // protocols is a list of pathways that funds take when swapping between two tokens.
        protocols: [
          {
            // amount: refers to the amount of funds received when using this pathway.
            amount: "",
            // swaps: provides details about the transaction routes, specifying through which tokens the funds are exchanged and by which protocols the swaps are executed.
            swaps: swapData.routerResult.dexRouterList[0].subRouterList.map((item) => {
              return {
                amount: "",
                from: item.fromToken.tokenContractAddress,
                pool: item.dexProtocol[0].dexName,
                protocol: item.dexProtocol[0].dexName,
                to: item.toToken.tokenContractAddress,
              };
            }),
          },
        ],
      },
    };
  }

  name(): string {
    return "okx";
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  enabled(chainId: number): boolean {
    // alway on for solana
    return true;
  }

  getHeaders(timestamp: string, method: string, requestPath: string, queryString = "", okxApiConfig: OxkApiConfig, body = "") {
    const stringToSign = timestamp + method + requestPath + (queryString || body);
    return {
      "Content-Type": "application/json",
      "OK-ACCESS-KEY": okxApiConfig.api_key,
      "OK-ACCESS-SIGN": cryptoJS.enc.Base64.stringify(cryptoJS.HmacSHA256(stringToSign, okxApiConfig.secret_key)),
      "OK-ACCESS-TIMESTAMP": timestamp,
      "OK-ACCESS-PASSPHRASE": okxApiConfig.passphrase,
      "OK-ACCESS-PROJECT": okxApiConfig.project,
    };
  }

  private async getSwapInfo(params: SwapParams<"solana">, override: Partial<OverrideParams<"solana">>) {
    if (!override?.okxApiConfig) {
      throw new Error("Okx swap need api config");
    }

    const paramsSwap: OkxSolanaParams = {
      amount: params.amount.toString(),
      // this chainIndex is defined in okx api
      // https://web3.okx.com/build/dev-docs/dex-api/dex-supported-chain#other-chains
      chainIndex: "501",
      fromTokenAddress: params.fromToken.toString(),
      toTokenAddress: params.toToken.toString(),
      userWalletAddress: override.from?.toString() ?? "",
      slippage: params.slippage,
      feePercent: params?.fee?.toString() ?? "0.2",
    };

    if (override?.fromTokenReferrerWalletAddress) {
      paramsSwap.fromTokenReferrerWalletAddress = override?.fromTokenReferrerWalletAddress;
    }

    if (override?.toTokenReferrerWalletAddress) {
      paramsSwap.toTokenReferrerWalletAddress = override?.toTokenReferrerWalletAddress;
    }

    if (override?.computeUnitPrice) {
      paramsSwap.computeUnitPrice = override.computeUnitPrice;
    }

    if (override?.computeUnitLimit) {
      paramsSwap.computeUnitLimit = override.computeUnitLimit;
    }

    if (override?.directRoute) {
      paramsSwap.directRoute = override.directRoute.toString();
    }

    if (override?.priceImpactProtectionPercentage) {
      paramsSwap.priceImpactProtectionPercentage = override.priceImpactProtectionPercentage;
    }

    if (override?.autoSlippage) {
      paramsSwap.autoSlippage = override.autoSlippage;
    }

    if (override?.maxAutoSlippage) {
      paramsSwap.maxAutoSlippage = override.maxAutoSlippage;
    }

    const apiConfig = override.okxApiConfig;
    const timestamp = new Date().toISOString();
    const requestPath = "/api/v5/dex/aggregator/swap";
    const queryString = "?" + new URLSearchParams(paramsSwap).toString();
    const headers = this.getHeaders(timestamp, "GET", requestPath, queryString, apiConfig);

    const resp = await fetch(`${this.swapUrl}${requestPath}${queryString}`, {
      headers: headers,
    });

    // handle error fetch data
    if (!resp.ok) {
      const errorData = await resp.json();
      console.debug("errorData Okx swap data", errorData);
      const errorMessage = errorData.error || JSON.stringify(errorData);
      throw new Error(errorMessage);
    }

    const data = await resp.json();

    const validatedData = await swapResponseSchema.validate(data, {
      abortEarly: false,
    });

    if (validatedData?.code !== "0") {
      console.debug("validatedData ", validatedData?.msg);
      throw new Error(validatedData?.msg ?? "Error when get swap data");
    }

    return validatedData;
  }
}
