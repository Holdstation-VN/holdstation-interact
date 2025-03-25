import { ethers } from "ethers";
import { SwapParams, Swapper } from "../types";

// TODO: add hold.so
export class HoldSo implements Swapper<"evm"> {
  constructor(private provider: ethers.providers.JsonRpcProvider) {}

  async estimate(params: SwapParams<"evm">, override?: Partial<{ from: string; gasLimit: string; gasPrice: string }>) {
    // Implement the logic to estimate the gas and other parameters for the swap
    return {
      to: "0xRouterAddress",
      gas: "21000",
      data: "0xData",
    };
  }

  name(): string {
    return "hold.so";
  }

  enabled(chainId: number): boolean {
    // only zksync or bera

    return chainId === 324 || chainId === 80094;
  }
}
