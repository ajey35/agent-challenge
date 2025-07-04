import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";


interface AirdropSOLInput {
  amount?: number;
  pubkey?: string;
}

interface AirdropSOLOutput {
  signature: string;
}

export function isValidBase58(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export const airdropSOLTool = createTool({
  id: "airdropSOL",
  description: "Airdrop SOL to the user's wallet (Devnet).",
  inputSchema: z.object({ amount: z.number().optional().default(1), pubkey: z.string().optional() }),
  outputSchema: z.object({ signature: z.string() }),
  execute: async (args: any): Promise<AirdropSOLOutput> => {
    console.log('airdropSOLTool received input:', args);
    const { amount, pubkey } = args.amount || args.pubkey ? args : args.input;
    const conn = new Connection(process.env.SOLANA_RPC_URL!);
    let targetPubkey: PublicKey;
    if (pubkey) {
      if (!isValidBase58(pubkey)) {
        throw new Error("Invalid pubkey: not a valid Solana base58 address.");
      }
      targetPubkey = new PublicKey(pubkey);
    } else {
      // Support both base58 and JSON array secret keys
      let user: Keypair;
      try {
        user = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SOLANA_SECRET_KEY!)));
      } catch {
        user = Keypair.fromSecretKey(bs58.decode(process.env.SOLANA_SECRET_KEY!));
      }
      if (!isValidBase58(user.publicKey.toBase58())) {
        throw new Error("Invalid user public key: not a valid Solana base58 address.");
      }
      targetPubkey = user.publicKey;
    }
    const sig = await conn.requestAirdrop(targetPubkey, amount * LAMPORTS_PER_SOL);
    await conn.confirmTransaction(sig);
    return { signature: sig };
  },
});
