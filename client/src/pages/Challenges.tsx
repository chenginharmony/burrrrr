import React, { useState } from 'react';
import { useChallenge } from '@/hooks/useChallenge';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Header } from '@/components/Header';
import { ChallengeCard } from '@/components/ChallengeCard';
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
import { Plus, MessageSquare, Gamepad2, Shield, Clock, Users } from 'lucide-react';

const createChallengeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required'),
  challengedId: z.string().min(1, 'Challenged user is required'),
  wagerAmount: z.number().min(1, 'Wager amount must be at least 1'),
  category: z.string().min(1, 'Category is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  rules: z.string().optional(),
});

type CreateChallengeFormData = z.infer<typeof createChallengeSchema>;

export default function Challenges() {
  const { challenges, createChallenge, acceptChallenge, declineChallenge, isCreating, isAccepting, isDeclining } = useChallenge();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'active' | 'completed'>('all');

  const form = useForm<CreateChallengeFormData>({
    resolver: zodResolver(createChallengeSchema),
    defaultValues: {
      title: '',
      description: '',
      challengedId: '',
      wagerAmount: 0,
      category: '',
      dueDate: '',
      rules: '',
    },
  });

  const filteredChallenges = challenges.filter(challenge => {
    if (selectedTab === 'all') return true;
    return challenge.status === selectedTab;
  });

  const pendingChallenges = challenges.filter(c => c.status === 'pending');
  const activeChallenges = challenges.filter(c => c.status === 'active' || c.status === 'escrow');
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  const handleCreateChallenge = async (data: CreateChallengeFormData) => {
    try {
      await createChallenge({
        ...data,
        dueDate: new Date(data.dueDate),
      });
      setIsCreateDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error creating challenge:', error);
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header title="Challenges" />
        <div className="pb-20 p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{pendingChallenges.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{activeChallenges.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{completedChallenges.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
              </CardContent>
            </Card>
          </div>

          {/* Create Challenge Button */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Challenge</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateChallenge)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="challengedId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Challenge User ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter user ID" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="wagerAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wager (₦)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="fitness">Fitness</SelectItem>
                              <SelectItem value="trading">Trading</SelectItem>
                              <SelectItem value="gaming">Gaming</SelectItem>
                              <SelectItem value="sports">Sports</SelectItem>
                              <SelectItem value="education">Education</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Challenge'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'active', label: 'Active' },
              { key: 'completed', label: 'Completed' },
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={selectedTab === tab.key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTab(tab.key as any)}
                className="whitespace-nowrap"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Challenges List */}
          <div className="space-y-3">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                currentUserId={user?.id}
                onAccept={acceptChallenge}
                onDecline={declineChallenge}
                isAccepting={isAccepting}
                isDeclining={isDeclining}
              />
            ))}
            {filteredChallenges.length === 0 && (
              <div className="text-center py-12">
                <Gamepad2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No challenges found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex">
      {/* Challenges List */}
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{pendingChallenges.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{activeChallenges.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{completedChallenges.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Challenge</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateChallenge)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="challengedId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Challenge User ID</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter user ID" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="wagerAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wager Amount (₦)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="fitness">Fitness</SelectItem>
                              <SelectItem value="trading">Trading</SelectItem>
                              <SelectItem value="gaming">Gaming</SelectItem>
                              <SelectItem value="sports">Sports</SelectItem>
                              <SelectItem value="education">Education</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="rules"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rules (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create Challenge'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All Challenges' },
            { key: 'pending', label: 'Pending' },
            { key: 'active', label: 'Active' },
            { key: 'completed', label: 'Completed' },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={selectedTab === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTab(tab.key as any)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredChallenges.map((challenge) => (
            <div key={challenge.id} className="relative">
              <ChallengeCard
                challenge={challenge}
                currentUserId={user?.id}
                onAccept={acceptChallenge}
                onDecline={declineChallenge}
                isAccepting={isAccepting}
                isDeclining={isDeclining}
              />
              {(challenge.status === 'active' || challenge.status === 'escrow') && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90"
                  onClick={() => setSelectedChallenge(challenge.id)}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <Gamepad2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No challenges found</p>
          </div>
        )}
      </div>

      {/* Challenge Chat */}
      {selectedChallenge && (
        <div className="w-96 border-l border-gray-200 dark:border-gray-700">
          <ChatRoom
            roomId={selectedChallenge}
            roomType="challenge"
            title={challenges.find(c => c.id === selectedChallenge)?.title || 'Challenge'}
          />
        </div>
      )}
    </div>
  );
}
