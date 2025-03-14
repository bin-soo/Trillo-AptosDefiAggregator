export type TokenInfo = {
  symbol: string;
  address: string;
  decimals: number;
};

export interface SwapRoute {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  expectedOutput: string;
  priceImpact: number;
  estimatedGas: number;
  dex: string;
  protocol?: string;
  alternativeRoutes?: AlternativeRoute[];
  swapPayload?: any; // Transaction payload for the wallet to sign
  // Additional properties for Panora integration
  tokenIn?: {
    symbol: string;
    address: string;
    decimals: number;
  };
  tokenOut?: {
    symbol: string;
    address: string;
    decimals: number;
  };
  amount?: string;
  path?: Array<{
    dex: string;
    tokenIn: string;
    tokenOut: string;
    fee: string;
  }>;
  dexUrl?: string;
}

export type LendingInfo = {
  token: TokenInfo;
  protocol: string;
  apy: string;
  totalSupply: string;
  totalBorrowed: string;
  poolUrl: string;
  updated: string;
  rewardTokens?: string[];
  ltv?: number;
  borrowApy?: string;
  utilizationRate?: number;
};

export type LiquidityPoolInfo = {
  tokens: string[];
  protocol: string;
  apy: {
    total: number;
    base: number;
    reward: number;
    daily: number;
  };
  tvl: {
    total: number;
    token0: number;
    token1: number;
  };
  volume24h: number;
  fee24h: number;
  poolUrl: string;
  impermanentLoss30d: number;
  rewards: string[];
};

export type DeFiAction = {
  type: 'swap' | 'lend' | 'borrow' | 'provide_liquidity' | 'yield_comparison';
  data: SwapRoute | LendingInfo | LiquidityPoolInfo;
  actionable?: boolean;
  actionText?: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  action?: DeFiAction;
};

export type TokenSymbol = 'APT' | 'USDC' | 'USDT' | 'DAI';

export interface TokenPair {
  fromToken: TokenSymbol;
  toToken: TokenSymbol;
}

export interface AlternativeRoute {
  protocol: string;
  expectedOutput: string;
  priceImpact: string;
  estimatedGas: number;
}

// New types for market dashboard
export interface TokenData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  tvl?: number;
}

export interface ProtocolData {
  name: string;
  tvl: number;
  change24h: number;
  change1h?: number;
  volume24h?: number;
  category?: string;
  url?: string;
  description?: string;
  chains?: string[];
}

export interface EcosystemData {
  totalTVL: number;
  marketCap: number;
  volume24h: number;
  activeUsers: number;
  transactions24h: number;
}

export interface MarketData {
  tokens: TokenData[];
  protocols: ProtocolData[];
  ecosystem: EcosystemData;
  lastUpdated: string;
}

export interface MarketAnalysisQuery {
  topic: string;
  timeframe?: 'day' | 'week' | 'month' | 'year';
  tokens?: string[];
} 