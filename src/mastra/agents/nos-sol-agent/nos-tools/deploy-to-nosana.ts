import { createTool } from "@mastra/core";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { Client, Job } from "@nosana/sdk";

/**
 * Deploy AI Agent to Nosana Network
 */
export const deployToNosanaTool = createTool({
  id: "deployToNosana",
  description: "Deploy your AI agent to the Nosana Network by giving  docker-username , docker-image-name , docker-image-version",
  inputSchema: z.object({
    dockerUsername: z.string().min(1, "Docker username is required"),
    dockerImageName: z.string().min(1, "Docker image name is required"),
    dockerImageVersion: z.string().min(1, "Docker image version is required"),
  }),
  outputSchema: z.object({
    jobId: z.string(),
    dashboardUrl: z.string(),
    serviceUrl: z.string(),
    ipfsHash: z.string(),
    logs: z.array(z.string()).optional(),
    deploymentStatus: z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED"]),
  }),

  execute: async (args: any) => {
    console.log("deployToNosanaTool received input:", args);

    const input = args.context; 
    console.log("Deployment input:", input);

    const {
      dockerUsername,
      dockerImageName,
      dockerImageVersion,
    } = input;

    const resolvedDockerImageVersion = dockerImageVersion || "latest";
    const dockerImage = `docker.io/${dockerUsername}/${dockerImageName}:${resolvedDockerImageVersion}`;

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

    console.log(`Deploying Docker image: ${dockerImage}`);

    const jobDefinition = {
      "ops": [
        {
          "id": "agents",
          "args": {
            "gpu": true,
            "image": dockerImage,
            "expose": [
              {
                "port": 8080
              }
            ]  
          },
          "type": "container/run"
        }
      ],
      "meta": {
        "trigger": "dashboard",
        "system_requirements": {
          "required_vram": 4
        }
      },
      "type": "container",
      "version": "0.1"
    }
    console.log("Final jobDefinition:", JSON.stringify(jobDefinition, null, 2));

    try {
      console.log("Uploading job definition to IPFS...");
      const ipfsHash = await nosana.ipfs.pin(jobDefinition);
      console.log(`IPFS uploaded: ${nosana.ipfs.config.gateway}${ipfsHash}`);

      const market = new PublicKey('7AtiXMSH6R1jjBxrcYjehCkkSF7zvYWte63gwEDBcGHq');

      console.log("Posting job to Nosana market...");
      const response = await nosana.jobs.list(ipfsHash, 3600, market);
      console.log("response:", response);

      let jobId: string;
      if (response && typeof response === 'object' && 'job' in response) {
        jobId = (response as any).job;
      } else {
        console.error("Unexpected jobs.list() response:", response);
        throw new Error("Unexpected response format from Nosana jobs.list()");
      }

      const dashboardUrl = `https://dashboard.nosana.com/jobs/${jobId}`;
      const serviceUrl = `https://${jobId}.node.k8s.prd.nos.ci`;

      console.log(`Job posted! Dashboard: ${dashboardUrl}`);
      console.log(`Service URL: ${serviceUrl}`);

      // ⏳ Monitor job status (single attempt)
      console.log("Checking job deployment status (single attempt)...");
      let job: Job | null = null;
      try {
        job = await nosana.jobs.get(jobId);
      } catch (statusErr) {
        console.error("Error fetching job status:", statusErr);
      }

      let logs: string[] = [];
      if (job?.ipfsResult) {
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
      if (typeof error === 'object') {
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
