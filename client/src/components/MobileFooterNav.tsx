
import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useEvent } from '@/hooks/useEvent';
import { useChallenge } from '@/hooks/useChallenge';
import { Plus } from 'lucide-react';

export function MobileFooterNav() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { events } = useEvent();
  const { challenges } = useChallenge();

  const activeEvents = events.filter(e => e.status === 'active').length;
  const pendingChallenges = challenges.filter(c => c.status === 'pending').length;

  // Format the notification count for display
  const formatNotificationCount = (count: number) => {
    if (count > 99) return '99+';
    return count.toString();
  };

  const navItems = [
    {
      id: 'events',
      path: '/events',
      icon: <i className="fas fa-calendar-alt text-xl" />,
      label: 'Events',
      badge: activeEvents > 0 ? formatNotificationCount(activeEvents) : undefined,
    },
    {
      id: 'challenges',
      path: '/challenges',
      icon: <i className="fas fa-gamepad text-xl" />,
      label: 'Games',
      badge: pendingChallenges > 0 ? formatNotificationCount(pendingChallenges) : undefined,
    },
    {
      id: 'create',
      path: '/',
      icon: <Plus className="w-8 h-8" />,
      label: '',
      isMain: true,
    },
    {
      id: 'friends',
      path: '/friends',
      icon: <i className="fas fa-users text-xl" />,
      label: 'Friends',
    },
    {
      id: 'profile',
      path: '/profile',
      icon: user?.profileImageUrl ? (
        <img
          src={user.profileImageUrl}
          alt="Profile"
          className={`w-8 h-8 rounded-full object-cover border-2 ${location === '/profile' ? 'border-lime-400' : 'border-transparent'}`}
        />
      ) : (
        <i className="fas fa-user text-xl" />
      ),
      label: 'Profile',
    },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom h-[80px] z-50">
      <div className="flex items-center justify-around px-1 h-full">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center h-full px-3 ${
              item.isMain ? 'bg-gradient-to-r from-purple-500 to-lime-500 rounded-full w-14 h-14 -mt-4' : ''
            }`}
          >
            <div className="relative">
              {item.badge && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-medium rounded-full px-1.5 py-0.5 min-w-[16px] h-[16px] flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              <div
                className={`${
                  location === item.path ? 'text-purple-600' : item.isMain ? 'text-white' : 'text-gray-600'
                }`}
              >
                {item.icon}
              </div>
            </div>
            {item.label && (
              <span
                className={`text-xs mt-1 font-medium ${
                  location === item.path ? 'text-purple-600' : 'text-gray-600'
                }`}
              >
                {item.label}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
