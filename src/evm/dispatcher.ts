import { ethers } from "ethers";
import { OverrideParams, SwapParams, TransferParams, Writer } from "../types";

export class Dispatcher implements Writer<"evm"> {
  constructor(private provider: ethers.providers.JsonRpcProvider) {
    this.estimate = {
      swap: this._estimateSwap.bind(this),
      transfer: this._estimateTransfer.bind(this),
    };
  }

  async transfer(
    params: TransferParams<"evm">,
    override: Partial<OverrideParams<"evm"> & TransferParams<"evm">> = {}
  ): Promise<string> {
    // TODO: nếu ko có override.gasLimit thì phải estimate gasLimit

    if (
      params.tokenAddress === "0x0000000000000000000000000000000000000000" ||
      params.tokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
    ) {
      const signer = this.provider.getSigner();
      const tx = await signer.sendTransaction({
        ...override,
        to: params.to,
        value: params.amount,
      });

      return tx.hash;
    }

    // send erc20 token
    const contract = new ethers.Contract(
      params.tokenAddress,
      ["function transfer(address to, uint amount) returns (bool)"],
      this.provider
    );

    const result = await contract.transfer(params.to, params.amount, override);
    return result.hash;
  }

  async swap(
    params: SwapParams<"evm">,
    override?: Partial<OverrideParams<"evm"> & SwapParams<"evm">>
  ): Promise<string> {
    return "";
  }

  private async _estimateTransfer(
    params: TransferParams<"evm">,
    override?: Partial<OverrideParams<"evm"> & TransferParams<"evm">>
  ): Promise<string> {
    // Estimate gas for native token transfer
    if (
      params.tokenAddress === "0x0000000000000000000000000000000000000000" ||
      params.tokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
    ) {
      const value = await this.provider.estimateGas({
        to: params.to,
        value: params.amount,
        from: override?.from || this.provider.getSigner().getAddress(), // Use the overrideParams from if provided, otherwise use the signer's address
      });
      return value.toString();
    }

    // Estimate gas for ERC20 token transfer
    const contract = new ethers.Contract(
      params.tokenAddress,
      ["function transfer(address to, uint amount) returns (bool)"],
      this.provider
    );

    const gasLimit = await contract.estimateGas.transfer(params.to, params.amount, {
      from: override?.from || this.provider.getSigner().getAddress(), // Use the overrideParams from if provided, otherwise use the signer's address
    });

    return gasLimit.toString();
  }

  private async _estimateSwap(
    params: SwapParams<"evm">,
    override?: Partial<OverrideParams<"evm"> & SwapParams<"evm">>
  ): Promise<string> {
    return "0";
  }

  estimate: {
    swap: (params: SwapParams<"evm">, override?: Partial<OverrideParams<"evm"> & SwapParams<"evm">>) => Promise<string>;
    transfer: (
      params: TransferParams<"evm">,
      override?: Partial<OverrideParams<"evm"> & TransferParams<"evm">>
    ) => Promise<string>;
  };
}
