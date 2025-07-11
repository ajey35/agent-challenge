import { createTool } from "@mastra/core";
import { z } from "zod";
import { Client } from "@nosana/sdk";

export const getMarketInfoTool = createTool({
  id: "getMarketInfo",
  description: "Get details about a specific Nosana market using the market address.",
  inputSchema: z.object({
    marketAddress: z.string().describe("The base-58 encoded public key of the Nosana market to fetch."),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    market: z.any().optional(),
    error: z.string().optional(),
    explorerUrl: z.string().optional(),
  }),
  execute: async (context: any) => {
    const { marketAddress } = context.context;
    const privateKey: string = process.env.NOSANA_PVT_KEY ?? '';
    if (!privateKey) {
      return { success: false, error: "Missing NOSANA_PVT_KEY in environment variables." };
    }
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(marketAddress)) {
      return { success: false, error: "Invalid base-58 Solana market address format." };
    }
    try {
      const nosana = new Client('mainnet', privateKey);
      const market = await nosana.jobs.getMarket(marketAddress);
      const explorerUrl = `https://explorer.solana.com/address/${marketAddress}`;
      return { success: true, market, explorerUrl };
    } catch (err: any) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
}); 