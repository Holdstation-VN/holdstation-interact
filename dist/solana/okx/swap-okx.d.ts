import { Connection, Signer } from '@solana/web3.js';
import { OverrideParams, SwapParams, Swapper } from '../../types';
import { OkxBroadcastOptions, OkxOrderStatus, OkxSimulationResult, OkxSwapTransactionPayload, OkxTrackTransactionOptions, OxkApiConfig } from './swap-okx.type';
import { SwapResponseItem } from './validateResponse';
/**
 * OKX DEX API v6 swap helper for Solana.
 *
 * Typical flow:
 * 1) getSwapData
 * 2) simulateTransaction
 * 3) getGasLimit
 * 4) updateGasLimit
 * 5) signTransaction
 * 6) broadcastTransaction
 * 7) trackTransaction
 *
 * @example
 * const okx = new Okx(connection);
 * const swapData = await okx.getSwapData(params, { from: userPubkey, okxApiConfig });
 * const gasLimit = await okx.getGasLimit(swapData, { okxApiConfig });
 * const updatedCallData = await okx.updateGasLimit(swapData.tx.data, gasLimit);
 * const signedTx = await okx.signTransaction(updatedCallData, signer);
 * const orderId = await okx.broadcastTransaction(signedTx, userPubkey.toString(), { okxApiConfig });
 * const order = await okx.trackTransaction(orderId, { from: userPubkey, okxApiConfig });
 */
export declare class Okx implements Swapper<"solana"> {
    private connection;
    private readonly swapUrl;
    private readonly swapRequestPath;
    private readonly solanaChainIndex;
    private readonly onchainGatewayBasePath;
    private readonly postTransactionBasePath;
    private readonly logger;
    constructor(connection: Connection, options?: {
        isDebug?: boolean;
    });
    /**
     * Estimate swap output and gas data using OKX swap + simulation + gas-limit APIs.
     *
     * @example
     * const estimate = await okx.estimate(params, { from: userPubkey, okxApiConfig });
     * console.log(estimate.gas, estimate.addons?.amountOut);
     */
    estimate(params: SwapParams<"solana">, override?: Partial<OverrideParams<"solana">>): Promise<{
        to: string;
        gas: string;
        data: string;
        addons: {
            amountOut: string;
            amountOutUsd: string;
            minAmountOut: string;
            simulationError: string | undefined;
            simulationGasUsed: string;
            protocols: {
                amount: string;
                swaps: {
                    amount: string;
                    from: string;
                    pool: string;
                    protocol: string;
                    to: string;
                }[];
            }[];
        };
    }>;
    /**
     * Fetch a single OKX swap payload for Solana.
     *
     * @example
     * const swapData = await okx.getSwapData(params, { from: userPubkey, okxApiConfig });
     */
    getSwapData(params: SwapParams<"solana">, override?: Partial<OverrideParams<"solana">>): Promise<SwapResponseItem>;
    /**
     * Update gas limit in OKX swap transaction data and return base58-encoded bytes.
     *
     * @example
     * const updatedCallData = await okx.updateGasLimit(swapData.tx.data, gasLimit);
     */
    updateGasLimit(callData: string, gasLimit: string): Promise<string>;
    private updateVersionedTransactionGasLimit;
    private updateLegacyTransactionGasLimit;
    private encodeUpdatedGasLimitTransaction;
    /**
     * * This function is not currently in use; it's prepared for future use.
     * Sign OKX swap transaction data with a local signer and return base58-encoded bytes.
     *
     * @example
     * const updatedCallData = await okx.updateGasLimit(swapData.tx.data, gasLimit);
     * const signedTx = await okx.signTransaction(updatedCallData, signer);
     * const orderId = await okx.broadcastTransaction(signedTx, signer.publicKey.toBase58(), { okxApiConfig });
     * this logic is in https://web3.okx.com/build/dev-docs/wallet-api/dex-use-swap-solana-quick-start#7.-complete-implementation
     */
    signTransaction(callData: string, signer: Signer): Promise<string>;
    /**
     * * This function is not currently in use; it's prepared for future use.
     * Broadcast a signed transaction via OKX Onchain Gateway API.
     *
     * @example
     * const orderId = await okx.broadcastTransactionViaOkx(signedTx, walletAddress, { okxApiConfig });
     */
    broadcastTransactionViaOkx(signedTx: string, walletAddress: string, override?: Partial<OverrideParams<"solana">>, options?: OkxBroadcastOptions): Promise<string>;
    /**
     * * This function is not currently in use; it's prepared for future use.
     * Broadcast a signed transaction directly to Solana RPC.
     *
     * @example
     * const signature = await okx.broadcastTransactionViaRpc(signedTx);
     */
    broadcastTransactionViaRpc(signedTx: string, options?: {
        skipPreflight?: boolean;
        preflightCommitment?: "processed" | "confirmed" | "finalized";
        confirmCommitment?: "processed" | "confirmed" | "finalized";
    }): Promise<string>;
    /**
     * * This function is not currently in use; it's prepared for future use.
     * Poll order status via OKX Onchain Gateway API until success, failure, or timeout.
     *
     * @example
     * const order = await okx.trackTransaction(orderId, { from: userPubkey, okxApiConfig }, { intervalMs: 5000 });
     * console.log(order.txStatus, order.txHash);
     */
    trackTransaction(orderId: string, override?: Partial<OverrideParams<"solana">>, options?: OkxTrackTransactionOptions): Promise<OkxOrderStatus>;
    name(): string;
    enabled(chainId: number): boolean;
    private deserializeOkxTransaction;
    /**
     * Buffer gasLimit after estimate
     *
     * References
     * https://github.com/solana-developers/helpers?tab=readme-ov-file#addcomputeinstructions => multiplier 1.1
     * https://www.quicknode.com/guides/solana-development/transactions/how-to-optimize-solana-transactions?#compute-unit-optimization => max 1.4m
     * https://chainstack.com/solana-transaction-serialization-signatures-fees-and-runtime-execution/amp
     */
    private bufferGasLimit;
    private buildQueryString;
    private callOkxApi;
    private buildProtocolSwaps;
    private requireOkxApiConfig;
    private requireFromAddress;
    private buildBroadcastExtraData;
    private sleep;
    getHeaders(timestamp: string, method: string, requestPath: string, queryString: string | undefined, okxApiConfig: OxkApiConfig, body?: string): {
        "Content-Type": string;
        "OK-ACCESS-KEY": string;
        "OK-ACCESS-SIGN": string;
        "OK-ACCESS-TIMESTAMP": string;
        "OK-ACCESS-PASSPHRASE": string;
        "OK-ACCESS-PROJECT": string;
    };
    /**
     * Fetch compute unit estimate from OKX Onchain Gateway API.
     *
     * @example
     * const gasLimit = await okx.getGasLimit(swapData, { okxApiConfig });
     */
    getGasLimit(swapData: OkxSwapTransactionPayload, override?: Partial<OverrideParams<"solana">>): Promise<string>;
    /**
     * Simulate a swap transaction using OKX Onchain Gateway API.
     *
     * @example
     * const sim = await okx.simulateTransaction(swapData, { okxApiConfig }, { includeDebug: true });
     */
    simulateTransaction(swapData: OkxSwapTransactionPayload, override?: Partial<OverrideParams<"solana">>, options?: {
        includeDebug?: boolean;
    }): Promise<OkxSimulationResult>;
    private getSwapInfo;
}
