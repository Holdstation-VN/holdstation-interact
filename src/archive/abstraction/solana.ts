import {
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  BlockchainProvider,
  OverrideParams,
  Reader,
  RequestParams,
  Writer,
} from "./types";

// Solana-specific wallet interface
interface SolanaWallet {
  publicKey: PublicKey;
  signTransaction(tx: Transaction): Promise<Transaction>;
}

// Solana-specific provider implementation
class SolanaProvider implements BlockchainProvider {
  private connection: Connection;
  private wallet: SolanaWallet;

  constructor(connection: Connection, wallet: SolanaWallet) {
    this.connection = connection;
    this.wallet = wallet;
  }

  getConnection() {
    return this.connection;
  }

  getSigner() {
    return this.wallet;
  }
}

// Solana Reader implementation
export class SolanaReader implements Reader<"solana"> {
  private provider: SolanaProvider;

  constructor(provider: SolanaProvider) {
    this.provider = provider;
  }

  async read({
    abi,
    method: functionName,
    args = [],
    to,
  }: RequestParams<"solana">): Promise<string> {
    const connection = this.provider.getConnection();
    const wallet = this.provider.getSigner();

    // Interpret 'to' as the token mint address
    const tokenMint = new PublicKey(to);

    if (functionName === "balanceOf") {
      const accountAddress = args[0]
        ? new PublicKey(args[0])
        : wallet.publicKey;
      const associatedTokenAddress = await getAssociatedTokenAddress(
        tokenMint,
        accountAddress
      );
      const account = await getAccount(connection, associatedTokenAddress);
      return account.amount.toString(); // Return balance as string (raw token units)
    }

    throw new Error(`Unsupported functionName: ${functionName} for Solana`);
  }
}

// Solana Writer implementation
export class SolanaWriter implements Writer<"solana"> {
  private provider: SolanaProvider;

  constructor(provider: SolanaProvider) {
    this.provider = provider;
  }

  async write({
    abi,
    method: functionName,
    args = [],
    to,
  }: RequestParams<"solana">): Promise<string> {
    const connection = this.provider.getConnection();
    const wallet = this.provider.getSigner();
    const tokenMint = new PublicKey(to);

    if (functionName === "transfer") {
      const [destinationAddress, amount] = args as [
        string,
        string | number | bigint
      ];
      if (!destinationAddress || amount === undefined) {
        throw new Error(
          "transfer requires destinationAddress and amount as args"
        );
      }

      const sourceATA = await getAssociatedTokenAddress(
        tokenMint,
        wallet.publicKey
      );
      const destATA = await getAssociatedTokenAddress(
        tokenMint,
        new PublicKey(destinationAddress)
      );

      const transaction = new Transaction().add(
        createTransferInstruction(
          sourceATA,
          destATA,
          wallet.publicKey,
          Number(amount),
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      const signedTx = await wallet.signTransaction(transaction);
      const txSignature = await connection.sendRawTransaction(
        signedTx.serialize()
      );
      await connection.confirmTransaction(txSignature);
      return txSignature; // Return transaction signature
    }

    throw new Error(`Unsupported functionName: ${functionName} for Solana`);
  }

  estimate = {
    write: async (
      { abi, method: functionName, args = [], to }: RequestParams<"solana">,
      override?: Partial<OverrideParams>
    ): Promise<string> => {
      const connection = this.provider.getConnection();
      const wallet = this.provider.getSigner();
      const tokenMint = new PublicKey(to);

      if (functionName === "transfer") {
        const [destinationAddress, amount] = args as [
          string,
          string | number | bigint
        ];
        if (!destinationAddress || amount === undefined) {
          throw new Error(
            "transfer requires destinationAddress and amount as args"
          );
        }

        const sourceATA = await getAssociatedTokenAddress(
          tokenMint,
          wallet.publicKey
        );
        const destATA = await getAssociatedTokenAddress(
          tokenMint,
          new PublicKey(destinationAddress)
        );
        const owner = override?.from
          ? new PublicKey(override.from)
          : wallet.publicKey;

        const transaction = new Transaction().add(
          createTransferInstruction(
            sourceATA,
            destATA,
            owner,
            Number(amount),
            [],
            TOKEN_PROGRAM_ID
          )
        );

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = owner;

        const fee = await connection.getFeeForMessage(
          transaction.compileMessage(),
          "confirmed"
        );
        return (fee || 5000).toString(); // Return fee in lamports as string (fallback to 5000)
      }

      throw new Error(`Unsupported functionName: ${functionName} for Solana`);
    },
  };
}
