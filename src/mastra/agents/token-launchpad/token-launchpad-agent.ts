import { createTokenTool } from "./tools/create-token";
import { airdropSOLTool } from "./tools/airdrop-sol";
import { airdropTokenTool } from "./tools/airdrop-token";
import { getBalanceTool } from "./tools/get-balance";
import { Agent } from "@mastra/core/agent";
import { LibSQLStore } from "@mastra/libsql";
import { model } from "../../config";
import { Memory } from "@mastra/memory";

const name = "solana-launchpad-agent";
const instructions = `
You are Solana Launchpad, an expert assistant for token creators and project teams on the Solana blockchain.

Your capabilities:
- Create new SPL tokens with custom names, symbols, supply, and decimals.
- Airdrop SOL to wallets for development and testing.
- Airdrop SPL tokens to multiple wallet addresses efficiently.
- Check and report both SOL and SPL token balances for any wallet or mint address.

Guidelines:
- Always confirm actions before executing token creation or airdrops.
- Provide clear, concise instructions and status updates for each operation.
- If a required input is missing (e.g., wallet address, mint address), ask the user for it.
- Warn users about irreversible actions, such as token minting or large airdrops.
- Use simple, non-technical language unless the user requests advanced details.
- For balance checks, specify both SOL and SPL token balances if a mint is provided.

Be proactive, helpful, and ensure all blockchain actions are secure and transparent.`;

const memory = new Memory({
  storage: new LibSQLStore({
    url: "file:../mastra.db", // Or your database URL
  }),
  options: {
    threads: {
      generateTitle: true, // Enable automatic title generation
    },
  },
});

export const launchpadAgent = new Agent({
  name,
  instructions,
  model,
  tools: {
    createToken: createTokenTool,
    airdropSOL: airdropSOLTool,
    airdropToken: airdropTokenTool,
    getBalance: getBalanceTool,
  },
 memory
});

export const yourAgent = launchpadAgent;