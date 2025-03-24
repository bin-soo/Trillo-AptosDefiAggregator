# Trillo: AI-Powered DeFi Aggregator for Aptos

Trillo is an intelligent DeFi aggregator built on the Aptos blockchain that simplifies complex DeFi operations through a conversational AI interface. It provides seamless access to optimal swaps, yield farming opportunities, copy trading, and comprehensive market analysis—all in one unified platform.

For better preview and visualization, please use main branch code for swap-related operations with automatic chat transactions and geekNoSwap for the remaining copy trading, market intelligence, etc.

## 🚀 Features

### Smart Swap Routing
- **Cross-DEX Optimization**: Automatically finds the best routes across PancakeSwap, Liquidswap, and other Aptos DEXes
- **Price Impact Analysis**: Calculates and displays expected price impact before execution
- **Slippage Protection**: Adjustable slippage tolerance to protect your trades
- **Multi-Hop Routing**: Intelligently routes through intermediate tokens when direct routes aren't optimal

### Yield Optimization
- **Lending Rate Comparison**: Compares rates across Abel Finance, Aries Markets, and other Aptos lending protocols
- **Liquidity Pool Analysis**: Identifies highest-yield LP opportunities with impermanent loss estimates
- **Staking Opportunities**: Discovers and analyzes staking options with risk assessments
- **Personalized Recommendations**: Suggests the best opportunities based on your risk profile

### Copy Trading
- **Top Trader Discovery**: Identifies successful traders on Aptos based on historical performance
- **Strategy Analysis**: Breaks down trading styles, risk levels, and success rates
- **Performance Metrics**: Provides comprehensive metrics on trader performance
- **Allocation Suggestions**: Recommends appropriate portfolio allocation for each trader

### Market Intelligence
- **Real-Time Data**: Fetches current token prices and market conditions
- **Trend Detection**: Identifies emerging market trends and opportunities
- **Protocol Insights**: Provides information about Aptos DeFi protocols and their performance
- **Educational Responses**: Explains complex DeFi concepts in accessible language

### Natural Language Interface
- **Conversational Interaction**: Interact with DeFi using simple English commands
- **Intent Detection**: Accurately determines what you're trying to do
- **Context Awareness**: Remembers previous interactions for a seamless experience
- **Guided Decision-Making**: Explains options and tradeoffs to help you make informed choices

## 🛠️ Technology Stack

- **Frontend**: Next.js, React, TailwindCSS
- **AI Integration**: OpenAI, Streaming API responses
- **Blockchain**: Aptos Move VM
- **Data Sources**: CoinGecko, DeFiLlama, On-chain data
- **DEX Integration**: PancakeSwap, Liquidswap, AUX, Thala
- **Wallet Connection**: Petra Wallet, Aptos Wallet Adapter

## 🧩 Architecture

Trillo is built with a modular architecture that enables seamless integration of multiple services:

- **Core Service Layer**: Manages communication between the UI and blockchain
  - `defiService.ts`: Coordinates all DeFi-related functionality
  - `swapService.ts`: Handles swap routing and execution
  - `lendingService.ts`: Manages lending rate fetching and analysis
  - `dexService.ts`: Abstracts interactions with different DEXes
  - `priceService.ts`: Provides token pricing with fallback mechanisms
  - `copyTradingService.ts`: Analyzes trader profiles and strategies

- **UI Components**: Clean, intuitive interface for interacting with the platform
  - `SwapAgent.tsx`: AI-powered swap execution assistant
  - `ChatMessage.tsx`: Conversational interface with rich formatting
  - `QuickActions.tsx`: One-click access to common actions
  - `TopTraders.tsx`: Displays and analyzes top traders to follow

- **API Layer**: Backend processing for complex operations
  - Natural language processing for intent detection
  - Routing of requests to appropriate services
  - Streaming responses for real-time feedback

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Petra Wallet browser extension

### Installation

1. Clone the repository
```bash
git clone
cd trillo-defi-aggregator
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
create your own .env.local with:
```bash
OPENAI_API_KEY=your_openai_api_key
```

4. Start the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser


## Usage Examples

### Auto Swapping Tokens
```typescript
// either Natural language query or open swap page
"Swap 1 APT to USDC"

// Response:
Trillo will find the best route across multiple DEXes to swap 10 APT for USDC, considering factors like price impact and slippage. It will display the expected output, best DEX, and estimated gas fees. You can then confirm the transaction in your connected wallet.
```

### Yield Query
```typescript
// Natural language query
"Show me the best USDC lending rates"

// Response:
Trillo will analyze lending rates and liquidity pools across Aptos protocols to find the highest yield opportunities for 100 USDC. It will provide a summary of the best options, including APY, TVL, and any associated risks.
```

### Copy Trading
```typescript
// Natural language query
"Show me top traders to follow"

// Response:
Trillo will display a list of top-performing traders on the Aptos network, along with their trading styles, risk levels, and performance metrics. You can analyze their strategies and decide if you want to follow their trades.
```

### Market Analysis
```typescript
// Natural language query
"Analyze the market sentiment for APT"

// Response:
Trillo will provide a comprehensive analysis of the current market sentiment for APT, including price trends, technical indicators, and recent news. This helps you make informed decisions about your trading strategies.
```

### Knowledge Query
```typescript
// Natural language query
"Analyze my portfolio"

// Response includes:
Trillo will assess your connected wallet's holdings, providing insights into asset allocation, potential risks, and opportunities for optimization. It will suggest actions to improve your portfolio's performance.
```

### Knowledge Query
```typescript
// Natural language query
"What are the top DeFi projects on Aptos?"

// Response includes:
Trillo will explain complex DeFi concepts like impermanent loss in simple terms, helping you understand the risks and mechanics involved in liquidity provision.
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

## Contributing

Contributions welcome! Please read our contributing guidelines and submit PRs.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Aptos Labs](https://aptoslabs.com/) for the incredible blockchain platform
- [Panora](https://docs.panora.exchange/developer/swap-api-and-sdk) and other DEX aggregators for the powerful routing computation
- [PancakeSwap](https://pancakeswap.finance/) and other Aptos DEXes for their protocols
- [CoinGecko](https://coingecko.com/) and [DeFiLlama](https://defillama.com/) for market data
- The entire Aptos community for building an amazing ecosystem

---

Built with ❤️ for the Aptos Hackathon
