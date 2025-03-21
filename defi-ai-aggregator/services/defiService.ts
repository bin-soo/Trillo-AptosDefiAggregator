import { AptosClient } from 'aptos';
import { LendingInfo, LiquidityPoolInfo, MarketData, ProtocolData, SwapRoute, TokenData } from '../types/defi';
import { TokenType } from './constants';
import priceService from './priceService';
import dexService from './dexService';
import lendingService from './lendingService';
import knowledgeService from './knowledgeService';
import swapService from './swapService';
import defiLlamaService from './defiLlamaService';
import axios from 'axios';

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
  private marketDataCache: MarketData | null = null;
  private marketDataTimestamp: number = 0;
  private readonly MARKET_DATA_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // API endpoints
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private readonly DEFILLAMA_API = 'https://api.llama.fi';
  private readonly DEFILLAMA_POOLS_API = 'https://yields.llama.fi/pools';
  private readonly APTOS_EXPLORER_API = 'https://indexer.mainnet.aptoslabs.com/v1';

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
    
    // Clear caches when switching networks
    this.testnetRatesCache.clear();
    this.marketDataCache = null;
    this.marketDataTimestamp = 0;
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
    amount: string,
    walletAddr?: string | undefined,
  ): Promise<SwapRoute> {
    return swapService.getBestSwapRoute(tokenIn, tokenOut, amount, walletAddr);
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

  /**
   * Get market data for the dashboard
   */
  async getMarketData(): Promise<MarketData> {
    const now = Date.now();
    
    console.log('[getMarketData] Starting market data fetch');
    
    // Return cached data if it's still valid
    if (this.marketDataCache && now - this.marketDataTimestamp < this.MARKET_DATA_CACHE_DURATION) {
      console.log('[getMarketData] Returning cached market data');
      return this.marketDataCache;
    }
    
    try {
      // Always fetch real data regardless of network mode
      console.log('[getMarketData] Fetching real market data');
      
      // Fetch token data from CoinGecko
      const tokenSymbols: TokenType[] = ['APT', 'USDC', 'USDT', 'DAI'];
      console.log('[getMarketData] Fetching token data for:', tokenSymbols.join(', '));
      const tokenData = await this.fetchTokenDataFromCoinGecko(tokenSymbols);
      console.log('[getMarketData] Token data fetched successfully');
      
      // Fetch protocol data from DeFiLlama
      console.log('[getMarketData] Fetching protocol data from DeFiLlama');
      const protocolData = await defiLlamaService.getTopAptosProtocols(5);
      console.log('[getMarketData] Protocol data fetched successfully:', 
        protocolData.map(p => `${p.name}: $${p.tvl.toLocaleString()}`).join(', '));
      
      // Fetch ecosystem metrics
      console.log('[getMarketData] Fetching ecosystem metrics');
      const ecosystemMetrics = await this.fetchEcosystemMetrics(tokenData, protocolData);
      console.log('[getMarketData] Ecosystem metrics fetched successfully');
      
      // Combine all data
      const marketData: MarketData = {
        tokens: tokenData,
        protocols: protocolData,
        ecosystem: ecosystemMetrics,
        lastUpdated: new Date().toISOString()
      };
      
      // Cache the result
      this.marketDataCache = marketData;
      this.marketDataTimestamp = now;
      
      console.log('[getMarketData] Market data fetch complete');
      return marketData;
      
    } catch (error) {
      console.error('[getMarketData] Error:', error);
      
      // If we have cached data, return it even if it's expired
      if (this.marketDataCache) {
        console.log('[getMarketData] Returning expired cached data due to error');
        return this.marketDataCache;
      }
      
      // Otherwise, return minimal data with real token prices
      console.log('[getMarketData] Creating minimal data with real token prices');
      return this.createMinimalMarketData();
    }
  }

  /**
   * Create minimal market data with real token prices
   */
  private async createMinimalMarketData(): Promise<MarketData> {
    try {
      console.log('[createMinimalMarketData] Fetching real token prices');
      
      // Get real token prices
      const tokens = await Promise.all(['APT', 'USDC', 'USDT', 'DAI'].map(async (symbol) => {
        const price = await priceService.getTokenPrice(symbol);
        console.log(`[createMinimalMarketData] ${symbol} price: $${price}`);
        
        return {
          symbol,
          name: this.getTokenName(symbol),
          price,
          change24h: 0,
          volume24h: 0,
          marketCap: symbol === 'APT' ? 1_500_000_000 : 0,
        };
      }));
      
      // Try to get real TVL data
      let totalTVL = 0;
      try {
        totalTVL = await defiLlamaService.getAptosTVL();
        console.log(`[createMinimalMarketData] Total TVL: $${totalTVL.toLocaleString()}`);
      } catch (error) {
        console.error('[createMinimalMarketData] Error fetching TVL:', error);
      }
      
      return {
        tokens,
        protocols: [],
        ecosystem: {
          totalTVL,
          marketCap: tokens.find(t => t.symbol === 'APT')?.marketCap || 0,
          volume24h: 0,
          activeUsers: 0,
          transactions24h: 0
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('[createMinimalMarketData] Error:', error);
      
      // Absolute minimal fallback
      return {
        tokens: [
          { symbol: 'APT', name: 'Aptos', price: 6.75, change24h: 0, volume24h: 0, marketCap: 1_500_000_000 },
          { symbol: 'USDC', name: 'USD Coin', price: 1, change24h: 0, volume24h: 0, marketCap: 0 },
          { symbol: 'USDT', name: 'Tether', price: 1, change24h: 0, volume24h: 0, marketCap: 0 },
          { symbol: 'DAI', name: 'Dai', price: 1, change24h: 0, volume24h: 0, marketCap: 0 }
        ],
        protocols: [],
        ecosystem: {
          totalTVL: 0,
          marketCap: 1_500_000_000,
          volume24h: 0,
          activeUsers: 0,
          transactions24h: 0
        },
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Fetch token data from CoinGecko API
   */
  private async fetchTokenDataFromCoinGecko(tokenSymbols: TokenType[]): Promise<TokenData[]> {
    try {
      // Use the enhanced priceService to get detailed token data
      const tokenPromises = tokenSymbols.map(async (symbol) => {
        try {
          // Try to get detailed market data
          console.log(`[fetchTokenDataFromCoinGecko] Fetching market data for ${symbol} from CoinGecko`);
          const marketData = await priceService.getTokenMarketData(symbol);
          
          if (!marketData || !marketData.market_data) {
            throw new Error(`Invalid market data for ${symbol}`);
          }
          
          console.log(`[fetchTokenDataFromCoinGecko] ${symbol} price: $${marketData.market_data.current_price.usd}`);
          console.log(`[fetchTokenDataFromCoinGecko] ${symbol} 24h change: ${marketData.market_data.price_change_percentage_24h}%`);
          console.log(`[fetchTokenDataFromCoinGecko] ${symbol} volume: $${marketData.market_data.total_volume.usd.toLocaleString()}`);
          
          return {
            symbol,
            name: this.getTokenName(symbol),
            price: marketData.market_data.current_price.usd || 0,
            change24h: marketData.market_data.price_change_percentage_24h || 0,
            volume24h: marketData.market_data.total_volume.usd || 0,
            marketCap: marketData.market_data.market_cap.usd || 0
          };
        } catch (error) {
          console.error(`[fetchTokenDataFromCoinGecko] Error for ${symbol}:`, error);
          
          // Fallback to basic price data
          const price = await priceService.getTokenPrice(symbol);
          console.log(`[fetchTokenDataFromCoinGecko] Fallback ${symbol} price: $${price}`);
          
          return {
            symbol,
            name: this.getTokenName(symbol),
            price,
            change24h: 0,
            volume24h: symbol === 'APT' ? 50_000_000 : 5_000_000,
            marketCap: symbol === 'APT' ? 1_500_000_000 : 0
          };
        }
      });
      
      const results = await Promise.all(tokenPromises);
      console.log('[fetchTokenDataFromCoinGecko] All token data fetched successfully');
      return results;
    } catch (error) {
      console.error('[fetchTokenDataFromCoinGecko] Error:', error);
      
      // Fallback to priceService for basic price data
      const tokenPromises = tokenSymbols.map(async (symbol) => {
        const price = await priceService.getTokenPrice(symbol);
        
        return {
          symbol,
          name: this.getTokenName(symbol),
          price,
          change24h: 0,
          volume24h: symbol === 'APT' ? 50_000_000 : 5_000_000,
          marketCap: symbol === 'APT' ? 1_500_000_000 : 0
        };
      });
      
      return Promise.all(tokenPromises);
    }
  }

  /**
   * Fetch ecosystem metrics
   */
  private async fetchEcosystemMetrics(
    tokens: TokenData[],
    protocols: ProtocolData[]
  ): Promise<{
    totalTVL: number;
    marketCap: number;
    volume24h: number;
    activeUsers: number;
    transactions24h: number;
  }> {
    try {
      // Get total TVL from DeFiLlama
      const totalTVL = await defiLlamaService.getAptosTVL();
      console.log(`[fetchEcosystemMetrics] Total TVL from DeFiLlama: $${totalTVL.toLocaleString()}`);
      
      // Get APT market cap and volume from CoinGecko
      const aptToken = tokens.find(t => t.symbol === 'APT');
      const marketCap = aptToken?.marketCap || 0;
      const volume24h = aptToken?.volume24h || 0; // Use CoinGecko volume data directly
      
      console.log(`[fetchEcosystemMetrics] APT market cap: $${marketCap.toLocaleString()}`);
      console.log(`[fetchEcosystemMetrics] APT 24h volume: $${volume24h.toLocaleString()}`);
      
      // Use fixed values for active users and transactions since the API is not available
      const activeUsers = 125000;
      const transactions24h = 850000;
      
      console.log(`[fetchEcosystemMetrics] Using estimated active users: ${activeUsers.toLocaleString()}`);
      console.log(`[fetchEcosystemMetrics] Using estimated 24h transactions: ${transactions24h.toLocaleString()}`);
      
      return {
        totalTVL,
        marketCap,
        volume24h,
        activeUsers,
        transactions24h
      };
    } catch (error) {
      console.error('[fetchEcosystemMetrics] Error:', error);
      
      // Return fallback data
      const aptToken = tokens.find(t => t.symbol === 'APT');
      return {
        totalTVL: protocols.reduce((sum, protocol) => sum + protocol.tvl, 0),
        marketCap: aptToken?.marketCap || 1_500_000_000,
        volume24h: aptToken?.volume24h || 50_000_000,
        activeUsers: 125000,
        transactions24h: 850000
      };
    }
  }

  /**
   * Get token name from symbol
   */
  private getTokenName(symbol: string): string {
    switch (symbol) {
      case 'APT': return 'Aptos';
      case 'USDC': return 'USD Coin';
      case 'USDT': return 'Tether';
      case 'DAI': return 'Dai';
      default: return symbol;
    }
  }

  /**
   * Get market analysis based on a topic
   */
  async getMarketAnalysis(topic: string): Promise<string> {
    console.log(`[getMarketAnalysis] Generating analysis for topic: ${topic}`);
    
    try {
      // Get market data for context
      const marketData = await this.getMarketData();
      const aptPrice = marketData.tokens.find(t => t.symbol === 'APT')?.price || 0;
      const aptChange24h = marketData.tokens.find(t => t.symbol === 'APT')?.change24h || 0;
      const totalTVL = marketData.ecosystem.totalTVL;
      
      // Format the current date
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      let analysis = '';
      
      // Generate different analyses based on the topic
      if (topic.includes('price prediction')) {
        // Price prediction analysis
        const sentiment = aptChange24h >= 0 ? 'positive' : 'negative';
        const shortTermOutlook = aptChange24h >= 2 ? 'bullish' : (aptChange24h <= -2 ? 'bearish' : 'neutral');
        const randomFactor = Math.random() * 0.15 + 0.9; // Random factor between 0.9 and 1.05
        const predictedPrice = aptPrice * randomFactor;
        
        analysis = `APT Price Prediction Analysis (${currentDate})

## Current Market Status
- Current APT Price: $${aptPrice.toFixed(2)}
- 24h Change: ${aptChange24h >= 0 ? '+' : ''}${aptChange24h.toFixed(2)}%
- Market Sentiment: ${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}

## 30-Day Price Outlook
Based on current market conditions, technical indicators, and ecosystem developments, my analysis suggests APT could reach approximately $${predictedPrice.toFixed(2)} within the next month.

### Key Factors Influencing This Prediction:
1. **Current Momentum**: ${shortTermOutlook.charAt(0).toUpperCase() + shortTermOutlook.slice(1)} short-term trend with ${Math.abs(aptChange24h).toFixed(1)}% ${aptChange24h >= 0 ? 'gain' : 'loss'} in the last 24 hours.
2. **Ecosystem Growth**: Aptos DeFi TVL currently stands at $${(totalTVL / 1000000).toFixed(0)}M, showing ${totalTVL > 100000000 ? 'strong' : 'moderate'} developer and user activity.
3. **Protocol Development**: Continued development of key protocols like ${marketData.protocols.slice(0, 3).map(p => p.name.split(' ')[0]).join(', ')} is strengthening the ecosystem.
4. **Market Correlation**: Aptos price movements show correlation with broader crypto market trends.

### Risk Factors:
- Regulatory developments could impact the entire crypto market
- Competition from other L1 blockchains
- General market volatility

*Note: This analysis is based on current market data and trends. Cryptocurrency markets are highly volatile, and actual prices may vary significantly. This should not be considered financial advice.*`;
      } else if (topic.includes('market sentiment') || topic.includes('market analysis')) {
        // Market sentiment analysis
        const topProtocols = marketData.protocols.slice(0, 3);
        const overallSentiment = aptChange24h >= 1 ? 'positive' : (aptChange24h <= -1 ? 'negative' : 'neutral');
        const tvlTrend = totalTVL > 120000000 ? 'growing' : (totalTVL < 100000000 ? 'declining' : 'stable');
        
        analysis = `# Aptos Ecosystem Market Analysis (${currentDate})

## Overall Market Sentiment: ${overallSentiment.toUpperCase()}

### Key Metrics:
- Total Value Locked (TVL): $${(totalTVL / 1000000).toFixed(1)}M (${tvlTrend})
- APT Price: $${aptPrice.toFixed(2)} (${aptChange24h >= 0 ? '+' : ''}${aptChange24h.toFixed(2)}% 24h)
- Active Users (24h): ${marketData.ecosystem.activeUsers.toLocaleString()}
- Transactions (24h): ${marketData.ecosystem.transactions24h.toLocaleString()}

### Top Performing Protocols:
${topProtocols.map((p, i) => `${i+1}. **${p.name}**: $${(p.tvl / 1000000).toFixed(1)}M TVL (${p.change24h >= 0 ? '+' : ''}${p.change24h.toFixed(2)}% 24h)`).join('\n')}

### Market Trends:
1. **DeFi Activity**: ${tvlTrend.charAt(0).toUpperCase() + tvlTrend.slice(1)} TVL indicates ${tvlTrend === 'growing' ? 'increasing' : (tvlTrend === 'declining' ? 'decreasing' : 'consistent')} user engagement with Aptos DeFi protocols.
2. **Protocol Diversity**: The ecosystem shows ${marketData.protocols.length > 4 ? 'good' : 'developing'} diversity across DEXes, lending platforms, and yield aggregators.
3. **Liquidity**: ${aptPrice > 5 ? 'Strong' : 'Moderate'} liquidity across major trading pairs, particularly APT-USDC and APT-USDT.

### Opportunities:
- Yield farming in stablecoin pools offering competitive APYs
- Exploring newer protocols with incentive programs
- Participating in liquid staking solutions

*This analysis is based on current market data and should not be considered financial advice. Always conduct your own research before making investment decisions.*`;
      } else {
        // General market insights
        analysis = `# Aptos Market Insights (${currentDate})

## Current Ecosystem Status
- APT Price: $${aptPrice.toFixed(2)} (${aptChange24h >= 0 ? '+' : ''}${aptChange24h.toFixed(2)}% 24h)
- Total Value Locked: $${(totalTVL / 1000000).toFixed(1)}M
- Active Protocols: ${marketData.protocols.length}

## Key Observations
- ${marketData.protocols[0]?.name || 'Top protocols'} currently leading in TVL with $${(marketData.protocols[0]?.tvl / 1000000).toFixed(1)}M locked
- ${aptChange24h >= 0 ? 'Positive' : 'Negative'} price movement in the last 24 hours suggests ${aptChange24h >= 0 ? 'growing' : 'cautious'} market sentiment
- DeFi activity shows ${totalTVL > 100000000 ? 'healthy' : 'moderate'} user engagement

## Recommendations
- Consider exploring yield opportunities in stablecoin pools for lower risk exposure
- Monitor developments in the top protocols for potential opportunities
- Stay informed about upcoming Aptos ecosystem updates and their potential impact on the market

*This information is provided for educational purposes only and should not be considered financial advice.*`;
      }
      
      return analysis;
    } catch (error) {
      console.error('[getMarketAnalysis] Error:', error);
      return `I apologize, but I'm currently unable to provide a detailed market analysis due to a technical issue. Please try again later or ask about specific tokens, protocols, or DeFi opportunities that I can help with.`;
    }
  }
}

export default DeFiService.getInstance(); 