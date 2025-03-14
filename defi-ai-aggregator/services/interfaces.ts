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
    usd_market_cap?: number;
    usd_24h_vol?: number;
    usd_24h_change?: number;
  }
}

export interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  market_data: {
    current_price: {
      usd: number;
    };
    market_cap: {
      usd: number;
    };
    total_volume: {
      usd: number;
    };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
  };
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

export interface TokenPriceResponse {
  price: number;
  timestamp: number;
}

export interface DeFiLlamaProtocol {
  name: string;
  tvl: number;
  change_1d: number;
  change_7d: number;
  chains: string[];
  category: string;
  url: string;
}

export interface DeFiLlamaPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase?: number;
  apyReward?: number;
  rewardTokens?: string[];
  pool: string;
  volumeUsd?: number;
}

export interface AptosExplorerStats {
  active_addresses_24h: number;
  transactions_24h: number;
  tps_24h: number;
  gas_used_24h: number;
} 