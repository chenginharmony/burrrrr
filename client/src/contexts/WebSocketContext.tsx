import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '../supabaseClient';
import { MatchNotification } from '@/components/ui/match-notification';

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  joinEventRoom: (eventId: string) => void;
  leaveEventRoom: () => void;
  joinChallengeRoom: (challengeId: string) => void;
  leaveChallengeRoom: () => void;
  eventNotification: any;
  setEventNotification: (notification: any) => void;
  matchNotification: any;
  setMatchNotification: (notification: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [eventNotification, setEventNotification] = useState<any>(null);
  const [matchNotification, setMatchNotification] = useState<any>(null);
  const { user, session, isAuthenticated } = useAuth(); // Use session from useAuth

  useEffect(() => {
    if (!isAuthenticated || !user || !session) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    const port = window.location.port || (window.location.protocol === "https:" ? "443" : "80");
    
    // Construct the WebSocket URL with the token
    const wsUrl = `${protocol}//${host}:${port}/ws?token=${session.access_token}`;
    
    console.log('Connecting to WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'new_event_notification') {
          setEventNotification(data.data);
        } else if (data.type === 'bet_placed') {
          setMatchNotification({
            type: 'bet_placed',
            title: 'Bet Placed',
            content: 'You are currently being matched, please wait...',
            metadata: data.data
          });
        } else if (data.type === 'match_found') {
          setMatchNotification({
            type: 'match_found',
            title: 'Match Found!',
            content: `You have been matched with @${data.data.user2?.username || 'opponent'}, Good luck!`,
            metadata: {
              eventId: data.data.eventId,
              opponentId: data.data.user2?.id,
              opponentUsername: data.data.user2?.username,
              wagerAmount: data.data.user1?.prediction === true ? data.data.user1Amount : data.data.user2Amount
            }
          });
        } else if (data.type === 'event_ended') {
          setMatchNotification({
            type: 'event_ended',
            title: data.data.isWin ? 'Congratulations!' : 'Event Ended',
            content: data.data.isWin 
              ? `Congrats, the event "${data.data.eventTitle}" has ended, check your wallet for your win!`
              : `The event "${data.data.eventTitle}" has ended. Better luck next time!`,
            metadata: data.data
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [isAuthenticated, user, session]);

  const joinEventRoom = (eventId: string) => {
    if (socket && isConnected && user) {
      socket.send(JSON.stringify({
        type: 'join_event',
        eventId,
        userId: user.id
      }));
    }
  };

  const leaveEventRoom = () => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({
        type: 'leave_event'
      }));
    }
  };

  const joinChallengeRoom = (challengeId: string) => {
    if (socket && isConnected && user) {
      socket.send(JSON.stringify({
        type: 'join_challenge',
        challengeId,
        userId: user.id
      }));
    }
  };

  const leaveChallengeRoom = () => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({
        type: 'leave_challenge'
      }));
    }
  };

  return (
    <WebSocketContext.Provider value={{
      socket,
      isConnected,
      joinEventRoom,
      leaveEventRoom,
      joinChallengeRoom,
      leaveChallengeRoom,
      eventNotification,
      setEventNotification,
      matchNotification,
      setMatchNotification
    }}>
      {children}
      <MatchNotification 
        notification={matchNotification} 
        onClose={() => setMatchNotification(null)} 
      />
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}