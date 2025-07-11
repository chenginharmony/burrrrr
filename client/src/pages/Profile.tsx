import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Header } from '@/components/Header';
import { MobileFooterNav } from '@/components/MobileFooterNav';
import { useLocation } from 'wouter';
import { 
  ChevronRight, 
  User, 
  Settings, 
  Gift, 
  Shield, 
  FileText, 
  Trash2, 
  HelpCircle,
  LogOut,
  Copy,
  Star,
  Users,
  Award
} from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();

  const menuItems = [
    {
      label: 'Profile Settings',
      path: '/settings/profile',
      icon: User,
    },
    {
      label: 'Levels & Badges',
      path: '/levels',
      icon: Award,
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
    },
    {
      label: 'Refer & Earn',
      path: '/referral',
      icon: Gift,
    },
    {
      label: 'Privacy & Security',
      path: '/privacy',
      icon: Shield,
    },
    {
      label: 'Terms of Service',
      path: '/terms',
      icon: FileText,
    },
    {
      label: 'Data Deletion Request',
      path: '/settings/data-deletion',
      icon: Trash2,
    },
    {
      label: 'Help & Support',
      path: '/help',
      icon: HelpCircle,
    },
  ];

  const handleCopyReferralCode = async () => {
    if (user?.id) {
      const referralCode = `${user.username || user.id}`;
      await navigator.clipboard.writeText(referralCode);
      // Show feedback - you might want to add a toast here
      console.log('Referral code copied!');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#F6F7FB] flex flex-col pb-[70px]">
        <div className="flex-1 flex flex-col items-center w-full">
          <div className="w-full max-w-xl mx-auto px-2 sm:px-4 py-4">
            {/* Profile Card */}
            <div className="relative bg-white rounded-3xl px-4 pt-5 pb-4 mb-4 border border-[#f0f1fa] shadow-sm">
              {/* Top section with actions */}
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={handleCopyReferralCode}
                  className="flex items-center gap-1 bg-[#F6F7FB] px-2 py-1 rounded-full text-[#7440ff] text-xs font-semibold hover:bg-[#CCFF00]/20 transition border border-[#7440ff]"
                  title="Copy Referral Code"
                  aria-label="Copy Referral Code"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{user?.username?.slice(0, 8) || 'Refer'}</span>
                </button>
              </div>

              {/* Profile info section */}
              <div className="flex flex-col items-center">
                {/* Avatar with badges */}
                <div className="relative mb-3">
                  <div className="flex justify-center">
                    <div className="relative">
                      <img
                        src={user?.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                        alt={user?.firstName || 'User'}
                        className="w-24 h-24 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`;
                        }}
                      />

                      {/* Edit profile button - positioned directly on the edge of the avatar */}
                      <button
                        type="button"
                        onClick={() => navigate('/settings/profile')}
                        className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#CCFF00] text-black shadow hover:bg-[#e6ff70] transition"
                        aria-label="Edit Profile"
                        title="Edit Profile"
                      >
                        <User className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Rank badge - smaller size */}
                  {user?.level && (
                    <div className="absolute -bottom-1 left-2">
                      <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {user.level}
                      </div>
                    </div>
                  )}
                </div>

                {/* User info */}
                <h2 className="text-xl font-bold text-gray-900 mb-0.5 tracking-tight">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-gray-500 text-sm mb-2">@{user?.username}</p>

                {/* Stats section - more compact */}
                <div className="flex items-center justify-center gap-3 w-full mb-2">
                  {/* Level badge */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                      <Award className="w-3.5 h-3.5" />
                      <span className="font-medium text-sm">{user?.level || 1}</span>
                    </div>
                    <span className="text-xs text-gray-500 mt-0.5">Level</span>
                  </div>

                  {/* Points */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                      <Star className="w-3.5 h-3.5" />
                      <span className="font-medium text-sm">{user?.availablePoints || 0}</span>
                    </div>
                    <span className="text-xs text-gray-500 mt-0.5">Points</span>
                  </div>

                  {/* Streak */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      <Users className="w-3.5 h-3.5" />
                      <span className="font-medium text-sm">{user?.loginStreak || 0}</span>
                    </div>
                    <span className="text-xs text-gray-500 mt-0.5">Streak</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="bg-white rounded-2xl shadow divide-y divide-gray-100 mb-6 overflow-hidden border border-[#f0f1fa]">
              {menuItems.map((item, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center justify-between px-4 py-3 text-gray-900 hover:bg-[#F6F7FB] transition text-sm font-medium"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-gray-500" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 bg-white text-red-500 rounded-2xl font-semibold shadow hover:bg-red-50 transition mb-4 border border-[#f0f1fa] text-sm flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
        <MobileFooterNav />
      </div>
    );
  }

  // Desktop version
  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-purple-500 to-lime-500 text-white rounded-2xl p-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={user?.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                alt={user?.firstName || 'User'}
                className="w-24 h-24 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`;
                }}
              />
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-purple-600 rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                {user?.level || 1}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{user?.firstName} {user?.lastName}</h1>
              <p className="text-purple-100 text-lg">@{user?.username}</p>
              <div className="flex items-center gap-6 mt-3">
                <span className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  {user?.availablePoints || 0} Points
                </span>
                <span className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Level {user?.level || 1}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {user?.loginStreak || 0} Day Streak
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-2xl shadow divide-y divide-gray-100 overflow-hidden border border-[#f0f1fa]">
          {menuItems.map((item, index) => (
            <button
              type="button"
              key={index}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center justify-between px-6 py-4 text-gray-900 hover:bg-[#F6F7FB] transition font-medium"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-gray-500" />
                <span>{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-4 bg-white text-red-500 rounded-2xl font-semibold shadow hover:bg-red-50 transition border border-[#f0f1fa] flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}