import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Users, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Event } from '@/hooks/useEvent';

interface BettingInterfaceProps {
  event: Event;
  onPlaceBet: (prediction: boolean, amount: number) => void;
  isPlacingBet: boolean;
}

interface EventPool {
  totalAmount: number;
  yesAmount: number;
  noAmount: number;
  yesParticipants: number;
  noParticipants: number;
}

export function BettingInterface({ event, onPlaceBet, isPlacingBet }: BettingInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [betAmount, setBetAmount] = useState('');
  const [selectedPrediction, setSelectedPrediction] = useState<boolean | null>(null);
  const [eventPool, setEventPool] = useState<EventPool>({
    totalAmount: 0,
    yesAmount: 0,
    noAmount: 0,
    yesParticipants: 0,
    noParticipants: 0,
  });
  const [userParticipation, setUserParticipation] = useState<{
    hasJoined: boolean;
    prediction?: boolean;
    amount?: number;
  }>({ hasJoined: false });

  // Fetch event pool and participation data
  useEffect(() => {
    fetchEventData();
  }, [event.id]);

  const fetchEventData = async () => {
    try {
      // Fetch event pool data
      const poolResponse = await fetch(`/api/events/${event.id}/pool`, {
        credentials: 'include',
      });
      if (poolResponse.ok) {
        const poolData = await poolResponse.json();
        setEventPool(poolData);
      }

      // Fetch user participation
      if (user) {
        const participationResponse = await fetch(`/api/events/${event.id}/participation/${user.id}`, {
          credentials: 'include',
        });
        if (participationResponse.ok) {
          const participationData = await participationResponse.json();
          setUserParticipation(participationData);
        }
      }
    } catch (error) {
      console.error('Error fetching event data:', error);
    }
  };

  const handlePlaceBet = () => {
    if (!selectedPrediction === null) {
      toast({
        title: "Error",
        description: "Please select YES or NO",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(betAmount);
    if (!amount || amount < 100) {
      toast({
        title: "Error",
        description: "Minimum bet amount is ₦100",
        variant: "destructive",
      });
      return;
    }

    if (!user || parseFloat(user.availablePoints || '0') < amount) {
      toast({
        title: "Error",
        description: "Insufficient balance",
        variant: "destructive",
      });
      return;
    }

    onPlaceBet(selectedPrediction!, amount);
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const calculateOdds = (yesAmount: number, noAmount: number, isYes: boolean) => {
    const totalAmount = yesAmount + noAmount;
    if (totalAmount === 0) return 2.0;
    
    const oppositeAmount = isYes ? noAmount : yesAmount;
    const odds = totalAmount / (oppositeAmount || 1);
    return Math.max(1.1, Math.min(10, odds));
  };

  const yesOdds = calculateOdds(eventPool.yesAmount, eventPool.noAmount, true);
  const noOdds = calculateOdds(eventPool.yesAmount, eventPool.noAmount, false);

  const potentialWin = selectedPrediction !== null && betAmount 
    ? parseFloat(betAmount) * (selectedPrediction ? yesOdds : noOdds)
    : 0;

  if (userParticipation.hasJoined) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Your Bet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              userParticipation.prediction 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
            }`}>
              {userParticipation.prediction ? (
                <><TrendingUp className="h-4 w-4" /> YES</>
              ) : (
                <><TrendingDown className="h-4 w-4" /> NO</>
              )}
            </div>
            <p className="text-2xl font-bold mt-2">
              {formatCurrency(userParticipation.amount || 0)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Potential win: {formatCurrency(
                (userParticipation.amount || 0) * 
                (userParticipation.prediction ? yesOdds : noOdds)
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Place Your Bet</CardTitle>
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Total Pool: {formatCurrency(eventPool.totalAmount)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* YES/NO Selection */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={selectedPrediction === true ? "default" : "outline"}
            className={`h-20 flex flex-col items-center gap-2 ${
              selectedPrediction === true 
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'hover:bg-green-50 dark:hover:bg-green-900/20'
            }`}
            onClick={() => setSelectedPrediction(true)}
          >
            <TrendingUp className="h-6 w-6" />
            <div className="text-center">
              <div className="font-bold">YES</div>
              <div className="text-xs">
                {yesOdds.toFixed(1)}x odds
              </div>
              <div className="text-xs opacity-75">
                {eventPool.yesParticipants} bettors
              </div>
            </div>
          </Button>
          
          <Button
            variant={selectedPrediction === false ? "default" : "outline"}
            className={`h-20 flex flex-col items-center gap-2 ${
              selectedPrediction === false 
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
            onClick={() => setSelectedPrediction(false)}
          >
            <TrendingDown className="h-6 w-6" />
            <div className="text-center">
              <div className="font-bold">NO</div>
              <div className="text-xs">
                {noOdds.toFixed(1)}x odds
              </div>
              <div className="text-xs opacity-75">
                {eventPool.noParticipants} bettors
              </div>
            </div>
          </Button>
        </div>

        {/* Bet Amount Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Bet Amount</label>
          <Input
            type="number"
            placeholder="Enter amount (min ₦100)"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            min="100"
            max={user?.availablePoints || 0}
          />
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Available: {formatCurrency(parseFloat(user?.availablePoints || '0'))}
          </div>
        </div>

        {/* Potential Win Display */}
        {selectedPrediction !== null && betAmount && (
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm">Potential Win:</span>
              <span className="font-bold text-green-600 dark:text-green-400">
                {formatCurrency(potentialWin)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Return: {((potentialWin / parseFloat(betAmount)) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        <Separator />

        {/* Place Bet Button */}
        <Button
          onClick={handlePlaceBet}
          disabled={selectedPrediction === null || !betAmount || isPlacingBet}
          className="w-full"
          size="lg"
        >
          {isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
        </Button>

        {/* Pool Statistics */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>YES Pool:</span>
            <span className="font-medium text-green-600">
              {formatCurrency(eventPool.yesAmount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>NO Pool:</span>
            <span className="font-medium text-red-600">
              {formatCurrency(eventPool.noAmount)}
            </span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span>Total Participants:</span>
            <span className="font-medium">
              {eventPool.yesParticipants + eventPool.noParticipants}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}