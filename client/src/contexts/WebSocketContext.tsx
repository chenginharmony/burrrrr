import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  joinEventRoom: (eventId: string) => void;
  leaveEventRoom: () => void;
  joinChallengeRoom: (challengeId: string) => void;
  leaveChallengeRoom: () => void;
  eventNotification: any;
  setEventNotification: (notification: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [eventNotification, setEventNotification] = useState<any>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
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
  }, [isAuthenticated, user]);

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
      setEventNotification
    }}>
      {children}
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
