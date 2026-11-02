import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { base44 } from '@/api/base44Client';
import GlobalCommandBar from '@/components/GlobalCommandBar';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [commandBarOpen, setCommandBarOpen] = useState(false);

  useEffect(() => {
    base44.entities.Alert.filter({ status: 'active' }).then(alerts => {
      setAlertCount(alerts.length);
    }).catch(() => {});

    const unsub = base44.entities.Alert.subscribe(() => {
      base44.entities.Alert.filter({ status: 'active' }).then(alerts => {
        setAlertCount(alerts.length);
      }).catch(() => {});
    });
    return () => unsub();
  }, []);

  // Global shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandBarOpen(p => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar
          onToggleSidebar={() => setSidebarCollapsed(p => !p)}
          alertCount={alertCount}
          onOpenCommandBar={() => setCommandBarOpen(true)}
        />
        <main className="flex-1 overflow-auto scrollbar-thin grid-bg">
          <Outlet />
        </main>
      </div>
      {commandBarOpen && <GlobalCommandBar onClose={() => setCommandBarOpen(false)} />}
    </div>
  );
}