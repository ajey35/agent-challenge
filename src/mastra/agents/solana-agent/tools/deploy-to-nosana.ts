import { createTool } from "@mastra/core";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { Client, Job, sleep } from "@nosana/sdk";

/**
 * Deploy AI Agent to Nosana Network
 */
export const deployToNosanaTool = createTool({
  id: "deployToNosana",
  description: "Deploy your AI agent to the Nosana Network using your Docker image for distributed computing",
  inputSchema: z.object({
    dockerUsername: z.string().min(1, "Docker username is required"),
    dockerImageName: z.string().min(1, "Docker image name is required"),
    dockerTag: z.string().default("latest"),
    gpuRequired: z.boolean().default(true),
    vramRequired: z.number().min(1).max(24).default(4),
    port: z.number().min(1).max(65535).default(8080),
  }),
  outputSchema: z.object({
    jobId: z.string(),
    dashboardUrl: z.string(),
    serviceUrl: z.string(),
    ipfsHash: z.string(),
    logs: z.array(z.string()).optional(),
    deploymentStatus: z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED"]),
    error: z.string().optional(),
  }),

  execute: async (args: any) => {
    console.log("deployToNosanaTool received input:", args);

    const input = args.context;
    console.log("Deployment input:", input);

    const {
      dockerUsername,
      dockerImageName,
      dockerTag,
      gpuRequired,
      vramRequired,
      port,
    } = input;

    const privateKey: string = process.env.NOSANA_PVT_KEY ?? '';
    if (!privateKey) throw new Error("Missing NOSANA_PVT_KEY in environment variables.");

    const nosana = new Client('mainnet', privateKey);
    console.log(`Connected wallet: ${nosana.solana.wallet.publicKey.toString()}`);

    try {
      const solBalance = await nosana.solana.getSolBalance();
      const nosBalance = await nosana.solana.getNosBalance();
      console.log(`SOL balance: ${solBalance} SOL`);
      console.log(`NOS balance: ${nosBalance?.amount.toString() || '0'} NOS`);
    } catch (error) {
      console.warn("Warning: Could not fetch balance information:", error);
    }

    const dockerImage = `docker.io/${dockerUsername}/${dockerImageName}:${dockerTag}`;
    console.log(`🐳 Deploying Docker image: ${dockerImage}`);

    // ✅ Correct job definition (ensure 'op' is used instead of 'type')
    const jobDefinition = {
      type: "container",
      version: "0.1",
      ops: [
        {
          op: "container/run",
          id: "agents",
          args: {
            gpu: gpuRequired,
            image: dockerImage,
            expose: [{ port }],
          },
        },
      ],
      meta: {
        trigger: "dashboard",
        system_requirements: { required_vram: vramRequired },
      },
    };

    console.log("Final jobDefinition:", JSON.stringify(jobDefinition, null, 2));

    try {
      console.log("Uploading job definition to IPFS...");
      const ipfsHash = "QmegsND36KzzCjjpEmEW9C9JsVset3pBtsPqNa8D78HEms"
      // const ipfsHash = await nosana.ipfs.pin(jobDefinition);
      // https://nosana.mypinata.cloud/ipfs/QmegsND36KzzCjjpEmEW9C9JsVset3pBtsPqNa8D78HEms
      console.log(`IPFS uploaded: ${nosana.ipfs.config.gateway}${ipfsHash}`);

      const market = new PublicKey('7AtiXMSH6R1jjBxrcYjehCkkSF7zvYWte63gwEDBcGHq');;

      console.log("Posting job to Nosana market...");
      let response;
      try {
        response = await nosana.jobs.list(
          ipfsHash,
          3600, // timeout in seconds
          market
        );
      } catch (e: any) {
        console.error("Error posting job to Nosana market:", e);
        return {
          jobId: "",
          dashboardUrl: "",
          serviceUrl: "",
          ipfsHash,
          logs: [] as string[],
          deploymentStatus: "FAILED" as const,
          error: e?.error ? String(e.error) : e?.message ? String(e.message) : String(e),
        };
      }

      let jobId: string;
      if (response && typeof response === 'object' && 'job' in response) {
        jobId = (response as any).job;
      } else {
        console.error("Unexpected jobs.list() response:", response);
        return {
          jobId: "",
          dashboardUrl: "",
          serviceUrl: "",
          ipfsHash,
          logs: [] as string[],
          deploymentStatus: "FAILED" as const,
          error: "Unexpected response format from Nosana jobs.list()",
        };
      }

      const dashboardUrl = `https://dashboard.nosana.com/jobs/${jobId}`;
      const serviceUrl = `https://${jobId}.node.k8s.prd.nos.ci`;

      console.log(`Job posted! Dashboard: ${dashboardUrl}`);
      console.log(`Service URL: ${serviceUrl}`);

      // ⏳ Monitor job status (try only once, no retry loop)
      console.log("Checking job deployment status (single attempt)...");
      let job: Job | null = null;
      try {
        job = await nosana.jobs.get(jobId);
      } catch (statusErr) {
        console.error("Error fetching job status:", statusErr);
      }

      let logs: string[] = [];
      if (job && job.ipfsResult) {
        try {
          const result = await nosana.ipfs.retrieve(job.ipfsResult);
          logs = result.opStates?.[0]?.logs ?? [];
          console.log(`Job logs retrieved (${logs.length} lines)`);
        } catch (error) {
          console.warn("Warning: Could not retrieve job logs:", error);
        }
      }

      const deploymentStatus = job?.state as "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

      console.log(`Final job state: ${deploymentStatus}`);
      return {
        jobId,
        dashboardUrl,
        serviceUrl,
        ipfsHash,
        logs,
        deploymentStatus,
      };

    } catch (error: any) {
      console.error("Deployment failed:", error);
      if (error && typeof error === 'object') {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          error,
        });
      }
      throw new Error(`Deployment failed: ${error && error.message ? error.message : error}`);
    }
  },
});
