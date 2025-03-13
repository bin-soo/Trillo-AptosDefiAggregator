import axios, { AxiosError } from 'axios';
import { LendingInfo, LiquidityPoolInfo, Pool, PoolData } from './interfaces';

export class LendingService {
  private static instance: LendingService;
  private readonly DEFI_LLAMA_POOLS = 'https://yields.llama.fi/pools';
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

  public static getInstance(): LendingService {
    if (!LendingService.instance) {
      LendingService.instance = new LendingService();
    }
    return LendingService.instance;
  }

  /**
   * Get lending rates for a specific token
   */
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

  /**
   * Get liquidity pools for a specific token
   */
  async getLiquidityPools(token?: string): Promise<LiquidityPoolInfo[]> {
    try {
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

  /**
   * Get yield opportunities for a specific token
   */
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

  /**
   * Calculate impermanent loss for a pool
   */
  private calculateImpermanentLoss(pool: any): number {
    // Add impermanent loss calculation based on price volatility
    return 0.05; // Placeholder 5% IL
  }

  /**
   * Calculate expected output for a swap
   */
  calculateExpectedOutput(amount: string, priceData: any, tokenIn: string, tokenOut: string): string {
    // Add sophisticated price calculation logic
    const inputPrice = priceData.data[`aptos:${tokenIn}`]?.price || 1;
    const outputPrice = priceData.data[`aptos:${tokenOut}`]?.price || 1;
    return ((parseFloat(amount) * inputPrice) / outputPrice).toFixed(6);
  }

  /**
   * Calculate price impact for a swap
   */
  calculatePriceImpact(amount: string, volumeUsd: number): string {
    // Add sophisticated price impact calculation
    const amountUsd = parseFloat(amount) * 10; // Simplified price calculation
    return ((amountUsd / volumeUsd) * 100).toFixed(2);
  }
}

export default LendingService.getInstance(); 