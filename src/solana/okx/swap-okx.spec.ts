import { clusterApiUrl, Connection } from "@solana/web3.js";
import { Okx } from "./swap-okx";

const api_config = {
  api_key: "",
  secret_key: "",
  passphrase: "",
  project: "", // Applies only to onchainOS APIs
};

describe("[Solana SWAP] Okx", () => {
  const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  const okx = new Okx(connection);

  it("estimate swap SOL -> USDC (base case)", async () => {
    const result = await okx.estimate(
      {
        fromToken: "So11111111111111111111111111111111111111112", // WSOL
        toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
        amount: "1000000",
        slippage: "0.2",
        fee: "0.2",
      },
      {
        from: "HP5BkWju1EKTG7QMcEsqgF1ExNRYkzRkd4RsE5FeuZNN",
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
    expect(result.gas).toBeDefined();
    expect(result.gas).toMatch(/^\d+$/); // Chuỗi số, không rỗng
  });

  it("estimate swap SOL -> USDT (base case)", async () => {
    const result = await okx.estimate(
      {
        fromToken: "So11111111111111111111111111111111111111112", // WSOL
        toToken: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
        amount: "1000000",
        slippage: "0.2",
        fee: "0.2",
      },
      {
        from: "HP5BkWju1EKTG7QMcEsqgF1ExNRYkzRkd4RsE5FeuZNN",
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
          fromToken: "So11111111111111111111111111111111111111112",
          toToken: "So11111111111111111111111111111111111111112",
          amount: "1000000",
          slippage: "0.2",
          fee: "0.2",
        },
        {
          from: "HP5BkWju1EKTG7QMcEsqgF1ExNRYkzRkd4RsE5FeuZNN",
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
        fromToken: "So11111111111111111111111111111111111111112",
        toToken: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        amount: "1000000",
        slippage: "0.2",
        fee: "0.2",
      },
      {
        from: "HP5BkWju1EKTG7QMcEsqgF1ExNRYkzRkd4RsE5FeuZNN",
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
      fromToken: "So11111111111111111111111111111111111111112",
      toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      amount: "1000000",
      slippage: "0.2",
      fee: "0.2",
    };

    const baseOverride = {
      from: "HP5BkWju1EKTG7QMcEsqgF1ExNRYkzRkd4RsE5FeuZNN",
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

    it("parses flattened dexRouterList responses", async () => {
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

      jest.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: async () => mockPayload,
      } as unknown as Response);

      const result = await okx.estimate(baseParams, baseOverride);

      expect(result.gas).toBe("353674");
      expect(result.addons.amountOut).toBe("156617");
      expect(result.addons.minAmountOut).toBe("156303");
      expect(result.addons.protocols[0].swaps).toHaveLength(3);
      expect(result.addons.protocols[0].swaps[0].protocol).toBe("HumidiFi");
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
});
