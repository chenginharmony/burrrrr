import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  title: string;
  showStreak?: boolean;
}

export function Header({ title, showStreak = false }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        {showStreak && user?.loginStreak && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            <i className="fas fa-fire" />
            <span>{user.loginStreak} Day Streak</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg"
        >
          {theme === 'dark' ? (
            <i className="fas fa-sun" />
          ) : (
            <i className="fas fa-moon" />
          )}
        </Button>
        
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg"
        >
          <i className="fas fa-bell" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </Button>
      </div>
    </div>
  );
}
