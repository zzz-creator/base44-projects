import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Printer, X, ChevronDown, ChevronUp, Ban, RotateCcw } from "lucide-react";
import ReceiptPrint from "./ReceiptPrint";
import AuthorizationModal from "./AuthorizationModal";

const METHOD_LABELS = { cash: "Cash", credit: "Credit", debit: "Debit", gift_card: "Gift Card", contactless: "Contactless" };
const STATUS_COLORS = { completed: "text-green-400", voided: "text-red-400", refunded: "text-amber-400", pending: "text-gray-400" };

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedTx, setSelectedTx] = useState(null);
  const [reprintTx, setReprintTx] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [authAction, setAuthAction] = useState(null); // { type: "void"|"refund", tx }
  const [processing, setProcessing] = useState(null);
  const [printChoice, setPrintChoice] = useState(null); // { tx, newStatus } — after void/refund completed

  useEffect(() => {
    base44.entities.Transaction.list("-timestamp", 500).then(txs => {
      setTransactions(txs);
      setLoading(false);
    });
  }, []);

  const filtered = transactions.filter(tx => {
    if (search && !tx.transaction_id?.toLowerCase().includes(search.toLowerCase()) &&
      !tx.payment_method?.toLowerCase().includes(search.toLowerCase()) &&
      !tx.staff_id?.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom && tx.timestamp && new Date(tx.timestamp) < new Date(dateFrom)) return false;
    if (dateTo && tx.timestamp && new Date(tx.timestamp) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const handleVoidRefund = async (type, tx) => {
    setProcessing(tx.id);
    const newStatus = type === "void" ? "voided" : "refunded";
    await base44.entities.Transaction.update(tx.id, { status: newStatus });

    // Restore inventory for each item
    const products = await base44.entities.Product.list();
    for (const item of (tx.items || [])) {
      const product = products.find(p => p.id === item.product_id || p.name === item.name);
      if (product) {
        await base44.entities.Product.update(product.id, { stock: (product.stock || 0) + (item.qty || 1) });
      }
    }

    // Log the event
    await base44.entities.SecurityLog.create({
      event_type: `transaction_${newStatus}`,
      description: `Transaction ${tx.transaction_id || tx.id} ${newStatus} by authorized staff`,
      terminal_id: tx.terminal_id || "DASHBOARD",
      timestamp: new Date().toISOString(),
      metadata: { transaction_id: tx.transaction_id, total: tx.total }
    });

    const updatedTx = { ...tx, status: newStatus };
    setTransactions(prev => prev.map(t => t.id === tx.id ? updatedTx : t));
    setAuthAction(null);
    setProcessing(null);
    setPrintChoice({ tx: updatedTx, newStatus });
  };

  if (loading) return <div className="text-green-400 font-mono animate-pulse p-6">Loading transactions...</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <div className="p-4 border-b border-gray-800 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search ID, staff, method…"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-green-600 transition" />
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 text-xs font-mono focus:outline-none focus:border-green-600 transition" />
          <span className="text-gray-600 text-xs">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 text-xs font-mono focus:outline-none focus:border-green-600 transition" />
        </div>
        {(search || dateFrom || dateTo) && (
          <button onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); }}
            className="text-gray-500 hover:text-gray-300 text-xs font-mono flex items-center gap-1 transition">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
        <div className="text-gray-600 text-xs font-mono ml-auto">{filtered.length} results</div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-gray-600 font-mono text-sm text-center py-16">No transactions found</div>
        ) : (
          <table className="w-full text-xs font-mono">
            <thead className="sticky top-0 bg-gray-900 border-b border-gray-800">
              <tr>
                {["Transaction ID", "Date & Time", "Staff", "Method", "Items", "Total", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left text-gray-500 px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => (
                <React.Fragment key={tx.id}>
                  <tr className="border-b border-gray-800/60 hover:bg-gray-800/40 transition cursor-pointer"
                    onClick={() => setExpanded(expanded === tx.id ? null : tx.id)}>
                    <td className="px-4 py-2.5 text-green-400">{tx.transaction_id || tx.id.slice(0, 12)}</td>
                    <td className="px-4 py-2.5 text-gray-400">
                      {tx.timestamp ? new Date(tx.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-gray-400">{tx.staff_id || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-300">{METHOD_LABELS[tx.payment_method] || tx.payment_method || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-400">{(tx.items || []).length}</td>
                    <td className="px-4 py-2.5 text-white font-bold">${(tx.total || 0).toFixed(2)}</td>
                    <td className={`px-4 py-2.5 capitalize ${STATUS_COLORS[tx.status] || "text-gray-400"}`}>{tx.status || "—"}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <button onClick={e => { e.stopPropagation(); setReprintTx(tx); }}
                          className="text-gray-500 hover:text-blue-400 transition" title="Reprint Receipt">
                          <Printer className="w-4 h-4" />
                        </button>
                        {tx.status === "completed" && (
                          <>
                            <button
                              onClick={e => { e.stopPropagation(); setAuthAction({ type: "void", tx }); }}
                              className="text-gray-500 hover:text-red-400 transition" title="Void Transaction">
                              <Ban className="w-4 h-4" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); setAuthAction({ type: "refund", tx }); }}
                              className="text-gray-500 hover:text-amber-400 transition" title="Refund Transaction">
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {expanded === tx.id ? <ChevronUp className="w-3 h-3 text-gray-600" /> : <ChevronDown className="w-3 h-3 text-gray-600" />}
                      </div>
                    </td>
                  </tr>
                  {expanded === tx.id && (
                    <tr className="bg-gray-900/60">
                      <td colSpan={8} className="px-6 py-3">
                        <div className="text-gray-400 text-xs mb-2">Items:</div>
                        <div className="space-y-1">
                          {(tx.items || []).map((item, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span className="text-gray-300">{item.qty || 1}x {item.name}</span>
                              <span className="text-gray-400">${((item.price || 0) * (item.qty || 1)).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-800 flex gap-6 text-xs">
                          <span className="text-gray-500">Subtotal: <span className="text-gray-300">${(tx.subtotal || 0).toFixed(2)}</span></span>
                          <span className="text-gray-500">Tax: <span className="text-gray-300">${(tx.tax || 0).toFixed(2)}</span></span>
                          <span className="text-gray-500">Total: <span className="text-green-400 font-bold">${(tx.total || 0).toFixed(2)}</span></span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {reprintTx && (
        <ReceiptPrint transaction={reprintTx} onClose={() => setReprintTx(null)} />
      )}

      {printChoice && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-80 text-center">
            <div className={`text-lg font-bold font-mono mb-1 ${printChoice.newStatus === "voided" ? "text-red-400" : "text-amber-400"}`}>
              Transaction {printChoice.newStatus === "voided" ? "Voided" : "Refunded"}
            </div>
            <div className="text-gray-400 text-sm mb-5">Would you like to print a receipt?</div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setReprintTx(printChoice.tx); setPrintChoice(null); }}
                className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white text-sm py-2.5 rounded-xl font-mono transition">
                🖨 Print Original Receipt
              </button>
              <button
                onClick={() => { setReprintTx({ ...printChoice.tx, _printMode: printChoice.newStatus }); setPrintChoice(null); }}
                className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white text-sm py-2.5 rounded-xl font-mono transition">
                🖨 Print {printChoice.newStatus === "voided" ? "Void" : "Refund"} Receipt
              </button>
              <button
                onClick={() => setPrintChoice(null)}
                className="text-gray-500 hover:text-gray-300 text-xs mt-1 transition">
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {authAction && (
        <AuthorizationModal
          action={authAction.type === "void" ? "void_transaction" : "refund"}
          requiredRole="manager"
          onAuthorized={() => handleVoidRefund(authAction.type, authAction.tx)}
          onCancel={() => setAuthAction(null)}
          title={authAction.type === "void" ? "Authorize Void" : "Authorize Refund"}
          description={`${authAction.type === "void" ? "Void" : "Refund"} transaction ${authAction.tx.transaction_id || authAction.tx.id.slice(0, 12)} — $${(authAction.tx.total || 0).toFixed(2)}`}
        />
      )}
    </div>
  );
}