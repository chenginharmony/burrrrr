import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Header } from '@/components/Header';
import { MobileFooterNav } from '@/components/MobileFooterNav';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Copy, 
  Share, 
  Users, 
  Gift, 
  Trophy, 
  Star,
  CheckCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';

export default function ReferralPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);

  const { data: referralStats } = useQuery({
    queryKey: ['/api/referral/stats'],
    enabled: !!user?.id,
  });

  const { data: referralCode } = useQuery({
    queryKey: ['/api/referral/code'],
    enabled: !!user?.id,
  });

  const handleCopyCode = async () => {
    if (referralCode) {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (referralCode && navigator.share) {
      try {
        await navigator.share({
          title: 'Join BetChat',
          text: `Join me on BetChat - the social betting platform! Use my referral code: ${referralCode}`,
          url: window.location.origin
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#F6F7FB] flex flex-col pb-[70px]">
        <Header 
          title="Refer & Earn" 
          showBackButton={true}
          onMenuClick={() => navigate('/profile')}
        />
        <div className="flex-1 flex flex-col w-full">
          <div className="w-full max-w-xl mx-auto px-4 py-4 space-y-4">
            
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-500 to-lime-500 text-white rounded-3xl p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <Gift className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Refer Friends & Earn</h2>
              <p className="text-purple-100">
                Earn 100 points for every friend who joins with your code!
              </p>
            </div>

            {/* Referral Code Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f0f1fa]">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Your Referral Code</h3>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex-1 font-mono text-lg font-bold text-purple-600">
                  {referralCode || 'Loading...'}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              {navigator.share && (
                <button
                  onClick={handleShare}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 bg-[#CCFF00] text-black rounded-lg hover:bg-[#b3e600] transition font-medium"
                >
                  <Share className="w-4 h-4" />
                  Share with Friends
                </button>
              )}
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#f0f1fa] text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {referralStats?.totalReferrals || 0}
                </div>
                <div className="text-sm text-gray-500">Total Referrals</div>
              </div>
              
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#f0f1fa] text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {referralStats?.totalRewards || 0}
                </div>
                <div className="text-sm text-gray-500">Points Earned</div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f0f1fa]">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">How It Works</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Share Your Code</div>
                    <div className="text-sm text-gray-500">Send your referral code to friends</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Friend Joins</div>
                    <div className="text-sm text-gray-500">They sign up using your code</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Earn Rewards</div>
                    <div className="text-sm text-gray-500">Get 100 points instantly!</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral History */}
            {referralStats?.referralUsers && referralStats.referralUsers.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f0f1fa]">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Recent Referrals</h3>
                <div className="space-y-3">
                  {referralStats.referralUsers.map((user: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.firstName}&background=7440ff&color=fff&size=40`}
                          alt={user.firstName}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-green-600">
                        <Star className="w-4 h-4" />
                        <span className="font-medium">+100</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/profile')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Refer & Earn</h1>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-500 to-lime-500 text-white rounded-2xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
            <Gift className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Refer Friends & Earn Big</h2>
          <p className="text-lg text-purple-100 max-w-2xl mx-auto">
            Earn 100 points for every friend who joins with your referral code. 
            The more friends you invite, the more you earn!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Referral Code Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-[#f0f1fa]">
            <h3 className="text-xl font-semibold mb-6 text-gray-900">Your Referral Code</h3>
            <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-xl">
              <div className="flex-1 font-mono text-2xl font-bold text-purple-600">
                {referralCode || 'Loading...'}
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>
            {navigator.share && (
              <button
                onClick={handleShare}
                className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-[#CCFF00] text-black rounded-lg hover:bg-[#b3e600] transition font-medium"
              >
                <Share className="w-5 h-5" />
                Share with Friends
              </button>
            )}
          </div>

          {/* Stats Section */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f0f1fa] text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {referralStats?.totalReferrals || 0}
              </div>
              <div className="text-gray-500">Total Referrals</div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f0f1fa] text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {referralStats?.totalRewards || 0}
              </div>
              <div className="text-gray-500">Points Earned</div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#f0f1fa]">
          <h3 className="text-2xl font-semibold mb-6 text-gray-900 text-center">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold text-xl">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Share Your Code</h4>
              <p className="text-gray-500">Send your referral code to friends and family</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold text-xl">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Friend Joins</h4>
              <p className="text-gray-500">They sign up using your referral code</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold text-xl">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Earn Rewards</h4>
              <p className="text-gray-500">Get 100 points instantly in your account</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}