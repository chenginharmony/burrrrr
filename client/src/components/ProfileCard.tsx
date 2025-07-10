import React, { useState, useEffect } from 'react';
import { X, Trophy, Users, TrendingUp, Star, Send, Loader } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface ProfileStats {
  eventsWon: number;
  totalEvents: number;
  totalEarnings: number;
  followersCount: number;
  followingCount: number;
  winRate: number;
}

interface ProfileData {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  level: number;
  xp: number;
  totalPoints: number;
  availablePoints: number;
  loginStreak: number;
  createdAt: string;
  stats: ProfileStats;
  isFollowing: boolean;
}

interface ProfileCardProps {
  userId: string;
  onClose: () => void;
}

export function ProfileCard({ userId, onClose }: ProfileCardProps) {
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profile data
  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/users', userId],
    enabled: !!userId,
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ action }: { action: 'follow' | 'unfollow' }) => {
      const response = await fetch(`/api/users/${userId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Failed to ${action} user`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
      toast({
        title: "Success",
        description: `Successfully ${profile?.isFollowing ? 'unfollowed' : 'followed'} user`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Tip user mutation
  const tipMutation = useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      const response = await fetch('/api/transactions/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: userId, amount }),
      });
      if (!response.ok) throw new Error('Failed to send tip');
      return response.json();
    },
    onSuccess: () => {
      setShowTipModal(false);
      setTipAmount('');
      toast({
        title: "Success",
        description: `Successfully sent ₦${tipAmount} tip!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate level from XP
  const calculateLevel = (xp: number): number => {
    return Math.floor(xp / 100) + 1;
  };

  // Get user display name
  const getDisplayName = (profile: ProfileData): string => {
    if (profile.username) return profile.username;
    if (profile.firstName && profile.lastName) return `${profile.firstName} ${profile.lastName}`;
    if (profile.firstName) return profile.firstName;
    return 'Anonymous User';
  };

  // Handle follow/unfollow
  const handleFollowAction = () => {
    if (!profile) return;
    const action = profile.isFollowing ? 'unfollow' : 'follow';
    followMutation.mutate({ action });
  };

  // Handle tip submission
  const handleTipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(tipAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    tipMutation.mutate({ amount });
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={handleBackdropClick}>
        <div className="bg-white rounded-2xl p-6 w-full max-w-md bg-cover bg-center relative">
          <div className="flex justify-center items-center h-40">
            <Loader className="animate-spin text-purple-500" size={32} />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={handleBackdropClick}>
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md relative bg-cover bg-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 bg-white/80 hover:bg-white rounded-full transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        <div className="text-center">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <img
                src={profile.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`}
                alt={getDisplayName(profile)}
                className="w-24 h-24 rounded-full border-4 border-purple-200 object-cover"
              />
              {/* Level badge */}
              <div className="absolute -bottom-2 -right-2 bg-purple-600 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center">
                {calculateLevel(profile.xp)}
              </div>
            </div>
          </div>

          {/* User Info */}
          <h2 className="text-xl font-bold text-gray-900 mb-1">{getDisplayName(profile)}</h2>
          <p className="text-gray-500">@{profile.username || 'anonymous'}</p>
          
          {/* Points and Level */}
          <div className="flex items-center justify-center gap-2 mt-2 mb-4">
            <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
              <Star className="w-4 h-4" />
              <span>{Number(profile.totalPoints).toLocaleString()} Points</span>
            </div>
            <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
              Level {calculateLevel(profile.xp)}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center bg-gray-50 rounded-lg p-2">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold text-gray-900">{profile.stats?.eventsWon || 0}</span>
              </div>
              <p className="text-xs text-gray-500">Events Won</p>
            </div>
            <div className="text-center bg-gray-50 rounded-lg p-2">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-gray-900">{profile.stats?.followersCount || 0}</span>
              </div>
              <p className="text-xs text-gray-500">Followers</p>
            </div>
            <div className="text-center bg-gray-50 rounded-lg p-2">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="font-semibold text-gray-900">₦{profile.stats?.totalEarnings || 0}</span>
              </div>
              <p className="text-xs text-gray-500">Earnings</p>
            </div>
          </div>

          {/* Action Buttons */}
          {user && user.id !== profile.id && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleFollowAction}
                disabled={followMutation.isPending}
                variant={profile.isFollowing ? "outline" : "default"}
                className={profile.isFollowing ? "hover:bg-gray-100" : "bg-purple-600 hover:bg-purple-700"}
              >
                {followMutation.isPending ? (
                  <Loader className="animate-spin w-4 h-4" />
                ) : (
                  profile.isFollowing ? 'Unfollow' : 'Follow'
                )}
              </Button>

              <Button
                onClick={() => setShowTipModal(true)}
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                Tip
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60"
          onClick={(e) => e.target === e.currentTarget && setShowTipModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-xs w-full p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTipModal(false)}
              className="absolute right-3 top-3 p-1.5 bg-white/80 hover:bg-white rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">Tip {getDisplayName(profile)}</h3>
              <p className="text-sm text-gray-500">Send money to show your appreciation</p>
            </div>

            <form onSubmit={handleTipSubmit}>
              <div className="mb-4">
                <label htmlFor="tipAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₦)
                </label>
                <Input
                  id="tipAmount"
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTipModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={tipMutation.isPending || !tipAmount || parseInt(tipAmount) <= 0}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                  {tipMutation.isPending ? (
                    <Loader className="animate-spin w-4 h-4" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Tip
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}