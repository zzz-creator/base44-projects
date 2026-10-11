import React, { useRef, useState } from "react";
import { X, Printer, ChevronDown } from "lucide-react";

// Renders a simple visual barcode from a string using alternating bars
function Barcode({ value, width = 180, height = 40 }) {
  if (!value) return <div style={{ width, height }} className="flex items-center justify-center text-gray-400 text-xs">NO BARCODE</div>;

  // Generate bar widths deterministically from the string
  const bars = [];
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    bars.push({ wide: code % 3 === 0, dark: i % 2 === 0 });
    bars.push({ wide: false, dark: i % 2 !== 0 });
  }
  // Pad to at least 30 bars
  while (bars.length < 30) bars.push({ wide: false, dark: bars.length % 2 === 0 });

  const totalUnits = bars.reduce((s, b) => s + (b.wide ? 3 : 1), 0);
  const unitPx = width / totalUnits;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {bars.reduce((acc, bar) => {
        const barW = (bar.wide ? 3 : 1) * unitPx;
        const x = acc.x;
        if (bar.dark) {
          acc.els.push(<rect key={acc.els.length} x={x} y={0} width={barW} height={height} fill="black" />);
        }
        acc.x += barW;
        return acc;
      }, { x: 0, els: [] }).els}
    </svg>
  );
}

const LABEL_SIZES = [
  { id: "small", label: "Small (2×1 in)", w: 144, h: 72 },
  { id: "medium", label: "Medium (3×2 in)", w: 216, h: 144 },
  { id: "large", label: "Large (4×3 in)", w: 288, h: 216 },
];

export default function ProductLabelPrint({ products, onClose }) {
  const [size, setSize] = useState("medium");
  const [copies, setCopies] = useState(1);
  const [showPrice, setShowPrice] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showCategory, setShowCategory] = useState(false);
  const printRef = useRef();

  const labelSize = LABEL_SIZES.find(s => s.id === size);

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Product Labels</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: white; font-family: monospace; }
            .label-page { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px; }
            .label {
              border: 1px solid #ccc;
              display: inline-flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 6px;
              page-break-inside: avoid;
              text-align: center;
            }
            .label-name { font-weight: bold; font-size: 11px; word-break: break-word; max-width: 100%; }
            .label-price { font-size: 16px; font-weight: bold; margin: 3px 0; }
            .label-cat { font-size: 9px; color: #666; }
            .label-code { font-size: 8px; color: #666; margin-top: 2px; letter-spacing: 1px; }
            @media print {
              body { margin: 0; }
              .label-page { gap: 4px; padding: 8px; }
            }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const allLabels = [];
  for (let c = 0; c < copies; c++) {
    products.forEach(p => allLabels.push(p));
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="text-white font-bold flex items-center gap-2">
            <Printer className="w-4 h-4 text-green-400" />
            Print Product Labels
            <span className="text-gray-500 font-normal text-xs font-mono">({products.length} product{products.length !== 1 ? "s" : ""})</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-5 h-5" /></button>
        </div>

        {/* Options */}
        <div className="px-6 py-4 border-b border-gray-800 flex flex-wrap gap-4 items-center">
          <div className="flex flex-col gap-1">
            <label className="text-gray-500 text-xs font-mono">Label Size</label>
            <select value={size} onChange={e => setSize(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-green-600">
              {LABEL_SIZES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-gray-500 text-xs font-mono">Copies per product</label>
            <input type="number" min="1" max="20" value={copies} onChange={e => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-green-600" />
          </div>
          <div className="flex gap-4 items-center">
            {[
              { label: "Price", state: showPrice, set: setShowPrice },
              { label: "Barcode", state: showBarcode, set: setShowBarcode },
              { label: "Category", state: showCategory, set: setShowCategory },
            ].map(opt => (
              <label key={opt.label} className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={opt.state} onChange={e => opt.set(e.target.checked)}
                  className="w-3.5 h-3.5 accent-green-500" />
                <span className="text-gray-400 text-xs font-mono">{opt.label}</span>
              </label>
            ))}
          </div>
          <button onClick={handlePrint}
            className="ml-auto flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white font-bold text-sm px-5 py-2 rounded-xl transition">
            <Printer className="w-4 h-4" /> Print Labels
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
          <div className="text-gray-600 text-xs font-mono mb-3">Preview ({allLabels.length} label{allLabels.length !== 1 ? "s" : ""})</div>
          <div ref={printRef}>
            <div className="label-page" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {allLabels.map((p, i) => (
                <div key={i} className="label bg-white text-black rounded border border-gray-300"
                  style={{
                    width: labelSize.w,
                    height: labelSize.h,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "6px",
                    textAlign: "center",
                    pageBreakInside: "avoid",
                  }}>
                  <div className="label-name" style={{ fontWeight: "bold", fontSize: size === "small" ? 9 : size === "medium" ? 11 : 13, wordBreak: "break-word", maxWidth: "100%", lineHeight: 1.2, marginBottom: 2 }}>
                    {p.name}
                  </div>
                  {showCategory && p.category && (
                    <div className="label-cat" style={{ fontSize: 8, color: "#666", marginBottom: 2 }}>{p.category}</div>
                  )}
                  {showPrice && (
                    <div className="label-price" style={{ fontSize: size === "small" ? 13 : size === "medium" ? 17 : 22, fontWeight: "bold", margin: "3px 0" }}>
                      ${(p.price || 0).toFixed(2)}
                    </div>
                  )}
                  {showBarcode && (
                    <div style={{ marginTop: 3 }}>
                      <Barcode value={p.barcode || p.id} width={labelSize.w - 20} height={size === "small" ? 18 : size === "medium" ? 28 : 38} />
                      <div className="label-code" style={{ fontSize: 7, color: "#555", letterSpacing: "1px", marginTop: 1 }}>
                        {p.barcode || p.id?.slice(0, 12)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}