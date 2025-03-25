import { Connection } from "@solana/web3.js";
import { ethers } from "ethers";
import { Dispatcher as EvmDispatcher } from "./evm/dispatcher";
import { HoldSo } from "./evm/swap-hold.so";
import { KyberSwap } from "./evm/swap-kyber";
import { Okx } from "./evm/swap-okx";
import { Dispatcher as SolanaDispatcher } from "./solana/dispatcher";
import { Jupiter } from "./solana/swap-jupiter";

const cachedJsonRpcProvider = new Map<string, ethers.providers.JsonRpcProvider>();
const cachedSolanaProvider = new Map<string, Connection>();

export async function load(type: "evm" | "solana", rpc: string) {
  if (type === "evm") {
    return evm(rpc);
  }

  throw new Error("Unsupported protocol");
}

async function evm(rpc: string) {
  if (!cachedJsonRpcProvider.has(rpc)) {
    const provider = new ethers.providers.JsonRpcProvider(rpc);
    const chainId = await provider.getNetwork().then((network) => network.chainId);

    const staticProvider = new ethers.providers.StaticJsonRpcProvider(rpc, chainId);
    cachedJsonRpcProvider.set(rpc, staticProvider);
  }

  const provider = cachedJsonRpcProvider.get(rpc)!;

  const dispatcher = new EvmDispatcher(provider);
  dispatcher.load(new HoldSo(provider));
  dispatcher.load(new Okx());
  dispatcher.load(new KyberSwap());

  return dispatcher;
}

async function solana(rpc: string) {
  if (!cachedSolanaProvider.has(rpc)) {
    const connection = new Connection(rpc);
    cachedSolanaProvider.set(rpc, connection);
  }

  const connection = cachedSolanaProvider.get(rpc)!;

  const dispatcher = new SolanaDispatcher(connection);
  dispatcher.load(new Jupiter(connection));

  return dispatcher;
}
