import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Users, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  startTime: string;
  endTime: string;
  wagerAmount: string;
  status: string;
  creatorId: string;
}

export function RecommendedEvents() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['/api/events/recommended', user?.id],
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Recommended for You</h2>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Recommended for You</h2>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Start participating in events to get personalized recommendations!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Crypto': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Sports': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Gaming': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Music': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'Politics': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const formatTimeUntilStart = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = start.getTime() - now.getTime();
    
    if (diff <= 0) return 'Started';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return 'Soon';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-5 w-5 text-yellow-500" />
        <h2 className="text-lg font-semibold">Recommended for You</h2>
        <Badge variant="secondary" className="ml-auto">
          Powered by AI
        </Badge>
      </div>
      
      <div className="space-y-3">
        {recommendations.slice(0, 5).map((event: Event, index: number) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="cursor-pointer"
            onClick={() => setLocation(`/events/${event.id}`)}
          >
            <Card className="hover:shadow-md transition-shadow border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getCategoryColor(event.category)}>
                        {event.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatTimeUntilStart(event.startTime)}
                      </div>
                    </div>
                    
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">
                      {event.title}
                    </h3>
                    
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                      {event.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="font-medium text-green-600">
                          ₦{event.wagerAmount || '0'}
                        </span>
                      </div>
                      
                      <Button size="sm" variant="outline" className="text-xs">
                        View Event
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {recommendations.length > 5 && (
        <Button 
          variant="ghost" 
          className="w-full"
          onClick={() => setLocation('/events?recommended=true')}
        >
          View All Recommendations
        </Button>
      )}
    </div>
  );
}