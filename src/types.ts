import { Address as SolanaAddress } from "@project-serum/anchor";
import { Signer } from "@solana/web3.js";
import { ethers } from "ethers";
import { OxkApiConfig } from "./solana/okx/swap-okx.type";

export type SupportedProtocol = "evm" | "solana";

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

  // this field slippage is percent 0-100 %
  slippage: string;
  // this field slippage is percent 0-10% (okx is 0-3%)
  fee?: string;
  prefferRouters?: string[];
};

export interface JupiterOverrideParams {
  apiKey?: string;
  feeAccount?: string;
  maxLamports?: number;
  dynamicComputeUnitLimit?: boolean;
  dynamicSlippage?: boolean;
  computeUnitPriceMicroLamports?: number;
  asLegacyTransaction?: boolean;
  maxAccounts?: number;
  swapMode?: string;
  onlyDirectRoutes?: boolean;
  restrictIntermediateTokens?: boolean;
}

export interface OkxSolanaOverrideParams {
  okxApiConfig?: OxkApiConfig;
  isDebug?: boolean;
  fromTokenReferrerWalletAddress?: string;
  toTokenReferrerWalletAddress?: string;
  computeUnitPrice?: string;
  computeUnitLimit?: string;
  directRoute?: boolean;
  priceImpactProtectionPercentage?: string;
  autoSlippage?: string;
  maxAutoSlippage?: string;
}

export type OverrideParams<SP extends SupportedProtocol> = SP extends "evm"
  ? {
      from: Address<SP>;
      gasLimit: string;
      gasPrice: string;
      isDebug?: boolean;
    }
  : {
      from: Address<SP>;
    } & JupiterOverrideParams &
      OkxSolanaOverrideParams;

export type EstimatedData = {
  // router name: hold.so, kyberswap, etc...
  to: string;

  // estimated gas
  gas: string;

  // swap data
  data: string;

  value?: string;

  addons?: Partial<{
    amountOut: string;
    amountOutUsd: string;
    minAmountOut: string;
    protocols: ProtocolsItem[];
  }>;
};

export type SwapsItem = {
  amount: string;
  from: string;
  pool: string;
  protocol: string;
  to: string;
};

export type ProtocolsItem = {
  amount: string;
  swaps: SwapsItem[];
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
