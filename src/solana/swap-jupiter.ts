import { Connection } from "@solana/web3.js";
import { EstimatedData, SwapParams, Swapper } from "../types";

// TODO: add hold.so
export class Jupiter implements Swapper<"solana"> {
  constructor(private connection: Connection) {}

  async estimate(params: SwapParams<"solana">, override?: Partial<EstimatedData>) {
    // Implement the logic to estimate the gas and other parameters for the swap
    return {
      to: "0xRouterAddress",
      gas: "21000",
      data: "0xData",
    };
  }

  name(): string {
    return "jupiter";
  }

  enabled(chainId: number): boolean {
    // alway on for solana
    return true;
  }
}
