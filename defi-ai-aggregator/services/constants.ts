// Define mainnet token addresses
export const APTOS_COINS = {
  APT: {
    address: "0x1::aptos_coin::AptosCoin",
    decimals: 8,
    module_name: "aptos_coin",
    struct_name: "AptosCoin"
  },
  USDC: {
    address: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
    decimals: 6,
    module_name: "asset",
    struct_name: "USDC"
  },
  USDT: {
    address: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
    decimals: 6,
    module_name: "asset",
    struct_name: "USDT"
  },
  DAI: {
    address: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::DAI",
    decimals: 6,
    module_name: "asset",
    struct_name: "DAI"
  }
} as const;

// Define testnet token addresses
export const APTOS_TESTNET_COINS = {
  APT: {
    address: "0x1::aptos_coin::AptosCoin",
    decimals: 8,
    module_name: "aptos_coin",
    struct_name: "AptosCoin"
  },
  USDC: {
    address: "0x8c805723ebc0a7fc5b7d3e7b75d567918e806b3461cb9fa21941a9edc0220bf::devnet_coins::DevnetUSDC",
    decimals: 6,
    module_name: "devnet_coins",
    struct_name: "DevnetUSDC"
  },
  USDT: {
    address: "0x8c805723ebc0a7fc5b7d3e7b75d567918e806b3461cb9fa21941a9edc0220bf::devnet_coins::DevnetUSDT",
    decimals: 6,
    module_name: "devnet_coins",
    struct_name: "DevnetUSDT"
  },
  DAI: {
    address: "0x8c805723ebc0a7fc5b7d3e7b75d567918e806b3461cb9fa21941a9edc0220bf::devnet_coins::DevnetDAI",
    decimals: 6,
    module_name: "devnet_coins",
    struct_name: "DevnetDAI"
  }
} as const;

// Define DEX information for Aptos ecosystem
export const APTOS_DEXES = {
  PANCAKE: {
    name: 'PancakeSwap',
    router: '0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa',
    testnetRouter: '0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa',
    fee: 0.003,
    gasEstimate: 0.0002,
    liquiditySource: 'PancakeSwap AMM',
    url: 'https://pancakeswap.finance/aptos/swap'
  },
  LIQUIDSWAP: {
    name: 'Liquidswap',
    router: '0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12',
    testnetRouter: '0x305d6fe5d70b02e9c7d5b0f2f5e5934c6a0d9b867d6e2c4c6fad7c293e0cd8c5',
    fee: 0.003,
    gasEstimate: 0.00025,
    liquiditySource: 'Liquidswap AMM',
    url: 'https://liquidswap.com/'
  },
  AUX: {
    name: 'AUX Exchange',
    router: '0x8b7311d78d47e37d09435b8dc37c14afd977c5cbc5f1bc2a615ef159a58b2d1d',
    fee: 0.003,
    gasEstimate: 0.00022,
    liquiditySource: 'AUX AMM',
    url: 'https://aux.exchange/'
  },
  THALA: {
    name: 'Thala',
    router: '0x7c0321a4d97c3bea5892d9c6a4f5e2a369a3a7d3824cee3f9c6e1e273b384e8c',
    fee: 0.003,
    gasEstimate: 0.00023,
    liquiditySource: 'Thala AMM',
    url: 'https://app.thala.fi/swap'
  },
  PANORA: {
    name: 'Panora',
    router: '0x8f396e4246b2ba87b51c0739ef5ea4f26515a98375308c31ac2ec1e42142a57f',
    testnetRouter: '0x8f396e4246b2ba87b51c0739ef5ea4f26515a98375308c31ac2ec1e42142a57f',
    fee: 0.002,
    gasEstimate: 0.0002,
    liquiditySource: 'Panora DEX Aggregator',
    url: 'https://app.panora.exchange'
  }
};

// Knowledge base data
export const APTOS_KNOWLEDGE_BASE = {
  lastUpdated: '2024-03',
  
  smartContract: {
    topic: 'Smart Contracts',
    definition: `A smart contract on Aptos is a Move module that contains code published to the blockchain. Key points:
- Written in the Move language, designed for safe resource management
- Immutable once deployed
- Can manage digital assets and automate transactions
- Verified and executed by all network validators
- Supports composability through module imports
- Features strong type system and formal verification`,
    examples: [
      'Token standards (coins, NFTs)',
      'DeFi protocols (DEX, lending)',
      'Governance contracts',
      'Staking and rewards'
    ],
    resources: [
      'https://aptos.dev/move/move-on-aptos',
      'https://github.com/aptos-labs/aptos-core/tree/main/aptos-move/move-examples',
      'https://explorer.aptoslabs.com/modules',
      'https://docs.movebit.xyz/docs/tutorial/intro'
    ],
    liveData: {
      type: 'Link',
      url: 'https://explorer.aptoslabs.com/modules',
      description: 'View live smart contracts on Aptos Explorer'
    }
  },

  topProjects: {
    topic: 'Top Projects',
    disclaimer: 'TVL and stats are dynamic. Check DeFiLlama for real-time data.',
    liveData: {
      type: 'Link',
      url: 'https://defillama.com/chain/Aptos',
      description: 'View current TVL and rankings'
    },
    defi: [
      {
        name: 'PancakeSwap',
        description: 'Leading DEX with high liquidity and farming options',
        tvl: 'Check DeFiLlama for current TVL',
        features: ['Swap', 'Farms', 'Pools', 'IFO'],
        url: 'https://pancakeswap.finance/',
        explorer: 'https://explorer.aptoslabs.com/account/0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa'
      },
      {
        name: 'Liquid Swap',
        description: 'Native AMM DEX with concentrated liquidity',
        tvl: '$30M+',
        features: ['Swap', 'Liquidity Provision', 'Farming'],
        url: 'https://liquidswap.com/'
      },
      {
        name: 'Abel Finance',
        description: 'Lending and borrowing protocol',
        tvl: '$20M+',
        features: ['Lending', 'Borrowing', 'Flash Loans'],
        url: 'https://abel.finance/'
      }
    ],
    nft: [
      {
        name: 'Topaz',
        description: 'Leading NFT marketplace',
        features: ['Trading', 'Collections', 'Launchpad'],
        url: 'https://topaz.so/'
      },
      {
        name: 'Souffl3',
        description: 'NFT marketplace and creator platform',
        features: ['Trading', 'Creator Tools', 'Rewards'],
        url: 'https://souffl3.com/'
      }
    ],
    infrastructure: [
      {
        name: 'Pontem Network',
        description: 'Development framework and tools',
        features: ['Move IDE', 'Wallet', 'Bridge'],
        url: 'https://pontem.network/'
      },
      {
        name: 'LayerZero',
        description: 'Cross-chain messaging protocol',
        features: ['Omnichain', 'Messaging', 'Bridge'],
        url: 'https://layerzero.network/'
      }
    ]
  },

  tokenomics: {
    apt: {
      maxSupply: '1,000,000,000 APT',
      currentSupply: '~400,000,000 APT',
      distribution: [
        'Community: 51.02%',
        'Core Contributors: 19%',
        'Foundation: 16.5%',
        'Investors: 13.48%'
      ],
      utilities: [
        'Gas fees',
        'Staking',
        'Governance',
        'Protocol fees'
      ]
    }
  },

  ecosystem: {
    topic: 'Ecosystem',
    disclaimer: 'Stats are constantly changing. Check official sources for current data.',
    liveData: {
      type: 'Links',
      sources: [
        {
          name: 'Aptos Explorer',
          url: 'https://explorer.aptoslabs.com/',
          description: 'Live network stats'
        },
        {
          name: 'DeFiLlama',
          url: 'https://defillama.com/chain/Aptos',
          description: 'Live DeFi stats'
        }
      ]
    },
    stats: {
      note: 'These stats change frequently. Check live sources for current data.',
      metrics: {
        tps: '>2,000',
        activeAddresses: '>500,000',
        totalProjects: '>250'
      }
    },
    advantages: [
      'Move Language Security',
      'Parallel Transaction Execution',
      'Low Transaction Costs',
      'Fast Finality'
    ],
    challenges: [
      'Developer Adoption',
      'Cross-chain Integration',
      'Market Competition'
    ]
  }
};

// CoinGecko IDs for token price fetching
export const COINGECKO_IDS: Record<string, string> = {
  'APT': 'aptos',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'DAI': 'dai'
};

// Type for token symbols
export type TokenType = keyof typeof APTOS_COINS;

// API endpoints
export const API_ENDPOINTS = {
  COINGECKO: 'https://api.coingecko.com/api/v3',
  DEFILLAMA: 'https://api.llama.fi'
};

// Cache durations
export const CACHE_DURATIONS = {
  PRICE: 5 * 60 * 1000, // 5 minutes
  POOL: 10 * 60 * 1000, // 10 minutes
  DEX: 15 * 60 * 1000 // 15 minutes
};

// Default fallback prices
export const FALLBACK_PRICES = {
  'APT': 6.75,
  'USDC': 1.0,
  'USDT': 1.0,
  'DAI': 1.0
}; 