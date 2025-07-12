import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export interface EventHistoryItem {
  id: string;
  title: string;
  description: string;
  category: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'completed' | 'cancelled';
  participant_count: number;
  is_editable: boolean;
  banner_url: string;
  pool_amount: number;
  user_prediction?: boolean;
  user_earnings?: number;
  creator: {
    id: string;
    username: string;
    avatar_url: string;
  };
}
export function useEventHistory() {
  const [history, setHistory] = useState<EventHistoryItem[]>([]);
  const [createdEvents, setCreatedEvents] = useState<EventHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const toast = useToast();

  const fetchEvents = useCallback(async () => { 
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      // Fetch all events
      const eventsRes = await fetch('/api/events');
      const allEvents = await eventsRes.json();

      // Created events: filter by creatorId
      const createdEventsData = allEvents.filter((event: any) => event.creatorId === currentUser.id);

      // Participated events: fetch participation for each event
      const participatedEvents: any[] = [];
      for (const event of allEvents) {
        const participationRes = await fetch(`/api/events/${event.id}/participation/${currentUser.id}`);
        const participation = await participationRes.json();
        if (participation.hasJoined) {
          participatedEvents.push({ event, prediction: participation.prediction });
        }
      }

      // Process the events to include is_editable flag and format the data
      const processedCreatedEvents = (createdEventsData || []).map((event: any) => ({
        ...event,
        is_editable: true,
        pool_amount: event.pool?.total_amount || 0,
        participant_count: event.participant_count || 0
      }));

      const processedParticipatedEvents = (participatedEvents || [])
        .map(({ event, prediction }) => {
          // Skip if event is null (might have been deleted)
          if (!event) {
            return null;
          }

          return {
            ...event,
            is_editable: false,
            pool_amount: event.pool?.total_amount || 0,
            participant_count: event.participant_count || 0,
            user_prediction: prediction,
            // Calculate earnings based on prediction and pool amount if needed
            user_earnings: 0 // You can implement earnings calculation logic here
          };
        })
        .filter(Boolean); // Remove null entries

      setCreatedEvents(processedCreatedEvents);
      setHistory(processedParticipatedEvents);

    } catch (error) {
      console.error('Error fetching event history:', error);
      toast.showError('Failed to load event history');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, toast]);

  const editEvent = async (eventId: string, updates: Partial<EventHistoryItem>) => { 
    if (!currentUser?.id) throw new Error('Not authenticated');
    // Supabase code removed, see new editEvent implementation above
    const res = await fetch(`/api/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update event');
    const data = await res.json();
    setCreatedEvents(prev =>
      prev.map(event =>
        event.id === eventId ? { ...event, ...updates } : event
      )
    );
    return data;
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!currentUser?.id) return;
    // Supabase real-time subscription removed. Optionally, implement polling or WebSocket for real-time updates.
  }, [currentUser?.id]);

  return {
    history,
    createdEvents,
    loading,
    editEvent,
    refetchEvents: fetchEvents  // Expose fetchEvents as refetchEvents
  };
}
