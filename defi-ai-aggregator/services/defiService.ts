import axios from 'axios';
import { SwapInfo, LendingInfo } from '../types/defi';

export class DeFiService {
  private static instance: DeFiService;
  private readonly DEFI_LLAMA_POOLS = 'https://yields.llama.fi/pools';
  private readonly DEFI_LLAMA_PROTOCOLS = 'https://api.llama.fi/protocols';
  
  // Constants for validation
  private readonly MAX_REALISTIC_APY = 100; // 100% APY cap
  private readonly MIN_TVL = 10000; // Lower TVL threshold to catch more pools
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
      // Get pools with chain filter
      const poolsResponse = await axios.get(this.DEFI_LLAMA_POOLS, {
        params: {
          chain: 'Aptos'
        }
      });

      console.log('Raw pools response:', poolsResponse.data.data.slice(0, 2));

      // Filter pools more precisely
      const relevantPools = poolsResponse.data.data.filter((pool: any) => {
        // Basic relevance checks
        const projectName = pool.project.toLowerCase();
        const isLendingProtocol = this.LENDING_PROTOCOLS.some(protocol => 
          projectName.includes(protocol.toLowerCase()));
        
        const isRelevantPool = 
          isLendingProtocol && // Is a known lending protocol
          pool.symbol.toUpperCase().includes(token.toUpperCase()) && // Matches token
          pool.tvlUsd >= this.MIN_TVL && // Has significant TVL
          pool.apy > 0; // Has positive yield

        if (!isRelevantPool) {
          console.log('Filtered out pool:', {
            project: pool.project,
            symbol: pool.symbol,
            isLendingProtocol,
            tvl: pool.tvlUsd,
            apy: pool.apy
          });
          return false;
        }

        // Additional validation for realistic rates
        const apy = parseFloat(pool.apy);
        const isStablePair = this.STABLE_TOKENS.some(stable => 
          pool.symbol.toUpperCase().includes(stable));

        // More stringent APY validation for stable pairs
        const isRealisticAPY = isStablePair ? 
          apy <= 20 : // 20% cap for stable pairs
          apy <= this.MAX_REALISTIC_APY; // 100% cap for other pairs

        if (isRelevantPool && isRealisticAPY) {
          console.log('Found valid lending pool:', {
            protocol: pool.project,
            symbol: pool.symbol,
            apy: apy.toFixed(2) + '%',
            tvl: '$' + pool.tvlUsd.toLocaleString(),
            isStablePair
          });
        }

        return isRelevantPool && isRealisticAPY;
      });

      // Sort by TVL to prioritize more liquid pools
      return relevantPools
        .sort((a, b) => b.tvlUsd - a.tvlUsd)
        .map((pool: any) => ({
          token: {
            symbol: pool.symbol,
            address: pool.pool,
            decimals: 8
          },
          protocol: pool.project,
          apy: parseFloat(pool.apy).toFixed(2),
          totalSupply: pool.tvlUsd.toString(),
          totalBorrowed: (pool.tvlUsd * (pool.utilization || 0.7)).toString(),
          poolUrl: `https://defillama.com/protocol/${pool.project.toLowerCase()}/aptos`,
          updated: new Date().toISOString(),
          stablePair: this.STABLE_TOKENS.some(stable => 
            pool.symbol.toUpperCase().includes(stable)),
          rewardTokens: pool.rewardTokens || []
        }));

    } catch (error) {
      console.error('DeFiLlama API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
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