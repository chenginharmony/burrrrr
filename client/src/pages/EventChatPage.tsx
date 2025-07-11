import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, MessageSquare, TrendingUp } from 'lucide-react';
import { BettingInterface } from '@/components/BettingInterface';
import { ChatRoom } from '@/components/ChatRoom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Event, useEvent } from '@/hooks/useEvent';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface EventChatPageProps {
  params: {
    eventId: string;
  };
}

export default function EventChatPage({ params }: EventChatPageProps) {
  const [, setLocation] = useLocation();
  const { eventId } = params;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [placingBet, setPlacingBet] = useState(false);
  const { toast } = useToast();

  const handleBack = () => {
    setLocation('/');
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const eventData = await response.json();
        setEvent(eventData);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: "Error",
        description: "Failed to load event",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBet = async (prediction: boolean, amount: number) => {
    try {
      setPlacingBet(true);
      await apiRequest('POST', `/api/events/${eventId}/join`, {
        prediction,
        wagerAmount: amount,
      });
      
      toast({
        title: "Success",
        description: "Bet placed successfully!",
      });
      
      // Refresh event data
      await fetchEvent();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to place bet",
        variant: "destructive",
      });
    } finally {
      setPlacingBet(false);
    }
  };

  if (!eventId) {
    setLocation('/');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Event not found</h2>
          <Button onClick={handleBack}>Go back to events</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{event.category}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto p-4 max-w-4xl">
        <Tabs defaultValue="betting" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="betting" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Betting
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="betting" className="mt-6">
            <BettingInterface
              event={event}
              onPlaceBet={handlePlaceBet}
              isPlacingBet={placingBet}
            />
          </TabsContent>
          
          <TabsContent value="chat" className="mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-[600px]">
              <ChatRoom
                roomId={eventId}
                roomType="event"
                title={event.title}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}