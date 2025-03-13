export interface Pool {
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

export interface DexProtocol {
  name: string;
  volumeUsd: number;
  fee?: string;
}

export interface PriceData {
  data: Record<string, { price: number }>;
}

export interface DexQuote {
  dex: string;
  dexName: string;
  outputAmount: string;
  priceImpact: string;
  fee: string;
  dexUrl: string;
  gasEstimate?: number;
}

export interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
  }
}

export interface PoolData {
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

export interface SwapParams {
  chainId: string;
  fromTokenAddress: `0x${string}`;
  toTokenAddress: `0x${string}`;
  fromTokenAmount?: string;
  toTokenAmount?: string;
  toWalletAddress: `0x${string}`;
  slippagePercentage: string;
  integratorFeeAddress?: string;
  integratorFeePercentage?: string;
} 