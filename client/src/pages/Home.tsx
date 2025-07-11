import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEvent } from '@/hooks/useEvent';
import { useChallenge } from '@/hooks/useChallenge';
import { useIsMobile } from '@/hooks/use-mobile';
import { Header } from '@/components/Header';
import { MobileFooterNav } from '@/components/MobileFooterNav';
import { StatsCard } from '@/components/StatsCard';
import { DailyLoginBonus } from '@/components/DailyLoginBonus';
import { EventCard } from '@/components/EventCard';
import { ChallengeCard } from '@/components/ChallengeCard';
import { RecommendedEvents } from '@/components/RecommendedEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Gamepad2, Users, Trophy, Target, Calendar } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Home() {
  const { user } = useAuth();
  const { events, joinEvent, isJoining } = useEvent();
  const { challenges, acceptChallenge, declineChallenge, isAccepting, isDeclining } = useChallenge();
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();

  const activeEvents = events.filter(event => event.status === 'active').slice(0, 2);
  const activeChallenges = challenges.filter(challenge => 
    challenge.status === 'active' || challenge.status === 'pending' || challenge.status === 'escrow'
  ).slice(0, 3);

  const winRate = challenges.length > 0 ? 
    Math.round((challenges.filter(c => c.winnerId === user?.id).length / challenges.length) * 100) : 0;

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="pb-24 p-4 space-y-6">
          {/* User Profile Banner */}
          {user && (
            <Card className="bg-gradient-to-r from-purple-500 to-lime-500 text-white border-0 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <img
                      src={user.profileImageUrl || 'https://via.placeholder.com/60'}
                      alt="User avatar"
                      className="w-16 h-16 rounded-full object-cover border-3 border-white/30"
                    />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white text-purple-600 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                      {user.level}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{user.firstName || user.email}</h2>
                    <p className="text-purple-100">Level {user.level} • {user.xp} XP</p>
                    <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                      <div 
                        className="bg-white rounded-full h-2 transition-all"
                        style={{ width: `${(user.xp % 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
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

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">{activeEvents.length}</div>
                <div className="text-sm opacity-90">Live Events</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-80" />
                <div className="text-2xl font-bold">{activeChallenges.length}</div>
                <div className="text-sm opacity-90">Active Challenges</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="p-6 h-auto flex flex-col items-center gap-3 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
              onClick={() => navigate('/events')}
            >
              <Plus className="h-8 w-8 text-purple-600" />
              <span className="text-sm font-medium">Create Event</span>
            </Button>
            <Button 
              variant="outline" 
              className="p-6 h-auto flex flex-col items-center gap-3 border-2 border-lime-200 hover:border-lime-400 hover:bg-lime-50"
              onClick={() => navigate('/challenges')}
            >
              <Gamepad2 className="h-8 w-8 text-lime-600" />
              <span className="text-sm font-medium">New Challenge</span>
            </Button>
          </div>

          {/* Live Events */}
          {activeEvents.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live Events
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/events')}>
                  View All
                </Button>
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
              </CardContent>
            </Card>
          )}

          {/* Active Challenges */}
          {activeChallenges.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-orange-500" />
                  Active Challenges
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/challenges')}>
                  View All
                </Button>
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
              </CardContent>
            </Card>
          )}

          {/* Achievement Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Challenge Victor</h4>
                      <p className="text-sm opacity-90">Won {challenges.filter(c => c.winnerId === user?.id).length} challenges</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <MobileFooterNav />
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

      {/* AI Recommendations */}
      <RecommendedEvents />

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