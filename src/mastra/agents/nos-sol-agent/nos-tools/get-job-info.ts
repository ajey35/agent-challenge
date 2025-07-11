import { createTool } from "@mastra/core";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { Client } from "@nosana/sdk";

export const getJobInfoTool = createTool({
  id: "getJobInfo",
  description: "Get the  Nosana job information by job address.",
  inputSchema: z.object({
    jobAddress: z.string().describe("The base-58 encoded public key of the Nosana job to fetch."),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    job: z.any().optional(),
    error: z.string().optional(),
    explorerUrl: z.string().optional(),
  }),
  execute: async (context: any) => {
    const { jobAddress } = context.context;
    const privateKey: string = process.env.NOSANA_PVT_KEY ?? '';
    if (!privateKey) {
      return { success: false, error: "Missing NOSANA_PVT_KEY in environment variables." };
    }
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(jobAddress)) {
      return { success: false, error: "Invalid base-58 Solana job address format." };
    }
    try {
      const nosana = new Client('mainnet', privateKey);
      const job = await nosana.jobs.get(jobAddress);
      const explorerUrl = `https://explorer.solana.com/address/${jobAddress}`;
      return { success: true, job, explorerUrl };
    } catch (err: any) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
}); 