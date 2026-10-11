import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import StudentLayout from './components/StudentLayout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Classes from './pages/Classes';
import Attendance from './pages/Attendance';
import Promotions from './pages/Promotions';
import Payments from './pages/Payments';
import Announcements from './pages/Announcements';
import BeltConfig from './pages/BeltConfig';
import Accounts from './pages/Accounts';
import EvaluationReport from './pages/EvaluationReport';
import CheckInStation from './pages/CheckInStation';
import CheckInScan from './pages/CheckInScan';
import Inventory from './pages/Inventory';
import SparringMatches from './pages/SparringMatches';
import PortalSparring from './pages/PortalSparring';
import StudentPortal from './pages/StudentPortal';
import PortalAnnouncements from './pages/PortalAnnouncements';
import PortalSchedule from './pages/PortalSchedule';
import PortalPayments from './pages/PortalPayments';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user: currentUser } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Route by role
  const isAdmin = currentUser?.role === 'admin';

  return (
    <Routes>
      {isAdmin ? (
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/belt-config" element={<BeltConfig />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/evaluation-report" element={<EvaluationReport />} />
          <Route path="/checkin-station" element={<CheckInStation />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sparring" element={<SparringMatches />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      ) : (
        <Route element={<StudentLayout />}>
          <Route path="/" element={<StudentPortal />} />
          <Route path="/portal" element={<StudentPortal />} />
          <Route path="/checkin" element={<CheckInScan />} />
          <Route path="/portal/sparring" element={<PortalSparring />} />
          <Route path="/portal/announcements" element={<PortalAnnouncements />} />
          <Route path="/portal/schedule" element={<PortalSchedule />} />
          <Route path="/portal/payments" element={<PortalPayments />} />
          <Route path="*" element={<StudentPortal />} />
        </Route>
      )}
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
  )
}

export default App