import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { useLocation } from 'wouter';
import { Event } from '@/hooks/useEvent';

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop';

interface EventCardProps {
  event: Event;
  onJoin?: (eventId: string, prediction: boolean) => void;
  isJoining?: boolean;
}

export function EventCard({ event, onJoin, isJoining }: EventCardProps) {
  const [, setLocation] = useLocation();
  const [currentParticipants, setCurrentParticipants] = useState(0);
  const [poolAmount, setPoolAmount] = useState(0);

  const formatCurrency = (amount: number, currency: string = '₦', shortenLargeNumbers: boolean = true) => {
    if (shortenLargeNumbers) {
      if (amount >= 1000000) {
        return `${currency}${(amount / 1000000).toFixed(1)}M`;
      } else if (amount >= 1000) {
        return `${currency}${(amount / 1000).toFixed(1)}K`;
      }
    }
    return `${currency}${amount.toLocaleString()}`;
  };

  const getEventStatus = () => {
    const now = new Date();
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    if (event.status === 'cancelled') {
      return {
        label: 'CANCELLED',
        bg: 'bg-red-500',
        dot: 'bg-red-500',
        text: 'text-white',
        animate: false,
      };
    }

    if (now < startTime) {
      return {
        label: 'UPCOMING',
        bg: 'bg-[#CCFF00]',
        dot: 'bg-[#CCFF00]',
        text: 'text-black',
        animate: true,
      };
    }

    if (now >= startTime && now <= endTime) {
      return {
        label: 'LIVE',
        bg: 'bg-[#CCFF00]',
        dot: 'bg-red-500',
        text: 'text-black',
        animate: true,
      };
    }

    return {
      label: 'ENDED',
      bg: 'bg-gray-500',
      dot: 'bg-gray-500',
      text: 'text-white',
      animate: false,
    };
  };

  const handleJoinClick = () => {
    // Navigate to event chat page
    setLocation(`/events/${event.id}/chat`);
  };

  const status = getEventStatus();
  const isEventEnded = status.label === 'ENDED' || status.label === 'CANCELLED';

  // Set initial values from event data
  useEffect(() => {
    setCurrentParticipants(event.participantCount || 0);
    setPoolAmount(parseFloat(event.wagerAmount || '0'));
  }, [event]);

  return (
    <div className="bg-black rounded-3xl overflow-hidden relative">
      <div className="relative w-full aspect-video">
        <img
          src={event.imageUrl || DEFAULT_BANNER}
          alt={event.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_BANNER;
          }}
        />

        {/* Header with creator info, title, and status */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent pt-2 pb-1.5">
          <div className="px-3 grid grid-cols-[auto_1fr_auto] items-center w-full gap-2">
            {/* Creator info - Left side */}
            <div className="flex items-center flex-shrink-0">
              <div className="overflow-hidden rounded-full h-5 w-5 border border-white/50 flex-shrink-0">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${event.creatorId || 'creator'}`}
                  alt="Creator"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-white/90 text-xs ml-1.5">
                {event.creatorId?.slice(0, 8) || "creator"}
              </span>
            </div>

            {/* Centered title */}
            <h2 className="text-white text-lg font-bold leading-tight text-center mx-auto truncate px-2">
              {event.title}
            </h2>

            {/* Status icon - Right side */}
            <div className="flex-shrink-0">
              <div className={`${status.bg} w-2.5 h-2.5 rounded-full shadow-sm relative`}>
                {status.animate && (
                  <div className={`absolute inset-0 ${status.dot} rounded-full animate-ping opacity-75`} />
                )}
                <div className={`absolute inset-0 ${status.dot} rounded-full`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section with event pool and join button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
        {/* Event Pool section */}
        <div className="flex flex-col justify-end">
          <span className="text-white text-sm font-bold">Event Pool</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="bg-white rounded-lg px-2 py-1">
              <span className="text-black font-bold text-sm">
                {formatCurrency(poolAmount, '₦', true)}
              </span>
            </div>
            {/* Participation Avatar + Count */}
            <div className="flex items-center ml-[1rem]">
              <div className="relative">
                <div className="overflow-hidden rounded-full h-5 w-5 border-2 border-white-200 flex items-center justify-center">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${event.id}`}
                    alt="Participant"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="bg-white rounded-full min-w-[1.5rem] h-5 flex items-center justify-center text-black font-bold text-xs ml-[-0.2rem] pl-1 pr-1">
                {currentParticipants}
              </div>
            </div>
          </div>
        </div>

        {/* Join Button */}
        <button
          type="button"
          onClick={handleJoinClick}
          disabled={isEventEnded || isJoining}
          className={`${
            isEventEnded
              ? 'bg-gray-500 cursor-not-allowed text-white'
              : isJoining
                ? 'bg-gray-400 text-white'
                : 'bg-[#CCFF00] text-black hover:bg-[#b8e600]'
          } h-10 flex items-center justify-center gap-1 px-4 rounded-3xl font-medium transition-colors`}
        >
          {event.isPrivate && <Lock className="h-4 w-4" />}
          {isEventEnded
            ? 'Closed'
            : isJoining
              ? 'Processing...'
              : event.isPrivate
                ? 'Request'
                : 'Join'}
        </button>
      </div>
    </div>
  );
}
