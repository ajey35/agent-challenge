import { createTool } from "@mastra/core";
import { z } from "zod";
import { Client } from "@nosana/sdk";

export const getRunInfoTool = createTool({
  id: "getRunInfo",
  description: "Get details for a specific Nosana run using the run address.",
  inputSchema: z.object({
    runAddress: z.string().describe("The base-58 encoded public key of the Nosana run to fetch."),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    run: z.any().optional(),
    error: z.string().optional(),
    explorerUrl: z.string().optional(),
  }),
  execute: async (context: any) => {
    const { runAddress } = context.context;
    const privateKey: string = process.env.NOSANA_PVT_KEY ?? '';
    if (!privateKey) {
      return { success: false, error: "Missing NOSANA_PVT_KEY in environment variables." };
    }
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(runAddress)) {
      return { success: false, error: "Invalid base-58 Solana run address format." };
    }
    try {
      const nosana = new Client('mainnet', privateKey);
      const run = await nosana.jobs.getRun(runAddress);
      const explorerUrl = `https://explorer.solana.com/address/${runAddress}`;
      return { success: true, run, explorerUrl };
    } catch (err: any) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
}); 