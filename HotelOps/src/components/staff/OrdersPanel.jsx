import React from 'react';
import { db } from '../dataClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { UtensilsCrossed, DoorClosed, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function OrdersPanel() {
  const queryClient = useQueryClient();

  const { data: roomServiceOrders = [] } = useQuery({
    queryKey: ['room-service-orders-staff'],
    queryFn: () => db.entities.RoomServiceOrder.filter({ 
      status: { $in: ['pending', 'preparing', 'on_the_way'] }
    })
  });

  const { data: roomControls = [] } = useQuery({
    queryKey: ['room-controls-staff'],
    queryFn: () => db.entities.RoomControl.list('-last_updated')
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, status }) => db.entities.RoomServiceOrder.update(id, { 
      status,
      ...(status === 'delivered' && { delivered_time: new Date().toISOString() })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Order updated!');
    }
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      on_the_way: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-Time Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="room_service">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="room_service">
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              Room Service ({roomServiceOrders.length})
            </TabsTrigger>
            <TabsTrigger value="room_controls">
              <DoorClosed className="w-4 h-4 mr-2" />
              Room Controls ({roomControls.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="room_service" className="space-y-3">
            {roomServiceOrders.map(order => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      <p className="text-sm font-medium mt-2">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-slate-500">Room: {order.room_id?.slice(0, 8)}</p>
                    </div>
                    <p className="text-lg font-bold">${order.total_amount.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1 mb-3">
                    {order.items.map((item, idx) => (
                      <p key={idx} className="text-sm">{item.quantity}x {item.item_name}</p>
                    ))}
                  </div>
                  {order.special_instructions && (
                    <p className="text-xs text-slate-600 italic mb-3">Note: {order.special_instructions}</p>
                  )}
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <Button size="sm" onClick={() => updateOrderMutation.mutate({ id: order.id, status: 'preparing' })}>
                        Start Preparing
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button size="sm" onClick={() => updateOrderMutation.mutate({ id: order.id, status: 'on_the_way' })}>
                        Out for Delivery
                      </Button>
                    )}
                    {order.status === 'on_the_way' && (
                      <Button size="sm" onClick={() => updateOrderMutation.mutate({ id: order.id, status: 'delivered' })}>
                        Mark Delivered
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {roomServiceOrders.length === 0 && (
              <p className="text-center text-slate-500 py-8">No active orders</p>
            )}
          </TabsContent>

          <TabsContent value="room_controls" className="space-y-3">
            {roomControls.map(control => (
              <Card key={control.id}>
                <CardContent className="p-4">
                  <p className="font-medium mb-2">Room: {control.room_id?.slice(0, 8)}</p>
                  <div className="flex flex-wrap gap-2">
                    {control.do_not_disturb && (
                      <Badge className="bg-red-100 text-red-800">
                        <DoorClosed className="w-3 h-3 mr-1" />
                        Do Not Disturb
                      </Badge>
                    )}
                    {control.make_up_room && (
                      <Badge className="bg-blue-100 text-blue-800">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Make Up Room
                      </Badge>
                    )}
                    {control.temperature_preference && (
                      <Badge variant="outline">
                        Temp: {control.temperature_preference}°F
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Updated: {new Date(control.last_updated).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}