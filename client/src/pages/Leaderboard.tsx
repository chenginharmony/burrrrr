import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Crown, Medal, Award, TrendingUp, Users } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl: string;
  level: number;
  xp: number;
  totalPoints: string;
  availablePoints: string;
  loginStreak: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [timeframe, setTimeframe] = useState<'all' | 'weekly' | 'monthly'>('all');

  const { data: leaderboard = [], isLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard', { limit: 50 }],
  });

  const currentUserRank = leaderboard.findIndex(u => u.id === user?.id) + 1;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold">#{rank}</div>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 2:
        return 'border-gray-400 bg-gray-50 dark:bg-gray-800';
      case 3:
        return 'border-amber-600 bg-amber-50 dark:bg-amber-900/20';
      default:
        return 'border-gray-200 dark:border-gray-700';
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header title="Leaderboard" />
        <div className="pb-20 p-4 space-y-4">
          {/* Current User Rank */}
          {currentUserRank > 0 && (
            <Card className="bg-gradient-to-r from-purple-500 to-lime-500 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="text-lg font-bold">#{currentUserRank}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-bold">Your Rank</div>
                    <div className="text-purple-100">Level {user?.level} • {user?.xp} XP</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">₦{parseFloat(user?.totalPoints || '0').toLocaleString()}</div>
                    <div className="text-sm text-purple-100">Total Points</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeframe Filter */}
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All Time' },
              { key: 'weekly', label: 'Weekly' },
              { key: 'monthly', label: 'Monthly' },
            ].map((period) => (
              <Button
                key={period.key}
                variant={timeframe === period.key ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe(period.key as any)}
                className="flex-1"
              >
                {period.label}
              </Button>
            ))}
          </div>

          {/* Top 3 */}
          <div className="grid grid-cols-3 gap-2">
            {leaderboard.slice(0, 3).map((user, index) => (
              <Card key={user.id} className={`${getRankColor(index + 1)} border-2`}>
                <CardContent className="p-3 text-center">
                  <div className="flex justify-center mb-2">
                    {getRankIcon(index + 1)}
                  </div>
                  <Avatar className="h-12 w-12 mx-auto mb-2">
                    <AvatarImage src={user.profileImageUrl} alt={user.firstName} />
                    <AvatarFallback className="text-xs">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user.firstName}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Level {user.level}
                  </div>
                  <div className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    {user.xp} XP
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Full Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((user, index) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${getRankColor(index + 1)}`}
                  >
                    <div className="flex-shrink-0">
                      {getRankIcon(index + 1)}
                    </div>
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profileImageUrl} alt={user.firstName} />
                        <AvatarFallback className="text-sm">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-500 to-lime-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {user.level}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {user.xp} XP • {user.loginStreak} day streak
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-purple-600 dark:text-purple-400">
                        ₦{parseFloat(user.totalPoints).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{leaderboard.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
          </div>
          {currentUserRank > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">#{currentUserRank}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Your Rank</div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All Time' },
            { key: 'weekly', label: 'Weekly' },
            { key: 'monthly', label: 'Monthly' },
          ].map((period) => (
            <Button
              key={period.key}
              variant={timeframe === period.key ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe(period.key as any)}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Current User Card */}
      {currentUserRank > 0 && (
        <Card className="bg-gradient-to-r from-purple-500 to-lime-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <div className="text-2xl font-bold">#{currentUserRank}</div>
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold">Your Current Rank</div>
                <div className="text-purple-100">Level {user?.level} • {user?.xp} XP</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">₦{parseFloat(user?.totalPoints || '0').toLocaleString()}</div>
                <div className="text-sm text-purple-100">Total Points Earned</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-6">
        {leaderboard.slice(0, 3).map((user, index) => (
          <Card key={user.id} className={`${getRankColor(index + 1)} border-2`}>
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                {getRankIcon(index + 1)}
              </div>
              <Avatar className="h-20 w-20 mx-auto mb-4">
                <AvatarImage src={user.profileImageUrl} alt={user.firstName} />
                <AvatarFallback className="text-lg">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Level {user.level}
              </div>
              <Badge variant="secondary" className="mb-2">
                {user.xp} XP
              </Badge>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                ₦{parseFloat(user.totalPoints).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Full Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboard.map((user, index) => (
              <div
                key={user.id}
                className={`flex items-center gap-6 p-4 rounded-lg border ${getRankColor(index + 1)}`}
              >
                <div className="flex-shrink-0">
                  {getRankIcon(index + 1)}
                </div>
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.profileImageUrl} alt={user.firstName} />
                    <AvatarFallback>
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-lime-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.level}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white text-lg">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {user.xp} XP • {user.loginStreak} day streak
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    ₦{parseFloat(user.totalPoints).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Available: ₦{parseFloat(user.availablePoints).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No users found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
