import { formatAbi } from "abitype";
import { ethers } from "ethers";
import {
  BlockchainProvider,
  OverrideParams,
  Reader,
  RequestParams,
  Writer,
} from "./types";

// EVM-specific provider implementation
export class EvmProvider implements BlockchainProvider {
  private provider: ethers.providers.JsonRpcProvider;

  constructor(provider: ethers.providers.JsonRpcProvider) {
    this.provider = provider;
  }

  getConnection() {
    return this.provider;
  }

  getSigner() {
    return this.provider.getSigner();
  }
}

// EVM Reader implementation
export class EvmReader implements Reader<"evm"> {
  private provider: EvmProvider;

  constructor(provider: EvmProvider) {
    this.provider = provider;
  }

  async read({
    abi,
    method,
    args = [],
    to,
  }: RequestParams<"evm">): Promise<string> {
    const formattedAbi = formatAbi(abi); // Ensure compatibility
    const compatibleAbi = new ethers.utils.Interface(formattedAbi);

    const contract = new ethers.Contract(
      to,
      compatibleAbi,
      this.provider.getConnection()
    );
    const result = await contract[method](...args);
    return result.toString(); // Return result as string (e.g., balance in wei)
  }
}

// EVM Writer implementation
export class EvmWriter implements Writer<"evm"> {
  private provider: EvmProvider;

  constructor(provider: EvmProvider) {
    this.provider = provider;
  }

  async write({
    abi,
    method,
    args = [],
    to,
  }: RequestParams<"evm">): Promise<string> {
    const formattedAbi = formatAbi(abi); // Ensure compatibility
    const compatibleAbi = new ethers.utils.Interface(formattedAbi);

    const signer = this.provider.getSigner();
    const contract = new ethers.Contract(to, compatibleAbi, signer);
    const tx = await contract[method](...args);
    await tx.wait();
    return tx.hash; // Return transaction hash
  }

  estimate = {
    write: async (
      { abi, method, args = [], to }: RequestParams<"evm">,
      override?: Partial<OverrideParams>
    ): Promise<string> => {
      const formattedAbi = formatAbi(abi); // Ensure compatibility
      const compatibleAbi = new ethers.utils.Interface(formattedAbi);

      const connection = this.provider.getConnection();
      const contract = new ethers.Contract(to, compatibleAbi, connection);

      // Pass override directly to estimateGas, not as an argument
      const gasEstimate = await contract.estimateGas[method](
        ...args,
        override || {}
      );
      return gasEstimate.toString(); // Return gas units as string
    },
  };
}
