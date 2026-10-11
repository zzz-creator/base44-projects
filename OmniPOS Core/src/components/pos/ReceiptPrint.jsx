import React, { useEffect, useState } from "react";
import { loadStoreSettings } from "./useStoreSettings";

function FakeBarcode({ value }) {
  const bars = value.split("").map((c, i) => {
    const w = (c.charCodeAt(0) % 3) + 1;
    const gap = (i % 4 === 0) ? 2 : 1;
    return { w, gap };
  });
  return (
    <div className="flex items-end justify-center gap-px mt-1" style={{ height: 40 }}>
      {bars.map((b, i) => (
        <React.Fragment key={i}>
          <div style={{ width: b.w, height: 30 + (i % 3) * 5, background: "#000" }} />
          <div style={{ width: b.gap, height: 1, background: "transparent" }} />
        </React.Fragment>
      ))}
    </div>
  );
}

export default function ReceiptPrint({ transaction, onClose }) {
  const [storeSettings, setStoreSettings] = useState(null);
  const handlePrint = () => window.print();

  useEffect(() => {
    loadStoreSettings().then(setStoreSettings);
  }, []);

  if (!transaction || !storeSettings) return null;
  const { items = [], subtotal, tax, total, payment_method, transaction_id, timestamp, staff_id, tip, _printMode } = transaction;
  const isVoidReceipt = _printMode === "voided";
  const isRefundReceipt = _printMode === "refunded";

  const sym = storeSettings.currency_symbol || "$";
  const activeTaxes = (storeSettings.taxes || []).filter(t => t.enabled);
  const totalTaxRate = activeTaxes.reduce((s, t) => s + (t.rate || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-xs w-full" onClick={e => e.stopPropagation()}>
        {/* Toolbar */}
        <div className="flex justify-between items-center p-3 border-b print:hidden">
          <span className="text-gray-500 text-xs font-mono">Receipt Preview</span>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-gray-700 transition">🖨 Print</button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs px-2">✕</button>
          </div>
        </div>

        {/* Receipt */}
        <div id="receipt-content" className="p-5 font-mono text-xs text-gray-900">
          {/* Header */}
          <div className="text-center mb-4">
            {(isVoidReceipt || isRefundReceipt) && (
              <div className={`font-bold text-sm tracking-widest border rounded px-2 py-0.5 inline-block mb-2 ${isVoidReceipt ? "border-red-400 text-red-500" : "border-amber-400 text-amber-500"}`}>
                *** {isVoidReceipt ? "VOID RECEIPT" : "REFUND RECEIPT"} ***
              </div>
            )}
            <div className="font-bold text-lg tracking-widest">{storeSettings.store_name?.toUpperCase() || "RETAILOS"}</div>
            <div className="text-gray-500">Store #{storeSettings.store_id} · {storeSettings.terminal_id}</div>
            {storeSettings.address && <div className="text-gray-500">{storeSettings.address}</div>}
            {storeSettings.city && <div className="text-gray-500">{storeSettings.city}</div>}
            {storeSettings.phone && <div className="text-gray-500">Tel: {storeSettings.phone}</div>}
            {storeSettings.website && <div className="text-gray-500">{storeSettings.website}</div>}
          </div>

          <div className="border-t border-dashed border-gray-300 my-2" />

          {/* Transaction info */}
          <div className="flex justify-between text-gray-500 mb-1">
            <span>Date:</span><span>{timestamp ? new Date(timestamp).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : "—"}</span>
          </div>
          <div className="flex justify-between text-gray-500 mb-1">
            <span>Time:</span><span>{timestamp ? new Date(timestamp).toLocaleTimeString() : "—"}</span>
          </div>
          <div className="flex justify-between text-gray-500 mb-1">
            <span>TX#:</span><span className="text-xs">{transaction_id}</span>
          </div>
          <div className="flex justify-between text-gray-500 mb-3">
            <span>Cashier:</span><span>{staff_id || "—"}</span>
          </div>

          <div className="border-t border-dashed border-gray-300 my-2" />

          {/* Items */}
          <div className="space-y-1.5 mb-3">
            {items.map((item, i) => {
              const unitPrice = item.price || 0;
              const qty = item.qty || 1;
              const disc = item.discount || 0;
              const lineTotal = unitPrice * qty * (1 - disc / 100);
              return (
                <div key={i}>
                  <div className="flex justify-between">
                    <span className="flex-1 truncate pr-2">{item.name}</span>
                    <span className="font-bold">{sym}{lineTotal.toFixed(2)}</span>
                  </div>
                  <div className="text-gray-400 pl-2">
                    {qty} × {sym}{unitPrice.toFixed(2)}{disc > 0 && <span className="text-gray-500"> (-{disc}%)</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-dashed border-gray-300 my-2" />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span><span>{sym}{(subtotal || 0).toFixed(2)}</span>
            </div>
            {/* Show each active tax line */}
            {activeTaxes.length > 0 ? activeTaxes.map((t, i) => {
              const taxAmt = (subtotal || 0) * (t.rate / 100);
              return (
                <div key={i} className="flex justify-between text-gray-600">
                  <span>{t.name} ({t.rate}%)</span><span>{sym}{taxAmt.toFixed(2)}</span>
                </div>
              );
            }) : (
              <div className="flex justify-between text-gray-600">
                <span>Tax ({totalTaxRate}%)</span><span>{sym}{(tax || 0).toFixed(2)}</span>
              </div>
            )}
            {tip > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tip</span><span>{sym}{(tip || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base mt-1 pt-1 border-t border-gray-300">
              <span>{isVoidReceipt ? "VOIDED TOTAL" : isRefundReceipt ? "REFUND TOTAL" : "TOTAL"}</span>
              <span>{isVoidReceipt ? "-" : isRefundReceipt ? "-" : ""}{sym}{(total || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Payment</span><span className="capitalize">{(payment_method || "").replace("_", " ")}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-300 my-3" />

          {/* Footer */}
          <div className="text-center text-gray-400 text-xs mb-2">
            {storeSettings.footer_message && <div>{storeSettings.footer_message}</div>}
            {storeSettings.return_policy && <div className="mt-1">{storeSettings.return_policy}</div>}
          </div>

          {/* Barcode */}
          <div className="text-center">
            <FakeBarcode value={transaction_id || "TX0000000"} />
            <div className="text-gray-400 text-xs mt-1 tracking-widest">{transaction_id}</div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-content, #receipt-content * { visibility: visible; }
          #receipt-content { position: fixed; top: 0; left: 0; width: 80mm; }
        }
      `}</style>
    </div>
  );
}