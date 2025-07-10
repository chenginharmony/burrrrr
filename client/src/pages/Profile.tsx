
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { MobileFooterNav } from '@/components/MobileFooterNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Trophy, 
  Star,
  Edit2,
  Save,
  X,
  Settings,
  LogOut
} from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    phone: user?.phone || ''
  });

  const handleSave = async () => {
    try {
      // Here you would make an API call to update the user profile
      // await updateProfile(formData);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header title="Profile" showBackButton />
        
        <div className="pb-24 p-4 space-y-6">
          {/* Profile Header */}
          <Card className="bg-gradient-to-r from-purple-500 to-lime-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user?.profileImageUrl} />
                    <AvatarFallback className="bg-white/20 text-white text-2xl">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white text-purple-600 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                    {user?.level || 1}
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h2>
                  <p className="text-purple-100">Level {user?.level || 1} • {user?.xp || 0} XP</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      {user?.totalWins || 0} Wins
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {user?.loginStreak || 0} Day Streak
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                />
              </div>

              {isEditing && (
                <Button onClick={handleSave} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Account Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Account Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">₦{parseFloat(user?.availablePoints || '0').toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Available Balance</div>
                </div>
                <div className="p-4 bg-lime-50 rounded-lg">
                  <div className="text-2xl font-bold text-lime-600">₦{parseFloat(user?.totalPoints || '0').toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Earned</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{user?.totalWins || 0}</div>
                  <div className="text-sm text-gray-600">Total Wins</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{user?.loginStreak || 0}</div>
                  <div className="text-sm text-gray-600">Login Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </Button>
              <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>

        <MobileFooterNav />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Desktop Profile Content */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="bg-gradient-to-r from-purple-500 to-lime-500 text-white border-0">
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user?.profileImageUrl} />
                  <AvatarFallback className="bg-white/20 text-white text-3xl">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-purple-600 rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                  {user?.level || 1}
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">{user?.firstName} {user?.lastName}</h1>
                <p className="text-purple-100 text-lg">Level {user?.level || 1} • {user?.xp || 0} XP</p>
                <div className="flex items-center gap-6 mt-3">
                  <span className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    {user?.totalWins || 0} Wins
                  </span>
                  <span className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    {user?.loginStreak || 0} Day Streak
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit2 className="w-4 h-4 mr-2" />}
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    disabled={!isEditing}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {isEditing && (
                  <Button onClick={handleSave} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Account Stats & Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">₦{parseFloat(user?.availablePoints || '0').toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Available Balance</div>
                </div>
                <div className="p-4 bg-lime-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-lime-600">₦{parseFloat(user?.totalPoints || '0').toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Earned</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{user?.totalWins || 0}</div>
                  <div className="text-sm text-gray-600">Total Wins</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{user?.loginStreak || 0}</div>
                  <div className="text-sm text-gray-600">Login Streak</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </Button>
                <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
