import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, AlertTriangle, ShoppingCart, Package, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const CATEGORIES = ["Uniform", "Sparring Gear", "Weapon", "Accessory", "Other"];
const CAT_COLORS = { Uniform: "bg-blue-100 text-blue-700", "Sparring Gear": "bg-red-100 text-red-700", Weapon: "bg-yellow-100 text-yellow-800", Accessory: "bg-green-100 text-green-700", Other: "bg-muted text-muted-foreground" };

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("stock");
  const [showItemForm, setShowItemForm] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(null); // item
  const [itemForm, setItemForm] = useState({ name: "", category: "Uniform", sku: "", price: 0, quantity: 0, low_stock_threshold: 5, description: "" });
  const [purchaseForm, setPurchaseForm] = useState({ student_id: "", quantity: 1, notes: "" });

  const load = async () => {
    const [it, s, p] = await Promise.all([
      base44.entities.InventoryItem.filter({ is_active: true }),
      base44.entities.Student.list(),
      base44.entities.InventoryPurchase.list("-created_date", 100),
    ]);
    setItems(it);
    setStudents(s);
    setPurchases(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreateItem = async () => {
    await base44.entities.InventoryItem.create({ ...itemForm, is_active: true });
    toast.success("Item added!");
    setShowItemForm(false);
    setItemForm({ name: "", category: "Uniform", sku: "", price: 0, quantity: 0, low_stock_threshold: 5, description: "" });
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.InventoryItem.update(id, { is_active: false });
    toast.success("Item removed");
    load();
  };

  const handleAdjustQty = async (item, delta) => {
    const newQty = Math.max(0, (item.quantity || 0) + delta);
    await base44.entities.InventoryItem.update(item.id, { quantity: newQty });
    load();
  };

  const handlePurchase = async () => {
    const item = showPurchaseModal;
    const student = students.find(s => s.id === purchaseForm.student_id);
    const qty = parseInt(purchaseForm.quantity) || 1;
    const total = (item.price || 0) * qty;

    await base44.entities.InventoryPurchase.create({
      item_id: item.id,
      item_name: item.name,
      student_id: purchaseForm.student_id || null,
      student_name: student?.full_name || "Walk-in",
      quantity: qty,
      unit_price: item.price || 0,
      total_price: total,
      purchase_date: new Date().toISOString().split("T")[0],
      notes: purchaseForm.notes,
    });
    await base44.entities.InventoryItem.update(item.id, { quantity: Math.max(0, (item.quantity || 0) - qty) });
    toast.success(`Sale recorded — $${total.toFixed(2)}`);
    setShowPurchaseModal(null);
    setPurchaseForm({ student_id: "", quantity: 1, notes: "" });
    load();
  };

  const lowStockItems = items.filter(i => (i.quantity || 0) <= (i.low_stock_threshold || 5));

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground mt-1">Track retail items, stock levels, and student purchases.</p>
        </div>
        <Button onClick={() => setShowItemForm(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Item</Button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Low Stock Alert</p>
            <p className="text-sm text-amber-700">{lowStockItems.map(i => `${i.name} (${i.quantity} left)`).join(", ")}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {["stock", "purchases"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
            {t === "stock" ? `Stock (${items.length})` : `Purchase History (${purchases.length})`}
          </button>
        ))}
      </div>

      {tab === "stock" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.length === 0 && <div className="col-span-3 bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">No items yet. Add your first item.</div>}
          {items.map(item => {
            const isLow = (item.quantity || 0) <= (item.low_stock_threshold || 5);
            return (
              <div key={item.id} className={`bg-card border rounded-2xl p-5 relative group ${isLow ? "border-amber-300" : "border-border"}`}>
                <button onClick={() => handleDelete(item.id)} className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 text-muted-foreground transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold leading-tight">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[item.category] || CAT_COLORS.Other}`}>{item.category}</span>
                      {item.sku && <span className="text-xs text-muted-foreground">SKU: {item.sku}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-2xl font-bold">{item.quantity ?? 0}</p>
                    <p className="text-xs text-muted-foreground">in stock</p>
                  </div>
                  {item.price > 0 && <p className="text-lg font-semibold text-primary">${item.price?.toFixed(2)}</p>}
                </div>

                {isLow && <p className="text-xs text-amber-600 font-medium mb-3 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Low stock</p>}

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
                    <button onClick={() => handleAdjustQty(item, -1)} className="px-2 py-1.5 text-sm hover:bg-muted font-bold">−</button>
                    <span className="px-2 text-sm min-w-8 text-center">{item.quantity || 0}</span>
                    <button onClick={() => handleAdjustQty(item, 1)} className="px-2 py-1.5 text-sm hover:bg-muted font-bold">+</button>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={() => setShowPurchaseModal(item)}>
                    <ShoppingCart className="w-3.5 h-3.5" /> Sell
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "purchases" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {purchases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No purchases recorded yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {purchases.map(p => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3 flex-wrap">
                  <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{p.item_name}</p>
                    <p className="text-xs text-muted-foreground">{p.student_name} · {p.purchase_date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm">${(p.total_price || 0).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">×{p.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Item Modal */}
      {showItemForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Add Inventory Item</h3>
              <button onClick={() => setShowItemForm(false)} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Item Name *</Label>
                  <Input value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} className="mt-1" placeholder="e.g. White Dobok - Size M" />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={itemForm.category} onValueChange={v => setItemForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>SKU</Label>
                  <Input value={itemForm.sku} onChange={e => setItemForm(f => ({ ...f, sku: e.target.value }))} className="mt-1" placeholder="Optional" />
                </div>
                <div>
                  <Label>Price ($)</Label>
                  <Input type="number" step="0.01" value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} className="mt-1" />
                </div>
                <div>
                  <Label>Initial Quantity</Label>
                  <Input type="number" value={itemForm.quantity} onChange={e => setItemForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))} className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>Low Stock Alert (quantity)</Label>
                  <Input type="number" value={itemForm.low_stock_threshold} onChange={e => setItemForm(f => ({ ...f, low_stock_threshold: parseInt(e.target.value) || 5 }))} className="mt-1" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <Button variant="outline" onClick={() => setShowItemForm(false)}>Cancel</Button>
              <Button onClick={handleCreateItem} disabled={!itemForm.name}>Add Item</Button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Record Sale</h3>
              <button onClick={() => setShowPurchaseModal(null)} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <p className="font-medium mb-4">{showPurchaseModal.name} — ${showPurchaseModal.price?.toFixed(2)}</p>
            <div className="space-y-3">
              <div>
                <Label>Student (optional)</Label>
                <Select value={purchaseForm.student_id} onValueChange={v => setPurchaseForm(f => ({ ...f, student_id: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Walk-in / no student" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Walk-in</SelectItem>
                    {students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" min="1" value={purchaseForm.quantity} onChange={e => setPurchaseForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} className="mt-1" />
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={purchaseForm.notes} onChange={e => setPurchaseForm(f => ({ ...f, notes: e.target.value }))} className="mt-1" placeholder="Optional" />
              </div>
              <p className="text-sm font-semibold text-primary">
                Total: ${((showPurchaseModal.price || 0) * (parseInt(purchaseForm.quantity) || 1)).toFixed(2)}
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <Button variant="outline" onClick={() => setShowPurchaseModal(null)}>Cancel</Button>
              <Button onClick={handlePurchase}>Record Sale</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}