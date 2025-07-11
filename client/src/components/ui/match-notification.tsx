import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Trophy, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MatchNotificationProps {
  notification: {
    type: 'bet_placed' | 'match_found' | 'event_ended';
    title: string;
    content: string;
    metadata?: {
      eventId?: string;
      eventTitle?: string;
      prediction?: boolean;
      wagerAmount?: number;
      opponentUsername?: string;
      opponentId?: string;
      winAmount?: number;
      isWinner?: boolean;
    };
  } | null;
  onClose: () => void;
}

export function MatchNotification({ notification, onClose }: MatchNotificationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'bet_placed':
        return <Clock className="h-6 w-6 text-blue-500" />;
      case 'match_found':
        return <Users className="h-6 w-6 text-green-500" />;
      case 'event_ended':
        return <Trophy className={`h-6 w-6 ${notification.metadata?.isWinner ? 'text-yellow-500' : 'text-gray-500'}`} />;
      default:
        return <Clock className="h-6 w-6 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'bet_placed':
        return 'bg-blue-600';
      case 'match_found':
        return 'bg-green-600';
      case 'event_ended':
        return notification.metadata?.isWinner ? 'bg-yellow-600' : 'bg-gray-600';
      default:
        return 'bg-blue-600';
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="fixed top-4 right-4 z-50 max-w-sm w-full"
        >
          <div className={`${getBgColor()} text-white rounded-lg shadow-lg overflow-hidden`}>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold">{notification.title}</h3>
                  <p className="text-xs text-white/90 mt-1">{notification.content}</p>
                  
                  {/* Additional metadata display */}
                  {notification.metadata && (
                    <div className="mt-2 text-xs space-y-1">
                      {notification.metadata.eventTitle && (
                        <div className="flex items-center gap-1">
                          <span className="opacity-75">Event:</span>
                          <span className="font-medium">{notification.metadata.eventTitle}</span>
                        </div>
                      )}
                      {notification.metadata.wagerAmount && (
                        <div className="flex items-center gap-1">
                          <span className="opacity-75">Amount:</span>
                          <span className="font-medium">₦{notification.metadata.wagerAmount.toLocaleString()}</span>
                        </div>
                      )}
                      {notification.metadata.prediction !== undefined && (
                        <div className="flex items-center gap-1">
                          <span className="opacity-75">Your bet:</span>
                          <span className={`font-medium px-1.5 py-0.5 rounded text-xs ${
                            notification.metadata.prediction ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            {notification.metadata.prediction ? 'YES' : 'NO'}
                          </span>
                        </div>
                      )}
                      {notification.metadata.winAmount && (
                        <div className="flex items-center gap-1">
                          <span className="opacity-75">Won:</span>
                          <span className="font-medium text-yellow-300">₦{notification.metadata.winAmount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-white hover:bg-white/10 p-1 h-auto"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Progress bar for auto-close */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
              className="h-1 bg-white/20"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}