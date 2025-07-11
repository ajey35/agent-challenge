import { Connection, PublicKey, Commitment } from '@solana/web3.js';
import axios from 'axios';

export interface GetTokenSupplyParams {
  mintAddress: string;
  options?: {
    commitment?: 'processed' | 'confirmed' | 'finalized';
  };
}

export interface TokenSupplyInfo {
  amount: string;
  decimals: number;
  uiAmount: number | null;
  uiAmountString: string;
}

export interface GetTokenSupplyResult {
  success: boolean;
  data?: {
    supply: TokenSupplyInfo;
    analysis: {
      supplyBreakdown: {
        rawAmount: string;
        formattedAmount: string;
        decimals: number;
        isLargeSupply: boolean;
        supplyCategory: 'micro' | 'small' | 'medium' | 'large' | 'mega';
      };
      tokenomics: {
        totalSupply: number;
        supplyInBillions: number;
        supplyInMillions: number;
        supplyInThousands: number;
        isFixedSupply: boolean;
        recommendations: string[];
      };
      marketInsights: {
        supplyType: 'fixed' | 'inflationary' | 'deflationary' | 'unknown';
        scarcityLevel: 'high' | 'medium' | 'low';
        marketCapPotential: 'high' | 'medium' | 'low';
        recommendations: string[];
      };
    };
  };
  error?: string;
  recommendations?: string[];
}

export async function getTokenSupply(
  params: GetTokenSupplyParams
): Promise<GetTokenSupplyResult> {
  const { mintAddress, options = {} } = params;
  
  try {
    // Validate required parameters
    if (!mintAddress) {
      return {
        success: false,
        error: 'Mint address is required',
        recommendations: ['Provide a valid token mint address']
      };
    }

    // Validate public key format
    try {
      new PublicKey(mintAddress);
    } catch {
      return {
        success: false,
        error: 'Invalid mint address format',
        recommendations: ['Provide a valid base-58 encoded public key']
      };
    }

    // Try web3.js method first
    try {
      const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
      
      const tokenSupply = await connection.getTokenSupply(
        new PublicKey(mintAddress),
        options.commitment as Commitment
      );

      // Convert web3.js TokenAmount to our TokenSupplyInfo format
      const supplyInfo: TokenSupplyInfo = {
        amount: tokenSupply.value.amount,
        decimals: tokenSupply.value.decimals,
        uiAmount: tokenSupply.value.uiAmount,
        uiAmountString: tokenSupply.value.uiAmountString || tokenSupply.value.amount
      };

      return analyzeTokenSupply(supplyInfo, mintAddress);

    } catch (web3Error) {
      console.warn('Web3.js method failed, trying direct HTTP:', web3Error);
      
      // Fallback to direct HTTP method
      return await getTokenSupplyHttp(params);
    }

  } catch (error) {
    return {
      success: false,
      error: `Failed to get token supply: ${error}`,
      recommendations: [
        'Check your RPC endpoint configuration',
        'Verify the mint address is valid',
        'Ensure you have proper network connectivity'
      ]
    };
  }
}

async function getTokenSupplyHttp(
  params: GetTokenSupplyParams
): Promise<GetTokenSupplyResult> {
  const { mintAddress, options = {} } = params;
  
  try {
    const rpcUrl = process.env.SOLANA_RPC_URL_HELIUS  || 'https://api.mainnet-beta.solana.com';
    
    const requestBody = {
      jsonrpc: '2.0',
      id: 1,
      method: 'getTokenSupply',
      params: [
        mintAddress,
        options.commitment ? { commitment: options.commitment } : undefined
      ].filter(Boolean)
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
          'Check the mint address format',
          'Verify the commitment level is valid',
          'Ensure your RPC endpoint supports this method'
        ]
      };
    }

    const supply = response.data.result.value;
    return analyzeTokenSupply(supply, mintAddress);

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

function analyzeTokenSupply(
  supply: TokenSupplyInfo,
  mintAddress: string
): GetTokenSupplyResult {
  try {
    if (!supply || !supply.amount) {
      return {
        success: false,
        error: 'Invalid token supply data',
        recommendations: [
          'The mint may not exist or be invalid',
          'Check if the mint address is correct',
          'Verify the token has been properly initialized'
        ]
      };
    }

    const totalSupply = supply.uiAmount || parseFloat(supply.uiAmountString);
    const rawAmount = parseFloat(supply.amount);
    const decimals = supply.decimals;

    // Supply breakdown analysis
    const isLargeSupply = totalSupply > 1000000000; // >1 billion
    const supplyCategory = getSupplyCategory(totalSupply);

    // Tokenomics analysis
    const supplyInBillions = totalSupply / 1000000000;
    const supplyInMillions = totalSupply / 1000000;
    const supplyInThousands = totalSupply / 1000;
    const isFixedSupply = true; // Most SPL tokens have fixed supply

    const tokenomicsRecommendations = [];
    if (totalSupply > 1000000000000) {
      tokenomicsRecommendations.push('Extremely large supply - may impact price stability');
    }
    if (totalSupply < 1000000) {
      tokenomicsRecommendations.push('Small supply - potential for high price volatility');
    }
    if (decimals > 9) {
      tokenomicsRecommendations.push('High decimal precision - consider display formatting');
    }

    // Market insights
    const supplyType = 'fixed'; // Most SPL tokens are fixed supply
    const scarcityLevel = getScarcityLevel(totalSupply);
    const marketCapPotential = getMarketCapPotential(totalSupply);

    const marketRecommendations = [];
    if (scarcityLevel === 'high') {
      marketRecommendations.push('High scarcity - potential for price appreciation');
    }
    if (scarcityLevel === 'low') {
      marketRecommendations.push('Low scarcity - may require large market cap for significant price movement');
    }
    if (marketCapPotential === 'high') {
      marketRecommendations.push('High market cap potential with current supply');
    }

    return {
      success: true,
      data: {
        supply,
        analysis: {
          supplyBreakdown: {
            rawAmount: supply.amount,
            formattedAmount: formatLargeNumber(totalSupply),
            decimals,
            isLargeSupply,
            supplyCategory
          },
          tokenomics: {
            totalSupply,
            supplyInBillions,
            supplyInMillions,
            supplyInThousands,
            isFixedSupply,
            recommendations: tokenomicsRecommendations
          },
          marketInsights: {
            supplyType,
            scarcityLevel,
            marketCapPotential,
            recommendations: marketRecommendations
          }
        }
      },
      recommendations: [
        'Monitor supply changes if minting authority is active',
        'Consider supply in market cap calculations',
        'Track supply distribution across holders'
      ]
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to analyze token supply: ${error}`,
      recommendations: ['Check supply data format', 'Verify parsing logic']
    };
  }
}

// Utility function to categorize supply size
export function getSupplyCategory(totalSupply: number): 'micro' | 'small' | 'medium' | 'large' | 'mega' {
  if (totalSupply < 1000000) return 'micro'; // <1M
  if (totalSupply < 100000000) return 'small'; // <100M
  if (totalSupply < 10000000000) return 'medium'; // <10B
  if (totalSupply < 1000000000000) return 'large'; // <1T
  return 'mega'; // >=1T
}

// Utility function to determine scarcity level
export function getScarcityLevel(totalSupply: number): 'high' | 'medium' | 'low' {
  if (totalSupply < 10000000) return 'high'; // <10M
  if (totalSupply < 1000000000) return 'medium'; // <1B
  return 'low'; // >=1B
}

// Utility function to assess market cap potential
export function getMarketCapPotential(totalSupply: number): 'high' | 'medium' | 'low' {
  if (totalSupply < 100000000) return 'high'; // <100M
  if (totalSupply < 10000000000) return 'medium'; // <10B
  return 'low'; // >=10B
}

// Utility function to format large numbers
export function formatLargeNumber(num: number): string {
  if (num >= 1000000000000) {
    return `${(num / 1000000000000).toFixed(2)}T`;
  }
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(2)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  return num.toString();
}

// Utility function to format supply information
export function formatSupplyInfo(supply: TokenSupplyInfo): string {
  try {
    const totalSupply = supply.uiAmount || parseFloat(supply.uiAmountString);
    const formatted = formatLargeNumber(totalSupply);
    
    return `
Total Supply: ${supply.uiAmountString} (${formatted})
Raw Amount: ${supply.amount}
Decimals: ${supply.decimals}
    `.trim();
  } catch (error) {
    return `Error formatting supply info: ${error}`;
  }
}

// Utility function to check if supply is inflationary
export function isInflationarySupply(supply: TokenSupplyInfo): boolean {
  // This would require additional context about minting authority
  // For now, assume most SPL tokens are fixed supply
  return false;
}

// Utility function to get supply in different units
export function getSupplyInUnits(supply: TokenSupplyInfo): {
  billions: number;
  millions: number;
  thousands: number;
} {
  const totalSupply = supply.uiAmount || parseFloat(supply.uiAmountString);
  
  return {
    billions: totalSupply / 1000000000,
    millions: totalSupply / 1000000,
    thousands: totalSupply / 1000
  };
}

// Utility function to calculate market cap
export function calculateMarketCap(supply: TokenSupplyInfo, priceUsd: number): number {
  const totalSupply = supply.uiAmount || parseFloat(supply.uiAmountString);
  return totalSupply * priceUsd;
}

// Tool export
import { createTool } from "@mastra/core";
import { z } from "zod";

const getTokenSupplySchema = z.object({
  mintAddress: z.string().describe("Base-58 encoded public key of the token mint"),
  options: z.object({
    commitment: z.enum(["processed", "confirmed", "finalized"]).optional()
  }).optional()
});

const getTokenSupplyOutputSchema = z.object({
  success: z.boolean(),
  data: z.object({
    supply: z.object({
      amount: z.string(),
      decimals: z.number(),
      uiAmount: z.number().nullable(),
      uiAmountString: z.string()
    }),
    analysis: z.object({
      supplyBreakdown: z.object({
        rawAmount: z.string(),
        formattedAmount: z.string(),
        decimals: z.number(),
        isLargeSupply: z.boolean(),
        supplyCategory: z.enum(["micro", "small", "medium", "large", "mega"])
      }),
      tokenomics: z.object({
        totalSupply: z.number(),
        supplyInBillions: z.number(),
        supplyInMillions: z.number(),
        supplyInThousands: z.number(),
        isFixedSupply: z.boolean(),
        recommendations: z.array(z.string())
      }),
      marketInsights: z.object({
        supplyType: z.enum(["fixed", "inflationary", "deflationary", "unknown"]),
        scarcityLevel: z.enum(["high", "medium", "low"]),
        marketCapPotential: z.enum(["high", "medium", "low"]),
        recommendations: z.array(z.string())
      })
    })
  }).optional(),
  error: z.string().optional(),
  recommendations: z.array(z.string()).optional()
});

export type GetTokenSupplyInput = z.infer<typeof getTokenSupplySchema>;
export type GetTokenSupplyOutput = z.infer<typeof getTokenSupplyOutputSchema>;

export const getTokenSupplyTool = createTool({
  id: "getTokenSupply",
  description: "get the token supply information by mint address ",
  inputSchema: getTokenSupplySchema,
  outputSchema: getTokenSupplyOutputSchema,
  execute: async (context: any): Promise<GetTokenSupplyOutput> => {
    const input = context.context;
    const result = await getTokenSupply(input);
    return result;
  }
}); 