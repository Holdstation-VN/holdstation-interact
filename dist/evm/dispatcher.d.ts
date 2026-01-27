import { ethers } from 'ethers';
import { EstimatedData, Estimator, OverrideParams, Swapper, TransferParams, Writer } from '../types';
export declare class Dispatcher implements Writer<"evm"> {
    private provider;
    estimate: Estimator<"evm">;
    private swapper;
    constructor(provider: ethers.providers.JsonRpcProvider);
    transfer(params: TransferParams<"evm">, override?: Partial<OverrideParams<"evm">>): Promise<string>;
    swap(wallet: ethers.Wallet, params: EstimatedData): Promise<string>;
    load(swapper: Swapper<"evm">): Promise<void>;
    private _estimateTransfer;
    private _estimateSwap;
}
