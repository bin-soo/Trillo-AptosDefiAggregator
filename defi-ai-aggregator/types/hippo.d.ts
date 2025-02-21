declare module '@manahippo/hippo-sdk' {
  export class TradeAggregator {
    static create(client: any, config: any): Promise<TradeAggregator>;
    
    coinListClient: {
      getCoinInfoBySymbol(symbol: string): Array<{
        token_type: {
          account_address: string;
          module_name: string;
          struct_name: string;
        };
        decimals: number;
        symbol: string;
        name: string;
      }>;
    };

    getBestQuote(
      inputAmt: number,
      xCoinInfo: any,
      yCoinInfo: any
    ): Promise<{
      route: {
        routeType: string;
        poolType: string;
        makeSwapPayload: (amount: number, slippage: number) => any;
      };
      quote: {
        outputUiAmt: number;
        price: number;
      };
    } | null>;

    getQuotes(
      inputAmt: number,
      xCoinInfo: any,
      yCoinInfo: any
    ): Promise<Array<{
      route: {
        routeType: string;
        poolType: string;
        makeSwapPayload: (amount: number, slippage: number) => any;
      };
      quote: {
        outputUiAmt: number;
        price: number;
      };
    }>>;
  }

  export const MAINNET_CONFIG: {
    fullNodeUrl: string;
    hippoAggregator: string;
    networkType: string;
  };
} 