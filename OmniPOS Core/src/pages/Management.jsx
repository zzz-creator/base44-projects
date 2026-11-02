import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Edit2, Trash2, ChevronRight } from "lucide-react";

const TABS = ["Staff", "Inventory", "Transactions", "Logs", "Reports"];

export default function Management() {
  const [tab, setTab] = useState("Staff");
  const [staff, setStaff] = useState([]);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true);
    if (tab === "Staff") setStaff(await base44.entities.Staff.list());
    if (tab === "Inventory") setProducts(await base44.entities.Product.list());
    if (tab === "Transactions") setTransactions(await base44.entities.Transaction.list("-timestamp", 50));
    if (tab === "Logs") setLogs(await base44.entities.SecurityLog.list("-timestamp", 100));
    if (tab === "Reports") {
      setSessions(await base44.entities.ShiftSession.list("-login_time", 20));
      setTransactions(await base44.entities.Transaction.list("-timestamp", 200));
    }
    setLoading(false);
  };

  const deleteStaff = async (id) => { await base44.entities.Staff.delete(id); loadData(); };
  const deleteProduct = async (id) => { await base44.entities.Product.delete(id); loadData(); };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-green-400 font-bold font-mono text-lg">RetailOS Management</div>
          <div className="text-gray-500 text-xs font-mono">Store 1024 · Admin Console</div>
        </div>
        <a href="/pos" className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2">
          <ChevronRight className="w-4 h-4" /> Open POS Terminal
        </a>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6 flex gap-1 pt-2">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${tab === t ? "bg-gray-800 text-white border-t border-l border-r border-gray-700" : "text-gray-500 hover:text-gray-300"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="p-6">
        {loading && <div className="text-gray-500 font-mono text-sm">Loading...</div>}

        {/* STAFF */}
        {tab === "Staff" && !loading && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-gray-300 font-semibold">Staff Members ({staff.length})</div>
              <button onClick={() => { setEditItem({ role: "cashier", active: true }); setShowForm(true); }}
                className="flex items-center gap-1.5 bg-green-800 hover:bg-green-700 px-3 py-1.5 rounded-lg text-sm transition">
                <Plus className="w-4 h-4" /> Add Staff
              </button>
            </div>
            <div className="space-y-2">
              {staff.map(s => (
                <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold">{s.name} <span className="text-gray-500 text-sm font-normal">#{s.staff_id}</span></div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-mono capitalize ${
                        s.role === "administrator" ? "bg-purple-900/40 text-purple-400 border border-purple-800"
                        : s.role === "manager" ? "bg-blue-900/40 text-blue-400 border border-blue-800"
                        : s.role === "supervisor" ? "bg-amber-900/40 text-amber-400 border border-amber-800"
                        : "bg-gray-800 text-gray-400 border border-gray-700"
                      }`}>{s.role}</span>
                      <span className={`text-xs ${s.active ? "text-green-400" : "text-red-400"}`}>
                        {s.active ? "● Active" : "○ Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditItem(s); setShowForm(true); }} className="text-gray-600 hover:text-blue-400 transition p-1"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteStaff(s.id)} className="text-gray-600 hover:text-red-400 transition p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            {showForm && <StaffForm item={editItem} onSave={async (data) => {
              if (data.id) await base44.entities.Staff.update(data.id, data);
              else await base44.entities.Staff.create(data);
              setShowForm(false); loadData();
            }} onClose={() => setShowForm(false)} />}
          </div>
        )}

        {/* INVENTORY */}
        {tab === "Inventory" && !loading && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-gray-300 font-semibold">Products ({products.length})</div>
              <button onClick={() => { setEditItem({ price: 0, stock: 0, tax_class: "standard", age_restricted: false }); setShowForm(true); }}
                className="flex items-center gap-1.5 bg-green-800 hover:bg-green-700 px-3 py-1.5 rounded-lg text-sm transition">
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 font-mono text-xs border-b border-gray-800">
                    <th className="text-left pb-2 pr-4">Name</th>
                    <th className="text-left pb-2 pr-4">Barcode</th>
                    <th className="text-left pb-2 pr-4">Price</th>
                    <th className="text-left pb-2 pr-4">Stock</th>
                    <th className="text-left pb-2 pr-4">Category</th>
                    <th className="text-left pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-gray-900 hover:bg-gray-900/50 transition">
                      <td className="py-2 pr-4 text-white font-medium">{p.name} {p.age_restricted && <span className="text-amber-400 text-xs ml-1">18+</span>}</td>
                      <td className="py-2 pr-4 text-gray-400 font-mono text-xs">{p.barcode || "—"}</td>
                      <td className="py-2 pr-4 text-green-400 font-mono">${p.price?.toFixed(2)}</td>
                      <td className="py-2 pr-4 text-gray-300">{p.stock}</td>
                      <td className="py-2 pr-4 text-gray-400 text-xs">{p.category || "—"}</td>
                      <td className="py-2 flex gap-2">
                        <button onClick={() => { setEditItem(p); setShowForm(true); }} className="text-gray-600 hover:text-blue-400 transition"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteProduct(p.id)} className="text-gray-600 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {showForm && <ProductForm item={editItem} onSave={async (data) => {
              if (data.id) await base44.entities.Product.update(data.id, data);
              else await base44.entities.Product.create(data);
              setShowForm(false); loadData();
            }} onClose={() => setShowForm(false)} />}
          </div>
        )}

        {/* TRANSACTIONS */}
        {tab === "Transactions" && !loading && (
          <div>
            <div className="text-gray-300 font-semibold mb-4">Recent Transactions</div>
            <div className="space-y-2">
              {transactions.map(t => (
                <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-mono text-sm font-bold">{t.transaction_id}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{t.timestamp ? new Date(t.timestamp).toLocaleString() : "—"} · {t.staff_id} · {t.terminal_id}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-mono font-bold">${t.total?.toFixed(2)}</div>
                      <div className={`text-xs capitalize mt-0.5 ${t.status === "completed" ? "text-green-500" : t.status === "voided" ? "text-red-400" : "text-gray-400"}`}>{t.status}</div>
                    </div>
                  </div>
                  <div className="text-gray-600 text-xs mt-1 capitalize">{t.payment_method?.replace("_", " ")} · {t.mode}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOGS */}
        {tab === "Logs" && !loading && (
          <div>
            <div className="text-gray-300 font-semibold mb-4">Security Logs</div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {logs.map((log, i) => (
                <div key={log.id} className={`flex items-start gap-3 px-4 py-2.5 text-xs font-mono ${i % 2 === 0 ? "bg-gray-900" : "bg-gray-900/50"} border-b border-gray-800 last:border-0`}>
                  <span className="text-gray-600 shrink-0">{log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}</span>
                  <span className={`shrink-0 font-bold ${
                    log.event_type?.includes("login") ? "text-green-400"
                    : log.event_type?.includes("void") || log.event_type?.includes("alert") ? "text-red-400"
                    : log.event_type?.includes("discount") || log.event_type?.includes("override") ? "text-amber-400"
                    : "text-blue-400"
                  }`}>[{log.event_type}]</span>
                  <span className="text-gray-300">{log.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORTS */}
        {tab === "Reports" && !loading && (
          <ReportsTab transactions={transactions} sessions={sessions} />
        )}
      </div>
    </div>
  );
}

function ReportsTab({ transactions, sessions }) {
  const totalRevenue = transactions.filter(t => t.status === "completed").reduce((s, t) => s + (t.total || 0), 0);
  const todayTx = transactions.filter(t => t.timestamp && new Date(t.timestamp).toDateString() === new Date().toDateString());
  const todayRev = todayTx.reduce((s, t) => s + (t.total || 0), 0);

  const byMethod = transactions.reduce((acc, t) => {
    if (!t.payment_method) return acc;
    acc[t.payment_method] = (acc[t.payment_method] || 0) + (t.total || 0);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, color: "text-green-400" },
          { label: "Today's Revenue", value: `$${todayRev.toFixed(2)}`, color: "text-blue-400" },
          { label: "Total Transactions", value: transactions.length, color: "text-purple-400" },
          { label: "Today's Transactions", value: todayTx.length, color: "text-amber-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-gray-500 text-xs font-mono mb-1">{stat.label}</div>
            <div className={`font-bold text-2xl font-mono ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="text-gray-300 font-semibold mb-3">Revenue by Payment Method</div>
        <div className="space-y-2">
          {Object.entries(byMethod).map(([method, amount]) => (
            <div key={method} className="flex items-center gap-3">
              <div className="w-24 text-gray-400 text-xs font-mono capitalize">{method.replace("_", " ")}</div>
              <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, (amount / totalRevenue) * 100)}%` }} />
              </div>
              <div className="text-white font-mono text-sm w-20 text-right">${amount.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="text-gray-300 font-semibold mb-3">Recent Shift Sessions</div>
        <div className="space-y-2">
          {sessions.map(s => (
            <div key={s.id} className="flex items-center justify-between text-sm border-b border-gray-800 pb-2">
              <div>
                <div className="text-white font-semibold">Staff {s.staff_id} · {s.terminal_id}</div>
                <div className="text-gray-500 text-xs">{s.login_time ? new Date(s.login_time).toLocaleString() : "—"}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-300 text-xs">{s.transactions_count} tx · {s.void_count} voids</div>
                <div className={`text-xs ${s.status === "active" ? "text-green-400" : "text-gray-500"}`}>{s.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StaffForm({ item, onSave, onClose }) {
  const [form, setForm] = useState({ ...item });
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
        <div className="text-white font-bold mb-4">{form.id ? "Edit" : "Add"} Staff</div>
        {[["name","Name","text"],["staff_id","Staff ID","text"],["pin","PIN","password"],["badge_code","Badge Code","text"]].map(([key,label,type]) => (
          <div key={key} className="mb-3">
            <label className="text-gray-500 text-xs font-mono mb-1 block">{label}</label>
            <input type={type} value={form[key] || ""} onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 transition" />
          </div>
        ))}
        <div className="mb-3">
          <label className="text-gray-500 text-xs font-mono mb-1 block">Role</label>
          <select value={form.role || "cashier"} onChange={e => setForm(f => ({...f, role: e.target.value}))}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none">
            {["cashier","supervisor","manager","administrator"].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-gray-400 text-sm mb-4 cursor-pointer">
          <input type="checkbox" checked={form.active !== false} onChange={e => setForm(f => ({...f, active: e.target.checked}))} />
          Active
        </label>
        <div className="flex gap-2">
          <button onClick={() => onSave(form)} className="flex-1 bg-green-700 hover:bg-green-600 text-white font-bold py-2 rounded-xl text-sm transition">Save</button>
          <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-xl text-sm transition">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ProductForm({ item, onSave, onClose }) {
  const [form, setForm] = useState({ ...item });
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
        <div className="text-white font-bold mb-4">{form.id ? "Edit" : "Add"} Product</div>
        {[["name","Name","text"],["barcode","Barcode","text"],["category","Category","text"]].map(([key,label,type]) => (
          <div key={key} className="mb-3">
            <label className="text-gray-500 text-xs font-mono mb-1 block">{label}</label>
            <input type={type} value={form[key] || ""} onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 transition" />
          </div>
        ))}
        {[["price","Price"],["stock","Stock Qty"]].map(([key,label]) => (
          <div key={key} className="mb-3">
            <label className="text-gray-500 text-xs font-mono mb-1 block">{label}</label>
            <input type="number" value={form[key] || 0} onChange={e => setForm(f => ({...f, [key]: parseFloat(e.target.value)}))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 transition" step="0.01" />
          </div>
        ))}
        <label className="flex items-center gap-2 text-gray-400 text-sm mb-4 cursor-pointer">
          <input type="checkbox" checked={form.age_restricted || false} onChange={e => setForm(f => ({...f, age_restricted: e.target.checked}))} />
          Age Restricted (18+)
        </label>
        <div className="flex gap-2">
          <button onClick={() => onSave(form)} className="flex-1 bg-green-700 hover:bg-green-600 text-white font-bold py-2 rounded-xl text-sm transition">Save</button>
          <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-xl text-sm transition">Cancel</button>
        </div>
      </div>
    </div>
  );
}