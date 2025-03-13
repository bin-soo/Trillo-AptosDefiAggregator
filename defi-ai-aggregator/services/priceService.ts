import axios from 'axios';
import { CoinGeckoPrice, TokenPriceResponse } from './interfaces';
import { COINGECKO_IDS, TokenType } from './constants';

export class PriceService {
  private static instance: PriceService;
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private priceCache: Map<string, TokenPriceResponse> = new Map();
  private lastApiCall: number = 0;

  private constructor() {}

  public static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService();
    }
    return PriceService.instance;
  }

  /**
   * Get token price with fallback options
   */
  async getTokenPrice(token: string): Promise<number> {
    try {
      return await this.getTokenPriceWithCache(token as TokenType);
    } catch (error) {
      console.error(`[getTokenPrice] Error getting price for ${token}:`, error);
      // Fallback prices
      if (token === 'APT') return 6.75;
      if (token === 'USDC' || token === 'USDT' || token === 'DAI') return 1;
      return 1; // Default fallback
    }
  }

  /**
   * Get token price with caching to avoid rate limits
   */
  async getTokenPriceWithCache(token: TokenType): Promise<number> {
    const cacheKey = token.toLowerCase();
    const cachedPrice = this.priceCache.get(cacheKey);
    const now = Date.now();

    // Return cached price if valid
    if (cachedPrice && now - cachedPrice.timestamp < this.CACHE_DURATION) {
      console.log(`[getTokenPriceWithCache] Using cached price for ${token}: $${cachedPrice.price}`);
      return cachedPrice.price;
    }

    try {
      // Fetch fresh price
      const price = await this.fetchTokenPrice(token);
      
      // Update cache
      this.priceCache.set(cacheKey, {
        price,
        timestamp: now
      });
      
      return price;
    } catch (error) {
      console.error(`[getTokenPriceWithCache] Error fetching price for ${token}:`, error);
      
      // If we have a stale cached price, use it as fallback
      if (cachedPrice) {
        console.log(`[getTokenPriceWithCache] Using stale cached price for ${token}: $${cachedPrice.price}`);
        return cachedPrice.price;
      }
      
      // Fallback prices if no cached data
      if (token === 'APT') return 6.75;
      if (token === 'USDC' || token === 'USDT' || token === 'DAI') return 1;
      
      throw new Error(`No price data available for ${token}`);
    }
  }

  /**
   * Fetch token price from CoinGecko
   */
  private async fetchTokenPrice(token: TokenType): Promise<number> {
    return this.withRateLimit(async () => {
      // Get token's CoinGecko ID
      const geckoId = COINGECKO_IDS[token as keyof typeof COINGECKO_IDS];
      if (!geckoId) {
        console.warn(`[fetchTokenPrice] No CoinGecko ID for token: ${token}`);
        
        // Fallback prices for known tokens
        if (token === 'APT') return 6.75;
        if (token === 'USDC' || token === 'USDT' || token === 'DAI') return 1;
        
        return 1; // Default to 1 for unknown tokens
      }

      // Fetch real-time price from CoinGecko
      const response = await axios.get<CoinGeckoPrice>(
        `${this.COINGECKO_API}/simple/price`,
        {
          params: {
            ids: geckoId,
            vs_currencies: 'usd'
          },
          headers: {
            'Accept': 'application/json',
            // Add your CoinGecko API key if you have one
            // 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY
          }
        }
      );

      const price = response.data[geckoId]?.usd;
      if (!price) {
        throw new Error(`No price data for ${token}`);
      }

      console.log(`[fetchTokenPrice] ${token} price: $${price}`);
      return price;
    });
  }

  /**
   * Rate limit API calls to avoid hitting limits
   */
  private async withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    const MIN_DELAY = 1100; // CoinGecko's rate limit is 1 request/second for free tier
    const now = Date.now();
    const timeSinceLastCall = now - (this.lastApiCall || 0);
    
    if (timeSinceLastCall < MIN_DELAY) {
      await new Promise(resolve => setTimeout(resolve, MIN_DELAY - timeSinceLastCall));
    }
    
    this.lastApiCall = Date.now();
    return fn();
  }

  /**
   * Calculate price impact between two tokens
   */
  async calculatePriceImpact(
    tokenIn: TokenType,
    tokenOut: TokenType,
    inputAmount: number,
    outputAmount: number
  ): Promise<number> {
    try {
      const tokenInPrice = await this.getTokenPrice(tokenIn);
      const tokenOutPrice = await this.getTokenPrice(tokenOut);
      
      // Calculate expected output with no slippage
      const expectedOutput = inputAmount * tokenInPrice / tokenOutPrice;
      
      // Calculate price impact as percentage
      const priceImpact = Math.max(0, ((expectedOutput - outputAmount) / expectedOutput) * 100);
      
      return priceImpact;
    } catch (error) {
      console.error('[calculatePriceImpact] Error:', error);
      return 0.1; // Default fallback
    }
  }

  /**
   * Calculate a simplified price impact when full calculation isn't needed
   */
  calculateSimplePriceImpact(
    tokenIn: TokenType,
    tokenOut: TokenType,
    inputAmount: number,
    outputAmount: number
  ): number {
    // This is a simplified version that doesn't require API calls
    // Used for alternative routes where precision is less critical
    const inputValueEstimate = inputAmount * 10; // Simplified estimate
    return Math.min(10, Math.max(0.1, (inputValueEstimate / 1000000) * 100));
  }
}

export default PriceService.getInstance(); 