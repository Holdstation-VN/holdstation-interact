import { Transaction, VersionedTransaction } from '@solana/web3.js';
import { SwapResponseItem } from './validateResponse';
export type OxkApiConfig = {
    api_key: string;
    secret_key: string;
    passphrase: string;
    project: string;
};
export type OkxSolanaParams = {
    amount: string;
    slippagePercent: string;
    feePercent: string;
    chainIndex: string;
    fromTokenAddress: string;
    toTokenAddress: string;
    userWalletAddress: string;
    fromTokenReferrerWalletAddress?: string;
    toTokenReferrerWalletAddress?: string;
    computeUnitPrice?: string;
    computeUnitLimit?: string;
    directRoute?: string;
    priceImpactProtectionPercentage?: string;
    autoSlippage?: string;
    maxAutoSlippage?: string;
};
export type OkxSwapTransactionPayload = Pick<SwapResponseItem, "tx">;
export type OkxGasLimitApiResponse = {
    code: string;
    msg?: string;
    data: Array<{
        gasLimit: string;
    }>;
};
export type OkxSimulationAssetChange = {
    assetType: string;
    name: string;
    symbol: string;
    decimals: number;
    address: string;
    imageUrl: string;
    rawValue: string;
};
export type OkxSimulationApiResponse = {
    code: string;
    msg?: string;
    data: Array<OkxSimulationResult>;
};
export type OkxSimulationResult = {
    intention: string;
    success?: boolean;
    error?: string;
    gasUsed?: string;
    failReason?: string;
    assetChange?: OkxSimulationAssetChange[];
    logs?: string[];
    risks?: Array<Record<string, unknown>>;
};
export type OkxSimulateOnlyResult = {
    swapData: SwapResponseItem;
    simulationResult: OkxSimulationResult;
    gasLimit: string;
    estimatedGasUsed?: string;
};
export type OkxPreparedTransaction = {
    transaction: Transaction | VersionedTransaction;
    recentBlockhash: string;
};
export type OkxBroadcastOptions = {
    enableMevProtection?: boolean;
    jitoSignedTx?: string;
};
export type OkxBroadcastTransactionResponse = {
    code: string;
    msg?: string;
    data: Array<{
        orderId: string;
    }>;
};
export type OkxOrderStatus = {
    txStatus: string;
    txHash?: string;
    failReason?: string;
};
export type OkxPostTransactionOrdersResponse = {
    code: string;
    msg?: string;
    data: Array<{
        orders: OkxOrderStatus[];
    }>;
};
export type OkxTrackTransactionOptions = {
    intervalMs?: number;
    timeoutMs?: number;
};
export type OkxSwapExecutionOptions = {
    simulate?: boolean;
    track?: boolean;
    broadcast?: OkxBroadcastOptions;
    poll?: OkxTrackTransactionOptions;
};
export type OkxSwapExecutionResult = {
    swapData: SwapResponseItem;
    signedTx: string;
    orderId: string;
    gasLimit: string;
    simulationResult?: OkxSimulationResult;
    trackedOrder?: OkxOrderStatus;
};
