import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Input } from "../components/ui/input";
import { ArrowLeft, Database, Cloud, HardDrive, Info, Bot, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function Settings() {
  const [dataMode, setDataMode] = useState('ONLINE');
  const [sqlUrl, setSqlUrl] = useState(() => 
    localStorage.getItem('hotelops_sql_server_url') || 'http://localhost:3001'
  );
  const [sqlStatus, setSqlStatus] = useState('Not Checked');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('hotelops_gemini_key') || '');
  const [aiModel, setAiModel] = useState(() => localStorage.getItem('hotelops_ai_model') || 'base44');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    // Load saved configuration from localStorage
    const savedMode = localStorage.getItem('hotelops_data_mode') || 'ONLINE';
    setDataMode(savedMode);
  }, []);

  const handleModeSwitch = (mode) => {
    setDataMode(mode);
    localStorage.setItem('hotelops_data_mode', mode);
  };

  const handleSaveAiSettings = () => {
    localStorage.setItem('hotelops_ai_model', aiModel);
    localStorage.setItem('hotelops_gemini_key', geminiKey);
    toast.success('AI settings saved');
  };

  const handleSaveUrl = () => {
    localStorage.setItem('hotelops_sql_server_url', sqlUrl);
    setSqlStatus('Saved – reload to apply');
  };

  const handleTestConnection = async () => {
    setSqlStatus('Testing...');
    try {
      const res = await fetch(`${sqlUrl}/health`);
      setSqlStatus(res.ok ? 'Connected ✓' : `Error ${res.status}`);
    } catch {
      setSqlStatus('Unreachable ✗');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-slate-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" className="text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-slate-300 mt-1">Configure data source and system preferences</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Data Source Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Source Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Current Mode: {dataMode}</AlertTitle>
              <AlertDescription>
                Switch between Base44 Cloud (Online) and SQL Server (Offline) modes.
                No synchronization is required - each mode operates independently.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              {/* Online Mode */}
              <Card 
                className={`cursor-pointer transition-all ${
                  dataMode === 'ONLINE' 
                    ? 'border-4 border-blue-500 bg-blue-50' 
                    : 'border-2 border-slate-200 hover:border-blue-300'
                }`}
                onClick={() => handleModeSwitch('ONLINE')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Cloud className="w-5 h-5" />
                    Online Mode
                    {dataMode === 'ONLINE' && (
                      <Badge className="ml-auto">ACTIVE</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1 text-slate-600">
                    <li>• Base44 Cloud Entities</li>
                    <li>• Real-time sync</li>
                    <li>• Automatic backups</li>
                    <li>• No local infrastructure</li>
                  </ul>
                  <Button 
                    className="w-full mt-4" 
                    variant={dataMode === 'ONLINE' ? 'default' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModeSwitch('ONLINE');
                    }}
                  >
                    {dataMode === 'ONLINE' ? 'Currently Active' : 'Switch to Online'}
                  </Button>
                </CardContent>
              </Card>

              {/* Offline Mode */}
              <Card 
                className={`cursor-pointer transition-all ${
                  dataMode === 'OFFLINE' 
                    ? 'border-4 border-green-500 bg-green-50' 
                    : 'border-2 border-slate-200 hover:border-green-300'
                }`}
                onClick={() => handleModeSwitch('OFFLINE')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <HardDrive className="w-5 h-5" />
                    Offline Mode
                    {dataMode === 'OFFLINE' && (
                      <Badge className="ml-auto" variant="secondary">ACTIVE</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1 text-slate-600">
                    <li>• SQL Server Local</li>
                    <li>• Full foreign key enforcement</li>
                    <li>• Schema parity with Base44</li>
                    <li>• No internet required</li>
                  </ul>
                  <Button 
                    className="w-full mt-4" 
                    variant={dataMode === 'OFFLINE' ? 'default' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModeSwitch('OFFLINE');
                    }}
                  >
                    {dataMode === 'OFFLINE' ? 'Currently Active' : 'Switch to Offline'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* SQL Bridge Configuration (when offline mode) */}
        {dataMode === 'OFFLINE' && (
          <Card>
            <CardHeader>
              <CardTitle>SQL Bridge Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Offline Setup Instructions</AlertTitle>
                <AlertDescription className="space-y-1 mt-2 text-sm">
                  <p>1. <strong>npm install</strong> in the project root</p>
                  <p>2. Configure SQL Server connection in <code className="bg-slate-100 px-1 rounded">server/.env</code></p>
                  <p>3. Run <code className="bg-slate-100 px-1 rounded">node server/bridge.js</code> — starts REST bridge on port 3001</p>
                  <p>4. All entity reads/writes are now routed to your local SQL Server automatically</p>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bridge URL</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 border rounded-md px-3 py-2 text-sm"
                    value={sqlUrl}
                    onChange={(e) => setSqlUrl(e.target.value)}
                    placeholder="http://localhost:3001"
                  />
                  <button
                    className="px-3 py-2 text-sm border rounded-md hover:bg-slate-50"
                    onClick={handleSaveUrl}
                  >
                    Save
                  </button>
                  <button
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    onClick={handleTestConnection}
                  >
                    Test
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Status: <span className={sqlStatus.includes('✓') ? 'text-green-600' : sqlStatus.includes('✗') ? 'text-red-600' : 'text-slate-600'}>{sqlStatus}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Model Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Model Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Choose which AI backend powers the in-room chatbot and AI features.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-4">
              <Card
                className={`cursor-pointer transition-all ${aiModel === 'base44' ? 'border-4 border-blue-500 bg-blue-50' : 'border-2 border-slate-200 hover:border-blue-300'}`}
                onClick={() => setAiModel('base44')}
              >
                <CardContent className="p-4 text-center">
                  <Bot className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-semibold">Base44 AI</p>
                  <p className="text-xs text-slate-500 mt-1">Default – no setup needed</p>
                  {aiModel === 'base44' && <Badge className="mt-2">ACTIVE</Badge>}
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer transition-all ${aiModel === 'gemini' ? 'border-4 border-purple-500 bg-purple-50' : 'border-2 border-slate-200 hover:border-purple-300'}`}
                onClick={() => setAiModel('gemini')}
              >
                <CardContent className="p-4 text-center">
                  <Bot className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="font-semibold">Google Gemini</p>
                  <p className="text-xs text-slate-500 mt-1">Use your own Gemini API key</p>
                  {aiModel === 'gemini' && <Badge className="mt-2" variant="secondary">ACTIVE</Badge>}
                </CardContent>
              </Card>
            </div>

            {aiModel === 'gemini' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Gemini API Key</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      placeholder="AIza..."
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500">Get your key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">aistudio.google.com</a></p>
              </div>
            )}

            <Button onClick={handleSaveAiSettings} className="w-full">Save AI Settings</Button>
          </CardContent>
        </Card>

        {/* Entity Schema Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Entity Schema Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">Hotel Domain</h3>
                <ul className="space-y-1 text-slate-600">
                  <li>• Guest</li>
                  <li>• Reservation → Guest, Room</li>
                  <li>• Room → Floor</li>
                  <li>• Floor</li>
                  <li>• Invoice → Reservation, Guest</li>
                  <li>• RoomControl → Room, Guest</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Services Domain</h3>
                <ul className="space-y-1 text-slate-600">
                  <li>• RoomServiceItem</li>
                  <li>• RoomServiceOrder → Guest, Reservation, Room</li>
                  <li>• ServiceRequest → Guest, Reservation</li>
                  <li>• Feedback → Guest, Reservation</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Conference Domain</h3>
                <ul className="space-y-1 text-slate-600">
                  <li>• ConferenceRoom</li>
                  <li>• ConferenceRoomBooking → Guest, ConferenceRoom</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Parking Domain</h3>
                <ul className="space-y-1 text-slate-600">
                  <li>• Vehicle → Guest, ParkingSpot</li>
                  <li>• ParkingSpot → Vehicle</li>
                  <li>• AccessPass → Guest, Vehicle</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Elevator Domain</h3>
                <ul className="space-y-1 text-slate-600">
                  <li>• Elevator</li>
                  <li>• ElevatorRequest → Guest, Vehicle, Floor, AccessPass, Elevator</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Staff & Loyalty</h3>
                <ul className="space-y-1 text-slate-600">
                  <li>• StaffMember → User</li>
                  <li>• StaffTask → StaffMember, Room, Guest</li>
                  <li>• StaffAlert → StaffMember</li>
                  <li>• LoyaltyPoints → Guest</li>
                  <li>• LoyaltyReward</li>
                  <li>• LoyaltyTransaction → Guest</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Marketing Domain</h3>
                <ul className="space-y-1 text-slate-600">
                  <li>• Campaign → Offer</li>
                  <li>• Notification → Guest, Campaign</li>
                  <li>• Offer</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Analytics Domain</h3>
                <ul className="space-y-1 text-slate-600">
                  <li>• AnalyticsData</li>
                  <li>• PricingRecommendation</li>
                  <li>• MaintenanceAlert → Room</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}