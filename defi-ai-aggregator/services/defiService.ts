import axios from 'axios';
import { SwapInfo, LendingInfo } from '../types/defi';

export class DeFiService {
  private static instance: DeFiService;
  private readonly DEFI_LLAMA_API = 'https://yields.llama.fi/pools';

  private constructor() {}

  public static getInstance(): DeFiService {
    if (!DeFiService.instance) {
      DeFiService.instance = new DeFiService();
    }
    return DeFiService.instance;
  }

  async getLendingRates(token: string): Promise<LendingInfo[]> {
    try {
      const response = await axios.get(`${this.DEFI_LLAMA_API}?chain=aptos`);
      return response.data.data
        .filter((pool: any) => pool.symbol.includes(token))
        .map((pool: any) => ({
          token: {
            symbol: pool.symbol,
            address: pool.pool,
            decimals: 8
          },
          protocol: pool.project,
          apy: pool.apy.toString(),
          totalSupply: pool.tvlUsd.toString(),
          totalBorrowed: (pool.tvlUsd * 0.7).toString() // Mock data
        }));
    } catch (error) {
      console.error('Error fetching lending rates:', error);
      return [];
    }
  }

  async getBestSwapRoute(
    tokenIn: string,
    tokenOut: string,
    amount: string
  ): Promise<SwapInfo> {
    // Mock data - in real implementation, you would query DEX aggregators
    return {
      tokenIn: {
        symbol: tokenIn,
        address: '0x1::aptos_coin::AptosCoin',
        decimals: 8
      },
      tokenOut: {
        symbol: tokenOut,
        address: '0x1::usdc::USDC',
        decimals: 6
      },
      amount,
      expectedOutput: (Number(amount) * 10).toString(), // Mock conversion
      protocol: 'PancakeSwap',
      priceImpact: '0.1'
    };
  }
}

export default DeFiService.getInstance(); 