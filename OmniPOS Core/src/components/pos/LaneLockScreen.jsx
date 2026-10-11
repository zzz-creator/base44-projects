import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, AlertCircle, ShieldCheck } from "lucide-react";
import { usePOS } from "./POSContext";
import { base44 } from "@/api/base44Client";

export default function LaneLockScreen() {
  const { loginStaff, failedAttempts, lockedOut, lockoutEnd, CONFIG, setLockedOut, setFailedAttempts, setCurrentStaff, setPhase, logEvent } = usePOS();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(new Date());
  const [countdown, setCountdown] = useState(0);
  const [adminOverride, setAdminOverride] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (lockedOut && lockoutEnd) {
      const t = setInterval(() => {
        const rem = Math.ceil((lockoutEnd - Date.now()) / 1000);
        setCountdown(rem > 0 ? rem : 0);
      }, 500);
      return () => clearInterval(t);
    }
  }, [lockedOut, lockoutEnd]);

  const handleKey = async (k) => {
    if (lockedOut) return;
    if (k === "DEL") { setPin(p => p.slice(0, -1)); return; }
    if (k === "ENTER") {
      if (pin.length < 4) { setError("PIN must be at least 4 digits"); return; }
      setLoading(true);
      setError("");
      const res = await loginStaff(pin);
      setLoading(false);
      if (!res.success) { setError(res.error); setPin(""); }
      return;
    }
    if (pin.length < 8) setPin(p => p + k);
  };

  const handleAdminKey = async (k) => {
    if (k === "DEL") { setAdminPin(p => p.slice(0, -1)); return; }
    if (k === "ENTER") {
      if (adminPin.length < 4) { setAdminError("PIN must be at least 4 digits"); return; }
      const staffList = await base44.entities.Staff.list();
      const admin = staffList.find(s => s.pin === adminPin && s.active && (s.role === "administrator" || s.role === "manager"));
      if (admin) {
        setLockedOut(false);
        setFailedAttempts(0);
        setAdminOverride(false);
        setAdminPin("");
        setAdminError("");
        // loginStaff won't work since lockedOut is being reset; just do it directly
        setCurrentStaff(admin);
        logEvent("admin_override_unlock", `Terminal unlocked by admin: ${admin.name}`, { staff_id: admin.staff_id });
        setPhase("shift_start");
      } else {
        setAdminError("Invalid admin/manager PIN");
        setAdminPin("");
      }
      return;
    }
    if (adminPin.length < 8) setAdminPin(p => p + k);
  };

  const keys = ["1","2","3","4","5","6","7","8","9","DEL","0","ENTER"];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm px-6"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4 border border-gray-700"
          >
            <Lock className="w-8 h-8 text-amber-400" />
          </motion.div>
          <div className="text-white text-xl font-bold tracking-widest font-mono">POS TERMINAL LOCKED</div>
          <div className="text-gray-500 text-sm mt-1 font-mono">
            Store: {CONFIG.store_id} &nbsp;|&nbsp; Lane: {CONFIG.terminal_id}
          </div>
          <div className="text-gray-400 font-mono text-2xl font-bold mt-3">
            {time.toLocaleTimeString()}
          </div>
          <div className="text-gray-600 font-mono text-xs mt-0.5">{time.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</div>
        </div>

        {lockedOut ? (
          <div className="text-center">
            <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <div className="text-red-400 font-bold text-sm">TERMINAL LOCKED</div>
              <div className="text-red-300 text-xs mt-1">Too many failed attempts</div>
              <div className="text-white text-2xl font-mono font-bold mt-2">{countdown}s</div>
            </div>

            {!adminOverride ? (
              <button
                onClick={() => { setAdminOverride(true); setAdminError(""); setAdminPin(""); }}
                className="flex items-center gap-2 mx-auto text-amber-400 hover:text-amber-300 text-xs font-mono border border-amber-800 hover:border-amber-600 rounded-lg px-4 py-2 transition">
                <ShieldCheck className="w-4 h-4" />
                Admin Override
              </button>
            ) : (
              <div className="mt-2">
                <div className="text-amber-400 text-xs font-mono mb-3 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Enter Admin / Manager PIN
                </div>
                <div className="flex justify-center gap-2 mb-3">
                  {Array.from({ length: Math.max(4, adminPin.length) }).map((_, i) => (
                    <div key={i} className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                      i < adminPin.length ? "border-amber-500 bg-amber-900/30" : "border-gray-700 bg-gray-900"
                    }`}>
                      {i < adminPin.length && <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />}
                    </div>
                  ))}
                </div>
                {adminError && <div className="text-red-400 text-xs font-mono mb-2">{adminError}</div>}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {keys.map(k => (
                    <button key={k} onClick={() => handleAdminKey(k)}
                      className={`h-11 rounded-xl font-mono font-bold text-sm transition-all active:scale-95 ${
                        k === "ENTER" ? "bg-amber-700 hover:bg-amber-600 text-white border border-amber-500"
                        : k === "DEL" ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                        : "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
                      }`}>{k}</button>
                  ))}
                </div>
                <button onClick={() => { setAdminOverride(false); setAdminPin(""); setAdminError(""); }}
                  className="text-gray-600 hover:text-gray-400 text-xs font-mono transition">Cancel</button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* PIN display */}
            <div className="flex justify-center gap-3 mb-4">
              {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
                <div key={i} className={`w-10 h-10 rounded-lg border flex items-center justify-center ${
                  i < pin.length ? "border-green-500 bg-green-900/30" : "border-gray-700 bg-gray-900"
                }`}>
                  {i < pin.length && <div className="w-3 h-3 rounded-full bg-green-400" />}
                </div>
              ))}
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center mb-3 font-mono">
                {error} {failedAttempts > 0 && `(${failedAttempts}/5 attempts)`}
              </motion.div>
            )}

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {keys.map(k => (
                <button
                  key={k}
                  onClick={() => handleKey(k)}
                  disabled={loading}
                  className={`h-12 rounded-xl font-mono font-bold text-sm transition-all active:scale-95 ${
                    k === "ENTER"
                      ? "bg-green-700 hover:bg-green-600 text-white border border-green-500"
                      : k === "DEL"
                      ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                      : "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="text-center text-gray-600 text-xs font-mono">
              Waiting for staff login
            </div>

            <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-3">
              <div className="text-gray-600 text-xs font-mono mb-2">DEV — DEMO PINS</div>
              <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                <div className="text-gray-500">Admin: <span className="text-green-400">0000</span></div>
                <div className="text-gray-500">Manager: <span className="text-blue-400">1234</span></div>
                <div className="text-gray-500">Supervisor: <span className="text-amber-400">5678</span></div>
                <div className="text-gray-500">Cashier: <span className="text-gray-300">9012</span></div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}