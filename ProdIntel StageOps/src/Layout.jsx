import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Theater, 
  Wrench, 
  BookOpen, 
  Zap,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Building2,
  Users,
  ListTodo,
  AlertTriangle,
  Box,
  ClipboardList,
  FileText,
  Shield,
  Search,
  BarChart3,
  MessageSquare,
  ArrowLeft,
  Calendar
} from 'lucide-react';
import NotificationBell from './components/notifications/NotificationBell';
import { cn } from './lib/utils';
import { Button } from './components/ui/button';
import ImpersonationBanner from './components/ImpersonationBanner';

const navItems = [
  { 
    label: 'Dashboard', 
    icon: LayoutDashboard, 
    page: 'Dashboard',
    section: null
  },
  { 
    label: 'My Assignments', 
    icon: Users, 
    page: 'MyAssignments',
    section: null
  },
  { 
    label: 'Productions', 
    icon: Theater, 
    page: 'Productions',
    section: 'production',
    children: [
      { label: 'Productions Dashboard', icon: LayoutDashboard, page: 'ProductionsDashboard' },
      { label: 'All Productions', icon: Theater, page: 'Productions' },
      { label: 'Production Calendar', icon: Calendar, page: 'ProductionCalendar' },
      { label: 'Production Templates', icon: FileText, page: 'ProductionTemplates' },
      { label: 'Venues', icon: Building2, page: 'Venues' },
      { label: 'Crew Directory', icon: Users, page: 'CrewDirectory' },
      { label: 'Crew Members', icon: Users, page: 'CrewMembers' },
      { label: 'Crew Finder', icon: Search, page: 'CrewFinder' },
      { label: 'Crew Assignments', icon: Users, page: 'CrewAssignments' },
      { label: 'Tasks', icon: ListTodo, page: 'Tasks' },
      { label: 'Incidents', icon: AlertTriangle, page: 'Incidents' },
    ]
  },
  { 
    label: 'Equipment', 
    icon: Wrench, 
    page: 'Equipment',
    section: 'equipment',
    children: [
      { label: 'Assets', icon: Box, page: 'Equipment' },
      { label: 'Scheduling', icon: ListTodo, page: 'EquipmentScheduling' },
      { label: 'Maintenance', icon: ClipboardList, page: 'Maintenance' },
      { label: 'Locations', icon: Building2, page: 'AssetLocations' },
    ]
  },
  { 
    label: 'Knowledge', 
    icon: BookOpen, 
    page: 'Knowledge',
    section: 'knowledge',
    children: [
      { label: 'Knowledge Base', icon: BookOpen, page: 'Knowledge' },
      { label: 'Procedures', icon: FileText, page: 'Procedures' },
      { label: 'Cue Docs', icon: ClipboardList, page: 'CueDocs' },
    ]
  },
  { 
    label: 'Automation', 
    icon: Zap, 
    page: 'Automation',
    section: 'automation'
  },
  { 
    label: 'Communication', 
    icon: MessageSquare, 
    page: 'CommunicationHub',
    section: null
  },
  { 
    label: 'Reports', 
    icon: BarChart3, 
    page: 'Reports',
    section: null
  },
  { 
    label: 'Admin Settings', 
    icon: Shield, 
    page: 'AdminSettings',
    section: null
  },
];

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const navigate = useNavigate();

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Mobile bottom navigation items
  const bottomNavItems = [
    { label: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
    { label: 'Productions', icon: Theater, page: 'Productions' },
    { label: 'Equipment', icon: Wrench, page: 'Equipment' },
    { label: 'Knowledge', icon: BookOpen, page: 'Knowledge' },
  ];

  // Check if current page is a child page (not in bottom nav)
  const isChildPage = !bottomNavItems.some(item => item.page === currentPageName);

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Theater className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-bold text-white text-lg">prodIntel</span>
              <span className="text-xs text-slate-400 block -mt-1">StageOps</span>
            </div>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPageName === item.page || 
            (item.children && item.children.some(c => c.page === currentPageName));
          const isExpanded = expandedSection === item.section;

          return (
            <div key={item.label}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleSection(item.section)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                      isActive 
                        ? "bg-slate-700/50 text-white" 
                        : "text-slate-300 hover:bg-slate-700/30 hover:text-white"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronRight className={cn(
                          "w-4 h-4 transition-transform",
                          isExpanded && "rotate-90"
                        )} />
                      </>
                    )}
                  </button>
                  {!collapsed && isExpanded && (
                    <div className="bg-slate-800/50 py-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = currentPageName === child.page;
                        return (
                          <Link
                            key={child.page}
                            to={createPageUrl(child.page)}
                            className={cn(
                              "flex items-center gap-3 pl-12 pr-4 py-2 text-sm transition-colors",
                              isChildActive
                                ? "bg-blue-600/20 text-blue-400 border-r-2 border-blue-500"
                                : "text-slate-400 hover:bg-slate-700/30 hover:text-white"
                            )}
                          >
                            <ChildIcon className="w-4 h-4" />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={createPageUrl(item.page)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-blue-600/20 text-blue-400 border-r-2 border-blue-500"
                      : "text-slate-300 hover:bg-slate-700/30 hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse Toggle (Desktop) */}
      <div className="hidden lg:block border-t border-slate-700 p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full text-slate-400 hover:text-white hover:bg-slate-700"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <ImpersonationBanner />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950" style={{
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      overscrollBehavior: 'none'
    }}>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 dark:bg-slate-950 flex items-center justify-between px-4 z-50" style={{
        paddingTop: 'env(safe-area-inset-top)',
        userSelect: 'none'
      }}>
        <div className="flex items-center gap-2">
          {isChildPage ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Theater className="w-5 h-5 text-white" />
            </div>
          )}
          <span className="font-bold text-white">prodIntel</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          {!isChildPage && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-white"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Mobile drawer + Desktop */}
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-slate-900 dark:bg-slate-950 z-50 transition-all duration-300",
        "lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        collapsed ? "lg:w-16 w-64" : "w-64"
      )} style={{ userSelect: 'none' }}>
        <NavContent />
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 dark:bg-slate-950 border-t border-slate-700 z-50" style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        userSelect: 'none'
      }}>
        <div className="grid grid-cols-4 h-16">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors",
                  isActive 
                    ? "text-blue-400" 
                    : "text-slate-400 active:text-slate-300"
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300 min-h-screen",
        "pt-14 pb-16 lg:pt-0 lg:pb-0",
        collapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        {/* Desktop Header with Notification Bell */}
        <div className="hidden lg:flex h-14 border-b bg-white dark:bg-slate-900 items-center justify-end px-6">
          <NotificationBell />
        </div>
        <div className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPageName}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
    </>
  );
}