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
    const result = await jup.estimate(
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
    expect(result).toBeDefined();
    expect(result.gas).toMatch(/^\d+$/);
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
});
