export type TokenInfo = {
  symbol: string;
  address: string;
  decimals: number;
};

export type SwapInfo = {
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  amount: string;
  expectedOutput: string;
  protocol: string;
  priceImpact: string;
  dexUrl: string;
};

export type LendingInfo = {
  token: TokenInfo;
  protocol: string;
  apy: string;
  totalSupply: string;
  totalBorrowed: string;
  poolUrl: string;
  updated: string;
};

export type DeFiAction = {
  type: 'swap' | 'lend' | 'borrow' | 'provide_liquidity';
  data: SwapInfo | LendingInfo;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  action?: DeFiAction;
}; 