import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', href: '/', icon: 'fas fa-home' },
  { name: 'Events', href: '/events', icon: 'fas fa-calendar-alt' },
  { name: 'Challenges', href: '/challenges', icon: 'fas fa-gamepad' },
  { name: 'Friends', href: '/friends', icon: 'fas fa-users' },
  { name: 'Wallet', href: '/wallet', icon: 'fas fa-wallet' },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-2 lg:hidden">
      <div className="flex items-center justify-around">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a className={cn(
                "flex flex-col items-center gap-1 p-2 text-gray-500 dark:text-gray-400",
                isActive && "text-purple-600 dark:text-purple-400"
              )}>
                <i className={cn(item.icon, "text-lg")} />
                <span className="text-xs font-medium">{item.name}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
