import React, { useState } from 'react';
import { db } from '../dataClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { UtensilsCrossed, Plus, CheckCircle2, Clock, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function RoomServiceManagement() {
  const queryClient = useQueryClient();
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'breakfast',
    description: '',
    price: 0,
    preparation_time: 30,
    available: true
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['room-service-items'],
    queryFn: () => db.entities.RoomServiceItem.list()
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['room-service-orders'],
    queryFn: () => db.entities.RoomServiceOrder.list('-order_time')
  });

  const createItemMutation = useMutation({
    mutationFn: (data) => db.entities.RoomServiceItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-service-items'] });
      setShowAddItem(false);
      setNewItem({ name: '', category: 'breakfast', description: '', price: 0, preparation_time: 30, available: true });
      toast.success('Menu item added!');
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, status }) => db.entities.RoomServiceOrder.update(id, { 
      status,
      ...(status === 'delivered' && { delivered_time: new Date().toISOString() })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-service-orders'] });
      toast.success('Order updated!');
    }
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, available }) => db.entities.RoomServiceItem.update(id, { available }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-service-items'] });
    }
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      on_the_way: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UtensilsCrossed className="w-6 h-6" />
              Room Service Management
            </span>
            <Button onClick={() => setShowAddItem(!showAddItem)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Menu Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="orders">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="orders">Active Orders</TabsTrigger>
              <TabsTrigger value="menu">Menu Items</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').map(order => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        <p className="text-sm text-slate-600 mt-1">
                          Order #{order.id.slice(0, 8)} • ${order.total_amount.toFixed(2)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(order.order_time).toLocaleTimeString()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 mb-3">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-sm">
                          {item.quantity}x {item.item_name}
                        </p>
                      ))}
                      {order.special_instructions && (
                        <p className="text-xs text-slate-500 italic mt-2">
                          Note: {order.special_instructions}
                        </p>
                      )}
                    </div>

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
                      <Button size="sm" variant="outline" onClick={() => updateOrderMutation.mutate({ id: order.id, status: 'cancelled' })}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="menu" className="space-y-4">
              {showAddItem && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <Input
                      placeholder="Item Name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                    <Select value={newItem.category} onValueChange={(v) => setNewItem({ ...newItem, category: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="drinks">Drinks</SelectItem>
                        <SelectItem value="snacks">Snacks</SelectItem>
                        <SelectItem value="desserts">Desserts</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Description"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                    />
                    <Button className="w-full" onClick={() => createItemMutation.mutate(newItem)}>
                      Add Item
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems.map(item => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          <Badge variant="outline" className="mt-1">{item.category}</Badge>
                          <p className="text-sm text-slate-600 mt-2">{item.description}</p>
                          <p className="text-lg font-bold text-blue-600 mt-2">${item.price}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={item.available ? 'default' : 'outline'}
                          onClick={() => toggleAvailabilityMutation.mutate({ id: item.id, available: !item.available })}
                        >
                          {item.available ? 'Available' : 'Unavailable'}
                        </Button>
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