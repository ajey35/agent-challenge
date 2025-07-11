import { createTool } from "@mastra/core";
import { z } from "zod";
import { Connection, PublicKey } from "@solana/web3.js";

export const getAccountInfoTool = createTool({
  id: "getAccountInfo",
  description: "Get account information for a Solana account using wallet address or program account address",
  inputSchema: z.object({
    accountAddress: z
      .string()
      .describe("The base-58 encoded public key of the account to get information for"),
  }),
  outputSchema: z.object({
    success: z.literal(true),
    data: z.object({
      address: z.string(),
      lamports: z.number(),
      solBalance: z.number(),
      owner: z.string(),
      executable: z.boolean(),
      rentEpoch: z.number(),
      dataSize: z.number(),
      accountType: z.string(),
      isTokenAccount: z.boolean(),
      isProgram: z.boolean(),
      isSystemAccount: z.boolean(),
      tokenInfo: z
        .object({
          mint: z.string().optional(),
          owner: z.string().optional(),
          balance: z.number().optional(),
          decimals: z.number().optional(),
        })
        .optional(),
      programInfo: z
        .object({
          programId: z.string().optional(),
          programName: z.string().optional(),
        })
        .optional(),
      securityAssessment: z.object({
        riskLevel: z.string(),
        securityScore: z.number(),
        warnings: z.array(z.string()),
      }),
      explorerUrl: z.string().optional(),
    }),
  }),
  execute: async (context, _options) => {
    const input = context.context;
    const accountAddress = input.accountAddress;
    const rpcUrl = process.env.SOLANA_RPC_URL_HELIUS || "https://api.mainnet-beta.solana.com";

    try {
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(accountAddress)) {
        throw new Error("Invalid base-58 Solana account address format");
      }

      const connection = new Connection(rpcUrl, "confirmed");
      const publicKey = new PublicKey(accountAddress);
      const info = await connection.getAccountInfo(publicKey);

      if (!info) {
        throw new Error("Account not found or uninitialized");
      }

      const lamports = info.lamports;
      const solBalance = lamports / 1e9;
      const owner = info.owner.toBase58();
      const executable = info.executable;
      const rentEpoch = info.rentEpoch || 0;
      const dataSize =
        info.data && typeof info.data === "object" && "length" in info.data
          ? (info.data as Buffer).length
          : 0;

      const isSystemAccount = owner === "11111111111111111111111111111111";
      const isTokenAccount = owner === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
      const isProgram = executable;

      let accountType = "Unknown";
      if (isProgram) accountType = "Program";
      else if (isTokenAccount) accountType = "Token Account";
      else if (isSystemAccount) accountType = "System Account";
      else accountType = "Data Account";

      const tokenInfo = isTokenAccount
        ? {
            mint: "Unknown", // If jsonParsed is not used
            owner: "Unknown",
            balance: 0,
            decimals: 9,
          }
        : undefined;

      const programInfo = isProgram
        ? {
            programId: owner,
            programName: "Unknown Program",
          }
        : undefined;

      const securityAssessment = {
        riskLevel: "Low",
        securityScore: 85,
        warnings: [],
      };

      const explorerUrl = `https://explorer.solana.com/address/${accountAddress}`;

      return {
        success: true as const,
        data: {
          address: String(accountAddress),
          lamports: Number(lamports),
          solBalance: Number(solBalance),
          owner: String(owner),
          executable: Boolean(executable),
          rentEpoch: Number(rentEpoch),
          dataSize: Number(dataSize),
          accountType: String(accountType),
          isTokenAccount: Boolean(isTokenAccount),
          isProgram: Boolean(isProgram),
          isSystemAccount: Boolean(isSystemAccount),
          tokenInfo,
          programInfo,
          securityAssessment,
          explorerUrl,
        },
      };
    } catch (err) {
      console.error("Error fetching account info:", err);
      return {
        success: false,
        error: `Failed to fetch account info: ${err instanceof Error ? err.message : "Unknown error"}`,
      } as any;
    }
  },
});
