import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';

// Pages
import Dashboard from '@/pages/Dashboard';
import Alerts from '@/pages/Alerts.jsx';
import Activity from '@/pages/Activity';
import Analytics from '@/pages/Analytics';
import CommandCenter from '@/pages/CommandCenter';
import OpsAI from '@/pages/OpsAI';
import Users from '@/pages/Users';
import Settings from '@/pages/Settings';
import AutomationEngine from '@/pages/AutomationEngine';
import Incidents from '@/pages/Incidents';
import SimulationLab from '@/pages/SimulationLab';
import Computers from '@/pages/Computers.jsx';
import WorkspaceControl from '@/pages/WorkspaceControl';
import IncidentResolution from '@/pages/IncidentResolution';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-neon-blue/20 border-t-neon-blue rounded-full animate-spin" />
          <span className="text-xs font-mono text-muted-foreground tracking-widest">OPSGRID INITIALIZING...</span>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/command" element={<CommandCenter />} />
        <Route path="/ai" element={<OpsAI />} />
        <Route path="/automation" element={<AutomationEngine />} />
        <Route path="/simulation" element={<SimulationLab />} />
        <Route path="/computers" element={<Computers />} />
        <Route path="/workspace-control" element={<WorkspaceControl />} />
        <Route path="/incident-resolution" element={<IncidentResolution />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;