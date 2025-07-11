import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Trophy, Clock } from 'lucide-react';

interface MatchNotificationProps {
  notification: {
    type: string;
    title: string;
    content: string;
    metadata?: {
      eventId?: string;
      opponentId?: string;
      opponentUsername?: string;
      prediction?: boolean;
      wagerAmount?: number;
      eventTitle?: string;
      isWin?: boolean;
      payoutAmount?: number;
    };
  } | null;
  onClose: () => void;
}

export function MatchNotification({ notification, onClose }: MatchNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      
      // Auto-close after different durations based on notification type
      const duration = notification.type === 'match_found' ? 8000 : 
                     notification.type === 'bet_placed' ? 5000 : 
                     notification.type === 'event_ended' ? 10000 : 6000;
      
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const getNotificationStyle = () => {
    switch (notification.type) {
      case 'bet_placed':
        return {
          bg: 'bg-gradient-to-r from-blue-600 to-blue-500',
          icon: <Clock className="h-5 w-5" />,
          pulse: true
        };
      case 'match_found':
        return {
          bg: 'bg-gradient-to-r from-green-600 to-green-500',
          icon: <Users className="h-5 w-5" />,
          pulse: false
        };
      case 'event_ended':
        const isWin = notification.metadata?.isWin;
        return {
          bg: isWin 
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
            : 'bg-gradient-to-r from-gray-600 to-gray-500',
          icon: <Trophy className="h-5 w-5" />,
          pulse: false
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-purple-600 to-purple-500',
          icon: <Users className="h-5 w-5" />,
          pulse: false
        };
    }
  };

  const style = getNotificationStyle();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: '100%', opacity: 0, scale: 0.9 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: '100%', opacity: 0, scale: 0.9 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 30,
            duration: 0.4
          }}
          className={`fixed top-24 right-4 ${style.bg} text-white p-4 rounded-xl shadow-xl max-w-sm z-50 border border-white/20`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative ${
              style.pulse ? 'animate-pulse' : ''
            }`}>
              {style.icon}
              {style.pulse && (
                <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm mb-1">{notification.title}</h4>
              <p className="text-xs opacity-90 leading-relaxed">
                {notification.content}
              </p>
              
              {/* Additional info based on notification type */}
              {notification.type === 'match_found' && notification.metadata?.opponentUsername && (
                <div className="mt-2 p-2 bg-white/10 rounded-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span>Opponent:</span>
                    <span className="font-medium">@{notification.metadata.opponentUsername}</span>
                  </div>
                  {notification.metadata.wagerAmount && (
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span>Wager:</span>
                      <span className="font-medium">₦{notification.metadata.wagerAmount}</span>
                    </div>
                  )}
                </div>
              )}
              
              {notification.type === 'event_ended' && notification.metadata?.payoutAmount && (
                <div className="mt-2 p-2 bg-white/10 rounded-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span>{notification.metadata.isWin ? 'Winnings:' : 'Lost:'}</span>
                    <span className="font-bold">
                      {notification.metadata.isWin ? '+' : '-'}₦{notification.metadata.payoutAmount}
                    </span>
                  </div>
                </div>
              )}
              
              {notification.type === 'bet_placed' && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="text-xs opacity-75 ml-1">Finding match...</span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}