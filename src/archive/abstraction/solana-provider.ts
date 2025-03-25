import { Address, AnchorProvider, Idl, Program } from "@project-serum/anchor";
import { PartialAccounts } from "@project-serum/anchor/dist/cjs/program/namespace/methods";
import { AllInstructions } from "@project-serum/anchor/dist/cjs/program/namespace/types";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";

export async function readSolanaProgram<
  T extends Idl,
  FunctionName extends T["instructions"][number]["name"],
  I extends AllInstructions<T>
>({
  programId = TOKEN_PROGRAM_ID,
  accounts,
  ...config
}: {
  programId?: PublicKey;
  idl: T;
  functionName: FunctionName;
  to: Address;
  args: Extract<T["instructions"][number], { name: FunctionName }>["args"];
  accounts: PartialAccounts<I["accounts"][number]>;
}): Promise<any> {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const provider = new AnchorProvider(connection, {} as any, { commitment: "confirmed" });

  const program = new Program(config.idl, programId, provider);

  // Regular program account data
  if (program.account[config.functionName]) {
    return await program.account[config.functionName].fetch(config.to);
  }

  // Regular program account data
  if (program.account[config.functionName]) {
    return await program.account[config.functionName].fetch(config.to);
  }

  // Program method calls with simulation
  if (program.methods[config.functionName]) {
    return await program.methods[config.functionName](...(config.args as any))
      .accounts(accounts) // Use dynamic accounts
      .simulate();
  }

  throw new Error(`Method ${config.functionName} not found in program`);
}
