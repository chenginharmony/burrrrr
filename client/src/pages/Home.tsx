import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEvent } from '@/hooks/useEvent';
import { useChallenge } from '@/hooks/useChallenge';
import { useIsMobile } from '@/hooks/use-mobile';
import { Header } from '@/components/Header';
import { StatsCard } from '@/components/StatsCard';
import { DailyLoginBonus } from '@/components/DailyLoginBonus';
import { EventCard } from '@/components/EventCard';
import { ChallengeCard } from '@/components/ChallengeCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Gamepad2 } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const { events, joinEvent, isJoining } = useEvent();
  const { challenges, acceptChallenge, declineChallenge, isAccepting, isDeclining } = useChallenge();
  const isMobile = useIsMobile();

  const activeEvents = events.filter(event => event.status === 'active').slice(0, 2);
  const activeChallenges = challenges.filter(challenge => 
    challenge.status === 'active' || challenge.status === 'pending' || challenge.status === 'escrow'
  ).slice(0, 3);

  const winRate = challenges.length > 0 ? 
    Math.round((challenges.filter(c => c.winnerId === user?.id).length / challenges.length) * 100) : 0;

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-lime-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-dice text-white text-sm" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">BetChat</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="w-10 h-10">
              <i className="fas fa-moon dark:hidden" />
              <i className="fas fa-sun hidden dark:block" />
            </Button>
            <Button variant="ghost" size="icon" className="relative w-10 h-10">
              <i className="fas fa-bell" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </Button>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="pb-20 p-4 space-y-6">
          {/* User Profile Banner */}
          {user && (
            <Card className="bg-gradient-to-r from-purple-500 to-lime-500 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <img
                      src={user.profileImageUrl || 'https://via.placeholder.com/48'}
                      alt="User avatar"
                      className="w-12 h-12 rounded-full object-cover border-2 border-white"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {user.level}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{user.firstName || user.email}</h2>
                    <p className="text-purple-100">Level {user.level} • {user.xp} XP</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-2xl font-bold">₦{parseFloat(user.availablePoints || '0').toLocaleString()}</div>
                    <div className="text-sm text-purple-100">Balance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{winRate}%</div>
                    <div className="text-sm text-purple-100">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user.loginStreak || 0}</div>
                    <div className="text-sm text-purple-100">Streak</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Login Bonus */}
          <DailyLoginBonus />

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="p-4 h-auto flex flex-col items-center gap-2">
              <Plus className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium">Create Event</span>
            </Button>
            <Button variant="outline" className="p-4 h-auto flex flex-col items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-lime-600" />
              <span className="text-sm font-medium">New Challenge</span>
            </Button>
          </div>

          {/* Live Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Live Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onJoin={joinEvent}
                  isJoining={isJoining}
                />
              ))}
              {activeEvents.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No active events at the moment
                </p>
              )}
            </CardContent>
          </Card>

          {/* Active Challenges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Challenges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  currentUserId={user?.id}
                  onAccept={acceptChallenge}
                  onDecline={declineChallenge}
                  isAccepting={isAccepting}
                  isDeclining={isDeclining}
                />
              ))}
              {activeChallenges.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No active challenges
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Balance"
          value={`₦${parseFloat(user?.availablePoints || '0').toLocaleString()}`}
          subtitle="+₦340 today"
          icon="fas fa-wallet"
          gradient="bg-gradient-to-r from-green-400 to-green-600"
        />
        <StatsCard
          title="Current Level"
          value={`Level ${user?.level || 1}`}
          icon="fas fa-star"
          gradient="bg-gradient-to-r from-purple-500 to-lime-500"
          progress={user?.xp ? (user.xp % 100) : 0}
        />
        <StatsCard
          title="Win Rate"
          value={`${winRate}%`}
          subtitle={`${challenges.filter(c => c.winnerId === user?.id).length} wins / ${challenges.length} total`}
          icon="fas fa-trophy"
          gradient="bg-gradient-to-r from-lime-500 to-green-500"
        />
      </div>

      {/* Daily Login Bonus */}
      <DailyLoginBonus />

      {/* Recent Activity & Live Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Live Events</CardTitle>
            <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onJoin={joinEvent}
                isJoining={isJoining}
              />
            ))}
            {activeEvents.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No active events at the moment
              </p>
            )}
          </CardContent>
        </Card>

        {/* Active Challenges */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Challenges</CardTitle>
            <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                currentUserId={user?.id}
                onAccept={acceptChallenge}
                onDecline={declineChallenge}
                isAccepting={isAccepting}
                isDeclining={isDeclining}
              />
            ))}
            {activeChallenges.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No active challenges
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Achievements</CardTitle>
          <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-lg text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-fire text-lg" />
                </div>
                <div>
                  <h4 className="font-semibold">Streak Master</h4>
                  <p className="text-sm opacity-90">{user?.loginStreak || 0} day login streak</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-400 to-blue-500 p-4 rounded-lg text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-trophy text-lg" />
                </div>
                <div>
                  <h4 className="font-semibold">Challenge Victor</h4>
                  <p className="text-sm opacity-90">Won {challenges.filter(c => c.winnerId === user?.id).length} challenges</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-400 to-pink-500 p-4 rounded-lg text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-users text-lg" />
                </div>
                <div>
                  <h4 className="font-semibold">Social Butterfly</h4>
                  <p className="text-sm opacity-90">Level {user?.level || 1} reached</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
