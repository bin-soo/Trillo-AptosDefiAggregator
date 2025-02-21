export type TokenInfo = {
  symbol: string;
  address: string;
  decimals: number;
};

export type SwapRoute = {
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  amount: string;
  expectedOutput: string;
  protocol: string;
  priceImpact: string;
  estimatedGas: string;
  path: {
    dex: string;
    tokenIn: string;
    tokenOut: string;
    fee: string;
  }[];
  dexUrl: string;
  alternativeRoutes?: Omit<SwapRoute, 'alternativeRoutes' | 'swapPayload'>[];
  swapPayload?: any;
};

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
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  action?: DeFiAction;
}; 