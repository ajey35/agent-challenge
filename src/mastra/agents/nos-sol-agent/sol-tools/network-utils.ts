/**
 * Network utilities for Solana tools
 */

/**
 * Detects the Solana network from the RPC URL
 * @param rpcUrl - The Solana RPC URL
 * @returns The network name (devnet, testnet, mainnet-beta, or custom)
 */
export function getNetworkFromRpcUrl(rpcUrl: string): string {
    const url = rpcUrl.toLowerCase();
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      return 'custom';
    } else if (url.includes('devnet')) {
      return 'devnet';
    } else if (url.includes('testnet')) {
      return 'testnet';
    } else if (url.includes('mainnet') || url.includes('mainnet-beta')) {
      return 'mainnet-beta';
    } else {
      // Default to devnet for unknown URLs
      return 'localnet';
    }
  }
  
  /**
   * Generates a Solana explorer URL for the given address and network
   * @param address - The Solana address to view
   * @param network - The network name
   * @param rpcUrl - The RPC URL (needed for custom networks)
   * @returns The explorer URL
   */
  export function getExplorerUrl(address: string, network: string, rpcUrl?: string): string {
    if (network === 'custom' && rpcUrl) {
      // For localhost/custom networks, use the custom URL format
      const encodedRpcUrl = encodeURIComponent(rpcUrl);
      return `https://explorer.solana.com/?cluster=custom&customUrl=${encodedRpcUrl}&address=${address}`;
    } else if (network === 'mainnet-beta') {
      // Mainnet doesn't need cluster parameter
      return `https://explorer.solana.com/address/${address}`;
    } else {
      // Other networks (devnet, testnet) use cluster parameter
      return `https://explorer.solana.com/address/${address}?cluster=${network}`;
    }
  }
  
  /**
   * Validates if a string is a valid Base58-encoded Solana address
   * @param address - The address to validate
   * @returns True if valid, false otherwise
   */
  export function isValidBase58(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Checks if airdrop is supported on the given network
   * @param network - The network name
   * @returns True if airdrop is supported, false otherwise
   */
  export function isAirdropSupported(network: string): boolean {
    // Airdrops are supported on devnet, testnet, and custom (localhost) networks
    // Only mainnet doesn't support airdrops
    return network !== 'mainnet-beta';
  }
  
  // Import PublicKey for the isValidBase58 function
  import { PublicKey } from "@solana/web3.js"; 