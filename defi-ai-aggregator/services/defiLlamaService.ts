import axios from 'axios';
import { ProtocolData } from '@/types/defi';

export class DeFiLlamaService {
  private static instance: DeFiLlamaService;
  private readonly DEFILLAMA_API = 'https://api.llama.fi';
  private readonly DEFILLAMA_POOLS_API = 'https://yields.llama.fi/pools';
  private readonly DEFILLAMA_YIELDS_API = 'https://yields.llama.fi/apy';
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  
  // List of specific Aptos protocols we want to track
  private readonly APTOS_PROTOCOLS = [
    'PancakeSwap AMM',
    'Thala LSD',
    'Merkle Trade',
    'LiquidSwap',
    'Aries Markets'
  ];
  
  private tvlCache: { data: any; timestamp: number } | null = null;
  private poolsCache: { data: any; timestamp: number } | null = null;
  private protocolsCache: { data: ProtocolData[]; timestamp: number } | null = null;

  private constructor() {}

  public static getInstance(): DeFiLlamaService {
    if (!DeFiLlamaService.instance) {
      DeFiLlamaService.instance = new DeFiLlamaService();
    }
    return DeFiLlamaService.instance;
  }

  /**
   * Get the total TVL for Aptos protocols
   */
  async getAptosTVL(): Promise<number> {
    const now = Date.now();
    
    // Return cached data if valid
    if (this.tvlCache && now - this.tvlCache.timestamp < this.CACHE_DURATION) {
      console.log('[getAptosTVL] Using cached TVL data');
      return this.tvlCache.data;
    }
    
    try {
      console.log('[getAptosTVL] Fetching Aptos TVL from DeFiLlama');
      
      // Use the v2/chains endpoint as per documentation
      const response = await axios.get(`${this.DEFILLAMA_API}/v2/chains`);
      
      if (!Array.isArray(response.data)) {
        console.error('[getAptosTVL] Invalid response format:', response.data);
        throw new Error('Invalid response format from DeFiLlama API');
      }
      
      // Find Aptos in the response
      const aptosData = response.data.find((chain: any) => 
        chain.name && chain.name.toLowerCase() === 'aptos'
      );
      
      if (!aptosData) {
        console.error('[getAptosTVL] Aptos data not found in response:', response.data);
        throw new Error('Aptos data not found in DeFiLlama response');
      }
      
      const tvl = aptosData.tvl;
      console.log(`[getAptosTVL] Aptos TVL: $${tvl.toLocaleString()}`);
      
      // Cache the result
      this.tvlCache = {
        data: tvl,
        timestamp: now
      };
      
      return tvl;
    } catch (error) {
      console.error('[getAptosTVL] Error:', error);
      
      // Return cached data if available, even if expired
      if (this.tvlCache) {
        console.log('[getAptosTVL] Returning expired cached TVL data');
        return this.tvlCache.data;
      }
      
      // Fallback value
      return 117000000; // $117M - approximate Aptos TVL
    }
  }

  /**
   * Get top Aptos protocols by TVL
   */
  async getTopAptosProtocols(limit: number = 5): Promise<ProtocolData[]> {
    const now = Date.now();
    
    // Return cached data if valid
    if (this.protocolsCache && now - this.protocolsCache.timestamp < this.CACHE_DURATION) {
      console.log('[getTopAptosProtocols] Using cached protocol data');
      return this.protocolsCache.data.slice(0, limit);
    }
    
    try {
      console.log('[getTopAptosProtocols] Fetching Aptos protocols from DeFiLlama');
      
      // Use the /protocols endpoint to get all protocols
      const response = await axios.get(`${this.DEFILLAMA_API}/protocols`);
      console.log(`[getTopAptosProtocols] first item of response.data`, response.data[0]);
      if (!response.data || !Array.isArray(response.data)) {
        console.error('[getTopAptosProtocols] Invalid response format:', response.data);
        throw new Error('Invalid response format from DeFiLlama API');
      }
      
      // Filter for Aptos protocols that match our predefined list
      const aptosProtocols = response.data.filter((protocol: any) => 
        protocol.chains && 
        Array.isArray(protocol.chains) && 
        protocol.chains.includes('Aptos') &&
        this.APTOS_PROTOCOLS.some(name => 
          protocol.name.includes(name)
        )
      );
      
      console.log(`[getTopAptosProtocols] Found ${aptosProtocols.length} matching Aptos protocols`);
      
      // If no matching protocols found, use our manual list
      if (!aptosProtocols.length) {
        console.warn('[getTopAptosProtocols] No matching Aptos protocols found, using fallback data');
        return this.getFallbackProtocolData(limit);
      }
      
      // Sort by TVL and take the top ones
      const sortedProtocols = aptosProtocols
        .sort((a: any, b: any) => b.tvl - a.tvl)
        .slice(0, limit);
      
      // Map to our format
      const mappedProtocols: ProtocolData[] = sortedProtocols.map((protocol: any) => {
        // Get Aptos-specific TVL if available
        let aptosTvl = protocol.tvl;
        if (protocol.chainTvls && protocol.chainTvls.Aptos) {
          aptosTvl = protocol.chainTvls.Aptos;
        }
        
        console.log(`[getTopAptosProtocols] ${protocol.name}: TVL=$${aptosTvl.toLocaleString()}`);
        
        return {
          name: protocol.name,
          tvl: aptosTvl || 0,
          change24h: protocol.change_1d || 0,
          change1h: protocol.change_1h || 0,
          category: protocol.category || 'DeFi',
          url: protocol.url || '',
          description: protocol.description || '',
          chains: protocol.chains || ['Aptos']
        };
      });
      
      // Cache the result
      this.protocolsCache = {
        data: mappedProtocols,
        timestamp: now
      };
      
      return mappedProtocols;
    } catch (error) {
      console.error('[getTopAptosProtocols] Error:', error);
      
      // Return cached data if available, even if expired
      if (this.protocolsCache) {
        console.log('[getTopAptosProtocols] Returning expired cached protocol data');
        return this.protocolsCache.data.slice(0, limit);
      }
      
      // Use fallback data
      return this.getFallbackProtocolData(limit);
    }
  }
  
  /**
   * Get fallback protocol data when API fails
   */
  private getFallbackProtocolData(limit: number = 5): ProtocolData[] {
    return [
      { 
        name: 'PancakeSwap AMM', 
        tvl: 42000000, 
        change24h: 0.5, 
        change1h: 0.1,
        category: 'DEX',
        url: 'https://pancakeswap.finance',
        description: 'PancakeSwap is a decentralized exchange on Aptos',
        chains: ['Aptos', 'BNB Chain']
      },
      { 
        name: 'Thala LSD', 
        tvl: 18000000, 
        change24h: 1.2, 
        change1h: 0.3,
        category: 'Liquid Staking',
        url: 'https://thala.fi',
        description: 'Thala is a liquid staking protocol on Aptos',
        chains: ['Aptos']
      },
      { 
        name: 'Merkle Trade', 
        tvl: 12000000, 
        change24h: 2.5, 
        change1h: 0.7,
        category: 'Derivatives',
        url: 'https://merkle.trade',
        description: 'Merkle Trade is a derivatives exchange on Aptos',
        chains: ['Aptos']
      },
      { 
        name: 'LiquidSwap', 
        tvl: 25000000, 
        change24h: -0.2, 
        change1h: -0.1,
        category: 'DEX',
        url: 'https://liquidswap.com',
        description: 'LiquidSwap is a decentralized exchange on Aptos',
        chains: ['Aptos']
      },
      { 
        name: 'Aries Markets', 
        tvl: 15000000, 
        change24h: 0.8, 
        change1h: 0.2,
        category: 'Lending',
        url: 'https://aries.markets',
        description: 'Aries Markets is a lending protocol on Aptos',
        chains: ['Aptos']
      }
    ].slice(0, limit);
  }

  /**
   * Get all Aptos pools data
   */
  async getAptosPools(): Promise<any[]> {
    const now = Date.now();
    
    // Return cached data if valid
    if (this.poolsCache && now - this.poolsCache.timestamp < this.CACHE_DURATION) {
      console.log('[getAptosPools] Using cached pools data');
      return this.poolsCache.data;
    }
    
    try {
      console.log('[getAptosPools] Fetching Aptos pools from DeFiLlama');
      
      // Fetch all pools from DeFiLlama
      const response = await axios.get(this.DEFILLAMA_POOLS_API);
      
      // Filter for Aptos pools
      const aptosPools = response.data.data.filter((pool: any) => 
        pool.chain.toLowerCase() === 'aptos'
      );
      
      console.log(`[getAptosPools] Found ${aptosPools.length} Aptos pools`);
      
      // Cache the result
      this.poolsCache = {
        data: aptosPools,
        timestamp: now
      };
      
      return aptosPools;
    } catch (error) {
      console.error('[getAptosPools] Error:', error);
      
      // Return cached data if available, even if expired
      if (this.poolsCache) {
        console.log('[getAptosPools] Returning expired cached pools data');
        return this.poolsCache.data;
      }
      
      // Return empty array on failure
      return [];
    }
  }

  /**
   * Get best yield opportunities for a token
   */
  async getBestYieldOpportunities(token: string, limit: number = 5): Promise<any[]> {
    try {
      // Get all pools
      const pools = await this.getAptosPools();
      
      // Filter for pools containing the token
      const tokenPools = pools.filter(
        (pool: any) => pool.symbol.toUpperCase().includes(token.toUpperCase())
      );
      
      // Sort by APY and take top results
      return tokenPools
        .sort((a: any, b: any) => b.apy - a.apy)
        .slice(0, limit)
        .map((pool: any) => ({
          protocol: pool.project,
          pool: pool.symbol,
          apy: pool.apy,
          tvl: pool.tvlUsd,
          apyBase: pool.apyBase || 0,
          apyReward: pool.apyReward || 0,
          rewardTokens: pool.rewardTokens || [],
          url: `https://app.${pool.project.toLowerCase().replace(/\s+/g, '')}.com/pool/${pool.pool}`
        }));
    } catch (error) {
      console.error('[getBestYieldOpportunities] Error:', error);
      return []; // Return empty array as fallback
    }
  }

  /**
   * Get protocol details by name
   */
  async getProtocolDetails(protocolName: string): Promise<any> {
    try {
      // Fetch protocol data from DeFiLlama
      const response = await axios.get(`${this.DEFILLAMA_API}/protocols`);
      
      // Find the specific protocol
      const protocol = response.data.protocols.find(
        (p: any) => p.name.toLowerCase() === protocolName.toLowerCase()
      );
      
      if (!protocol) {
        throw new Error(`Protocol not found: ${protocolName}`);
      }
      
      return {
        name: protocol.name,
        tvl: protocol.tvl,
        change24h: protocol.change_1d || 0,
        change7d: protocol.change_7d || 0,
        chains: protocol.chains,
        category: protocol.category,
        url: protocol.url,
        description: protocol.description,
        twitter: protocol.twitter,
        audit: protocol.audit_links || []
      };
    } catch (error) {
      console.error('[getProtocolDetails] Error:', error);
      return null; // Return null as fallback
    }
  }
}

export default DeFiLlamaService.getInstance(); 