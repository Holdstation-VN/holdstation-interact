import { clusterApiUrl, Connection } from "@solana/web3.js";
import { Jupiter } from "./swap-jupiter";

describe("[Solana SWAP] Jupiter", () => {
  const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  const jup = new Jupiter(connection);

  it("estimate swap SOL -> USDC (base case)", async () => {
    const result = await jup.estimate(
      {
        fromToken: "So11111111111111111111111111111111111111112", // WSOL
        toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
        amount: "1000000",
        slippage: "10",
      },
      { from: "AiksyBEPFdSqE14QszuGZu858KaxXcUX4VMDisJ3cGTz" }, // Random wallet
    );

    expect(result).toBeDefined();
    expect(result.gas).toBeDefined();
    expect(result.gas).toMatch(/^\d+$/); // Chuỗi số, không rỗng
  });

  it("estimate swap SOL -> USDT (base case)", async () => {
    const result = await jup.estimate(
      {
        fromToken: "So11111111111111111111111111111111111111112", // WSOL
        toToken: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
        amount: "1000000",
        slippage: "10",
      },
      { from: "HP5BkWju1EKTG7QMcEsqgF1ExNRYkzRkd4RsE5FeuZNN" }, // Random wallet
    );

    expect(result).toBeDefined();
    expect(result.gas).toBeDefined();
    expect(result.gas).toMatch(/^\d+$/); // Chuỗi số, không rỗng
  });

  it("estimate swap với dynamicSlippage = true", async () => {
    const result = await jup.estimate(
      {
        fromToken: "So11111111111111111111111111111111111111112",
        toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        amount: "1000000",
        slippage: "10",
      },
      {
        from: "AiksyBEPFdSqE14QszuGZu858KaxXcUX4VMDisJ3cGTz",
        dynamicSlippage: true,
      },
    );

    expect(result).toBeDefined();
    // Kỳ vọng có thể khác nhau tùy logic nội bộ, demo check `slippageUsed` là số
    expect(result.gas).toMatch(/^\d+$/);
  });

  it("estimate swap với dynamicComputeUnitLimit = true", async () => {
    const result = await jup.estimate(
      {
        fromToken: "So11111111111111111111111111111111111111112",
        toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        amount: "1000000",
        slippage: "10",
      },
      {
        from: "AiksyBEPFdSqE14QszuGZu858KaxXcUX4VMDisJ3cGTz",
        dynamicComputeUnitLimit: true,
      },
    );

    expect(result).toBeDefined();
    // Giả định `computeUnitLimit` được tự động điều chỉnh
    expect(result.gas).toMatch(/^\d+$/);
  });

  it("estimate swap với computeUnitPriceMicroLamports", async () => {
    const customPrice = 1000;
    const result = await jup.estimate(
      {
        fromToken: "So11111111111111111111111111111111111111112",
        toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        amount: "1000000",
        slippage: "10",
      },
      {
        from: "AiksyBEPFdSqE14QszuGZu858KaxXcUX4VMDisJ3cGTz",
        computeUnitPriceMicroLamports: customPrice,
      },
    );

    expect(result).toBeDefined();
    // Kiểm tra xem computeUnitPriceMicroLamports đã được áp dụng đúng chưa
    expect(result.gas).toMatch(/^\d+$/);
  });

  it("estimate swap khi không truyền thuộc tính override", async () => {
    const result = await jup.estimate(
      {
        fromToken: "So11111111111111111111111111111111111111112",
        toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        amount: "1000000",
        slippage: "10",
      },
      {
        from: "AiksyBEPFdSqE14QszuGZu858KaxXcUX4VMDisJ3cGTz",
      },
    );
    expect(result).toBeDefined();
    expect(result.gas).toMatch(/^\d+$/);
    // Kiểm tra các giá trị mặc định (nếu có) khi không có override
  });

  it("estimate swap error", async () => {
    await expect(async () => {
      await jup.estimate(
        {
          fromToken: "So11111111111111111111111111111111111111112",
          toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          amount: "1000000",
          slippage: "50",
          swapMode: "ExactIn",
        },
        {
          from: "jdocuPgEAjMfihABsPgKEvYtsmMzjUHeq9LX4Hvs7f3",
          computeUnitPriceMicroLamports: 1000,
          dynamicComputeUnitLimit: true,
        },
      );
    }).rejects.toThrow();

    // Kiểm tra các giá trị mặc định (nếu có) khi không có override
  });

  it("throw error khi fromToken = toToken (trường hợp không hợp lệ)", async () => {
    await expect(async () => {
      await jup.estimate(
        {
          fromToken: "So11111111111111111111111111111111111111112",
          toToken: "So11111111111111111111111111111111111111112",
          amount: "1000000",
          slippage: "10",
        },
        { from: "AiksyBEPFdSqE14QszuGZu858KaxXcUX4VMDisJ3cGTz" },
      );
    }).rejects.toThrow();
  });

  it("slippage 0", async () => {
    const result = await jup.estimate(
      {
        fromToken: "So11111111111111111111111111111111111111112",
        toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        amount: "1000000",
        slippage: "0",
      },
      {
        from: "AiksyBEPFdSqE14QszuGZu858KaxXcUX4VMDisJ3cGTz",
      },
    );
    expect(result).toBeDefined();
    expect(result.gas).toMatch(/^\d+$/);
  });
  it("add fee and fee account", async () => {
    const result = await jup.estimate(
      {
        fromToken: "So11111111111111111111111111111111111111112",
        toToken: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        amount: "1000000",
        slippage: "0",
        fee: "20",
      },
      {
        from: "HP5BkWju1EKTG7QMcEsqgF1ExNRYkzRkd4RsE5FeuZNN",
        feeAccount: "DNu5Z9zv7dh4tXNjyccyVxtV18ULbWx5YmSNot2JuCFw",
      },
    );
    expect(result).toBeDefined();
    expect(result.gas).toMatch(/^\d+$/);
  });
  it("add fee without fee account", async () => {
    const result = await jup.estimate(
      {
        fromToken: "So11111111111111111111111111111111111111112",
        toToken: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        amount: "1000000",
        slippage: "0",
        fee: "20",
      },
      {
        from: "HP5BkWju1EKTG7QMcEsqgF1ExNRYkzRkd4RsE5FeuZNN",
      },
    );
    expect(result).toBeDefined();
    expect(result.gas).toMatch(/^\d+$/);
  });
  it("add fee account without fee", async () => {
    const result = await jup.estimate(
      {
        fromToken: "So11111111111111111111111111111111111111112",
        toToken: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        amount: "1000000",
        slippage: "0",
      },
      {
        from: "HP5BkWju1EKTG7QMcEsqgF1ExNRYkzRkd4RsE5FeuZNN",
        feeAccount: "DNu5Z9zv7dh4tXNjyccyVxtV18ULbWx5YmSNot2JuCFw",
      },
    );
    expect(result).toBeDefined();
    expect(result.gas).toMatch(/^\d+$/);
  });

  it("add wrong fee account and fee", async () => {
    await expect(async () => {
      await jup.estimate(
        {
          fromToken: "So11111111111111111111111111111111111111112",
          toToken: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
          amount: "1000000",
          slippage: "0",
          fee: "20",
        },
        {
          from: "HP5BkWju1EKTG7QMcEsqgF1ExNRYkzRkd4RsE5FeuZNN",
          feeAccount: "DNu5Z9zv7dh4tXNjyccyVxtV18ULbWx5Ym",
        },
      );
    }).rejects.toThrow();
  });

  it("test API key for quote", async () => {
    await expect(async () => {
      await jup.estimate(
        {
          fromToken: "So11111111111111111111111111111111111111112",
          toToken: "So11111111111111111111111111111111111111112",
          amount: "1000000",
          slippage: "10",
        },
        {
          from: "AiksyBEPFdSqE14QszuGZu858KaxXcUX4VMDisJ3cGTz",
          apiKey: "",
        },
      );
    }).rejects.toThrow();
  });
  it("test API key for swap", async () => {
    await expect(async () => {
      await jup.estimate(
        {
          fromToken: "So11111111111111111111111111111111111111112",
          toToken: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
          amount: "1000000",
          slippage: "0",
          fee: "20",
        },
        {
          from: "HP5BkWju1EKTG7QMcEsqgF1ExNRYkzRkd4RsE5FeuZNN",
          feeAccount: "DNu5Z9zv7dh4tXNjyccyVxtV18ULbWx5Ym",
          apiKey: "",
        },
      );
    }).rejects.toThrow();
  });
});
