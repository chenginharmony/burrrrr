import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface DailyLogin {
  id: string;
  userId: string;
  loginDate: string;
  streakCount: number;
  pointsEarned: string;
  xpEarned: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: string;
  description: string;
  status: string;
  referenceId: string;
  metadata: any;
  createdAt: string;
}

export function usePoints() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!user,
  });

  const claimDailyLoginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/daily-login');
      return response.json();
    },
    onSuccess: (data: DailyLogin) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Daily Bonus Claimed! 🎉",
        description: `You earned ${data.pointsEarned} points and ${data.xpEarned} XP. Streak: ${data.streakCount} days`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to claim daily bonus",
        variant: "destructive",
      });
    },
  });

  const canClaimDailyLogin = () => {
    if (!user?.lastLoginDate) return true;
    
    const today = new Date();
    const lastLogin = new Date(user.lastLoginDate);
    
    // Check if last login was on a different day
    return today.toDateString() !== lastLogin.toDateString();
  };

  return {
    transactions,
    isLoadingTransactions,
    claimDailyLogin: claimDailyLoginMutation.mutate,
    isClaimingDailyLogin: claimDailyLoginMutation.isPending,
    canClaimDailyLogin: canClaimDailyLogin(),
  };
}
