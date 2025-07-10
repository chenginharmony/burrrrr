import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const navigation = [
  { name: 'Events', href: '/', icon: 'fas fa-calendar-alt' },
  { name: 'Dashboard', href: '/home', icon: 'fas fa-home' },
  { name: 'Challenges', href: '/challenges', icon: 'fas fa-gamepad' },
  { name: 'Friends', href: '/friends', icon: 'fas fa-users' },
  { name: 'Wallet', href: '/wallet', icon: 'fas fa-wallet' },
  { name: 'Leaderboard', href: '/leaderboard', icon: 'fas fa-trophy' },
];

const categories = [
  { name: 'Crypto', icon: 'fab fa-bitcoin text-orange-500' },
  { name: 'Sports', icon: 'fas fa-football-ball text-green-500' },
  { name: 'Gaming', icon: 'fas fa-gamepad text-blue-500' },
  { name: 'Music', icon: 'fas fa-music text-purple-500' },
  { name: 'Politics', icon: 'fas fa-landmark text-red-500' },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-lime-500 rounded-lg flex items-center justify-center">
            <i className="fas fa-dice text-white text-sm" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">BetChat</h1>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg font-medium cursor-pointer",
                  isActive
                    ? "text-purple-600 bg-purple-50 dark:bg-purple-900/20"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}>
                  <i className={item.icon} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Categories */}
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Categories
          </h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.name}
                className="flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm w-full text-left"
              >
                <i className={category.icon} />
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Profile */}
      {user && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user.profileImageUrl || 'https://via.placeholder.com/40'}
                alt="User avatar"
                className="w-10 h-10 rounded-full object-cover border-2 border-green-500"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-lime-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user.level}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user.firstName || user.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ₦{parseFloat(user.availablePoints || '0').toLocaleString()} • {user.xp} XP
              </p>
            </div>
            <Link href="/profile" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <i className="fas fa-cog" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}