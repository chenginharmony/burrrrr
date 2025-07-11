import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Smile, Loader, X, Users, Clock } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { ProfileCard } from './ProfileCard';

interface Event {
  id: string;
  title: string;
  creatorId: string;
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

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop';

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
  const [bannerOpen, setBannerOpen] = useState(true);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch event data
  const { data: event, isLoading: loadingEvent } = useQuery<Event>({
    queryKey: ['/api/events', eventId],
    enabled: !!eventId,
    refetchInterval: 30000, // Refetch every 30 seconds to keep participant count accurate
  });

  // Fetch participant count
  const { data: participantData } = useQuery<{count: number, participants: any[]}>({
    queryKey: ['/api/events', eventId, 'participants'],
    enabled: !!eventId,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
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

  // Update countdown
  useEffect(() => {
    if (!event?.endTime) return;

    const updateCountdown = () => {
      const endTime = new Date(event.endTime);
      const now = new Date();

      if (!isNaN(endTime.getTime())) {
        if (endTime > now) {
          const diff = endTime.getTime() - now.getTime();
          const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
          const minutes = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
          const seconds = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
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

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        {/* Top Bar */}
        <div className="bg-gray-50 border-b border-gray-200 p-3 flex items-center shadow-sm">
          <button onClick={onBack} className="mr-4 text-gray-600 hover:text-purple-700">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center flex-1 min-w-0 gap-3">
            <div className="overflow-hidden rounded-full h-8 w-8 border border-gray-300 flex-shrink-0">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${event.creatorId}`}
                alt="Creator"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-sm">{event.title}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Users size={12} />
                  <span>{participantData?.count || event.participantCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{countdown}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Banner */}
        {bannerOpen && prediction === null && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 relative">
            <button
              onClick={() => setBannerOpen(false)}
              className="absolute top-2 right-2 text-white/80 hover:text-white"
            >
              <X size={16} />
            </button>
            <div className="text-center">
              <h4 className="font-semibold mb-2">Make Your Prediction</h4>
              <p className="text-sm text-white/90 mb-4">
                Pool: {formatCurrency(event.poolAmount || 0)}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => handlePrediction(true)}
                  disabled={isProcessing}
                  className="bg-green-500 text-white px-6 py-2 rounded-full font-medium hover:bg-green-600 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Yes'}
                </button>
                <button
                  onClick={() => handlePrediction(false)}
                  disabled={isProcessing}
                  className="bg-red-500 text-white px-6 py-2 rounded-full font-medium hover:bg-red-600 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'No'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div className="flex-shrink-0">
                <img
                  src={msg.sender?.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderId}`}
                  alt={msg.sender?.firstName || 'User'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => setSelectedProfileUserId(msg.senderId)}
                    className="font-medium text-gray-900 text-sm hover:text-purple-600 cursor-pointer"
                  >
                    {msg.sender?.firstName} {msg.sender?.lastName}
                  </button>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                {msg.replyTo && (
                  <div className="bg-gray-100 border-l-4 border-purple-500 p-2 mb-2 rounded text-sm">
                    <div className="text-gray-600">
                      Replying to <span className="font-medium">{msg.replyTo.senderUsername}</span>
                    </div>
                    <div className="text-gray-700 truncate">{msg.replyTo.content}</div>
                  </div>
                )}
                <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-900">
                  {msg.mediaType === 'gif' && msg.mediaUrl ? (
                    <img src={msg.mediaUrl} alt="GIF" className="rounded max-w-xs" />
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleReply(msg)}
                    className="text-xs text-gray-500 hover:text-purple-600"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
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

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={handleMessageChange}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={sendMessageMutation.isPending}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-purple-600"
          >
            <Smile size={20} />
          </button>
          <button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 disabled:opacity-50"
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