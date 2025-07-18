import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/ui/mobile-nav";
import { AchievementNotification } from "@/components/ui/achievement-notification";
import { EventNotification } from "@/components/ui/event-notification";
import { MatchNotification } from "@/components/ui/match-notification";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import SignInModal from "./components/SignInModal";
import "./components/SignInModal.css";
import { AuthProvider } from './contexts/AuthContext';

// Pages
import ProfileSettings from "@/pages/ProfileSettings";
import LevelsBadges from "@/pages/LevelsBadges";
import Settings from "@/pages/Settings";
import PrivacySecurity from "@/pages/PrivacySecurity";
import TermsOfService from "@/pages/TermsOfService";
import DataDeletionRequest from "@/pages/DataDeletionRequest";
import HelpSupport from "@/pages/HelpSupport";

// ...existing code...

// Add these routes inside the <Switch> in both desktop and mobile layouts:
// Desktop:
// <Switch>
//   ...existing routes...
//   <Route path="/profile-settings" component={ProfileSettings} />
//   <Route path="/levels-badges" component={LevelsBadges} />
//   <Route path="/settings" component={Settings} />
//   <Route path="/privacy-security" component={PrivacySecurity} />
//   <Route path="/terms-of-service" component={TermsOfService} />
//   <Route path="/data-deletion" component={DataDeletionRequest} />
//   <Route path="/help-support" component={HelpSupport} />
// </Switch>

// Mobile:
// <Switch>
//   ...existing routes...
//   <Route path="/profile-settings" component={ProfileSettings} />
//   <Route path="/levels-badges" component={LevelsBadges} />
//   <Route path="/settings" component={Settings} />
//   <Route path="/privacy-security" component={PrivacySecurity} />
//   <Route path="/terms-of-service" component={TermsOfService} />
//   <Route path="/data-deletion" component={DataDeletionRequest} />
//   <Route path="/help-support" component={HelpSupport} />
// </Switch>
import Home from "@/pages/Home";
import Events from "@/pages/Events";
import Challenges from "@/pages/Challenges";
import Friends from "@/pages/Friends";
import Wallet from "@/pages/Wallet";
import Leaderboard from "@/pages/Leaderboard";
import NotFound from "@/pages/not-found";
import Notifications from "@/pages/Notifications";
import Profile from "@/pages/Profile";
import ReferralPage from "@/pages/ReferralPage";
import EventChatPage from "@/pages/EventChatPage";
import WalletPage from "@/pages/WalletPage";
import History from "@/pages/History";



function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { eventNotification, setEventNotification, matchNotification, setMatchNotification } = useWebSocket();
  const [achievement, setAchievement] = useState<{
    title: string;
    description: string;
    icon: string;
    color: string;
  } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-lime-500 bg-clip-text text-transparent">
            Welcome to BetChat
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Please sign in to continue
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-lime-500 text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Sign In
          </button>
          <SignInModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Switch>
            <Route path="/" component={() => <><Header title="Events" /><Events /></>} />
            <Route path="/home" component={() => <><Header title="Dashboard" showStreak /><Home /></>} />
            <Route path="/history" component={History} />
            <Route path="/events/:eventId/chat" component={EventChatPage} />
            <Route path="/challenges" component={() => <><Header title="Challenges" /><Challenges /></>} />
            <Route path="/friends" component={() => <><Header title="Friends" /><Friends /></>} />
            <Route path="/wallet" component={() => <><Header title="Wallet" /><Wallet /></>} />
            <Route path="/leaderboard" component={() => <><Header title="Leaderboard" /><Leaderboard /></>} />
            <Route path="/notifications" component={() => <><Header title="Notifications" /><Notifications /></>} />
            <Route path="/profile" component={() => <><Header title="Profile" /><Profile /></>} />
            <Route path="/referral" component={() => <><Header title="Refer & Earn" /><ReferralPage /></>} />
            <Route path="/profile-settings" component={() => <><Header title="Profile Settings" /><ProfileSettings /></>} />
            <Route path="/levels-badges" component={() => <><Header title="Levels & Badges" /><LevelsBadges /></>} />
            <Route path="/settings" component={() => <><Header title="Settings" /><Settings /></>} />
            <Route path="/privacy-security" component={() => <><Header title="Privacy & Security" /><PrivacySecurity /></>} />
            <Route path="/terms-of-service" component={() => <><Header title="Terms of Service" /><TermsOfService /></>} />
            <Route path="/data-deletion" component={() => <><Header title="Data Deletion" /><DataDeletionRequest /></>} />
            <Route path="/help-support" component={() => <><Header title="Help & Support" /><HelpSupport /></>} />
            <Route component={() => <><Header title="404" /><NotFound /></>} />
          </Switch>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col h-full w-full">
        <Switch>
          <Route path="/" component={() => <><Header title="Events" /><Events /></>} />
          <Route path="/home" component={() => <><Header title="Dashboard" showStreak /><Home /></>} />
          <Route path="/history" component={History} />
          <Route path="/events/:eventId/chat" component={EventChatPage} />
          <Route path="/challenges" component={() => <><Header title="Challenges" /><Challenges /></>} />
          <Route path="/friends" component={() => <><Header title="Friends" /><Friends /></>} />
          <Route path="/wallet" component={() => <><Header title="Wallet" /><Wallet /></>} />
          <Route path="/leaderboard" component={() => <><Header title="Leaderboard" /><Leaderboard /></>} />
          <Route path="/notifications" component={() => <><Header title="Notifications" /><Notifications /></>} />
          <Route path="/profile" component={() => <><Header title="Profile" /><Profile /></>} />
          <Route path="/referral" component={() => <><Header title="Refer & Earn" /><ReferralPage /></>} />
          <Route path="/profile-settings" component={() => <><Header title="Profile Settings" /><ProfileSettings /></>} />
          <Route path="/levels-badges" component={() => <><Header title="Levels & Badges" /><LevelsBadges /></>} />
          <Route path="/settings" component={() => <><Header title="Settings" /><Settings /></>} />
          <Route path="/privacy-security" component={() => <><Header title="Privacy & Security" /><PrivacySecurity /></>} />
          <Route path="/terms-of-service" component={() => <><Header title="Terms of Service" /><TermsOfService /></>} />
          <Route path="/data-deletion" component={() => <><Header title="Data Deletion" /><DataDeletionRequest /></>} />
          <Route path="/help-support" component={() => <><Header title="Help & Support" /><HelpSupport /></>} />
          <Route component={NotFound} />
        </Switch>
        <MobileNav />
      </div>

      {/* Achievement Notification */}
      <AchievementNotification
        achievement={achievement}
        onClose={() => setAchievement(null)}
      />

      {/* Event Notification */}
      <EventNotification
        notification={eventNotification}
        onClose={() => setEventNotification(null)}
      />

      {/* Match Notification */}
      <MatchNotification
        notification={matchNotification}
        onClose={() => setMatchNotification(null)}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <WebSocketProvider>
            <TooltipProvider>
              <Toaster />
              <AppContent />
            </TooltipProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;