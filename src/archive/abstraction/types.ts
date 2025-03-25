import type { Abi } from "abitype";

export interface BlockchainProvider {
  getConnection(): any; // Connection type varies by chain
  getSigner(): any; // Signer type varies by chain
}

type SupportedProtocol = "evm" | "solana";

type EvmAbiType = Abi;
type SolanaAbiType = any;

type AbiForProtocol<T extends SupportedProtocol> = T extends "evm"
  ? EvmAbiType
  : T extends "solana"
  ? SolanaAbiType
  : never;

export interface RequestParams<
  T extends SupportedProtocol,
  abi extends AbiForProtocol<T> = AbiForProtocol<T>
> {
  abi: abi;
  method: string;
  args?: any[];
  to: string;
}

export interface OverrideParams {
  from: string;
}

export interface Reader<T extends SupportedProtocol> {
  read(params: RequestParams<T>): Promise<string>;
}

// Writer interface
export interface Writer<T extends SupportedProtocol> {
  write(params: RequestParams<T>): Promise<string>;

  estimate: {
    write: (
      params: RequestParams<T>,
      override?: Partial<OverrideParams>
    ) => Promise<string>;
  };
}
