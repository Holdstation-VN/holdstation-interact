import { EstimatedData, SwapParams, Swapper } from "../types";

// TODO: add hold.so
export class KyberSwap implements Swapper<"evm"> {
  constructor() {}

  async estimate(params: SwapParams<"evm">, override?: Partial<{ from: string; gasLimit: string; gasPrice: string }>): Promise<EstimatedData> {
    throw new Error("Method not implemented.");
  }

  name(): string {
    return "kyberswap";
  }

  enabled(chainId: number): boolean {
    // Temporarily disable OKX
    return false;
  }
}
