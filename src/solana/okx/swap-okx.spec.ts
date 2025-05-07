import { clusterApiUrl, Connection } from "@solana/web3.js";
import { Okx } from "./swap-okx";

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
        feeAccount: "4NRKjuM1KNCbVcLhnzkH1xSoTYbG5mC1nADg71kU2nNp",
        okxApiConfig: {
          api_key: "d1807fde-aa09-4c65-972d-e2fb19a8d3d5",
          secret_key: "3F558CC8EF8EDE372B67E34354B0C34A",
          passphrase: "Holdstation@123",
          project: "29742b21435f53b92444adf54857fe84",
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
        feeAccount: "4NRKjuM1KNCbVcLhnzkH1xSoTYbG5mC1nADg71kU2nNp",
        okxApiConfig: {
          api_key: "",
          secret_key: "",
          passphrase: "",
          project: "",
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
          feeAccount: "4NRKjuM1KNCbVcLhnzkH1xSoTYbG5mC1nADg71kU2nNp",
          okxApiConfig: {
            api_key: "",
            secret_key: "",
            passphrase: "",
            project: "",
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
        feeAccount: "4NRKjuM1KNCbVcLhnzkH1xSoTYbG5mC1nADg71kU2nNp",
        okxApiConfig: {
          api_key: "",
          secret_key: "",
          passphrase: "",
          project: "",
        },
      },
    );
    expect(result).toBeDefined();
    expect(result.gas).toMatch(/^\d+$/);
  });
});
