import { Connection, Signer } from '@solana/web3.js';
import { EstimatedData, Estimator, Swapper, TransferParams, Writer } from '../types';
export declare class Dispatcher implements Writer<"solana"> {
    private connection;
    estimate: Estimator<"solana">;
    private swapper;
    constructor(connection: Connection);
    transfer(params: TransferParams<"solana">): Promise<string>;
    swap(wallet: Signer, params: EstimatedData): Promise<string>;
    load(swapper: Swapper<"solana">): Promise<void>;
    private _estimateTransfer;
    private _estimateSwap;
}
