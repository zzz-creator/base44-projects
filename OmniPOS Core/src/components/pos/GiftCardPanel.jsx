import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Gift, Plus, RefreshCw, Ban, Search } from "lucide-react";

const STATUS_COLORS = { active: "text-green-400", depleted: "text-red-400", voided: "text-gray-500" };

export default function GiftCardPanel() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ code: "", balance: "", notes: "" });
  const [reloadAmount, setReloadAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.GiftCard.list("-created_date", 200).then(c => { setCards(c); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const filtered = cards.filter(c => !search || c.code?.toLowerCase().includes(search.toLowerCase()));

  const issueCard = async () => {
    setSaving(true);
    const bal = parseFloat(form.balance) || 0;
    await base44.entities.GiftCard.create({
      code: form.code.toUpperCase(),
      balance: bal,
      original_balance: bal,
      status: "active",
      notes: form.notes
    });
    setSaving(false);
    setModal(null);
    setForm({ code: "", balance: "", notes: "" });
    load();
  };

  const reloadCard = async (card) => {
    setSaving(true);
    const amt = parseFloat(reloadAmount) || 0;
    await base44.entities.GiftCard.update(card.id, {
      balance: (card.balance || 0) + amt,
      status: "active"
    });
    setSaving(false);
    setModal(null);
    setReloadAmount("");
    load();
  };

  const voidCard = async (card) => {
    await base44.entities.GiftCard.update(card.id, { status: "voided", balance: 0 });
    load();
  };

  if (loading) return <div className="text-green-400 font-mono animate-pulse p-6">Loading gift cards...</div>;

  const totalValue = cards.filter(c => c.status === "active").reduce((s, c) => s + (c.balance || 0), 0);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by code…"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-green-600" />
        </div>
        <div className="text-xs font-mono text-gray-500">
          Active liability: <span className="text-green-400 font-bold">${totalValue.toFixed(2)}</span>
        </div>
        <button onClick={() => setModal("issue")}
          className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white text-xs font-mono px-3 py-2 rounded-lg transition">
          <Plus className="w-3.5 h-3.5" /> Issue Gift Card
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs font-mono">
          <thead className="sticky top-0 bg-gray-900 border-b border-gray-800">
            <tr>
              {["Code", "Balance", "Original", "Status", "Issued", "Notes", "Actions"].map(h => (
                <th key={h} className="text-left text-gray-500 px-4 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(card => (
              <tr key={card.id} className="border-b border-gray-800/60 hover:bg-gray-800/30">
                <td className="px-4 py-2.5 text-white font-bold tracking-widest">{card.code}</td>
                <td className="px-4 py-2.5 text-green-400 font-bold">${(card.balance || 0).toFixed(2)}</td>
                <td className="px-4 py-2.5 text-gray-500">${(card.original_balance || 0).toFixed(2)}</td>
                <td className={`px-4 py-2.5 capitalize ${STATUS_COLORS[card.status] || "text-gray-400"}`}>{card.status}</td>
                <td className="px-4 py-2.5 text-gray-500">
                  {card.created_date ? new Date(card.created_date).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-2.5 text-gray-500">{card.notes || "—"}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-2">
                    {card.status === "active" && (
                      <button onClick={() => { setModal({ card, type: "reload" }); setReloadAmount(""); }}
                        className="text-gray-500 hover:text-blue-400 transition" title="Reload">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {card.status !== "voided" && (
                      <button onClick={() => voidCard(card)} className="text-gray-500 hover:text-red-400 transition" title="Void">
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-gray-600 text-center py-12 font-mono">No gift cards found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal === "issue" && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
            <div className="text-white font-bold mb-4 flex items-center gap-2"><Gift className="w-4 h-4 text-pink-400" /> Issue Gift Card</div>
            <div className="space-y-3">
              <div>
                <label className="text-gray-500 text-xs font-mono block mb-1">Card Code</label>
                <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="GC-2024-XXXX"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-gray-500 text-xs font-mono block mb-1">Initial Balance ($)</label>
                <input type="number" value={form.balance} onChange={e => setForm(p => ({ ...p, balance: e.target.value }))} placeholder="25.00"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-gray-500 text-xs font-mono block mb-1">Notes (optional)</label>
                <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Customer name, occasion…"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2 rounded-xl text-sm transition">Cancel</button>
              <button onClick={issueCard} disabled={saving || !form.code || !form.balance}
                className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white font-bold py-2 rounded-xl text-sm transition">
                {saving ? "Issuing…" : "Issue Card"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal?.type === "reload" && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
            <div className="text-white font-bold mb-1">Reload Gift Card</div>
            <div className="text-green-400 font-mono text-sm mb-4">{modal.card.code} — Balance: ${(modal.card.balance || 0).toFixed(2)}</div>
            <div>
              <label className="text-gray-500 text-xs font-mono block mb-1">Add Amount ($)</label>
              <input type="number" value={reloadAmount} onChange={e => setReloadAmount(e.target.value)} placeholder="0.00" autoFocus
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2 rounded-xl text-sm transition">Cancel</button>
              <button onClick={() => reloadCard(modal.card)} disabled={saving || !reloadAmount}
                className="flex-1 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white font-bold py-2 rounded-xl text-sm transition">
                {saving ? "Reloading…" : "Reload Card"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}