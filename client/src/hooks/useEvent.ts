import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Event {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  wagerAmount: string;
  isPrivate: boolean;
  rules: string;
  status: string;
  type: string;
  creatorId: string;
  creatorUsername?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateEventData {
  title: string;
  description: string;
  category: string;
  startTime: Date;
  endTime: Date;
  wagerAmount: number;
  maxParticipants: number;
  bannerUrl: string;
  isPrivate: boolean;
  rules: string;
  type: 'public' | 'private';
}

export function useEvent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
    enabled: !!user,
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: CreateEventData) => {
      const response = await apiRequest('POST', '/api/events', {
        ...eventData,
        startTime: eventData.startTime.toISOString(),
        endTime: eventData.endTime.toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Success",
        description: "Event created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const joinEventMutation = useMutation({
    mutationFn: async ({ eventId, prediction, wagerAmount }: { eventId: string; prediction: boolean; wagerAmount?: number }) => {
      const response = await apiRequest('POST', `/api/events/${eventId}/join`, {
        prediction,
        wagerAmount,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Success",
        description: "Successfully joined event",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to join event",
        variant: "destructive",
      });
    },
  });

  const searchEvents = useCallback(async (searchQuery: string) => {
    try {
      const response = await fetch(`/api/events?search=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching events:', error);
      return [];
    }
  }, []);

  return {
    events,
    loading: isLoading,
    createEvent: createEventMutation.mutate,
    joinEvent: joinEventMutation.mutate,
    searchEvents,
    isCreating: createEventMutation.isPending,
    isJoining: joinEventMutation.isPending,
  };
}