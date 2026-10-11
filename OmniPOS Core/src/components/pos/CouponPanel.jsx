import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Tag, Trash2, X, ToggleLeft, ToggleRight } from "lucide-react";

const CATEGORIES = ["Food", "Beverage", "Electronics", "Clothing", "Health", "Household", "Other"];
const TYPE_LABELS = { percent: "% Off Cart", fixed: "$ Fixed Off", bogo: "Buy 1 Get 1", category_percent: "Category %" };
const TYPE_COLORS = { percent: "text-blue-400", fixed: "text-green-400", bogo: "text-pink-400", category_percent: "text-amber-400" };
const EMPTY = { code: "", type: "percent", value: "", category: "", min_purchase: "", max_uses: "", expires: "", description: "", active: true };

export default function CouponPanel() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.Coupon.list("-created_date", 200).then(c => { setCoupons(c); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    await base44.entities.Coupon.create({
      ...form,
      code: form.code.toUpperCase(),
      value: parseFloat(form.value) || 0,
      min_purchase: parseFloat(form.min_purchase) || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      uses: 0
    });
    setSaving(false);
    setModal(false);
    setForm(EMPTY);
    load();
  };

  const toggle = async (coupon) => {
    await base44.entities.Coupon.update(coupon.id, { active: !coupon.active });
    load();
  };

  const deleteCoupon = async (id) => {
    await base44.entities.Coupon.delete(id);
    load();
  };

  if (loading) return <div className="text-green-400 font-mono animate-pulse p-6">Loading coupons...</div>;

  const activeCoupons = coupons.filter(c => c.active).length;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="text-xs font-mono text-gray-500">
          {activeCoupons} active of {coupons.length} coupons
        </div>
        <button onClick={() => { setForm(EMPTY); setModal(true); }}
          className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white text-xs font-mono px-3 py-2 rounded-lg transition">
          <Plus className="w-3.5 h-3.5" /> Create Coupon
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs font-mono">
          <thead className="sticky top-0 bg-gray-900 border-b border-gray-800">
            <tr>{["Code", "Type", "Discount", "Min Purchase", "Uses", "Expires", "Status", "Actions"].map(h => (
              <th key={h} className="text-left text-gray-500 px-4 py-2">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c.id} className={`border-b border-gray-800/60 hover:bg-gray-800/30 ${!c.active ? "opacity-50" : ""}`}>
                <td className="px-4 py-2.5 text-white font-bold tracking-widest">{c.code}</td>
                <td className={`px-4 py-2.5 ${TYPE_COLORS[c.type] || "text-gray-400"}`}>{TYPE_LABELS[c.type] || c.type}</td>
                <td className="px-4 py-2.5 text-white">
                  {c.type === "percent" ? `${c.value}% off`
                    : c.type === "fixed" ? `$${c.value} off`
                    : c.type === "bogo" ? "Cheapest item free"
                    : `${c.value}% off ${c.category}`}
                </td>
                <td className="px-4 py-2.5 text-gray-400">{c.min_purchase ? `$${c.min_purchase}` : "—"}</td>
                <td className="px-4 py-2.5 text-gray-400">{c.uses || 0}{c.max_uses ? `/${c.max_uses}` : ""}</td>
                <td className="px-4 py-2.5 text-gray-500">{c.expires || "Never"}</td>
                <td className="px-4 py-2.5">{c.active ? <span className="text-green-400">Active</span> : <span className="text-gray-500">Inactive</span>}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-2">
                    <button onClick={() => toggle(c)} className="text-gray-500 hover:text-blue-400 transition">
                      {c.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteCoupon(c.id)} className="text-gray-500 hover:text-red-400 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={8} className="text-gray-600 text-center py-12 font-mono">No coupons created yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-bold flex items-center gap-2"><Tag className="w-4 h-4 text-blue-400" /> Create Coupon</div>
              <button onClick={() => setModal(false)} className="text-gray-500 hover:text-gray-300"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-gray-500 text-xs font-mono block mb-1">Coupon Code *</label>
                <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="SAVE20"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-gray-500 text-xs font-mono block mb-1">Discount Type *</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500">
                  <option value="percent">Percentage Off (e.g. 20% off everything)</option>
                  <option value="fixed">Fixed Amount Off (e.g. $5 off total)</option>
                  <option value="bogo">Buy One Get One Free (cheapest item free)</option>
                  <option value="category_percent">Category Discount (% off specific category)</option>
                </select>
              </div>
              {form.type !== "bogo" && (
                <div>
                  <label className="text-gray-500 text-xs font-mono block mb-1">
                    {form.type === "fixed" ? "Discount Amount ($) *" : "Discount Percentage (%) *"}
                  </label>
                  <input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                    placeholder={form.type === "fixed" ? "5.00" : "20"}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500" />
                </div>
              )}
              {form.type === "category_percent" && (
                <div>
                  <label className="text-gray-500 text-xs font-mono block mb-1">Apply to Category *</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500">
                    <option value="">Select category…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-xs font-mono block mb-1">Min Purchase ($)</label>
                  <input type="number" value={form.min_purchase} onChange={e => setForm(p => ({ ...p, min_purchase: e.target.value }))} placeholder="0"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="text-gray-500 text-xs font-mono block mb-1">Max Uses (blank = ∞)</label>
                  <input type="number" value={form.max_uses} onChange={e => setForm(p => ({ ...p, max_uses: e.target.value }))} placeholder="Unlimited"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500" />
                </div>
              </div>
              <div>
                <label className="text-gray-500 text-xs font-mono block mb-1">Expiry Date (optional)</label>
                <input type="date" value={form.expires} onChange={e => setForm(p => ({ ...p, expires: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-gray-500 text-xs font-mono block mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Summer sale promo…"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2 rounded-xl text-sm transition">Cancel</button>
              <button onClick={save} disabled={saving || !form.code || (form.type !== "bogo" && !form.value)}
                className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white font-bold py-2 rounded-xl text-sm transition">
                {saving ? "Creating…" : "Create Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}