import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Package, Building2, CheckCircle2, X, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_COLORS = { draft: "text-gray-400", ordered: "text-blue-400", received: "text-green-400", cancelled: "text-red-400" };

export default function PurchaseOrderPanel() {
  const [subTab, setSubTab] = useState("orders");
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    const [s, o, p] = await Promise.all([
      base44.entities.Supplier.list("name", 200),
      base44.entities.PurchaseOrder.list("-created_date", 200),
      base44.entities.Product.list("name", 500)
    ]);
    setSuppliers(s); setOrders(o); setProducts(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const receiveOrder = async (order) => {
    for (const item of (order.items || [])) {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        await base44.entities.Product.update(product.id, { stock: (product.stock || 0) + (parseInt(item.qty) || 0) });
      }
    }
    await base44.entities.PurchaseOrder.update(order.id, {
      status: "received",
      received_date: new Date().toISOString().split("T")[0]
    });
    load();
  };

  if (loading) return <div className="text-green-400 font-mono animate-pulse p-6">Loading...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-3 flex items-end gap-1 border-b border-gray-800">
        {[
          { id: "orders", label: "Purchase Orders", icon: Package },
          { id: "suppliers", label: "Suppliers", icon: Building2 },
        ].map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono rounded-t-lg transition ${subTab === t.id ? "bg-gray-800 text-green-400 border border-gray-700 border-b-transparent" : "text-gray-500 hover:text-gray-300"}`}>
            <t.icon className="w-3 h-3" /> {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={() => setModal({ type: subTab === "orders" ? "new_order" : "new_supplier" })}
          className="mb-1 flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white text-xs font-mono px-3 py-1.5 rounded-lg transition">
          <Plus className="w-3.5 h-3.5" /> {subTab === "orders" ? "New Order" : "Add Supplier"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {subTab === "orders" && (
          <table className="w-full text-xs font-mono">
            <thead className="sticky top-0 bg-gray-900 border-b border-gray-800">
              <tr>{["PO #", "Supplier", "Items", "Total", "Status", "Date", "Actions"].map(h => (
                <th key={h} className="text-left text-gray-500 px-4 py-2">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <React.Fragment key={order.id}>
                  <tr className="border-b border-gray-800/60 hover:bg-gray-800/30 cursor-pointer"
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                    <td className="px-4 py-2.5 text-green-400">{order.po_number}</td>
                    <td className="px-4 py-2.5 text-white">{order.supplier_name || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-400">{(order.items || []).length}</td>
                    <td className="px-4 py-2.5 text-white font-bold">${(order.total || 0).toFixed(2)}</td>
                    <td className={`px-4 py-2.5 capitalize ${STATUS_COLORS[order.status] || "text-gray-400"}`}>{order.status}</td>
                    <td className="px-4 py-2.5 text-gray-500">{order.ordered_date || "—"}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2 items-center">
                        {order.status === "ordered" && (
                          <button onClick={e => { e.stopPropagation(); receiveOrder(order); }}
                            className="text-gray-500 hover:text-green-400 transition" title="Mark Received">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {expanded === order.id ? <ChevronUp className="w-3 h-3 text-gray-600" /> : <ChevronDown className="w-3 h-3 text-gray-600" />}
                      </div>
                    </td>
                  </tr>
                  {expanded === order.id && (
                    <tr className="bg-gray-900/60">
                      <td colSpan={7} className="px-6 py-3">
                        <div className="text-gray-500 text-xs mb-2">Items:</div>
                        {(order.items || []).map((item, i) => (
                          <div key={i} className="flex justify-between text-xs py-1 border-b border-gray-800/40">
                            <span className="text-gray-300">{item.qty}x {item.name}</span>
                            <span className="text-gray-400">${((item.cost || 0) * (item.qty || 0)).toFixed(2)}</span>
                          </div>
                        ))}
                        {order.notes && <div className="text-gray-600 text-xs mt-2">Notes: {order.notes}</div>}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={7} className="text-gray-600 text-center py-12 font-mono">No purchase orders yet</td></tr>
              )}
            </tbody>
          </table>
        )}

        {subTab === "suppliers" && (
          <table className="w-full text-xs font-mono">
            <thead className="sticky top-0 bg-gray-900 border-b border-gray-800">
              <tr>{["Name", "Contact", "Email", "Phone", "Status", "Actions"].map(h => (
                <th key={h} className="text-left text-gray-500 px-4 py-2">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id} className="border-b border-gray-800/60 hover:bg-gray-800/30">
                  <td className="px-4 py-2.5 text-white font-semibold">{s.name}</td>
                  <td className="px-4 py-2.5 text-gray-400">{s.contact_name || "—"}</td>
                  <td className="px-4 py-2.5 text-gray-400">{s.email || "—"}</td>
                  <td className="px-4 py-2.5 text-gray-400">{s.phone || "—"}</td>
                  <td className="px-4 py-2.5">{s.active !== false ? <span className="text-green-400">Active</span> : <span className="text-gray-500">Inactive</span>}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-2">
                      <button onClick={() => setModal({ type: "edit_supplier", supplier: s })} className="text-gray-500 hover:text-blue-400 transition"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => { await base44.entities.Supplier.delete(s.id); load(); }} className="text-gray-500 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr><td colSpan={6} className="text-gray-600 text-center py-12 font-mono">No suppliers added</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal?.type === "new_supplier" && <SupplierModal onClose={() => { setModal(null); load(); }} />}
      {modal?.type === "edit_supplier" && <SupplierModal supplier={modal.supplier} onClose={() => { setModal(null); load(); }} />}
      {modal?.type === "new_order" && <PurchaseOrderModal suppliers={suppliers} products={products} onClose={() => { setModal(null); load(); }} />}
    </div>
  );
}

function SupplierModal({ supplier, onClose }) {
  const [form, setForm] = useState(supplier || { name: "", contact_name: "", email: "", phone: "", address: "", notes: "", active: true });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    if (supplier) await base44.entities.Supplier.update(supplier.id, form);
    else await base44.entities.Supplier.create(form);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
        <div className="text-white font-bold mb-4">{supplier ? "Edit Supplier" : "Add Supplier"}</div>
        <div className="space-y-3">
          {[
            { label: "Company Name *", key: "name", placeholder: "ACME Corp" },
            { label: "Contact Name", key: "contact_name", placeholder: "John Smith" },
            { label: "Email", key: "email", placeholder: "orders@supplier.com" },
            { label: "Phone", key: "phone", placeholder: "+1 555 0000" },
            { label: "Address", key: "address", placeholder: "123 Supplier St" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-gray-500 text-xs font-mono block mb-1">{f.label}</label>
              <input value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500" />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2 rounded-xl text-sm transition">Cancel</button>
          <button onClick={save} disabled={saving || !form.name}
            className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white font-bold py-2 rounded-xl text-sm transition">
            {saving ? "Saving…" : "Save Supplier"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PurchaseOrderModal({ suppliers, products, onClose }) {
  const [form, setForm] = useState({ supplier_id: "", po_number: `PO-${Date.now()}`, notes: "", ordered_date: new Date().toISOString().split("T")[0] });
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const addItem = () => setItems(prev => [...prev, { product_id: "", name: "", qty: 1, cost: 0 }]);
  const updateItem = (i, field, val) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const total = items.reduce((s, i) => s + (parseFloat(i.cost) || 0) * (parseInt(i.qty) || 0), 0);

  const save = async () => {
    setSaving(true);
    const supplier = suppliers.find(s => s.id === form.supplier_id);
    await base44.entities.PurchaseOrder.create({
      ...form,
      supplier_name: supplier?.name || "",
      items: items.map(i => ({ ...i, qty: parseInt(i.qty) || 0, cost: parseFloat(i.cost) || 0 })),
      total,
      status: "ordered"
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="text-white font-bold mb-4">New Purchase Order</div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: "PO Number", key: "po_number" },
            { label: "Order Date", key: "ordered_date", type: "date" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-gray-500 text-xs font-mono block mb-1">{f.label}</label>
              <input type={f.type || "text"} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500" />
            </div>
          ))}
          <div>
            <label className="text-gray-500 text-xs font-mono block mb-1">Supplier</label>
            <select value={form.supplier_id} onChange={e => setForm(p => ({ ...p, supplier_id: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500">
              <option value="">Select supplier…</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-500 text-xs font-mono block mb-1">Notes</label>
            <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500" />
          </div>
        </div>

        <div className="border-t border-gray-800 pt-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-gray-400 text-xs font-mono font-semibold">ORDER ITEMS</div>
            <button onClick={addItem} className="flex items-center gap-1 text-green-400 hover:text-green-300 text-xs font-mono transition">
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </div>
          {items.length === 0 && <div className="text-gray-600 text-xs font-mono text-center py-4">No items added yet</div>}
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <select value={item.product_id} onChange={e => {
                    const p = products.find(x => x.id === e.target.value);
                    updateItem(i, "product_id", e.target.value);
                    if (p) updateItem(i, "name", p.name);
                  }} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-green-500">
                    <option value="">Select product…</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <input type="number" value={item.qty} onChange={e => updateItem(i, "qty", e.target.value)} placeholder="Qty"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-green-500" />
                </div>
                <div className="col-span-3">
                  <input type="number" value={item.cost} onChange={e => updateItem(i, "cost", e.target.value)} placeholder="Unit Cost" step="0.01"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-green-500" />
                </div>
                <div className="col-span-1 text-gray-500 text-xs font-mono text-right">${((parseFloat(item.cost) || 0) * (parseInt(item.qty) || 0)).toFixed(0)}</div>
                <button onClick={() => removeItem(i)} className="col-span-1 text-gray-600 hover:text-red-400 transition"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
          {items.length > 0 && <div className="text-right text-green-400 font-mono font-bold text-sm mt-3">Total: ${total.toFixed(2)}</div>}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2 rounded-xl text-sm transition">Cancel</button>
          <button onClick={save} disabled={saving || items.length === 0}
            className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white font-bold py-2 rounded-xl text-sm transition">
            {saving ? "Creating…" : "Create Order"}
          </button>
        </div>
      </div>
    </div>
  );
}