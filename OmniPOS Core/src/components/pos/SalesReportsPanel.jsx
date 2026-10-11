import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, Package, Tag, Users } from "lucide-react";

const COLORS = ["#22c55e", "#60a5fa", "#a78bfa", "#fb923c", "#f472b6", "#34d399", "#facc15"];

export default function SalesReportsPanel() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [activeTab, setActiveTab] = useState("product");

  useEffect(() => {
    base44.entities.Transaction.list("-timestamp", 1000).then(txs => {
      setTransactions(txs.filter(t => t.status === "completed"));
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => transactions.filter(tx => {
    if (!tx.timestamp) return false;
    const d = new Date(tx.timestamp).toISOString().split("T")[0];
    return d >= dateFrom && d <= dateTo;
  }), [transactions, dateFrom, dateTo]);

  const byProduct = useMemo(() => {
    const map = {};
    filtered.forEach(tx => (tx.items || []).forEach(item => {
      if (!map[item.name]) map[item.name] = { name: item.name, units: 0, revenue: 0 };
      map[item.name].units += item.qty || 1;
      map[item.name].revenue += (item.price || 0) * (item.qty || 1);
    }));
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 15);
  }, [filtered]);

  const byCategory = useMemo(() => {
    const map = {};
    filtered.forEach(tx => (tx.items || []).forEach(item => {
      const cat = item.category || "Other";
      if (!map[cat]) map[cat] = { name: cat, revenue: 0, units: 0 };
      map[cat].revenue += (item.price || 0) * (item.qty || 1);
      map[cat].units += item.qty || 1;
    }));
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  const byStaff = useMemo(() => {
    const map = {};
    filtered.forEach(tx => {
      const s = tx.staff_id || "Unknown";
      if (!map[s]) map[s] = { staff_id: s, transactions: 0, revenue: 0 };
      map[s].transactions++;
      map[s].revenue += tx.total || 0;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  if (loading) return <div className="text-green-400 font-mono animate-pulse p-6">Loading reports...</div>;

  const totalRevenue = filtered.reduce((s, t) => s + (t.total || 0), 0);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800 flex flex-wrap items-center gap-3">
        <Calendar className="w-4 h-4 text-gray-500" />
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-300 text-xs font-mono focus:outline-none focus:border-green-600" />
        <span className="text-gray-600 text-xs">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-300 text-xs font-mono focus:outline-none focus:border-green-600" />
        <div className="ml-auto flex gap-6 text-xs font-mono">
          <span className="text-gray-500">{filtered.length} <span className="text-gray-400">transactions</span></span>
          <span className="text-green-400 font-bold">${totalRevenue.toFixed(2)} <span className="text-gray-400 font-normal">revenue</span></span>
        </div>
      </div>

      <div className="px-4 pt-3 flex gap-1 border-b border-gray-800">
        {[
          { id: "product", label: "By Product", icon: Package },
          { id: "category", label: "By Category", icon: Tag },
          { id: "staff", label: "By Staff", icon: Users },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono rounded-t-lg transition ${activeTab === t.id ? "bg-gray-800 text-green-400 border border-gray-700 border-b-transparent" : "text-gray-500 hover:text-gray-300"}`}>
            <t.icon className="w-3 h-3" /> {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "product" && (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-gray-300 font-semibold text-sm mb-3">Revenue by Product (Top 10)</div>
              {byProduct.length === 0 ? <div className="text-gray-600 text-sm font-mono text-center py-8">No data for this period</div> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byProduct.slice(0, 10)} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={v => `$${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 9 }} width={100} />
                    <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#f9fafb", fontSize: 11 }} formatter={v => [`$${Number(v).toFixed(2)}`, "Revenue"]} />
                    <Bar dataKey="revenue" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-gray-800">
                {["Product", "Units Sold", "Revenue", "Avg Price"].map(h => <th key={h} className="text-left text-gray-500 px-3 py-2">{h}</th>)}
              </tr></thead>
              <tbody>
                {byProduct.map(p => (
                  <tr key={p.name} className="border-b border-gray-800/40 hover:bg-gray-800/30">
                    <td className="px-3 py-2 text-white">{p.name}</td>
                    <td className="px-3 py-2 text-blue-400">{p.units}</td>
                    <td className="px-3 py-2 text-green-400 font-bold">${p.revenue.toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-400">${(p.revenue / p.units).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {activeTab === "category" && (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="text-gray-300 font-semibold text-sm mb-3">Revenue Share by Category</div>
                {byCategory.length === 0 ? <div className="text-gray-600 text-sm font-mono text-center py-8">No data</div> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={byCategory} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#f9fafb", fontSize: 11 }} formatter={v => [`$${Number(v).toFixed(2)}`, "Revenue"]} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="text-gray-300 font-semibold text-sm mb-3">Units Sold by Category</div>
                {byCategory.length === 0 ? <div className="text-gray-600 text-sm font-mono text-center py-8">No data</div> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byCategory} margin={{ left: -10 }}>
                      <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 9 }} />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#f9fafb", fontSize: 11 }} />
                      <Bar dataKey="units" radius={[4, 4, 0, 0]}>
                        {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-gray-800">
                {["Category", "Units", "Revenue", "% of Total"].map(h => <th key={h} className="text-left text-gray-500 px-3 py-2">{h}</th>)}
              </tr></thead>
              <tbody>
                {byCategory.map(c => (
                  <tr key={c.name} className="border-b border-gray-800/40 hover:bg-gray-800/30">
                    <td className="px-3 py-2 text-white">{c.name}</td>
                    <td className="px-3 py-2 text-purple-400">{c.units}</td>
                    <td className="px-3 py-2 text-green-400 font-bold">${c.revenue.toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-400">{totalRevenue > 0 ? (c.revenue / totalRevenue * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {activeTab === "staff" && (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-gray-300 font-semibold text-sm mb-3">Revenue by Staff Member</div>
              {byStaff.length === 0 ? <div className="text-gray-600 text-sm font-mono text-center py-8">No data</div> : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={byStaff} margin={{ left: -10 }}>
                    <XAxis dataKey="staff_id" tick={{ fill: "#6b7280", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={v => `$${v}`} />
                    <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#f9fafb", fontSize: 11 }} formatter={v => [`$${Number(v).toFixed(2)}`, "Revenue"]} />
                    <Bar dataKey="revenue" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-gray-800">
                {["Staff ID", "Transactions", "Total Revenue", "Avg Transaction"].map(h => <th key={h} className="text-left text-gray-500 px-3 py-2">{h}</th>)}
              </tr></thead>
              <tbody>
                {byStaff.map(s => (
                  <tr key={s.staff_id} className="border-b border-gray-800/40 hover:bg-gray-800/30">
                    <td className="px-3 py-2 text-white">{s.staff_id}</td>
                    <td className="px-3 py-2 text-blue-400">{s.transactions}</td>
                    <td className="px-3 py-2 text-green-400 font-bold">${s.revenue.toFixed(2)}</td>
                    <td className="px-3 py-2 text-purple-400">${(s.revenue / s.transactions).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}