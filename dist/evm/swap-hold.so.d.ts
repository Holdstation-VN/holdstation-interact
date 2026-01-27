import { ethers } from 'ethers';
import { SwapParams, Swapper } from '../types';
export declare class HoldSo implements Swapper<"evm"> {
    private provider;
    constructor(provider: ethers.providers.JsonRpcProvider);
    estimate(params: SwapParams<"evm">, override?: Partial<{
        from: string;
        gasLimit: string;
        gasPrice: string;
    }>): Promise<{
        to: string;
        gas: string;
        data: string;
        addons: {
            amountOut: string;
            amountOutUsd: string;
            minAmountOut: string;
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
    private fetchSwapParams;
}
