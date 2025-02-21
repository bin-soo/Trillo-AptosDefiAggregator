import axios, { AxiosError } from 'axios';
import { SwapInfo, LendingInfo } from '../types/defi';

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

  private constructor() {}

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
    tokenIn: string,
    tokenOut: string,
    amount: string
  ): Promise<SwapInfo> {
    try {
      // Get DEX volumes for Aptos
      const response = await axios.get(`https://api.llama.fi/overview/dexs/aptos`);
      
      // Get the top DEX by volume
      const topDex = response.data.protocols?.[0] || {
        name: 'PancakeSwap',
        slug: 'pancakeswap',
        volumeUsd: 1000000
      };

      // Mock swap data using real DEX info
      return {
        tokenIn: {
          symbol: tokenIn,
          address: '0x1::aptos_coin::AptosCoin',
          decimals: 8
        },
        tokenOut: {
          symbol: tokenOut,
          address: '0x1::coin::USDC',
          decimals: 6
        },
        amount,
        expectedOutput: (Number(amount) * (response.data.currentPrice || 1)).toString(),
        protocol: topDex.name,
        priceImpact: '0.1',
        dexUrl: `https://defillama.com/dex/${topDex.slug}`
      };
    } catch (error) {
      console.error('Error fetching swap data:', error);
      throw error;
    }
  }
}

export default DeFiService.getInstance(); 