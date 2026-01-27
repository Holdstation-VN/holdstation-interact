import { EstimatedData, SwapParams, Swapper } from '../types';
export declare class Okx implements Swapper<"evm"> {
    constructor();
    estimate(params: SwapParams<"evm">, override?: Partial<{
        from: string;
        gasLimit: string;
        gasPrice: string;
    }>): Promise<EstimatedData>;
    name(): string;
    enabled(chainId: number): boolean;
}
