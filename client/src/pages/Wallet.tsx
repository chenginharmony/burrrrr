import React, { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Header } from '@/components/Header';
import { MobileFooterNav } from '@/components/MobileFooterNav';
import { usePoints } from '@/hooks/usePoints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, CreditCard, TrendingUp } from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';

export default function WalletPage() {
  const { user } = useAuth();
  const { transactions, isLoadingTransactions } = usePoints();
  const isMobile = useIsMobile();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest('POST', '/api/wallet/deposit', { amount });
      const data = await res.json();
      return data;
    },
    onSuccess: async (data) => {
      // Use Paystack modal instead of new tab
      if (window.PaystackPop && data.reference) {
        try {
          const handler = window.PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_77336172671b6e12b2b92f59a0a2035f7f20c54c',
            email: user?.email,
            amount: parseFloat(depositAmount) * 100,
            currency: 'NGN',
            ref: data.reference,
            embed: false, // Ensure modal mode
            onSuccess: function(transaction: any) {
              verifyPayment.mutate(transaction.reference);
            },
            onCancel: function() {
              toast.showError('Payment cancelled');
            },
            onClose: function() {
              // Modal closed
            }
          });
          
          // Force inline modal instead of new window
          handler.openIframe();
        } catch (error) {
          console.error('Paystack modal error:', error);
          toast.showError('Failed to open payment modal');
        }
      } else {
        toast.showError('Payment initialization failed');
      }
    },
    onError: (error: any) => {
      if (typeof error?.message === 'string') {
        toast.showError(error.message);
      } else {
        toast.showError('Failed to initialize deposit');
      }
    },
  });

  // Payment verification mutation
  const verifyPayment = useMutation({
    mutationFn: async (reference: string) => {
      const res = await apiRequest('POST', '/api/wallet/verify-payment', { reference });
      return await res.json();
    },
    onSuccess: (data) => {
      const amount = parseFloat(depositAmount);
      toast.showSuccess(`✅ ₦${amount.toLocaleString()} deposited successfully! Ready for betting.`);
      setDepositAmount('');
      setIsDepositDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
    onError: (error: any) => {
      toast.showError('Payment verification failed. Contact support if money was debited.');
    },
  });

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (payload: { amount: number; accountNumber: string; bankCode: string; accountName: string }) => {
      const res = await apiRequest('POST', '/api/wallet/withdraw', payload);
      return await res.json();
    },
    onSuccess: (data) => {
      const amount = parseFloat(withdrawAmount);
      toast.showSuccess(`💰 ₦${amount.toLocaleString()} withdrawal requested successfully! Processing may take 1-3 business days.`);
      setWithdrawAmount('');
      setIsWithdrawDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
    onError: (error: any) => {
      if (typeof error?.message === 'string') {
        toast.showError(error.message);
      } else {
        toast.showError('Failed to process withdrawal');
      }
    },
  });

  // Deposit handler
  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 100) {
      toast.showError('Minimum deposit is ₦100');
      return;
    }
    depositMutation.mutate(amount);
  };

  // Withdraw handler (for demo, just amount; you may want to collect bank details)
  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 500) {
      toast.showError('Minimum withdrawal is ₦500');
      return;
    }
    // TODO: Replace with real bank details input
    withdrawMutation.mutate({ amount, accountNumber: '1234567890', bankCode: '058', accountName: user?.username || 'User' });
  };

  const totalBalance = parseFloat((user?.availablePoints ?? '0').toString());
  const totalDeposits = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const recentTransactions = transactions.slice(0, 10);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'daily_login':
        return <i className="fas fa-calendar-check text-blue-500 text-sm" />;
      case 'challenge_win':
        return <i className="fas fa-trophy text-yellow-500 text-sm" />;
      case 'event_participation':
        return <i className="fas fa-calendar-alt text-purple-500 text-sm" />;
      default:
        return <i className="fas fa-circle text-gray-500 text-sm" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'daily_login':
      case 'challenge_win':
      case 'event_participation':
        return 'text-green-600 dark:text-green-400';
      case 'withdrawal':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="pb-20 p-4 space-y-6">
          {/* Balance Card */}
          <Card className="bg-gradient-to-r from-purple-500 to-lime-500 text-white border-0">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">₦{totalBalance.toLocaleString()}</div>
                <div className="text-purple-100 mb-4">Available Balance</div>
                <div className="flex gap-2">
                  <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30">
                        <ArrowDownLeft className="h-4 w-4 mr-2" />
                        Deposit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-md">
                      <DialogHeader>
                        <DialogTitle>Deposit Funds</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                        <Button className="w-full" onClick={handleDeposit} disabled={depositMutation.isPending}>
                          {depositMutation.isPending ? 'Processing...' : `Deposit ₦${depositAmount || '0'}`}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30">
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Withdraw
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-md">
                      <DialogHeader>
                        <DialogTitle>Withdraw Funds</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                        <Button className="w-full" onClick={handleWithdraw} disabled={withdrawMutation.isPending}>
                          {withdrawMutation.isPending ? 'Processing...' : `Withdraw ₦${withdrawAmount || '0'}`}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">₦{totalDeposits.toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Deposits</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">₦{totalWithdrawals.toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Withdrawals</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white capitalize">
                          {transaction.type.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'withdrawal' ? '-' : '+'}₦{parseFloat(transaction.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
                {recentTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No transactions yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <MobileFooterNav />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Available Balance"
          value={`₦${totalBalance.toLocaleString()}`}
          subtitle="Ready to use"
          icon="fas fa-wallet"
          gradient="bg-gradient-to-r from-purple-500 to-lime-500"
        />
        <StatsCard
          title="Total Deposits"
          value={`₦${totalDeposits.toLocaleString()}`}
          subtitle="All time"
          icon="fas fa-arrow-down"
          gradient="bg-gradient-to-r from-green-400 to-green-600"
        />
        <StatsCard
          title="Total Withdrawals"
          value={`₦${totalWithdrawals.toLocaleString()}`}
          subtitle="All time"
          icon="fas fa-arrow-up"
          gradient="bg-gradient-to-r from-red-400 to-red-600"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <ArrowDownLeft className="h-4 w-4 mr-2" />
              Deposit Funds
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deposit Funds</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Amount (₦)
                </label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDepositAmount('1000')}
                  className="flex-1"
                >
                  ₦1,000
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDepositAmount('5000')}
                  className="flex-1"
                >
                  ₦5,000
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDepositAmount('10000')}
                  className="flex-1"
                >
                  ₦10,000
                </Button>
              </div>
              <Button className="w-full" onClick={handleDeposit}>
                <CreditCard className="h-4 w-4 mr-2" />
                Deposit ₦{depositAmount || '0'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Withdraw Funds
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Withdraw Funds</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Amount (₦)
                </label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Withdrawal limit: ₦{totalBalance.toLocaleString()} (Available balance)
                </p>
              </div>
              <Button className="w-full" onClick={handleWithdraw}>
                Withdraw ₦{withdrawAmount || '0'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white capitalize">
                      {transaction.type.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {transaction.description || 'No description'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                    {transaction.type === 'withdrawal' ? '-' : '+'}₦{parseFloat(transaction.amount).toLocaleString()}
                  </div>
                  <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="mt-1">
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
            {recentTransactions.length === 0 && (
              <div className="text-center py-12">
                <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No transactions yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}