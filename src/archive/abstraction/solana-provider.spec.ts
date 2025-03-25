import { Idl, Program } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { IDL } from "../solana/idl_raydium_amm";

describe("Get Solana Token Balance", () => {
  it("should return the balance", async () => {
    const idl: Idl = {
      version: "0.1.0",
      name: "token_program",
      instructions: [
        {
          name: "getBalance",
          accounts: [{ name: "tokenAccount", isMut: false, isSigner: false }],
          args: [
            { name: "tokenMint", type: "publicKey" }, // Define tokenMint as an argument
          ],
        },
      ],
    };

    const walletAddress = "oQPnhXAbLbMuKHESaGrbXT17CyvWCpLyERSJA9HCYd7";
    const tokenMint = "3yhsQKMeFDo3FN5vxRZnEvvr9cN67aU9qwrMrpURgHVU";

    // const res = await readSolanaProgram({
    //   idl,
    //   functionName: "getBalance",
    //   to: walletAddress,
    //   args: [new PublicKey(tokenMint)] as never, // Pass token mint as args[0]
    //   accounts: {},
    // });

    // console.log("Token balance:", res);
  });

  it("should return the balance", async () => {
    const connection = new Connection("https://api.mainnet-beta.solana.com");

    const walletAddress = "oQPnhXAbLbMuKHESaGrbXT17CyvWCpLyERSJA9HCYd7";
    const tokenMint = "3yhsQKMeFDo3FN5vxRZnEvvr9cN67aU9qwrMrpURgHVU";

    // Get associated token account
    const { getAssociatedTokenAddress } = await import("@solana/spl-token");
    const tokenAccount = await getAssociatedTokenAddress(new PublicKey(tokenMint), new PublicKey(walletAddress));

    // Get token balance
    const accountInfo = await connection.getTokenAccountBalance(tokenAccount);
    console.log("Token balance:", accountInfo.value.uiAmount);
  });

  it("test new func", async () => {
    const program = new Program(IDL, "token_program");

    const tx = await program.methods
      .swapBaseIn(1000, 0)
      .accounts({
        tokenProgram: "",
        amm: "",
      })
      .rpc({ skipPreflight: true });

    console.log(6111, tx);
  });
});
