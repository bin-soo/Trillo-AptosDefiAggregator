'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useEffect, useState } from 'react';

interface WalletConnectProps {
  onConnect: () => void;
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  const { connect, connected, disconnect, wallets } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = async () => {
    if (!wallets?.length) {
      console.error('No wallet found');
      return;
    }

    try {
      await connect(wallets[0].name);
      onConnect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  if (!mounted) return null;

  return (
    <button
      onClick={connected ? disconnect : handleConnect}
      className="bg-blue-500 text-white px-4 py-2 rounded-lg"
    >
      {connected ? 'Disconnect Wallet' : 'Connect Wallet'}
    </button>
  );
} 