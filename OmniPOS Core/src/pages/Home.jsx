import React from "react";
import { createPageUrl } from "@/utils";
import { Monitor, Settings, ChevronRight, ShieldCheck, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/30 rounded-2xl border border-green-800 mb-4">
            <Monitor className="w-8 h-8 text-green-400" />
          </div>
          <div className="text-white font-bold text-3xl">RetailOS</div>
          <div className="text-gray-400 font-mono text-sm mt-1">Point of Sale Terminal System v1.0</div>
        </motion.div>

        <div className="space-y-3">
          <motion.a href={createPageUrl("POS")} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="flex items-center justify-between bg-gray-900 border border-gray-700 hover:border-green-700 rounded-2xl p-5 transition group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-900/30 rounded-xl flex items-center justify-center border border-green-800">
                <Monitor className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-white font-semibold">Launch POS Terminal</div>
                <div className="text-gray-500 text-sm">Boot the checkout terminal</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-green-400 transition" />
          </motion.a>

          <motion.a href={createPageUrl("Management")} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="flex items-center justify-between bg-gray-900 border border-gray-700 hover:border-blue-700 rounded-2xl p-5 transition group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-900/30 rounded-xl flex items-center justify-center border border-blue-800">
                <Settings className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-white font-semibold">Management Console</div>
                <div className="text-gray-500 text-sm">Staff, inventory, reports & logs</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition" />
          </motion.a>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-gray-500 text-xs font-mono mb-2">DEMO STAFF PINS</div>
          <div className="grid grid-cols-2 gap-1 text-xs font-mono">
            <div className="text-gray-400">Administrator: <span className="text-green-400">0000</span></div>
            <div className="text-gray-400">Manager: <span className="text-blue-400">1234</span></div>
            <div className="text-gray-400">Supervisor: <span className="text-amber-400">5678</span></div>
            <div className="text-gray-400">Cashier: <span className="text-gray-300">9012</span></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}