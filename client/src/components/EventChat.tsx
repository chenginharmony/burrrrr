import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Smile, Loader, X, Users, Clock, Camera } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { ProfileCard } from './ProfileCard';

interface Event {
  id: string;
  title: string;
  creatorId: string;
  creator?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  participantCount: number;
  poolAmount: number;
  endTime: string;
  imageUrl?: string;
  status: string;
}

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  reactions?: { [key: string]: string[] };
  mediaType?: 'image' | 'gif';
  mediaUrl?: string;
  mentions?: Array<{
    id: string;
    username: string;
  }>;
  replyTo?: {
    id: string;
    content: string;
    senderUsername?: string;
  };
}

interface EventChatProps {
  eventId: string;
  onBack: () => void;
}

export function EventChat({ eventId, onBack }: EventChatProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [prediction, setPrediction] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<Array<{id: string, username: string}>>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch event data
  const { data: event, isLoading: loadingEvent } = useQuery<Event>({
    queryKey: ['/api/events', eventId],
    enabled: !!eventId,
    refetchInterval: 30000,
  });

  // Fetch participant count
  const { data: participantData } = useQuery<{count: number, participants: any[]}>({
    queryKey: ['/api/events', eventId, 'participants'],
    enabled: !!eventId,
    refetchInterval: 10000,
  });

  // Fetch messages
  const { data: messages = [], isLoading: loadingMessages } = useQuery<ChatMessage[]>({
    queryKey: ['/api/events', eventId, 'messages'],
    enabled: !!eventId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, mediaType, mediaUrl, mentions, replyTo }: {
      content: string;
      mediaType?: string;
      mediaUrl?: string;
      mentions?: Array<{id: string, username: string}>;
      replyTo?: {id: string, content: string, senderUsername?: string};
    }) => {
      const response = await fetch(`/api/events/${eventId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          messageType: mediaType || 'text',
          metadata: {
            mentions,
            replyTo,
            mediaUrl,
          },
        }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'messages'] });
      setMessage('');
      setReplyingTo(null);
      setShowEmojiPicker(false);
    },
  });

  // Join event mutation
  const joinEventMutation = useMutation({
    mutationFn: async ({ prediction }: { prediction: boolean }) => {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prediction }),
      });
      if (!response.ok) throw new Error('Failed to join event');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId] });
      setIsProcessing(false);
    },
  });

  // Format currency
  const formatCurrency = (amount: number, currency: string = '₦', shortenLargeNumbers: boolean = true) => {
    if (shortenLargeNumbers) {
      if (amount >= 1000000) {
        return `${currency}${(amount / 1000000).toFixed(1)}M`;
      } else if (amount >= 1000) {
        return `${currency}${(amount / 1000).toFixed(1)}K`;
      }
    }
    return `${currency}${amount.toLocaleString()}`;
  };

  // Handle mention functionality
  const handleMention = async (input: string) => {
    const mentionMatch = input.match(/@(\w*)$/);
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      if (query.length >= 1) {
        try {
          const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
          if (response.ok) {
            const users = await response.json();
            setMentionResults(users.map((u: any) => ({ id: u.id, username: u.username || u.firstName })));
            setShowMentionDropdown(true);
          }
        } catch (error) {
          console.error('Error fetching mentions:', error);
        }
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  // Insert mention
  const insertMention = (username: string) => {
    const beforeMention = message.split('@').slice(0, -1).join('@');
    setMessage(beforeMention + `@${username} `);
    setShowMentionDropdown(false);
  };

  // Handle message input changes
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);
    handleMention(newValue);
  };

  // Handle reply
  const handleReply = (msg: ChatMessage) => {
    setReplyingTo(msg);
    const inputField = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputField) {
      inputField.focus();
    }
  };

  // Handle prediction
  const handlePrediction = async (selectedPrediction: boolean) => {
    if (!user) return;

    setIsProcessing(true);
    try {
      await joinEventMutation.mutateAsync({ prediction: selectedPrediction });
      setPrediction(selectedPrediction);
    } catch (error) {
      console.error('Error handling prediction:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && user) {
      // Extract mentions from message
      const mentionRegex = /@(\w+)/g;
      const mentions = [];
      let match;
      while ((match = mentionRegex.exec(message)) !== null) {
        const username = match[1];
        const foundUser = mentionResults.find(u => u.username === username);
        if (foundUser) {
          mentions.push({ id: foundUser.id, username: foundUser.username });
        }
      }

      sendMessageMutation.mutate({
        content: message.trim(),
        mentions,
        replyTo: replyingTo ? {
          id: replyingTo.id,
          content: replyingTo.content,
          senderUsername: replyingTo.sender?.username || replyingTo.sender?.firstName
        } : undefined
      });
    }
  };

  // Update countdown
  useEffect(() => {
    if (!event?.endTime) return;

    const updateCountdown = () => {
      const endTime = new Date(event.endTime);
      const now = new Date();

      if (!isNaN(endTime.getTime())) {
        if (endTime > now) {
          const diff = endTime.getTime() - now.getTime();
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown(`${String(days).padStart(2, '0')}. ${String(hours).padStart(2, '0')}. ${String(minutes).padStart(2, '0')}. ${String(seconds).padStart(2, '0')}.`);
        } else {
          setCountdown('Event ended');
        }
      } else {
        setCountdown('Invalid end time');
      }
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, [event?.endTime]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loadingEvent || !event) {
    return (
      <div className="flex flex-col h-screen bg-white items-center justify-center">
        <Loader className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  const participantCount = participantData?.count || event.participantCount || 0;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Purple Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-white">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <img
                src={event.creator?.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.creatorId}`}
                alt="Creator"
                className="w-8 h-8 rounded-full"
              />
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm">@{event.creator?.username || 'bingogees'}</span>
                  <span className="text-yellow-400">⭐</span>
                </div>
                <span className="text-xs text-purple-200">{participantCount.toLocaleString()} Members</span>
              </div>
            </div>
          </div>
          <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
            <span className="text-sm font-semibold">₦ {formatCurrency(participantCount * 100, '', false)}</span>
          </div>
        </div>
      </div>

      {/* Prediction Banner */}
      {prediction === null && (
        <div className="bg-black text-white p-4 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={event.imageUrl || 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=200&fit=crop'}
                alt="Event"
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h3 className="font-semibold text-sm">{event.title}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => handlePrediction(true)}
                    disabled={isProcessing}
                    className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                  >
                    YES
                    <span className="bg-white bg-opacity-20 px-1 rounded text-xs">58%</span>
                  </button>
                  <button
                    onClick={() => handlePrediction(false)}
                    disabled={isProcessing}
                    className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center gap-1"
                  >
                    NO
                    <span className="bg-white bg-opacity-20 px-1 rounded text-xs">42%</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-sm text-gray-300">
            <span>Event Pool ₦ {formatCurrency(event.poolAmount || 2500, '', false)}</span>
            <span>⏱</span>
            <span>{countdown}</span>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingMessages ? (
          <div className="flex justify-center">
            <Loader className="animate-spin text-purple-500" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isCurrentUser = msg.senderId === user?.id;
            const showAvatar = index === 0 || messages[index - 1]?.senderId !== msg.senderId;

            return (
              <div key={msg.id} className="flex gap-3">
                <div className="flex-shrink-0 w-8">
                  {showAvatar && (
                    <img
                      src={msg.sender?.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderId}`}
                      alt={msg.sender?.firstName || 'User'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 max-w-xs">
                  {showAvatar && (
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={() => setSelectedProfileUserId(msg.senderId)}
                        className="font-semibold text-gray-900 text-sm hover:text-purple-600 cursor-pointer"
                      >
                        {msg.sender?.username || msg.sender?.firstName || 'User'}
                      </button>
                      {msg.senderId === event.creatorId && (
                        <span className="text-purple-600">⭐</span>
                      )}
                    </div>
                  )}
                  <div className={`inline-block p-3 rounded-2xl text-sm ${
                    isCurrentUser 
                      ? 'bg-purple-600 text-white rounded-br-md' 
                      : 'bg-yellow-100 text-gray-900 rounded-bl-md'
                  }`}>
                    <p>{msg.content}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {/* Reactions */}
                    <div className="flex items-center gap-1">
                      <button className="text-xs bg-gray-200 rounded-full px-2 py-1 flex items-center gap-1">
                        😊 12
                      </button>
                      <button className="text-xs bg-gray-200 rounded-full px-2 py-1 flex items-center gap-1">
                        🔥 12
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white p-4 border-t border-gray-200">
        {replyingTo && (
          <div className="bg-gray-100 border-l-4 border-purple-500 p-2 mb-2 rounded text-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-600">Replying to </span>
                <span className="font-medium">{replyingTo.sender?.firstName}</span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
            <div className="text-gray-700 truncate">{replyingTo.content}</div>
          </div>
        )}
        {showMentionDropdown && (
          <div className="absolute bottom-20 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
            {mentionResults.map((user) => (
              <button
                key={user.id}
                onClick={() => insertMention(user.username)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
              >
                @{user.username}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-purple-600 p-2"
          >
            <Smile size={24} />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={handleMessageChange}
              placeholder="Start a message"
              className="w-full px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
              disabled={sendMessageMutation.isPending}
            />
          </div>
          <button
            type="button"
            className="text-purple-600 p-2"
          >
            <Camera size={24} />
          </button>
          <button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-purple-600 text-white p-3 rounded-full hover:bg-purple-700 disabled:opacity-50"
          >
            {sendMessageMutation.isPending ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </form>
      </div>

      {/* Profile Card Modal */}
      {selectedProfileUserId && (
        <ProfileCard
          userId={selectedProfileUserId}
          onClose={() => setSelectedProfileUserId(null)}
        />
      )}
    </div>
  );
}