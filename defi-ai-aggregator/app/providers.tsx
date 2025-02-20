'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { useMemo } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => [new PetraWallet()], []);

  return (
    <AptosWalletAdapterProvider plugins={wallets} autoConnect={false}>
      {children}
    </AptosWalletAdapterProvider>
  );
} 