import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, HelpCircle, CreditCard, CheckCircle2, Trash2 } from "lucide-react";
import { usePOS } from "./POSContext";
import { base44 } from "@/api/base44Client";
import AuthorizationModal from "./AuthorizationModal";
import PaymentModal from "./PaymentModal";

export default function SelfCheckout() {
  const { cart, addToCart, removeFromCart, cartTotal, clearCart, logEvent, CONFIG, addSystemAlert } = usePOS();
  const [scanInput, setScanInput] = useState("");
  const [lastAdded, setLastAdded] = useState(null);
  const [products, setProducts] = useState([]);
  const [assistanceModal, setAssistanceModal] = useState(false);
  const [ageItem, setAgeItem] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [completed, setCompleted] = useState(false);
  const inputRef = useRef(null);
  const resetTimer = useRef(null);

  useEffect(() => {
    base44.entities.Product.list().then(setProducts);
    inputRef.current?.focus();
  }, []);

  const handleScan = (e) => {
    if (e.key !== "Enter") return;
    const q = scanInput.trim().toLowerCase();
    setScanInput("");
    if (!q) return;
    const p = products.find(pr => (pr.barcode && pr.barcode === q) || pr.name.toLowerCase().includes(q));
    if (!p) { addSystemAlert("Product not found"); return; }
    if (p.age_restricted) { setAgeItem(p); return; }
    addToCart(p);
    setLastAdded(p);
    setTimeout(() => setLastAdded(null), 2000);
    inputRef.current?.focus();
  };

  const handleAssistance = () => {
    setAssistanceModal(true);
    logEvent("assistance_requested", "Customer requested assistance at self-checkout");
    addSystemAlert("🙋 Customer needs assistance at self-checkout");
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    setCompleted(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => { clearCart(); setCompleted(false); }, 10000);
  };

  const total = cartTotal * 1.08;

  if (completed) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-center px-6">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-sm">
        <CheckCircle2 className="w-24 h-24 text-green-400 mx-auto mb-6" />
        <div className="text-white font-bold text-3xl">Transaction Complete</div>
        <div className="text-gray-400 text-lg mt-2">Thank you for shopping!</div>
        <div className="text-green-400 font-mono font-bold text-2xl mt-4">${total.toFixed(2)}</div>
        <motion.div className="mt-8 bg-gray-800 rounded-full h-1.5 overflow-hidden" initial={{ width: "100%" }}>
          <motion.div className="h-full bg-green-500" initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 10 }} />
        </motion.div>
        <div className="text-gray-600 text-sm mt-2 font-mono">Resetting in 10 seconds...</div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="text-green-400 font-bold font-mono text-sm">RetailOS · SELF CHECKOUT · {CONFIG.terminal_id}</div>
        <button onClick={handleAssistance}
          className="flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition">
          <HelpCircle className="w-4 h-4" /> Help / Assistance
        </button>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Scan area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <AnimatePresence mode="wait">
            {lastAdded ? (
              <motion.div key="added" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="text-center">
                <div className="text-gray-400 text-lg mb-2">Item Added</div>
                <div className="text-white font-bold text-3xl">{lastAdded.name}</div>
                <div className="text-green-400 font-mono font-bold text-4xl mt-2">${lastAdded.price?.toFixed(2)}</div>
              </motion.div>
            ) : cart.length === 0 ? (
              <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <ShoppingCart className="w-20 h-20 text-gray-700 mx-auto mb-4" />
                <div className="text-white font-bold text-4xl">Welcome</div>
                <div className="text-gray-400 text-xl mt-3">Scan your item to begin</div>
              </motion.div>
            ) : (
              <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <div className="text-gray-400 text-lg">Scan next item</div>
                <div className="text-white font-mono font-bold text-5xl mt-2">${total.toFixed(2)}</div>
                <div className="text-gray-500 text-sm mt-1">{cart.length} items</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Invisible scan input */}
          <input
            ref={inputRef}
            value={scanInput}
            onChange={e => setScanInput(e.target.value)}
            onKeyDown={handleScan}
            onClick={() => inputRef.current?.focus()}
            className="mt-6 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-green-500 transition text-center w-64"
            placeholder="Scan barcode..."
          />
        </div>

        {/* Cart sidebar */}
        <div className="w-72 border-l border-gray-800 flex flex-col bg-gray-900">
          <div className="p-4 border-b border-gray-800">
            <div className="text-white font-bold">Your Items</div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.map(item => (
              <div key={item.product.id} className="bg-gray-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-white text-sm font-semibold">{item.product.name}</div>
                  <div className="text-gray-400 text-xs font-mono">${(item.override_price ?? item.price).toFixed(2)} × {item.qty}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-white text-sm font-mono">${((item.override_price ?? item.price) * item.qty).toFixed(2)}</div>
                  <button onClick={() => removeFromCart(item.product.id)} className="text-gray-600 hover:text-red-400 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-800">
            <div className="flex justify-between text-white font-bold text-lg mb-3">
              <span>Total</span><span className="font-mono">${total.toFixed(2)}</span>
            </div>
            <button onClick={() => setShowPayment(true)} disabled={cart.length === 0}
              className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" /> Pay Now
            </button>
          </div>
        </div>
      </div>

      {/* Assistance modal */}
      {assistanceModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="bg-gray-900 border border-amber-700 rounded-2xl p-8 text-center max-w-sm">
            <HelpCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <div className="text-white font-bold text-xl">Assistance Requested</div>
            <div className="text-gray-400 mt-2">Please wait for a staff member</div>
            <button onClick={() => setAssistanceModal(false)} className="mt-6 bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-xl text-sm transition">Dismiss</button>
          </motion.div>
        </div>
      )}

      {/* Age verification */}
      {ageItem && (
        <AuthorizationModal
          title="Age Verification Required"
          description={`"${ageItem.name}" requires staff age approval.`}
          requiredRole="supervisor"
          onAuthorized={() => { addToCart(ageItem); setAgeItem(null); logEvent("age_verification", `Self-checkout age verified: ${ageItem.name}`); }}
          onCancel={() => setAgeItem(null)}
        />
      )}

      {/* Payment */}
      {showPayment && (
        <PaymentModal onClose={() => setShowPayment(false)} onComplete={handlePaymentComplete} />
      )}
    </div>
  );
}