# Aptos DeFi AI Aggregator

An intelligent DeFi aggregator for the Aptos blockchain that combines natural language processing with real-time DeFi data aggregation.

## Features

### 🔄 Swap Aggregation
- Multi-DEX price comparison (PancakeSwap, Liquidswap, AUX)
- Best route calculation with alternatives
- Price impact estimation
- Gas cost estimation
- No actual transaction execution (simulation only)

### 💰 Yield Analysis
- Lending rates across protocols
- Liquidity pool opportunities
- APY comparison and validation
- TVL tracking
- Impermanent loss estimation

### 🤖 AI-Powered Interface
- Natural language query processing
- Context-aware responses
- Swap parameter extraction from text
- Token recognition
- Price trend analysis

### 📚 Knowledge Base
- Smart contract information
- Top project tracking
- Real-time ecosystem stats
- Live data source integration
- Data freshness tracking

## Technical Stack

### Data Sources
- DeFiLlama API for yield data
- On-chain data via Aptos Client
- Mock price feeds (expandable to CoinGecko/real feeds)

### Frameworks & Libraries
- Next.js for the frontend
- Vercel AI SDK for natural language processing
- Aptos SDK for blockchain interaction
- Axios for API calls

### Key Components

```typescript
// Swap Route Extraction
function extractSwapParams(message: string): SwapParams {
  // Extracts amount, tokenIn, tokenOut from natural language
}

// Multi-DEX Quote Aggregation
async getBestSwapRoute(tokenIn: TokenType, tokenOut: TokenType, amount: string): Promise<SwapRoute> {
  // Aggregates quotes from multiple DEXes
  // Returns best route with alternatives
}

// Yield Opportunity Analysis
async getYieldOpportunities(token: string): Promise<{
  lending: LendingInfo[];
  liquidity: LiquidityPoolInfo[];
  staking: any[];
}> {
  // Aggregates and analyzes yield opportunities
}
```

## Usage Examples

### Swap Query
```typescript
// Natural language query
"What's the best rate to swap 10 APT to USDC?"

// Response includes:
- Best available rate
- Alternative routes
- Price impact
- Gas estimates
```

### Yield Query
```typescript
// Natural language query
"Show me the best USDC lending rates"

// Response includes:
- Top lending protocols
- APY rates
- TVL information
- Risk metrics
```

### Knowledge Query
```typescript
// Natural language query
"What are the top DeFi projects on Aptos?"

// Response includes:
- Project listings
- TVL stats
- Live data links
- Recent updates
```

## Safety Features

- APY validation to filter unrealistic rates
- TVL thresholds for protocol safety
- Price impact warnings
- Data freshness indicators
- DYOR (Do Your Own Research) reminders

## Future Improvements

1. Real price feed integration
2. Transaction simulation
3. Risk scoring system
4. Historical performance tracking
5. Cross-chain comparison
6. Portfolio management features

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

```env
OPENAI_API_KEY=your_key_here
NEXT_PUBLIC_APP_URL=your_app_url
```

## Contributing

Contributions welcome! Please read our contributing guidelines and submit PRs.

## License

MIT 