
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Header } from '@/components/Header';
import { MobileFooterNav } from '@/components/MobileFooterNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Trophy, 
  Users, 
  Calendar, 
  Gamepad2, 
  Coins, 
  CheckCheck, 
  Trash2,
  Settings
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'achievement' | 'friend_request' | 'event' | 'challenge' | 'points' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
  actionText?: string;
  actionId?: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'achievement',
      title: 'New Achievement Unlocked!',
      message: 'You earned the "First Win" achievement for completing your first challenge.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      read: false,
    },
    {
      id: '2',
      type: 'friend_request',
      title: 'Friend Request',
      message: 'John Doe sent you a friend request.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      read: false,
      actionRequired: true,
      actionText: 'Accept',
      actionId: 'friend_request_123',
    },
    {
      id: '3',
      type: 'event',
      title: 'Event Starting Soon',
      message: 'The "Crypto Price Prediction" event starts in 1 hour. Don\'t miss out!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      read: true,
    },
    {
      id: '4',
      type: 'challenge',
      title: 'Challenge Completed',
      message: 'Your challenge against Sarah was completed. You won ₦500!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      read: true,
    },
    {
      id: '5',
      type: 'points',
      title: 'Daily Login Bonus',
      message: 'You received ₦100 for your daily login streak!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      read: true,
    },
    {
      id: '6',
      type: 'system',
      title: 'System Update',
      message: 'New features have been added to improve your experience.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      read: true,
    },
  ]);

  const [activeTab, setActiveTab] = useState('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'friend_request':
        return <Users className="h-5 w-5 text-blue-500" />;
      case 'event':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'challenge':
        return <Gamepad2 className="h-5 w-5 text-green-500" />;
      case 'points':
        return <Coins className="h-5 w-5 text-orange-500" />;
      case 'system':
        return <Settings className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationTime.toLocaleDateString();
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const handleAction = (notification: Notification) => {
    if (notification.type === 'friend_request') {
      // Handle friend request acceptance
      console.log('Accepting friend request:', notification.actionId);
      markAsRead(notification.id);
    }
  };

  const filterNotifications = (type: string) => {
    if (type === 'all') return notifications;
    if (type === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => n.type === type);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header 
        title="Notifications" 
        showBackButton={isMobile}
        showStreak={!isMobile}
      />
      
      <div className={`${isMobile ? 'pb-20 pt-16' : 'pt-16'} px-4 max-w-4xl mx-auto`}>
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
              className="flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="achievement">Awards</TabsTrigger>
            <TabsTrigger value="friend_request">Friends</TabsTrigger>
            <TabsTrigger value="event" className="hidden lg:flex">Events</TabsTrigger>
            <TabsTrigger value="challenge" className="hidden lg:flex">Games</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="space-y-4">
              {filterNotifications(activeTab).map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`transition-all duration-200 ${
                    !notification.read 
                      ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20' 
                      : 'hover:shadow-md'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className={`font-semibold ${
                              !notification.read 
                                ? 'text-gray-900 dark:text-white' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                {getTimeAgo(notification.timestamp)}
                              </span>
                              {!notification.read && (
                                <Badge variant="secondary" className="text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {notification.actionRequired && (
                              <Button 
                                size="sm" 
                                onClick={() => handleAction(notification)}
                                className="text-xs"
                              >
                                {notification.actionText}
                              </Button>
                            )}
                            
                            {!notification.read && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="p-2"
                              >
                                <CheckCheck className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="p-2 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filterNotifications(activeTab).length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No notifications
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {activeTab === 'unread' 
                        ? "You're all caught up! No unread notifications."
                        : "No notifications to show right now."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {isMobile && <MobileFooterNav />}
    </div>
  );
}
