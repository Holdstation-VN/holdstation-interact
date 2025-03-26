import { ethers } from "ethers";
import { SwapParams, Swapper } from "../types";
import { HOLDSO_ROUTER_ADDRESSES, HOLDSO_URL, HoldSoSwapRequestParams, HoldSoSwapResponse } from "./swap-hold.so.types";
import { isNativeToken } from "./util";

// TODO: add hold.so
export class HoldSo implements Swapper<"evm"> {
  constructor(private provider: ethers.providers.JsonRpcProvider) {}

  async estimate(params: SwapParams<"evm">, override?: Partial<{ from: string; gasLimit: string; gasPrice: string }>) {
    // Implement the logic to estimate the gas and other parameters for the swap
    const paramsSwap: HoldSoSwapRequestParams = {
      src: params.fromToken,
      dst: params.toToken,
      amount: params.amount,
      receiver: override?.from ?? ethers.constants.AddressZero,
      slippage: Number(params.slippage) / 100,
    };

    const resp = await this.fetchSwapParams(paramsSwap);
    const chainId = this.provider.network.chainId;
    const value = isNativeToken(params.fromToken) ? params.amount : "0";

    let gasLimit = override?.gasLimit;

    if (!gasLimit) {
      gasLimit = await this.provider
        .estimateGas({
          from: override?.from ?? ethers.constants.AddressZero,
          to: HOLDSO_ROUTER_ADDRESSES[chainId],
          data: resp.tx.data,
          value,
        })
        .then((gas) => gas.toString());
    }

    return {
      to: HOLDSO_ROUTER_ADDRESSES[chainId],
      gas: gasLimit ?? "0",
      data: resp.tx.data,
      addons: {
        amountOut: resp.quote.amount,
        amountOutUsd: resp.quote.amountUsd,
        minAmountOut: resp.quote.minReceive,
        protocols: resp.quote.protocols.map((p) => ({
          amount: p.amount,
          swaps: p.swaps.map((s) => ({
            amount: s.amount,
            from: s.from,
            pool: s.pool,
            protocol: s.protocol,
            to: s.to,
          })),
        })),
      },
    };
  }

  name(): string {
    return "hold.so";
  }

  enabled(chainId: number): boolean {
    // only zksync or bera

    return chainId === 324 || chainId === 80094;
  }

  private async fetchSwapParams(params: HoldSoSwapRequestParams) {
    const chainId = this.provider.network.chainId;

    const baseUrl = HOLDSO_URL[chainId] + "/swap";
    const url = new URL(baseUrl);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value.toString());
    }

    const response = await fetch(url.toString(), { method: "GET" });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result: HoldSoSwapResponse = await response.json();

    return result;
  }
}
