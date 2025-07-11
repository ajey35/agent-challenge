import { Agent } from "@mastra/core/agent";
import { model } from "../../config";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { getSolBalanceTool , getAccountInfoTool , getTokenSupplyTool ,getTransactionTool ,createTokenTool , getTokenAccountsByOwnerTool, getTokenLargestAccountsTool ,deployToNosanaTool , getJobInfoTool , getJobRunsTool , getRunInfoTool , getMarketInfoTool , listAllJobsTool} from "./sol-tools";
import { instructions } from "./instruction";

const name = "Solana-Nosana-Agent";

const memory = new Memory({
    storage: new LibSQLStore({
        url: "file:../mastra.db", // Or your database URL
    }),
});


export const SolanaNosanaAgent = new Agent({
	name,
	instructions,
	model,
	tools: { 
            GetSolBalance:getSolBalanceTool,
            CreateToken:createTokenTool,
            GetAccountInfo:getAccountInfoTool,
            GetTransactionInfo:getTransactionTool,
            GetTokenSupply:getTokenSupplyTool,
            GetTokenAccountsByOwner:getTokenAccountsByOwnerTool,
            GetTokenLargetAccounts:getTokenLargestAccountsTool,
            GetJobInfo:getJobInfoTool,
            DeployToNosanaNetwork:deployToNosanaTool,
            GetAllJobRuns:getJobRunsTool,
            GetRunInfo:getRunInfoTool,
            GetMarketInfo:getMarketInfoTool,
       },
      memory
});
