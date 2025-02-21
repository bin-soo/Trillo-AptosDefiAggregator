import axios, { AxiosError } from 'axios';
import { LendingInfo, LiquidityPoolInfo, SwapRoute } from '../types/defi';
import { AptosClient } from 'aptos';
import { TradeAggregator, MAINNET_CONFIG } from '@manahippo/hippo-sdk';
import { HexString } from 'aptos';

interface Pool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase?: number;
  apyReward?: number;
  rewardTokens?: string[];
  pool: string;
  utilization?: number;
}

interface DexProtocol {
  name: string;
  volumeUsd: number;
  fee?: string;
}

interface PriceData {
  data: Record<string, { price: number }>;
}

interface HippoQuote {
  route: {
    routeType: string;
    poolType: string;
  };
  quote: {
    outputUiAmt: number;
    price: number;
  };
}

interface DexQuote {
  dex: string;
  outputAmount: string;
  priceImpact: string;
  fee: string;
}

interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
  }
}

// First, let's define proper types for our tokens
type TokenType = keyof typeof APTOS_COINS;

const APTOS_COINS = {
  APT: {
    address: "0x1::aptos_coin::AptosCoin",
    decimals: 8,
    module_name: "aptos_coin",
    struct_name: "AptosCoin"
  },
  USDC: {
    address: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
    decimals: 6,
    module_name: "asset",
    struct_name: "USDC"
  },
  USDT: {
    address: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
    decimals: 6,
    module_name: "asset",
    struct_name: "USDT"
  }
} as const;

const APTOS_KNOWLEDGE_BASE = {
  lastUpdated: '2024-03',
  
  smartContract: {
    topic: 'Smart Contracts',
    definition: `A smart contract on Aptos is a Move module that contains code published to the blockchain. Key points:
- Written in the Move language, designed for safe resource management
- Immutable once deployed
- Can manage digital assets and automate transactions
- Verified and executed by all network validators
- Supports composability through module imports
- Features strong type system and formal verification`,
    examples: [
      'Token standards (coins, NFTs)',
      'DeFi protocols (DEX, lending)',
      'Governance contracts',
      'Staking and rewards'
    ],
    resources: [
      'https://aptos.dev/move/move-on-aptos',
      'https://github.com/aptos-labs/aptos-core/tree/main/aptos-move/move-examples',
      'https://explorer.aptoslabs.com/modules',
      'https://docs.movebit.xyz/docs/tutorial/intro'
    ],
    liveData: {
      type: 'Link',
      url: 'https://explorer.aptoslabs.com/modules',
      description: 'View live smart contracts on Aptos Explorer'
    }
  },

  topProjects: {
    topic: 'Top Projects',
    disclaimer: 'TVL and stats are dynamic. Check DeFiLlama for real-time data.',
    liveData: {
      type: 'Link',
      url: 'https://defillama.com/chain/Aptos',
      description: 'View current TVL and rankings'
    },
    defi: [
      {
        name: 'PancakeSwap',
        description: 'Leading DEX with high liquidity and farming options',
        tvl: 'Check DeFiLlama for current TVL',
        features: ['Swap', 'Farms', 'Pools', 'IFO'],
        url: 'https://pancakeswap.finance/',
        explorer: 'https://explorer.aptoslabs.com/account/0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa'
      },
      {
        name: 'Liquid Swap',
        description: 'Native AMM DEX with concentrated liquidity',
        tvl: '$30M+',
        features: ['Swap', 'Liquidity Provision', 'Farming'],
        url: 'https://liquidswap.com/'
      },
      {
        name: 'Abel Finance',
        description: 'Lending and borrowing protocol',
        tvl: '$20M+',
        features: ['Lending', 'Borrowing', 'Flash Loans'],
        url: 'https://abel.finance/'
      }
    ],
    nft: [
      {
        name: 'Topaz',
        description: 'Leading NFT marketplace',
        features: ['Trading', 'Collections', 'Launchpad'],
        url: 'https://topaz.so/'
      },
      {
        name: 'Souffl3',
        description: 'NFT marketplace and creator platform',
        features: ['Trading', 'Creator Tools', 'Rewards'],
        url: 'https://souffl3.com/'
      }
    ],
    infrastructure: [
      {
        name: 'Pontem Network',
        description: 'Development framework and tools',
        features: ['Move IDE', 'Wallet', 'Bridge'],
        url: 'https://pontem.network/'
      },
      {
        name: 'LayerZero',
        description: 'Cross-chain messaging protocol',
        features: ['Omnichain', 'Messaging', 'Bridge'],
        url: 'https://layerzero.network/'
      }
    ]
  },

  tokenomics: {
    apt: {
      maxSupply: '1,000,000,000 APT',
      currentSupply: '~400,000,000 APT',
      distribution: [
        'Community: 51.02%',
        'Core Contributors: 19%',
        'Foundation: 16.5%',
        'Investors: 13.48%'
      ],
      utilities: [
        'Gas fees',
        'Staking',
        'Governance',
        'Protocol fees'
      ]
    }
  },

  ecosystem: {
    topic: 'Ecosystem',
    disclaimer: 'Stats are constantly changing. Check official sources for current data.',
    liveData: {
      type: 'Links',
      sources: [
        {
          name: 'Aptos Explorer',
          url: 'https://explorer.aptoslabs.com/',
          description: 'Live network stats'
        },
        {
          name: 'DeFiLlama',
          url: 'https://defillama.com/chain/Aptos',
          description: 'Live DeFi stats'
        }
      ]
    },
    stats: {
      note: 'These stats change frequently. Check live sources for current data.',
      metrics: {
        tps: '>2,000',
        activeAddresses: '>500,000',
        totalProjects: '>250'
      }
    },
    advantages: [
      'Move Language Security',
      'Parallel Transaction Execution',
      'Low Transaction Costs',
      'Fast Finality'
    ],
    challenges: [
      'Developer Adoption',
      'Cross-chain Integration',
      'Market Competition'
    ]
  }
};

export class DeFiService {
  private static instance: DeFiService;
  private readonly DEFI_LLAMA_POOLS = 'https://yields.llama.fi/pools';
  private readonly DEFI_LLAMA_PROTOCOLS = 'https://api.llama.fi/protocols';
  
  // Constants for validation
  private readonly MAX_REALISTIC_APY = 100; // 100% APY cap
  private readonly MIN_TVL = 1000; // Lower threshold to catch more pools
  private readonly STABLE_TOKENS = ['USDC', 'USDT', 'DAI'];

  // Known Aptos lending protocols
  private readonly LENDING_PROTOCOLS = [
    'abel finance',
    'aries markets',
    'amnis finance',
    'echo lending',
    'meso finance',
    'thala cdp',
    'aptin finance'
  ];

  private client: AptosClient;
  private aggregator: TradeAggregator | null = null;

  private readonly COINGECKO_IDS = {
    'APT': 'aptos',
    'USDC': 'usd-coin',
    'USDT': 'tether'
  } as const;

  // Optional: Add price caching to avoid rate limits
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.client = new AptosClient(MAINNET_CONFIG.fullNodeUrl);
  }

  private async initAggregator() {
    if (!this.aggregator) {
      try {
        const netConf = {
          ...MAINNET_CONFIG,
          fullNodeUrl: "https://fullnode.mainnet.aptoslabs.com/v1",
        };

        console.log('[initAggregator] Using config:', JSON.stringify(netConf, null, 2));
        
        // Use hardcoded default pools as shown in first example option
        console.log('[initAggregator] Creating aggregator with default pools...');
        this.aggregator = new TradeAggregator(this.client, netConf);

        // No need to call create() or init() when using default pools
        console.log('[initAggregator] Aggregator created with default pools');

        return this.aggregator;
      } catch (error) {
        console.error('[initAggregator] Error initializing aggregator:', error);
        throw error;
      }
    }
    return this.aggregator;
  }

  public static getInstance(): DeFiService {
    if (!DeFiService.instance) {
      DeFiService.instance = new DeFiService();
    }
    return DeFiService.instance;
  }

  async getLendingRates(token: string): Promise<LendingInfo[]> {
    try {
      // Get all pools from DefiLlama
      const response = await axios.get<{ data: Pool[] }>(this.DEFI_LLAMA_POOLS);
      
      // Filter for Aptos pools
      const aptosPools = response.data.data.filter((pool) => 
        pool.chain.toLowerCase() === 'aptos' &&
        pool.symbol.toUpperCase().includes(token.toUpperCase()) &&
        pool.tvlUsd >= this.MIN_TVL
      );

      console.log(`Found ${aptosPools.length} Aptos pools for ${token}`);

      // Map pools to our format with proper typing
      const mappedPools = aptosPools
        .sort((a, b) => b.tvlUsd - a.tvlUsd)
        .map((pool) => {
          const totalApy = (pool.apyBase || 0) + (pool.apyReward || 0);
          
          return {
            token: {
              symbol: pool.symbol,
              address: pool.pool,
              decimals: 8
            },
            protocol: pool.project,
            apy: totalApy.toFixed(2),
            totalSupply: pool.tvlUsd.toString(),
            totalBorrowed: (pool.tvlUsd * (pool.utilization || 0.7)).toString(),
            poolUrl: `https://defillama.com/protocol/${pool.project.toLowerCase()}/aptos`,
            updated: new Date().toISOString(),
            rewardTokens: pool.rewardTokens || []
          };
        });

      console.log('Processed pools:', mappedPools);
      return mappedPools;

    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('DeFiLlama API Error:', {
        message: axiosError.message,
        status: axiosError.response?.status,
        data: axiosError.response?.data
      });
      return [];
    }
  }

  async getBestSwapRoute(
    tokenIn: TokenType,
    tokenOut: TokenType,
    amount: string
  ): Promise<SwapRoute> {
    try {
      console.log('[getBestSwapRoute] Getting quotes for', { tokenIn, tokenOut, amount });
      const inputAmt = parseFloat(amount);

      // Get quotes from multiple DEXes
      const quotes: DexQuote[] = await Promise.all([
        this.getPancakeSwapQuote(tokenIn, tokenOut, inputAmt),
        this.getLiquidswapQuote(tokenIn, tokenOut, inputAmt),
        this.getAuxQuote(tokenIn, tokenOut, inputAmt)
      ]);

      // Filter valid quotes and sort by output amount
      const validQuotes = quotes
        .filter(q => q !== null)
        .sort((a, b) => parseFloat(b.outputAmount) - parseFloat(a.outputAmount));

      if (validQuotes.length === 0) {
        throw new Error(`No quotes available for ${tokenIn} to ${tokenOut}`);
      }

      const bestQuote = validQuotes[0];
      console.log('[getBestSwapRoute] Best quote:', bestQuote);

      return {
        tokenIn: { 
          symbol: tokenIn, 
          address: APTOS_COINS[tokenIn].address, 
          decimals: APTOS_COINS[tokenIn].decimals 
        },
        tokenOut: { 
          symbol: tokenOut, 
          address: APTOS_COINS[tokenOut].address, 
          decimals: APTOS_COINS[tokenOut].decimals 
        },
        amount: inputAmt.toString(),
        protocol: bestQuote.dex,
        expectedOutput: bestQuote.outputAmount,
        priceImpact: bestQuote.priceImpact,
        estimatedGas: '0.001 APT',
        path: [{
          dex: bestQuote.dex,
          tokenIn: tokenIn,
          tokenOut: tokenOut,
          fee: bestQuote.fee
        }],
        dexUrl: this.getDexUrl(bestQuote.dex),
        alternativeRoutes: validQuotes.slice(1).map(quote => ({
          protocol: quote.dex,
          expectedOutput: quote.outputAmount,
          priceImpact: quote.priceImpact,
          estimatedGas: '0.001 APT',
          path: [{
            dex: quote.dex,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: quote.fee
          }]
        }))
      };

    } catch (error) {
      console.error('Error getting swap quotes:', {
        error: error instanceof Error ? error.message : error,
        params: { tokenIn, tokenOut, amount }
      });
      throw error;
    }
  }

  private async getPancakeSwapQuote(tokenIn: TokenType, tokenOut: TokenType, amount: number): Promise<DexQuote | null> {
    try {
      const tokenInPrice = await this.getTokenPrice(tokenIn);
      const tokenOutPrice = await this.getTokenPrice(tokenOut);
      const outputAmount = (amount * tokenInPrice / tokenOutPrice).toString();
      
      return {
        dex: 'PancakeSwap',
        outputAmount,
        priceImpact: '0.1',
        fee: '0.3%'
      };
    } catch (error) {
      console.log('[getPancakeSwapQuote] Error:', error);
      return null;
    }
  }

  private async getLiquidswapQuote(tokenIn: TokenType, tokenOut: TokenType, amount: number): Promise<DexQuote | null> {
    try {
      const tokenInPrice = await this.getTokenPrice(tokenIn);
      const tokenOutPrice = await this.getTokenPrice(tokenOut);
      // Add a slight variation to simulate different DEX rates
      const outputAmount = (amount * tokenInPrice / tokenOutPrice * 0.995).toString();
      
      return {
        dex: 'Liquidswap',
        outputAmount,
        priceImpact: '0.15',
        fee: '0.3%'
      };
    } catch (error) {
      console.log('[getLiquidswapQuote] Error:', error);
      return null;
    }
  }

  private async getAuxQuote(tokenIn: TokenType, tokenOut: TokenType, amount: number): Promise<DexQuote | null> {
    try {
      const tokenInPrice = await this.getTokenPrice(tokenIn);
      const tokenOutPrice = await this.getTokenPrice(tokenOut);
      // Another slight variation
      const outputAmount = (amount * tokenInPrice / tokenOutPrice * 0.99).toString();
      
      return {
        dex: 'AUX',
        outputAmount,
        priceImpact: '0.2',
        fee: '0.3%'
      };
    } catch (error) {
      console.log('[getAuxQuote] Error:', error);
      return null;
    }
  }

  private getDexUrl(dex: string): string {
    const dexUrls: Record<string, string> = {
      'PancakeSwap': 'https://pancakeswap.finance/swap',
      'Liquidswap': 'https://liquidswap.com/',
      'AUX': 'https://aux.exchange/'
    };
    return dexUrls[dex] || '';
  }

  private formatSwapRoute(quote: any, xInfo: any, yInfo: any, inputAmt: number, alternativeQuotes: any[]): SwapRoute {
    return {
      tokenIn: { 
        symbol: xInfo.symbol, 
        address: xInfo.token_type.account_address, 
        decimals: xInfo.decimals 
      },
      tokenOut: { 
        symbol: yInfo.symbol, 
        address: yInfo.token_type.account_address, 
        decimals: yInfo.decimals 
      },
      amount: inputAmt.toString(),
      protocol: quote.route.poolType,
      expectedOutput: quote.quote.outputUiAmt.toString(),
      priceImpact: ((1 - quote.quote.outputUiAmt / (inputAmt * quote.quote.price)) * 100).toFixed(2),
      estimatedGas: '0.001 APT',
      path: [{
        dex: quote.route.poolType,
        tokenIn: xInfo.symbol,
        tokenOut: yInfo.symbol,
        fee: '0.3%'
      }],
      dexUrl: 'https://app.hippo.space/swap',
      alternativeRoutes: alternativeQuotes.map(q => ({
        protocol: q.route.poolType,
        expectedOutput: q.quote.outputUiAmt.toString(),
        priceImpact: ((1 - q.quote.outputUiAmt / (inputAmt * q.quote.price)) * 100).toFixed(2),
        estimatedGas: '0.001 APT',
        path: [{
          dex: q.route.poolType,
          tokenIn: xInfo.symbol,
          tokenOut: yInfo.symbol,
          fee: '0.3%'
        }]
      }))
    };
  }

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

  private async getTokenPrice(token: string): Promise<number> {
    return this.withRateLimit(async () => {
      // Get token's CoinGecko ID
      const geckoId = this.COINGECKO_IDS[token as keyof typeof this.COINGECKO_IDS];
      if (!geckoId) {
        console.warn(`[getTokenPrice] No CoinGecko ID for token: ${token}`);
        return 1; // Default to 1 for unknown tokens
      }

      // Fetch real-time price from CoinGecko
      const response = await axios.get<CoinGeckoPrice>(
        `https://api.coingecko.com/api/v3/simple/price`,
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

      console.log(`[getTokenPrice] ${token} price: $${price}`);
      return price;
    });
  }

  // Optional: Add price caching to avoid rate limits
  private async getTokenPriceWithCache(token: string): Promise<number> {
    const now = Date.now();
    const cached = this.priceCache.get(token);

    if (cached && now - cached.timestamp < this.CACHE_DURATION) {
      return cached.price;
    }

    const price = await this.getTokenPrice(token);
    this.priceCache.set(token, { price, timestamp: now });
    return price;
  }

  async getLiquidityPools(token?: string): Promise<LiquidityPoolInfo[]> {
    try {
      interface PoolData {
        chain: string;
        project: string;
        symbol: string;
        tvlUsd: number;
        apy: number;
        apyBase?: number;
        apyReward?: number;
        volumeUsd?: number;
        fee?: number;
        pool: string;
        rewardTokens?: string[];
      }

      const response = await axios.get<{ data: PoolData[] }>('https://yields.llama.fi/pools');
      
      const pools = response.data.data
        .filter(pool => 
          pool.chain.toLowerCase() === 'aptos' &&
          (!token || pool.symbol.includes(token))
        )
        .map(pool => ({
          tokens: pool.symbol.split('-'),
          protocol: pool.project,
          apy: {
            total: pool.apy,
            base: pool.apyBase || 0,
            reward: pool.apyReward || 0,
            daily: pool.apy / 365
          },
          tvl: {
            total: pool.tvlUsd,
            token0: pool.tvlUsd / 2,
            token1: pool.tvlUsd / 2
          },
          volume24h: pool.volumeUsd || 0,
          fee24h: (pool.volumeUsd || 0) * (pool.fee || 0.003),
          poolUrl: `https://app.${pool.project.toLowerCase()}.com/pool/${pool.pool}`,
          impermanentLoss30d: this.calculateImpermanentLoss(pool),
          rewards: pool.rewardTokens || []
        }));

      return pools.sort((a, b) => b.tvl.total - a.tvl.total);
    } catch (error) {
      console.error('Error fetching liquidity pools:', error);
      throw error;
    }
  }

  async getYieldOpportunities(token: string): Promise<{
    lending: LendingInfo[];
    liquidity: LiquidityPoolInfo[];
    staking: any[];
  }> {
    const [lendingRates, liquidityPools] = await Promise.all([
      this.getLendingRates(token),
      this.getLiquidityPools(token)
    ]);

    return {
      lending: lendingRates,
      liquidity: liquidityPools,
      staking: [] // Add staking opportunities if available
    };
  }

  private calculateExpectedOutput(amount: string, priceData: any, tokenIn: string, tokenOut: string): string {
    // Add sophisticated price calculation logic
    const inputPrice = priceData.data[`aptos:${tokenIn}`]?.price || 1;
    const outputPrice = priceData.data[`aptos:${tokenOut}`]?.price || 1;
    return ((parseFloat(amount) * inputPrice) / outputPrice).toFixed(6);
  }

  private calculatePriceImpact(amount: string, volumeUsd: number): string {
    // Add sophisticated price impact calculation
    const amountUsd = parseFloat(amount) * 10; // Simplified price calculation
    return ((amountUsd / volumeUsd) * 100).toFixed(2);
  }

  private calculateImpermanentLoss(pool: any): number {
    // Add impermanent loss calculation based on price volatility
    return 0.05; // Placeholder 5% IL
  }

  private getTokenAddress(symbol: string): string {
    const tokenAddresses: Record<string, string> = {
      'APT': '0x1::aptos_coin::AptosCoin',
      'USDC': '0x1::coin::USDC',
      'USDT': '0x1::coin::USDT',
      // Add more token addresses
    };
    return tokenAddresses[symbol] || '';
  }

  async getKnowledgeBaseInfo(topic: string): Promise<any> {
    const normalizedTopic = topic.toLowerCase();
    let info = null;

    // Find relevant info
    if (normalizedTopic.includes('smart contract')) {
      info = APTOS_KNOWLEDGE_BASE.smartContract;
    } else if (normalizedTopic.includes('top') && normalizedTopic.includes('project')) {
      info = APTOS_KNOWLEDGE_BASE.topProjects;
    } else if (normalizedTopic.includes('tokenomics') || normalizedTopic.includes('token')) {
      info = APTOS_KNOWLEDGE_BASE.tokenomics;
    } else if (normalizedTopic.includes('ecosystem')) {
      info = APTOS_KNOWLEDGE_BASE.ecosystem;
    }

    if (info) {
      return {
        ...info,
        metadata: {
          lastUpdated: APTOS_KNOWLEDGE_BASE.lastUpdated,
          disclaimer: 'This information may be outdated. Check live sources for current data.',
          dataAge: this.getDataAge(APTOS_KNOWLEDGE_BASE.lastUpdated)
        }
      };
    }

    return null;
  }

  private getDataAge(lastUpdated: string): string {
    const updateDate = new Date(lastUpdated);
    const now = new Date();
    const months = (now.getFullYear() - updateDate.getFullYear()) * 12 + 
                  (now.getMonth() - updateDate.getMonth());
    
    return months <= 1 ? 'Recent' : `${months} months old`;
  }
}

export default DeFiService.getInstance(); 