import React, { useState } from 'react';
import { db } from '../dataClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Award, Star, Gift, TrendingUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function LoyaltyProgram() {
  const [accessCode, setAccessCode] = useState('');
  const [loyaltyData, setLoyaltyData] = useState(null);

  const { data: rewards = [] } = useQuery({
    queryKey: ['loyalty-rewards'],
    queryFn: () => db.entities.LoyaltyReward.filter({ available: true })
  });

  const lookupMutation = useMutation({
    mutationFn: async () => {
      const passes = await db.entities.AccessPass.filter({ pass_code: accessCode });
      if (passes.length === 0) throw new Error('Invalid access code');

      const pass = passes[0];
      const guests = await db.entities.Guest.list();
      const guest = guests.find(g => g.id === pass.guest_id);

      let loyaltyPoints = await db.entities.LoyaltyPoints.filter({ guest_id: guest.id });
      
      if (loyaltyPoints.length === 0) {
        loyaltyPoints = [await db.entities.LoyaltyPoints.create({ guest_id: guest.id })];
      }

      const transactions = await db.entities.LoyaltyTransaction.filter({ guest_id: guest.id });

      return { guest, loyalty: loyaltyPoints[0], transactions };
    },
    onSuccess: (data) => {
      setLoyaltyData(data);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const redeemRewardMutation = useMutation({
    mutationFn: async (reward) => {
      const newPoints = loyaltyData.loyalty.total_points - reward.points_required;
      
      await db.entities.LoyaltyPoints.update(loyaltyData.loyalty.id, {
        total_points: newPoints,
        points_redeemed: loyaltyData.loyalty.points_redeemed + reward.points_required
      });

      await db.entities.LoyaltyTransaction.create({
        guest_id: loyaltyData.guest.id,
        transaction_type: 'redeemed',
        points: reward.points_required,
        description: `Redeemed: ${reward.name}`,
        related_reward_id: reward.id,
        transaction_date: new Date().toISOString()
      });

      return newPoints;
    },
    onSuccess: () => {
      lookupMutation.mutate();
      toast.success('Reward redeemed successfully!');
    }
  });

  const getTierInfo = (tier) => {
    const info = {
      standard: { name: 'Bronze', color: 'bg-orange-100 text-orange-800', icon: '🥉', next: 'Silver', pointsNeeded: 1000 },
      silver: { name: 'Silver', color: 'bg-slate-200 text-slate-800', icon: '🥈', next: 'Gold', pointsNeeded: 5000 },
      gold: { name: 'Gold', color: 'bg-yellow-100 text-yellow-800', icon: '🥇', next: 'Platinum', pointsNeeded: 10000 },
      platinum: { name: 'Platinum', color: 'bg-purple-100 text-purple-800', icon: '💎', next: null, pointsNeeded: 0 }
    };
    return info[tier] || info.standard;
  };

  if (loyaltyData) {
    const tierInfo = getTierInfo(loyaltyData.loyalty.current_tier);
    const availableRewards = rewards.filter(r => 
      r.points_required <= loyaltyData.loyalty.total_points &&
      (r.tier_requirement === loyaltyData.loyalty.current_tier || 
       ['silver', 'gold', 'platinum'].indexOf(loyaltyData.loyalty.current_tier) >= 
       ['silver', 'gold', 'platinum'].indexOf(r.tier_requirement))
    );

    const progressToNext = tierInfo.next 
      ? (loyaltyData.loyalty.lifetime_points / tierInfo.pointsNeeded) * 100 
      : 100;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-80">Welcome back</p>
                <h2 className="text-2xl font-bold">{loyaltyData.guest.first_name} {loyaltyData.guest.last_name}</h2>
              </div>
              <div className="text-5xl">{tierInfo.icon}</div>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <Badge className={`${tierInfo.color} text-lg px-4 py-1`}>
                {tierInfo.name} Member
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold">{loyaltyData.loyalty.total_points}</span>
                <span className="text-sm opacity-80">points</span>
              </div>
            </div>

            {tierInfo.next && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{tierInfo.pointsNeeded - loyaltyData.loyalty.lifetime_points} points to {tierInfo.next}</span>
                  <span>{Math.min(progressToNext, 100).toFixed(0)}%</span>
                </div>
                <Progress value={Math.min(progressToNext, 100)} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{loyaltyData.loyalty.total_bookings}</p>
              <p className="text-sm text-slate-600">Total Bookings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">{loyaltyData.loyalty.lifetime_points}</p>
              <p className="text-sm text-slate-600">Lifetime Points</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-2xl font-bold">${loyaltyData.loyalty.total_spent.toFixed(0)}</p>
              <p className="text-sm text-slate-600">Total Spent</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-6 h-6" />
              Available Rewards
            </CardTitle>
            <CardDescription>Redeem your points for exclusive perks</CardDescription>
          </CardHeader>
          <CardContent>
            {availableRewards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableRewards.map(reward => (
                  <Card key={reward.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{reward.name}</h3>
                          <p className="text-sm text-slate-600 mt-1">{reward.description}</p>
                        </div>
                        <Badge variant="outline">{reward.reward_type}</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-bold">{reward.points_required} pts</span>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => redeemRewardMutation.mutate(reward)}
                          disabled={redeemRewardMutation.isPending}
                        >
                          Redeem
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-600 py-8">
                Keep earning points to unlock rewards!
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loyaltyData.transactions.slice(0, 5).map((txn, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{txn.description}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(txn.transaction_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={txn.transaction_type === 'earned' ? 'default' : 'outline'}>
                    {txn.transaction_type === 'earned' ? '+' : '-'}{txn.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-6 h-6 text-purple-600" />
          Loyalty Program
        </CardTitle>
        <CardDescription>View your rewards and status</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); lookupMutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access_code">Access Code</Label>
            <Input
              id="access_code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              maxLength={6}
              required
            />
          </div>
          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={lookupMutation.isPending}>
            View My Rewards
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}