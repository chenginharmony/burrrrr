import { Link, useLocation } from 'wouter';
import { Calendar, Gamepad2, Plus, Trophy, User, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'History', href: '/history', icon: Home },
  { name: 'Events', href: '/', icon: Calendar },
  { name: 'Games', href: '/challenges', icon: Gamepad2 },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Profile', href: '/profile', icon: User },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-2 lg:hidden">
      <div className="flex items-center justify-around">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const IconComponent = item.icon;
          return (
            <Link key={item.name} href={item.href} className={cn(
              "flex flex-col items-center gap-1 p-2 text-gray-500 dark:text-gray-400",
              isActive && "text-purple-600 dark:text-purple-400"
            )}>
              <IconComponent className="h-5 w-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}