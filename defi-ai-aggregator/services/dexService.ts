import axios from 'axios';
import { DexQuote } from './interfaces';
import { APTOS_COINS, APTOS_DEXES, APTOS_TESTNET_COINS, TokenType } from './constants';
import priceService from './priceService';
import { TokenSymbol } from '../types/defi';

export class DexService {
  private static instance: DexService;
  private poolCache: Map<string, any> = new Map();
  private poolCacheTimestamp: number = 0;
  private readonly POOL_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private isTestnet: boolean = true;

  private constructor() {
    // Initialize based on environment
    this.isTestnet = typeof window !== 'undefined' && 
      ((window as any).NEXT_PUBLIC_APTOS_NETWORK === 'testnet' || 
       localStorage.getItem('aptos-network') === 'testnet');
  }

  public static getInstance(): DexService {
    if (!DexService.instance) {
      DexService.instance = new DexService();
    }
    return DexService.instance;
  }

  /**
   * Set testnet mode
   */
  setTestnetMode(isTestnet: boolean): void {
    this.isTestnet = isTestnet;
  }

  /**
   * Get quotes from all DEXes for a token pair
   */
  async getAllDexQuotes(tokenIn: TokenType, tokenOut: TokenType, amount: number): Promise<(DexQuote | null)[]> {
    // Fetch pool data if needed
    await this.fetchPoolData();
    
    // Get quotes in parallel from all DEXes
    const quotePromises = Object.entries(APTOS_DEXES).map(([dexKey, dex]) => 
      this.getDexQuote(dexKey as keyof typeof APTOS_DEXES, tokenIn, tokenOut, amount)
    );
    
    return Promise.all(quotePromises);
  }

  /**
   * Get a quote from a specific DEX
   */
  private async getDexQuote(
    dexKey: keyof typeof APTOS_DEXES, 
    tokenIn: TokenType, 
    tokenOut: TokenType, 
    amount: number
  ): Promise<DexQuote | null> {
    const dex = APTOS_DEXES[dexKey];
    
    try {
      // For real implementation, we would query the DEX's API or simulate the swap
      // Here we're using a combination of pool data and price data to estimate
      
      // Get token prices
      let tokenInPrice = 1;
      let tokenOutPrice = 1;
      
      try {
        // Try to get real prices first
        tokenInPrice = await priceService.getTokenPriceWithCache(tokenIn);
        tokenOutPrice = await priceService.getTokenPriceWithCache(tokenOut);
      } catch (error) {
        console.warn(`[getDexQuote] Error getting real prices, using fallbacks:`, error);
        // Fallback to approximate prices
        if (tokenIn === 'APT') tokenInPrice = 6.75;
        if (tokenOut === 'APT') tokenOutPrice = 6.75;
        if (tokenIn === 'USDC' || tokenIn === 'USDT' || tokenIn === 'DAI') tokenInPrice = 1;
        if (tokenOut === 'USDC' || tokenOut === 'USDT' || tokenOut === 'DAI') tokenOutPrice = 1;
      }
      
      if (!tokenInPrice || !tokenOutPrice) {
        console.warn(`[getDexQuote] Missing price data for ${tokenIn} or ${tokenOut}`);
        return null;
      }
      
      // Get pool data for this DEX
      const poolData = this.poolCache.get(dex.name);
      if (!poolData) {
        console.warn(`[getDexQuote] No pool data for ${dex.name}`);
        return null;
      }
      
      // Find the relevant pool (simplified)
      const poolKey = `${tokenIn}-${tokenOut}`;
      const reversePoolKey = `${tokenOut}-${tokenIn}`;
      
      // Calculate liquidity factor based on TVL
      let liquidityFactor = 1.0;
      let poolTVL = 0;
      
      if (poolData.tvl) {
        poolTVL = poolData.tvl;
        // Adjust output based on liquidity - lower liquidity means worse rates
        liquidityFactor = Math.min(1.0, Math.max(0.9, Math.log10(poolTVL) / Math.log10(1000000)));
      }
      
      // Calculate expected output with slippage based on amount and liquidity
      const perfectOutput = amount * tokenInPrice / tokenOutPrice;
      
      // Calculate slippage based on input amount relative to pool size
      const amountUsd = amount * tokenInPrice;
      const slippageFactor = Math.min(0.1, amountUsd / (poolTVL || 1000000));
      
      // Apply DEX-specific fee
      const afterFeeAmount = amount * (1 - dex.fee);
      
      // Calculate final output with all factors
      const outputAmount = (perfectOutput * liquidityFactor * (1 - slippageFactor) * (afterFeeAmount / amount)).toFixed(6);
      
      // Calculate price impact
      const priceImpact = (slippageFactor * 100).toFixed(2);
      
      return {
        dex: dexKey,
        dexName: dex.name,
        outputAmount,
        priceImpact,
        fee: `${dex.fee * 100}%`,
        dexUrl: dex.url,
        gasEstimate: dex.gasEstimate
      };
    } catch (error) {
      console.error(`[getDexQuote] Error getting quote from ${dex.name}:`, error);
      return null;
    }
  }

  /**
   * Fetch pool data for all DEXes and cache it
   */
  private async fetchPoolData(): Promise<void> {
    const now = Date.now();
    if (this.poolCache.size > 0 && now - this.poolCacheTimestamp < this.POOL_CACHE_DURATION) {
      return; // Use cached data
    }

    try {
      // Fetch pool data from DefiLlama for each DEX
      const dexPromises = Object.values(APTOS_DEXES).map(async dex => {
        try {
          const response = await axios.get(dex.liquiditySource);
          return {
            dex: dex.name,
            data: response.data
          };
        } catch (error) {
          console.error(`Error fetching pool data for ${dex.name}:`, error);
          return {
            dex: dex.name,
            data: null
          };
        }
      });

      const results = await Promise.all(dexPromises);
      
      // Clear and update cache
      this.poolCache.clear();
      results.forEach(result => {
        if (result.data) {
          this.poolCache.set(result.dex, result.data);
        }
      });
      
      this.poolCacheTimestamp = now;
      console.log(`[fetchPoolData] Updated pool data for ${this.poolCache.size} DEXes`);
    } catch (error) {
      console.error('Error fetching pool data:', error);
      // If cache is empty, throw error; otherwise, use stale cache
      if (this.poolCache.size === 0) {
        throw error;
      }
    }
  }

  /**
   * Prepare PancakeSwap transaction payload
   */
  preparePancakeSwapPayload(
    tokenIn: TokenType,
    tokenOut: TokenType,
    amountIn: string,
    minAmountOut: string,
    deadline: number,
    isTestnet: boolean
  ): any {
    // Get the correct token addresses based on the current network
    const tokenInAddress = this.getTokenAddress(tokenIn, isTestnet);
    const tokenOutAddress = this.getTokenAddress(tokenOut, isTestnet);
    
    // Get the correct token decimals based on the current network
    const tokenInDecimals = isTestnet 
      ? APTOS_TESTNET_COINS[tokenIn].decimals 
      : APTOS_COINS[tokenIn].decimals;
    
    const tokenOutDecimals = isTestnet 
      ? APTOS_TESTNET_COINS[tokenOut].decimals 
      : APTOS_COINS[tokenOut].decimals;
    
    // Format the amount with the correct number of decimals
    const formattedAmountIn = this.formatTokenAmount(amountIn, tokenInDecimals);
    const formattedMinAmountOut = this.formatTokenAmount(minAmountOut, tokenOutDecimals);
    
    // Use the testnet router address when on testnet
    const routerAddress = isTestnet
      ? APTOS_DEXES.PANCAKE.testnetRouter
      : APTOS_DEXES.PANCAKE.router;
    
    // Prepare the transaction payload for PancakeSwap
    return {
      type: "entry_function_payload",
      function: `${routerAddress}::router::swap_exact_input`,
      type_arguments: [
        tokenInAddress,
        tokenOutAddress
      ],
      arguments: [
        formattedAmountIn,
        formattedMinAmountOut
      ]
    };
  }

  /**
   * Prepare Liquidswap transaction payload
   */
  prepareLiquidswapPayload(
    tokenIn: TokenType,
    tokenOut: TokenType,
    amountIn: string,
    minAmountOut: string,
    deadline: number,
    isTestnet: boolean
  ): any {
    // Get the correct token addresses based on the current network
    const tokenInAddress = this.getTokenAddress(tokenIn, isTestnet);
    const tokenOutAddress = this.getTokenAddress(tokenOut, isTestnet);
    
    // Get the correct token decimals based on the current network
    const tokenInDecimals = isTestnet 
      ? APTOS_TESTNET_COINS[tokenIn].decimals 
      : APTOS_COINS[tokenIn].decimals;
    
    const tokenOutDecimals = isTestnet 
      ? APTOS_TESTNET_COINS[tokenOut].decimals 
      : APTOS_COINS[tokenOut].decimals;
    
    // Format the amount with the correct number of decimals
    const formattedAmountIn = this.formatTokenAmount(amountIn, tokenInDecimals);
    const formattedMinAmountOut = this.formatTokenAmount(minAmountOut, tokenOutDecimals);
    
    // Use the testnet router address when on testnet
    const routerAddress = isTestnet
      ? "0x305d6fe5d70b02e9c7d5b0f2f5e5934c6a0d9b867d6e2c4c6fad7c293e0cd8c5"
      : "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12";
    
    const curveAddress = isTestnet
      ? `${routerAddress}::curves::Uncorrelated`
      : `${routerAddress}::curves::Uncorrelated`;
    
    // Prepare the transaction payload for Liquidswap
    return {
      type: "entry_function_payload",
      function: `${routerAddress}::router::swap_exact_input`,
      type_arguments: [
        tokenInAddress,
        tokenOutAddress
      ],
      arguments: [
        formattedAmountIn,
        formattedMinAmountOut
      ]
    };
  }

  /**
   * Gets the token address based on the current network
   * @param token The token symbol
   * @param isTestnet Whether to use testnet addresses
   * @returns The token address
   */
  public getTokenAddress(token: TokenSymbol, isTestnet: boolean = this.isTestnet): string {
    const tokenInfo = isTestnet ? APTOS_TESTNET_COINS[token] : APTOS_COINS[token];
    if (!tokenInfo) {
      throw new Error(`Token ${token} not found in ${isTestnet ? 'testnet' : 'mainnet'} configuration`);
    }
    return tokenInfo.address;
  }

  /**
   * Format token amount according to decimals
   * This is crucial for blockchain transactions to have the correct amount format
   */
  formatTokenAmount(amount: string, decimals: number): string {
    try {
      // Parse the amount as a floating point number
      const parsedAmount = parseFloat(amount);
      
      if (isNaN(parsedAmount)) {
        throw new Error(`Invalid amount: ${amount}`);
      }
      
      // Calculate the multiplier based on the token's decimals
      const multiplier = Math.pow(10, decimals);
      
      // Convert to the smallest unit and ensure it's an integer
      const amountInSmallestUnit = Math.floor(parsedAmount * multiplier);
      
      // Return as a string
      return amountInSmallestUnit.toString();
    } catch (error) {
      console.error('Error formatting token amount:', error);
      throw error;
    }
  }
}

export default DexService.getInstance(); 