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
        },
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
      const result = await dispatcher.estimate.swap(
        {
          fromToken: "So11111111111111111111111111111111111111112", // WSOL
          toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
          amount: "1000000",
          slippage: "0.2",
          fee: "0.2",
        },
        {
          from: "AiksyBEPFdSqE14QszuGZu858KaxXcUX4VMDisJ3cGTz",
          fromTokenReferrerWalletAddress: "4NRKjuM1KNCbVcLhnzkH1xSoTYbG5mC1nADg71kU2nNp",
          okxApiConfig: {
            api_key: "",
            secret_key: "",
            passphrase: "",
            project: "",
          },
        },
      );

      console.log(1555, result);
    } catch (e: any) {
      console.error("Fail", e);
    }
  });
});
