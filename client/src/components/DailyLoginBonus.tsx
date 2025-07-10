import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePoints } from '@/hooks/usePoints';
import { useAuth } from '@/hooks/useAuth';

export function DailyLoginBonus() {
  const { claimDailyLogin, isClaimingDailyLogin, canClaimDailyLogin } = usePoints();
  const { user } = useAuth();

  if (!canClaimDailyLogin) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Daily Login Bonus</h3>
            <p className="text-purple-100 mb-4">
              Claim your daily rewards and maintain your streak!
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                <i className="fas fa-fire text-orange-300" />
                <span className="text-sm font-medium">
                  {user?.loginStreak || 0} Day Streak
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                <i className="fas fa-coins text-yellow-300" />
                <span className="text-sm font-medium">+250 XP</span>
              </div>
            </div>
          </div>
          <Button
            onClick={() => claimDailyLogin()}
            disabled={isClaimingDailyLogin}
            className="bg-white text-purple-600 hover:bg-gray-100"
          >
            {isClaimingDailyLogin ? 'Claiming...' : 'Claim Bonus'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
