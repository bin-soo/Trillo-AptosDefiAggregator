import axios from 'axios';
import { CoinGeckoPrice, TokenPriceResponse } from './interfaces';
import { COINGECKO_IDS, TokenType } from './constants';

export class PriceService {
  private static instance: PriceService;
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private priceCache: Map<string, TokenPriceResponse> = new Map();
  private marketDataCache: Map<string, any> = new Map();
  private lastApiCall: number = 0;
  private readonly API_RATE_LIMIT = 1100; // 1.1 seconds between calls for CoinGecko free tier

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
   * Get detailed market data for a token
   */
  async getTokenMarketData(token: TokenType): Promise<any> {
    const cacheKey = `market_${token.toLowerCase()}`;
    const cachedData = this.marketDataCache.get(cacheKey);
    const now = Date.now();
    
    // Return cached data if valid
    if (cachedData && now - cachedData.timestamp < this.CACHE_DURATION) {
      console.log(`[getTokenMarketData] Using cached data for ${token}`);
      return cachedData.data;
    }

    try {
      return await this.withRateLimit(async () => {
        // Get token's CoinGecko ID
        const geckoId = COINGECKO_IDS[token as keyof typeof COINGECKO_IDS];
        if (!geckoId) {
          throw new Error(`No CoinGecko ID for token: ${token}`);
        }

        // Fetch market data from CoinGecko
        console.log(`[getTokenMarketData] Fetching market data for ${token} (${geckoId}) from CoinGecko`);
        const response = await axios.get(`${this.COINGECKO_API}/coins/${geckoId}`, {
          params: {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false,
            sparkline: false
          },
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.data || !response.data.market_data) {
          console.error(`[getTokenMarketData] Invalid response for ${token}:`, response.data);
          throw new Error(`Invalid market data response for ${token}`);
        }

        // Log successful data fetch
        console.log(`[getTokenMarketData] Successfully fetched data for ${token}:`);
        console.log(`  - Price: $${response.data.market_data.current_price.usd}`);
        console.log(`  - 24h Change: ${response.data.market_data.price_change_percentage_24h}%`);
        console.log(`  - Market Cap: $${response.data.market_data.market_cap.usd.toLocaleString()}`);

        // Cache the result
        this.marketDataCache.set(cacheKey, {
          data: response.data,
          timestamp: now
        });

        return response.data;
      });
    } catch (error) {
      console.error(`[getTokenMarketData] Error fetching market data for ${token}:`, error);
      
      // If we have stale cached data, use it as fallback
      if (cachedData) {
        console.log(`[getTokenMarketData] Using stale cached data for ${token}`);
        return cachedData.data;
      }
      
      throw new Error(`No market data available for ${token}`);
    }
  }

  /**
   * Get market data for multiple tokens at once
   */
  async getMultipleTokenPrices(tokens: TokenType[]): Promise<Record<string, number>> {
    try {
      return await this.withRateLimit(async () => {
        // Map token symbols to CoinGecko IDs
        const geckoIds = tokens
          .map(token => COINGECKO_IDS[token as keyof typeof COINGECKO_IDS])
          .filter(id => id) // Filter out undefined IDs
          .join(',');

        if (!geckoIds) {
          throw new Error('No valid CoinGecko IDs found for the provided tokens');
        }

        // Fetch price data for all tokens in one request
        const response = await axios.get<CoinGeckoPrice>(
          `${this.COINGECKO_API}/simple/price`,
          {
            params: {
              ids: geckoIds,
              vs_currencies: 'usd'
            },
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        // Map response back to token symbols
        const result: Record<string, number> = {};
        tokens.forEach(token => {
          const geckoId = COINGECKO_IDS[token as keyof typeof COINGECKO_IDS];
          if (geckoId && response.data[geckoId]) {
            result[token] = response.data[geckoId].usd;
          } else {
            // Use fallback prices for tokens without data
            if (token === 'APT') result[token] = 6.75;
            else if (token === 'USDC' || token === 'USDT' || token === 'DAI') result[token] = 1;
            else result[token] = 0;
          }
        });

        return result;
      });
    } catch (error) {
      console.error('[getMultipleTokenPrices] Error:', error);
      
      // Return fallback prices
      const result: Record<string, number> = {};
      tokens.forEach(token => {
        if (token === 'APT') result[token] = 6.75;
        else if (token === 'USDC' || token === 'USDT' || token === 'DAI') result[token] = 1;
        else result[token] = 0;
      });
      
      return result;
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
    const now = Date.now();
    const timeSinceLastCall = now - (this.lastApiCall || 0);
    
    if (timeSinceLastCall < this.API_RATE_LIMIT) {
      await new Promise(resolve => setTimeout(resolve, this.API_RATE_LIMIT - timeSinceLastCall));
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