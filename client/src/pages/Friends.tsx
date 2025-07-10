import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Header } from '@/components/Header';
import { MobileFooterNav } from '@/components/MobileFooterNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, UserPlus, Search, MessageSquare, Gamepad2 } from 'lucide-react';

interface Friend {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl: string;
  level: number;
  xp: number;
  availablePoints: string;
  loginStreak: number;
}

export default function Friends() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [friendRequestId, setFriendRequestId] = useState('');
  const [isAddFriendDialogOpen, setIsAddFriendDialogOpen] = useState(false);

  const { data: friends = [], isLoading } = useQuery<Friend[]>({
    queryKey: ['/api/friends'],
    enabled: !!user,
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const response = await apiRequest('POST', '/api/friends/request', {
        friendId,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request sent successfully",
      });
      setFriendRequestId('');
      setIsAddFriendDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    },
  });

  const acceptFriendRequestMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const response = await apiRequest('POST', '/api/friends/accept', {
        friendId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      toast({
        title: "Success",
        description: "Friend request accepted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive",
      });
    },
  });

  const filteredFriends = friends.filter(friend =>
    friend.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendFriendRequest = () => {
    if (friendRequestId.trim()) {
      sendFriendRequestMutation.mutate(friendRequestId.trim());
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header title="Friends" />
        <div className="pb-20 p-4 space-y-4">
          {/* Stats */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{friends.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Friends</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">--</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Online</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">--</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Requests</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Add Friend Button */}
          <Dialog open={isAddFriendDialogOpen} onOpenChange={setIsAddFriendDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full gradient-primary">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Friend
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-md">
              <DialogHeader>
                <DialogTitle>Add Friend</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter friend's user ID"
                  value={friendRequestId}
                  onChange={(e) => setFriendRequestId(e.target.value)}
                />
                <Button
                  onClick={handleSendFriendRequest}
                  disabled={!friendRequestId.trim() || sendFriendRequestMutation.isPending}
                  className="w-full"
                >
                  {sendFriendRequestMutation.isPending ? 'Sending...' : 'Send Friend Request'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Friends List */}
          <div className="space-y-3">
            {filteredFriends.map((friend) => (
              <Card key={friend.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={friend.profileImageUrl} alt={friend.firstName} />
                        <AvatarFallback>
                          {friend.firstName?.[0]}{friend.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-lime-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {friend.level}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {friend.firstName} {friend.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Level {friend.level} • {friend.xp} XP
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        ₦{parseFloat(friend.availablePoints || '0').toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Gamepad2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredFriends.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No friends found' : 'No friends yet'}
                </p>
              </div>
            )}
          </div>
        </div>
        <MobileFooterNav />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{friends.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Friends</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">--</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Online</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">--</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Requests</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Dialog open={isAddFriendDialogOpen} onOpenChange={setIsAddFriendDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Friend
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Friend</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter friend's user ID"
                  value={friendRequestId}
                  onChange={(e) => setFriendRequestId(e.target.value)}
                />
                <Button
                  onClick={handleSendFriendRequest}
                  disabled={!friendRequestId.trim() || sendFriendRequestMutation.isPending}
                  className="w-full"
                >
                  {sendFriendRequestMutation.isPending ? 'Sending...' : 'Send Friend Request'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Friends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFriends.map((friend) => (
          <Card key={friend.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={friend.profileImageUrl} alt={friend.firstName} />
                    <AvatarFallback className="text-lg">
                      {friend.firstName?.[0]}{friend.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-purple-500 to-lime-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {friend.level}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {friend.firstName} {friend.lastName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Level {friend.level} • {friend.xp} XP
                  </p>
                  <Badge variant="secondary" className="mt-1">
                    {friend.loginStreak || 0} day streak
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Balance</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ₦{parseFloat(friend.availablePoints || '0').toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Gamepad2 className="h-4 w-4 mr-2" />
                    Challenge
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFriends.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No friends found matching your search' : 'No friends yet. Start by adding some friends!'}
          </p>
        </div>
      )}
    </div>
  );
}