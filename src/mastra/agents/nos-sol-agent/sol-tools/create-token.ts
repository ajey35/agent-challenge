import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import bs58 from "bs58";
import { getNetworkFromRpcUrl, getExplorerUrl, isValidBase58 } from "./network-utils";

// ➤ Input & Output Types
interface CreateTokenInput {
  name: string;
  symbol: string;
  initialSupply: number;
  decimals?: number;
}

interface CreateTokenOutput {
  mintAddress: string;
  tokenAccount: string;
  summary: string;
  explorerUrls: {
    mint: string;
    tokenAccount: string;
  };
}

// ➤ Token Creation Tool
export const createTokenTool = createTool({
  id: "createToken",
  description: "Create an token (spl) and mint initial supply by taking name,symbol,initialsupply,decimals as input",
  inputSchema: z.object({
    name: z.string(),
    symbol: z.string(),
    initialSupply: z.number(),
    decimals: z.number().optional().default(9),
  }),
  outputSchema: z.object({
    mintAddress: z.string(),
    tokenAccount: z.string(),
    summary: z.string(),
    explorerUrls: z.object({
      mint: z.string(),
      tokenAccount: z.string(),
    }),
  }),

  execute: async (args: any): Promise<CreateTokenOutput> => {
    console.log("createTokenTool received input:", args);

    // Robust input extraction: try all possible locations
    let input: any = undefined;
    if (args && typeof args === "object") {
      if (args.context && typeof args.context === "object") {
        if (args.context.input && typeof args.context.input === "object") {
          input = args.context.input;
        } else if (Object.keys(args.context).length > 0) {
          input = args.context;
        }
      } else if (args.input && typeof args.input === "object") {
        input = args.input;
      } else {
        input = args;
      }
    } else {
      input = args;
    }
    console.log("createTokenTool input after extraction:", input);

    const { name, symbol, initialSupply, decimals } = input || {};

    if (!name || !symbol || typeof initialSupply !== "number") {
      throw new Error("Missing required input fields: name, symbol, or initialSupply");
    }

    const rpcUrl = process.env.SOLANA_RPC_URL;
    if (!rpcUrl) {
      throw new Error("Missing SOLANA_RPC_URL in environment variables");
    }
    
    const conn = new Connection(rpcUrl, "confirmed");
    const network = getNetworkFromRpcUrl(rpcUrl);
    console.log(`Connected to Solana ${network} network`);

    // Load payer keypair from env
    let payer: Keypair;
    try {
      payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SOLANA_SECRET_KEY!)));
    } catch {
      payer = Keypair.fromSecretKey(bs58.decode(process.env.SOLANA_SECRET_KEY!));
    }

    if (!isValidBase58(payer.publicKey.toBase58())) {
      throw new Error("Invalid payer public key: not a valid Solana base58 address.");
    }

    // Check payer SOL balance
    const payerBalance = (await conn.getBalance(payer.publicKey)) / 1e9;
    console.log("payer SOL balance:", payerBalance);
    if (payerBalance < 0.05) {
      throw new Error(`Payer has insufficient SOL (${payerBalance} SOL). Please airdrop more SOL to ${payer.publicKey.toBase58()} on ${network}.`);
    }

    // Create mint
    const mint = await createMint(conn, payer, payer.publicKey, null, decimals);
    console.log("Mint created:", mint.toBase58());

    // Create or get payer's ATA
    const ata = await getOrCreateAssociatedTokenAccount(conn, payer, mint, payer.publicKey);
    console.log("Associated Token Account:", ata.address.toBase58());

    // Mint tokens to the payer's ATA
    await mintTo(conn, payer, mint, ata.address, payer, BigInt(initialSupply) * BigInt(10 ** decimals));
    console.log(`Minted ${initialSupply} * 10^${decimals} tokens to ATA ${ata.address.toBase58()}`);

    return {
      mintAddress: mint.toBase58(),
      tokenAccount: ata.address.toBase58(),
      summary: `✅ Created token "${name}" (${symbol}) with mint ${mint.toBase58()} and token account ${ata.address.toBase58()} on ${network}`,
      explorerUrls: {
        mint: getExplorerUrl(mint.toBase58(), network, rpcUrl),
        tokenAccount: getExplorerUrl(ata.address.toBase58(), network, rpcUrl),
      },
    };
  },
});