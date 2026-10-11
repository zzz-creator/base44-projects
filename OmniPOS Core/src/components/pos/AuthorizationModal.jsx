import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

// requiredRole: "supervisor" | "manager" | "administrator"
export default function AuthorizationModal({ title, description, requiredRole = "supervisor", onAuthorized, onCancel }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roleHierarchy = { cashier: 0, supervisor: 1, manager: 2, administrator: 3 };

  const handleVerify = async () => {
    setLoading(true);
    setError("");
    const staffList = await base44.entities.Staff.list();
    const match = staffList.find(s => s.pin === pin && s.active);
    if (!match) { setError("Invalid PIN"); setLoading(false); setPin(""); return; }
    if (roleHierarchy[match.role] < roleHierarchy[requiredRole]) {
      setError(`Requires ${requiredRole} or higher`);
      setLoading(false);
      setPin("");
      return;
    }
    setLoading(false);
    onAuthorized(match);
  };

  const keys = ["1","2","3","4","5","6","7","8","9","DEL","0","OK"];

  const handleKey = (k) => {
    if (k === "DEL") { setPin(p => p.slice(0, -1)); return; }
    if (k === "OK") { handleVerify(); return; }
    if (pin.length < 8) setPin(p => p + k);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-amber-700 rounded-2xl p-6 w-full max-w-xs shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-bold text-sm tracking-wide">AUTHORIZATION REQUIRED</span>
          </div>
          <button onClick={onCancel} className="text-gray-600 hover:text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-white font-semibold text-sm mb-1">{title}</div>
        <div className="text-gray-400 text-xs mb-4">{description}</div>
        <div className="text-gray-500 text-xs font-mono mb-1 capitalize">{requiredRole} PIN required</div>

        {/* PIN dots */}
        <div className="flex justify-center gap-2 mb-3">
          {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
            <div key={i} className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
              i < pin.length ? "border-amber-500 bg-amber-900/30" : "border-gray-700"
            }`}>
              {i < pin.length && <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />}
            </div>
          ))}
        </div>

        {error && <div className="text-red-400 text-xs text-center mb-2">{error}</div>}

        <div className="grid grid-cols-3 gap-1.5">
          {keys.map(k => (
            <button key={k} onClick={() => handleKey(k)} disabled={loading}
              className={`h-10 rounded-lg font-mono font-bold text-sm transition-all active:scale-95 ${
                k === "OK" ? "bg-amber-700 hover:bg-amber-600 text-white border border-amber-500"
                : k === "DEL" ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                : "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
              }`}
            >{k}</button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}