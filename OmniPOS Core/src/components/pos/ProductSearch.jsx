import React, { useState, useEffect, useRef } from "react";
import { Search, Barcode, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { usePOS } from "./POSContext";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductSearch({ onAgeRestricted }) {
  const { addToCart } = usePOS();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    base44.entities.Product.list().then(setProducts);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();
    setResults(products.filter(p =>
      p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q))
    ).slice(0, 8));
  }, [query, products]);

  const handleSelect = (product) => {
    if (product.age_restricted) {
      onAgeRestricted(product);
    } else {
      addToCart(product);
    }
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && results.length === 1) handleSelect(results[0]);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 focus-within:border-green-500 transition">
        <Search className="w-4 h-4 text-gray-500 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scan barcode or search product..."
          className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm focus:outline-none font-mono"
          autoComplete="off"
        />
        <Barcode className="w-4 h-4 text-gray-600 shrink-0" />
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 right-0 z-30 mt-1 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl"
          >
            {results.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-800 transition text-left"
              >
                <div>
                  <div className="text-white text-sm font-semibold flex items-center gap-2">
                    {p.name}
                    {p.age_restricted && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                  </div>
                  <div className="text-gray-500 text-xs font-mono">{p.barcode || "No barcode"}</div>
                </div>
                <div className="text-green-400 font-bold font-mono">${p.price?.toFixed(2)}</div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}