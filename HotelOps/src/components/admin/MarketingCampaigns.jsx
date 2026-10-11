import React, { useState } from 'react';
import { db } from '../dataClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Megaphone, Plus, Sparkles, Send, TrendingUp, Target, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function MarketingCampaigns() {
  const queryClient = useQueryClient();
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    campaign_type: 'email',
    target_segment: 'all',
    tier_filter: [],
    status: 'draft'
  });
  const [newOffer, setNewOffer] = useState({
    title: '',
    description: '',
    offer_type: 'discount',
    discount_percentage: 0,
    valid_from: '',
    valid_until: '',
    active: true
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => db.entities.Campaign.list('-created_date')
  });

  const { data: offers = [] } = useQuery({
    queryKey: ['offers'],
    queryFn: () => db.entities.Offer.list('-created_date')
  });

  const { data: guests = [] } = useQuery({
    queryKey: ['guests'],
    queryFn: () => db.entities.Guest.list()
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data) => db.entities.Campaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setShowCreateCampaign(false);
      setNewCampaign({ name: '', description: '', campaign_type: 'email', target_segment: 'all', tier_filter: [], status: 'draft' });
      toast.success('Campaign created!');
    }
  });

  const createOfferMutation = useMutation({
    mutationFn: (data) => db.entities.Offer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      setShowCreateOffer(false);
      setNewOffer({ title: '', description: '', offer_type: 'discount', discount_percentage: 0, valid_from: '', valid_until: '', active: true });
      toast.success('Offer created!');
    }
  });

  const generateAICampaignMutation = useMutation({
    mutationFn: async ({ segment }) => {
      const response = await db.integrations.Core.InvokeLLM({
        prompt: `Generate a personalized marketing campaign for hotel guests in the "${segment}" segment. 
        
        Create a compelling campaign with:
        - Campaign name (catchy and relevant)
        - Campaign description
        - Email subject line
        - Email message (personalized and engaging, 2-3 paragraphs)
        - Recommended offer type and discount
        
        Consider guest preferences, loyalty status, and booking patterns for this segment.`,
        response_json_schema: {
          type: "object",
          properties: {
            campaign_name: { type: "string" },
            campaign_description: { type: "string" },
            email_subject: { type: "string" },
            email_message: { type: "string" },
            offer_type: { type: "string" },
            discount_percentage: { type: "number" }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setNewCampaign({
        ...newCampaign,
        name: data.campaign_name,
        description: data.campaign_description
      });
      toast.success('AI campaign generated!');
    }
  });

  const launchCampaignMutation = useMutation({
    mutationFn: async (campaign) => {
      let targetGuests = guests.filter(g => g.marketing_opt_in);

      if (campaign.target_segment === 'vip') {
        targetGuests = targetGuests.filter(g => g.vip_status);
      } else if (campaign.target_segment === 'loyalty_tier' && campaign.tier_filter?.length > 0) {
        targetGuests = targetGuests.filter(g => campaign.tier_filter.includes(g.loyalty_tier));
      } else if (campaign.target_segment === 'inactive') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        targetGuests = targetGuests.filter(g => 
          !g.last_campaign_date || new Date(g.last_campaign_date) < thirtyDaysAgo
        );
      }

      const offer = campaign.offer_id ? offers.find(o => o.id === campaign.offer_id) : null;

      const notifications = await Promise.all(
        targetGuests.map(async (guest) => {
          const personalizedResponse = await db.integrations.Core.InvokeLLM({
            prompt: `Create a personalized marketing message for ${guest.first_name} ${guest.last_name}, 
            a ${guest.loyalty_tier} tier member. 
            
            Campaign: ${campaign.name}
            ${offer ? `Offer: ${offer.title} - ${offer.description}` : ''}
            
            Make it personal, warm, and engaging. Include their name and loyalty status.`,
            response_json_schema: {
              type: "object",
              properties: {
                subject: { type: "string" },
                message: { type: "string" }
              }
            }
          });

          return db.entities.Notification.create({
            guest_id: guest.id,
            campaign_id: campaign.id,
            notification_type: campaign.campaign_type,
            subject: personalizedResponse.subject,
            message: personalizedResponse.message,
            personalized_content: personalizedResponse,
            status: 'sent',
            sent_date: new Date().toISOString()
          });
        })
      );

      await db.entities.Campaign.update(campaign.id, {
        status: 'active',
        total_sent: targetGuests.length,
        start_date: new Date().toISOString()
      });

      await db.entities.AnalyticsData.create({
        metric_type: 'revenue',
        metric_value: targetGuests.length,
        metric_date: new Date().toISOString(),
        domain: 'overall',
        metadata: {
          event: 'campaign_launched',
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          target_segment: campaign.target_segment,
          notifications_sent: targetGuests.length
        }
      });

      return { notifications, targetCount: targetGuests.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      toast.success(`Campaign launched! ${data.targetCount} notifications sent.`);
    }
  });

  const getCampaignStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-200 text-slate-800',
      scheduled: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      paused: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || colors.draft;
  };

  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalSent: campaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0),
    avgOpenRate: campaigns.length > 0 
      ? (campaigns.reduce((sum, c) => sum + (c.total_sent > 0 ? (c.total_opened / c.total_sent) * 100 : 0), 0) / campaigns.length).toFixed(1)
      : 0
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Megaphone className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
            <p className="text-sm text-slate-600">Total Campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{stats.activeCampaigns}</p>
            <p className="text-sm text-slate-600">Active Campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Send className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold">{stats.totalSent}</p>
            <p className="text-sm text-slate-600">Messages Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Mail className="w-8 h-8 mx-auto mb-2 text-orange-600" />
            <p className="text-2xl font-bold">{stats.avgOpenRate}%</p>
            <p className="text-sm text-slate-600">Avg Open Rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Megaphone className="w-6 h-6" />
              Marketing Campaigns
            </span>
            <div className="flex gap-2">
              <Button onClick={() => setShowCreateOffer(!showCreateOffer)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                New Offer
              </Button>
              <Button onClick={() => setShowCreateCampaign(!showCreateCampaign)}>
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="campaigns">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="offers">Offers</TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="space-y-4">
              {showCreateCampaign && (
                <Card className="border-2 border-blue-200">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Create New Campaign</h3>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => generateAICampaignMutation.mutate({ segment: newCampaign.target_segment })}
                        disabled={generateAICampaignMutation.isPending}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Generate
                      </Button>
                    </div>
                    <Input
                      placeholder="Campaign Name"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    />
                    <Textarea
                      placeholder="Campaign Description"
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Campaign Type</Label>
                        <Select value={newCampaign.campaign_type} onValueChange={(v) => setNewCampaign({ ...newCampaign, campaign_type: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="push_notification">Push Notification</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Target Segment</Label>
                        <Select value={newCampaign.target_segment} onValueChange={(v) => setNewCampaign({ ...newCampaign, target_segment: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Guests</SelectItem>
                            <SelectItem value="vip">VIP Only</SelectItem>
                            <SelectItem value="loyalty_tier">By Loyalty Tier</SelectItem>
                            <SelectItem value="inactive">Inactive Guests</SelectItem>
                            <SelectItem value="frequent">Frequent Guests</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button className="w-full" onClick={() => createCampaignMutation.mutate(newCampaign)}>
                      Create Campaign
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                {campaigns.map(campaign => {
                  const openRate = campaign.total_sent > 0 ? ((campaign.total_opened / campaign.total_sent) * 100).toFixed(1) : 0;
                  const conversionRate = campaign.total_sent > 0 ? ((campaign.total_conversions / campaign.total_sent) * 100).toFixed(1) : 0;

                  return (
                    <Card key={campaign.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{campaign.name}</h3>
                              <Badge className={getCampaignStatusColor(campaign.status)}>
                                {campaign.status}
                              </Badge>
                              {campaign.ai_generated && (
                                <Badge variant="outline" className="bg-purple-50">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  AI
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">{campaign.description}</p>
                            <div className="flex gap-4 mt-2 text-xs text-slate-500">
                              <span>Type: {campaign.campaign_type}</span>
                              <span>Target: {campaign.target_segment}</span>
                            </div>
                          </div>
                          {campaign.status === 'draft' && (
                            <Button 
                              size="sm"
                              onClick={() => launchCampaignMutation.mutate(campaign)}
                              disabled={launchCampaignMutation.isPending}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Launch
                            </Button>
                          )}
                        </div>

                        {campaign.total_sent > 0 && (
                          <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                            <div>
                              <p className="text-xs text-slate-500">Sent</p>
                              <p className="text-lg font-bold">{campaign.total_sent}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Open Rate</p>
                              <p className="text-lg font-bold text-blue-600">{openRate}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Conversions</p>
                              <p className="text-lg font-bold text-green-600">{campaign.total_conversions}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="offers" className="space-y-4">
              {showCreateOffer && (
                <Card className="border-2 border-blue-200">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold">Create New Offer</h3>
                    <Input
                      placeholder="Offer Title"
                      value={newOffer.title}
                      onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                    />
                    <Textarea
                      placeholder="Offer Description"
                      value={newOffer.description}
                      onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Offer Type</Label>
                        <Select value={newOffer.offer_type} onValueChange={(v) => setNewOffer({ ...newOffer, offer_type: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="discount">Discount</SelectItem>
                            <SelectItem value="upgrade">Room Upgrade</SelectItem>
                            <SelectItem value="bonus_points">Bonus Points</SelectItem>
                            <SelectItem value="package">Package Deal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Discount %</Label>
                        <Input
                          type="number"
                          value={newOffer.discount_percentage}
                          onChange={(e) => setNewOffer({ ...newOffer, discount_percentage: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Valid From</Label>
                        <Input
                          type="date"
                          value={newOffer.valid_from}
                          onChange={(e) => setNewOffer({ ...newOffer, valid_from: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Valid Until</Label>
                        <Input
                          type="date"
                          value={newOffer.valid_until}
                          onChange={(e) => setNewOffer({ ...newOffer, valid_until: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button className="w-full" onClick={() => createOfferMutation.mutate(newOffer)}>
                      Create Offer
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offers.map(offer => (
                  <Card key={offer.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold">{offer.title}</h3>
                          <p className="text-sm text-slate-600 mt-1">{offer.description}</p>
                        </div>
                        <Badge variant={offer.active ? 'default' : 'outline'}>
                          {offer.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge>{offer.offer_type}</Badge>
                        {offer.discount_percentage > 0 && (
                          <Badge className="bg-green-100 text-green-800">
                            {offer.discount_percentage}% OFF
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        Valid: {new Date(offer.valid_from).toLocaleDateString()} - {new Date(offer.valid_until).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}