import { useState, useRef } from "react";
import { X, Upload, Download, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const REQUIRED_FIELDS = ["full_name"];
const ALL_FIELDS = [
  "full_name", "email", "phone", "date_of_birth", "current_belt",
  "membership_status", "membership_plan", "join_date",
  "emergency_contact_name", "emergency_contact_phone", "instructor_notes"
];
const VALID_BELTS = ["White", "Yellow", "Orange", "Green", "Blue", "Red", "Black"];
const VALID_STATUSES = ["active", "inactive", "suspended"];
const VALID_PLANS = ["monthly", "quarterly", "annual"];

function parseCsv(text) {
  const lines = text.trim().split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows = lines.slice(1).map((line, i) => {
    const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] || ""; });
    row.__line = i + 2;
    return row;
  });
  return { headers, rows };
}

function validateRow(row, idx) {
  const errors = [];
  if (!row.full_name) errors.push("full_name is required");
  if (row.current_belt && !VALID_BELTS.includes(row.current_belt))
    errors.push(`current_belt must be one of: ${VALID_BELTS.join(", ")}`);
  if (row.membership_status && !VALID_STATUSES.includes(row.membership_status))
    errors.push(`membership_status must be one of: ${VALID_STATUSES.join(", ")}`);
  if (row.membership_plan && !VALID_PLANS.includes(row.membership_plan))
    errors.push(`membership_plan must be one of: ${VALID_PLANS.join(", ")}`);
  if (row.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(row.date_of_birth))
    errors.push("date_of_birth must be YYYY-MM-DD");
  if (row.join_date && !/^\d{4}-\d{2}-\d{2}$/.test(row.join_date))
    errors.push("join_date must be YYYY-MM-DD");
  return errors;
}

function downloadSample() {
  const header = ALL_FIELDS.join(",");
  const sample = [
    "John Smith,john@example.com,555-1234,1990-05-15,White,active,monthly,2024-01-15,Jane Smith,555-5678,Great student",
    "Maria Garcia,maria@example.com,555-9999,2005-08-20,Yellow,active,quarterly,2023-06-01,Carlos Garcia,555-1111,"
  ];
  const csv = [header, ...sample].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "students_import_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function CsvImportModal({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null); // { rows, errors }
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleFile = (f) => {
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers, rows } = parseCsv(e.target.result);
      const missingCols = REQUIRED_FIELDS.filter(rf => !headers.includes(rf));
      if (missingCols.length > 0) {
        setPreview({ rows: [], errors: [{ line: "Header", errors: [`Missing required columns: ${missingCols.join(", ")}`] }] });
        return;
      }
      const errorList = [];
      rows.forEach((row) => {
        const errs = validateRow(row);
        if (errs.length > 0) errorList.push({ line: `Row ${row.__line}`, errors: errs });
      });
      setPreview({ rows, errors: errorList, headers });
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!preview || preview.errors.length > 0) return;
    setImporting(true);
    const today = new Date().toISOString().split("T")[0];
    const records = preview.rows.map(row => ({
      full_name: row.full_name,
      email: row.email || undefined,
      phone: row.phone || undefined,
      date_of_birth: row.date_of_birth || undefined,
      current_belt: row.current_belt || "White",
      membership_status: row.membership_status || "active",
      membership_plan: row.membership_plan || "monthly",
      join_date: row.join_date || today,
      emergency_contact_name: row.emergency_contact_name || undefined,
      emergency_contact_phone: row.emergency_contact_phone || undefined,
      instructor_notes: row.instructor_notes || undefined,
      classes_in_current_belt: 0,
      total_classes_attended: 0,
      belt_start_date: row.join_date || today,
    }));

    let successCount = 0;
    let failCount = 0;
    for (const rec of records) {
      try {
        await base44.entities.Student.create(rec);
        successCount++;
      } catch {
        failCount++;
      }
    }
    setResult({ successCount, failCount });
    setImporting(false);
    if (successCount > 0) onImported();
  };

  const hasErrors = preview?.errors?.length > 0;
  const isReady = preview && !hasErrors && !importing && !result;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-lg">Import Students from CSV</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Download template */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
            <div>
              <p className="font-medium text-sm">Download Sample Template</p>
              <p className="text-xs text-muted-foreground">Use this CSV as a starting point for your import.</p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadSample} className="gap-2 flex-shrink-0">
              <Download className="w-3.5 h-3.5" /> Template
            </Button>
          </div>

          {/* File upload */}
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium">{file ? file.name : "Click or drag a CSV file here"}</p>
            <p className="text-xs text-muted-foreground mt-1">Only .csv files supported</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
          </div>

          {/* Validation errors */}
          {preview && hasErrors && (
            <div className="space-y-2">
              <p className="font-medium text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Validation Errors — fix these before importing</p>
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {preview.errors.map((e, i) => (
                  <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                    <span className="font-semibold text-red-700">{e.line}: </span>
                    <span className="text-red-600">{e.errors.join("; ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {preview && !hasErrors && !result && (
            <div className="space-y-2">
              <p className="font-medium text-sm text-green-700 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> {preview.rows.length} students ready to import
              </p>
              <div className="border border-border rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left font-medium">Name</th>
                      <th className="p-2 text-left font-medium">Email</th>
                      <th className="p-2 text-left font-medium">Belt</th>
                      <th className="p-2 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {preview.rows.map((r, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="p-2">{r.full_name}</td>
                        <td className="p-2 text-muted-foreground">{r.email || "-"}</td>
                        <td className="p-2">{r.current_belt || "White"}</td>
                        <td className="p-2">{r.membership_status || "active"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-green-800">{result.successCount} students imported successfully!</p>
              {result.failCount > 0 && <p className="text-sm text-red-600 mt-1">{result.failCount} failed to import.</p>}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-border">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {!result && (
            <Button onClick={handleImport} disabled={!isReady || importing} className="gap-2">
              {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</> : <><Upload className="w-4 h-4" /> Import {preview && !hasErrors ? `${preview.rows.length} Students` : ""}</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}