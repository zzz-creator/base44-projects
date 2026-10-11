import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Plus, Pencil, Trash2, X, Star, ShoppingBag, Phone, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EMPTY = { first_name: "", last_name: "", email: "", phone: "", address: "", notes: "" };

function CustomerForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <div className="text-white font-bold font-mono">{initial?.id ? "Edit Customer" : "New Customer"}</div>
          <button onClick={onCancel}><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="First Name *" value={form.first_name} onChange={e => set("first_name", e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-600" />
            <input placeholder="Last Name *" value={form.last_name} onChange={e => set("last_name", e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-600" />
          </div>
          <input placeholder="Email" value={form.email} onChange={e => set("email", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-600" />
          <input placeholder="Phone" value={form.phone} onChange={e => set("phone", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-600" />
          <input placeholder="Address" value={form.address} onChange={e => set("address", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-600" />
          <textarea placeholder="Notes" value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-600 resize-none" />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="flex-1 bg-gray-800 border border-gray-700 text-gray-300 py-2 rounded-xl text-sm font-mono transition hover:bg-gray-700">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.first_name || !form.last_name}
            className="flex-1 bg-green-700 hover:bg-green-600 text-white font-bold py-2 rounded-xl text-sm font-mono transition disabled:opacity-40">Save</button>
        </div>
      </div>
    </div>
  );
}

function CustomerDetail({ customer, transactions, onClose, onEdit, onAdjustPoints }) {
  const [pointsAdj, setPointsAdj] = useState("");
  const txList = transactions.filter(t => t.customer_id === customer.id);
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-white font-bold text-lg font-mono">{customer.first_name} {customer.last_name}</div>
            <div className="text-gray-500 text-xs font-mono mt-0.5">Customer Profile</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(customer)} className="text-gray-500 hover:text-blue-400 transition"><Pencil className="w-4 h-4" /></button>
            <button onClick={onClose}><X className="w-4 h-4 text-gray-500" /></button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Loyalty Pts", value: customer.loyalty_points || 0, color: "text-amber-400" },
            { label: "Total Spent", value: `$${(customer.total_spent || 0).toFixed(2)}`, color: "text-green-400" },
            { label: "Visits", value: customer.visit_count || 0, color: "text-blue-400" },
          ].map(s => (
            <div key={s.label} className="bg-gray-800 rounded-xl p-3 text-center">
              <div className={`font-bold font-mono text-lg ${s.color}`}>{s.value}</div>
              <div className="text-gray-500 text-xs font-mono">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Contact info */}
        <div className="bg-gray-800 rounded-xl p-3 mb-4 space-y-1.5 text-xs font-mono">
          {customer.email && <div className="flex items-center gap-2 text-gray-400"><Mail className="w-3.5 h-3.5" />{customer.email}</div>}
          {customer.phone && <div className="flex items-center gap-2 text-gray-400"><Phone className="w-3.5 h-3.5" />{customer.phone}</div>}
          {customer.notes && <div className="text-gray-500 italic">{customer.notes}</div>}
        </div>

        {/* Adjust points */}
        <div className="flex gap-2 mb-4">
          <input type="number" placeholder="Adjust points (e.g. +50 or -10)" value={pointsAdj} onChange={e => setPointsAdj(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-600" />
          <button onClick={() => { onAdjustPoints(customer, parseInt(pointsAdj)); setPointsAdj(""); }}
            disabled={!pointsAdj}
            className="bg-amber-700 hover:bg-amber-600 text-white text-xs font-mono px-3 py-2 rounded-lg transition disabled:opacity-40">Apply</button>
        </div>

        {/* Purchase history */}
        <div className="text-gray-400 text-xs font-mono font-semibold mb-2">Purchase History ({txList.length})</div>
        {txList.length === 0 ? (
          <div className="text-gray-600 text-xs font-mono text-center py-6">No transactions linked to this customer</div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {txList.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map(t => (
              <div key={t.id} className="bg-gray-800 rounded-lg px-3 py-2 flex justify-between items-center text-xs font-mono">
                <div>
                  <div className="text-white">{t.transaction_id}</div>
                  <div className="text-gray-500">{t.timestamp ? new Date(t.timestamp).toLocaleString() : "—"}</div>
                </div>
                <div className="text-green-400 font-bold">${(t.total || 0).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        <button onClick={onClose} className="w-full mt-4 bg-gray-800 border border-gray-700 text-gray-300 py-2 rounded-xl text-sm font-mono hover:bg-gray-700 transition">Close</button>
      </div>
    </div>
  );
}

export default function CustomerPanel() {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Customer.list("first_name", 500),
      base44.entities.Transaction.list("-timestamp", 500)
    ]).then(([c, t]) => { setCustomers(c); setTransactions(t); setLoading(false); });
  }, []);

  const load = () => base44.entities.Customer.list("first_name", 500).then(setCustomers);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q || `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q);
  });

  const handleSave = async (form) => {
    if (editing?.id) await base44.entities.Customer.update(editing.id, form);
    else await base44.entities.Customer.create(form);
    setEditing(null);
    load();
  };

  const handleDelete = async (c) => {
    await base44.entities.Customer.delete(c.id);
    setDeleteConfirm(null);
    load();
  };

  const handleAdjustPoints = async (customer, delta) => {
    const newPts = Math.max(0, (customer.loyalty_points || 0) + delta);
    await base44.entities.Customer.update(customer.id, { loyalty_points: newPts });
    setViewing({ ...customer, loyalty_points: newPts });
    load();
  };

  if (loading) return <div className="text-green-400 font-mono animate-pulse p-6">Loading customers...</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-800 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers…"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-green-600 transition" />
        </div>
        <button onClick={() => setEditing({})}
          className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white text-xs font-mono px-3 py-2 rounded-lg transition">
          <Plus className="w-3.5 h-3.5" /> Add Customer
        </button>
        <div className="text-gray-600 text-xs font-mono">{filtered.length} customers</div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-gray-600 font-mono text-sm text-center py-16">No customers found</div>
        ) : (
          <table className="w-full text-xs font-mono">
            <thead className="sticky top-0 bg-gray-900 border-b border-gray-800">
              <tr>
                {["Name", "Email", "Phone", "Loyalty Pts", "Total Spent", "Visits", "Actions"].map(h => (
                  <th key={h} className="text-left text-gray-500 px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-gray-800/60 hover:bg-gray-800/30 transition cursor-pointer" onClick={() => setViewing(c)}>
                  <td className="px-4 py-2.5 text-white font-semibold">{c.first_name} {c.last_name}</td>
                  <td className="px-4 py-2.5 text-gray-400">{c.email || "—"}</td>
                  <td className="px-4 py-2.5 text-gray-400">{c.phone || "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-amber-400 font-bold flex items-center gap-1"><Star className="w-3 h-3" />{c.loyalty_points || 0}</span>
                  </td>
                  <td className="px-4 py-2.5 text-green-400 font-bold">${(c.total_spent || 0).toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-blue-400">{c.visit_count || 0}</td>
                  <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(c)} className="text-gray-500 hover:text-blue-400 transition"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteConfirm(c)} className="text-gray-500 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing !== null && <CustomerForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />}

      {viewing && (
        <CustomerDetail
          customer={viewing}
          transactions={transactions}
          onClose={() => setViewing(null)}
          onEdit={(c) => { setViewing(null); setEditing(c); }}
          onAdjustPoints={handleAdjustPoints}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-800 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
            <div className="text-white font-bold mb-1">Delete Customer?</div>
            <div className="text-gray-400 text-sm mb-4">"{deleteConfirm.first_name} {deleteConfirm.last_name}" will be removed.</div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-800 border border-gray-700 text-gray-300 py-2 rounded-xl text-sm transition hover:bg-gray-700">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded-xl text-sm transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}