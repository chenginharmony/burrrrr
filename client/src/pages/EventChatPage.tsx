import React from 'react';
import { useLocation } from 'wouter';
import { EventChat } from '@/components/EventChat';

interface EventChatPageProps {
  params: {
    eventId: string;
  };
}

export default function EventChatPage({ params }: EventChatPageProps) {
  const [, setLocation] = useLocation();
  const { eventId } = params;

  const handleBack = () => {
    setLocation('/events');
  };

  if (!eventId) {
    setLocation('/events');
    return null;
  }

  return <EventChat eventId={eventId} onBack={handleBack} />;
}