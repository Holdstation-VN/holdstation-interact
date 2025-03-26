import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey, Signer, Transaction, VersionedTransaction } from "@solana/web3.js";
import { EstimatedData, Estimator, OverrideParams, SwapParams, Swapper, TransferParams, Writer } from "../types";

export class Dispatcher implements Writer<"solana"> {
  estimate: Estimator<"solana">;

  private swapper: Record<string, Swapper<"solana">> = {};

  constructor(private connection: Connection) {
    this.estimate = {
      swap: this._estimateSwap.bind(this),
      transfer: this._estimateTransfer.bind(this),
    };
  }

  async transfer(params: TransferParams<"solana">): Promise<string> {
    // TODO: nếu ko có override.gasLimit thì phải estimate gasLimit
    if (!params.signer) {
      throw new Error("Signer is required");
    }

    const tokenMint = new PublicKey(params.tokenAddress);
    const sourceATA = await getAssociatedTokenAddress(tokenMint, params.signer.publicKey);
    const destATA = await getAssociatedTokenAddress(tokenMint, new PublicKey(params.to));

    const transaction = new Transaction().add(
      createTransferInstruction(sourceATA, destATA, params.signer.publicKey, Number(params.amount), [], TOKEN_PROGRAM_ID)
    );

    const { blockhash } = await this.connection.getLatestBlockhash();

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = params.signer.publicKey;

    transaction.sign(params.signer);

    const signature = await this.connection.sendRawTransaction(transaction.serialize(), { skipPreflight: false });

    // TODO: wait for confirmation
    // await this.connection.confirmTransaction(signature);

    return signature;
  }

  async swap(wallet: Signer, params: EstimatedData): Promise<string> {
    const txBuffer = Buffer.from(params.data, "base64");
    // Chuyển Buffer thành Uint8Array để tránh lỗi kiểu
    const uint8Array = new Uint8Array(txBuffer);
    const versionedTx = VersionedTransaction.deserialize(uint8Array);

    versionedTx.sign([wallet]);

    const signature = await this.connection.sendRawTransaction(versionedTx.serialize(), {
      maxRetries: 2,
      skipPreflight: true,
    });

    /**
      const latestBlockhash = await connection.getLatestBlockhash();
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        'confirmed'
      );
     */

    return signature;
  }

  async load(swapper: Swapper<"solana">): Promise<void> {
    if (this.swapper[swapper.name()]) {
      throw new Error(`Swapper already loaded. ${swapper.name()}`);
    }

    this.swapper[swapper.name()] = swapper;
  }

  private async _estimateTransfer(params: TransferParams<"solana">, override?: Partial<OverrideParams<"solana"> & TransferParams<"solana">>): Promise<string> {
    throw new Error("Method not implemented.");
  }

  private async _estimateSwap(params: SwapParams<"solana">): Promise<EstimatedData> {
    throw new Error("No router available");
  }
}
