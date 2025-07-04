import { createTool } from "@mastra/core";
import { z } from "zod";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import bs58 from "bs58";
import { isValidBase58 } from "./airdrop-sol"; // your helper

type GetBalanceOutput = {
  solBalance: number;
  splBalance?: number;
};

export const getBalanceTool = createTool({
  id: "getBalance",
  description: "Get SOL and SPL token balances for a wallet/mint or ATA.",
  inputSchema: z.object({
    wallet: z.string().optional(),
    mint: z.string().optional(),
    associatedTokenAddress: z.string().optional(),
  }),
  outputSchema: z.object({
    solBalance: z.number(),
    splBalance: z.number().optional(),
  }),

  execute: async (args: any): Promise<GetBalanceOutput> => {
    console.log('getBalanceTool received input:', args);
    // Accept input from context, input, or direct
    const input = args.context || args.input || args;
    const conn = new Connection(process.env.SOLANA_RPC_URL!, "confirmed");

    // 1️⃣ Resolve wallet
    let targetWallet: PublicKey;
    if (input.wallet) {
      if (!isValidBase58(input.wallet)) throw new Error("Invalid wallet address");
      targetWallet = new PublicKey(input.wallet);
    } else {
      const secretKey = process.env.SOLANA_SECRET_KEY;
      if (!secretKey) throw new Error("Missing SOLANA_SECRET_KEY in environment variables");
      try {
        targetWallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secretKey))).publicKey;
      } catch {
        targetWallet = Keypair.fromSecretKey(bs58.decode(secretKey)).publicKey;
      }
    }

    // 2️⃣ Get SOL balance
    const solBalance = (await conn.getBalance(targetWallet)) / 1e9;

    // 3️⃣ Get SPL token balance
    let splBalance: number | undefined;

    if (input.associatedTokenAddress) {
      if (!isValidBase58(input.associatedTokenAddress)) throw new Error("Invalid associated token address");
      const ataPk = new PublicKey(input.associatedTokenAddress);
      try {
        const tokenAccount = await getAccount(conn, ataPk);
        splBalance = Number(tokenAccount.amount);
      } catch (err: any) {
        if (err.name === "TokenAccountNotFoundError" || (err.message && err.message.includes("Account does not exist"))) {
          splBalance = 0;
        } else {
          throw err;
        }
      }
    } else if (input.mint) {
      if (!isValidBase58(input.mint)) throw new Error("Invalid mint address");
      const mintPk = new PublicKey(input.mint);
      try {
        const ata = await getAssociatedTokenAddress(mintPk, targetWallet);
        const tokenAccount = await getAccount(conn, ata);
        splBalance = Number(tokenAccount.amount);
      } catch (err: any) {
        if (err.name === "TokenAccountNotFoundError" || (err.message && err.message.includes("Account does not exist"))) {
          splBalance = 0;
        } else {
          throw err;
        }
      }
    }

    return { solBalance, splBalance };
  },
});
