import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, ShoppingCart, DollarSign, Clock, List, Package, Settings, BarChart2, Gift, Truck, Tag, Users, CalendarDays } from "lucide-react";
import TransactionHistory from "./TransactionHistory";
import InventoryPanel from "./InventoryPanel";
import StoreSettingsPanel from "./StoreSettingsPanel";
import SalesReportsPanel from "./SalesReportsPanel";
import GiftCardPanel from "./GiftCardPanel";
import PurchaseOrderPanel from "./PurchaseOrderPanel";
import CouponPanel from "./CouponPanel";
import CustomerPanel from "./CustomerPanel";
import StaffSchedulingPanel from "./StaffSchedulingPanel";

export default function POSDashboard({ onClose }) {
  const [tab, setTab] = useState("overview");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Transaction.list("-timestamp", 200).then(txs => {
      setTransactions(txs);
      setLoading(false);
    });
  }, []);

  const today = new Date().toDateString();
  const todayTx = transactions.filter(t => t.timestamp && new Date(t.timestamp).toDateString() === today && t.status === "completed");
  const todayRevenue = todayTx.reduce((s, t) => s + (t.total || 0), 0);

  // Hourly volume today
  const hourlyData = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    const txs = todayTx.filter(t => new Date(t.timestamp).getHours() === hour);
    return { hour: `${hour}:00`, count: txs.length, revenue: txs.reduce((s, t) => s + (t.total || 0), 0) };
  });

  // Popular items
  const itemCounts = {};
  todayTx.forEach(t => (t.items || []).forEach(item => {
    itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.qty || 1);
  }));
  const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([name, count]) => ({ name: name.length > 14 ? name.slice(0, 14) + "…" : name, count }));

  // Last 7 days revenue
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("en", { weekday: "short" });
    const rev = transactions.filter(t => t.timestamp && new Date(t.timestamp).toDateString() === d.toDateString() && t.status === "completed")
      .reduce((s, t) => s + (t.total || 0), 0);
    return { label, revenue: parseFloat(rev.toFixed(2)) };
  });

  const avgTx = todayTx.length ? (todayRevenue / todayTx.length) : 0;

  if (loading) return (
    <div className="fixed inset-0 bg-gray-950 z-40 flex items-center justify-center">
      <div className="text-green-400 font-mono animate-pulse">Loading dashboard...</div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-950 z-40 flex flex-col overflow-hidden">
      <div className="border-b border-gray-800 px-6 py-3 flex items-center justify-between bg-gray-900">
        <div className="flex items-center gap-4">
          <div className="text-green-400 font-bold font-mono">Dashboard</div>
          <div className="flex flex-wrap gap-1">
            {[
            { id: "overview", label: "Overview" },
            { id: "transactions", label: "Transactions" },
            { id: "reports", label: "Sales Reports" },
            { id: "inventory", label: "Inventory" },
            { id: "purchases", label: "Purchases" },
            { id: "giftcards", label: "Gift Cards" },
            { id: "coupons", label: "Coupons" },
            { id: "customers", label: "Customers" },
            { id: "scheduling", label: "Scheduling" },
            { id: "settings", label: "Settings" },
          ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition ${tab === t.id ? "bg-green-900/40 text-green-400 border border-green-800" : "text-gray-500 hover:text-gray-300"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition">← Back to POS</button>
      </div>

      {tab === "transactions" && (
        <div className="flex-1 overflow-hidden">
          <TransactionHistory />
        </div>
      )}

      {tab === "reports" && (
        <div className="flex-1 overflow-hidden">
          <SalesReportsPanel />
        </div>
      )}

      {tab === "purchases" && (
        <div className="flex-1 overflow-hidden">
          <PurchaseOrderPanel />
        </div>
      )}

      {tab === "giftcards" && (
        <div className="flex-1 overflow-hidden">
          <GiftCardPanel />
        </div>
      )}

      {tab === "coupons" && (
        <div className="flex-1 overflow-hidden">
          <CouponPanel />
        </div>
      )}

      {tab === "inventory" && (
        <div className="flex-1 overflow-hidden">
          <InventoryPanel />
        </div>
      )}

      {tab === "customers" && (
        <div className="flex-1 overflow-hidden">
          <CustomerPanel />
        </div>
      )}

      {tab === "scheduling" && (
        <div className="flex-1 overflow-hidden">
          <StaffSchedulingPanel />
        </div>
      )}

      {tab === "settings" && (
        <div className="flex-1 overflow-y-auto flex flex-col">
          <StoreSettingsPanel />
        </div>
      )}

      {tab === "overview" && (<div className="p-5 space-y-5 max-w-5xl mx-auto overflow-y-auto flex-1">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: DollarSign, label: "Today's Revenue", value: `$${todayRevenue.toFixed(2)}`, color: "text-green-400", bg: "bg-green-900/20 border-green-800" },
            { icon: ShoppingCart, label: "Transactions", value: todayTx.length, color: "text-blue-400", bg: "bg-blue-900/20 border-blue-800" },
            { icon: TrendingUp, label: "Avg. Basket", value: `$${avgTx.toFixed(2)}`, color: "text-purple-400", bg: "bg-purple-900/20 border-purple-800" },
            { icon: Clock, label: "Peak Hour", value: hourlyData.reduce((max, h) => h.count > max.count ? h : max, { hour: "—", count: 0 }).hour, color: "text-amber-400", bg: "bg-amber-900/20 border-amber-800" },
          ].map(kpi => (
            <div key={kpi.label} className={`rounded-xl border p-4 ${kpi.bg}`}>
              <kpi.icon className={`w-4 h-4 ${kpi.color} mb-1.5`} />
              <div className="text-gray-500 text-xs font-mono">{kpi.label}</div>
              <div className={`font-bold text-xl font-mono mt-0.5 ${kpi.color}`}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Hourly transactions */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-gray-300 font-semibold text-sm mb-3">Today — Hourly Transaction Volume</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={hourlyData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <XAxis dataKey="hour" tick={{ fill: "#6b7280", fontSize: 10 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#f9fafb", fontSize: 12 }} />
              <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} name="Transactions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* 7-day revenue */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-gray-300 font-semibold text-sm mb-3">7-Day Revenue Trend</div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={weekData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 10 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#f9fafb", fontSize: 12 }} formatter={(v) => [`$${v}`, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="#60a5fa" strokeWidth={2} dot={{ fill: "#60a5fa", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top items */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-gray-300 font-semibold text-sm mb-3">Most Popular Items Today</div>
            {topItems.length === 0 ? (
              <div className="text-gray-600 text-sm font-mono text-center py-8">No sales yet today</div>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} width={90} />
                  <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#f9fafb", fontSize: 12 }} />
                  <Bar dataKey="count" fill="#a78bfa" radius={[0, 4, 4, 0]} name="Units Sold" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>)}
    </div>
  );
}