import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Plus, Pencil, Trash2, X, AlertTriangle, CheckSquare, Printer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductFormModal from "./ProductFormModal";
import ProductLabelPrint from "./ProductLabelPrint";

const CATEGORIES = ["Food", "Beverage", "Electronics", "Clothing", "Health", "Household", "Other"];

export default function InventoryPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // null | "new" | product object
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [printProducts, setPrintProducts] = useState(null); // null | product[]

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    setLoading(true);
    base44.entities.Product.list("name", 500).then(p => {
      setProducts(p);
      setLoading(false);
    });
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search);
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const openNew = () => setEditing("new");
  const openEdit = (p) => setEditing(p);
  const closeEdit = () => setEditing(null);

  const handleDelete = async (product) => {
    await base44.entities.Product.delete(product.id);
    setDeleteConfirm(null);
    load();
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    await Promise.all([...selected].map(id => base44.entities.Product.delete(id)));
    setSelected(new Set());
    setBulkDeleteConfirm(false);
    load();
  };



  const stockColor = (stock) => {
    if (stock <= 0) return "text-red-400";
    if (stock <= 5) return "text-amber-400";
    return "text-green-400";
  };

  if (loading) return <div className="text-green-400 font-mono animate-pulse p-6">Loading inventory...</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-800 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name or barcode…"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-green-600 transition" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 text-xs font-mono focus:outline-none focus:border-green-600 transition">
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={openNew}
          className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white text-xs font-mono px-3 py-2 rounded-lg transition">
          <Plus className="w-3.5 h-3.5" /> Add Product
        </button>
        <div className="text-gray-600 text-xs font-mono">{filtered.length} items</div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-gray-600 font-mono text-sm text-center py-16">No products found</div>
        ) : (
          <table className="w-full text-xs font-mono">
            <thead className="sticky top-0 bg-gray-900 border-b border-gray-800">
              <tr>
                <th className="px-4 py-2 w-8">
                  <input type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < filtered.length; }}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 cursor-pointer accent-green-500" />
                </th>
                {["Name", "Barcode", "Category", "Price", "Stock", "Age 18+", "Actions"].map(h => (
                  <th key={h} className="text-left text-gray-500 px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className={`border-b border-gray-800/60 hover:bg-gray-800/30 transition ${selected.has(p.id) ? "bg-green-900/10" : ""}`}>
                  <td className="px-4 py-2.5">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)}
                      className="w-3.5 h-3.5 cursor-pointer accent-green-500" />
                  </td>
                  <td className="px-4 py-2.5 text-white font-semibold">{p.name}</td>
                  <td className="px-4 py-2.5 text-gray-500">{p.barcode || "—"}</td>
                  <td className="px-4 py-2.5 text-gray-400">{p.category || "—"}</td>
                  <td className="px-4 py-2.5 text-green-400 font-bold">${(p.price || 0).toFixed(2)}</td>
                  <td className={`px-4 py-2.5 font-bold ${stockColor(p.stock || 0)}`}>{p.stock ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    {p.age_restricted ? <span className="text-amber-400 font-bold">YES</span> : <span className="text-gray-600">No</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-gray-500 hover:text-blue-400 transition" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setPrintProducts([p])} className="text-gray-500 hover:text-green-400 transition" title="Print Label"><Printer className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteConfirm(p)} className="text-gray-500 hover:text-red-400 transition" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing !== null && (
        <ProductFormModal editing={editing} onClose={closeEdit} onSaved={() => { closeEdit(); load(); }} />
      )}

      {printProducts && (
        <ProductLabelPrint products={printProducts} onClose={() => setPrintProducts(null)} />
      )}

      {/* Floating Bulk Toolbar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-gray-800 border border-gray-600 rounded-2xl px-5 py-3 shadow-2xl"
          >
            <CheckSquare className="w-4 h-4 text-green-400" />
            <span className="text-white text-xs font-mono font-bold">{selected.size} selected</span>
            <div className="w-px h-5 bg-gray-600" />
            <button
              onClick={() => setPrintProducts(products.filter(p => selected.has(p.id)))}
              className="flex items-center gap-1.5 bg-green-900/50 hover:bg-green-800 border border-green-700 text-green-300 text-xs font-mono px-3 py-1.5 rounded-lg transition">
              <Printer className="w-3.5 h-3.5" /> Print Labels
            </button>
            <button
              onClick={() => setBulkDeleteConfirm(true)}
              className="flex items-center gap-1.5 bg-red-900/50 hover:bg-red-800 border border-red-700 text-red-300 text-xs font-mono px-3 py-1.5 rounded-lg transition">
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected
            </button>
            <button onClick={() => setSelected(new Set())} className="text-gray-500 hover:text-gray-300 transition">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirm */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-800 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <div className="text-white font-bold mb-1">Delete {selected.size} Products?</div>
            <div className="text-gray-400 text-sm mb-4">This action cannot be undone.</div>
            <div className="flex gap-2">
              <button onClick={() => setBulkDeleteConfirm(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2 rounded-xl text-sm transition">Cancel</button>
              <button onClick={handleBulkDelete} className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded-xl text-sm transition">Delete All</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-800 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <div className="text-white font-bold mb-1">Delete Product?</div>
            <div className="text-gray-400 text-sm mb-4">"{deleteConfirm.name}" will be permanently removed.</div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2 rounded-xl text-sm transition">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded-xl text-sm transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}