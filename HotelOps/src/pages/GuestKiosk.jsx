import React, { useState } from 'react';
import { base44 } from '../api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import SelfCheckIn from '../components/kiosk/SelfCheckIn';
import CheckOut from '../components/kiosk/CheckOut';
import BookRoom from '../components/kiosk/BookRoom';
import ElevatorCall from '../components/kiosk/ElevatorCall';
import ParkingInfo from '../components/kiosk/ParkingInfo';
import AIChatbot from '../components/kiosk/AIChatbot';
import PersonalizedRecommendations from '../components/kiosk/PersonalizedRecommendations';
import DigitalKey from '../components/kiosk/DigitalKey';
import GuestFeedback from '../components/kiosk/GuestFeedback';
import RoomControls from '../components/kiosk/RoomControls';
import LoyaltyProgram from '../components/kiosk/LoyaltyProgram';
import ConferenceRoomBooking from '../components/kiosk/ConferenceRoomBooking';
import GuestMessages from '../components/kiosk/GuestMessages';

export default function GuestKiosk() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('booking');
  const [guestAccessCode, setGuestAccessCode] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="bg-white border-b shadow-sm p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate(createPageUrl('Home'))}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Guest Self-Service Kiosk</h1>
              <p className="text-sm text-slate-600">Welcome! How can we help you today?</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-2 w-full h-auto mb-6 p-2">
            <TabsTrigger value="booking">Book</TabsTrigger>
            <TabsTrigger value="checkin">Check-In</TabsTrigger>
            <TabsTrigger value="checkout">Check-Out</TabsTrigger>
            <TabsTrigger value="digitalkey">Key</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="loyalty">Rewards</TabsTrigger>
            <TabsTrigger value="roomcontrols">Controls</TabsTrigger>
            <TabsTrigger value="conference">Conference</TabsTrigger>
            <TabsTrigger value="chatbot">AI</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="elevator">Elevator</TabsTrigger>
            <TabsTrigger value="parking">Parking</TabsTrigger>
          </TabsList>

          <TabsContent value="booking">
            <BookRoom />
          </TabsContent>

          <TabsContent value="checkin">
            <SelfCheckIn />
          </TabsContent>

          <TabsContent value="checkout">
            <CheckOut />
          </TabsContent>

          <TabsContent value="digitalkey">
            <DigitalKey />
          </TabsContent>

          <TabsContent value="messages">
            <GuestMessages />
          </TabsContent>

          <TabsContent value="loyalty">
            <LoyaltyProgram />
          </TabsContent>

          <TabsContent value="chatbot">
            <AIChatbot accessCode={guestAccessCode} />
          </TabsContent>

          <TabsContent value="recommendations">
            <PersonalizedRecommendations guestData={null} />
          </TabsContent>

          <TabsContent value="roomcontrols">
            <RoomControls />
          </TabsContent>

          <TabsContent value="feedback">
            <GuestFeedback />
          </TabsContent>

          <TabsContent value="elevator">
            <ElevatorCall />
          </TabsContent>

          <TabsContent value="parking">
            <ParkingInfo />
          </TabsContent>

          <TabsContent value="conference">
            <ConferenceRoomBooking />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}