import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Users } from 'lucide-react';
import { useLocation } from 'wouter';

interface EventNotificationProps {
  notification: {
    type: string;
    title: string;
    message: string;
    eventId: string;
    creatorName: string;
    timestamp: string;
  } | null;
  onClose: () => void;
}

export function EventNotification({ notification, onClose }: EventNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 6000); // Show for 6 seconds
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  const handleClick = () => {
    if (notification?.eventId) {
      navigate('/');
      setIsVisible(false);
      setTimeout(onClose, 300);
    }
  };

  if (!notification) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-20 right-4 bg-gradient-to-r from-purple-600 to-lime-500 text-white p-4 rounded-lg shadow-lg max-w-sm z-50 cursor-pointer"
          onClick={handleClick}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{notification.title}</h4>
              <p className="text-xs opacity-90 mt-1">{notification.message}</p>
              <div className="flex items-center gap-1 mt-2 text-xs opacity-80">
                <Users className="h-3 w-3" />
                <span>Tap to view event</span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="text-white/80 hover:text-white ml-2"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}