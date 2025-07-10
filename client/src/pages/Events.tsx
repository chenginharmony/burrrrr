import React, { useState } from 'react';
import { useEvent } from '@/hooks/useEvent';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Header } from '@/components/Header';
import { MobileFooterNav } from '@/components/MobileFooterNav';
import { EventCard } from '@/components/EventCard';
import { ChatRoom } from '@/components/ChatRoom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, MessageSquare, Calendar, Clock, Users } from 'lucide-react';
import CreateEventForm from '@/components/CreateEventForm';

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  wagerAmount: z.number().min(0),
  maxParticipants: z.number().min(1).max(1000),
  bannerUrl: z.string().url().optional().or(z.literal('')),
  isPrivate: z.boolean().default(false),
  rules: z.string().optional(),
  type: z.enum(['public', 'private']).default('public'),
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

export default function Events() {
  const { events, createEvent, joinEvent, isCreating, isJoining, searchEvents } = useEvent();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const form = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      startTime: '',
      endTime: '',
      wagerAmount: 0,
      maxParticipants: 100,
      bannerUrl: '',
      isPrivate: false,
      rules: '',
      type: 'public',
    },
  });

  const categories = [
    { id: 'all', name: 'All', icon: 'fas fa-th' },
    { id: 'crypto', name: 'Crypto', icon: 'fab fa-bitcoin' },
    { id: 'sports', name: 'Sports', icon: 'fas fa-football-ball' },
    { id: 'gaming', name: 'Gaming', icon: 'fas fa-gamepad' },
    { id: 'music', name: 'Music', icon: 'fas fa-music' },
    { id: 'politics', name: 'Politics', icon: 'fas fa-landmark' },
  ];

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const liveEvents = filteredEvents.filter(event => event.status === 'active');
  const upcomingEvents = filteredEvents.filter(event => event.status !== 'active');

  const handleCreateEvent = async (data: CreateEventFormData) => {
    try {
      await createEvent({
        ...data,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
      });
      setIsCreateDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header title="Events" />
        <div className="pb-20 p-4 space-y-4">
          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="whitespace-nowrap"
                >
                  <i className={`${category.icon} mr-2`} />
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Create Event Button */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CreateEventForm 
                onClose={() => setIsCreateDialogOpen(false)}
                eventType="public"
              />
            </DialogContent>
          </Dialog>

          {/* Live Events */}
          {liveEvents.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Events</h3>
              {liveEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onJoin={joinEvent}
                  isJoining={isJoining}
                />
              ))}
            </div>
          )}

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Events</h3>
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onJoin={joinEvent}
                  isJoining={isJoining}
                />
              ))}
            </div>
          )}

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No events found</p>
            </div>
          )}
        </div>

        <MobileFooterNav />
      </div>
    );
  }

  return (
    <div className="flex-1 flex">
      {/* Events List */}
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <i className={category.icon} />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <CreateEventForm 
                onClose={() => setIsCreateDialogOpen(false)}
                eventType="public"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Live Events */}
        {liveEvents.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Badge className="bg-green-500">LIVE</Badge>
              Live Events
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {liveEvents.map((event) => (
                <div key={event.id} className="relative">
                  <EventCard
                    event={event}
                    onJoin={joinEvent}
                    isJoining={isJoining}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90"
                    onClick={() => setSelectedEvent(event.id)}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Events
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onJoin={joinEvent}
                  isJoining={isJoining}
                />
              ))}
            </div>
          </div>
        )}

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No events found</p>
          </div>
        )}
      </div>

      {/* Event Chat */}
      {selectedEvent && (
        <div className="w-96 border-l border-gray-200 dark:border-gray-700">
          <ChatRoom
            roomId={selectedEvent}
            roomType="event"
            title={events.find(e => e.id === selectedEvent)?.title || 'Event'}
          />
        </div>
      )}
    </div>
  );
}
