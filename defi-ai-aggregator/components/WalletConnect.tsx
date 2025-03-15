'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useEffect, useState, useRef } from 'react';
import { ChevronDownIcon, ArrowRightOnRectangleIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface WalletConnectProps {
  onConnect: () => void;
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  const { connect, connected, disconnect, wallets, account } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    // Add click outside listener to close dropdown
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
  
  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (!mounted) return null;

  if (connected && account) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-900/70 backdrop-blur-md text-blue-400 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
        >
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="font-mono text-sm">{truncateAddress(account.address)}</span>
          <ChevronDownIcon className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-900/90 backdrop-blur-md border border-gray-700 z-10">
            <div className="py-1">
              <div className="px-4 py-2 border-b border-gray-700">
                <p className="text-xs text-gray-400 font-mono">WALLET_ADDRESS</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-300 font-mono truncate">{account.address}</p>
                  <button 
                    onClick={copyAddress}
                    className="ml-2 p-1 rounded-md hover:bg-gray-800 text-gray-400 hover:text-blue-400"
                  >
                    {copied ? 
                      <CheckIcon className="h-4 w-4 text-green-400" /> : 
                      <ClipboardDocumentIcon className="h-4 w-4" />
                    }
                  </button>
                </div>
              </div>
              
              <button
                onClick={disconnect}
                className="w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-gray-800 flex items-center space-x-2"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 text-gray-400" />
                <span>Disconnect Wallet</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-colors"
    >
      Connect Wallet
    </button>
  );
} 