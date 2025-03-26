import { ethers } from "ethers";
import { HoldSo } from "./swap-hold.so";

describe("Holdso test", () => {
  it("should be able to run tests", () => {
    expect(true).toBe(true);
  });

  it("evm estimate", async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider("https://rpc.berachain.com");
      await provider.getNetwork();

      const holdso = new HoldSo(provider);
      const result = await holdso.estimate(
        {
          fromToken: "0xFF0a636Dfc44Bb0129b631cDd38D21B613290c98",
          toToken: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // Random address
          amount: "10000000000000000000",
          slippage: "1",
        },
        {
          from: "0x7758a1378b76024C953348469E700a1624c0f597",
        }
      );

      console.log("result", result);
    } catch (e: any) {
      console.error("Fail", e);
    }
  });
});
