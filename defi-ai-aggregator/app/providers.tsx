'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { useMemo, createContext, useContext, useState, useEffect } from 'react';

// Create a network context to share network information across components
export type NetworkType = 'mainnet' | 'testnet';

interface NetworkContextType {
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
  isTestnet: boolean;
  networkUrl: string;
}

const NetworkContext = createContext<NetworkContextType>({
  network: 'mainnet',
  setNetwork: () => {},
  isTestnet: false,
  networkUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
});

export const useNetwork = () => useContext(NetworkContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [network, setNetwork] = useState<NetworkType>('testnet'); // Default to testnet for development
  
  // Set network in localStorage and update environment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aptos-network', network);
      
      // Set the environment variable for other components to access
      if (typeof window !== 'undefined') {
        (window as any).NEXT_PUBLIC_APTOS_NETWORK = network;
      }
    }
  }, [network]);
  
  // Initialize from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNetwork = localStorage.getItem('aptos-network');
      if (savedNetwork === 'mainnet' || savedNetwork === 'testnet') {
        setNetwork(savedNetwork);
      }
    }
  }, []);
  
  const networkValue = useMemo(() => ({
    network,
    setNetwork,
    isTestnet: network === 'testnet',
    networkUrl: network === 'testnet' 
      ? 'https://fullnode.testnet.aptoslabs.com/v1'
      : 'https://fullnode.mainnet.aptoslabs.com/v1',
  }), [network]);

  const wallets = useMemo(() => [new PetraWallet()], []);

  return (
    <NetworkContext.Provider value={networkValue}>
      <AptosWalletAdapterProvider plugins={wallets} autoConnect={false}>
        {children}
      </AptosWalletAdapterProvider>
    </NetworkContext.Provider>
  );
} 