import React, { useEffect } from 'react';
import { WalletSystem } from '@/components/WalletSystem';

// Load Paystack script
const loadPaystackScript = () => {
  if (window.PaystackPop) return Promise.resolve();
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => {
      // Verify PaystackPop is available
      if (window.PaystackPop) {
        resolve(true);
      } else {
        reject(new Error('PaystackPop not available'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Paystack script'));
    document.head.appendChild(script);
  });
};

export default function WalletPage() {
  useEffect(() => {
    loadPaystackScript().catch(console.error);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">💰 Wallet</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your balance for Events and Challenge betting. Your funds are secure and ready to use!
          </p>
        </div>
        
        <WalletSystem />
      </div>
    </div>
  );
}