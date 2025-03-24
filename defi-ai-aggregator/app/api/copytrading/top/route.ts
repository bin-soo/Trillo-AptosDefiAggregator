import { NextResponse } from 'next/server';

// Example top traders data - in a real implementation, this would come from a database or on-chain analysis
const TOP_TRADERS = [
  {
    address: '0x9a02349359b8a9a6ba9cbea71f89a998c0381db2b18e67df85f1cc50bb694dff',
    name: 'AptosWhale',
    description: 'Top APT trader with consistent performance',
    tradingStyle: 'Active Trader',
    riskLevel: 'Medium',
    score: 87
  },
  {
    address: '0x25a1c3a921c93aaf2bfb5af42034af45c7737714d8115ac573a17cd997ca829c',
    name: 'YieldHunter',
    description: 'Specializes in yield farming strategies',
    tradingStyle: 'Yield Farmer',
    riskLevel: 'Low',
    score: 92
  },
  {
    address: '0x77e2b0fc28fc8de4c4c665caa7ea9efe40595af2c1c3a922c8e3c6a36a2d953f',
    name: 'LiquidityPro',
    description: 'Focus on DEX and liquidity provision',
    tradingStyle: 'Diversified Trader',
    riskLevel: 'Low',
    score: 85
  },
  {
    address: '0x25c1c874372ce9abca8d33a66a8b3eb9b305ef78c1c3a921c91b7dc6a36a29a3',
    name: 'SwapMaster',
    description: 'Specializes in arbitrage opportunities',
    tradingStyle: 'Active Trader',
    riskLevel: 'High',
    score: 76
  }
];

export async function GET() {
  console.log("[API] Returning top traders list");
  return NextResponse.json({ traders: TOP_TRADERS });
} 