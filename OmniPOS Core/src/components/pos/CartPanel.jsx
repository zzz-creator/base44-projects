import React, { useState } from "react";
import { Trash2, Tag, ChevronDown, Shield, AlertTriangle } from "lucide-react";
import { usePOS } from "./POSContext";
import AuthorizationModal from "./AuthorizationModal";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPanel({ onCheckout }) {
  const { cart, removeFromCart, cartTotal, canPerform, logEvent, updateCartItemDiscount, ageVerifyItem, currentStaff } = usePOS();
  const [authAction, setAuthAction] = useState(null); // { type, itemId, value }
  const [discountInput, setDiscountInput] = useState({});

  const subtotal = cart.reduce((s, i) => s + (i.override_price ?? i.price) * i.qty, 0);
  const tax = cartTotal * 0.08;

  const applyDiscount = (itemId, pct) => {
    const item = cart.find(i => i.product.id === itemId);
    if (!item) return;
    const roleHierarchy = { cashier: 0, supervisor: 1, manager: 2, administrator: 3 };
    const currentRole = roleHierarchy[currentStaff?.role] ?? 0;
    const cashierMax = 5;
    const supMax = 15;
    if (pct <= cashierMax && canPerform("discount_0_5")) {
      doApplyDiscount(itemId, pct);
    } else if (pct <= supMax) {
      if (currentRole >= roleHierarchy["supervisor"]) doApplyDiscount(itemId, pct);
      else setAuthAction({ type: "discount", itemId, value: pct, requiredRole: "supervisor" });
    } else {
      if (currentRole >= roleHierarchy["manager"]) doApplyDiscount(itemId, pct);
      else setAuthAction({ type: "discount", itemId, value: pct, requiredRole: "manager" });
    }
  };

  const doApplyDiscount = (itemId, pct) => {
    updateCartItemDiscount(itemId, pct);
    logEvent("discount_applied", `Discount ${pct}% on item`, { itemId, pct });
  };

  const handleVoidItem = (itemId) => {
    if (canPerform("void_item")) {
      removeFromCart(itemId);
      logEvent("void_item", `Item voided`, { itemId });
    } else {
      setAuthAction({ type: "void_item", itemId, requiredRole: "supervisor" });
    }
  };

  const handleAgeRestricted = (item) => {
    if (canPerform("age_verify")) {
      ageVerifyItem(item.product.id);
      logEvent("age_verified", `Age verified for ${item.product.name}`, { itemId: item.product.id });
    } else {
      setAuthAction({ type: "age_verify", itemId: item.product.id, productName: item.product.name, requiredRole: "supervisor" });
    }
  };

  const handleAuthorized = (authorizer) => {
    const a = authAction;
    setAuthAction(null);
    if (a.type === "discount") doApplyDiscount(a.itemId, a.value);
    if (a.type === "void_item") { removeFromCart(a.itemId); logEvent("void_item", `Supervisor voided item`, { itemId: a.itemId }); }
    if (a.type === "age_verify") {
      ageVerifyItem(a.itemId);
      logEvent("age_verified", `Age verified for ${a.productName} by supervisor`, { itemId: a.itemId });
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Cart items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence>
          {cart.length === 0 && (
            <div className="text-center text-gray-600 text-sm font-mono mt-8">
              <div className="text-3xl mb-2">🛒</div>
              Cart is empty
            </div>
          )}
          {cart.map(item => {
            const linePrice = (item.override_price ?? item.price) * (1 - item.discount / 100) * item.qty;
            return (
              <motion.div key={item.product.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-semibold truncate flex items-center gap-1">
                    {item.product.name}
                    {item.product.age_restricted && !item.age_verified && (
                      <button onClick={() => handleAgeRestricted(item)} title="Age verification required"
                        className="text-amber-400 hover:text-amber-300 transition flex items-center">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {item.product.age_restricted && item.age_verified && (
                      <span className="text-green-400 text-xs font-mono">✓18+</span>
                    )}
                  </div>
                    <div className="text-gray-400 text-xs font-mono mt-0.5">
                      ${(item.override_price ?? item.price).toFixed(2)} × {item.qty}
                      {item.discount > 0 && <span className="text-green-400 ml-1">(-{item.discount}%)</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-sm">${linePrice.toFixed(2)}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {/* Discount */}
                      <div className="relative">
                        <select
                          className="bg-gray-700 border border-gray-600 rounded text-xs text-gray-300 px-1 py-0.5 appearance-none pr-4"
                          value={item.discount || 0}
                          onChange={e => applyDiscount(item.product.id, Number(e.target.value))}
                        >
                          <option value={0}>%</option>
                          <option value={5}>5%</option>
                          <option value={10}>10%</option>
                          <option value={15}>15%</option>
                          <option value={20}>20%</option>
                          <option value={25}>25%</option>
                          <option value={50}>50%</option>
                        </select>
                        <Tag className="absolute right-1 top-1 w-2 h-2 text-gray-500 pointer-events-none" />
                      </div>
                      <button onClick={() => handleVoidItem(item.product.id)}
                        className="text-gray-600 hover:text-red-400 transition p-0.5">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Totals */}
      <div className="border-t border-gray-800 p-3 space-y-1">
        <div className="flex justify-between text-gray-400 text-sm">
          <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-400 text-sm">
          <span>Tax (8%)</span><span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-white font-bold text-lg border-t border-gray-700 pt-2 mt-2">
          <span>TOTAL</span><span>${(cartTotal * 1.08).toFixed(2)}</span>
        </div>
        <button
          onClick={onCheckout}
          disabled={cart.length === 0}
          className="w-full mt-3 bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition text-lg"
        >
          PAY NOW
        </button>
      </div>

      {authAction && (
        <AuthorizationModal
          title={
            authAction.type === "discount" ? `${authAction.value}% Discount Requires Approval`
            : authAction.type === "age_verify" ? "Age Verification Required"
            : "Void Item Requires Approval"
          }
          description={
            authAction.type === "discount" ? `Discount exceeds cashier limit. ${authAction.requiredRole} approval required.`
            : authAction.type === "age_verify" ? `Supervisor must verify customer is 18+ for: ${authAction.productName}`
            : "Supervisor approval required to void items."
          }
          requiredRole={authAction.requiredRole}
          onAuthorized={handleAuthorized}
          onCancel={() => setAuthAction(null)}
        />
      )}
    </div>
  );
}