import { createTool } from "@mastra/core";
import { z } from "zod";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { getNetworkFromRpcUrl, isValidBase58 } from "./network-utils";

export const getSolBalanceTool = createTool({
  id: "getSolBalance",
  description: "Get SOL balance for this address or public key",
  inputSchema: z.object({
    wallet: z.string().optional(),
  }),
  outputSchema: z.object({
    solBalance: z.number(),
  }),

  execute: async (args: any) => {
    console.log('getSolBalanceTool received input:', args);
    
    const input = args.context;
    console.log("input", input);
    
    const rpcUrl = process.env.SOLANA_RPC_URL;
    console.log("RPC URL:", rpcUrl ? "Set" : "Not set");
    
    if (!rpcUrl) {
      throw new Error("Missing SOLANA_RPC_URL in environment variables. Please set SOLANA_RPC_URL to a valid Solana RPC endpoint (e.g., https://api.devnet.solana.com)");
    }
    
    const conn = new Connection(rpcUrl, "confirmed");
    const network = getNetworkFromRpcUrl(rpcUrl);
    console.log(`Connected to Solana ${network} network`);

    let targetWallet: PublicKey;
    if (input.wallet) {
      console.log("Using provided wallet:", input.wallet);
      if (!isValidBase58(input.wallet)) {
        throw new Error("Invalid wallet address");
      }
      targetWallet = new PublicKey(input.wallet);
    } else {
      console.log("Using default wallet from environment");
      const secretKey = process.env.SOLANA_SECRET_KEY;
      if (!secretKey) {
        throw new Error("Missing SOLANA_SECRET_KEY in environment variables");
      }
      try {
        targetWallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secretKey))).publicKey;
      } catch {
        targetWallet = Keypair.fromSecretKey(bs58.decode(secretKey)).publicKey;
      }
    }

    console.log("Target wallet:", targetWallet.toString());

    try {
      console.log("Fetching balance...");
      const solBalance = await conn.getBalance(targetWallet, "confirmed");
      console.log("Raw balance (lamports):", solBalance);
      const balanceInSol = solBalance / 1e9;
      console.log("Balance in SOL:", balanceInSol);
      return { solBalance: balanceInSol };
    } catch (error) {
      console.error("Error fetching SOL balance:", error);
      
      if (error instanceof Error) {
        if (error.message.includes("fetch failed")) {
          throw new Error(`Network error: Unable to connect to Solana RPC at ${rpcUrl}. Please check your internet connection and ensure the RPC endpoint is accessible.`);
        } else if (error.message.includes("429")) {
          throw new Error("Rate limit exceeded. Please try again later or use a different RPC endpoint.");
        } else if (error.message.includes("404")) {
          throw new Error("Account not found. The wallet address may not exist on this network.");
        } else {
          throw new Error(`Failed to get SOL balance: ${error.message}`);
        }
      } else {
        throw new Error(`Failed to get SOL balance: ${error}`);
      }
    }
  },
});