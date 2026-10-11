import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const BOOT_STAGES = [
  { icon: "⚙️", label: "Core System", desc: "Loading environment & libraries" },
  { icon: "📋", label: "Configuration", desc: "Reading terminal & store settings" },
  { icon: "🖨️", label: "Hardware", desc: "Detecting scanner, printer, drawer" },
  { icon: "🗄️", label: "Database", desc: "Connecting to POS database" },
  { icon: "🔒", label: "Security", desc: "Verifying encryption & license" },
  { icon: "📦", label: "Modules", desc: "Initializing inventory & payments" },
  { icon: "🩺", label: "Diagnostics", desc: "Running system health checks" },
];

const STAGE_DURATIONS = [600, 700, 900, 800, 700, 700, 800];

export default function BootScreen({ onComplete }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [completedStages, setCompletedStages] = useState([]);
  const [done, setDone] = useState(false);

  const progress = done ? 100 : Math.round((completedStages.length / BOOT_STAGES.length) * 100);

  useEffect(() => {
    if (currentStage >= BOOT_STAGES.length) {
      setDone(true);
      setTimeout(() => onComplete(), 1200);
      return;
    }
    const t = setTimeout(() => {
      setCompletedStages(prev => [...prev, currentStage]);
      setCurrentStage(s => s + 1);
    }, STAGE_DURATIONS[currentStage] || 700);
    return () => clearTimeout(t);
  }, [currentStage]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center select-none px-6">
      <div className="w-full max-w-sm">

        {/* Logo + Branding */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-20 h-20 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mb-4 shadow-lg">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69af2e216ac550b29cb91d67/1c987e80a_088dbd9c0_logo.png"
              alt="RetailOS"
              className="w-14 h-14 object-contain"
            />
          </div>
          <div className="text-white text-xl font-bold tracking-widest font-mono">RetailOS</div>
          <div className="text-gray-500 text-xs font-mono mt-0.5">Terminal LANE-3 · Store 1024</div>
        </motion.div>

        {/* Stage cards */}
        <div className="space-y-2 mb-6">
          {BOOT_STAGES.map((stage, i) => {
            const isCompleted = completedStages.includes(i);
            const isActive = currentStage === i && !done;
            const isPending = !isCompleted && !isActive;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: isPending ? 0.35 : 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
                  isCompleted
                    ? "bg-green-900/20 border-green-800/50"
                    : isActive
                    ? "bg-gray-800 border-gray-600"
                    : "bg-gray-900 border-gray-800"
                }`}
              >
                <span className="text-base">{stage.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold font-mono ${isCompleted ? "text-green-400" : isActive ? "text-white" : "text-gray-600"}`}>
                    {stage.label}
                  </div>
                  <div className={`text-xs font-mono truncate ${isCompleted ? "text-green-700" : isActive ? "text-gray-400" : "text-gray-700"}`}>
                    {stage.desc}
                  </div>
                </div>
                <div className="shrink-0">
                  {isCompleted && <CheckCircle className="w-4 h-4 text-green-400" />}
                  {isActive && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                  {isPending && <div className="w-4 h-4 rounded-full border border-gray-700" />}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-gray-600 text-xs font-mono mb-1.5">
            <span>{done ? "System ready" : "Initializing..."}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-green-500"
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.4 }}
            />
          </div>
        </div>

        {/* Done state */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 text-center"
            >
              <div className="text-green-400 font-mono text-sm font-bold">✓ All systems operational</div>
              <div className="text-gray-500 text-xs font-mono mt-0.5">Launching POS interface...</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}