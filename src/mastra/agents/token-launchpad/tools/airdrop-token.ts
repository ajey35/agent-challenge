import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

interface AirdropTokenInput {
  mint: string;
  recipients: string[];
  amount: number;
}

interface AirdropTokenOutput {
  transfers: string[];
}

function isValidBase58(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export const airdropTokenTool = createTool({
  id: "airdropToken",
  description: "Airdrop SPL tokens to specified wallet addresses.",
  inputSchema: z.object({ mint: z.string(), recipients: z.array(z.string()), amount: z.number() }),
  outputSchema: z.object({ transfers: z.array(z.string()) }),
  execute: async (args: any): Promise<AirdropTokenOutput> => {
    console.log('airdropTokenTool received input:', args);
    const input = args && (args.mint ? args : args.input);
    if (!input) {
      throw new Error("No input provided to airdropTokenTool.");
    }
    const { mint, recipients, amount } = input;
    if (!mint || !recipients || !Array.isArray(recipients) || typeof amount !== "number") {
      throw new Error("Missing or invalid input fields for airdropTokenTool.");
    }
    if (!isValidBase58(mint)) {
      throw new Error("Invalid mint address: not a valid Solana base58 address.");
    }
    for (const rec of recipients) {
      if (!isValidBase58(rec)) {
        throw new Error(`Invalid recipient address: ${rec} is not a valid Solana base58 address.`);
      }
    }
    const conn = new Connection(process.env.SOLANA_RPC_URL!);
    const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SOLANA_SECRET_KEY!)));
    const mintPk = new PublicKey(mint);
    const senderAta = await getOrCreateAssociatedTokenAccount(conn, payer, mintPk, payer.publicKey);
    const transfers: string[] = [];
    for (const rec of recipients) {
      const recPk = new PublicKey(rec);
      const recAta = await getOrCreateAssociatedTokenAccount(conn, payer, mintPk, recPk);
      const sig = await transfer(conn, payer, senderAta.address, recAta.address, payer, amount);
      transfers.push(sig);
    }
    return { transfers };
  },
});
