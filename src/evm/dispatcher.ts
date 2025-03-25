import { ethers } from "ethers";
import { EstimatedData, Estimator, OverrideParams, SwapParams, Swapper, TransferParams, Writer } from "../types";

export class Dispatcher implements Writer<"evm"> {
  estimate: Estimator<"evm">;

  private swapper: Record<string, Swapper<"evm">> = {};

  constructor(private provider: ethers.providers.JsonRpcProvider) {
    this.estimate = {
      swap: this._estimateSwap.bind(this),
      transfer: this._estimateTransfer.bind(this),
    };
  }

  async transfer(params: TransferParams<"evm">, override: Partial<OverrideParams<"evm">> = {}): Promise<string> {
    // TODO: nếu ko có override.gasLimit thì phải estimate gasLimit
    if (!params.signer) {
      throw new Error("Signer is required");
    }

    if (params.tokenAddress === "0x0000000000000000000000000000000000000000" || params.tokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
      const signer = this.provider.getSigner();
      const tx = await signer.sendTransaction({
        ...override,
        to: params.to,
        value: params.amount,
      });

      return tx.hash;
    }

    // send erc20 token
    const contract = new ethers.Contract(params.tokenAddress, ["function transfer(address to, uint amount) returns (bool)"], params.signer);
    const result = await contract.transfer(params.to, params.amount, override);

    return result.hash;
  }

  async swap(wallet: ethers.Wallet, params: EstimatedData): Promise<string> {
    const nonce = await this.provider.getTransactionCount(wallet.address, "latest");

    const signedTx = wallet.signTransaction({
      to: params.to,
      data: params.data,
      gasLimit: params.gas,
      chainId: this.provider.network.chainId,
      nonce,
    });

    const txHash = await this.provider.send("eth_sendRawTransaction", [signedTx]);

    return txHash;
  }

  async load(swapper: Swapper<"evm">): Promise<void> {
    if (this.swapper[swapper.name()]) {
      throw new Error(`Swapper already loaded. ${swapper.name()}`);
    }

    this.swapper[swapper.name()] = swapper;
  }

  private async _estimateTransfer(params: TransferParams<"evm">, override?: Partial<OverrideParams<"evm"> & TransferParams<"evm">>): Promise<string> {
    // Estimate gas for native token transfer
    if (params.tokenAddress === "0x0000000000000000000000000000000000000000" || params.tokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") {
      const value = await this.provider.estimateGas({
        to: params.to,
        value: params.amount,
        from: override?.from || this.provider.getSigner().getAddress(), // Use the overrideParams from if provided, otherwise use the signer's address
      });
      return value.toString();
    }

    // Estimate gas for ERC20 token transfer
    const contract = new ethers.Contract(params.tokenAddress, ["function transfer(address to, uint amount) returns (bool)"], this.provider);

    const gasLimit = await contract.estimateGas.transfer(params.to, params.amount, {
      from: override?.from || this.provider.getSigner().getAddress(), // Use the overrideParams from if provided, otherwise use the signer's address
    });

    return gasLimit.toString();
  }

  private async _estimateSwap(params: SwapParams<"evm">, override?: Partial<OverrideParams<"evm">>) {
    // TODO: check balance and allowance
    let chainId = this.provider.network.chainId;

    if (!chainId) {
      chainId = await this.provider.getNetwork().then((network) => network.chainId);
    }

    let preferredRouters = params.prefferRouters || Object.keys(this.swapper);
    if (preferredRouters.length === 0) {
      throw new Error("No router available");
    }

    let lastError: any = undefined;

    for (const router of preferredRouters) {
      const swapper = this.swapper[router];
      if (!swapper) {
        continue;
      }

      if (!swapper.enabled(chainId)) {
        continue;
      }

      try {
        const result = await Promise.race<EstimatedData>([
          swapper.estimate(params, override),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 30_000)),
        ]);

        return result;
      } catch (e: any) {
        lastError = e;
      }
    }

    if (lastError) {
      throw lastError;
    }

    throw new Error("No router available");
  }
}
