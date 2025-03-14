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
  private testnetRatesCache: Map<string, { rate: number, timestamp: number }> = new Map();
  private readonly TESTNET_RATES_CACHE_DURATION = 60 * 1000; // 1 minute

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
   * Get the actual testnet exchange rate between two tokens
   * This queries the DEX pools on testnet to get the real rate
   */
  async getTestnetExchangeRate(
    tokenIn: TokenType,
    tokenOut: TokenType
  ): Promise<number> {
    // Create a cache key
    const cacheKey = `${tokenIn}-${tokenOut}`;
    const now = Date.now();
    
    // Check cache first
    const cachedRate = this.testnetRatesCache.get(cacheKey);
    if (cachedRate && now - cachedRate.timestamp < this.TESTNET_RATES_CACHE_DURATION) {
      console.log(`[getTestnetExchangeRate] Using cached rate for ${tokenIn}-${tokenOut}: ${cachedRate.rate}`);
      return cachedRate.rate;
    }
    
    try {
      console.log(`[getTestnetExchangeRate] Fetching testnet rate for ${tokenIn}-${tokenOut}`);
      
      // For PancakeSwap on testnet
      // First, try to get a quote for 1 unit of tokenIn
      const quotes = await dexService.getAllDexQuotes(tokenIn, tokenOut, 1);
      
      // Find the best rate from available DEXes
      let bestRate = 0;
      for (const quote of quotes) {
        if (quote && parseFloat(quote.outputAmount) > bestRate) {
          bestRate = parseFloat(quote.outputAmount);
        }
      }
      
      // If we couldn't get a rate from DEXes, try a direct resource query
      if (bestRate === 0) {
        // For APT-USDC pair on testnet, query PancakeSwap pool directly
        if ((tokenIn === 'APT' && tokenOut === 'USDC') || (tokenIn === 'USDC' && tokenOut === 'APT')) {
          // Query PancakeSwap pool resources
          const pancakePoolAddress = "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa";
          
          try {
            const resources = await this.client.getAccountResources(pancakePoolAddress);
            
            // Find the pool resource for APT-USDC
            const poolResource = resources.find(r => 
              r.type.includes('swap::TokenPairReserve') && 
              r.type.includes('AptosCoin') && 
              r.type.includes('DevnetUSDC')
            );
            
            if (poolResource && poolResource.data) {
              // Extract reserves
              const data = poolResource.data as any;
              const reserve0 = parseFloat(data.reserve_x);
              const reserve1 = parseFloat(data.reserve_y);
              
              // Calculate rate based on reserves
              if (tokenIn === 'APT' && tokenOut === 'USDC') {
                bestRate = reserve1 / reserve0;
              } else {
                bestRate = reserve0 / reserve1;
              }
            }
          } catch (error) {
            console.error('[getTestnetExchangeRate] Error querying pool resources:', error);
          }
        }
      }
      
      // If we still don't have a rate, use fallback values
      if (bestRate === 0) {
        if (tokenIn === 'APT' && tokenOut === 'USDC') {
          bestRate = 58.034;
        } else if (tokenIn === 'USDC' && tokenOut === 'APT') {
          bestRate = 0.0172;
        } else {
          bestRate = 10; // Default fallback
        }
      }
      
      // Cache the result
      this.testnetRatesCache.set(cacheKey, { rate: bestRate, timestamp: now });
      
      console.log(`[getTestnetExchangeRate] Testnet rate for ${tokenIn}-${tokenOut}: ${bestRate}`);
      return bestRate;
      
    } catch (error) {
      console.error('[getTestnetExchangeRate] Error:', error);
      
      // Use fallback values if there's an error
      let fallbackRate = 0;
      if (tokenIn === 'APT' && tokenOut === 'USDC') {
        fallbackRate = 58.034;
      } else if (tokenIn === 'USDC' && tokenOut === 'APT') {
        fallbackRate = 0.0172;
      } else {
        fallbackRate = 10; // Default fallback
      }
      
      // Cache the fallback result
      this.testnetRatesCache.set(cacheKey, { rate: fallbackRate, timestamp: now });
      
      return fallbackRate;
    }
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