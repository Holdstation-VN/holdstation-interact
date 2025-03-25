import { load } from "./main";

describe("Evm compatibility", () => {
  it("should be able to run tests", () => {
    expect(true).toBe(true);
  });

  it("evm estimate", async () => {
    try {
      const dispatcher = await load("evm", "https://mainnet.era.zksync.io");
      const result = await dispatcher.estimate.transfer(
        {
          tokenAddress: "0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4", // USDC
          to: "0x690f4e2f19717A06E1C146B2dCE68c2d23e36f4c", // Random address
          amount: "100000",
        },
        {
          from: "0xf6F23DB1D2dBd51411D789FDBA09e2c842f7A3E1",
        }
      );

      console.log(1555, result);
    } catch (e: any) {
      console.error("Fail", e);
    }
  });
});

describe("Solana compatibility", () => {
  it("should be able to run tests", () => {
    expect(true).toBe(true);
  });

  it("solana estimate", async () => {
    try {
      const dispatcher = await load("solana", "https://api.mainnet-beta.solana.com");
      const result = await dispatcher.estimate.transfer(
        {
          tokenAddress: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", // USDC
          to: "7v8J5o3jRQ5sJUg8u7cL4bXHq7tF1Q3Fb6YpZg7Qd7Q6", // Random address
          amount: "100000",
        }
        // {
        //   from: {
        //     publicKey: "7v8J5o3jRQ5sJUg8u7cL4bXHq7tF1Q3Fb6YpZg7Qd7Q6",
        //     secretKey: "7v8J5o3jRQ5sJUg8u7cL4bXHq7tF1Q3Fb6YpZg7Qd7Q6",
        //   },
        // }
      );

      console.log(1555, result);
    } catch (e: any) {
      console.error("Fail", e);
    }
  });
});
