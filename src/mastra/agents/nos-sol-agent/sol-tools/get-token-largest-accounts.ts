import { createTool } from "@mastra/core";
import { z } from "zod";

export const getTokenLargestAccountsTool = createTool({
  id: "getTokenLargestAccounts",
  description: "Get the Top 10 largest token accounts for a given SPL Token mint. Useful for analyzing token distribution and identifying major holders.",
  inputSchema: z.object({
    mintAddress: z.string().describe("The base-58 encoded public key of the token mint to analyze."),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.object({
      largestAccounts: z.array(
        z.object({
          address: z.string(),
          amount: z.string(),
          decimals: z.number(),
          uiAmount: z.number().nullable(),
          uiAmountString: z.string(),
          explorerUrl: z.string(),
        })
      ),
      contextSlot: z.number(),
    })
  }),
  execute: async (context: any) => {
    const { mintAddress } = context.context;
    console.log("mint",mintAddress)
    const rpcUrl = "https://mainnet.helius-rpc.com/?api-key=33b9c27f-ea85-4058-ac3f-e34b0876de4c"
    try {
      const body = {
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenLargestAccounts",
        params: [mintAddress],
      };
      const res = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.result || !json.result.value) {
        console.error("Full RPC response for diagnostics:", JSON.stringify(json, null, 2));
        throw new Error(`Invalid RPC response: ${json.error ? JSON.stringify(json.error) : "No result.value returned. Check mint address and RPC endpoint."}`);
      }
      const largestAccounts = json.result.value.slice(0, 10).map((acc: any) => ({
        address: acc.address,
        amount: String(acc.amount),
        decimals: Number(acc.decimals),
        uiAmount: acc.uiAmount !== undefined && acc.uiAmount !== null ? Number(acc.uiAmount) : null,
        uiAmountString: String(acc.uiAmountString),
        explorerUrl: `https://explorer.solana.com/address/${acc.address}`,
      }));
      return {
        success: true,
        data: {
          largestAccounts,
          contextSlot: json.result.context.slot,
        }
      };
    } catch (err) {
      console.error("Error fetching largest token accounts:", err);
      return {
        success: false,
        data: {
          largestAccounts: [],
          contextSlot: 0,
        }
      };
    }
  },
}); 