import React, { useState } from 'react';
import { db } from '../dataClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { UtensilsCrossed, ShoppingCart, Plus, Minus, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RoomService() {
  const queryClient = useQueryClient();
  const [accessCode, setAccessCode] = useState('');
  const [guestData, setGuestData] = useState(null);
  const [cart, setCart] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(null);

  const { data: menuItems = [] } = useQuery({
    queryKey: ['room-service-items'],
    queryFn: () => db.entities.RoomServiceItem.filter({ available: true })
  });

  const lookupMutation = useMutation({
    mutationFn: async () => {
      const passes = await db.entities.AccessPass.filter({ 
        pass_code: accessCode,
        status: 'active'
      });

      if (passes.length === 0) throw new Error('Invalid access code');

      const pass = passes[0];
      const guests = await db.entities.Guest.list();
      const guest = guests.find(g => g.id === pass.guest_id);
      
      const reservations = await db.entities.Reservation.filter({ 
        guest_id: pass.guest_id,
        status: 'checked_in'
      });

      if (reservations.length === 0) throw new Error('No active reservation');

      const reservation = reservations[0];
      const rooms = await db.entities.Room.list();
      const room = rooms.find(r => r.id === reservation.room_id);

      return { guest, reservation, room, pass };
    },
    onSuccess: (data) => {
      setGuestData(data);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const now = new Date();
      const estimatedDelivery = new Date(now.getTime() + 30 * 60000);

      const order = await db.entities.RoomServiceOrder.create({
        guest_id: guestData.guest.id,
        reservation_id: guestData.reservation.id,
        room_id: guestData.room.id,
        items: cart.map(item => ({
          item_id: item.id,
          item_name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total_amount: totalAmount,
        special_instructions: specialInstructions,
        status: 'pending',
        order_time: now.toISOString(),
        estimated_delivery: estimatedDelivery.toISOString()
      });

      // Update invoice with room service charges
      const invoices = await db.entities.Invoice.filter({ 
        reservation_id: guestData.reservation.id 
      });
      
      if (invoices.length > 0) {
        const invoice = invoices[0];
        await db.entities.Invoice.update(invoice.id, {
          other_charges: (invoice.other_charges || 0) + totalAmount,
          total_amount: invoice.total_amount + totalAmount
        });
      }

      return order;
    },
    onSuccess: (order) => {
      setOrderPlaced(order);
      setCart([]);
      queryClient.invalidateQueries();
      toast.success('Order placed successfully!');
    },
    onError: () => {
      toast.error('Failed to place order');
    }
  });

  const addToCart = (item) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    const existing = cart.find(i => i.id === itemId);
    if (existing.quantity > 1) {
      setCart(cart.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i));
    } else {
      setCart(cart.filter(i => i.id !== itemId));
    }
  };

  const categories = ['breakfast', 'lunch', 'dinner', 'drinks', 'snacks', 'desserts'];

  if (orderPlaced) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Order Confirmed!</CardTitle>
          <CardDescription>Your room service is on the way</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-600">Estimated Delivery</span>
              <Badge className="bg-blue-600">
                <Clock className="w-3 h-3 mr-1" />
                30 minutes
              </Badge>
            </div>
            <div className="space-y-2">
              {orderPlaced.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.item_name}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 font-bold flex justify-between">
                <span>Total</span>
                <span>${orderPlaced.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <Button className="w-full" onClick={() => setOrderPlaced(null)}>
            Place Another Order
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (guestData) {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed className="w-6 h-6" />
              Room Service Menu
            </CardTitle>
            <CardDescription>Room {guestData.room.room_number}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="breakfast">
              <TabsList className="grid w-full grid-cols-6">
                {categories.map(cat => (
                  <TabsTrigger key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>
              {categories.map(category => (
                <TabsContent key={category} value={category} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {menuItems.filter(item => item.category === category).map(item => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold">{item.name}</h3>
                              <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-lg font-bold text-blue-600">${item.price}</div>
                              <Badge variant="outline" className="text-xs mt-1">
                                <Clock className="w-3 h-3 mr-1" />
                                {item.preparation_time}m
                              </Badge>
                            </div>
                          </div>
                          <Button 
                            onClick={() => addToCart(item)}
                            className="w-full mt-2"
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add to Cart
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {cart.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Your Order ({cart.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-slate-600">${item.price} each</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button size="icon" variant="outline" onClick={() => removeFromCart(item.id)}>
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button size="icon" variant="outline" onClick={() => addToCart(item)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                    <span className="w-20 text-right font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}

              <div className="space-y-2 pt-4 border-t">
                <Label>Special Instructions</Label>
                <Textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any allergies or special requests?"
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold text-blue-600">${total.toFixed(2)}</span>
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => placeOrderMutation.mutate()}
                disabled={placeOrderMutation.isPending}
              >
                Place Order
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UtensilsCrossed className="w-6 h-6" />
          Room Service
        </CardTitle>
        <CardDescription>Order delicious food to your room</CardDescription>
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
          <Button type="submit" className="w-full" disabled={lookupMutation.isPending}>
            Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}