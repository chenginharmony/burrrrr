import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface BettingInterfaceProps {
  eventId: string;
  eventTitle: string;
  onBetPlaced?: () => void;
}

export function BettingInterface({ eventId, eventTitle, onBetPlaced }: BettingInterfaceProps) {
  const [selectedPrediction, setSelectedPrediction] = useState<boolean | null>(null);
  const [wagerAmount, setWagerAmount] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const { setMatchNotification } = useWebSocket();

  const joinEventMutation = useMutation({
    mutationFn: async ({ prediction, amount }: { prediction: boolean; amount: number }) => {
      return apiRequest(`/api/events/${eventId}/join`, {
        method: 'POST',
        body: {
          prediction,
          wagerAmount: amount,
        },
      });
    },
    onSuccess: (response) => {
      // Show "being matched" notification immediately
      setMatchNotification({
        type: 'bet_placed',
        title: 'Bet Placed',
        content: 'You are currently being matched, please wait...',
        metadata: {
          eventId,
          prediction: selectedPrediction,
          wagerAmount: parseFloat(wagerAmount),
          eventTitle
        }
      });

      toast({
        title: "Bet Placed Successfully!",
        description: `You bet ${selectedPrediction ? 'YES' : 'NO'} with ₦${wagerAmount}`,
      });

      // Clear form
      setSelectedPrediction(null);
      setWagerAmount('');
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'participants'] });
      
      if (onBetPlaced) onBetPlaced();

      // If matched immediately, show match notification
      if (response.matched) {
        setTimeout(() => {
          setMatchNotification({
            type: 'match_found',
            title: 'Match Found!',
            content: `You have been matched with an opponent, Good luck!`,
            metadata: {
              eventId,
              eventTitle,
              opponentUsername: 'opponent',
              wagerAmount: parseFloat(wagerAmount)
            }
          });
        }, 2000);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Bet Failed",
        description: error.message || "Failed to place bet",
        variant: "destructive",
      });
    },
  });

  const handlePlaceBet = () => {
    if (selectedPrediction === null) {
      toast({
        title: "Select Prediction",
        description: "Please select YES or NO",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(wagerAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid wager amount",
        variant: "destructive",
      });
      return;
    }

    const balance = parseFloat(user?.availablePoints || '0');
    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this bet",
        variant: "destructive",
      });
      return;
    }

    joinEventMutation.mutate({ prediction: selectedPrediction, amount });
  };

  return (
    <Card className="bg-gray-900 text-white border-gray-700">
      <CardHeader className="pb-4">
        <CardTitle className="text-center flex items-center gap-2 justify-center">
          <Coins className="h-5 w-5 text-yellow-500" />
          Place Your Bet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="text-center p-3 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400">Available Balance</p>
          <p className="text-xl font-bold text-green-500">
            ₦{parseFloat(user?.availablePoints || '0').toLocaleString()}
          </p>
        </div>

        {/* Prediction Selection */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-center">Your Prediction</p>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPrediction(true)}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                selectedPrediction === true
                  ? 'border-green-500 bg-green-500/20 text-green-400'
                  : 'border-gray-600 bg-gray-800 hover:border-green-500/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span className="font-bold">YES</span>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPrediction(false)}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                selectedPrediction === false
                  ? 'border-red-500 bg-red-500/20 text-red-400'
                  : 'border-gray-600 bg-gray-800 hover:border-red-500/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingDown className="h-5 w-5" />
                <span className="font-bold">NO</span>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Wager Amount */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Wager Amount</label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={wagerAmount}
            onChange={(e) => setWagerAmount(e.target.value)}
            className="bg-gray-800 border-gray-600 text-white"
            min="1"
            max={user?.availablePoints || '0'}
          />
          <div className="flex gap-2">
            {[100, 500, 1000, 5000].map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="sm"
                onClick={() => setWagerAmount(amount.toString())}
                className="text-xs border-gray-600 text-gray-300 hover:text-white"
                disabled={parseFloat(user?.availablePoints || '0') < amount}
              >
                ₦{amount}
              </Button>
            ))}
          </div>
        </div>

        {/* Place Bet Button */}
        <Button
          onClick={handlePlaceBet}
          disabled={joinEventMutation.isPending || selectedPrediction === null || !wagerAmount}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3"
        >
          {joinEventMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Placing Bet...
            </div>
          ) : (
            'Place Bet'
          )}
        </Button>

        {/* Selected bet summary */}
        {selectedPrediction !== null && wagerAmount && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-gray-800 rounded-lg border border-gray-600"
          >
            <div className="flex items-center justify-between text-sm">
              <span>Your Bet:</span>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={selectedPrediction ? "default" : "destructive"}
                  className={selectedPrediction ? "bg-green-600" : "bg-red-600"}
                >
                  {selectedPrediction ? 'YES' : 'NO'}
                </Badge>
                <span className="font-bold">₦{parseFloat(wagerAmount).toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}