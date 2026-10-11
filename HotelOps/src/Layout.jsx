import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Button } from './components/ui/button';
import { 
        LayoutDashboard, 
        UserPlus, 
        ArrowUpDown, 
        Car, 
        AlertTriangle, 
        Settings,
        TrendingUp,
        UtensilsCrossed,
        Award,
        Megaphone,
        Building2,
        MessageSquare
      } from 'lucide-react';
import { cn } from './lib/utils';
import ImpersonationBanner from './components/ImpersonationBanner';

export default function Layout({ children, currentPageName }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(() => {
    return localStorage.getItem('hotelops_admin_authenticated') === 'true';
  });

  // Public pages that don't need authentication
  const publicPages = ['Home', 'AdminLogin', 'GuestKiosk'];
  const isPublicPage = publicPages.includes(currentPageName);

  // If not authenticated and not on a public page, redirect to login
  React.useEffect(() => {
    if (!isAuthenticated && !isPublicPage) {
      window.location.href = createPageUrl('AdminLogin');
    }
  }, [isAuthenticated, isPublicPage]);

  // Don't show layout for public pages
  if (isPublicPage) {
    return children;
  }

  const navigation = [
    { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
    { name: 'Analytics', page: 'Analytics', icon: TrendingUp },
    { name: 'Check-In', page: 'CheckIn', icon: UserPlus },
    { name: 'Messages', page: 'MessageCenter', icon: MessageSquare },
    { name: 'Loyalty', page: 'LoyaltyAdmin', icon: Award },
    { name: 'Marketing', page: 'MarketingAdmin', icon: Megaphone },
    { name: 'Conference Rooms', page: 'ConferenceRoomAdmin', icon: Building2 },
    { name: 'Elevators', page: 'ElevatorControl', icon: ArrowUpDown },
    { name: 'Parking', page: 'ParkingManagement', icon: Car },
    { name: 'Emergency', page: 'EmergencyControl', icon: AlertTriangle },
    { name: 'System Config', page: 'SystemConfig', icon: Settings },
    { name: 'Settings', page: 'Settings', icon: Settings }
  ];

  const handleLogout = () => {
    localStorage.removeItem('hotelops_admin_authenticated');
    window.location.href = createPageUrl('Home');
  };

  return (
    <>
      <ImpersonationBanner />
      <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold">HotelOps</h1>
          <p className="text-xs text-slate-400 mt-1">Enterprise Operations</p>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              
              return (
                <li key={item.page}>
                  <Link
                    to={createPageUrl(item.page)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                      isActive 
                        ? "bg-blue-600 text-white" 
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-3">
          <Button 
            variant="ghost" 
            className="w-full text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={handleLogout}
          >
            Logout
          </Button>
          <div className="text-xs text-slate-400">
            <p>Mode: <span className="text-green-400 font-semibold">
              {localStorage.getItem('hotelops_data_mode') || 'ONLINE'}
            </span></p>
            <p className="mt-1">Version 1.0.0</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
    </>
  );
}