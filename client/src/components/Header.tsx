import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  Bell,
  MessageSquare,
  Wallet,
  LogIn,
  Search,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { LoginModal } from './LoginModal';

interface HeaderProps {
  title?: string;
  showMenu?: boolean;
  onMenuClick?: () => void;
  showSearch?: boolean;
  showBackButton?: boolean;
  showStreak?: boolean;
}

export function Header({
  title,
  showMenu = true,
  onMenuClick,
  showSearch = false,
  showBackButton = false,
  showStreak = false
}: HeaderProps) {
  const [location, navigate] = useLocation();
  
  // Dynamic title based on route
  const getPageTitle = () => {
    if (title) return title;
    
    switch (location) {
      case '/':
        return 'Events';
      case '/home':
        return 'Dashboard';
      case '/challenges':
        return 'Challenges';
      case '/friends':
        return 'Friends';
      case '/wallet':
        return 'Wallet';
      case '/profile':
        return 'Profile';
      case '/leaderboard':
        return 'Leaderboard';
      case '/notifications':
        return 'Notifications';
      default:
        return 'BetChat';
    }
  };
  const { user, isLoading } = useAuth();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleBack = () => {
    window.history.back();
  };

  const balance = parseFloat((user?.availablePoints ?? '0').toString());
  const usdEquivalent = (balance * 0.0006).toFixed(2); // Mock conversion rate

  // Format the notification count for display
  const formatNotificationCount = (count: number) => {
    if (count > 99) return '99+';
    return count.toString();
  };

  const formatNumber = (num: number, currency: string) => {
    if (num >= 1_000_000) return currency + (num / 1_000_000).toFixed(2).replace(/\.00$/, '') + 'M';
    if (num >= 1_000) return currency + (num / 1_000).toFixed(2).replace(/\.00$/, '') + 'K';
    return currency + num.toFixed(2).replace(/\.00$/, '');
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 bg-opacity-95 dark:bg-opacity-95 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Back button if requested */}
            {showBackButton && (
              <button onClick={handleBack} className="text-gray-700 mr-2">
                <ArrowLeft className="h-6 w-6" />
              </button>
            )}

            {/* Logo or Title */}
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-8 w-8 object-contain"
              />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isLoading ? null : user ? (
              <>
                {/* Leaderboard */}
                <button
                  type="button"
                  onClick={() => handleNavigate('/leaderboard')}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                  aria-label="Leaderboard"
                >
                  <i className="fas fa-trophy h-5 w-5 opacity-80 hover:opacity-100 transition-opacity" />
                </button>
                {/* Messages */}
                <button
                  type="button"
                  onClick={() => handleNavigate('/friends')}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                  aria-label="Messages"
                >
                  <MessageSquare className="h-6 w-6 opacity-100 hover:opacity-100 transition-opacity" />
                </button>
                {/* Notifications */}
                <button
                  type="button"
                  onClick={() => handleNavigate('/notifications')}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell className="h-6 w-6" />
                </button>
                {/* Wallet */}
                <button
                  type="button"
                  onClick={() => handleNavigate('/wallet')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-lime-400 text-black font-semibold rounded-full hover:bg-lime-300 transition-colors"
                  aria-label="Wallet"
                >
                  <span className="text-sm font-bold">
                    {formatNumber(balance, '₦')}
                    <span className="text-[10px] opacity-60 ml-0.5">
                      (${usdEquivalent})
                    </span>
                  </span>
                </button>
                {/* Profile Avatar/Menu */}
                <button
                  type="button"
                  onClick={() => handleNavigate('/profile')}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors border border-gray-300 dark:border-gray-700"
                  aria-label="Profile"
                >
                  <img
                    src={user.profileImageUrl || '/default-avatar.png'}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-lime-400 text-black rounded-md hover:bg-lime-300 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign in</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </header>
  );
}
