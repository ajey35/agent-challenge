import { Connection, TransactionSignature, Finality } from '@solana/web3.js';
import axios from 'axios';

export interface GetTransactionParams {
  transactionSignature: string;
  options?: {
    commitment?: 'processed' | 'confirmed' | 'finalized';
    encoding?: 'json' | 'jsonParsed' | 'base58' | 'base64';
    maxSupportedTransactionVersion?: number;
  };
}

export interface TransactionMeta {
  err: any;
  fee: number;
  preBalances: number[];
  postBalances: number[];
  preTokenBalances?: any[] | null;
  postTokenBalances?: any[] | null;
  innerInstructions?: any[] | null;
  logMessages?: string[] | null;
  loadedAddresses?: {
    writable: any[];
    readonly: any[];
  };
  returnData?: {
    programId: string;
    data: [string, string];
  };
  computeUnitsConsumed?: number;
  status?: any;
  rewards?: any[];
}

export interface TransactionInfo {
  slot: number;
  blockTime: number | null;
  meta: TransactionMeta | null;
  transaction: any;
  version: 'legacy' | number | undefined;
}

export interface GetTransactionResult {
  success: boolean;
  data?: {
    transaction: TransactionInfo;
    analysis: {
      transactionSummary: {
        signature: string;
        slot: number;
        blockTime: string | null;
        status: 'success' | 'failed' | 'unknown';
        fee: number;
        computeUnits: number | null;
        version: string;
      };
      balanceChanges: {
        totalChange: number;
        accountChanges: Array<{
          account: string;
          preBalance: number;
          postBalance: number;
          change: number;
          changeFormatted: string;
        }>;
        tokenChanges: Array<{
          account: string;
          mint: string;
          preBalance: string;
          postBalance: string;
          change: string;
        }>;
      };
      instructionAnalysis: {
        totalInstructions: number;
        programs: string[];
        instructionTypes: string[];
        innerInstructions: number;
        logMessages: string[];
        errorDetails: string | null;
      };
      performanceMetrics: {
        computeUnitsConsumed: number | null;
        computeUnitsEfficiency: 'low' | 'medium' | 'high' | 'unknown';
        feeEfficiency: 'low' | 'medium' | 'high' | 'unknown';
        recommendations: string[];
      };
    };
  };
  error?: string;
  recommendations?: string[];
}

export async function getTransaction(
  params: GetTransactionParams
): Promise<GetTransactionResult> {
  const { transactionSignature, options = {} } = params;
  
  try {
    // Validate required parameters
    if (!transactionSignature) {
      return {
        success: false,
        error: 'Transaction signature is required',
        recommendations: ['Provide a valid transaction signature']
      };
    }

    // Validate signature format (basic check)
    if (transactionSignature.length < 80 || transactionSignature.length > 100) {
      return {
        success: false,
        error: 'Invalid transaction signature format',
        recommendations: ['Provide a valid base-58 encoded transaction signature']
      };
    }

    // Try web3.js method first
    try {
      const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
      
      const transaction = await connection.getTransaction(
        transactionSignature as TransactionSignature,
        {
          commitment: options.commitment as Finality,
          maxSupportedTransactionVersion: options.maxSupportedTransactionVersion ?? 0
        }
      );

      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found or not confirmed',
          recommendations: [
            'Check if the transaction signature is correct',
            'Verify the transaction has been confirmed',
            'Try a different commitment level'
          ]
        };
      }

      // Convert web3.js transaction to our TransactionInfo format
      const transactionInfo: TransactionInfo = {
        slot: transaction.slot,
        blockTime: transaction.blockTime ?? null,
        meta: transaction.meta ? {
          ...transaction.meta,
          loadedAddresses: transaction.meta.loadedAddresses ? {
            writable: transaction.meta.loadedAddresses.writable || [],
            readonly: transaction.meta.loadedAddresses.readonly || []
          } : undefined
        } : null,
        transaction: transaction.transaction,
        version: transaction.version
      };

      return analyzeTransaction(transactionInfo, transactionSignature);

    } catch (web3Error) {
      console.warn('Web3.js method failed, trying direct HTTP:', web3Error);
      
      // Fallback to direct HTTP method
      return await getTransactionHttp(params);
    }

  } catch (error) {
    return {
      success: false,
      error: `Failed to get transaction: ${error}`,
      recommendations: [
        'Check your RPC endpoint configuration',
        'Verify the transaction signature is valid',
        'Ensure you have proper network connectivity'
      ]
    };
  }
}

async function getTransactionHttp(
  params: GetTransactionParams
): Promise<GetTransactionResult> {
  const { transactionSignature, options = {} } = params;
  
  try {
    const rpcUrl = process.env.SOLANA_RPC_URL_HELIUS || 'https://api.mainnet-beta.solana.com';
    
    const requestBody = {
      jsonrpc: '2.0',
      id: 1,
      method: 'getTransaction',
      params: [
        transactionSignature,
        {
          commitment: options.commitment,
          encoding: options.encoding || 'jsonParsed',
          maxSupportedTransactionVersion: options.maxSupportedTransactionVersion ?? 0
        }
      ]
    };

    const response = await axios.post(rpcUrl, requestBody, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    if (response.data.error) {
      return {
        success: false,
        error: `RPC Error: ${response.data.error.message}`,
        recommendations: [
          'Check the transaction signature format',
          'Verify the commitment level is valid',
          'Ensure your RPC endpoint supports this method'
        ]
      };
    }

    if (!response.data.result) {
      return {
        success: false,
        error: 'Transaction not found or not confirmed',
        recommendations: [
          'Check if the transaction signature is correct',
          'Verify the transaction has been confirmed',
          'Try a different commitment level'
        ]
      };
    }

    return analyzeTransaction(response.data.result, transactionSignature);

  } catch (error: any) {
    return {
      success: false,
      error: `HTTP request failed: ${error.message}`,
      recommendations: [
        'Check your RPC endpoint URL',
        'Verify network connectivity',
        'Consider using a different RPC provider'
      ]
    };
  }
}

function analyzeTransaction(
  transaction: TransactionInfo,
  signature: string
): GetTransactionResult {
  try {
    if (!transaction) {
      return {
        success: false,
        error: 'Invalid transaction data',
        recommendations: ['The transaction may not exist or be invalid']
      };
    }

    const meta = transaction.meta;
    const blockTime = transaction.blockTime ? new Date(transaction.blockTime * 1000).toISOString() : null;
    const status = meta?.err ? 'failed' : 'success';
    const fee = meta?.fee || 0;
    const computeUnits = meta?.computeUnitsConsumed || null;
    const version = transaction.version || 'unknown';

    // Balance changes analysis
    const balanceChanges = analyzeBalanceChanges(meta);
    
    // Instruction analysis
    const instructionAnalysis = analyzeInstructions(transaction, meta);
    
    // Performance metrics
    const performanceMetrics = analyzePerformance(meta);

    return {
      success: true,
      data: {
        transaction,
        analysis: {
          transactionSummary: {
            signature,
            slot: transaction.slot,
            blockTime,
            status,
            fee,
            computeUnits,
            version: version.toString()
          },
          balanceChanges,
          instructionAnalysis,
          performanceMetrics
        }
      },
      recommendations: [
        'Monitor transaction status for confirmation',
        'Check log messages for detailed execution info',
        'Verify balance changes match expectations',
        'Review compute units for optimization opportunities'
      ]
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to analyze transaction: ${error}`,
      recommendations: ['Check transaction data format', 'Verify parsing logic']
    };
  }
}

function analyzeBalanceChanges(meta: TransactionMeta | null) {
  if (!meta) {
    return {
      totalChange: 0,
      accountChanges: [],
      tokenChanges: []
    };
  }

  const accountChanges: Array<{
    account: string;
    preBalance: number;
    postBalance: number;
    change: number;
    changeFormatted: string;
  }> = [];
  
  const totalChange = meta.postBalances.reduce((sum, post, index) => {
    const pre = meta.preBalances[index] || 0;
    const change = post - pre;
    accountChanges.push({
      account: `Account ${index}`,
      preBalance: pre,
      postBalance: post,
      change,
      changeFormatted: formatLamports(change)
    });
    return sum + change;
  }, 0);

  const tokenChanges: Array<{
    account: string;
    mint: string;
    preBalance: string;
    postBalance: string;
    change: string;
  }> = [];
  
  if (meta.postTokenBalances && meta.preTokenBalances) {
    // This is a simplified analysis - in practice you'd need account keys
    for (let i = 0; i < Math.max(meta.postTokenBalances.length, meta.preTokenBalances.length); i++) {
      const post = meta.postTokenBalances[i];
      const pre = meta.preTokenBalances[i];
      if (post || pre) {
        tokenChanges.push({
          account: post?.accountIndex?.toString() || pre?.accountIndex?.toString() || 'Unknown',
          mint: post?.mint || pre?.mint || 'Unknown',
          preBalance: pre?.uiTokenAmount?.uiAmountString || '0',
          postBalance: post?.uiTokenAmount?.uiAmountString || '0',
          change: calculateTokenChange(post, pre)
        });
      }
    }
  }

  return {
    totalChange,
    accountChanges,
    tokenChanges
  };
}

function analyzeInstructions(transaction: TransactionInfo, meta: TransactionMeta | null) {
  const instructions = transaction.transaction?.message?.instructions || [];
  const programs = new Set<string>();
  const instructionTypes = new Set<string>();

  instructions.forEach((instruction: any) => {
    if (instruction.programId) {
      programs.add(instruction.programId);
    }
    if (instruction.parsed?.type) {
      instructionTypes.add(instruction.parsed.type);
    }
  });

  const logMessages = meta?.logMessages || [];
  const errorDetails = meta?.err ? JSON.stringify(meta.err) : null;

  return {
    totalInstructions: instructions.length,
    programs: Array.from(programs),
    instructionTypes: Array.from(instructionTypes),
    innerInstructions: meta?.innerInstructions?.length || 0,
    logMessages,
    errorDetails
  };
}

function analyzePerformance(meta: TransactionMeta | null) {
  if (!meta) {
    return {
      computeUnitsConsumed: null,
      computeUnitsEfficiency: 'unknown' as const,
      feeEfficiency: 'unknown' as const,
      recommendations: []
    };
  }

  const computeUnits = meta.computeUnitsConsumed || null;
  const fee = meta.fee || 0;

  // Efficiency analysis
  let computeUnitsEfficiency: 'low' | 'medium' | 'high' | 'unknown' = 'unknown';
  if (computeUnits) {
    if (computeUnits < 1000) computeUnitsEfficiency = 'high';
    else if (computeUnits < 5000) computeUnitsEfficiency = 'medium';
    else computeUnitsEfficiency = 'low';
  }

  let feeEfficiency: 'low' | 'medium' | 'high' | 'unknown' = 'unknown';
  if (fee < 5000) feeEfficiency = 'high';
  else if (fee < 10000) feeEfficiency = 'medium';
  else feeEfficiency = 'low';

  const recommendations = [];
  if (computeUnitsEfficiency === 'low') {
    recommendations.push('High compute units consumed - consider optimizing transaction');
  }
  if (feeEfficiency === 'low') {
    recommendations.push('High transaction fee - consider batch operations or optimization');
  }
  if (meta.err) {
    recommendations.push('Transaction failed - review error details and retry');
  }

  return {
    computeUnitsConsumed: computeUnits,
    computeUnitsEfficiency,
    feeEfficiency,
    recommendations
  };
}

// Utility function to format lamports
export function formatLamports(lamports: number): string {
  const sol = lamports / 1000000000;
  if (Math.abs(sol) >= 1) {
    return `${sol.toFixed(4)} SOL`;
  } else {
    return `${lamports} lamports`;
  }
}

// Utility function to calculate token change
function calculateTokenChange(post: any, pre: any): string {
  const postAmount = parseFloat(post?.uiTokenAmount?.uiAmountString || '0');
  const preAmount = parseFloat(pre?.uiTokenAmount?.uiAmountString || '0');
  const change = postAmount - preAmount;
  return change > 0 ? `+${change}` : change.toString();
}

// Utility function to format transaction summary
export function formatTransactionSummary(transaction: TransactionInfo, signature: string): string {
  const meta = transaction.meta;
  const status = meta?.err ? 'Failed' : 'Success';
  const fee = meta?.fee || 0;
  const blockTime = transaction.blockTime ? new Date(transaction.blockTime * 1000).toLocaleString() : 'N/A';
  
  return `
Transaction: ${signature}
Status: ${status}
Slot: ${transaction.slot}
Block Time: ${blockTime}
Fee: ${formatLamports(fee)}
Version: ${transaction.version || 'legacy'}
  `.trim();
}

// Utility function to get transaction status
export function getTransactionStatus(meta: TransactionMeta | null): 'success' | 'failed' | 'unknown' {
  if (!meta) return 'unknown';
  return meta.err ? 'failed' : 'success';
}

// Utility function to get transaction fee
export function getTransactionFee(meta: TransactionMeta | null): number {
  return meta?.fee || 0;
}

// Utility function to get compute units consumed
export function getComputeUnitsConsumed(meta: TransactionMeta | null): number | null {
  return meta?.computeUnitsConsumed || null;
}

// Utility function to get log messages
export function getLogMessages(meta: TransactionMeta | null): string[] {
  return meta?.logMessages || [];
}

// Utility function to check if transaction is versioned
export function isVersionedTransaction(transaction: TransactionInfo): boolean {
  return transaction.version !== 'legacy' && transaction.version !== undefined;
}

// Utility function to get account balance changes
export function getAccountBalanceChanges(meta: TransactionMeta | null): Array<{index: number, change: number}> {
  if (!meta) return [];
  
  return meta.postBalances.map((post, index) => {
    const pre = meta.preBalances[index] || 0;
    return {
      index,
      change: post - pre
    };
  }).filter(change => change.change !== 0);
}

// Tool export
import { createTool } from "@mastra/core";
import { z } from "zod";

const getTransactionSchema = z.object({
  transactionSignature: z.string().describe("Base-58 encoded transaction signature"),
  options: z.object({
    commitment: z.enum(["processed", "confirmed", "finalized"]).optional(),
    encoding: z.enum(["json", "jsonParsed", "base58", "base64"]).optional(),
    maxSupportedTransactionVersion: z.number().optional()
  }).optional()
});

const getTransactionOutputSchema = z.object({
  success: z.boolean(),
  data: z.object({
    transaction: z.object({
      slot: z.number(),
      blockTime: z.number().nullable(),
      meta: z.any().nullable(),
      transaction: z.any(),
      version: z.union([z.literal("legacy"), z.number()]).optional()
    }),
    analysis: z.object({
      transactionSummary: z.object({
        signature: z.string(),
        slot: z.number(),
        blockTime: z.string().nullable(),
        status: z.enum(["success", "failed", "unknown"]),
        fee: z.number(),
        computeUnits: z.number().nullable(),
        version: z.string()
      }),
      balanceChanges: z.object({
        totalChange: z.number(),
        accountChanges: z.array(z.object({
          account: z.string(),
          preBalance: z.number(),
          postBalance: z.number(),
          change: z.number(),
          changeFormatted: z.string()
        })),
        tokenChanges: z.array(z.object({
          account: z.string(),
          mint: z.string(),
          preBalance: z.string(),
          postBalance: z.string(),
          change: z.string()
        }))
      }),
      instructionAnalysis: z.object({
        totalInstructions: z.number(),
        programs: z.array(z.string()),
        instructionTypes: z.array(z.string()),
        innerInstructions: z.number(),
        logMessages: z.array(z.string()),
        errorDetails: z.string().nullable()
      }),
      performanceMetrics: z.object({
        computeUnitsConsumed: z.number().nullable(),
        computeUnitsEfficiency: z.enum(["low", "medium", "high", "unknown"]),
        feeEfficiency: z.enum(["low", "medium", "high", "unknown"]),
        recommendations: z.array(z.string())
      })
    })
  }).optional(),
  error: z.string().optional(),
  recommendations: z.array(z.string()).optional()
});

export type GetTransactionInput = z.infer<typeof getTransactionSchema>;
export type GetTransactionOutput = z.infer<typeof getTransactionOutputSchema>;

export const getTransactionTool = createTool({
  id: "getTransaction",
  description: "Get complete transaction info by providing signature as input",
  inputSchema: getTransactionSchema,
  outputSchema: getTransactionOutputSchema,
  execute: async (context: any): Promise<GetTransactionOutput> => {
    const input = context.context;
    const result = await getTransaction(input);
    return result;
  }
});
