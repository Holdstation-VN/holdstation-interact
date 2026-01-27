import { Connection } from '@solana/web3.js';
import { OverrideParams, SwapParams, Swapper } from '../../types';
import { quoteResponseSchema, swapInfoResponseSchema } from './validateResponse';
import * as Yup from "yup";
type SwapInfoResponse = Yup.InferType<typeof swapInfoResponseSchema>;
export type QuoteResponse = Yup.InferType<typeof quoteResponseSchema>;
export declare class Jupiter implements Swapper<"solana"> {
    private connection;
    private swapUrl;
    private swapUrlPro;
    private readonly logger;
    constructor(connection: Connection, options?: Partial<{
        debug: boolean;
    }>);
    estimateComputeLamports(swapInfo: SwapInfoResponse): number;
    estimate(params: SwapParams<"solana">, override?: Partial<OverrideParams<"solana">>): Promise<{
        to: string;
        gas: string;
        data: string;
        addons: {
            amountOut: string;
            amountOutUsd: string;
            minAmountOut: string;
            simulationError: {
                error: string;
                errorCode: string;
            } | null;
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
    name(): string;
    enabled(chainId: number): boolean;
    createQuoteSearchParams(url: URL, params: SwapParams<"solana">, override: Partial<OverrideParams<"solana">>): URL;
    private getQuote;
    private getSwapInfo;
}
export {};
