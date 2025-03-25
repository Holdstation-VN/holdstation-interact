import { OverrideParams, SwapParams, Swapper } from "../types";

// TODO: add hold.so
export class HoldSo implements Swapper<"evm"> {
  constructor() {}

  async estimate(
    params: SwapParams<"evm">,
    override?: Partial<OverrideParams<"evm"> & SwapParams<"evm">>
  ): Promise<string> {
    return "";
  }

  async execute(
    params: SwapParams<"evm">,
    override?: Partial<OverrideParams<"evm"> & SwapParams<"evm">>
  ): Promise<string> {
    return "";
  }
}
