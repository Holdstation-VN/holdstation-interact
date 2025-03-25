import { Address as SolanaAddress } from "@project-serum/anchor";
import { Signer } from "@solana/web3.js";
import { ethers } from "ethers";

type SupportedProtocol = "evm" | "solana";

type EvmAddressLike = string;

export type Address<T extends SupportedProtocol> = T extends "evm" ? EvmAddressLike : T extends "solana" ? SolanaAddress : never;

export type TransferParams<SP extends SupportedProtocol> = {
  to: Address<SP>;
  tokenAddress: Address<SP>;
  amount: string; // hex string or number
  signer?: SP extends "evm" ? ethers.Wallet : Signer;
};

export type SwapParams<SP extends SupportedProtocol> = {
  fromToken: Address<SP>;
  toToken: Address<SP>;
  amount: string;
  slippage: string;
  prefferRouters?: string[];
};

export type OverrideParams<SP extends SupportedProtocol> = SP extends "evm"
  ? {
      from: Address<SP>;
      gasLimit: string;
      gasPrice: string;
    }
  : never;

export type EstimatedData = {
  // router name: hold.so, kyberswap, etc...
  to: string;

  // estimated gas
  gas: string;

  // swap data
  data: string;

  value?: string;
};

export interface Estimator<SP extends SupportedProtocol> {
  transfer(params: TransferParams<SP>, override?: Partial<OverrideParams<SP>>): Promise<string>;
  swap(params: SwapParams<SP>, override?: Partial<OverrideParams<SP>>): Promise<EstimatedData>;
}

export interface Writer<SP extends SupportedProtocol> {
  transfer: Estimator<SP>["transfer"];
  swap(signer: SP extends "evm" ? ethers.Wallet : Signer, params: EstimatedData): Promise<string>;
  estimate: Estimator<SP>;
}

export interface Swapper<SP extends SupportedProtocol> {
  estimate: Estimator<SP>["swap"];
  name(): string;
  enabled(chainId: number): boolean;
}
