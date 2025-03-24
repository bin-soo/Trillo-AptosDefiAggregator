import { NextRequest, NextResponse } from 'next/server';
import copyTradingService from '@/services/copyTradingService';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  console.log("[API] Copy trading request received for address:", address);

  if (!address) {
    return NextResponse.json(
      { error: 'Address parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Validate address format with more flexible validation for testing
    // Temporarily allow shorter addresses for testing
    const isValidFormat = address.startsWith('0x') && address.length >= 10;
    
    if (!isValidFormat) {
      console.log("[API] Invalid address format:", address);
      return NextResponse.json(
        { error: 'Invalid Aptos address format' },
        { status: 400 }
      );
    }
    
    console.log("[API] Generating copy trading suggestions for:", address);
    
    // Add mock data for testing if needed
    const useMockData = true; // Set to false for real implementation
    
    if (useMockData) {
      console.log("[API] Using mock data for trader analysis");
      const mockTraderProfile = generateMockTraderProfile(address);
      
      return NextResponse.json({
        recommendedTrades: mockTraderProfile.recentActivity.slice(0, 3),
        traderProfile: mockTraderProfile,
        copyTradingScore: 78,
        reasonToCopy: [
          "Strong track record with 75.5% success rate",
          "Experienced trader with 124 transactions",
          "Focus on yield farming opportunities with steady returns",
          "Positive average return per trade (2.34%)"
        ],
        potentialRisks: [
          "Frequent trading may result in high gas fees and impermanent loss",
          "Past performance does not guarantee future results",
          "Market conditions may change rapidly affecting copy trading results"
        ],
        suggestedAllocation: 25
      });
    } else {
      // Normal service call
      const suggestions = await copyTradingService.generateCopyTradingSuggestions(address);
      return NextResponse.json(suggestions);
    }
  } catch (error) {
    console.error('Error generating copy trading suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate copy trading suggestions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to generate mock trader profile for testing
function generateMockTraderProfile(address: string) {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  return {
    address,
    totalTrades: 124,
    successRate: 75.5,
    avgProfitPerTrade: 2.34,
    profitableTrades: 94,
    lossTrades: 30,
    totalProfitLoss: 220.5,
    topTokens: ['APT', 'USDC', 'USDT', 'LayerZero'],
    topProtocols: ['Liquidswap', 'PancakeSwap', 'Tsunami'],
    tradingStyle: 'Yield Farmer',
    riskLevel: 'Medium',
    activeSince: '2022-11-15',
    recentActivity: [
      {
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        timestamp: now - dayInMs * 2,
        type: 'swap',
        protocol: 'Liquidswap',
        tokenIn: 'APT',
        tokenOut: 'USDC',
        amountIn: '10',
        amountOut: '45.2',
        profitLoss: 2.3,
        gasFee: '0.001'
      },
      {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        timestamp: now - dayInMs * 5,
        type: 'lend',
        protocol: 'Tsunami',
        tokenIn: 'USDC',
        amountIn: '100',
        profitLoss: 1.2,
        gasFee: '0.0008'
      },
      {
        hash: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
        timestamp: now - dayInMs * 7,
        type: 'swap',
        protocol: 'PancakeSwap',
        tokenIn: 'USDT',
        tokenOut: 'APT',
        amountIn: '50',
        amountOut: '12.1',
        profitLoss: 3.5,
        gasFee: '0.0012'
      },
      {
        hash: '0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc',
        timestamp: now - dayInMs * 10,
        type: 'stake',
        protocol: 'Tortuga',
        tokenIn: 'APT',
        amountIn: '20',
        profitLoss: 0.8,
        gasFee: '0.0015'
      },
      {
        hash: '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
        timestamp: now - dayInMs * 15,
        type: 'swap',
        protocol: 'Liquidswap',
        tokenIn: 'USDC',
        tokenOut: 'USDT',
        amountIn: '200',
        amountOut: '199.5',
        profitLoss: -0.25,
        gasFee: '0.0009'
      }
    ]
  };
} 