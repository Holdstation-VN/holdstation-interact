import { clusterApiUrl, Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { Okx } from "./swap-okx";
import { OverrideParams } from "src/types";

const api_config = {
  api_key: process.env.OKX_API_KEY ?? "",
  secret_key: process.env.OKX_SECRET_KEY ?? "",
  passphrase: process.env.OKX_API_PASSPHRASE ?? "",
  project: process.env.OKX_PROJECT_ID ?? "", // Applies only to onchainOS APIs
};

describe("[Solana SWAP] Okx", () => {
  const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  const okx = new Okx(connection);

  it("estimate swap SOL -> USDC (base case)", async () => {
    const result = await okx.estimate(
      {
        fromToken: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
        amount: "10000",
        slippage: "2",
        fee: "0.2",
      },
      {
        from: "5UvA859mCeaDVyADvzUn5WsZ1DViqLjypPUyzkrkUZC7",
        fromTokenReferrerWalletAddress: "4NRKjuM1KNCbVcLhnzkH1xSoTYbG5mC1nADg71kU2nNp",
        okxApiConfig: {
          api_key: api_config.api_key,
          secret_key: api_config.secret_key,
          passphrase: api_config.passphrase,
          project: api_config.project,
        },
        isDebug: true,
      },
    );
    expect(result).toBeDefined();
    expect(result.gas).toBeDefined();
    expect(result.gas).toMatch(/^\d+$/); // Chuỗi số, không rỗng
    console.debug("result ", result);
  });

  it("estimate swap SOL -> USDT (base case)", async () => {
    const result = await okx.estimate(
      {
        fromToken: "11111111111111111111111111111111", // SOL
        toToken: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
        amount: "1000000",
        slippage: "2",
        fee: "0.2",
      },
      {
        isDebug: true,
        from: "5UvA859mCeaDVyADvzUn5WsZ1DViqLjypPUyzkrkUZC7",
        fromTokenReferrerWalletAddress: "4NRKjuM1KNCbVcLhnzkH1xSoTYbG5mC1nADg71kU2nNp",
        okxApiConfig: {
          api_key: api_config.api_key,
          secret_key: api_config.secret_key,
          passphrase: api_config.passphrase,
          project: api_config.project,
        },
      }, // Random wallet
    );

    expect(result).toBeDefined();
    expect(result.gas).toBeDefined();
    expect(result.gas).toMatch(/^\d+$/); // Chuỗi số, không rỗng
  });

  it("throw error khi fromToken = toToken (trường hợp không hợp lệ)", async () => {
    await expect(async () => {
      await okx.estimate(
        {
          fromToken: "11111111111111111111111111111111",
          toToken: "11111111111111111111111111111111",
          amount: "1000000",
          slippage: "2",
          fee: "0.2",
        },
        {
          isDebug: true,
          from: "5UvA859mCeaDVyADvzUn5WsZ1DViqLjypPUyzkrkUZC7",
          fromTokenReferrerWalletAddress: "4NRKjuM1KNCbVcLhnzkH1xSoTYbG5mC1nADg71kU2nNp",
          okxApiConfig: {
            api_key: api_config.api_key,
            secret_key: api_config.secret_key,
            passphrase: api_config.passphrase,
            project: api_config.project,
          },
        },
      );
    }).rejects.toThrow();
  });

  it("add fee account without fee", async () => {
    const result = await okx.estimate(
      {
        fromToken: "11111111111111111111111111111111",
        toToken: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        amount: "1000000",
        slippage: "2",
        fee: "0.2",
      },
      {
        isDebug: true,
        from: "5UvA859mCeaDVyADvzUn5WsZ1DViqLjypPUyzkrkUZC7",
        fromTokenReferrerWalletAddress: "4NRKjuM1KNCbVcLhnzkH1xSoTYbG5mC1nADg71kU2nNp",
        okxApiConfig: {
          api_key: api_config.api_key,
          secret_key: api_config.secret_key,
          passphrase: api_config.passphrase,
          project: api_config.project,
        },
      },
    );
    expect(result).toBeDefined();
    expect(result.gas).toMatch(/^\d+$/);
  });

  describe("mocked responses", () => {
    const baseParams = {
      fromToken: "11111111111111111111111111111111",
      toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      amount: "1000000",
      slippage: "2",
      fee: "0.2",
    };

    const baseOverride = {
      isDebug: true,
      from: "5UvA859mCeaDVyADvzUn5WsZ1DViqLjypPUyzkrkUZC7",
      fromTokenReferrerWalletAddress: "4NRKjuM1KNCbVcLhnzkH1xSoTYbG5mC1nADg71kU2nNp",
      okxApiConfig: {
        api_key: api_config.api_key,
        secret_key: api_config.secret_key,
        passphrase: api_config.passphrase,
        project: api_config.project,
      },
    };

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("parses flattened dexRouterList responses and reuses simulation + gas limit", async () => {
      const mockPayload = {
        code: "0",
        data: [
          {
            routerResult: {
              chainIndex: "501",
              contextSlot: 378051265,
              dexRouterList: [
                {
                  dexProtocol: { dexName: "HumidiFi", percent: "100" },
                  fromToken: {
                    decimal: "9",
                    isHoneyPot: false,
                    taxRate: "0",
                    tokenContractAddress: "So11111111111111111111111111111111111111112",
                    tokenSymbol: "wSOL",
                    tokenUnitPrice: "156.575036237886559972",
                  },
                  toToken: {
                    decimal: "6",
                    isHoneyPot: false,
                    taxRate: "0",
                    tokenContractAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
                    tokenSymbol: "USDT",
                    tokenUnitPrice: "0.997812838965088364",
                  },
                },
                {
                  dexProtocol: { dexName: "AldrinSwapV1", percent: "100" },
                  fromToken: {
                    decimal: "6",
                    isHoneyPot: false,
                    taxRate: "0",
                    tokenContractAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
                    tokenSymbol: "USDT",
                    tokenUnitPrice: "0.997812838965088364",
                  },
                  toToken: {
                    decimal: "9",
                    isHoneyPot: false,
                    taxRate: "0",
                    tokenContractAddress: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
                    tokenSymbol: "mSOL",
                    tokenUnitPrice: "208.640383553817026138",
                  },
                },
                {
                  dexProtocol: { dexName: "Lifinity V2", percent: "100" },
                  fromToken: {
                    decimal: "9",
                    isHoneyPot: false,
                    taxRate: "0",
                    tokenContractAddress: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
                    tokenSymbol: "mSOL",
                    tokenUnitPrice: "208.640383553817026138",
                  },
                  toToken: {
                    decimal: "6",
                    isHoneyPot: false,
                    taxRate: "0",
                    tokenContractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                    tokenSymbol: "USDC",
                    tokenUnitPrice: "0.997758419654384622",
                  },
                },
              ],
              estimateGasFee: "353674",
              fromToken: {
                decimal: "9",
                tokenContractAddress: "So11111111111111111111111111111111111111112",
                tokenSymbol: "wSOL",
                tokenUnitPrice: "156.575036237886559972",
              },
              fromTokenAmount: "1000000",
              priceImpactPercent: "0",
              swapMode: "exactIn",
              toToken: {
                decimal: "6",
                tokenContractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                tokenSymbol: "USDC",
                tokenUnitPrice: "0.997758419654384622",
              },
              toTokenAmount: "156617",
              tradeFee: "0.00077895",
            },
            tx: {
              data: "mocked-data",
              from: baseOverride.from,
              gas: "21249",
              gasPrice: "1562989000000000",
              minReceiveAmount: "156303",
              to: "proVF4pMXVaYqmy4NjniPh4pqKNfMmsihgd4wdkCX3u",
              value: "0",
            },
          },
        ],
        msg: "",
      };

      const simulationPayload = {
        code: "0",
        data: [
          {
            intention: "swap",
            gasUsed: "123456",
          },
        ],
      };

      const gasLimitPayload = {
        code: "0",
        data: [
          {
            gasLimit: "654321",
          },
        ],
      };

      const updateGasLimitSpy = jest.spyOn(okx, "updateGasLimit").mockResolvedValue("mocked-data-buffered");

      jest.spyOn(globalThis, "fetch").mockImplementation(async (input: any) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

        if (url.includes("/dex/aggregator/swap")) {
          return {
            ok: true,
            json: async () => mockPayload,
          } as unknown as Response;
        }

        if (url.includes("/dex/pre-transaction/simulate")) {
          return {
            ok: true,
            json: async () => simulationPayload,
          } as unknown as Response;
        }

        if (url.includes("/dex/pre-transaction/gas-limit")) {
          return {
            ok: true,
            json: async () => gasLimitPayload,
          } as unknown as Response;
        }

        throw new Error(`Unexpected fetch call for url: ${url}`);
      });
      const result = await okx.estimate(baseParams, baseOverride);
      const expectedBufferedGasLimit = Math.ceil(Number(gasLimitPayload.data[0].gasLimit) * 1.1).toString();

      expect(updateGasLimitSpy).toHaveBeenCalledWith("mocked-data", expectedBufferedGasLimit, baseOverride);
      expect(result.gas).toBe(expectedBufferedGasLimit);
      expect(result.data).toBe("mocked-data-buffered");
      expect(result.addons.amountOut).toBe("156617");
      expect(result.addons.minAmountOut).toBe("156303");
      expect(result.addons.protocols[0].swaps).toHaveLength(3);
      expect(result.addons.protocols[0].swaps[0].protocol).toBe("HumidiFi");
      expect(result.addons.simulationGasUsed).toBe("123456");
      expect(result.addons.simulationError).toBeUndefined();
    });

    it("buffers gas limit and caps at max compute units", async () => {
      const mockPayload = {
        code: "0",
        data: [
          {
            routerResult: {
              chainIndex: "501",
              dexRouterList: [
                {
                  dexProtocol: { dexName: "TestDex", percent: "100" },
                  fromToken: {
                    decimal: "9",
                    tokenContractAddress: "So11111111111111111111111111111111111111112",
                    tokenSymbol: "wSOL",
                    tokenUnitPrice: "1",
                  },
                  toToken: {
                    decimal: "6",
                    tokenContractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                    tokenSymbol: "USDC",
                    tokenUnitPrice: "1",
                  },
                },
              ],
              estimateGasFee: "1000",
              fromToken: {
                decimal: "9",
                tokenContractAddress: "So11111111111111111111111111111111111111112",
                tokenSymbol: "wSOL",
                tokenUnitPrice: "1",
              },
              fromTokenAmount: "1000000",
              toToken: {
                decimal: "6",
                tokenContractAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                tokenSymbol: "USDC",
                tokenUnitPrice: "1",
              },
              toTokenAmount: "1000",
            },
            tx: {
              data: "mocked-data",
              from: baseOverride.from,
              minReceiveAmount: "900",
              to: "proVF4pMXVaYqmy4NjniPh4pqKNfMmsihgd4wdkCX3u",
              value: "0",
            },
          },
        ],
        msg: "",
      };

      const simulationPayload = {
        code: "0",
        data: [
          {
            intention: "swap",
            gasUsed: "123",
          },
        ],
      };

      const gasLimitPayload = {
        code: "0",
        data: [
          {
            gasLimit: "1500000",
          },
        ],
      };

      const updateGasLimitSpy = jest.spyOn(okx, "updateGasLimit").mockResolvedValue("mocked-data-buffered-cap");

      jest.spyOn(globalThis, "fetch").mockImplementation(async (input: any) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

        if (url.includes("/dex/aggregator/swap")) {
          return {
            ok: true,
            json: async () => mockPayload,
          } as unknown as Response;
        }

        if (url.includes("/dex/pre-transaction/simulate")) {
          return {
            ok: true,
            json: async () => simulationPayload,
          } as unknown as Response;
        }

        if (url.includes("/dex/pre-transaction/gas-limit")) {
          return {
            ok: true,
            json: async () => gasLimitPayload,
          } as unknown as Response;
        }

        throw new Error(`Unexpected fetch call for url: ${url}`);
      });

      const result = await okx.estimate(baseParams, baseOverride);
      const expectedBufferedGasLimit = Math.min(Math.ceil(Number(gasLimitPayload.data[0].gasLimit) * 1.1), 1_400_000).toString();

      expect(updateGasLimitSpy).toHaveBeenCalledWith("mocked-data", expectedBufferedGasLimit, baseOverride);
      expect(result.gas).toBe(expectedBufferedGasLimit);
      expect(result.data).toBe("mocked-data-buffered-cap");
    });

    it("throws when OKX responds with non-zero code", async () => {
      jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({ code: "123", data: [], msg: "not ok" }),
      } as unknown as Response);

      await expect(okx.estimate(baseParams, baseOverride)).rejects.toThrow("not ok");
    });

    it("throws meaningful error when HTTP request fails", async () => {
      jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ msg: "internal" }),
      } as unknown as Response);

      await expect(okx.estimate(baseParams, baseOverride)).rejects.toThrow("internal");
    });
  });

  describe("manual flow", () => {
    const itManual = process.env.OKX_MANUAL_TEST === "true" ? it : it.skip;
    itManual("estimate -> updateGasLimit -> signTransaction -> broadcastTransactionViaRpc (fill inputs)", async () => {
      const fromToken = process.env.OKX_FROM_TOKEN ?? "";
      const toToken = process.env.OKX_TO_TOKEN ?? "";
      const amount = process.env.OKX_AMOUNT ?? "";
      const slippage = process.env.OKX_SLIPPAGE ?? "2";
      const fee = process.env.OKX_FEE ?? "0.2";
      const fromAddress = process.env.OKX_FROM_ADDRESS ?? "";
      const privateKey = process.env.OKX_PRIVATE_KEY ?? "";
      const fromTokenReferrerWalletAddress = process.env.OKX_FROM_TOKEN_REFERRER ?? "";

      const apiKey = process.env.OKX_API_KEY ?? "";
      const secretKey = process.env.OKX_SECRET_KEY ?? "";
      const passphrase = process.env.OKX_API_PASSPHRASE ?? "";
      const project = process.env.OKX_PROJECT_ID ?? "";

      const missing = [
        ["OKX_FROM_TOKEN", fromToken],
        ["OKX_TO_TOKEN", toToken],
        ["OKX_AMOUNT", amount],
        ["OKX_PRIVATE_KEY", privateKey],
        ["OKX_API_KEY", apiKey],
        ["OKX_SECRET_KEY", secretKey],
        ["OKX_API_PASSPHRASE", passphrase],
        ["OKX_PROJECT_ID", project],
      ]
        .filter(([, value]) => !value)
        .map(([key]) => key);

      if (missing.length > 0) {
        throw new Error(`Missing env: ${missing.join(", ")}`);
      }

      const signer = privateKey.trim().startsWith("[")
        ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(privateKey)))
        : Keypair.fromSecretKey(bs58.decode(privateKey));

      const resolvedFrom = fromAddress || signer.publicKey.toBase58();
      if (resolvedFrom !== signer.publicKey.toBase58()) {
        throw new Error("OKX_FROM_ADDRESS must match the signer public key");
      }

      const params = {
        fromToken,
        toToken,
        amount,
        slippage,
        fee,
      };

      const override: OverrideParams<"solana"> = {
        from: resolvedFrom,
        isDebug: true,
        okxApiConfig: {
          api_key: apiKey,
          secret_key: secretKey,
          passphrase,
          project,
        },
      };

      if (fromTokenReferrerWalletAddress) {
        override.fromTokenReferrerWalletAddress = fromTokenReferrerWalletAddress;
      }

      const estimate = await okx.estimate(params, override);
      const swapData = {
        tx: {
          data: estimate.data,
          from: resolvedFrom,
          to: estimate.to,
          value: "0",
          minReceiveAmount: estimate.addons?.minAmountOut ?? "0",
        },
      };

      const updatedCallData = await okx.updateGasLimit(swapData.tx.data, estimate.gas);
      const signedTx = await okx.signTransaction(updatedCallData, signer);
      const signature = await okx.broadcastTransactionViaRpc(signedTx);

      expect(signature).toBeDefined();
    });
  });
});
