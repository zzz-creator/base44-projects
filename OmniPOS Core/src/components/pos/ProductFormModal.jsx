import React, { useState } from "react";
import { X, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = ["Food", "Beverage", "Electronics", "Clothing", "Health", "Household", "Other"];
const EMPTY = { name: "", barcode: "", price: "", category: "Other", stock: "", age_restricted: false };

export default function ProductFormModal({ editing, onClose, onSaved }) {
  const initial = editing === "new"
    ? EMPTY
    : { ...editing, price: editing.price?.toString(), stock: editing.stock?.toString() };

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, price: parseFloat(form.price) || 0, stock: parseInt(form.stock) || 0 };
    if (editing === "new") {
      await base44.entities.Product.create(data);
    } else {
      await base44.entities.Product.update(editing.id, data);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="text-white font-bold">{editing === "new" ? "Add Product" : "Edit Product"}</div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          {[
            { label: "Product Name", key: "name", type: "text", placeholder: "e.g. Coca-Cola 330ml" },
            { label: "Barcode", key: "barcode", type: "text", placeholder: "EAN / UPC" },
            { label: "Price ($)", key: "price", type: "number", placeholder: "0.00" },
            { label: "Stock Quantity", key: "stock", type: "number", placeholder: "0" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-gray-500 text-xs font-mono block mb-1">{f.label}</label>
              <input
                type={f.type}
                value={form[f.key] || ""}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500 transition"
              />
            </div>
          ))}
          <div>
            <label className="text-gray-500 text-xs font-mono block mb-1">Category</label>
            <select value={form.category || "Other"} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500 transition">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!form.age_restricted}
              onChange={e => setForm(p => ({ ...p, age_restricted: e.target.checked }))}
              className="w-4 h-4 rounded" />
            <span className="text-gray-400 text-xs font-mono">Age Restricted (18+)</span>
          </label>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2 rounded-xl text-sm transition">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.name || !form.price}
            className="flex-1 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white font-bold py-2 rounded-xl text-sm transition">
            <Save className="w-4 h-4" />{saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}