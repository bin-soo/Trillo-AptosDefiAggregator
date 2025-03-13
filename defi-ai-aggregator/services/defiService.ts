import { AptosClient } from 'aptos';
import { LendingInfo, LiquidityPoolInfo, SwapRoute } from '../types/defi';
import { TokenType } from './constants';
import priceService from './priceService';
import dexService from './dexService';
import lendingService from './lendingService';
import knowledgeService from './knowledgeService';
import swapService from './swapService';

/**
 * Main DeFi service that coordinates all DeFi-related functionality
 */
export class DeFiService {
  private static instance: DeFiService;
  private client: AptosClient;
  private isTestnet: boolean = false;
  private networkUrl: string = 'https://fullnode.mainnet.aptoslabs.com/v1';

  private constructor() {
    // Initialize based on environment
    this.isTestnet = typeof window !== 'undefined' && 
      ((window as any).NEXT_PUBLIC_APTOS_NETWORK === 'testnet' || 
       localStorage.getItem('aptos-network') === 'testnet');
    
    this.networkUrl = this.isTestnet 
      ? 'https://fullnode.testnet.aptoslabs.com/v1'
      : 'https://fullnode.mainnet.aptoslabs.com/v1';
    
    this.client = new AptosClient(this.networkUrl);
    
    // Set testnet mode for all services
    swapService.setTestnetMode(this.isTestnet);
    dexService.setTestnetMode(this.isTestnet);
  }

  public static getInstance(): DeFiService {
    if (!DeFiService.instance) {
      DeFiService.instance = new DeFiService();
    }
    return DeFiService.instance;
  }

  /**
   * Set testnet mode for all services
   */
  setTestnetMode(isTestnet: boolean): void {
    this.isTestnet = isTestnet;
    this.networkUrl = isTestnet 
      ? 'https://fullnode.testnet.aptoslabs.com/v1'
      : 'https://fullnode.mainnet.aptoslabs.com/v1';
    
    this.client = new AptosClient(this.networkUrl);
    
    // Update testnet mode for all services
    swapService.setTestnetMode(isTestnet);
    dexService.setTestnetMode(this.isTestnet);
  }

  /**
   * Get lending rates for a specific token
   */
  async getLendingRates(token: string): Promise<LendingInfo[]> {
    return lendingService.getLendingRates(token);
  }

  /**
   * Get the best swap route
   */
  async getBestSwapRoute(
    tokenIn: TokenType,
    tokenOut: TokenType,
    amount: string
  ): Promise<SwapRoute> {
    return swapService.getBestSwapRoute(tokenIn, tokenOut, amount);
  }

  /**
   * Get liquidity pools for a specific token
   */
  async getLiquidityPools(token?: string): Promise<LiquidityPoolInfo[]> {
    return lendingService.getLiquidityPools(token);
  }

  /**
   * Get yield opportunities for a specific token
   */
  async getYieldOpportunities(token: string): Promise<{
    lending: LendingInfo[];
    liquidity: LiquidityPoolInfo[];
    staking: any[];
  }> {
    return lendingService.getYieldOpportunities(token);
  }

  /**
   * Get information from the knowledge base
   */
  async getKnowledgeBaseInfo(topic: string): Promise<any> {
    return knowledgeService.getKnowledgeBaseInfo(topic);
  }

  /**
   * Execute a swap
   */
  async executeSwap(
    walletAddress: string,
    tokenIn: TokenType,
    tokenOut: TokenType,
    amount: string,
    slippagePercentage: number = 0.5,
    deadline: number = 20 * 60
  ): Promise<{ success: boolean; txHash?: string; error?: string; payload?: any }> {
    return swapService.executeSwap(
      walletAddress,
      tokenIn,
      tokenOut,
      amount,
      slippagePercentage,
      deadline
    );
  }

  /**
   * Get token price
   */
  async getTokenPrice(token: string): Promise<number> {
    return priceService.getTokenPrice(token);
  }
}

export default DeFiService.getInstance(); 