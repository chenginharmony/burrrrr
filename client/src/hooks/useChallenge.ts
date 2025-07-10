import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  challengerId: string;
  challengedId: string;
  wagerAmount: string;
  status: string;
  category: string;
  dueDate: string;
  escrowStatus: string;
  winnerId: string | null;
  rules: string;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

interface CreateChallengeData {
  title: string;
  description: string;
  challengedId: string;
  wagerAmount: number;
  category: string;
  dueDate: Date;
  rules: string;
}

export function useChallenge() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: challenges = [], isLoading } = useQuery<Challenge[]>({
    queryKey: ['/api/challenges'],
    enabled: !!user,
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (challengeData: CreateChallengeData) => {
      const response = await apiRequest('POST', '/api/challenges', {
        ...challengeData,
        dueDate: challengeData.dueDate.toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      toast({
        title: "Success",
        description: "Challenge created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create challenge",
        variant: "destructive",
      });
    },
  });

  const acceptChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const response = await apiRequest('POST', `/api/challenges/${challengeId}/accept`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      toast({
        title: "Success",
        description: "Challenge accepted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to accept challenge",
        variant: "destructive",
      });
    },
  });

  const declineChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const response = await apiRequest('POST', `/api/challenges/${challengeId}/decline`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      toast({
        title: "Success",
        description: "Challenge declined",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to decline challenge",
        variant: "destructive",
      });
    },
  });

  return {
    challenges,
    loading: isLoading,
    createChallenge: createChallengeMutation.mutate,
    acceptChallenge: acceptChallengeMutation.mutate,
    declineChallenge: declineChallengeMutation.mutate,
    isCreating: createChallengeMutation.isPending,
    isAccepting: acceptChallengeMutation.isPending,
    isDeclining: declineChallengeMutation.isPending,
  };
}
