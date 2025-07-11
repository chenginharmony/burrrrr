import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface EventStatsProps {
  eventId: string;
}

interface Participant {
  userId: string;
  prediction: boolean;
  wagerAmount: string;
  username?: string;
  joinedAt: string;
}

export function EventStats({ eventId }: EventStatsProps) {
  const [yesPercentage, setYesPercentage] = useState(50);
  const [noPercentage, setNoPercentage] = useState(50);
  const [totalPool, setTotalPool] = useState(0);
  const [memberCount, setMemberCount] = useState(0);

  const { data: participants = [] } = useQuery({
    queryKey: ['/api/events', eventId, 'participants'],
    enabled: !!eventId,
  });

  useEffect(() => {
    if (participants && participants.participants) {
      const participantList = participants.participants;
      const yesVotes = participantList.filter((p: Participant) => p.prediction === true);
      const noVotes = participantList.filter((p: Participant) => p.prediction === false);
      
      const totalVotes = participantList.length;
      const yesCount = yesVotes.length;
      const noCount = noVotes.length;
      
      if (totalVotes > 0) {
        setYesPercentage(Math.round((yesCount / totalVotes) * 100));
        setNoPercentage(Math.round((noCount / totalVotes) * 100));
      } else {
        setYesPercentage(50);
        setNoPercentage(50);
      }
      
      // Calculate total pool from wager amounts
      const pool = participantList.reduce((sum: number, p: Participant) => {
        return sum + parseFloat(p.wagerAmount || '0');
      }, 0);
      
      setTotalPool(pool);
      setMemberCount(totalVotes);
    }
  }, [participants]);

  return (
    <div className="bg-gray-900 rounded-lg p-4 text-white space-y-3">
      {/* Members and Rating */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{memberCount} Members</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-400 fill-current" />
          <span>0</span>
        </div>
      </div>

      {/* Event Pool */}
      <div className="text-center">
        <div className="text-2xl font-bold">₦ {totalPool.toLocaleString()}</div>
        <div className="text-sm text-gray-400">Event Pool</div>
      </div>

      {/* YES/NO Voting Section */}
      <div className="space-y-3">
        <div className="text-center text-sm font-medium">Event Chat</div>
        
        <div className="flex gap-3">
          {/* YES Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1"
          >
            <div className="bg-green-600 hover:bg-green-700 transition-colors rounded-lg p-3 cursor-pointer text-center">
              <div className="text-lg font-bold">YES</div>
              <div className="text-sm">{yesPercentage}%</div>
            </div>
          </motion.div>

          {/* NO Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1"
          >
            <div className="bg-red-600 hover:bg-red-700 transition-colors rounded-lg p-3 cursor-pointer text-center">
              <div className="text-lg font-bold">NO</div>
              <div className="text-sm">{noPercentage}%</div>
            </div>
          </motion.div>
        </div>

        {/* Percentage Bar */}
        <div className="flex h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '50%' }}
            animate={{ width: `${yesPercentage}%` }}
            transition={{ duration: 0.5 }}
            className="bg-green-500"
          />
          <motion.div
            initial={{ width: '50%' }}
            animate={{ width: `${noPercentage}%` }}
            transition={{ duration: 0.5 }}
            className="bg-red-500"
          />
        </div>
      </div>

      {/* Timer placeholder */}
      <div className="text-center text-sm text-gray-400">
        ⏱ Live Event
      </div>
    </div>
  );
}