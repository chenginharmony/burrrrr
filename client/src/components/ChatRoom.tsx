import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  userId: string;
  message: string;
  messageType: string;
  metadata: any;
  createdAt: string;
}

interface ChatRoomProps {
  roomId: string;
  roomType: 'event' | 'challenge';
  title: string;
}

export function ChatRoom({ roomId, roomType, title }: ChatRoomProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { socket, joinEventRoom, joinChallengeRoom, leaveEventRoom, leaveChallengeRoom } = useWebSocket();
  const queryClient = useQueryClient();

  const endpoint = roomType === 'event' ? `/api/events/${roomId}/messages` : `/api/challenges/${roomId}/messages`;

  const { data: initialMessages = [] } = useQuery<Message[]>({
    queryKey: [endpoint],
    enabled: !!roomId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await apiRequest('POST', endpoint, {
        message: messageText,
        messageType: 'text',
      });
      return response.json();
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
  });

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (socket && roomId) {
      if (roomType === 'event') {
        joinEventRoom(roomId);
      } else {
        joinChallengeRoom(roomId);
      }

      const handleMessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message') {
          setMessages(prev => [data.data, ...prev]);
        }
      };

      socket.addEventListener('message', handleMessage);

      return () => {
        socket.removeEventListener('message', handleMessage);
        if (roomType === 'event') {
          leaveEventRoom();
        } else {
          leaveChallengeRoom();
        }
      };
    }
  }, [socket, roomId, roomType, joinEventRoom, joinChallengeRoom, leaveEventRoom, leaveChallengeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-3">
        <CardTitle className="text-lg">{title} Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        <div className="flex-1 overflow-y-auto mb-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.userId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                  msg.userId === user?.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {msg.userId !== user?.id && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    User {msg.userId.slice(0, 8)}
                  </p>
                )}
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs opacity-70 mt-1">
                  {formatTimestamp(msg.createdAt)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!message.trim() || sendMessageMutation.isPending}
            size="icon"
          >
            <Send size={16} />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
