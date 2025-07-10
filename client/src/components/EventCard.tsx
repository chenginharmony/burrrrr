import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users } from 'lucide-react';
import { Event } from '@/hooks/useEvent';

interface EventCardProps {
  event: Event;
  onJoin?: (eventId: string, prediction: boolean) => void;
  isJoining?: boolean;
}

export function EventCard({ event, onJoin, isJoining }: EventCardProps) {
  const isLive = event.status === 'active' && new Date(event.startTime) <= new Date();
  const timeLeft = new Date(event.endTime).getTime() - new Date().getTime();
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'crypto':
        return 'fab fa-bitcoin text-orange-500';
      case 'sports':
        return 'fas fa-football-ball text-green-500';
      case 'gaming':
        return 'fas fa-gamepad text-blue-500';
      case 'music':
        return 'fas fa-music text-purple-500';
      case 'politics':
        return 'fas fa-landmark text-red-500';
      default:
        return 'fas fa-circle text-gray-500';
    }
  };

  return (
    <Card className="border border-gray-200 dark:border-gray-600 hover:border-purple-500/50 transition-colors cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <i className={getCategoryIcon(event.category)} />
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
            {event.category}
          </span>
          <Badge variant={isLive ? "default" : "secondary"} className={isLive ? "bg-green-500 text-white" : ""}>
            {isLive ? 'LIVE' : 'UPCOMING'}
          </Badge>
        </div>
        
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {event.title}
        </h4>
        
        {event.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {event.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-green-600 dark:text-green-400 font-medium">YES: --</span>
            </div>
            <div className="text-sm">
              <span className="text-red-600 dark:text-red-400 font-medium">NO: --</span>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            ₦{parseFloat(event.wagerAmount || '0').toLocaleString()}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`} left
          </div>
          <div className="flex items-center gap-1">
            <Users size={12} />
            {event.maxParticipants} max
          </div>
        </div>
        
        {onJoin && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onJoin(event.id, true)}
              disabled={isJoining}
              className="flex-1 bg-green-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-600 disabled:opacity-50"
            >
              Yes
            </button>
            <button
              onClick={() => onJoin(event.id, false)}
              disabled={isJoining}
              className="flex-1 bg-red-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-600 disabled:opacity-50"
            >
              No
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
