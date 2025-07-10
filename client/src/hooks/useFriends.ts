import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { User } from '@/shared/schema';

interface Friend {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  profileImageUrl: string | null;
  status?: 'online' | 'offline' | 'away' | 'sleeping';
}

export function useFriends() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: friends = [], isLoading, refetch } = useQuery<Friend[]>({
    queryKey: ['/api/users', 'friends'],
    enabled: !!user?.id,
  });

  const searchFriends = useCallback(async (query: string) => {
    if (!user?.id) return [];
    if (!query.trim()) return friends;

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search friends');
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error searching friends:', error);
      return [];
    }
  }, [user?.id, friends]);

  const filteredFriends = friends.filter(friend => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      friend.firstName?.toLowerCase().includes(query) ||
      friend.lastName?.toLowerCase().includes(query) ||
      friend.username?.toLowerCase().includes(query)
    );
  });

  return {
    friends: filteredFriends,
    allFriends: friends,
    isLoading,
    searchQuery,
    setSearchQuery,
    refetch,
    searchFriends
  };
}