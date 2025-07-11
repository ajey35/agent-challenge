import { createTool } from "@mastra/core";
import { z } from "zod";
import { Client } from "@nosana/sdk";

export const getJobRunsTool = createTool({
  id: "getJobRuns",
  description: "Get all runs for a specific Nosana job using the job address.",
  inputSchema: z.object({
    jobAddress: z.string().describe("The base-58 encoded public key of the Nosana job to fetch runs for."),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    runs: z.array(z.any()).optional(),
    error: z.string().optional(),
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
      const runs = await nosana.jobs.getRuns(jobAddress);
      console.log("runs",runs);
      
      const runsWithExplorer = (runs || []).map((run: any) => {
        let runAddress = run?.publicKey || run?.pubkey || run?.address || run?.run || run;
        if (runAddress && typeof runAddress === 'object' && typeof runAddress.toBase58 === 'function') {
          runAddress = runAddress.toBase58();
        }
        return {
          ...run,
          explorerUrl: `https://explorer.solana.com/address/${runAddress}`,
        };
      });
      return { success: true, runs: runsWithExplorer };
    } catch (err: any) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
}); 