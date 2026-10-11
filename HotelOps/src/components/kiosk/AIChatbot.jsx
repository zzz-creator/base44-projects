import React, { useState, useRef, useEffect } from 'react';
import { db } from '../dataClient';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { MessageCircle, Send, Bot, User, Globe, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

export default function AIChatbot({ accessCode }) {
  const queryClient = useQueryClient();
  const [language, setLanguage] = useState('en');
  const [currentFloor, setCurrentFloor] = useState(1);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: getGreeting('en') }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: elevators = [] } = useQuery({
    queryKey: ['elevators'],
    queryFn: () => db.entities.Elevator.list()
  });

  const { data: floors = [] } = useQuery({
    queryKey: ['floors'],
    queryFn: () => db.entities.Floor.list()
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['room-service-items'],
    queryFn: () => db.entities.RoomServiceItem.list()
  });

  const { data: guestData } = useQuery({
    queryKey: ['guest-data', accessCode],
    queryFn: async () => {
      if (!accessCode) return null;
      const passes = await db.entities.AccessPass.filter({ 
        pass_code: accessCode,
        status: 'active'
      });
      if (passes.length > 0) {
        const guest = await db.entities.Guest.filter({ id: passes[0].guest_id });
        const reservations = await db.entities.Reservation.filter({ 
          guest_id: passes[0].guest_id,
          status: 'checked_in'
        });
        return { guest: guest[0], reservation: reservations[0], pass: passes[0] };
      }
      return null;
    },
    enabled: !!accessCode
  });

  function getGreeting(lang) {
    const greetings = {
      en: 'Hello! I\'m your HotelOps AI assistant. How can I help you today? I can assist with room service, wake-up calls, elevator calls, local recommendations, and more!',
      es: '¡Hola! Soy tu asistente de IA de HotelOps. ¿Cómo puedo ayudarte hoy? Puedo ayudarte con servicio de habitaciones, llamadas despertador, llamadas de ascensor, recomendaciones locales y más.',
      fr: 'Bonjour! Je suis votre assistant IA HotelOps. Comment puis-je vous aider aujourd\'hui? Je peux vous aider avec le service en chambre, les appels de réveil, les appels d\'ascenseur, les recommandations locales et plus encore!',
      de: 'Hallo! Ich bin Ihr HotelOps KI-Assistent. Wie kann ich Ihnen heute helfen? Ich kann Ihnen bei Zimmerservice, Weckrufen, Aufzugrufen, lokalen Empfehlungen und mehr helfen!',
      zh: '您好！我是您的 HotelOps AI 助手。今天我能为您做什么？我可以帮助您订购客房服务、叫醒服务、电梯呼叫、本地推荐等！'
    };
    return greetings[lang] || greetings.en;
  }

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setMessages([{ role: 'assistant', content: getGreeting(newLang) }]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage) => {
      const conversationHistory = messages.slice(-6).map(m => 
        `${m.role === 'user' ? 'Guest' : 'Assistant'}: ${m.content}`
      ).join('\n');

      const languageNames = {
        en: 'English',
        es: 'Spanish',
        fr: 'French',
        de: 'German',
        zh: 'Chinese'
      };

      // Check for elevator request
      const elevatorKeywords = ['elevator', 'lift', 'ascensor', 'ascenseur', 'aufzug', '电梯'];
      const isElevatorRequest = elevatorKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
      );

      // Check for room service order
      const roomServiceKeywords = ['order', 'food', 'hungry', 'eat', 'menu', 'burger', 'pizza', 'drink', 'breakfast', 'lunch', 'dinner', 'meal'];
      const isRoomServiceOrder = roomServiceKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
      );

      // Check if asking about local attractions/events
      const localKeywords = ['restaurant', 'attraction', 'event', 'nearby', 'local', 'visit', 'see', 'do'];
      const needsLocalInfo = localKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword)
      );

      // Prepare available and unavailable menu items for context
      const availableMenu = menuItems
        .filter(item => item.available)
        .map(item => `${item.name} ($${item.price}) - ${item.category} - ${item.description || ''} - Prep: ${item.preparation_time}min`)
        .join('\n');

      const unavailableItems = menuItems
        .filter(item => !item.available)
        .map(item => item.name)
        .join(', ');

      // Build guest profile context
      const guestPreferences = guestData?.guest ? `
Guest Profile:
- Name: ${guestData.guest.first_name} ${guestData.guest.last_name}
- Loyalty Tier: ${guestData.guest.loyalty_tier}
${guestData.guest.dietary_preferences ? `- Dietary Preferences: ${guestData.guest.dietary_preferences}` : ''}
${guestData.guest.allergies ? `- Allergies: ${guestData.guest.allergies}` : ''}
${guestData.guest.favorite_items ? `- Favorite Items: ${guestData.guest.favorite_items}` : ''}` : '';

      const prompt = `You are a helpful multilingual hotel concierge AI assistant for HotelOps luxury hotel.

LANGUAGE: Respond in ${languageNames[language] || 'English'}.

${guestPreferences}

Guest's recent conversation:
${conversationHistory}
Guest: ${userMessage}

Hotel Information & FAQs:
- Check-in: 3:00 PM | Check-out: 11:00 AM
- Wi-Fi: Free high-speed in all rooms (Network: HotelOps-Guest)
- Room Service: Available 24/7 (Dial 0 from room phone)
- Gym: Open 5 AM - 11 PM (Floor 2)
- Pool: Open 6 AM - 10 PM (Floor 3)
- Restaurant: Breakfast 6-11 AM, Lunch 12-3 PM, Dinner 6-10 PM
- Parking: Valet available, $25/day
- Pet Policy: Small pets welcome ($50 fee per stay)
- Late checkout: Available upon request (subject to availability)
- Housekeeping: Daily service, extra towels available on request

${isRoomServiceOrder ? `
AVAILABLE ROOM SERVICE MENU (Real-time):
${availableMenu}

${unavailableItems ? `CURRENTLY UNAVAILABLE ITEMS: ${unavailableItems}` : ''}

SPECIAL INSTRUCTIONS FOR ROOM SERVICE ORDERS:
- Support multi-item orders with individual modifications (e.g., "burger with no onions, fries, and a coke")
- Parse each item separately with its specific customizations
- Handle dietary restrictions from guest profile automatically
- If guest profile has dietary preferences/allergies, proactively warn about incompatible items
- Check item availability in real-time and suggest alternatives for unavailable items
- For unavailable items, immediately suggest similar available alternatives
- Calculate total price and estimated delivery time based on longest prep time
- Present order summary naturally in conversation
- Automatically confirm order without asking for confirmation again (streamlined process)
- After presenting order summary with price, immediately say "ORDER CONFIRMED" to finalize
` : ''}

Services you can create:
- Room service orders (with customizations)
- Housekeeping/extra towels/amenities
- Wake-up calls (specify time)
- Concierge assistance
- Maintenance requests
- ${isElevatorRequest ? 'ELEVATOR CALL - confirmed' : ''}

Instructions:
1. Answer FAQs directly and accurately
2. For room service orders:
   - Parse multi-item orders with individual modifications for each item
   - Check availability immediately and suggest alternatives for unavailable items
   - Use guest profile preferences to personalize suggestions and warn about allergens
   - Calculate total automatically and confirm order in one smooth flow
   - Handle complex modifications naturally (e.g., "no X", "extra Y", "add Z")
3. Proactively suggest items based on guest preferences and order history
4. If guest requests a service, confirm you've created it
5. Be professional, warm, and conversational
6. If asking about local info, mention you'll search current information
7. ${isElevatorRequest ? 'Confirm elevator is being called to their floor' : ''}

Respond naturally as a hotel assistant would in ${languageNames[language]}.`;

      // Choose AI model based on settings
      const aiModel = localStorage.getItem('hotelops_ai_model') || 'base44';
      const geminiKey = localStorage.getItem('hotelops_gemini_key') || '';

      let response;
      if (aiModel === 'gemini' && geminiKey) {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );
        const geminiData = await geminiRes.json();
        response = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not process your request.';
      } else {
        response = await db.integrations.Core.InvokeLLM({
          prompt: prompt,
          add_context_from_internet: needsLocalInfo
        });
      }

      // Handle room service order creation
      if (isRoomServiceOrder && response.includes('ORDER CONFIRMED') && guestData) {
        try {
          // Use LLM to parse the order from conversation
          const orderParsePrompt = `Extract ALL items from this room service order:

Conversation:
${conversationHistory}
Guest: ${userMessage}
Assistant: ${response}

Available Menu Items:
${availableMenu}

Guest Dietary Info:
${guestPreferences}

IMPORTANT: Parse EACH item separately with its own modifications.
Example: "burger with no onions and fries" = TWO items: 
- Item 1: Burger (special_instructions: "no onions")
- Item 2: Fries (no special_instructions)

Parse and return ONLY a valid JSON object with this exact structure:
{
  "items": [
    {
      "item_id": "menu_item_id",
      "item_name": "Item Name",
      "quantity": 1,
      "price": 10.00,
      "special_instructions": "specific customizations for THIS item only"
    }
  ],
  "total_amount": 0.00,
  "special_instructions": "general delivery notes or dietary requirements from guest profile"
}

Match item names to available menu. Include dietary preferences from guest profile in special_instructions if relevant.`;

          const orderData = await db.integrations.Core.InvokeLLM({
            prompt: orderParsePrompt,
            response_json_schema: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      item_id: { type: "string" },
                      item_name: { type: "string" },
                      quantity: { type: "integer" },
                      price: { type: "number" },
                      special_instructions: { type: "string" }
                    }
                  }
                },
                total_amount: { type: "number" },
                special_instructions: { type: "string" }
              }
            }
          });

          // Match parsed items to actual menu items and check availability
          const orderedItems = orderData.items.map(item => {
            const menuItem = menuItems.find(m => 
              m.available && (
                m.name.toLowerCase().includes(item.item_name.toLowerCase()) ||
                item.item_name.toLowerCase().includes(m.name.toLowerCase())
              )
            );
            
            // Build special instructions including guest dietary info
            let instructions = item.special_instructions || '';
            if (guestData?.guest?.dietary_preferences && !instructions.includes(guestData.guest.dietary_preferences)) {
              instructions += (instructions ? '; ' : '') + `Guest preference: ${guestData.guest.dietary_preferences}`;
            }
            
            return {
              item_id: menuItem?.id || item.item_id,
              item_name: menuItem?.name || item.item_name,
              quantity: item.quantity,
              price: menuItem?.price || item.price,
              special_instructions: instructions
            };
          });

          // Calculate estimated delivery based on longest prep time
          const maxPrepTime = orderedItems
            .map(item => {
              const menuItem = menuItems.find(m => m.id === item.item_id);
              return menuItem?.preparation_time || 30;
            })
            .reduce((max, time) => Math.max(max, time), 30);

          // Create the room service order
          const totalAmount = orderedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          
          await db.entities.RoomServiceOrder.create({
            guest_id: guestData.guest.id,
            reservation_id: guestData.reservation.id,
            room_id: guestData.reservation.room_id,
            items: orderedItems,
            total_amount: totalAmount,
            special_instructions: orderData.special_instructions || '',
            status: 'pending',
            order_time: new Date().toISOString(),
            estimated_delivery: new Date(Date.now() + maxPrepTime * 60 * 1000).toISOString()
          });

          const itemsList = orderedItems.map(item => 
            `${item.quantity}x ${item.item_name}${item.special_instructions ? ` (${item.special_instructions})` : ''}`
          ).join(', ');
          
          toast.success(`Order confirmed: ${itemsList} - $${totalAmount.toFixed(2)} - ETA: ${maxPrepTime}min`);
        } catch (error) {
          console.error('Failed to create room service order:', error);
        }
      }

      // Handle elevator request
      if (isElevatorRequest && elevators.length > 0) {
        const idleElevator = elevators.find(e => e.status === 'idle');
        if (idleElevator) {
          await db.entities.ElevatorRequest.create({
            from_floor: currentFloor,
            to_floor: currentFloor,
            request_type: 'guest',
            priority_level: 5,
            status: 'pending',
            request_time: new Date().toISOString()
          });

          await db.entities.Elevator.update(idleElevator.id, {
            status: 'moving_up'
          });
        }
      }

      // Detect service requests (multilingual)
      const serviceKeywords = {
        'room service': 'room_service',
        'servicio de habitación': 'room_service',
        'service en chambre': 'room_service',
        'zimmerservice': 'room_service',
        '客房服务': 'room_service',
        'food': 'room_service',
        'comida': 'room_service',
        'nourriture': 'room_service',
        'essen': 'room_service',
        '食物': 'room_service',
        'housekeeping': 'housekeeping',
        'limpieza': 'housekeeping',
        'ménage': 'housekeeping',
        'reinigung': 'housekeeping',
        '清洁': 'housekeeping',
        'towel': 'housekeeping',
        'toalla': 'housekeeping',
        'serviette': 'housekeeping',
        'handtuch': 'housekeeping',
        '毛巾': 'housekeeping',
        'wake up': 'wake_up_call',
        'wake-up': 'wake_up_call',
        'despertar': 'wake_up_call',
        'réveil': 'wake_up_call',
        'weckruf': 'wake_up_call',
        '叫醒': 'wake_up_call',
        'concierge': 'concierge',
        'conserje': 'concierge',
        'concierge': 'concierge',
        'concierge': 'concierge',
        '礼宾': 'concierge',
        'maintenance': 'maintenance',
        'mantenimiento': 'maintenance',
        'entretien': 'maintenance',
        'wartung': 'maintenance',
        '维修': 'maintenance',
        'fix': 'maintenance',
        'reparar': 'maintenance',
        'réparer': 'maintenance',
        'reparieren': 'maintenance',
        'broken': 'maintenance',
        'roto': 'maintenance',
        'cassé': 'maintenance',
        'kaputt': 'maintenance'
      };

      let requestType = null;
      for (const [keyword, type] of Object.entries(serviceKeywords)) {
        if (userMessage.toLowerCase().includes(keyword)) {
          requestType = type;
          break;
        }
      }

      // Create service request if detected
      if (requestType && accessCode) {
        try {
          const passes = await db.entities.AccessPass.filter({ 
            pass_code: accessCode,
            status: 'active'
          });
          
          if (passes.length > 0) {
            const pass = passes[0];
            const reservations = await db.entities.Reservation.filter({ 
              guest_id: pass.guest_id,
              status: 'checked_in'
            });
            
            if (reservations.length > 0) {
              await db.entities.ServiceRequest.create({
                guest_id: pass.guest_id,
                reservation_id: reservations[0].id,
                request_type: requestType,
                description: userMessage,
                priority: 'medium',
                status: 'pending'
              });
            }
          }
        } catch (error) {
          console.error('Failed to create service request:', error);
        }
      }

      return response;
    },
    onSuccess: (response) => {
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsProcessing(false);
    },
    onError: () => {
      toast.error('Failed to get response');
      setIsProcessing(false);
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsProcessing(true);
    sendMessageMutation.mutate(userMessage);
  };

  return (
    <Card className="max-w-3xl mx-auto h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-blue-600" />
              AI Concierge
            </CardTitle>
            <CardDescription>Ask me anything about hotel services or request assistance</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-32">
                <Globe className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
              </SelectContent>
            </Select>
            <Select value={currentFloor.toString()} onValueChange={(v) => setCurrentFloor(parseInt(v))}>
              <SelectTrigger className="w-32">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {floors.map((floor) => (
                  <SelectItem key={floor.id} value={floor.floor_number.toString()}>
                    Floor {floor.floor_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-900'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}
          {isProcessing && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-slate-100 rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isProcessing}
          />
          <Button type="submit" disabled={isProcessing || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}