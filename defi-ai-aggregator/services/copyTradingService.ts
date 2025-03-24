import { AptosClient } from 'aptos';
import { APTOS_NODE_URL } from './constants';
import priceService from './priceService';

interface Trade {
  hash: string;
  timestamp: number;
  type: 'swap' | 'lend' | 'borrow' | 'stake' | 'liquidation' | 'other';
  protocol: string;
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string;
  amountOut?: string;
  profitLoss?: number;
  gasFee?: string;
}

interface TraderProfile {
  address: string;
  totalTrades: number;
  successRate: number;
  avgProfitPerTrade: number;
  profitableTrades: number;
  lossTrades: number;
  totalProfitLoss: number;
  topTokens: string[];
  topProtocols: string[];
  tradingStyle: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  activeSince: string;
  recentActivity: Trade[];
}

interface CopyTradingSuggestion {
  recommendedTrades: Trade[];
  traderProfile: TraderProfile;
  copyTradingScore: number;
  reasonToCopy: string[];
  potentialRisks: string[];
  suggestedAllocation: number;
}

class CopyTradingService {
  private client: AptosClient;
  
  constructor() {
    this.client = new AptosClient(APTOS_NODE_URL);
  }

  /**
   * Fetch all transactions for a specific address
   * @param address The address to fetch transactions for
   * @param limit Max number of transactions to fetch
   */
  async getAddressTransactions(address: string, limit: number = 25): Promise<any[]> {
    try {
      const transactions = await this.client.getAccountTransactions(address, { limit });
      return transactions;
    } catch (error) {
      console.error(`Error fetching transactions for address ${address}:`, error);
      return [];
    }
  }

  /**
   * Parse transactions into standardized trade objects
   */
  parseTransactionsToTrades(transactions: any[]): Trade[] {
    return transactions.map(tx => {
      // Parse transaction based on payload and events
      try {
        const timestamp = new Date(tx.timestamp / 1000).getTime();
        
        // Detect transaction type
        let type: Trade['type'] = 'other';
        let protocol = 'Unknown';
        let tokenIn, tokenOut, amountIn, amountOut;
        
        // Check function name from payload to determine type and protocol
        if (tx.payload?.function) {
          const functionPath = tx.payload.function.split('::');
          
          // Extract protocol from function path
          if (functionPath.length >= 2) {
            protocol = this.mapModuleToProtocol(functionPath[0], functionPath[1]);
          }
          
          // Determine transaction type based on function name
          const functionName = functionPath[functionPath.length - 1].toLowerCase();
          
          if (functionName.includes('swap')) {
            type = 'swap';
            // Try to extract tokens involved from function args or events
            if (tx.payload.type_arguments && tx.payload.type_arguments.length >= 2) {
              tokenIn = this.extractTokenSymbolFromType(tx.payload.type_arguments[0]);
              tokenOut = this.extractTokenSymbolFromType(tx.payload.type_arguments[1]);
            }
            
            // Try to extract amounts
            if (tx.payload.arguments && tx.payload.arguments.length >= 1) {
              amountIn = tx.payload.arguments[0];
            }
          } else if (functionName.includes('deposit') || functionName.includes('supply')) {
            type = 'lend';
          } else if (functionName.includes('borrow')) {
            type = 'borrow';
          } else if (functionName.includes('stake')) {
            type = 'stake';
          } else if (functionName.includes('liquidate')) {
            type = 'liquidation';
          }
        }
        
        // Additional data extraction from events
        // This would need to be customized based on the protocols' event structures
        
        return {
          hash: tx.hash,
          timestamp,
          type,
          protocol,
          tokenIn,
          tokenOut,
          amountIn,
          amountOut,
          gasFee: tx.gas_used
        };
      } catch (error) {
        console.error('Error parsing transaction:', error);
        return {
          hash: tx.hash,
          timestamp: new Date(tx.timestamp / 1000).getTime(),
          type: 'other',
          protocol: 'Unknown'
        };
      }
    });
  }

  /**
   * Map module path to known protocol names
   */
  private mapModuleToProtocol(address: string, module: string): string {
    // This mapping would need to be expanded with actual protocol addresses
    const protocolMappings: Record<string, Record<string, string>> = {
      '0x5a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948': {
        'liquidswap': 'Liquidswap',
        'curves': 'Liquidswap'
      },
      '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12': {
        'swap': 'PancakeSwap',
        'router': 'PancakeSwap'
      },
      // Add more protocol mappings as needed
    };
    
    if (protocolMappings[address] && protocolMappings[address][module]) {
      return protocolMappings[address][module];
    }
    
    // Try to infer from module name
    if (module.toLowerCase().includes('liquid')) return 'Liquidswap';
    if (module.toLowerCase().includes('pancake')) return 'PancakeSwap';
    if (module.toLowerCase().includes('thala')) return 'Thala';
    if (module.toLowerCase().includes('tortuga')) return 'Tortuga';
    if (module.toLowerCase().includes('ditto')) return 'Ditto';
    if (module.toLowerCase().includes('abel')) return 'Abel Finance';
    
    return 'Unknown';
  }

  /**
   * Extract token symbol from type string
   */
  private extractTokenSymbolFromType(typeStr: string): string {
    // Example: "0x1::aptos_coin::AptosCoin" -> "APT"
    if (typeStr.includes('::aptos_coin::')) return 'APT';
    if (typeStr.includes('::usdc::')) return 'USDC';
    if (typeStr.includes('::usdt::')) return 'USDT';
    if (typeStr.includes('::dai::')) return 'DAI';
    
    // Extract the last part after ::
    const parts = typeStr.split('::');
    return parts[parts.length - 1];
  }

  /**
   * Analyze trades to build a trader profile
   */
  async analyzeTraderProfile(address: string): Promise<TraderProfile> {
    try {
      // Get transactions for the address
      const transactions = await this.getAddressTransactions(address, 100);
      const trades = this.parseTransactionsToTrades(transactions);
      
      // Basic stats calculation
      const totalTrades = trades.length;
      let profitableTrades = 0;
      let lossTrades = 0;
      let totalProfitLoss = 0;
      
      // Token and protocol frequency
      const tokenFrequency: Record<string, number> = {};
      const protocolFrequency: Record<string, number> = {};
      
      // Analyze each trade
      for (const trade of trades) {
        // Update protocol frequency
        protocolFrequency[trade.protocol] = (protocolFrequency[trade.protocol] || 0) + 1;
        
        // Update token frequency
        if (trade.tokenIn) {
          tokenFrequency[trade.tokenIn] = (tokenFrequency[trade.tokenIn] || 0) + 1;
        }
        if (trade.tokenOut) {
          tokenFrequency[trade.tokenOut] = (tokenFrequency[trade.tokenOut] || 0) + 1;
        }
        
        // Calculate profit/loss for swaps (would require historical price data)
        if (trade.type === 'swap' && trade.tokenIn && trade.tokenOut && trade.amountIn && trade.amountOut) {
          // This is a simplified approach - real implementation would need historical prices
          const estimatedProfitLoss = 0; // Placeholder
          
          trade.profitLoss = estimatedProfitLoss;
          
          if (estimatedProfitLoss > 0) {
            profitableTrades++;
            totalProfitLoss += estimatedProfitLoss;
          } else if (estimatedProfitLoss < 0) {
            lossTrades++;
            totalProfitLoss += estimatedProfitLoss;
          }
        }
      }
      
      // Get top tokens and protocols
      const topTokens = Object.entries(tokenFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([token]) => token);
        
      const topProtocols = Object.entries(protocolFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([protocol]) => protocol);
      
      // Determine trading style and risk level
      const tradingStyle = this.determineTradingStyle(trades);
      const riskLevel = this.determineRiskLevel(trades, profitableTrades, lossTrades);
      
      // Find earliest activity
      const earliestTrade = trades.reduce(
        (earliest, trade) => trade.timestamp < earliest.timestamp ? trade : earliest,
        trades[0]
      );
      
      const activeSince = new Date(earliestTrade.timestamp).toLocaleDateString();
      
      // Calculate success rate and average profit
      const successRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
      const avgProfitPerTrade = (profitableTrades + lossTrades) > 0 ? 
        totalProfitLoss / (profitableTrades + lossTrades) : 0;
      
      // Sort trades by timestamp (most recent first)
      const recentActivity = [...trades].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
      
      return {
        address,
        totalTrades,
        successRate,
        avgProfitPerTrade,
        profitableTrades,
        lossTrades,
        totalProfitLoss,
        topTokens,
        topProtocols,
        tradingStyle,
        riskLevel,
        activeSince,
        recentActivity
      };
    } catch (error) {
      console.error(`Error analyzing trader profile for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Determine trading style based on trade patterns
   */
  private determineTradingStyle(trades: Trade[]): string {
    // Count frequency of each type
    const typeFrequency: Record<string, number> = {};
    trades.forEach(trade => {
      typeFrequency[trade.type] = (typeFrequency[trade.type] || 0) + 1;
    });
    
    // Look at time between trades
    const sortedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp);
    let timeBetweenTrades: number[] = [];
    
    for (let i = 1; i < sortedTrades.length; i++) {
      timeBetweenTrades.push(sortedTrades[i].timestamp - sortedTrades[i-1].timestamp);
    }
    
    const avgTimeBetweenTrades = timeBetweenTrades.reduce((sum, time) => sum + time, 0) / timeBetweenTrades.length;
    
    // Determine style based on patterns
    if (typeFrequency['swap'] && typeFrequency['swap'] > trades.length * 0.7) {
      if (avgTimeBetweenTrades < 3600000) { // Less than 1 hour
        return 'Active Trader';
      } else if (avgTimeBetweenTrades < 86400000) { // Less than 1 day
        return 'Day Trader';
      }
    }
    
    if (typeFrequency['lend'] && typeFrequency['lend'] > trades.length * 0.4) {
      return 'Yield Farmer';
    }
    
    if (trades.length < 10 && avgTimeBetweenTrades > 604800000) { // More than 1 week
      return 'Passive Investor';
    }
    
    return 'Diversified Trader';
  }

  /**
   * Determine risk level based on trading patterns
   */
  private determineRiskLevel(trades: Trade[], profitableTrades: number, lossTrades: number): 'Low' | 'Medium' | 'High' {
    // Check if many risky transactions (liquidations, high value swaps)
    const hasLiquidations = trades.some(trade => trade.type === 'liquidation');
    
    // Check success rate
    const totalAnalyzedTrades = profitableTrades + lossTrades;
    const successRate = totalAnalyzedTrades > 0 ? profitableTrades / totalAnalyzedTrades : 0;
    
    if (hasLiquidations || successRate < 0.4) {
      return 'High';
    } else if (successRate < 0.6) {
      return 'Medium';
    } else {
      return 'Low';
    }
  }

  /**
   * Generate copy trading suggestions based on trader profile
   */
  async generateCopyTradingSuggestions(address: string): Promise<CopyTradingSuggestion> {
    try {
      const profile = await this.analyzeTraderProfile(address);
      
      // Filter recent profitable trades for recommendations
      const recommendedTrades = profile.recentActivity
        .filter(trade => trade.profitLoss ? trade.profitLoss > 0 : false)
        .slice(0, 5);
      
      // Calculate copy trading score (0-100)
      const copyTradingScore = this.calculateCopyTradingScore(profile);
      
      // Generate reasons to copy
      const reasonToCopy = this.generateReasonsToCopy(profile);
      
      // Generate potential risks
      const potentialRisks = this.generatePotentialRisks(profile);
      
      // Calculate suggested allocation based on risk level and score
      const suggestedAllocation = this.calculateSuggestedAllocation(profile, copyTradingScore);
      
      return {
        recommendedTrades,
        traderProfile: profile,
        copyTradingScore,
        reasonToCopy,
        potentialRisks,
        suggestedAllocation
      };
    } catch (error) {
      console.error(`Error generating copy trading suggestions for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Calculate a copy trading score (0-100) based on trader profile
   */
  private calculateCopyTradingScore(profile: TraderProfile): number {
    let score = 0;
    
    // Success rate (up to 40 points)
    score += Math.min(profile.successRate, 100) * 0.4;
    
    // Trade volume (up to 20 points)
    const volumeScore = Math.min(profile.totalTrades / 50, 1) * 20;
    score += volumeScore;
    
    // Risk adjustment (up to 20 points)
    switch (profile.riskLevel) {
      case 'Low':
        score += 20;
        break;
      case 'Medium':
        score += 10;
        break;
      case 'High':
        score += 5;
        break;
    }
    
    // Trading style adjustment (up to 10 points)
    if (profile.tradingStyle === 'Passive Investor') {
      score += 10;
    } else if (profile.tradingStyle === 'Yield Farmer') {
      score += 8;
    } else if (profile.tradingStyle === 'Diversified Trader') {
      score += 6;
    } else {
      score += 4; // Active/Day Trader
    }
    
    // Recent activity (up to 10 points)
    const hasRecentActivity = profile.recentActivity.some(
      trade => (Date.now() - trade.timestamp) < 7 * 24 * 60 * 60 * 1000 // 7 days
    );
    
    if (hasRecentActivity) {
      score += 10;
    }
    
    return Math.round(score);
  }

  /**
   * Generate reasons to copy based on trader profile
   */
  private generateReasonsToCopy(profile: TraderProfile): string[] {
    const reasons: string[] = [];
    
    if (profile.successRate > 60) {
      reasons.push(`Strong track record with ${profile.successRate.toFixed(1)}% success rate`);
    }
    
    if (profile.totalTrades > 20) {
      reasons.push(`Experienced trader with ${profile.totalTrades} transactions`);
    }
    
    if (profile.riskLevel === 'Low') {
      reasons.push('Conservative trading approach with low risk');
    }
    
    if (profile.tradingStyle === 'Yield Farmer') {
      reasons.push('Focus on yield farming opportunities with steady returns');
    } else if (profile.tradingStyle === 'Diversified Trader') {
      reasons.push('Well-diversified trading strategy across multiple protocols');
    }
    
    if (profile.avgProfitPerTrade > 0) {
      reasons.push(`Positive average return per trade (${profile.avgProfitPerTrade.toFixed(2)}%)`);
    }
    
    return reasons;
  }

  /**
   * Generate potential risks based on trader profile
   */
  private generatePotentialRisks(profile: TraderProfile): string[] {
    const risks: string[] = [];
    
    if (profile.riskLevel === 'High') {
      risks.push('High-risk trading approach that may lead to significant losses');
    }
    
    if (profile.tradingStyle === 'Active Trader' || profile.tradingStyle === 'Day Trader') {
      risks.push('Frequent trading may result in high gas fees and impermanent loss');
    }
    
    if (profile.successRate < 50) {
      risks.push(`Lower success rate (${profile.successRate.toFixed(1)}%) than recommended`);
    }
    
    if (profile.totalTrades < 10) {
      risks.push('Limited trading history may not represent long-term performance');
    }
    
    risks.push('Past performance does not guarantee future results');
    risks.push('Market conditions may change rapidly affecting copy trading results');
    
    return risks;
  }

  /**
   * Calculate suggested allocation based on profile and score
   */
  private calculateSuggestedAllocation(profile: TraderProfile, score: number): number {
    // Base allocation on score
    let allocation = score / 2; // 0-50%
    
    // Adjust based on risk level
    switch (profile.riskLevel) {
      case 'Low':
        allocation *= 1.0;
        break;
      case 'Medium':
        allocation *= 0.8;
        break;
      case 'High':
        allocation *= 0.5;
        break;
    }
    
    // Cap at 40%
    return Math.min(Math.round(allocation), 40);
  }

  /**
   * Validate if an address is valid for Aptos blockchain
   */
  validateAptosAddress(address: string): boolean {
    // For testing purposes - allow any 0x-prefixed address
    console.log("Validating address:", address);
    return address.startsWith('0x') && address.length >= 10;
  }
}

export default new CopyTradingService(); 