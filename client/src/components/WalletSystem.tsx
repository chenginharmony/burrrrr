import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, CreditCard, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'bet' | 'win' | 'referral_reward';
  amount: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export function WalletSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['/api/transactions'],
    enabled: !!user?.id,
  });

  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('/api/wallet/deposit', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
      const data = await response.json();
      return data;
    },
    onSuccess: (response) => {
      // Initialize Paystack payment modal (same page)
      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_77336172671b6e12b2b92f59a0a2035f7f20c54c',
        email: user?.email,
        amount: parseFloat(depositAmount) * 100, // Convert to kobo
        currency: 'NGN',
        ref: response.reference,
        callback: function(response: any) {
          // Verify payment on backend
          verifyPayment.mutate(response.reference);
        },
        onClose: function() {
          toast({
            title: "Payment Cancelled",
            description: "Your deposit was cancelled.",
            variant: "destructive"
          });
        }
      });
      handler.openIframe(); // This opens modal on same page, not new tab
    },
    onError: (error: any) => {
      toast({
        title: "Deposit Failed",
        description: error.message || "Failed to initialize deposit",
        variant: "destructive"
      });
    }
  });

  const verifyPayment = useMutation({
    mutationFn: async (reference: string) => {
      const response = await apiRequest('/api/wallet/verify-payment', {
        method: 'POST',
        body: JSON.stringify({ reference }),
      });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      const amount = parseFloat(depositAmount);
      
      // Show success notification
      toast({
        title: "✅ Deposit Successful!",
        description: `₦${amount.toLocaleString()} has been added to your wallet. Your funds are ready for betting!`,
      });
      
      // Reset form
      setDepositAmount('');
      
      // Update user balance and transactions immediately
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      // Optional: Optimistically update the UI
      queryClient.setQueryData(['/api/auth/user'], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            availablePoints: (parseFloat(oldData.availablePoints || '0') + amount).toString()
          };
        }
        return oldData;
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Payment Verification Failed",
        description: error.message || "Failed to verify payment. Please contact support if money was debited.",
        variant: "destructive"
      });
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('/api/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ 
          amount,
          accountNumber: '1234567890', // In production, collect from user
          bankCode: '058',
          accountName: user?.username || 'User'
        }),
      });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      const amount = parseFloat(withdrawAmount);
      
      // Show success notification
      toast({
        title: "💰 Withdrawal Requested",
        description: `₦${amount.toLocaleString()} withdrawal request submitted successfully. Processing may take 1-3 business days.`,
      });
      
      // Reset form
      setWithdrawAmount('');
      
      // Update user balance and transactions immediately
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      // Optimistically update the UI (subtract withdrawal amount)
      queryClient.setQueryData(['/api/auth/user'], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            availablePoints: (parseFloat(oldData.availablePoints || '0') - amount).toString()
          };
        }
        return oldData;
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Withdrawal Failed",
        description: error.message || "Failed to process withdrawal. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit amount is ₦100",
        variant: "destructive"
      });
      return;
    }
    if (amount > 1000000) {
      toast({
        title: "Invalid Amount",
        description: "Maximum deposit amount is ₦1,000,000",
        variant: "destructive"
      });
      return;
    }
    depositMutation.mutate(amount);
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    const balance = parseFloat(user?.availablePoints || '0');
    
    if (isNaN(amount) || amount < 500) {
      toast({
        title: "Invalid Amount",
        description: "Minimum withdrawal amount is ₦500",
        variant: "destructive"
      });
      return;
    }
    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive"
      });
      return;
    }
    withdrawMutation.mutate(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'withdraw':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'win':
        return <DollarSign className="h-4 w-4 text-yellow-600" />;
      case 'bet':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      default:
        return <Wallet className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'win':
      case 'referral_reward':
        return 'text-green-600';
      case 'withdraw':
      case 'bet':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatAmount = (amount: string, type: string) => {
    const sign = ['deposit', 'win', 'referral_reward'].includes(type) ? '+' : '-';
    return `${sign}₦${parseFloat(amount).toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Available Balance</p>
              <h2 className="text-3xl font-bold">
                ₦{parseFloat(user?.availablePoints || '0').toLocaleString()}
              </h2>
            </div>
            <Wallet className="h-12 w-12 opacity-75" />
          </div>
        </CardContent>
      </Card>

      {/* Deposit/Withdraw Section */}
      <Card>
        <CardHeader>
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'deposit'
                  ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-purple-600'
              }`}
            >
              Deposit
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'withdraw'
                  ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-purple-600'
              }`}
            >
              Withdraw
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTab === 'deposit' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Deposit Amount</label>
                <Input
                  type="number"
                  placeholder="Enter amount (Min: ₦100)"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="100"
                  max="1000000"
                />
              </div>
              <Button 
                onClick={handleDeposit}
                disabled={depositMutation.isPending || !depositAmount}
                className="w-full"
              >
                {depositMutation.isPending ? 'Processing...' : 'Deposit Money'}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Secure payment powered by Paystack
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Withdrawal Amount</label>
                <Input
                  type="number"
                  placeholder="Enter amount (Min: ₦500)"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="500"
                  max={user?.availablePoints || '0'}
                />
              </div>
              <Button 
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending || !withdrawAmount}
                className="w-full"
                variant="outline"
              >
                {withdrawMutation.isPending ? 'Processing...' : 'Request Withdrawal'}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Withdrawals are processed within 1-3 business days
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction: Transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-medium text-sm">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${getTransactionColor(transaction.type)}`}>
                      {formatAmount(transaction.amount, transaction.type)}
                    </p>
                    <Badge 
                      variant={transaction.status === 'completed' ? 'default' : 
                               transaction.status === 'pending' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}