import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Banknote, Gift, Smartphone, X, CheckCircle2 } from "lucide-react";
import { usePOS } from "./POSContext";
import { base44 } from "@/api/base44Client";
import ReceiptPrint from "./ReceiptPrint";
import { loadStoreSettings } from "./useStoreSettings";

const METHODS = [
  { id: "cash", label: "Cash", icon: Banknote, color: "text-green-400 border-green-700 bg-green-900/20" },
  { id: "credit", label: "Credit Card", icon: CreditCard, color: "text-blue-400 border-blue-700 bg-blue-900/20" },
  { id: "debit", label: "Debit Card", icon: CreditCard, color: "text-purple-400 border-purple-700 bg-purple-900/20" },
  { id: "gift_card", label: "Gift Card", icon: Gift, color: "text-pink-400 border-pink-700 bg-pink-900/20" },
  { id: "contactless", label: "Contactless", icon: Smartphone, color: "text-cyan-400 border-cyan-700 bg-cyan-900/20" },
];

export default function PaymentModal({ onClose, onComplete }) {
  const { cart, cartTotal, currentStaff, CONFIG, clearCart, logEvent, currentShift } = usePOS();
  const [method, setMethod] = useState(null);
  const [cashGiven, setCashGiven] = useState("");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [receiptOpt, setReceiptOpt] = useState(null);
  const [completedTx, setCompletedTx] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [storeSettings, setStoreSettings] = useState(null);

  useEffect(() => { loadStoreSettings().then(setStoreSettings); }, []);

  const taxRate = storeSettings
    ? (storeSettings.taxes || []).filter(t => t.enabled).reduce((s, t) => s + (t.rate || 0), 0) / 100
    : 0.08;
  const sym = storeSettings?.currency_symbol || "$";

  const taxAmount = cartTotal * taxRate;
  const total = cartTotal + taxAmount;
  const change = method === "cash" ? Math.max(0, parseFloat(cashGiven || 0) - total) : 0;

  const handlePay = async () => {
    if (!method) return;
    setProcessing(true);
    const txId = `TX-${Date.now()}`;
    await base44.entities.Transaction.create({
      transaction_id: txId,
      staff_id: currentStaff?.staff_id,
      terminal_id: CONFIG.terminal_id,
      items: cart.map(i => ({ id: i.product.id, name: i.product.name, price: i.override_price ?? i.price, qty: i.qty, discount: i.discount })),
      subtotal: cartTotal,
      tax: taxAmount,
      discount: 0,
      total: parseFloat(total.toFixed(2)),
      payment_method: method,
      status: "completed",
      mode: "staff",
      timestamp: new Date().toISOString()
    });
    if (currentShift) {
      await base44.entities.ShiftSession.update(currentShift.id, {
        transactions_count: (currentShift.transactions_count || 0) + 1
      });
    }
    logEvent("transaction_complete", `Transaction ${txId} completed`, { total, method });
    setCompletedTx({
      transaction_id: txId, staff_id: currentStaff?.staff_id, terminal_id: CONFIG.terminal_id,
      items: cart.map(i => ({ name: i.product.name, price: i.override_price ?? i.price, qty: i.qty, discount: i.discount || 0 })),
      subtotal: cartTotal, tax: taxAmount, total: parseFloat(total.toFixed(2)),
      payment_method: method, timestamp: new Date().toISOString()
    });
    setProcessing(false);
    setDone(true);
  };

  if (done) return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 border border-green-700 rounded-2xl p-8 text-center w-80">
        <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <div className="text-white font-bold text-xl">Transaction Complete</div>
        <div className="text-green-400 font-mono font-bold text-2xl mt-2">{sym}{total.toFixed(2)}</div>
        {method === "cash" && <div className="text-gray-400 text-sm mt-2">Change: <span className="text-white font-mono">{sym}{change.toFixed(2)}</span></div>}
        <div className="mt-4 space-y-2">
          {!receiptOpt ? (
            <>
              <div className="text-gray-400 text-sm mb-2">Select receipt option</div>
              {["Print Receipt", "No Receipt"].map(opt => (
                <button key={opt} onClick={() => {
                  setReceiptOpt(opt);
                  if (opt === "Print Receipt") { setShowReceipt(true); }
                  else { clearCart(); onComplete(completedTx); }
                }}
                  className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-xl py-2 text-sm transition">{opt}</button>
              ))}
            </>
          ) : (
            <div className="space-y-2">
              <div className="text-gray-400 text-sm">Goodbye! Have a great day.</div>
              <button onClick={() => { clearCart(); onComplete(completedTx); }}
                className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-2 rounded-xl transition">
                Done
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="text-white font-bold text-lg">Select Payment Method</div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="text-center mb-4">
          <div className="text-gray-400 text-sm">Total Due</div>
          <div className="text-white font-bold text-3xl font-mono">{sym}{total.toFixed(2)}</div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {METHODS.map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition font-semibold text-sm ${
                method === m.id ? m.color + " border-opacity-100 scale-95" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
              }`}>
              <m.icon className="w-5 h-5" />
              {m.label}
            </button>
          ))}
        </div>

        {method === "cash" && (
          <div className="mb-4">
            <label className="text-gray-500 text-xs font-mono mb-1 block">Cash Tendered</label>
            <input type="number" value={cashGiven} onChange={e => setCashGiven(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono text-lg focus:outline-none focus:border-green-500 transition"
              placeholder="0.00" step="0.01" />
            {cashGiven && <div className="text-green-400 text-sm mt-1 font-mono">Change: {sym}{change.toFixed(2)}</div>}
          </div>
        )}

        <button onClick={handlePay} disabled={!method || processing || (method === "cash" && parseFloat(cashGiven || 0) < total)}
          className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition text-lg">
          {processing ? "Processing..." : "Confirm Payment"}
        </button>
      </motion.div>
      {showReceipt && (
        <ReceiptPrint
          transaction={completedTx}
          onClose={() => { setShowReceipt(false); clearCart(); onComplete(completedTx); }}
        />
      )}
    </div>
  );
}