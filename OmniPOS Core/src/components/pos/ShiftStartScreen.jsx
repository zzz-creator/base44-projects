import React, { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, User, LogIn } from "lucide-react";
import { usePOS } from "./POSContext";

export default function ShiftStartScreen() {
  const { currentStaff, startShift, lockLane } = usePOS();
  const [float, setFloat] = useState("200.00");
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    await startShift(float);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-800 p-8"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-900/40 rounded-full mb-3 border border-green-700">
            <User className="w-6 h-6 text-green-400" />
          </div>
          <div className="text-white font-bold text-lg">Welcome, {currentStaff?.name}</div>
          <div className="text-gray-400 text-sm capitalize">{currentStaff?.role} · ID {currentStaff?.staff_id}</div>
        </div>

        <div className="mb-6">
          <div className="text-gray-300 font-semibold text-sm mb-3 text-center">Start Shift</div>
          <label className="text-gray-500 text-xs font-mono mb-1 block">Enter Opening Cash Float</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="number"
              value={float}
              onChange={e => setFloat(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-green-500 transition"
              step="0.01"
            />
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={loading || !float}
          className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          {loading ? "Starting..." : "Start Shift"}
        </button>

        <button
          onClick={() => lockLane("cancelled_login")}
          className="w-full mt-3 text-gray-600 hover:text-gray-400 text-sm py-2 transition"
        >
          Cancel & Lock Lane
        </button>
      </motion.div>
    </div>
  );
}