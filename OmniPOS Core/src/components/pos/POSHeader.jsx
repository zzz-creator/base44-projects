import React, { useState, useEffect } from "react";
import { Lock, User, WifiOff, Bell, BarChart2 } from "lucide-react";
import { usePOS } from "./POSContext";
import { motion, AnimatePresence } from "framer-motion";

export default function POSHeader({ isOffline, onDashboard }) {
  const { currentStaff, lockLane, endShift, CONFIG, systemAlerts } = usePOS();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="text-green-400 font-bold font-mono text-sm">RetailOS</div>
        <div className="text-gray-600 text-xs font-mono">{CONFIG.terminal_id}</div>
        {isOffline && (
          <div className="flex items-center gap-1 bg-yellow-900/40 border border-yellow-700 rounded px-2 py-0.5">
            <WifiOff className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-bold">OFFLINE MODE</span>
          </div>
        )}
      </div>

      {/* Alerts */}
      <div className="flex-1 mx-4">
        <AnimatePresence>
          {systemAlerts.map(a => (
            <motion.div key={a.id} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1 bg-red-900/40 border border-red-700 rounded px-2 py-0.5 text-xs text-red-400 font-mono">
              <Bell className="w-3 h-3" />{a.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-xs font-mono">
            <User className="w-3 h-3 inline mr-1" />
            {currentStaff?.name} · <span className="capitalize">{currentStaff?.role}</span>
          </span>
        </div>
        <div className="text-gray-400 font-mono text-xs">{time.toLocaleTimeString()}</div>
        <button onClick={onDashboard}
          className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-2 py-1 text-gray-400 hover:text-blue-400 text-xs transition">
          <BarChart2 className="w-3 h-3" /> Dashboard
        </button>
        <button onClick={() => lockLane("manual")}
          className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-2 py-1 text-gray-400 hover:text-amber-400 text-xs transition">
          <Lock className="w-3 h-3" /> Lock
        </button>
        <button onClick={endShift}
          className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-2 py-1 text-gray-400 hover:text-red-400 text-xs transition">
          End Shift
        </button>
      </div>
    </div>
  );
}