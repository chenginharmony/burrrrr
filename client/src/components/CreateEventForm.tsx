
import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { useEvent } from '@/hooks/useEvent';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';

interface CreateEventFormProps {
  onClose: () => void;
  eventType: 'public' | 'private';
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({
  onClose,
  eventType,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('sports');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [wagerAmount, setWagerAmount] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('2');
  const [isCustomParticipants, setIsCustomParticipants] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [rules, setRules] = useState('');

  // Loading Modal Component
  const LoadingModal = () => {
    if (!loading) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center space-y-4 shadow-xl">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">Creating Event, please wait...</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">This will only take a moment</p>
        </div>
      </div>
    );
  };

  const { createEvent } = useEvent();
  const { toast } = useToast();

  const categories = [
    {
      id: 'crypto',
      label: 'Crypto',
      icon: '₿',
    },
    {
      id: 'sports',
      label: 'Sports',
      icon: '⚽️',
    },
    {
      id: 'gaming',
      label: 'Gaming',
      icon: '🎮',
    },
    {
      id: 'music',
      label: 'Music',
      icon: '🎵',
    },
    {
      id: 'politics',
      label: 'Politics',
      icon: '🗳️',
    },
    {
      id: 'entertainment',
      label: 'Entertainment',
      icon: '🎬',
    },
    {
      id: 'other',
      label: 'Other',
      icon: '📌',
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please upload a JPG, PNG, or GIF file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    setBannerFile(file);
    createPreview(file);
  };

  const createPreview = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to create an event",
        variant: "destructive",
      });
      return;
    }
    if (!acceptedTerms) {
      toast({
        title: "Error",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (startDate <= new Date()) {
      toast({
        title: "Error",
        description: "Start time must be in the future",
        variant: "destructive",
      });
      return;
    }

    if (endDate <= startDate) {
      toast({
        title: "Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    const amount = parseInt(wagerAmount);
    if (!amount || amount < 100) {
      toast({
        title: "Error",
        description: "Minimum bet amount is ₦100",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      let bannerUrl = '';
      if (bannerFile) {
        // In a real app, you'd upload to your storage service
        // For now, we'll use a placeholder or base64
        bannerUrl = previewUrl;
      }

      await createEvent({
        title,
        description,
        category,
        startTime: startDate,
        endTime: endDate,
        wagerAmount: amount,
        maxParticipants: parseInt(maxParticipants),
        bannerUrl,
        isPrivate: eventType === 'private',
        rules: rules.trim(),
        type: eventType
      });

      toast({
        title: "Success",
        description: "Event created successfully",
      });
      onClose();
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to create event. Please try again.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate minimum end time based on start time
  const minEndTime = startTime
    ? new Date(new Date(startTime).getTime() + 15 * 60000)
        .toISOString()
        .slice(0, 16)
    : '';

  const participantOptions = [2, 4, 8, 16, 32, 64, 'custom'];

  const handleParticipantChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomParticipants(true);
      setMaxParticipants('');
    } else {
      setIsCustomParticipants(false);
      setMaxParticipants(value);
    }
  };

  return (
    <>
      <LoadingModal />
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Two Column Layout for Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title & Category Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Time & Participants Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Time
                </label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Time
                </label>
                <Input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={minEndTime}
                  required
                />
              </div>
            </div>
          </div>

          {/* Description & Rules */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe your event..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rules
              </label>
              <Textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={3}
                placeholder="Enter event rules..."
                required
              />
            </div>
          </div>

          {/* Wager & Participants Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Wager Amount (₦)
              </label>
              <Input
                type="number"
                value={wagerAmount}
                onChange={(e) => setWagerAmount(e.target.value)}
                min="100"
                placeholder="Minimum: ₦100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Participants
              </label>
              <div className="space-y-2">
                {isCustomParticipants ? (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(e.target.value)}
                      min="2"
                      max="1000"
                      placeholder="Enter number (2-1000)"
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCustomParticipants(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Select value={maxParticipants} onValueChange={handleParticipantChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {participantOptions.map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num === 'custom' ? 'Custom number' : `${num} participants`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          {/* Banner Upload */}
          <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Banner Image (Optional)
            </label>
            <div className="flex items-center justify-center">
              {previewUrl ? (
                <div className="relative w-full">
                  <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setBannerFile(null);
                      setPreviewUrl('');
                    }}
                    className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="w-full">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                    id="banner-upload"
                  />
                  <label
                    htmlFor="banner-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-200 dark:border-gray-700 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="mt-2 text-sm text-gray-500">Click to upload banner</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Terms & Action Buttons */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={setAcceptedTerms}
                required
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I accept the terms and conditions
              </label>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={loading || !acceptedTerms}
                className="flex-1 gradient-primary"
              >
                {loading ? 'Creating Event...' : 'Create Event'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
    </>
  );
};

export default CreateEventForm;
