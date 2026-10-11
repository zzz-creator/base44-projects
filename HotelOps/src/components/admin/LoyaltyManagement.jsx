import React, { useState } from 'react';
import { db } from '../dataClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Award, Plus, Users, TrendingUp, Pencil, Search } from 'lucide-react';
import { toast } from 'sonner';

const TIER_COLORS = {
  standard: 'bg-orange-100 text-orange-800',
  silver: 'bg-slate-200 text-slate-800',
  gold: 'bg-yellow-100 text-yellow-800',
  platinum: 'bg-purple-100 text-purple-800'
};

export default function LoyaltyManagement() {
  const queryClient = useQueryClient();
  const [showAddReward, setShowAddReward] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newReward, setNewReward] = useState({
    name: '', description: '', points_required: 0,
    tier_requirement: 'standard', reward_type: 'discount', value: 0, available: true
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['loyalty-rewards'],
    queryFn: () => db.entities.LoyaltyReward.list()
  });

  const { data: loyaltyMembers = [] } = useQuery({
    queryKey: ['loyalty-members'],
    queryFn: () => db.entities.LoyaltyPoints.list('-lifetime_points')
  });

  const { data: guests = [] } = useQuery({
    queryKey: ['guests'],
    queryFn: () => db.entities.Guest.list()
  });

  // Build guest lookup map
  const guestMap = React.useMemo(() => {
    const m = {};
    guests.forEach(g => { m[g.id] = g; });
    return m;
  }, [guests]);

  const createRewardMutation = useMutation({
    mutationFn: (data) => db.entities.LoyaltyReward.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-rewards'] });
      setShowAddReward(false);
      setNewReward({ name: '', description: '', points_required: 0, tier_requirement: 'standard', reward_type: 'discount', value: 0, available: true });
      toast.success('Reward created!');
    }
  });

  const toggleRewardMutation = useMutation({
    mutationFn: ({ id, available }) => db.entities.LoyaltyReward.update(id, { available }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loyalty-rewards'] })
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, guestId, data }) => Promise.all([
      db.entities.LoyaltyPoints.update(id, data),
      guestId ? db.entities.Guest.update(guestId, { loyalty_tier: data.current_tier }) : Promise.resolve()
    ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-members'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      setEditingMember(null);
      toast.success('Member updated!');
    }
  });

  const stats = {
    totalMembers: loyaltyMembers.length,
    totalPointsIssued: loyaltyMembers.reduce((sum, m) => sum + (m.lifetime_points || 0), 0),
    totalPointsRedeemed: loyaltyMembers.reduce((sum, m) => sum + (m.points_redeemed || 0), 0),
    avgPointsPerMember: loyaltyMembers.length > 0
      ? Math.round(loyaltyMembers.reduce((sum, m) => sum + (m.total_points || 0), 0) / loyaltyMembers.length) : 0
  };

  const filteredMembers = loyaltyMembers.filter(m => {
    const guest = guestMap[m.guest_id];
    if (!guest) return true;
    const name = `${guest.first_name} ${guest.last_name}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || guest.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Users, value: stats.totalMembers, label: 'Total Members', color: 'text-blue-600' },
          { icon: Award, value: stats.totalPointsIssued.toLocaleString(), label: 'Points Issued', color: 'text-purple-600' },
          { icon: TrendingUp, value: stats.totalPointsRedeemed.toLocaleString(), label: 'Points Redeemed', color: 'text-green-600' },
          { icon: Award, value: stats.avgPointsPerMember, label: 'Avg Points/Member', color: 'text-orange-600' }
        ].map(({ icon: Icon, value, label, color }) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <Icon className={`w-8 h-8 mx-auto mb-2 ${color}`} />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-slate-600">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Award className="w-6 h-6" /> Loyalty Program Management</span>
            <Button onClick={() => setShowAddReward(!showAddReward)}>
              <Plus className="w-4 h-4 mr-2" /> Add Reward
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="members">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
            </TabsList>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="space-y-3">
                {filteredMembers.map(member => {
                  const guest = guestMap[member.guest_id];
                  return (
                    <Card key={member.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold">
                              {guest ? `${guest.first_name} ${guest.last_name}` : `Guest ${member.guest_id?.slice(0, 8)}`}
                            </p>
                            {guest?.email && <p className="text-xs text-slate-500">{guest.email}</p>}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge className={TIER_COLORS[member.current_tier]}>{member.current_tier}</Badge>
                              <span className="text-sm text-slate-600">
                                {member.total_bookings || 0} bookings • ${(member.total_spent || 0).toFixed(0)} spent
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-purple-600">{member.total_points || 0}</p>
                              <p className="text-xs text-slate-500">{member.lifetime_points || 0} lifetime</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => setEditingMember({ ...member })}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {filteredMembers.length === 0 && (
                  <p className="text-center text-slate-500 py-8">No members found</p>
                )}
              </div>
            </TabsContent>

            {/* Rewards Tab */}
            <TabsContent value="rewards" className="space-y-4">
              {showAddReward && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <Input placeholder="Reward Name" value={newReward.name}
                      onChange={(e) => setNewReward({ ...newReward, name: e.target.value })} />
                    <Textarea placeholder="Description" value={newReward.description}
                      onChange={(e) => setNewReward({ ...newReward, description: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Points Required</Label>
                        <Input type="number" value={newReward.points_required}
                          onChange={(e) => setNewReward({ ...newReward, points_required: parseInt(e.target.value) })} />
                      </div>
                      <div>
                        <Label>Value ($)</Label>
                        <Input type="number" value={newReward.value}
                          onChange={(e) => setNewReward({ ...newReward, value: parseFloat(e.target.value) })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={newReward.tier_requirement} onValueChange={(v) => setNewReward({ ...newReward, tier_requirement: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="silver">Silver</SelectItem>
                          <SelectItem value="gold">Gold</SelectItem>
                          <SelectItem value="platinum">Platinum</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={newReward.reward_type} onValueChange={(v) => setNewReward({ ...newReward, reward_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discount">Discount</SelectItem>
                          <SelectItem value="upgrade">Room Upgrade</SelectItem>
                          <SelectItem value="free_service">Free Service</SelectItem>
                          <SelectItem value="amenity">Amenity</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={() => createRewardMutation.mutate(newReward)}>
                      Create Reward
                    </Button>
                  </CardContent>
                </Card>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewards.map(reward => (
                  <Card key={reward.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold">{reward.name}</h3>
                          <p className="text-sm text-slate-600 mt-1">{reward.description}</p>
                        </div>
                        <Button size="sm" variant={reward.available ? 'default' : 'outline'}
                          onClick={() => toggleRewardMutation.mutate({ id: reward.id, available: !reward.available })}>
                          {reward.available ? 'Active' : 'Inactive'}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Badge>{reward.points_required} pts</Badge>
                        <Badge className={TIER_COLORS[reward.tier_requirement]}>{reward.tier_requirement}</Badge>
                        <Badge variant="outline">{reward.reward_type}</Badge>
                        {reward.value > 0 && <Badge variant="outline">${reward.value}</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      {editingMember && (
        <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Loyalty Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Available Points</Label>
                  <Input type="number" value={editingMember.total_points || 0}
                    onChange={(e) => setEditingMember({ ...editingMember, total_points: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Lifetime Points</Label>
                  <Input type="number" value={editingMember.lifetime_points || 0}
                    onChange={(e) => setEditingMember({ ...editingMember, lifetime_points: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Points Redeemed</Label>
                  <Input type="number" value={editingMember.points_redeemed || 0}
                    onChange={(e) => setEditingMember({ ...editingMember, points_redeemed: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Total Bookings</Label>
                  <Input type="number" value={editingMember.total_bookings || 0}
                    onChange={(e) => setEditingMember({ ...editingMember, total_bookings: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total Spent ($)</Label>
                  <Input type="number" value={editingMember.total_spent || 0}
                    onChange={(e) => setEditingMember({ ...editingMember, total_spent: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Loyalty Tier</Label>
                  <Select value={editingMember.current_tier}
                    onValueChange={(v) => setEditingMember({ ...editingMember, current_tier: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button>
              <Button onClick={() => updateMemberMutation.mutate({
                id: editingMember.id,
                guestId: editingMember.guest_id,
                data: {
                  total_points: editingMember.total_points,
                  lifetime_points: editingMember.lifetime_points,
                  points_redeemed: editingMember.points_redeemed,
                  total_bookings: editingMember.total_bookings,
                  total_spent: editingMember.total_spent,
                  current_tier: editingMember.current_tier
                }
              })}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}