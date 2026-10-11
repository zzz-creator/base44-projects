import React, { useState } from 'react';
import { db } from '../dataClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Search, User, History, Star } from 'lucide-react';

export default function GuestProfiles() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: guests = [] } = useQuery({
    queryKey: ['guests-staff'],
    queryFn: () => db.entities.Guest.list()
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations-staff'],
    queryFn: () => db.entities.Reservation.list('-created_date')
  });

  const { data: feedback = [] } = useQuery({
    queryKey: ['feedback-staff'],
    queryFn: () => db.entities.Feedback.list('-created_date')
  });

  const filteredGuests = guests.filter(g => 
    g.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTierColor = (tier) => {
    const colors = {
      standard: 'bg-orange-100 text-orange-800',
      silver: 'bg-slate-200 text-slate-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800'
    };
    return colors[tier] || colors.standard;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Guest Profiles
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search guests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-auto">
          {filteredGuests.slice(0, 20).map(guest => {
            const guestReservations = reservations.filter(r => r.guest_id === guest.id);
            const guestFeedback = feedback.filter(f => f.guest_id === guest.id);
            const avgRating = guestFeedback.length > 0 
              ? (guestFeedback.reduce((sum, f) => sum + f.overall_rating, 0) / guestFeedback.length).toFixed(1)
              : 'N/A';

            return (
              <Card key={guest.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold">{guest.first_name} {guest.last_name}</p>
                      <p className="text-sm text-slate-600">{guest.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getTierColor(guest.loyalty_tier)}>
                          {guest.loyalty_tier}
                        </Badge>
                        {guest.vip_status && (
                          <Badge className="bg-purple-100 text-purple-800">VIP</Badge>
                        )}
                        <Badge variant="outline">{guest.status}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold">{avgRating}</span>
                      </div>
                      <p className="text-xs text-slate-500">{guestReservations.length} stays</p>
                    </div>
                  </div>
                  
                  <Tabs defaultValue="current" className="mt-3">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="current">Current</TabsTrigger>
                      <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                    <TabsContent value="current" className="text-sm">
                      {guestReservations.filter(r => r.status === 'checked_in').length > 0 ? (
                        guestReservations.filter(r => r.status === 'checked_in').map(res => (
                          <div key={res.id} className="py-2">
                            <p className="font-medium">Room: {res.room_id?.slice(0, 8)}</p>
                            <p className="text-xs text-slate-500">
                              Check-out: {new Date(res.check_out_date).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 py-2">No current stay</p>
                      )}
                    </TabsContent>
                    <TabsContent value="history" className="text-sm">
                      {guestReservations.slice(0, 3).map(res => (
                        <div key={res.id} className="py-1">
                          <p className="text-xs">
                            {new Date(res.check_in_date).toLocaleDateString()} - {new Date(res.check_out_date).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}