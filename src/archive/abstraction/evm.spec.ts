import { ethers } from "ethers";

import {
  Abi,
  AbiFunction,
  AbiParametersToPrimitiveTypes,
  Address,
  ExtractAbiFunction,
  ExtractAbiFunctionNames,
} from "abitype";

declare function readContract<
  abi extends Abi,
  functionName extends ExtractAbiFunctionNames<abi, "pure" | "view">,
  abiFunction extends AbiFunction = ExtractAbiFunction<abi, functionName>
>(config: {
  abi: abi;
  to: Address;
  functionName: functionName | ExtractAbiFunctionNames<abi, "pure" | "view">;
  args: AbiParametersToPrimitiveTypes<abiFunction["inputs"], "inputs">;
}): AbiParametersToPrimitiveTypes<abiFunction["outputs"], "outputs">;

declare function readContract(config: { abi: Abi; functionName: string; args: readonly unknown[] }): unknown;

describe("Get user balance", () => {
  it("should return the value > 0", async () => {
    const jsonrpc = new ethers.providers.StaticJsonRpcProvider("https://mainnet.era.zksync.io", {
      chainId: 324,
      name: "era",
    });

    const abi = [
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "owner", type: "address" }],
        outputs: [{ name: "balance", type: "uint256" }],
      },
    ] as const;

    const res = readContract({
      abi,
      to: "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e",
      functionName: "balanceOf",
      args: ["0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"],
    });

    console.log(4333, res);
  });
});
