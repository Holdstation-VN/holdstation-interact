import { clusterApiUrl, Connection } from "@solana/web3.js";
import { Jupiter } from "./swap-jupiter";

describe("[Solana SWAP] Jupiter", () => {
  it("estimate swap SOL -> USDC", async () => {
    const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

    const jup = new Jupiter(connection);

    const result = await jup.estimate(
      {
        fromToken: "So11111111111111111111111111111111111111112", // WSOL
        toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
        amount: "1000000",
        slippage: "10",
      },
      { from: "AiksyBEPFdSqE14QszuGZu858KaxXcUX4VMDisJ3cGTz" }, // Random wallet on solscan
    );

    expect(result).toBeDefined();

    // Not null number
    expect(result.gas).toBeDefined();
    expect(result.gas).toMatch(/^\d+$/);
  });

  it("estimate swap MUTUMBO -> USDC", async () => {
    const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

    const jup = new Jupiter(connection);

    const result = await jup.estimate(
      {
        fromToken: "4StuLHHsHobhBh4BCNhreFtQ5EvSZHvbAMxJ44JWpump", // WSOL
        toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
        amount: "1000000",
        slippage: "10",
        fee: "20",
        feeAddress: "HP5BkWju1EKTG7QMcEsqgF1ExNRYkzRkd4RsE5FeuZNN",
      },
      { from: "AiksyBEPFdSqE14QszuGZu858KaxXcUX4VMDisJ3cGTz" }, // Random wallet on solscan
    );

    expect(result).toBeDefined();

    // Not null number
    expect(result.gas).toBeDefined();
    expect(result.gas).toMatch(/^\d+$/);
  });
});
