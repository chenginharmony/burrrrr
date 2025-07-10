import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Shield, TrendingUp, Hourglass } from 'lucide-react';
import { Challenge } from '@/hooks/useChallenge';

interface ChallengeCardProps {
  challenge: Challenge;
  currentUserId?: string;
  onAccept?: (challengeId: string) => void;
  onDecline?: (challengeId: string) => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
}

export function ChallengeCard({ 
  challenge, 
  currentUserId, 
  onAccept, 
  onDecline, 
  isAccepting, 
  isDeclining 
}: ChallengeCardProps) {
  const isChallenger = challenge.challengerId === currentUserId;
  const isChallenged = challenge.challengedId === currentUserId;
  const timeLeft = new Date(challenge.dueDate).getTime() - new Date().getTime();
  const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

  const getStatusBadge = () => {
    switch (challenge.status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">PENDING</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-700">ACTIVE</Badge>;
      case 'escrow':
        return <Badge variant="default" className="bg-orange-100 text-orange-700">ESCROW</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-purple-100 text-purple-700">COMPLETED</Badge>;
      case 'declined':
        return <Badge variant="destructive">DECLINED</Badge>;
      default:
        return <Badge variant="secondary">{challenge.status.toUpperCase()}</Badge>;
    }
  };

  const getStatusIcon = () => {
    switch (challenge.status) {
      case 'pending':
        return <Hourglass className="h-4 w-4 text-blue-500" />;
      case 'active':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'escrow':
        return <Shield className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="border border-gray-200 dark:border-gray-600 hover:border-purple-500/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {isChallenger ? 'vs' : 'from'}
              </span>
            </div>
            <span className="font-medium text-gray-900 dark:text-white">
              {isChallenger ? 'Challenge sent' : 'Challenge received'}
            </span>
          </div>
          {getStatusBadge()}
        </div>
        
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {challenge.title}
        </h4>
        
        {challenge.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {challenge.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            {getStatusIcon()}
            {challenge.status === 'escrow' && 'Funds secured in escrow'}
            {challenge.status === 'active' && 'Currently active'}
            {challenge.status === 'pending' && 'Waiting for acceptance'}
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            ₦{parseFloat(challenge.wagerAmount).toLocaleString()}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            {daysLeft > 0 ? `${daysLeft} days remaining` : 'Due soon'}
          </div>
          {challenge.category && (
            <div className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {challenge.category}
            </div>
          )}
        </div>
        
        {challenge.status === 'pending' && isChallenged && onAccept && onDecline && (
          <div className="flex gap-2">
            <button
              onClick={() => onAccept(challenge.id)}
              disabled={isAccepting}
              className="flex-1 bg-green-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-600 disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={() => onDecline(challenge.id)}
              disabled={isDeclining}
              className="flex-1 bg-red-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-600 disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
