// @ts-nocheck
import * as React from 'react';
const { useState, useEffect, useRef, useCallback, useMemo } = React;
{/* @ts-ignore */}
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, Lock, Unlock,
  Radio, Cpu, Database, Wifi, Power, Activity, Terminal,
  Clock, AlertOctagon, ChevronRight, RotateCcw, Zap, LogOut, Play,
  ShieldCheck, User, X, Eye, EyeOff
} from 'lucide-react';
// @ts-ignore
import { 
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';
import { dataProvider as base44 } from '../components/data/DataProvider';
{/* @ts-ignore */}
import { AnimatePresence } from 'framer-motion';
import AdminAuthentication from '../components/admin/AdminAuthentication';
import UserManagement from '../components/admin/UserManagement';
import AuditLogViewer from '../components/admin/AuditLogViewer';
import ScenarioManager from '../components/admin/ScenarioManager';
import FaultInjector from '../components/admin/FaultInjector';
import EnvironmentPanel from '../components/admin/EnvironmentPanel';
import SystemMonitor from '../components/admin/SystemMonitor';
import AIScenarioGenerator from '../components/admin/AIScenarioGenerator';
import SubsystemHealthMonitor from '../components/admin/SubsystemHealthMonitor';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import { Panel } from '../components/simulator/Panel';
import InteractiveSystemDiagram from '../components/simulator/InteractiveSystemDiagram';
import GlobalMap from '../components/simulator/GlobalMap';
import PreflightChecklist from '../components/simulator/PreflightChecklist';
import DefconStatus from '../components/simulator/DefconStatus';
import PostMissionDebrief from '../components/simulator/PostMissionDebrief';
import CommandCenterChat from '../components/simulator/CommandCenterChat';
import SASCodePuzzler from '../components/simulator/SASCodePuzzler';
import { soundManager } from '../utils/SoundManager';

// System States
const STATES = {
  OFFLINE: 'OFFLINE',
  INITIALIZING: 'INITIALIZING',
  READY: 'READY',
  HOLD: 'HOLD',
  DEGRADED: 'DEGRADED',
  FAILED: 'FAILED',
  AUTHORIZED: 'AUTHORIZED',
  COUNTDOWN: 'COUNTDOWN',
  ABORTED: 'ABORTED',
  COMPLETE: 'COMPLETE'
};

// Diagnostic Subsystems
const SUBSYSTEMS = [
  { id: 'reactor', name: 'Reactor Core', icon: Zap },
  { id: 'targeting', name: 'Targeting System', icon: Radio },
  { id: 'comms', name: 'Communications', icon: Wifi },
  { id: 'guidance', name: 'Guidance Computer', icon: Cpu },
  { id: 'datalink', name: 'Data Link', icon: Database },
  { id: 'power', name: 'Power Distribution', icon: Power }
];

// Status Indicator Component
const StatusIndicator = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };
  
  const colorClasses = {
    [STATES.OFFLINE]: 'bg-gray-600',
    [STATES.INITIALIZING]: 'bg-amber-500 animate-pulse',
    [STATES.READY]: 'bg-green-500',
    [STATES.HOLD]: 'bg-yellow-500 animate-pulse',
    [STATES.DEGRADED]: 'bg-orange-500',
    [STATES.FAILED]: 'bg-red-500',
    [STATES.AUTHORIZED]: 'bg-green-400 animate-pulse',
    [STATES.COUNTDOWN]: 'bg-red-500 animate-pulse',
    [STATES.ABORTED]: 'bg-red-600',
    [STATES.COMPLETE]: 'bg-blue-500'
  };
  
  return (
    <div className={`${sizeClasses[size]} ${colorClasses[status] || 'bg-gray-600'} rounded-full shadow-lg`} 
         style={{ boxShadow: `0 0 8px ${status === STATES.READY ? '#22c55e' : status === STATES.FAILED ? '#ef4444' : status === STATES.AUTHORIZED ? '#4ade80' : 'transparent'}` }} 
    />
  );
};



// Console Log Entry
const LogEntry = ({ timestamp, level, message, isAdmin }) => {
  const levelColors = {
    info: 'text-gray-400',
    success: 'text-green-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
    system: 'text-cyan-400'
  };
  
  return (
    <div className={`flex gap-3 text-xs font-mono py-0.5 ${isAdmin ? 'bg-orange-500/10 rounded px-2' : ''}`}>
      <span className="text-gray-600">{timestamp}</span>
      <span className={`${levelColors[level]} uppercase w-16`}>[{level}]</span>
      {isAdmin && <span className="text-orange-400 uppercase w-16">[ADMIN]</span>}
      <span className="text-gray-300">{message}</span>
    </div>
  );
};

export default function Simulator({ onClose = () => {}, onHealthOverride = () => {} }) {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [adminAccessControl, setAdminAccessControl] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [sessionExpiresAt, setSessionExpiresAt] = useState(null);
  const [showAuthError, setShowAuthError] = useState(false);
  
  // Core System State
  const [systemState, setSystemState] = useState(STATES.OFFLINE);
  const [currentPhase, setCurrentPhase] = useState(0); // 0: Init, 1: Diag, 2: Auth, 3: Validate, 4: Authorize, 5: Launch
  const [logs, setLogs] = useState([]);
  const [diagnostics, setDiagnostics] = useState({});
  const [authCode1, setAuthCode1] = useState('');
  const [authCode2, setAuthCode2] = useState('');
  const [authVerified, setAuthVerified] = useState([false, false]);
  const [commandValidated, setCommandValidated] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [countdownActive, setCountdownActive] = useState(false);
  const [faultInjection, setFaultInjection] = useState(false);
  const [targetCoords, setTargetCoords] = useState({ lat: '', lon: '' });
  const launchCoords = useMemo(() => ({ lat: 48.4239, lon: -101.3129 }), []); // Minot AFB
  const [keyTurn1, setKeyTurn1] = useState(false);
  const [keyTurn2, setKeyTurn2] = useState(false);
  const [diagnosticsComplete, setDiagnosticsComplete] = useState(false);
  
  // Administrator State
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [systemLocked, setSystemLocked] = useState(false);
  const [softHold, setSoftHold] = useState(false);
  const [delayMultiplier, setDelayMultiplier] = useState(1.0);
  const [runId, setRunId] = useState(() => 
    'RUN-' + Math.random().toString(36).substring(2, 10).toUpperCase()
  );
  // Admin Auth State
  const [adminEmail, setAdminEmail] = useState('admin@centcom.com');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // DEFCON State (Feature 6)
  const [defconLevel, setDefconLevel] = useState(5);
  
  // SAS Code Mode (Feature 8)
  const [useSASMode, setUseSASMode] = useState(false);
  const [sasVerified, setSasVerified] = useState([false, false]);
  
  const [trainingCodes, setTrainingCodes] = useState(['ALPHA-7742', 'BRAVO-9918']);
  const [systemTitle, setSystemTitle] = useState('STRATEGIC COMMAND SIMULATOR');
  const [classificationText, setClassificationText] = useState('CLASSIFICATION: UNCLASSIFIED // FOR TRAINING USE ONLY');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [passwordPromptShown, setPasswordPromptShown] = useState(false);
  
  // Scenario Management State
  const [scenarios, setScenarios] = useState([]);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [currentPerformance, setCurrentPerformance] = useState(null);
  
  // Enhanced Fault Injection State
  const [faultConfig, setFaultConfig] = useState({});
  
  // Pre-flight & Post-mission State
  const [showPreflight, setShowPreflight] = useState(false);
  const [showDebrief, setShowDebrief] = useState(false);
  const [checklistData, setChecklistData] = useState(null);
  const [missionStartTime, setMissionStartTime] = useState(null);
  
  // Environment State
  const [environmentFactors, setEnvironmentFactors] = useState({
    weather: { id: 'clear', name: 'Clear', degradation: 0 },
    timePeriod: { id: 'day', name: 'Day', modifier: 1.0 },
    temperature: 22,
    overallModifier: 1.0
  });
  
  const logRef = useRef(null);
  const countdownRef = useRef(null);
  const performanceStartTime = useRef(null);
  const sessionCheckInterval = useRef(null);

  // Check and initialize authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (user.role !== 'admin') {
          setShowAuthError(true);
          return;
        }

        // Log admin login
        try {
          await base44.entities.AdminAuditLog.create({
            action: 'LOGIN',
            performedBy: user.email,
            success: true
          });
        } catch (err) {
          console.error('Failed to log login:', err);
        }

        setShowAuthError(false);
      } catch (err) {
        setShowAuthError(true);
      }
    };

    checkAuth();
  }, []);

  // Session management - check every minute
  useEffect(() => {
    if (!currentUser || !adminAccessControl) return;

    sessionCheckInterval.current = setInterval(async () => {
      try {
        const accessControl = await base44.entities.AdminAccessControl.filter(
          { userEmail: currentUser.email },
          '-created_date',
          1
        );

        if (!accessControl || !accessControl[0]?.adminAccessEnabled) {
          // Admin access was revoked
          adminLogout();
          return;
        }

        const control = accessControl[0];

        // Check session expiration
        if (control.sessionExpiresAt && new Date(control.sessionExpiresAt) < new Date()) {
          addLog('error', 'Admin session expired', true);
          adminLogout();
          return;
        }

        // Check temporary access restriction
        if (control.accessDisabledUntil && new Date(control.accessDisabledUntil) > new Date()) {
          addLog('error', 'Admin access temporarily disabled', true);
          adminLogout();
          return;
        }

        // Update last activity time
        await base44.entities.AdminAccessControl.update(control.id, {
          lastActivityTime: new Date().toISOString()
        });
      } catch (err) {
        console.error('Session check error:', err);
      }
    }, 60000); // Check every minute

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [currentUser, adminAccessControl]);
  
  // Add log entry
  const addLog = useCallback((level, message, isAdmin = false) => {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    setLogs(prev => [...prev, { timestamp, level, message, id: Date.now() + Math.random(), isAdmin }]);
  }, []);

  // Effect to update global theme based on DEFCON level
  // Effect to update global theme based on DEFCON level
  useEffect(() => {
    // Reset classes
    document.body.classList.remove('defcon-5', 'defcon-4', 'defcon-3', 'defcon-2', 'defcon-1');
    // Add current class
    document.body.classList.add(`defcon-${defconLevel}`);
    
    // Play sound effect
    soundManager.playDefconChange(defconLevel);
  }, [defconLevel]);

  // Log auto-scroll effect
  const logEndRef = useRef(null);
  
  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Password prompt removed - using DB auth
  /*
  useEffect(() => {
    if (!passwordPromptShown) {
      setPasswordPromptShown(true);
      // ... prompt removed
    }
  }, [passwordPromptShown]);
  */
  
  // Start mission with preflight checklist
  const startMission = () => {
    setShowPreflight(true);
  };

  // Handle preflight completion
  const handlePreflightComplete = (data) => {
    setChecklistData(data);
    setShowPreflight(false);
    setMissionStartTime(Date.now());
    addLog('system', 'Pre-flight checklist complete. Initiating mission...', false);
    initializeSystem();
  };

  // System Initialization
  const initializeSystem = async () => {
    if (systemLocked) {
      addLog('error', 'Operation blocked: System is locked by administrator');
      return;
    }
    if (softHold) {
      addLog('warning', 'Operation blocked: System in administrative HOLD state');
      return;
    }
    
    if (!missionStartTime) {
      setMissionStartTime(Date.now());
    }
    
    setSystemState(STATES.INITIALIZING);
    addLog('system', 'Initiating system boot sequence...');
    
    await delay(800 * delayMultiplier);
    addLog('info', 'Loading kernel modules...');
    await delay(600 * delayMultiplier);
    addLog('info', 'Establishing secure connections...');
    await delay(700 * delayMultiplier);
    addLog('info', 'Mounting encrypted storage...');
    await delay(500 * delayMultiplier);
    addLog('success', 'Core systems online');
    
    setSystemState(STATES.READY);
    setCurrentPhase(1);
    addLog('system', 'System ready. Awaiting diagnostic sequence.');
  };
  
  // Run Diagnostics with Enhanced Fault Injection
  const runDiagnostics = async (adminOverride = null) => {
    if (systemLocked && !adminOverride) {
      addLog('error', 'Operation blocked: System is locked by administrator');
      return;
    }
    if (softHold && !adminOverride) {
      addLog('warning', 'Operation blocked: System in administrative HOLD state');
      return;
    }
    
    setSystemState(STATES.INITIALIZING);
    addLog('system', adminOverride ? 'Administrator initiated diagnostic sequence...' : 'Initiating comprehensive diagnostics...', !!adminOverride);
    
    const newDiagnostics = {};
    
    for (const subsystem of SUBSYSTEMS) {
      await delay((600 + Math.random() * 400) * delayMultiplier);
      addLog('info', `Scanning ${subsystem.name}...`, !!adminOverride);
      
      // Determine status with enhanced fault injection
      let status;
      const fault = faultConfig[subsystem.id];
      
      if (adminOverride && adminOverride[subsystem.id]) {
        // Admin override takes precedence
        status = adminOverride[subsystem.id];
      } else if (fault) {
        // Apply configured fault
        if (fault.type === 'HARD_FAILURE') {
          status = 'FAILED';
          addLog('warning', `Injected hard failure on ${subsystem.name}`, true);
        } else if (fault.type === 'INTERMITTENT') {
          const failureRoll = Math.random();
          if (failureRoll < fault.probability) {
            status = 'FAILED';
            addLog('warning', `Intermittent failure triggered on ${subsystem.name}`, true);
          } else {
            status = 'PASS';
          }
        } else if (fault.type === 'SENSOR_DRIFT') {
          status = 'DEGRADED';
          addLog('warning', `Sensor drift detected on ${subsystem.name}`, true);
        } else if (fault.type === 'LOGIC_ERROR') {
          status = 'DEGRADED';
          addLog('warning', `Logic error injected on ${subsystem.name}`, true);
        }
      } else if (faultInjection && subsystem.id === 'comms') {
        // Legacy fault injection
        status = 'FAILED';
      } else {
        // Random failure
        const rand = Math.random();
        if (rand > 0.92) {
          status = 'FAILED';
        } else if (rand > 0.85) {
          status = 'DEGRADED';
        } else {
          status = 'PASS';
        }
      }
      
      newDiagnostics[subsystem.id] = status;
      setDiagnostics(prev => ({ ...prev, [subsystem.id]: status }));
      
      if (status === 'PASS') {
        addLog('success', `${subsystem.name}: OPERATIONAL`, !!adminOverride);
      } else if (status === 'DEGRADED') {
        addLog('warning', `${subsystem.name}: DEGRADED - Operating at reduced capacity`, !!adminOverride);
      } else {
        addLog('error', `${subsystem.name}: FAILED - Critical fault detected`, !!adminOverride);
      }
    }
    
    await delay(500 * delayMultiplier);
    
    // Evaluate overall status
    const hasFailed = Object.values(newDiagnostics).includes('FAILED');
    const hasDegraded = Object.values(newDiagnostics).includes('DEGRADED');
    
    if (hasFailed) {
      setSystemState(STATES.FAILED);
      setDiagnosticsComplete(false);
      addLog('error', 'DIAGNOSTIC FAILURE - System cannot proceed. Manual intervention required.', !!adminOverride);
    } else if (hasDegraded) {
      setSystemState(STATES.DEGRADED);
      setDiagnosticsComplete(true);
      addLog('warning', 'Diagnostics complete with warnings. Verification required to proceed.', !!adminOverride);
    } else {
      setSystemState(STATES.READY);
      setDiagnosticsComplete(true);
      addLog('success', 'All diagnostics passed. Verification required to proceed.', !!adminOverride);
    }
  };
  
  // Verify Diagnostics
  const verifyDiagnostics = () => {
    if (systemLocked) {
      addLog('error', 'Operation blocked: System is locked by administrator');
      return;
    }
    if (softHold) {
      addLog('system', 'Operation blocked: System in administrative HOLD state');
      return;
    }
    
    addLog('system', 'Diagnostics verified by operator. Advancing to authentication phase.');
    setCurrentPhase(2);
    setDiagnosticsComplete(false);
  };
  
  // Verify Authentication
  const verifyAuth = (slot) => {
    if (systemLocked) {
      addLog('error', 'Operation blocked: System is locked by administrator');
      return;
    }
    if (softHold) {
      addLog('system', 'Operation blocked: System in administrative HOLD state');
      return;
    }
    
    const code = slot === 1 ? authCode1 : authCode2;
    
    addLog('info', `Verifying authorization code ${slot}...`);
    
    setTimeout(() => {
      if (trainingCodes.map(c => c.toUpperCase()).includes(code.toUpperCase())) {
        const newAuthVerified = [...authVerified];
        newAuthVerified[slot - 1] = true;
        setAuthVerified(newAuthVerified);
        addLog('success', `Authorization code ${slot} verified`);
        
        if (newAuthVerified[0] && newAuthVerified[1]) {
          setCurrentPhase(3);
          addLog('system', 'Dual authentication complete. Command validation required.');
        }
      } else {
        addLog('error', `Authorization code ${slot} INVALID`);
      }
    }, 800 * delayMultiplier);
  };
  
  // Validate Command
  const validateCommand = () => {
    if (systemLocked) {
      addLog('error', 'Operation blocked: System is locked by administrator');
      return;
    }
    if (softHold) {
      addLog('system', 'Operation blocked: System in administrative HOLD state');
      return;
    }
    
    if (!targetCoords.lat || !targetCoords.lon) {
      addLog('error', 'Target coordinates required');
      return;
    }
    
    addLog('info', 'Validating command parameters...');
    
    setTimeout(() => {
      addLog('info', `Target coordinates: ${targetCoords.lat}°N, ${targetCoords.lon}°E`);
      addLog('info', 'Trajectory calculation in progress...');
      
      setTimeout(() => {
        addLog('success', 'Command parameters validated');
        addLog('success', 'Flight path calculated and confirmed');
        setCommandValidated(true);
        setCurrentPhase(4);
        addLog('system', 'Proceed to final authorization sequence.');
      }, 1000 * delayMultiplier);
    }, 800 * delayMultiplier);
  };
  
  // Key Turn Handler
  const handleKeyTurn = (key) => {
    if (systemLocked) {
      addLog('error', 'Operation blocked: System is locked by administrator');
      return;
    }
    if (softHold) {
      addLog('system', 'Operation blocked: System in administrative HOLD state');
      return;
    }
    
    if (key === 1) {
      setKeyTurn1(true);
      addLog('info', 'Key position 1: ARMED');
    } else {
      setKeyTurn2(true);
      addLog('info', 'Key position 2: ARMED');
    }
    
    if ((key === 1 && keyTurn2) || (key === 2 && keyTurn1)) {
      setTimeout(() => {
        setSystemState(STATES.AUTHORIZED);
        setCurrentPhase(5);
        addLog('system', '*** LAUNCH AUTHORIZED ***');
        addLog('system', 'Standing by for final launch command');
      }, 500 * delayMultiplier);
    }
  };
  
  // Initiate Launch Sequence
  const initiateLaunch = () => {
    if (systemLocked) {
      addLog('error', 'Operation blocked: System is locked by administrator');
      return;
    }
    if (softHold) {
      addLog('warning', 'Operation blocked: System in administrative HOLD state');
      return;
    }
    
    setCountdownActive(true);
    setSystemState(STATES.COUNTDOWN);
    addLog('system', '*** LAUNCH SEQUENCE INITIATED ***');
    addLog('system', 'T-10 seconds to launch');
    
    let count = 10;
    countdownRef.current = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count === 5) addLog('system', 'Final safety interlocks releasing');
      if (count === 3) addLog('system', 'Ignition sequence start');
      if (count === 1) addLog('system', 'Main engine ignition');
      
      if (count <= 0) {
        clearInterval(countdownRef.current);
        setCountdownActive(false);
        setSystemState(STATES.COMPLETE);
        addLog('system', '*** LAUNCH EXECUTED ***');
        addLog('info', 'Missile away. Tracking initiated.');
        
        // Save to DB
        saveMissionPerformance('completed');

        // Show debrief after short delay
        setTimeout(() => {
          setShowDebrief(true);
        }, 2000);
      }
    }, 1000 * delayMultiplier);
  };
  
  // Abort Sequence
  const abortSequence = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    setCountdownActive(false);
    setSystemState(STATES.ABORTED);
    addLog('error', '*** LAUNCH ABORTED ***');
    addLog('system', 'All systems holding. Safe mode engaged.');
    
    // Save to DB
    saveMissionPerformance('aborted');

    // Show debrief after abort
    setTimeout(() => {
      setShowDebrief(true);
    }, 1500);
  };
  
  // Reset System
  const resetSystem = (isAdminReset = false) => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    const newRunId = 'RUN-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setRunId(newRunId);
    
    setSystemState(STATES.OFFLINE);
    setCurrentPhase(0);
    setLogs([]);
    setDiagnostics({});
    setAuthCode1('');
    setAuthCode2('');
    setAuthVerified([false, false]);
    setCommandValidated(false);
    setCountdown(10);
    setCountdownActive(false);
    setTargetCoords({ lat: '', lon: '' });
    setKeyTurn1(false);
    setKeyTurn2(false);
    setDiagnosticsComplete(false);
    setSystemLocked(false);
    setSoftHold(false);
    setChecklistData(null);
    setMissionStartTime(null);
    setShowDebrief(false);
    
    if (isAdminReset) {
      setTimeout(() => {
        addLog('system', `Administrator initiated system reset - New Run ID: ${newRunId}`, true);
      }, 100);
    }
  };
  
  // Admin Authentication
  const authenticateAdmin = async () => {
    try {
      addLog('system', 'Verifying administrator credentials...', true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: adminEmail,
          password: adminPasswordInput 
        })
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 50)}...`);
      }

      if (response.ok && data.success) {
        setAdminAuthenticated(true);
        setAdminPanelOpen(true);
        setShowLoginModal(false);
        addLog('system', '*** ADMINISTRATOR ACCESS GRANTED ***', true);
        addLog('warning', 'Elevated privileges active - All actions logged', true);
        // Clear password for security
        setAdminPasswordInput('');
      } else {
        addLog('error', `Authentication failed: ${data?.error || 'Unknown error'}`, true);
      }
    } catch (err) {
      console.error('Auth Error:', err);
      addLog('error', 'Auth System Error: ' + err.message, true);
    }
  };
  
  // Admin Logout
  const adminLogout = () => {
    // Log logout
    if (currentUser) {
      base44.entities.AdminAuditLog.create({
        action: 'LOGOUT',
        performedBy: currentUser.email,
        success: true
      }).catch(err => console.error('Failed to log logout:', err));
    }

    setAdminAuthenticated(false);
    setAdminPanelOpen(false);
    addLog('system', 'Administrator session terminated', true);
  };

  // Disable own admin access
  const disableOwnAccess = async () => {
    if (!window.confirm('Are you sure? You will lose access to the admin panel.')) {
      return;
    }

    try {
      if (adminAccessControl) {
        await base44.entities.AdminAccessControl.update(adminAccessControl.id, {
          adminAccessEnabled: false,
          accessDisabledReason: 'Disabled by user'
        });
      }

      await base44.entities.AdminAuditLog.create({
        action: 'ADMIN_DISABLED',
        performedBy: currentUser.email,
        targetUser: currentUser.email,
        details: { reason: 'Self-disabled' }
      });

      addLog('warning', 'Your admin access has been disabled', true);
      adminLogout();
    } catch (err) {
      addLog('error', `Failed to disable access: ${err.message}`, true);
    }
  };
  
  // Admin Lock System
  const adminLockSystem = (lockType) => {
    addLog('system', `Administrator ${lockType === 'soft' ? 'SOFT' : 'HARD'} LOCK engaged`, true);
    if (lockType === 'soft') {
      setSoftHold(true);
      addLog('warning', 'System placed in HOLD state - Operator actions suspended', true);
    } else {
      setSystemLocked(true);
      addLog('error', 'System HARD LOCKED - All operator actions disabled', true);
    }
  };
  
  // Admin Unlock System
  const adminUnlockSystem = () => {
    addLog('system', 'Administrator UNLOCK - Resuming normal operation', true);
    setSystemLocked(false);
    setSoftHold(false);
  };
  
  // Admin Force Diagnostics
  const adminForceDiagnostics = (overrides) => {
    addLog('system', 'Administrator forcing diagnostic execution with overrides', true);
    runDiagnostics(overrides);
  };
  
  // Export Logs
  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.isAdmin ? '[ADMIN] ' : ''}[${log.level.toUpperCase()}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulator-log-${runId}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLog('info', 'Event log exported to file', true);
  };
  
  // Scenario Management Functions
  const createScenario = (scenarioData) => {
    const newScenario = {
      ...scenarioData,
      id: 'SCN-' + Date.now().toString(36).toUpperCase(),
      createdDate: new Date().toISOString(),
      diagnosticOverrides: { ...diagnostics },
      faultConfig: { ...faultConfig }
    };
    setScenarios(prev => [...prev, newScenario]);
    addLog('system', `Scenario created: ${newScenario.name}`, true);
  };
  
  const loadScenario = (scenario) => {
    setCurrentScenario(scenario);
    setFaultConfig(scenario.faultConfig || {});
    
    // Start performance tracking
    const perfRecord = {
      scenarioId: scenario.id,
      runId,
      startTime: Date.now(),
      completedSteps: 0,
      errors: [],
      completed: false
    };
    setCurrentPerformance(perfRecord);
    performanceStartTime.current = Date.now();
    
    addLog('system', `Scenario loaded: ${scenario.name}`, true);
    addLog('info', `Training objective: ${scenario.description}`, true);
  };
  
  const deleteScenario = (scenarioId) => {
    if (window.confirm('Delete this scenario?')) {
      setScenarios(prev => prev.filter(s => s.id !== scenarioId));
      if (currentScenario?.id === scenarioId) {
        setCurrentScenario(null);
      }
      addLog('system', 'Scenario deleted', true);
    }
  };
  
  const exportScenario = (scenario) => {
    const json = JSON.stringify(scenario, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenario-${scenario.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog('info', `Scenario exported: ${scenario.name}`, true);
  };

  // Export debrief report
  const exportDebriefReport = () => {
    const report = {
      missionId: runId,
      scenario: currentScenario?.name || 'Standard Training',
      completedAt: new Date().toISOString(),
      duration: missionStartTime ? Date.now() - missionStartTime : 0,
      finalState: systemState,
      diagnostics,
      checklistData,
      logs: logs.map(l => ({
        timestamp: l.timestamp,
        level: l.level,
        message: l.message,
        isAdmin: l.isAdmin
      }))
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debrief-${runId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLog('info', 'Debrief report exported', true);
  };
  
  const importScenario = (scenario) => {
    const imported = {
      ...scenario,
      id: 'SCN-' + Date.now().toString(36).toUpperCase(),
      createdDate: new Date().toISOString()
    };
    setScenarios(prev => [...prev, imported]);
    addLog('system', `Scenario imported: ${imported.name}`, true);
  };
  
  // Save mission performance to database
  const saveMissionPerformance = async (status) => {
    const completionTime = missionStartTime ? Date.now() - missionStartTime : 0;
    const errorLogs = logs.filter(l => l.level === 'error');
    const warningLogs = logs.filter(l => l.level === 'warning');
    
    // Calculate score
    const baselineTime = 300000;
    const timeScore = Math.max(0, Math.min(100, 100 - ((completionTime - baselineTime) / baselineTime) * 50));
    const errorScore = Math.max(0, 100 - (errorLogs.length * 10) - (warningLogs.length * 5));
    const checklistScore = checklistData 
      ? (checklistData.items.filter(i => i.checked).length / checklistData.items.length) * 100
      : 100;
    const completionScore = status === 'completed' ? 100 : status === 'aborted' ? 30 : 0;
    const score = Math.round((timeScore * 0.2) + (errorScore * 0.3) + (checklistScore * 0.2) + (completionScore * 0.3));
    
    // Identify failure points
    const failurePoints = Object.entries(diagnostics)
      .filter(([_, status]) => status === 'FAILED' || status === 'DEGRADED')
      .map(([subsystem]) => subsystem);

    try {
      await base44.entities.MissionPerformance.create({
        scenarioId: currentScenario?.id || 'default',
        scenarioName: currentScenario?.name || 'Standard Training',
        difficulty: currentScenario?.difficulty || 'medium',
        category: currentScenario?.category || 'training',
        completionStatus: status,
        score,
        completionTime,
        phaseReached: currentPhase,
        errorCount: errorLogs.length,
        warningCount: warningLogs.length,
        failurePoints,
        checklistCompletion: checklistData 
          ? Math.round((checklistData.items.filter(i => i.checked).length / checklistData.items.length) * 100)
          : 100,
        diagnosticResults: diagnostics,
        environmentConditions: environmentFactors
      });
      
      // Update scenario play count if applicable
      if (currentScenario?.id && typeof currentScenario.id === 'string' && !currentScenario.id.startsWith('SCN-')) {
        const newPlays = (currentScenario.timesPlayed || 0) + 1;
        const newAvg = currentScenario.avgScore 
          ? ((currentScenario.avgScore * currentScenario.timesPlayed) + score) / newPlays
          : score;
        await base44.entities.MissionScenario.update(currentScenario.id, {
          timesPlayed: newPlays,
          avgScore: Math.round(newAvg)
        });
      }
    } catch (err) {
      console.error('Failed to save performance:', err);
    }
  };

  // Track Performance
  useEffect(() => {
    if (currentPerformance && !currentPerformance.completed) {
      // Update completed steps based on phase
      setCurrentPerformance(prev => ({
        ...prev,
        completedSteps: currentPhase
      }));
      
      // Check for completion
      if (systemState === STATES.COMPLETE) {
        const completionTime = Date.now() - performanceStartTime.current;
        const finalRecord = {
          ...currentPerformance,
          completed: true,
          completionTime,
          finalPhase: currentPhase
        };
        setPerformanceData(prev => [...prev, finalRecord]);
        setCurrentPerformance(null);
        addLog('system', `Training scenario completed in ${Math.round(completionTime/1000)}s`, true);
        saveMissionPerformance('completed');
      }
    }
  }, [currentPhase, systemState, currentPerformance]);

  // Save performance on abort
  useEffect(() => {
    if (systemState === STATES.ABORTED && missionStartTime) {
      saveMissionPerformance('aborted');
    }
  }, [systemState]);
  
  // Utility delay function
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Authentication check
  if (showAuthError && !currentUser) {
    return (
      <AdminAuthentication
        onAuthenticationSuccess={(user, accessControl) => {
          setCurrentUser(user);
          setAdminAccessControl(accessControl);
          setIsSuperAdmin(accessControl?.isSuperAdmin || false);
          setSessionExpiresAt(new Date(Date.now() + 8 * 3600000)); // 8 hour session
          setShowAuthError(false);
          addLog('system', `Welcome ${user.full_name}`, true);
        }}
        onAuthenticationFailed={(error) => {
          addLog('error', `Authentication failed: ${error}`, true);
        }}
      />
    );
  }

  if (!currentUser) {
    return (
      <AdminAuthentication
        onAuthenticationSuccess={(user, accessControl) => {
          setCurrentUser(user);
          setAdminAccessControl(accessControl);
          setIsSuperAdmin(accessControl?.isSuperAdmin || false);
          setShowAuthError(false);
        }}
        onAuthenticationFailed={(error) => {
          setShowAuthError(true);
        }}
      />
    );
  }
  
  return (
    <div className="min-h-screen bg-transparent text-gray-200 font-mono transition-colors duration-1000">
      {/* Pre-flight Checklist Modal */}
      {/* @ts-ignore */}
      <AnimatePresence>
        {showPreflight && (
          <PreflightChecklist
            scenario={currentScenario}
            environmentFactors={environmentFactors}
            onComplete={handlePreflightComplete}
            onCancel={() => setShowPreflight(false)}
          />
        )}
      </AnimatePresence>

      {/* Post-Mission Debrief Modal */}
      {/* @ts-ignore */}
      <AnimatePresence>
        {showDebrief && (
          <PostMissionDebrief
            missionData={{
              systemState,
              completionTime: missionStartTime ? Date.now() - missionStartTime : 0,
              phases: currentPhase,
              checklistData
            }}
            logs={logs}
            diagnostics={diagnostics}
            scenario={currentScenario}
            onRestart={() => {
              setShowDebrief(false);
              resetSystem(false);
            }}
            onExportReport={exportDebriefReport}
            onClose={() => setShowDebrief(false)}
          />
        )}

        {/* Admin Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0d0d14] border border-[#2a2a3e] rounded-xl overflow-hidden shadow-2xl">
              <div className="px-6 py-4 bg-[#1a1a2e] border-b border-[#2a2a3e] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  <h2 className="text-sm font-bold text-gray-200 tracking-wider">ADMIN AUTHENTICATION</h2>
                </div>
                <button 
                  onClick={() => setShowLoginModal(false)}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Officer Email</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)} // Keep email in state
                      className="w-full pl-9 pr-3 py-2 bg-[#0a0a0f] border border-[#2a2a3e] rounded text-sm text-gray-300 focus:border-amber-500/50 focus:outline-none transition-colors"
                      placeholder="name@centcom.mil"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Access Code</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && authenticateAdmin()}
                      className="w-full pl-9 pr-10 py-2 bg-[#0a0a0f] border border-[#2a2a3e] rounded text-sm text-gray-300 focus:border-amber-500/50 focus:outline-none transition-colors font-mono"
                      placeholder="••••••••••••"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={authenticateAdmin}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-black font-bold text-sm tracking-wider rounded transition-colors shadow-lg shadow-amber-900/20"
                  >
                    AUTHENTICATE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-[#0d0d14] border-b border-[#2a2a3e] px-3 sm:px-6 py-2 sm:py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* @ts-ignore */}
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary transition-colors duration-500" />
            <div>
              <h1 className="text-sm sm:text-lg font-bold tracking-wider text-gray-100">STRATEGIC COMMAND</h1>
              <p className="text-xs text-gray-500 tracking-widest hidden sm:block">LAUNCH CONTROL SIMULATOR</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {(systemLocked || softHold) && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 border border-orange-500/50 rounded">
                <AlertOctagon className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
                <span className="text-xs font-bold text-orange-400">
                  {systemLocked ? 'LOCKED' : 'HOLD'}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-xs text-gray-500 hidden sm:inline">STATUS:</span>
              <StatusIndicator status={systemState} size="lg" />
              <span className={`text-xs sm:text-sm font-bold tracking-wider ${
                systemState === STATES.READY ? 'text-green-400' :
                systemState === STATES.FAILED ? 'text-red-400' :
                systemState === STATES.AUTHORIZED ? 'text-green-400' :
                systemState === STATES.COUNTDOWN ? 'text-red-400' :
                'text-amber-400'
              }`}>
                {systemState}
              </span>
            </div>
            
            <button
              onClick={() => {
                if (!adminAuthenticated) {
                  setShowLoginModal(true);
                } else {
                  setAdminPanelOpen(!adminPanelOpen);
                }
              }}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded border text-xs font-bold tracking-wider transition-colors ${
                adminAuthenticated 
                  ? 'bg-primary/20 border-primary/50 text-primary hover:bg-primary/30' 
                  : 'bg-[#1a1a2e] border-[#2a2a3e] text-gray-500 hover:border-gray-600'
              }`}
            >
              {adminAuthenticated ? (adminPanelOpen ? 'HIDE' : 'ADMIN') : 'ADMIN'}
            </button>
            
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
              {/* @ts-ignore */}
              <Clock className="w-4 h-4" />
              <span>{currentTime.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Administrator Panel */}
      {adminAuthenticated && adminPanelOpen && (
        <div className="bg-gradient-to-b from-orange-950/50 to-[#0a0a0f] border-b-2 border-orange-500/30">
          <div className="max-w-7xl mx-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* @ts-ignore */}
                <AlertOctagon className="w-6 h-6 text-orange-400" />
                <div>
                  <h2 className="text-sm font-bold text-orange-400 tracking-wider">ADMINISTRATOR PANEL</h2>
                  <p className="text-xs text-gray-500">Supervisory Control & Audit Interface</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={adminLogout}
                  className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 text-xs font-bold tracking-wider rounded transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  LOGOUT
                </button>
                <button
                  onClick={() => setAdminPanelOpen(false)}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  Minimize
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[45vh]">
              {/* Analytics Dashboard */}
              <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg overflow-hidden flex flex-col xl:col-span-2">
                <AnalyticsDashboard addLog={addLog} />
              </div>

              {/* User Management & Audit */}
              {isSuperAdmin && (
                <>
                  <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg overflow-hidden flex flex-col">
                    {/* @ts-ignore */}
                    <UserManagement
                      isSuperAdmin={isSuperAdmin}
                      currentUser={currentUser}
                      addLog={addLog}
                    />
                  </div>
                  <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg overflow-hidden flex flex-col">
                    <AuditLogViewer
                      currentUser={currentUser}
                      addLog={addLog}
                      isSuperAdmin={isSuperAdmin}
                    />
                  </div>
                </>
              )}

              {/* Scenarios */}
              <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg overflow-hidden flex flex-col">
                <ScenarioManager
                  scenarios={scenarios}
                  currentScenario={currentScenario}
                  onCreateScenario={createScenario}
                  onLoadScenario={loadScenario}
                  onDeleteScenario={deleteScenario}
                  onExportScenario={exportScenario}
                  onImportScenario={importScenario}
                  performanceData={performanceData}
                  systemState={systemState}
                  addLog={addLog}
                />
              </div>
              
              <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg overflow-hidden flex flex-col">
                <AIScenarioGenerator
                  onCreateScenario={createScenario}
                  subsystems={SUBSYSTEMS}
                  addLog={addLog}
                />
              </div>
              
              {/* Faults & Environment */}
              <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg overflow-hidden flex flex-col">
                <FaultInjector
                  subsystems={SUBSYSTEMS}
                  faultConfig={faultConfig}
                  onUpdateFault={(subsystemId, fault) => {
                    if (fault === null) {
                      const newConfig = { ...faultConfig };
                      delete newConfig[subsystemId];
                      setFaultConfig(newConfig);
                    } else {
                      setFaultConfig(prev => ({ ...prev, [subsystemId]: fault }));
                    }
                  }}
                  onClearFaults={() => {
                    setFaultConfig({});
                    addLog('system', 'All fault configurations cleared', true);
                  }}
                  addLog={addLog}
                />
              </div>
              
              <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg overflow-hidden flex flex-col">
                <EnvironmentPanel
                  onEnvironmentChange={setEnvironmentFactors}
                  addLog={addLog}
                />
              </div>
              
              {/* Monitoring */}
              <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg overflow-hidden flex flex-col">
                <SystemMonitor
                  environmentFactors={environmentFactors}
                  subsystemStatus={diagnostics}
                  addLog={addLog}
                />
              </div>
              
              <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg overflow-hidden flex flex-col">
                {/* @ts-ignore */}
                <SubsystemHealthMonitor
                  subsystems={SUBSYSTEMS}
                  diagnostics={diagnostics}
                  faultConfig={faultConfig}
                  addLog={addLog}
                />
              </div>
              
              {/* System Controls - Run Context */}
              <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg overflow-hidden flex flex-col">
                <div className="px-4 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e] flex-shrink-0">
                  <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Run Context</span>
                </div>
                <div className="p-3 space-y-2 text-xs overflow-y-auto flex-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Run ID:</span>
                    <span className="text-gray-300 font-mono truncate ml-2">{runId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Current Step:</span>
                    <span className="text-gray-300">{currentPhase + 1} / 6</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">System State:</span>
                    <span className="text-amber-400 font-bold">{systemState}</span>
                  </div>
                  <div className="h-px bg-[#2a2a3e] my-2" />
                  <div className="flex justify-between">
                    <span className="text-gray-500">Auth State:</span>
                    <span className={authVerified[0] && authVerified[1] ? 'text-green-400' : 'text-gray-400'}>
                      {authVerified.filter(a => a).length} / 2
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Command Valid:</span>
                    <span className={commandValidated ? 'text-green-400' : 'text-gray-400'}>
                      {commandValidated ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Keys Armed:</span>
                    <span className={keyTurn1 && keyTurn2 ? 'text-red-400' : 'text-gray-400'}>
                      {(keyTurn1 ? 1 : 0) + (keyTurn2 ? 1 : 0)} / 2
                    </span>
                  </div>
                  <div className="h-px bg-[#2a2a3e] my-2" />
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lock State:</span>
                    <span className={systemLocked || softHold ? 'text-orange-400' : 'text-green-400'}>
                      {systemLocked ? 'HARD LOCKED' : softHold ? 'SOFT HOLD' : 'UNLOCKED'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delay:</span>
                    <span className="text-gray-300">{delayMultiplier.toFixed(1)}x</span>
                  </div>
                  
                  <div className="mt-4">
                    <DefconStatus level={defconLevel} />
                  </div>
                </div>
              </div>
              
              {/* System Lock Controls */}
              <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg overflow-hidden flex flex-col">
                <div className="px-4 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e] flex-shrink-0">
                  <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Lock & DEFCON</span>
                </div>
                <div className="p-3 space-y-2 overflow-y-auto flex-1">
                  {/* DEFCON Control */}
                  <div className="mb-3 p-2 bg-black/20 rounded border border-white/5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Set DEFCON Level</label>
                    <select 
                      value={defconLevel}
                      onChange={(e) => {
                        const newLevel = parseInt(e.target.value);
                        setDefconLevel(newLevel);
                        addLog('warning', `DEFCON level changed to ${newLevel} by Administrator`, true);
                      }}
                      disabled={systemLocked}
                      className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded text-xs text-gray-300 py-1 px-2 focus:border-amber-500/50 focus:outline-none"
                    >
                      <option value={5}>DEFCON 5 (NORMAL)</option>
                      <option value={4}>DEFCON 4 (INCREASED)</option>
                      <option value={3}>DEFCON 3 (WARNING)</option>
                      <option value={2}>DEFCON 2 (CRITICAL)</option>
                      <option value={1}>DEFCON 1 (MAXIMUM)</option>
                    </select>
                  </div>
                  <button
                    onClick={() => adminLockSystem('soft')}
                    disabled={softHold || systemLocked}
                    className="w-full px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 disabled:bg-gray-700 disabled:cursor-not-allowed border border-yellow-600/50 text-yellow-400 text-xs font-bold tracking-wider rounded transition-colors"
                  >
                    SOFT HOLD
                  </button>
                  <button
                    onClick={() => adminLockSystem('hard')}
                    disabled={systemLocked}
                    className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 disabled:bg-gray-700 disabled:cursor-not-allowed border border-red-600/50 text-red-400 text-xs font-bold tracking-wider rounded transition-colors"
                  >
                    HARD LOCK
                  </button>
                  <button
                    onClick={adminUnlockSystem}
                    disabled={!softHold && !systemLocked}
                    className="w-full px-3 py-2 bg-green-600/20 hover:bg-green-600/30 disabled:bg-gray-700 disabled:cursor-not-allowed border border-green-600/50 text-green-400 text-xs font-bold tracking-wider rounded transition-colors"
                  >
                    UNLOCK / RESUME
                  </button>
                  <div className="h-px bg-[#2a2a3e] my-2" />
                  <button
                    onClick={() => {
                      if (window.confirm('Confirm full system reset?')) {
                        resetSystem(true);
                      }
                    }}
                    className="w-full px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/50 text-orange-400 text-xs font-bold tracking-wider rounded transition-colors"
                  >
                    FORCE RESET
                  </button>
                </div>
              </div>
              
              {/* Diagnostics Override */}
              <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg overflow-hidden flex flex-col">
                <div className="px-4 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e] flex-shrink-0">
                  <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Diagnostics</span>
                </div>
                <div className="p-3 space-y-2 overflow-y-auto flex-1">
                  <button
                    onClick={() => {
                      const overrides = {};
                      SUBSYSTEMS.forEach(sub => { overrides[sub.id] = 'PASS'; });
                      adminForceDiagnostics(overrides);
                    }}
                    disabled={systemLocked || currentPhase === 0}
                    className="w-full px-3 py-2 bg-green-600/20 hover:bg-green-600/30 disabled:bg-gray-700 disabled:cursor-not-allowed border border-green-600/50 text-green-400 text-xs font-bold tracking-wider rounded transition-colors"
                  >
                    FORCE ALL PASS
                  </button>
                  <button
                    onClick={() => {
                      const overrides = {};
                      SUBSYSTEMS.forEach((sub, idx) => { overrides[sub.id] = idx < 2 ? 'FAILED' : 'PASS'; });
                      adminForceDiagnostics(overrides);
                    }}
                    disabled={systemLocked || currentPhase === 0}
                    className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 disabled:bg-gray-700 disabled:cursor-not-allowed border border-red-600/50 text-red-400 text-xs font-bold tracking-wider rounded transition-colors"
                  >
                    INJECT FAILURES
                  </button>
                  <div className="h-px bg-[#2a2a3e] my-2" />
                  <div className="text-xs text-gray-500 mb-1">Timing: {delayMultiplier.toFixed(1)}x</div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={delayMultiplier}
                    onChange={(e) => {
                      setDelayMultiplier(parseFloat(e.target.value));
                      addLog('info', `Delay set to ${parseFloat(e.target.value).toFixed(1)}x`, true);
                    }}
                    className="w-full"
                  />
                  <button
                    onClick={exportLogs}
                    className="w-full px-3 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-600/50 text-cyan-400 text-xs font-bold tracking-wider rounded transition-colors"
                  >
                    EXPORT LOG
                  </button>
                </div>
              </div>
              
              {/* Configuration */}
              <div className="bg-[#12121a] border border-[#2a2a3e] rounded-lg overflow-hidden flex flex-col">
                <div className="px-4 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e] flex-shrink-0">
                  <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Configuration</span>
                </div>
                <div className="p-3 space-y-2 overflow-y-auto flex-1">
                  <div>
                    <div className="p-2 mb-2 bg-green-500/10 border border-green-500/20 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-bold text-green-400">Authenticated</span>
                      </div>
                      <p className="text-xs text-gray-400">Logged in as {adminEmail}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Training Code 1</label>
                    <input
                      type="text"
                      value={trainingCodes[0]}
                      onChange={(e) => {
                        const newCodes = [...trainingCodes];
                        newCodes[0] = e.target.value;
                        setTrainingCodes(newCodes);
                      }}
                      className="w-full px-2 py-1 bg-[#0a0a0f] border border-[#2a2a3e] rounded text-xs font-mono text-green-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Training Code 2</label>
                    <input
                      type="text"
                      value={trainingCodes[1]}
                      onChange={(e) => {
                        const newCodes = [...trainingCodes];
                        newCodes[1] = e.target.value;
                        setTrainingCodes(newCodes);
                      }}
                      className="w-full px-2 py-1 bg-[#0a0a0f] border border-[#2a2a3e] rounded text-xs font-mono text-green-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column - Controls */}
        <div className="lg:col-span-8 space-y-4">
          {/* Phase Indicator */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {['INIT', 'DIAG', 'AUTH', 'VALIDATE', 'KEY AUTH', 'LAUNCH'].map((phase, idx) => (
              <React.Fragment key={phase}>
                <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded ${
                  currentPhase === idx ? 'bg-amber-500/20 border border-amber-500/50' :
                  currentPhase > idx ? 'bg-green-500/20 border border-green-500/50' :
                  'bg-[#1a1a2e] border border-[#2a2a3e]'
                }`}>
                  <span className={`text-xs font-bold ${
                    currentPhase === idx ? 'text-amber-400' :
                    currentPhase > idx ? 'text-green-400' :
                    'text-gray-500'
                  }`}>
                    <span className="hidden sm:inline">{idx + 1}. </span>{phase}
                  </span>
                </div>
                {/* @ts-ignore */}
                {idx < 5 && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 hidden sm:block" />}
              </React.Fragment>
            ))}
          </div>
          
          {/* Interactive System Diagram */}
          <div className="h-64 mb-4">
            <InteractiveSystemDiagram
              subsystems={SUBSYSTEMS}
              diagnostics={diagnostics}
              faultConfig={faultConfig}
              environmentFactors={environmentFactors}
              onUpdateFault={(subsystemId, fault) => {
                if (fault === null) {
                  const newConfig = { ...faultConfig };
                  delete newConfig[subsystemId];
                  setFaultConfig(newConfig);
                } else {
                  setFaultConfig(prev => ({ ...prev, [subsystemId]: fault }));
                }
              }}
              addLog={addLog}
            />
          </div>
          
          {/* Global Trajectory Map */}
          <div className="h-64 mb-6">
             <GlobalMap 
                launchCoords={launchCoords} 
                targetCoords={
                    targetCoords.lat && targetCoords.lon 
                    ? { lat: parseFloat(targetCoords.lat), lon: parseFloat(targetCoords.lon) } 
                    : null
                }
                currentPhase={currentPhase}
             />
          </div>

          {/* Phase 0: Initialization */}
          {currentPhase === 0 && (
            <Panel title="System Initialization" status={systemState}>
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Complete pre-flight checklist and initialize core systems before proceeding.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={startMission}
                    disabled={systemState === STATES.INITIALIZING}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold tracking-wider rounded transition-colors flex items-center gap-2"
                  >
                    {/* @ts-ignore */}
                    <Play className="w-5 h-5" />
                    START MISSION
                  </button>
                  <button
                    onClick={initializeSystem}
                    disabled={systemState === STATES.INITIALIZING}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-bold tracking-wider rounded transition-colors"
                  >
                    {systemState === STATES.INITIALIZING ? 'INITIALIZING...' : 'QUICK START'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Use "Start Mission" for full briefing or "Quick Start" to skip checklist.
                </p>
              </div>
            </Panel>
          )}
          
          {/* Phase 1: Diagnostics */}
          {currentPhase >= 1 && (
            <Panel title="System Diagnostics" status={systemState}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {SUBSYSTEMS.map(sub => {
                    const Icon = sub.icon;
                    const status = diagnostics[sub.id];
                    return (
                      <div key={sub.id} className={`flex items-center gap-3 p-3 rounded border ${
                        status === 'PASS' ? 'bg-green-500/10 border-green-500/30' :
                        status === 'DEGRADED' ? 'bg-orange-500/10 border-orange-500/30' :
                        status === 'FAILED' ? 'bg-red-500/10 border-red-500/30' :
                        'bg-[#1a1a2e] border-[#2a2a3e]'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          status === 'PASS' ? 'text-green-400' :
                          status === 'DEGRADED' ? 'text-orange-400' :
                          status === 'FAILED' ? 'text-red-400' :
                          'text-gray-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-xs text-gray-300">{sub.name}</p>
                          <p className={`text-xs font-bold ${
                            status === 'PASS' ? 'text-green-400' :
                            status === 'DEGRADED' ? 'text-orange-400' :
                            status === 'FAILED' ? 'text-red-400' :
                            'text-gray-500'
                          }`}>
                            {status || 'PENDING'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {currentPhase === 1 && !diagnosticsComplete && (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={runDiagnostics}
                      disabled={systemState === STATES.INITIALIZING}
                      className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-bold tracking-wider rounded transition-colors"
                    >
                      RUN DIAGNOSTICS
                    </button>
                    
                    <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={faultInjection}
                        onChange={(e) => setFaultInjection(e.target.checked)}
                        className="rounded bg-[#1a1a2e] border-[#2a2a3e]"
                      />
                      Inject Fault (Training)
                    </label>
                  </div>
                )}
                
                {currentPhase === 1 && diagnosticsComplete && systemState !== STATES.FAILED && (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={verifyDiagnostics}
                      className="px-6 py-3 bg-green-600 hover:bg-green-500 text-black font-bold tracking-wider rounded transition-colors flex items-center gap-2"
                    >
                      {/* @ts-ignore */}
                      <CheckCircle className="w-5 h-5" />
                      VERIFY DIAGNOSTICS
                    </button>
                    <span className="text-xs text-gray-400">
                      Review results and confirm to proceed
                    </span>
                  </div>
                )}
              </div>
            </Panel>
          )}
          
          {/* Phase 2: Authentication */}
          {currentPhase >= 2 && systemState !== STATES.FAILED && (
            <Panel title="Dual Authentication" status={
              useSASMode 
                ? (sasVerified[0] && sasVerified[1] ? STATES.READY : STATES.HOLD)
                : (authVerified[0] && authVerified[1] ? STATES.READY : STATES.HOLD)
            }>
              {/* SAS Mode Toggle */}
              <div className="mb-4 flex items-center justify-between p-3 bg-[#1a1a2e] border border-[#2a2a3e] rounded">
                <div>
                  <div className="text-sm font-bold text-amber-400">Authentication Mode</div>
                  <div className="text-xs text-gray-400">
                    {useSASMode ? 'Realistic SAS Code System' : 'Simple Training Mode'}
                  </div>
                </div>
                <button
                  onClick={() => setUseSASMode(!useSASMode)}
                  disabled={authVerified[0] || authVerified[1] || sasVerified[0] || sasVerified[1]}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-black text-xs font-bold rounded transition-colors"
                >
                  {useSASMode ? 'SWITCH TO SIMPLE' : 'SWITCH TO SAS'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {useSASMode ? (
                  <>
                    {/* SAS Code Puzzler Mode */}
                    <SASCodePuzzler 
                      officerId={1}
                      sessionId={runId}
                      onVerify={(verified, code) => {
                        setSasVerified([verified, sasVerified[1]]);
                        if (verified) {
                          setAuthCode1(code);
                          setAuthVerified([true, authVerified[1]]);
                        }
                      }}
                    />
                    <SASCodePuzzler 
                      officerId={2}
                      sessionId={runId}
                      onVerify={(verified, code) => {
                        setSasVerified([sasVerified[0], verified]);
                        if (verified) {
                          setAuthCode2(code);
                          setAuthVerified([authVerified[0], true]);
                        }
                      }}
                    />
                  </>
                ) : (
                  <>
                    {/* Simple Auth Mode */}
                    {/* Auth Slot 1 */}
                    <div className={`p-4 rounded border ${authVerified[0] ? 'bg-green-500/10 border-green-500/30' : 'bg-[#1a1a2e] border-[#2a2a3e]'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        {authVerified[0] ? <Unlock className="w-4 h-4 text-green-400" /> : <Lock className="w-4 h-4 text-gray-500" />}
                        <span className="text-xs text-gray-400">OFFICER 1 AUTHORIZATION</span>
                      </div>
                      <input
                        type="text"
                        value={authCode1}
                        onChange={(e) => setAuthCode1(e.target.value)}
                        disabled={authVerified[0]}
                        placeholder="Enter code..."
                        className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a3e] rounded text-sm font-mono text-green-400 placeholder-gray-600 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => verifyAuth(1)}
                        disabled={authVerified[0] || !authCode1}
                        className="mt-3 w-full px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-black text-xs font-bold tracking-wider rounded transition-colors"
                      >
                        {authVerified[0] ? 'VERIFIED' : 'VERIFY'}
                      </button>
                    </div>
                    
                    {/* Auth Slot 2 */}
                    <div className={`p-4 rounded border ${authVerified[1] ? 'bg-green-500/10 border-green-500/30' : 'bg-[#1a1a2e] border-[#2a2a3e]'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        {authVerified[1] ? <Unlock className="w-4 h-4 text-green-400" /> : <Lock className="w-4 h-4 text-gray-500" />}
                        <span className="text-xs text-gray-400">OFFICER 2 AUTHORIZATION</span>
                      </div>
                      <input
                        type="text"
                        value={authCode2}
                        onChange={(e) => setAuthCode2(e.target.value)}
                        disabled={authVerified[1]}
                        placeholder="Enter code..."
                        className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a3e] rounded text-sm font-mono text-green-400 placeholder-gray-600 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => verifyAuth(2)}
                        disabled={authVerified[1] || !authCode2}
                        className="mt-3 w-full px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-black text-xs font-bold tracking-wider rounded transition-colors"
                      >
                        {authVerified[1] ? 'VERIFIED' : 'VERIFY'}
                      </button>
                    </div>
                  </>
                )}
              </div>
              {!useSASMode && (
                <p className="mt-4 text-xs text-gray-500">
                  Training codes: {trainingCodes.join(', ')}
                </p>
              )}
              
              {/* Proceed to Phase 3 Button */}
              {authVerified[0] && authVerified[1] && currentPhase === 2 && (
                <div className="mt-4 flex items-center gap-4">
                  <button
                    onClick={() => {
                      addLog('Both officers authenticated', 'success');
                      addLog('Proceeding to command validation phase', 'info');
                      setCurrentPhase(3);
                    }}
                    className="px-6 py-3 bg-green-600 hover:bg-green-500 text-black font-bold tracking-wider rounded transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    PROCEED TO COMMAND VALIDATION
                  </button>
                  <span className="text-xs text-gray-400">
                    Authentication verified - ready for next phase
                  </span>
                </div>
              )}
            </Panel>
          )}
          
          {/* Phase 3: Command Validation */}
          {currentPhase >= 3 && (
            <Panel title="Command Validation" status={commandValidated ? STATES.READY : STATES.HOLD}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">TARGET LATITUDE</label>
                    <input
                      type="text"
                      value={targetCoords.lat}
                      onChange={(e) => setTargetCoords(prev => ({ ...prev, lat: e.target.value }))}
                      disabled={commandValidated}
                      placeholder="00.0000"
                      className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a3e] rounded text-sm font-mono text-amber-400 placeholder-gray-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">TARGET LONGITUDE</label>
                    <input
                      type="text"
                      value={targetCoords.lon}
                      onChange={(e) => setTargetCoords(prev => ({ ...prev, lon: e.target.value }))}
                      disabled={commandValidated}
                      placeholder="00.0000"
                      className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a3e] rounded text-sm font-mono text-amber-400 placeholder-gray-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                
                {!commandValidated && currentPhase === 3 && (
                  <button
                    onClick={validateCommand}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-black font-bold tracking-wider rounded transition-colors"
                  >
                    VALIDATE COMMAND
                  </button>
                )}
                
                {commandValidated && (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-bold">COMMAND VALIDATED</span>
                  </div>
                )}
              </div>
            </Panel>
          )}
          
          {/* Phase 4: Final Authorization */}
          {currentPhase >= 4 && (
            <Panel title="Final Authorization" status={keyTurn1 && keyTurn2 ? STATES.AUTHORIZED : STATES.HOLD}>
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Simultaneous key turn required within 3 seconds for final authorization.
                </p>
                
                <div className="grid grid-cols-2 gap-6">
                  <button
                    onClick={() => handleKeyTurn(1)}
                    disabled={keyTurn1}
                    className={`p-6 rounded border-2 transition-all ${
                      keyTurn1 
                        ? 'bg-red-500/20 border-red-500 text-red-400' 
                        : 'bg-[#1a1a2e] border-[#2a2a3e] hover:border-red-500/50 text-gray-400 hover:text-red-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`w-16 h-16 mx-auto rounded-full border-4 flex items-center justify-center mb-3 ${
                        keyTurn1 ? 'border-red-500 bg-red-500/30' : 'border-gray-600'
                      }`}>
                        <div className={`w-3 h-8 rounded ${keyTurn1 ? 'bg-red-400 rotate-90' : 'bg-gray-500'} transition-transform`} />
                      </div>
                      <span className="text-xs font-bold tracking-wider">
                        {keyTurn1 ? 'KEY 1 ARMED' : 'TURN KEY 1'}
                      </span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleKeyTurn(2)}
                    disabled={keyTurn2}
                    className={`p-6 rounded border-2 transition-all ${
                      keyTurn2 
                        ? 'bg-red-500/20 border-red-500 text-red-400' 
                        : 'bg-[#1a1a2e] border-[#2a2a3e] hover:border-red-500/50 text-gray-400 hover:text-red-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`w-16 h-16 mx-auto rounded-full border-4 flex items-center justify-center mb-3 ${
                        keyTurn2 ? 'border-red-500 bg-red-500/30' : 'border-gray-600'
                      }`}>
                        <div className={`w-3 h-8 rounded ${keyTurn2 ? 'bg-red-400 rotate-90' : 'bg-gray-500'} transition-transform`} />
                      </div>
                      <span className="text-xs font-bold tracking-wider">
                        {keyTurn2 ? 'KEY 2 ARMED' : 'TURN KEY 2'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </Panel>
          )}
          
          {/* Phase 5: Launch Control */}
          {currentPhase >= 5 && (
            <Panel title="Launch Control" status={systemState}>
              <div className="space-y-6">
                {/* Countdown Display */}
                <div className="text-center py-8">
                  <div className={`text-8xl font-bold tracking-wider ${
                    countdownActive ? 'text-red-500 animate-pulse' : 
                    systemState === STATES.COMPLETE ? 'text-blue-400' :
                    systemState === STATES.ABORTED ? 'text-gray-500' :
                    'text-amber-400'
                  }`}>
                    T-{String(countdown).padStart(2, '0')}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {systemState === STATES.COMPLETE ? 'LAUNCH COMPLETE' :
                     systemState === STATES.ABORTED ? 'SEQUENCE ABORTED' :
                     countdownActive ? 'LAUNCH IN PROGRESS' : 'STANDING BY'}
                  </p>
                </div>
                
                {/* Launch / Abort Buttons */}
                <div className="flex justify-center gap-6">
                  {!countdownActive && systemState !== STATES.COMPLETE && systemState !== STATES.ABORTED && (
                    <button
                      onClick={initiateLaunch}
                      className="px-12 py-4 bg-red-600 hover:bg-red-500 text-white font-bold tracking-wider rounded-lg text-xl transition-all hover:scale-105 shadow-lg shadow-red-500/30"
                    >
                      LAUNCH
                    </button>
                  )}
                  
                  {countdownActive && (
                    <button
                      onClick={abortSequence}
                      className="px-12 py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-bold tracking-wider rounded-lg text-xl transition-all animate-pulse"
                    >
                      ABORT
                    </button>
                  )}
                </div>
              </div>
            </Panel>
          )}
        </div>
        
        {/* Right Column - Status & Log */}
        <div className="lg:col-span-4 space-y-4">
          {/* System Reset */}
          <button
            onClick={() => resetSystem(false)}
            disabled={systemLocked}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1a1a2e] hover:bg-[#252540] disabled:bg-gray-800 disabled:cursor-not-allowed border border-[#2a2a3e] rounded text-gray-400 hover:text-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wider">RESET SYSTEM</span>
          </button>
          
          {/* Status Overview */}
          <Panel title="Status Overview">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Run ID</span>
                <span className="text-xs text-gray-300 font-mono">{runId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">System State</span>
                <span className={`text-xs font-bold ${
                  systemState === STATES.READY || systemState === STATES.AUTHORIZED ? 'text-green-400' :
                  systemState === STATES.FAILED || systemState === STATES.ABORTED ? 'text-red-400' :
                  'text-amber-400'
                }`}>{systemState}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Current Phase</span>
                <span className="text-xs text-gray-300">{currentPhase + 1} / 6</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Authentication</span>
                <span className={`text-xs font-bold ${authVerified[0] && authVerified[1] ? 'text-green-400' : 'text-gray-400'}`}>
                  {authVerified[0] && authVerified[1] ? 'VERIFIED' : 'PENDING'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Command Status</span>
                <span className={`text-xs font-bold ${commandValidated ? 'text-green-400' : 'text-gray-400'}`}>
                  {commandValidated ? 'VALIDATED' : 'PENDING'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Key Authorization</span>
                <span className={`text-xs font-bold ${keyTurn1 && keyTurn2 ? 'text-red-400' : 'text-gray-400'}`}>
                  {keyTurn1 && keyTurn2 ? 'ARMED' : `${(keyTurn1 ? 1 : 0) + (keyTurn2 ? 1 : 0)} / 2`}
                </span>
              </div>
            </div>
          </Panel>
          
          {/* Event Log */}
          <Panel title="Event Log" className="h-[400px] flex flex-col">
            <div 
              ref={logRef}
              className="flex-1 overflow-y-auto bg-[#0a0a0f] rounded p-3 space-y-1"
            >
              {logs.length === 0 ? (
                <p className="text-xs text-gray-600 italic">No events recorded</p>
              ) : (
                logs.map(log => (
                  <LogEntry key={log.id} timestamp={log.timestamp} level={log.level} message={log.message} isAdmin={log.isAdmin} />
                ))
              )}
            </div>
          </Panel>
          
          {/* Warning Notice */}
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-400 mb-1">TRAINING SIMULATION</p>
              <p className="text-xs text-gray-400">
                This is a fictional training interface for educational purposes only. 
                No actual systems are connected.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Command Center Chat */}
      <CommandCenterChat
        systemState={systemState}
        currentPhase={currentPhase}
        diagnostics={diagnostics}
        logs={logs}
        runId={runId}
      />

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#0d0d14] border-t border-[#2a2a3e] px-3 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
          <span className="hidden sm:inline truncate max-w-[200px]">{systemTitle}</span>
          <span className="hidden md:inline truncate max-w-[300px]">{classificationText}</span>
          <div className="flex items-center gap-2 sm:gap-4">
            {adminAuthenticated && (
              <span className="text-orange-400 font-bold">ADMIN</span>
            )}
            <span className="font-mono">{runId}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}