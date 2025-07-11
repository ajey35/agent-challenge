import { createTool } from "@mastra/core";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";

// SPL Token Program ID (default)
const SPL_TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

export const getTokenAccountsByOwnerTool = createTool({
  id: "getTokenAccountsByOwner",
  description: "Get all SPL token accounts owned by a given Solana public address (wallet). Returns parsed token account info for each token holding.",
  inputSchema: z.object({
    ownerAddress: z.string().describe("The base-58 encoded public key of the wallet to query for token accounts."),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    tokenAccounts: z.array(
      z.object({
        tokenAccount: z.string(),
        mint: z.string(),
        amount: z.string(),
        decimals: z.number(),
        uiAmount: z.number().nullable(),
        uiAmountString: z.string(),
        state: z.string(),
        isNative: z.boolean(),
        owner: z.string(),
        rentEpoch: z.number(),
        explorerUrl: z.string(),
      })
    ),
    contextSlot: z.number(),
  }),
  execute: async (context: any) => {
    const { ownerAddress } = context.context;
    console.log("getowneradd",ownerAddress);
    
    const rpcUrl = process.env.SOLANA_RPC_URL_HELIUS || "https://api.mainnet-beta.solana.com";
    const ownerPubKey = new PublicKey(ownerAddress);
    try {
      const body = {
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [
          ownerPubKey.toBase58(),
          { programId: SPL_TOKEN_PROGRAM_ID },
          { encoding: "jsonParsed", commitment: "confirmed" }
        ]
      };
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!json.result || !json.result.value) throw new Error("Invalid RPC response");
      const tokenAccounts = json.result.value
        .map((acc: any) => {
          const data = acc.account.data;
          if (
            data &&
            typeof data === "object" &&
            data.parsed &&
            data.parsed.info &&
            data.parsed.info.tokenAmount
          ) {
            const info = data.parsed.info;
            const tokenAmount = info.tokenAmount;
            const tokenAccountAddress = acc.pubkey;
            const explorerUrl = `https://explorer.solana.com/address/${tokenAccountAddress}`;
            return {
              tokenAccount: tokenAccountAddress,
              mint: String(info.mint),
              amount: String(tokenAmount.amount),
              decimals: Number(tokenAmount.decimals),
              uiAmount: tokenAmount.uiAmount !== undefined && tokenAmount.uiAmount !== null ? Number(tokenAmount.uiAmount) : null,
              uiAmountString: String(tokenAmount.uiAmountString),
              state: String(info.state),
              isNative: Boolean(info.isNative),
              owner: String(info.owner),
              rentEpoch: typeof acc.account.rentEpoch === "number" ? acc.account.rentEpoch : 0,
              explorerUrl,
            };
          }
          return null;
        })
        .filter((x: any) => x !== null);
      return {
        success: true,
        tokenAccounts,
        contextSlot: json.result.context.slot,
      };
    } catch (err) {
      console.error("Error fetching token accounts by owner (manual RPC):", err);
      return {
        success: false,
        tokenAccounts: [],
        contextSlot: 0,
      };
    }
  },
}); 