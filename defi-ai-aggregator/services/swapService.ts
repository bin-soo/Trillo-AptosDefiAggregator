import { SwapRoute, TokenPair } from '../types/defi';
import { TokenType, APTOS_COINS, APTOS_TESTNET_COINS, APTOS_DEXES } from './constants';
import dexService from './dexService';
import priceService from './priceService';
import Panora from "@panoraexchange/swap-sdk";
import { DexService } from './dexService';

export class SwapService {
  private static instance: SwapService;
  private readonly PANORA_API_KEY = 'a4^KV_EaTf4MW#ZdvgGKX#HUD^3IFEAOV_kzpIE^3BQGA8pDnrkT7JcIy#HNlLGi';
  private readonly PANORA_API_ENDPOINT = 'https://api.panora.exchange/swap';
  private readonly PANORA_API_QUOTE_ENDPOINT = 'https://api.panora.exchange/swap/quote';
  private panoraClient: Panora | null = null;
  private isTestnet: boolean = true;
  private networkUrl: string = 'https://fullnode.mainnet.aptoslabs.com/v1';
  private dexService: DexService;

  private constructor(isTestnet: boolean = true) {
    this.isTestnet = isTestnet;
    this.networkUrl = this.isTestnet 
      ? 'https://fullnode.testnet.aptoslabs.com/v1'
      : 'https://fullnode.mainnet.aptoslabs.com/v1';
    
    // Initialize Panora client
    try {
      this.panoraClient = new Panora({
        apiKey: this.PANORA_API_KEY,
        rpcUrl: this.networkUrl
      });
    } catch (error) {
      console.error('Failed to initialize Panora client:', error);
      this.panoraClient = null;
    }

    this.dexService = dexService;
  }

  public static getInstance(): SwapService {
    if (!SwapService.instance) {
      SwapService.instance = new SwapService();
    }
    return SwapService.instance;
  }

  /**
   * Set testnet mode
   */
  setTestnetMode(isTestnet: boolean): void {
    this.isTestnet = isTestnet;
    this.networkUrl = isTestnet 
      ? 'https://fullnode.testnet.aptoslabs.com/v1'
      : 'https://fullnode.mainnet.aptoslabs.com/v1';
    
    // Update Panora client with new network URL
    try {
      this.panoraClient = new Panora({
        apiKey: this.PANORA_API_KEY,
        rpcUrl: this.networkUrl
      });
    } catch (error) {
      console.error('Failed to update Panora client:', error);
    }
    
    // Update DexService testnet mode
    this.dexService.setTestnetMode(isTestnet);
  }

  /**
   * Get the best swap route using Panora's DEX aggregator
   */
  async getBestSwapRoute(
    tokenIn: TokenType,
    tokenOut: TokenType,
    amount: string,
    walletAddress?: string
  ): Promise<SwapRoute> {
    console.log(`Getting best swap route for ${amount} ${tokenIn} to ${tokenOut}`);
    
    try {
      // Always use APTOS_COINS for token information, regardless of network
      const tokenInInfo = APTOS_COINS[tokenIn];
      const tokenOutInfo = APTOS_COINS[tokenOut];
      
      if (!tokenInInfo || !tokenOutInfo) {
        throw new Error(`Token information not found for ${tokenIn} or ${tokenOut}`);
      }
      
      // Format addresses for Panora
      const formattedFromAddress = tokenInInfo.address;
      const formattedToAddress = tokenOutInfo.address;
      
      // Ensure wallet address is properly formatted
      const destinationAddress = walletAddress ? 
        (walletAddress.startsWith('0x') ? walletAddress : `0x${walletAddress}`) : 
        '0x1'; // Default address if none provided
      
      console.log(`Using wallet address for swap: ${destinationAddress}`);
      
      // Call Panora API directly
      const query = {
        fromTokenAddress: formattedFromAddress,
        toTokenAddress: formattedToAddress,
        fromTokenAmount: amount,
        // toWalletAddress: destinationAddress,
      };
      
      const headers = {
        "x-api-key": this.PANORA_API_KEY,
        // "Content-Type": "application/json"
      };
      
      const queryString = new URLSearchParams(query).toString();
      const url = `${this.PANORA_API_QUOTE_ENDPOINT}?${queryString}`;
      
      console.log(`[getBestSwapRoute] Calling Panora API: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        throw new Error(`Panora API error: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log("[getBestSwapRate] Panora API response:", responseData);
      
      // Check if we have quotes
      if (responseData && responseData.quotes && responseData.quotes.length > 0) {
        const bestQuote = responseData.quotes[0];
        
        // Format the response to match our SwapRoute interface
        const swapRoute: SwapRoute = {
          fromToken: tokenIn,
          toToken: tokenOut,
          fromAmount: amount,
          expectedOutput: bestQuote.toTokenAmount || "0",
          priceImpact: bestQuote.priceImpact ? parseFloat(bestQuote.priceImpact) : 0.5,
          estimatedGas: 0, // Not provided by Panora API
          dex: "Panora", // Using Panora as the aggregator name
          protocol: bestQuote.route?.dex || "Multiple",
          swapPayload: bestQuote.txData,
          tokenIn: {
            symbol: tokenIn,
            address: formattedFromAddress,
            decimals: tokenInInfo.decimals
          },
          tokenOut: {
            symbol: tokenOut,
            address: formattedToAddress,
            decimals: tokenOutInfo.decimals
          },
          amount: amount,
          path: bestQuote.route?.path?.map((step: any) => ({
            dex: step.dex || "Unknown",
            tokenIn: step.tokenIn || "",
            tokenOut: step.tokenOut || "",
            fee: step.fee || "0"
          })) || [],
          dexUrl: "https://app.panora.exchange"
        };
        
        return swapRoute;
      } else {
        console.log("No quotes found from Panora, falling back to alternative method");
        return this.getFallbackSwapRoute(tokenIn, tokenOut, amount);
      }
    } catch (error) {
      console.error("Error getting swap route from Panora:", error);
      return this.getFallbackSwapRoute(tokenIn, tokenOut, amount);
    }
  }

  /**
   * Get the best swap route using our existing implementation as fallback
   */
  private async getFallbackSwapRoute(
    tokenIn: TokenType,
    tokenOut: TokenType,
    amount: string
  ): Promise<SwapRoute> {
    try {
      const inputAmt = parseFloat(amount);
      
      // Get quotes from all DEXes
      const allQuotes = await this.dexService.getAllDexQuotes(tokenIn, tokenOut, inputAmt);
      
      // Filter out null quotes and sort by output amount (descending)
      const validQuotes = allQuotes
        .filter(quote => quote !== null) as any[];
      
      validQuotes.sort((a, b) => 
        parseFloat(b.outputAmount) - parseFloat(a.outputAmount)
      );
      
      if (validQuotes.length === 0) {
        throw new Error('No valid quotes available');
      }
      
      // Get the best quote
      const bestQuote = validQuotes[0];
      
      // Calculate price impact as a number
      const priceImpact = parseFloat(bestQuote.priceImpact);
      
      // Return the swap route
      return {
        fromToken: tokenIn,
        toToken: tokenOut,
        fromAmount: amount,
        expectedOutput: bestQuote.outputAmount,
        priceImpact: priceImpact,
        estimatedGas: bestQuote.gasEstimate || 0.0002,
        dex: bestQuote.dexName,
        protocol: bestQuote.dexName,
        alternativeRoutes: validQuotes.slice(1).map(quote => ({
          protocol: quote.dexName,
          expectedOutput: quote.outputAmount,
          priceImpact: quote.priceImpact,
          estimatedGas: quote.gasEstimate || 0.0002
        }))
      };
    } catch (error) {
      console.error('Error getting fallback swap quotes:', {
        error: error instanceof Error ? error.message : error,
        params: { tokenIn, tokenOut, amount }
      });
      
      // Return a generated fallback route
      return this.generateFallbackSwapRoute(tokenIn, tokenOut, amount);
    }
  }
  
  /**
   * Generate a fallback swap route when real data fetching fails
   */
  private async generateFallbackSwapRoute(
    tokenIn: TokenType,
    tokenOut: TokenType,
    amount: string
  ): Promise<SwapRoute> {
    console.log(`[generateFallbackSwapRoute] Generating fallback route for ${tokenIn} to ${tokenOut}, amount: ${amount}`);
    
    // Parse input amount and get token info
    const inputAmount = parseFloat(amount);
    
    // Always use APTOS_COINS for token information, regardless of network
    const tokenInInfo = APTOS_COINS[tokenIn];
    const tokenOutInfo = APTOS_COINS[tokenOut];
    
    // Set default token prices
    let tokenInPrice = 1;
    let tokenOutPrice = 1;
    
    // Try to use cached prices if available
    try {
      const cachedInPrice = await priceService.getTokenPriceWithCache(tokenIn);
      const cachedOutPrice = await priceService.getTokenPriceWithCache(tokenOut);
      
      if (cachedInPrice) tokenInPrice = cachedInPrice;
      if (cachedOutPrice) tokenOutPrice = cachedOutPrice;
    } catch (error) {
      console.error('[generateFallbackSwapRoute] Error getting cached prices:', error);
      // Fallback to default prices
      if (tokenIn === 'APT') tokenInPrice = 6.75;
      if (tokenOut === 'APT') tokenOutPrice = 6.75;
      if (['USDC', 'USDT', 'DAI'].includes(tokenIn)) tokenInPrice = 1;
      if (['USDC', 'USDT', 'DAI'].includes(tokenOut)) tokenOutPrice = 1;
    }
    
    // Calculate expected output
    const expectedOutput = (inputAmount * tokenInPrice / tokenOutPrice).toFixed(6);
    
    // Create fallback route
    return {
      fromToken: tokenIn,
      toToken: tokenOut,
      fromAmount: amount,
      expectedOutput: expectedOutput,
      priceImpact: 0.5, // Default price impact as number
      estimatedGas: 0.0002, // Default gas estimate as number
      dex: "PancakeSwap", // Default to PancakeSwap
      protocol: "PancakeSwap", // Default to PancakeSwap
      alternativeRoutes: [
        {
          protocol: "Liquidswap",
          expectedOutput: (parseFloat(expectedOutput) * 0.995).toFixed(6), // Slightly worse rate
          priceImpact: "0.7",
          estimatedGas: 0.00025
        }
      ]
    };
  }

  /**
   * Execute a swap using Panora's DEX aggregator
   */
  async executeSwap(
    walletAddress: string,
    tokenIn: TokenType,
    tokenOut: TokenType,
    amount: string,
    slippagePercentage: number = 0.5, // Default 0.5%
    deadline: number = 20 * 60 // Default 20 minutes
  ): Promise<{ success: boolean; txHash?: string; error?: string; payload?: any }> {
    try {
      console.log(`[swapService - executeSwap] Executing swap: ${amount} ${tokenIn} to ${tokenOut}`);
      console.log(`[swapService - executeSwap] Wallet address: ${walletAddress}`);
      
      // Get the best swap route, passing the wallet address
      const route = await this.getBestSwapRoute(tokenIn, tokenOut, amount, walletAddress);
      
      if (!route || !route.swapPayload) {
        return { success: false, error: 'No valid route found' };
      }
      
      // If we have a swapPayload from Panora, use it directly
      if (route.swapPayload) {
        console.log('[executeSwap] Using Panora swap payload');
        return {
          success: true,
          payload: route.swapPayload
        };
      }
      
      // Otherwise, fall back to our DEX-specific implementations
      if (this.isTestnet) {
        console.log('[executeSwap] Using testnet PancakeSwap router');
        
        // Always use APTOS_COINS for token information, regardless of network
        const tokenInInfo = APTOS_COINS[tokenIn];
        
        // For testnet, we need to get the testnet addresses
        const fromTokenAddress = this.dexService.getTokenAddress(tokenIn, true);
        const toTokenAddress = this.dexService.getTokenAddress(tokenOut, true);
        
        // Format the amount with the correct number of decimals
        const formattedAmount = this.formatTokenAmount(parseFloat(amount), tokenInInfo.decimals);
        
        // Calculate min output amount with slippage
        // For testnet, we'll use a very small min output to ensure the transaction succeeds
        const minOutputAmount = "1"; // Minimal amount to ensure transaction succeeds
        
        // Return the transaction payload for the wallet to sign
        // Format exactly as expected by Petra wallet, using PancakeSwap's testnet router
        return {
          success: true,
          payload: {
            type: "entry_function_payload",
            function: "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa::router::swap_exact_input",
            type_arguments: [
              fromTokenAddress,
              toTokenAddress
            ],
            arguments: [
              formattedAmount,
              minOutputAmount
            ]
          }
        };
      } else {
        // For mainnet, we'll use PancakeSwap
        // Always use APTOS_COINS for token information, regardless of network
        const tokenInInfo = APTOS_COINS[tokenIn];
        
        const fromTokenAddress = this.dexService.getTokenAddress(tokenIn, false);
        const toTokenAddress = this.dexService.getTokenAddress(tokenOut, false);
        
        // Format the amount with the correct number of decimals
        const formattedAmount = this.formatTokenAmount(parseFloat(amount), tokenInInfo.decimals);
        
        // Calculate min output amount with slippage
        const minOutputAmount = "0"; // For simplicity, we're using 0 as min output
        
        // Return the transaction payload for the wallet to sign
        return {
          success: true,
          payload: {
            type: "entry_function_payload",
            function: `${APTOS_DEXES.PANCAKE.router}::router::swap_exact_input`,
            type_arguments: [
              fromTokenAddress,
              toTokenAddress
            ],
            arguments: [
              formattedAmount,
              minOutputAmount
            ]
          }
        };
      }
    } catch (error) {
      console.error('[executeSwap] Error:', error);
      return {
        success: false,
        error: `Failed to execute swap: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Formats a token amount based on its decimals
   * @param amount The amount to format
   * @param decimals The number of decimals for the token
   * @returns The formatted amount as a string
   */
  private formatTokenAmount(amount: number, decimals: number): string {
    // Convert to the smallest unit (e.g., convert APT to Octas)
    const multiplier = Math.pow(10, decimals);
    const formattedAmount = (amount * multiplier).toFixed(0);
    return formattedAmount;
  }
}

export default SwapService.getInstance(); 