import React, { useState, useEffect } from "react";
import { usePOS } from "./POSContext";
import POSHeader from "./POSHeader";
import ProductSearch from "./ProductSearch";
import CartPanel from "./CartPanel";
import PaymentModal from "./PaymentModal";
import AuthorizationModal from "./AuthorizationModal";
import POSDashboard from "./POSDashboard";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Package, AlertTriangle, RotateCcw, BarChart2 } from "lucide-react";

export default function POSInterface() {
  const { cart, addToCart, clearCart, cartTotal, canPerform, logEvent } = usePOS();
  const [showPayment, setShowPayment] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [ageItem, setAgeItem] = useState(null);
  const [voidAuth, setVoidAuth] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [recentProducts, setRecentProducts] = useState([]);
  const [lastTransaction, setLastTransaction] = useState(null);

  useEffect(() => {
    const online = () => setIsOffline(false);
    const offline = () => setIsOffline(true);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    base44.entities.Product.list("-updated_date", 12).then(setRecentProducts);
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, []);

  const handleVoidTransaction = () => {
    if (canPerform("void_transaction")) {
      clearCart();
      logEvent("void_transaction", "Transaction voided by staff");
    } else {
      setVoidAuth(true);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
      <POSHeader isOffline={isOffline} onDashboard={() => setShowDashboard(true)} />

      {isOffline && (
        <div className="bg-yellow-900/30 border-b border-yellow-800 px-4 py-1.5 text-yellow-400 text-xs font-mono text-center">
          ⚠ OFFLINE MODE ACTIVE — Transactions will sync when connection is restored
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Product search + quick grid */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="mb-4">
            <ProductSearch onAgeRestricted={(p) => setAgeItem(p)} />
          </div>

          {/* Quick products grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="text-gray-600 text-xs font-mono mb-2 uppercase tracking-wider">Quick Add</div>
            <div className="grid grid-cols-3 gap-2">
              {recentProducts.map(p => (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => p.age_restricted ? setAgeItem(p) : addToCart(p)}
                  className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-3 text-left transition relative"
                >
                  {p.age_restricted && (
                    <AlertTriangle className="w-3 h-3 text-amber-400 absolute top-2 right-2" />
                  )}
                  <Package className="w-5 h-5 text-gray-500 mb-1" />
                  <div className="text-white text-xs font-semibold leading-tight truncate">{p.name}</div>
                  <div className="text-green-400 text-sm font-mono font-bold mt-1">${p.price?.toFixed(2)}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Void transaction button */}
          {cart.length > 0 && (
            <div className="mt-3">
              <button onClick={handleVoidTransaction}
                className="flex items-center gap-2 text-red-500 hover:text-red-400 text-xs font-mono border border-red-900 hover:border-red-700 rounded-lg px-3 py-1.5 transition">
                <RotateCcw className="w-3 h-3" /> Void Transaction
              </button>
            </div>
          )}
        </div>

        {/* Right: Cart */}
        <div className="w-80 border-l border-gray-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <div className="text-white font-bold text-sm">Current Sale</div>
            <div className="text-gray-500 text-xs font-mono">{cart.length} items</div>
          </div>
          <div className="flex-1 overflow-hidden">
            <CartPanel
              onCheckout={() => setShowPayment(true)}
            />
          </div>
        </div>
      </div>

      {/* Age verification modal */}
      {ageItem && (
        <AuthorizationModal
          title="Age Verification Required"
          description={`"${ageItem.name}" is an age-restricted item. Staff approval needed.`}
          requiredRole="supervisor"
          onAuthorized={() => { addToCart(ageItem); setAgeItem(null); logEvent("age_verification", `Age verified for ${ageItem.name}`); }}
          onCancel={() => setAgeItem(null)}
        />
      )}

      {/* Void transaction auth */}
      {voidAuth && (
        <AuthorizationModal
          title="Void Entire Transaction"
          description="Manager authorization required to void the full transaction."
          requiredRole="manager"
          onAuthorized={(auth) => {
            clearCart();
            logEvent("void_transaction", `Transaction voided by ${auth?.name || "manager"}`);
            setVoidAuth(false);
          }}
          onCancel={() => setVoidAuth(false)}
        />
      )}

      {/* Payment */}
      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onComplete={(tx) => { setLastTransaction(tx); setShowPayment(false); }}
        />
      )}

      {/* Dashboard */}
      {showDashboard && <POSDashboard onClose={() => setShowDashboard(false)} />}
    </div>
  );
}