import { Address as SolanaAddress } from "@project-serum/anchor";

type SupportedProtocol = "evm" | "solana";

type EvmAddressLike = string;

export type Address<T extends SupportedProtocol> = T extends "evm"
  ? EvmAddressLike
  : T extends "solana"
  ? SolanaAddress
  : never;

export type TransferParams<SP extends SupportedProtocol> = {
  to: Address<SP>;
  tokenAddress: Address<SP>;
  amount: string; // hex string or number
};

export type SwapParams<SP extends SupportedProtocol> = {
  fromToken: Address<SP>;
  toToken: Address<SP>;
  amount: string;
  slippage: string;
  chainId: number;
  prefferRouters?: string[];
};

export type OverrideParams<SP extends SupportedProtocol> = {
  from: Address<SP>;
  gasLimit: string;
  gasPrice: string;
};

interface Estimator<SP extends SupportedProtocol> {
  transfer(params: TransferParams<SP>, override?: Partial<OverrideParams<SP> & TransferParams<SP>>): Promise<string>;
  swap(params: SwapParams<SP>, override?: Partial<OverrideParams<SP> & SwapParams<SP>>): Promise<string>;
}

export interface Writer<SP extends SupportedProtocol> {
  transfer: Estimator<SP>["transfer"];
  swap: Estimator<SP>["swap"];
  estimate: Estimator<SP>;
}

export interface Swapper<SP extends SupportedProtocol> {
  estimate: Estimator<SP>["swap"];
  execute: Estimator<SP>["swap"];
}
