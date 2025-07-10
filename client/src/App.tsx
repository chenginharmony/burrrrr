import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
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
import { useState } from "react";

// Pages
import Landing from "@/pages/Landing";
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

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [achievement, setAchievement] = useState<{
    title: string;
    description: string;
    icon: string;
    color: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Switch>
            <Route path="/" component={() => <><Header title="Dashboard" showStreak /><Home /></>} />
            <Route path="/events" component={() => <><Header title="Events" /><Events /></>} />
            <Route path="/challenges" component={() => <><Header title="Challenges" /><Challenges /></>} />
            <Route path="/friends" component={() => <><Header title="Friends" /><Friends /></>} />
            <Route path="/wallet" component={() => <><Header title="Wallet" /><Wallet /></>} />
            <Route path="/leaderboard" component={() => <><Header title="Leaderboard" /><Leaderboard /></>} />
            <Route path="/notifications" component={() => <><Header title="Notifications" /><Notifications /></>} />
            <Route path="/profile" component={() => <><Header title="Profile" /><Profile /></>} />
            <Route path="/referral" component={() => <><Header title="Refer & Earn" /><ReferralPage /></>} />
            <Route component={() => <><Header title="404" /><NotFound /></>} />
          </Switch>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col h-full w-full">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/events" component={Events} />
          <Route path="/challenges" component={Challenges} />
          <Route path="/friends" component={Friends} />
          <Route path="/wallet" component={Wallet} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/profile" component={Profile} />
          <Route path="/referral" component={ReferralPage} />
          <Route component={NotFound} />
        </Switch>
        <MobileNav />
      </div>

      {/* Achievement Notification */}
      <AchievementNotification
        achievement={achievement}
        onClose={() => setAchievement(null)}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WebSocketProvider>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </WebSocketProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;