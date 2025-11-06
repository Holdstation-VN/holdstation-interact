import { Connection } from "@solana/web3.js";
import { BigNumber } from "bignumber.js";
import { OverrideParams, SwapParams, Swapper } from "../../types";

import cryptoJS from "crypto-js";
import { OkxSolanaParams, OxkApiConfig } from "./swap-okx.type";
import { swapResponseSchema } from "./validateResponse";

export class Okx implements Swapper<"solana"> {
  private readonly swapUrl = "https://web3.okx.com";
  private readonly swapRequestPath = "/api/v6/dex/aggregator/swap";

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

    const toTokenAmount = this.toStringValue(swapData?.routerResult.toTokenAmount || "0");
    const toTokenDecimal = Number(this.toStringValue(swapData?.routerResult?.toToken.decimal || "0"));
    const toTokenPrice = Number(this.toStringValue(swapData?.routerResult?.toToken?.tokenUnitPrice || "0"));
    const amountOutUsd = new BigNumber(toTokenAmount).dividedBy(Math.pow(10, toTokenDecimal || 9)).toNumber() * toTokenPrice;

    return {
      to: this.name(),
      gas: this.toStringValue(swapData.routerResult.estimateGasFee),
      data: swapInfo.data[0].tx.data,

      addons: {
        amountOut: this.toStringValue(swapData.routerResult.toTokenAmount),
        amountOutUsd: amountOutUsd.toString(),
        minAmountOut: this.toStringValue(swapData.tx.minReceiveAmount),
        simulationError: swapInfo?.msg,
        // protocols is a list of pathways that funds take when swapping between two tokens.
        protocols: [
          {
            amount: "",
            swaps: this.buildProtocolSwaps(swapData.routerResult.dexRouterList),
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

  private buildProtocolSwaps(dexRouterList: unknown) {
    if (!Array.isArray(dexRouterList)) {
      return [];
    }

    const routerEntries = dexRouterList as Array<Record<string, unknown>>;
    const firstItem = routerEntries[0] as Record<string, unknown> | undefined;
    const subRouters = firstItem?.subRouterList as Array<Record<string, unknown>> | undefined;

    if (Array.isArray(subRouters) && subRouters.length > 0) {
      return subRouters.map((item) => {
        const leg = item as Record<string, unknown>;
        const dexProtocolRaw = Array.isArray(leg.dexProtocol) ? leg.dexProtocol[0] : leg.dexProtocol;
        const dexProtocol = dexProtocolRaw as Record<string, unknown> | undefined;
        const fromToken = leg.fromToken as { tokenContractAddress?: string };
        const toToken = leg.toToken as { tokenContractAddress?: string };
        const poolName = typeof dexProtocol?.dexName === "string" ? (dexProtocol.dexName as string) : "";
        return {
          amount: "",
          from: fromToken?.tokenContractAddress ?? "",
          pool: poolName,
          protocol: poolName,
          to: toToken?.tokenContractAddress ?? "",
        };
      });
    }

    return routerEntries.map((entry) => {
      const leg = entry as Record<string, unknown>;
      const dexProtocolRaw = Array.isArray(leg.dexProtocol) ? leg.dexProtocol[0] : leg.dexProtocol;
      const dexProtocol = dexProtocolRaw as Record<string, unknown> | undefined;
      const fromToken = leg.fromToken as { tokenContractAddress?: string };
      const toToken = leg.toToken as { tokenContractAddress?: string };
      const poolName = typeof dexProtocol?.dexName === "string" ? (dexProtocol.dexName as string) : "";
      return {
        amount: "",
        from: fromToken?.tokenContractAddress ?? "",
        pool: poolName,
        protocol: poolName,
        to: toToken?.tokenContractAddress ?? "",
      };
    });
  }

  private toStringValue(value: unknown): string {
    if (value === undefined || value === null) {
      return "";
    }

    return String(value);
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
      slippagePercent: params.slippage,
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
    const requestPath = this.swapRequestPath;
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

    if (String(validatedData?.code) !== "0") {
      console.debug("validatedData ", validatedData?.msg);
      throw new Error(validatedData?.msg ?? "Error when get swap data");
    }

    return validatedData;
  }
}
