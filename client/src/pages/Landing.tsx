import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export default function Landing() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-lime-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-dice text-white text-sm" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">BetChat</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="w-10 h-10"
            >
              {theme === 'dark' ? (
                <i className="fas fa-sun" />
              ) : (
                <i className="fas fa-moon" />
              )}
            </Button>
            <Button asChild>
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to <span className="bg-gradient-to-r from-purple-600 to-lime-500 bg-clip-text text-transparent">BetChat</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              The ultimate gamified social platform for events, challenges, and real-time betting
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-white dark:bg-gray-800 border-purple-200 dark:border-purple-700">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-calendar-alt text-white" />
                </div>
                <CardTitle className="text-lg">Event Chatrooms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Join live events with real-time chat, predictions, and community engagement
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-lime-200 dark:border-lime-700">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-gamepad text-white" />
                </div>
                <CardTitle className="text-lg">P2P Challenges</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Create challenges with friends, secure funds in escrow, and compete for rewards
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-orange-200 dark:border-orange-700">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-trophy text-white" />
                </div>
                <CardTitle className="text-lg">Gamification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Earn points, level up, unlock achievements, and climb the leaderboard
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-lime-500 hover:from-purple-700 hover:to-lime-600 text-white px-8 py-3 text-lg" asChild>
              <a href="/api/login">Get Started</a>
            </Button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Join thousands of users already enjoying BetChat
            </p>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Why Choose BetChat?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-shield-alt text-white text-xl" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Secure Escrow</h4>
              <p className="text-gray-600 dark:text-gray-300">
                All funds are securely held in escrow until challenge completion
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-lime-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-comments text-white text-xl" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Real-time Chat</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Engage with community in live event chatrooms
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-fire text-white text-xl" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Daily Streaks</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Maintain login streaks for bonus rewards and achievements
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-line text-white text-xl" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Leaderboards</h4>
              <p className="text-gray-600 dark:text-gray-300">
                Compete with friends and climb the global rankings
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
