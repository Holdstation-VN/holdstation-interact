import { Connection, Keypair, MessageV0, PublicKey, Signer, Transaction, VersionedTransaction } from "@solana/web3.js";
import { BigNumber } from "bignumber.js";
import { OverrideParams, SwapParams, Swapper } from "../../types";
import { createLogger, type Logger } from "../../utils/logger";

import bs58 from "bs58";
import cryptoJS from "crypto-js";
import {
  OkxBroadcastOptions,
  OkxBroadcastTransactionResponse,
  OkxGasLimitApiResponse,
  OkxOrderStatus,
  OkxPostTransactionOrdersResponse,
  OkxSimulationApiResponse,
  OkxSimulationResult,
  OkxSolanaParams,
  // OkxSwapExecutionOptions,
  // OkxSwapExecutionResult,
  OkxSwapTransactionPayload,
  OkxTrackTransactionOptions,
  OxkApiConfig,
} from "./swap-okx.type";
import { swapResponseSchema, SwapResponse, SwapResponseItem } from "./validateResponse";

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
export class Okx implements Swapper<"solana"> {
  private readonly swapUrl = "https://web3.okx.com";
  private readonly swapRequestPath = "/api/v6/dex/aggregator/swap";
  private readonly solanaChainIndex = "501";
  private readonly onchainGatewayBasePath = "/api/v6/dex/pre-transaction";
  private readonly postTransactionBasePath = "/api/v6/dex/post-transaction";
  private readonly logger: Logger;

  constructor(
    private connection: Connection,
    options?: { isDebug?: boolean },
  ) {
    this.logger = createLogger({ prefix: "OKX", isDebug: Boolean(options?.isDebug) });
  }

  /**
   * Estimate swap output and gas data using OKX swap + simulation + gas-limit APIs.
   *
   * @example
   * const estimate = await okx.estimate(params, { from: userPubkey, okxApiConfig });
   * console.log(estimate.gas, estimate.addons?.amountOut);
   */
  async estimate(params: SwapParams<"solana">, override?: Partial<OverrideParams<"solana">>) {
    const swapData = await this.getSwapData(params, override ?? {});

    this.logger.debug("simulateTransaction input", { swapData, override });
    const simulationResult = await this.simulateTransaction(swapData, override);

    this.logger.debug("getGasLimit input", { override });
    const gasLimit = await this.getGasLimit(swapData, override);

    this.logger.debug("bufferGasLimit input", { gasLimit });
    const bufferedGasLimit = this.bufferGasLimit(gasLimit);

    this.logger.debug("updateGasLimit input", { callDataLength: swapData.tx.data.length, bufferedGasLimit });
    const newCallData = await this.updateGasLimit(swapData.tx.data, bufferedGasLimit);

    const toTokenAmount = `${swapData?.routerResult.toTokenAmount || "0"}`;

    const toTokenDecimalBn = new BigNumber(`${swapData?.routerResult?.toToken.decimal || "0"}`);
    const toTokenPriceBn = new BigNumber(`${swapData?.routerResult?.toToken?.tokenUnitPrice || "0"}`);
    const decimalPlaces = toTokenDecimalBn.isFinite() ? toTokenDecimalBn.integerValue(BigNumber.ROUND_FLOOR).toNumber() : 0;
    const amountOutUsd = new BigNumber(toTokenAmount).shiftedBy(-decimalPlaces).multipliedBy(toTokenPriceBn);

    return {
      to: swapData.tx.to,
      gas: `${bufferedGasLimit || 0}`,
      data: newCallData,

      addons: {
        amountOut: `${swapData.routerResult.toTokenAmount}`,
        amountOutUsd: amountOutUsd.toFixed(2),
        minAmountOut: `${swapData.tx.minReceiveAmount}`,
        simulationError: simulationResult?.failReason,
        simulationGasUsed: `${simulationResult?.gasUsed ?? ""}`,
        // protocols is a list of pathways that funds take when swapping between two tokens.
        protocols: [
          {
            amount: "",
            swaps: this.buildProtocolSwaps(swapData.routerResult.dexRouterList),
          },
        ],
      },
    };
  }

  /**
   * Fetch a single OKX swap payload for Solana.
   *
   * @example
   * const swapData = await okx.getSwapData(params, { from: userPubkey, okxApiConfig });
   */
  async getSwapData(params: SwapParams<"solana">, override: Partial<OverrideParams<"solana">> = {}): Promise<SwapResponseItem> {
    const swapInfo = await this.getSwapInfo(params, override);
    const data = swapInfo?.data ?? [];
    if (data.length === 0) {
      throw new Error("Okx swap data empty");
    }

    return data[0];
  }

  /**
   * Update gas limit in OKX swap transaction data and return base58-encoded bytes.
   *
   * @example
   * const updatedCallData = await okx.updateGasLimit(swapData.tx.data, gasLimit);
   */
  async updateGasLimit(callData: string, gasLimit: string): Promise<string> {
    this.logger.debug("Updating gas limit in transaction");

    this.logger.debug("Transaction data length", { length: callData.length, gasLimit });

    const transaction = this.deserializeOkxTransaction(callData);
    const transactionType = transaction instanceof VersionedTransaction ? "versioned" : "legacy";

    switch (transactionType) {
      case "versioned": {
        const updatedTransaction = this.updateVersionedTransactionGasLimit(transaction as VersionedTransaction, gasLimit);
        const encodedTx = this.encodeUpdatedGasLimitTransaction(updatedTransaction);
        this.logger.debug("Transaction gas limit updated and encoded successfully ", transactionType);
        return encodedTx;
      }
      default: {
        const updatedTransaction = this.updateLegacyTransactionGasLimit(transaction as Transaction, gasLimit);
        const encodedTx = this.encodeUpdatedGasLimitTransaction(updatedTransaction);
        this.logger.debug("Transaction gas limit updated and encoded successfully", transactionType);
        return encodedTx;
      }
    }
  }

  private updateVersionedTransactionGasLimit(transaction: VersionedTransaction, gasLimit: string): VersionedTransaction {
    this.logger.debug("Number of instructions in OKX transaction", {
      count: transaction.message.compiledInstructions.length,
    });

    const computeBudgetProgram = new PublicKey("ComputeBudget111111111111111111111111111111");
    const computeBudgetIndex = transaction.message.staticAccountKeys.findIndex((key) => key.equals(computeBudgetProgram));

    if (computeBudgetIndex !== -1) {
      this.logger.debug("ComputeBudget program found", { index: computeBudgetIndex });

      const computeBudgetInstructions = transaction.message.compiledInstructions.filter((ix) => ix.programIdIndex === computeBudgetIndex);
      this.logger.debug("Number of ComputeBudget instructions", { count: computeBudgetInstructions.length });

      for (let i = 0; i < computeBudgetInstructions.length; i += 1) {
        const instruction = computeBudgetInstructions[i];
        const data = instruction.data;
        if (data.length === 0) {
          continue;
        }

        const instructionType = data[0];
        this.logger.debug("ComputeBudget instruction", { index: i, type: instructionType });

        switch (instructionType) {
          case 0: {
            if (data.length < 5) {
              break;
            }

            const dataView = new DataView(data.buffer, data.byteOffset, data.length);
            const computeUnits = dataView.getUint32(1, true);
            this.logger.debug("Compute unit limit", { computeUnits });
            if (gasLimit) {
              this.logger.debug("Gas limit from API", { gasLimit });
              const apiGasLimit = parseInt(gasLimit, 10);
              if (Number.isFinite(apiGasLimit) && computeUnits !== apiGasLimit) {
                this.logger.debug("Compute units mismatch", { okx: computeUnits, api: apiGasLimit });
                dataView.setUint32(1, apiGasLimit, true);
                instruction.data = data;
              }
            }
            break;
          }
          case 1: {
            if (data.length < 9) {
              break;
            }

            const dataView = new DataView(data.buffer, data.byteOffset, data.length);
            const microLamports = dataView.getBigUint64(1, true);
            this.logger.debug("Compute unit price", { microLamports: microLamports.toString() });
            break;
          }
          default: {
            break;
          }
        }
      }

      return transaction;
    }

    if (!gasLimit) {
      return transaction;
    }

    this.logger.debug("No ComputeBudget program found - OKX transaction may not have compute budget instructions");
    this.logger.debug("Adding ComputeBudget instruction with gas limit", { gasLimit });

    const setComputeUnitLimitData = Buffer.alloc(5);
    setComputeUnitLimitData[0] = 0;
    setComputeUnitLimitData.writeUInt32LE(parseInt(gasLimit, 10), 1);

    const newStaticAccountKeys = [...transaction.message.staticAccountKeys, computeBudgetProgram];
    const programIndex = newStaticAccountKeys.length - 1;
    const newCompiledInstructions = [
      {
        programIdIndex: programIndex,
        accountKeyIndexes: [],
        data: setComputeUnitLimitData,
      },
      ...transaction.message.compiledInstructions,
    ];

    const newMessage = new MessageV0({
      header: transaction.message.header,
      staticAccountKeys: newStaticAccountKeys,
      recentBlockhash: transaction.message.recentBlockhash,
      compiledInstructions: newCompiledInstructions,
      addressTableLookups: transaction.message.addressTableLookups,
    });
    // Clear signatures since the new MessageV0 has different message bytes
    // Callers must re-sign the transaction after updating the message
    const updatedTransaction = new VersionedTransaction(newMessage);

    this.logger.debug("Added ComputeBudget instruction with gas limit", { gasLimit });
    return updatedTransaction;
  }

  private updateLegacyTransactionGasLimit(transaction: Transaction, gasLimit: string): Transaction {
    this.logger.debug("Number of instructions in legacy transaction", { count: transaction.instructions.length });

    const computeBudgetProgram = new PublicKey("ComputeBudget111111111111111111111111111111");
    const computeBudgetInstructions = transaction.instructions.filter((ix) => ix.programId.equals(computeBudgetProgram));
    const shouldAddComputeBudget = computeBudgetInstructions.length === 0 && Boolean(gasLimit);

    if (!shouldAddComputeBudget) {
      this.logger.debug("Found existing ComputeBudget instructions", { count: computeBudgetInstructions.length });
      return transaction;
    }

    this.logger.debug("No ComputeBudget instructions found in legacy transaction");
    this.logger.debug("Adding ComputeBudget instruction with gas limit", { gasLimit });

    const setComputeUnitLimitData = Buffer.alloc(5);
    setComputeUnitLimitData[0] = 0;
    setComputeUnitLimitData.writeUInt32LE(parseInt(gasLimit, 10), 1);

    const computeBudgetIx = {
      programId: computeBudgetProgram,
      keys: [],
      data: setComputeUnitLimitData,
    };

    transaction.instructions.unshift(computeBudgetIx);
    this.logger.debug("Added ComputeBudget instruction to legacy transaction");
    return transaction;
  }

  private encodeUpdatedGasLimitTransaction(transaction: Transaction | VersionedTransaction): string {
    let serializedTx: Uint8Array;
    const transactionType = transaction instanceof VersionedTransaction ? "versioned" : "legacy";

    switch (transactionType) {
      case "versioned": {
        serializedTx = transaction.serialize();
        break;
      }
      case "legacy":
      default: {
        serializedTx = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
        break;
      }
    }

    const encodedTx = bs58.encode(serializedTx);
    return encodedTx;
  }

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
  async signTransaction(callData: string, signer: Signer): Promise<string> {
    this.logger.debug("Signing transaction");

    const keypair = Keypair.fromSecretKey(signer.secretKey);

    this.logger.debug("Transaction data length", { length: callData.length });

    try {
      const transaction = this.deserializeOkxTransaction(callData);

      const recentBlockHash = await this.connection.getLatestBlockhash();
      this.logger.debug("Got recent blockhash", { blockhash: recentBlockHash.blockhash });

      if (transaction instanceof VersionedTransaction) {
        this.logger.debug("Number of instructions in OKX transaction", {
          count: transaction.message.compiledInstructions.length,
        });

        transaction.message.recentBlockhash = recentBlockHash.blockhash;
        transaction.sign([keypair]);
        this.logger.debug("Signed VersionedTransaction");
      } else {
        this.logger.debug("Number of instructions in legacy transaction", { count: transaction.instructions.length });

        transaction.recentBlockhash = recentBlockHash.blockhash;
        transaction.sign(keypair);
        this.logger.debug("Signed legacy Transaction");
      }

      const serializedTx = transaction.serialize();
      const encodedTx = bs58.encode(serializedTx);
      this.logger.debug("Transaction signed and encoded successfully");
      return encodedTx;
    } catch (error) {
      this.logger.debug("Failed to process OKX transaction data", { message: (error as Error).message });
      throw new Error(`Cannot process OKX transaction data: ${(error as Error).message}`);
    }
  }

  /**
   * * This function is not currently in use; it's prepared for future use.
   * Broadcast a signed transaction via OKX Onchain Gateway API.
   *
   * @example
   * const orderId = await okx.broadcastTransactionViaOkx(signedTx, walletAddress, { okxApiConfig });
   */
  async broadcastTransactionViaOkx(
    signedTx: string,
    walletAddress: string,
    override?: Partial<OverrideParams<"solana">>,
    options: OkxBroadcastOptions = {},
  ): Promise<string> {
    if (!walletAddress) {
      throw new Error("Wallet address is required for broadcast");
    }

    const apiConfig = this.requireOkxApiConfig(override);
    const extraData = this.buildBroadcastExtraData(options);
    const body: Record<string, unknown> = {
      signedTx,
      chainIndex: this.solanaChainIndex,
      address: walletAddress,
    };

    if (extraData) {
      body.extraData = extraData;
    }

    const response = await this.callOkxApi<OkxBroadcastTransactionResponse>({
      method: "POST",
      path: `${this.onchainGatewayBasePath}/broadcast-transaction`,
      okxApiConfig: apiConfig,
      body,
    });

    if (response.code !== "0") {
      throw new Error(response.msg ?? "Error when broadcast transaction");
    }

    const orderId = response.data?.[0]?.orderId;
    if (!orderId) {
      throw new Error("Okx broadcast response empty");
    }

    return orderId;
  }

  /**
   * * This function is not currently in use; it's prepared for future use.
   * Broadcast a signed transaction directly to Solana RPC.
   *
   * @example
   * const signature = await okx.broadcastTransactionViaRpc(signedTx);
   */
  async broadcastTransactionViaRpc(
    signedTx: string,
    options: {
      skipPreflight?: boolean;
      preflightCommitment?: "processed" | "confirmed" | "finalized";
      confirmCommitment?: "processed" | "confirmed" | "finalized";
    } = {},
  ): Promise<string> {
    const txBytes = bs58.decode(signedTx);
    const signature = await this.connection.sendRawTransaction(txBytes, {
      skipPreflight: options.skipPreflight ?? false,
      preflightCommitment: options.preflightCommitment ?? "processed",
    });

    const confirmation = await this.connection.confirmTransaction(signature, options.confirmCommitment ?? "confirmed");
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    return signature;
  }

  /**
   * * This function is not currently in use; it's prepared for future use.
   * Poll order status via OKX Onchain Gateway API until success, failure, or timeout.
   *
   * @example
   * const order = await okx.trackTransaction(orderId, { from: userPubkey, okxApiConfig }, { intervalMs: 5000 });
   * console.log(order.txStatus, order.txHash);
   */
  async trackTransaction(orderId: string, override?: Partial<OverrideParams<"solana">>, options: OkxTrackTransactionOptions = {}): Promise<OkxOrderStatus> {
    const apiConfig = this.requireOkxApiConfig(override);
    const fromAddress = this.requireFromAddress(override);
    const intervalMs = options.intervalMs ?? 5000;
    const timeoutMs = options.timeoutMs ?? 180000;

    const startTime = Date.now();
    let lastStatus = "";

    while (Date.now() - startTime < timeoutMs) {
      const response = await this.callOkxApi<OkxPostTransactionOrdersResponse>({
        method: "GET",
        path: `${this.postTransactionBasePath}/orders`,
        okxApiConfig: apiConfig,
        query: {
          orderId,
          chainIndex: this.solanaChainIndex,
          address: fromAddress,
          limit: "1",
        },
      });

      if (response.code !== "0") {
        throw new Error(response.msg ?? "Error when track transaction");
      }

      const order = response.data?.[0]?.orders?.[0];
      if (!order) {
        await this.sleep(intervalMs);
        continue;
      }

      if (order.txStatus !== lastStatus) {
        lastStatus = order.txStatus;
        this.logger.debug("Okx order status", { status: lastStatus, txHash: order.txHash ?? "" });
      }

      if (order.txStatus === "2") {
        return order;
      }

      if (order.txStatus === "3") {
        throw new Error(order.failReason ?? "Transaction failed");
      }

      await this.sleep(intervalMs);
    }

    throw new Error(`Transaction tracking timed out after ${timeoutMs}ms`);
  }

  name(): string {
    return "okx";
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  enabled(chainId: number): boolean {
    // alway on for solana
    return true;
  }

  private deserializeOkxTransaction(callData: string): Transaction | VersionedTransaction {
    const decodedTransaction = bs58.decode(callData);
    this.logger.debug("Decoded transaction bytes length", { length: decodedTransaction.length });

    try {
      const transaction = VersionedTransaction.deserialize(decodedTransaction);
      this.logger.debug("Successfully deserialized as VersionedTransaction");
      return transaction;
    } catch (versionedError) {
      this.logger.debug("VersionedTransaction failed, trying legacy Transaction");

      try {
        const transaction = Transaction.from(decodedTransaction);
        this.logger.debug("Successfully deserialized as legacy Transaction");
        return transaction;
      } catch (legacyError) {
        this.logger.debug("Both transaction types failed to deserialize");
        this.logger.debug("VersionedTransaction error", { message: (versionedError as Error).message });
        this.logger.debug("Legacy Transaction error", { message: (legacyError as Error).message });
        throw new Error("Failed to deserialize OKX transaction data. Data may be corrupted.");
      }
    }
  }

  /**
   * Buffer gasLimit after estimate
   *
   * References
   * https://github.com/solana-developers/helpers?tab=readme-ov-file#addcomputeinstructions => multiplier 1.1
   * https://www.quicknode.com/guides/solana-development/transactions/how-to-optimize-solana-transactions?#compute-unit-optimization => max 1.4m
   * https://chainstack.com/solana-transaction-serialization-signatures-fees-and-runtime-execution/amp
   */
  private bufferGasLimit(gasLimit: string): string {
    const parsedGasLimit = Number(gasLimit);
    if (!Number.isFinite(parsedGasLimit) || parsedGasLimit <= 0) {
      return gasLimit;
    }

    const multiplier = 1.1;
    const maxComputeUnits = 1_400_000;
    const bufferedGasLimit = Math.min(Math.ceil(parsedGasLimit * multiplier), maxComputeUnits);

    if (bufferedGasLimit !== parsedGasLimit) {
      this.logger.debug("Buffered gas limit", {
        original: parsedGasLimit,
        buffered: bufferedGasLimit,
      });
    }

    return bufferedGasLimit.toString();
  }

  private buildQueryString(params: Record<string, string | undefined>): string {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value);
      }
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
  }

  private async callOkxApi<T>({
    method,
    path,
    okxApiConfig,
    query,
    body,
  }: {
    method: "GET" | "POST";
    path: string;
    okxApiConfig: OxkApiConfig;
    query?: Record<string, string | undefined>;
    body?: Record<string, unknown>;
  }): Promise<T> {
    const timestamp = new Date().toISOString();
    const queryString = query ? this.buildQueryString(query) : "";
    const bodyString = body ? JSON.stringify(body) : "";
    const headers = this.getHeaders(timestamp, method, path, queryString, okxApiConfig, bodyString);
    const response = await fetch(`${this.swapUrl}${path}${queryString}`, {
      method,
      headers,
      body: bodyString ? bodyString : undefined,
    });

    const parsedResponse = await response.json();
    if (!response.ok) {
      const errorMessage = parsedResponse?.msg || parsedResponse?.error || JSON.stringify(parsedResponse);
      throw new Error(errorMessage);
    }

    return parsedResponse as T;
  }

  private buildProtocolSwaps(dexRouterList: unknown) {
    if (!Array.isArray(dexRouterList)) {
      return [];
    }

    const routerEntries = dexRouterList as Array<Record<string, unknown>>;
    const firstItem = routerEntries[0] as Record<string, unknown> | undefined;
    const subRouters = firstItem?.subRouterList as Array<Record<string, unknown>> | undefined;

    if (Array.isArray(subRouters) && subRouters.length > 0) {
      return subRouters.map((item) => {
        const leg = item as Record<string, unknown>;
        const dexProtocolRaw = Array.isArray(leg.dexProtocol) ? leg.dexProtocol[0] : leg.dexProtocol;
        const dexProtocol = dexProtocolRaw as Record<string, unknown> | undefined;
        const fromToken = leg.fromToken as { tokenContractAddress?: string };
        const toToken = leg.toToken as { tokenContractAddress?: string };
        const poolName = typeof dexProtocol?.dexName === "string" ? (dexProtocol.dexName as string) : "";
        return {
          amount: "",
          from: fromToken?.tokenContractAddress ?? "",
          pool: poolName,
          protocol: poolName,
          to: toToken?.tokenContractAddress ?? "",
        };
      });
    }

    return routerEntries.map((entry) => {
      const leg = entry as Record<string, unknown>;
      const dexProtocolRaw = Array.isArray(leg.dexProtocol) ? leg.dexProtocol[0] : leg.dexProtocol;
      const dexProtocol = dexProtocolRaw as Record<string, unknown> | undefined;
      const fromToken = leg.fromToken as { tokenContractAddress?: string };
      const toToken = leg.toToken as { tokenContractAddress?: string };
      const poolName = typeof dexProtocol?.dexName === "string" ? (dexProtocol.dexName as string) : "";
      return {
        amount: "",
        from: fromToken?.tokenContractAddress ?? "",
        pool: poolName,
        protocol: poolName,
        to: toToken?.tokenContractAddress ?? "",
      };
    });
  }

  private requireOkxApiConfig(override?: Partial<OverrideParams<"solana">>): OxkApiConfig {
    if (!override?.okxApiConfig) {
      throw new Error("Okx swap need api config");
    }

    return override.okxApiConfig;
  }

  private requireFromAddress(override?: Partial<OverrideParams<"solana">>): string {
    const fromAddress = override?.from?.toString();
    if (!fromAddress) {
      throw new Error("Unknown user public key");
    }

    return fromAddress;
  }

  private buildBroadcastExtraData(options: OkxBroadcastOptions): string | undefined {
    if (!options.enableMevProtection && !options.jitoSignedTx) {
      return undefined;
    }

    const extraData: Record<string, unknown> = {};
    if (options.enableMevProtection) {
      extraData.enableMevProtection = true;
    }

    if (options.jitoSignedTx) {
      extraData.jitoSignedTx = options.jitoSignedTx;
    }

    return JSON.stringify(extraData);
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  getHeaders(timestamp: string, method: string, requestPath: string, queryString = "", okxApiConfig: OxkApiConfig, body = "") {
    const stringToSign = timestamp + method + requestPath + (queryString || body);
    return {
      "Content-Type": "application/json",
      "OK-ACCESS-KEY": okxApiConfig.api_key,
      "OK-ACCESS-SIGN": cryptoJS.enc.Base64.stringify(cryptoJS.HmacSHA256(stringToSign, okxApiConfig.secret_key)),
      "OK-ACCESS-TIMESTAMP": timestamp,
      "OK-ACCESS-PASSPHRASE": okxApiConfig.passphrase,
      "OK-ACCESS-PROJECT": okxApiConfig.project,
    };
  }

  /**
   * Fetch compute unit estimate from OKX Onchain Gateway API.
   *
   * @example
   * const gasLimit = await okx.getGasLimit(swapData, { okxApiConfig });
   */
  async getGasLimit(swapData: OkxSwapTransactionPayload, override?: Partial<OverrideParams<"solana">>): Promise<string> {
    const apiConfig = this.requireOkxApiConfig(override);

    const tx = swapData?.tx;
    if (!tx?.from || !tx.to) {
      throw new Error("Okx gas limit requires transaction addresses");
    }

    this.logger.debug("Gas limit request", {
      chainIndex: this.solanaChainIndex,
      fromAddress: tx.from,
      toAddress: tx.to,
      txAmount: `${tx.value || 0}`,
      inputDataLength: tx.data?.length ?? 0,
      inputDataPrefix: tx.data ? tx.data.slice(0, 32) : "",
    });

    const response = await this.callOkxApi<OkxGasLimitApiResponse>({
      method: "POST",
      path: `${this.onchainGatewayBasePath}/gas-limit`,
      okxApiConfig: apiConfig,
      body: {
        chainIndex: this.solanaChainIndex,
        fromAddress: tx.from,
        toAddress: tx.to,
        txAmount: `${tx.value || "0"}`,
        extJson: {
          inputData: tx.data ?? "",
        },
      },
    });

    this.logger.debug("Gas limit response", {
      code: response.code,
      msg: response.msg ?? "",
      data: response.data ?? [],
    });

    if (response.code !== "0") {
      throw new Error(response.msg ?? "Error when get gas limit");
    }

    const gasLimit = response.data?.[0]?.gasLimit;
    if (!gasLimit) {
      throw new Error("Okx gas limit response empty");
    }

    return gasLimit;
  }

  /**
   * Simulate a swap transaction using OKX Onchain Gateway API.
   *
   * @example
   * const sim = await okx.simulateTransaction(swapData, { okxApiConfig }, { includeDebug: true });
   */
  async simulateTransaction(
    swapData: OkxSwapTransactionPayload,
    override?: Partial<OverrideParams<"solana">>,
    options?: { includeDebug?: boolean },
  ): Promise<OkxSimulationResult> {
    const apiConfig = this.requireOkxApiConfig(override);

    const tx = swapData?.tx;
    if (!tx?.data) {
      throw new Error("Okx simulate requires transaction data");
    }
    if (!tx.from || !tx.to) {
      throw new Error("Okx simulate requires transaction addresses");
    }

    const body: Record<string, unknown> = {
      chainIndex: this.solanaChainIndex,
      fromAddress: tx.from,
      toAddress: tx.to,
      txAmount: `${tx.value || "0"}`,
      extJson: {
        inputData: tx.data,
      },
    };

    if (options?.includeDebug) {
      body.includeDebug = true;
    }

    const response = await this.callOkxApi<OkxSimulationApiResponse>({
      method: "POST",
      path: `${this.onchainGatewayBasePath}/simulate`,
      okxApiConfig: apiConfig,
      body,
    });

    if (response.code !== "0") {
      throw new Error(response.msg ?? "Error when simulate transaction");
    }

    const simulationResult = response.data?.[0];
    if (!simulationResult) {
      throw new Error("Simulation response empty");
    }

    if (simulationResult.failReason || simulationResult.success === false) {
      const reason = simulationResult.failReason || simulationResult.error || "Unknown simulation error";
      throw new Error(`Simulation failed: ${reason}`);
    }

    return simulationResult;
  }

  private async getSwapInfo(params: SwapParams<"solana">, override: Partial<OverrideParams<"solana">>): Promise<SwapResponse> {
    const apiConfig = this.requireOkxApiConfig(override);
    const fromAddress = this.requireFromAddress(override);

    const paramsSwap: OkxSolanaParams = {
      amount: params.amount.toString(),
      // this chainIndex is defined in okx api
      // https://web3.okx.com/build/dev-docs/dex-api/dex-supported-chain#other-chains
      chainIndex: this.solanaChainIndex,
      fromTokenAddress: params.fromToken.toString(),
      toTokenAddress: params.toToken.toString(),
      userWalletAddress: fromAddress,
      slippagePercent: params.slippage,
      feePercent: params?.fee?.toString() ?? "0.2",
    };

    if (override?.fromTokenReferrerWalletAddress) {
      paramsSwap.fromTokenReferrerWalletAddress = override?.fromTokenReferrerWalletAddress;
    }

    if (override?.toTokenReferrerWalletAddress) {
      paramsSwap.toTokenReferrerWalletAddress = override?.toTokenReferrerWalletAddress;
    }

    if (override?.computeUnitPrice) {
      paramsSwap.computeUnitPrice = override.computeUnitPrice;
    }

    if (override?.computeUnitLimit) {
      paramsSwap.computeUnitLimit = override.computeUnitLimit;
    }

    if (override?.directRoute) {
      paramsSwap.directRoute = override.directRoute.toString();
    }

    if (override?.priceImpactProtectionPercentage) {
      paramsSwap.priceImpactProtectionPercentage = override.priceImpactProtectionPercentage;
    }

    if (override?.autoSlippage) {
      paramsSwap.autoSlippage = override.autoSlippage;
    }

    if (override?.maxAutoSlippage) {
      paramsSwap.maxAutoSlippage = override.maxAutoSlippage;
    }

    this.logger.debug("Swap request params", paramsSwap as Record<string, unknown>);

    const data = await this.callOkxApi<SwapResponse>({
      method: "GET",
      path: this.swapRequestPath,
      okxApiConfig: apiConfig,
      query: paramsSwap,
    });
    this.logger.debug("Okx swap data response", data as Record<string, unknown>);

    const validatedData = await swapResponseSchema.validate(data, {
      abortEarly: false,
    });

    if (String(validatedData?.code) !== "0") {
      this.logger.debug("validatedData", { msg: validatedData?.msg ?? "" });
      throw new Error(validatedData?.msg ?? "Error when get swap data");
    }

    return validatedData;
  }
}
