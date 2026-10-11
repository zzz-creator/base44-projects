import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, ChevronRight, Upload, Trash2, ChevronDown, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BeltBadge from "../components/BeltBadge";
import { BELT_ORDER, DEFAULT_BELT_REQUIREMENTS, checkEligibility } from "../utils/beltUtils";
import StudentFormModal from "../components/StudentFormModal";
import CsvImportModal from "../components/CsvImportModal";
import { toast } from "sonner";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [beltFilter, setBeltFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [sortField, setSortField] = useState("full_name");
  const [sortDir, setSortDir] = useState("asc");

  const load = async () => {
    setLoading(true);
    const s = await base44.entities.Student.list("-created_date");
    setStudents(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = students
    .filter(s => {
      const matchSearch = s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase());
      const matchBelt = beltFilter === "All" || s.current_belt === beltFilter;
      return matchSearch && matchBelt;
    })
    .sort((a, b) => {
      let aVal, bVal;
      if (sortField === "first_name") {
        aVal = a.full_name?.split(" ")[0] || "";
        bVal = b.full_name?.split(" ")[0] || "";
      } else if (sortField === "last_name") {
        const aParts = a.full_name?.split(" ") || [""];
        const bParts = b.full_name?.split(" ") || [""];
        aVal = aParts[aParts.length - 1];
        bVal = bParts[bParts.length - 1];
      } else if (sortField === "age") {
        aVal = a.date_of_birth || "9999";
        bVal = b.date_of_birth || "9999";
        // older DOB = older age, reverse natural sort
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        aVal = a.full_name || "";
        bVal = b.full_name || "";
      }
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

  const handleSave = async (data) => {
    if (editStudent) {
      await base44.entities.Student.update(editStudent.id, data);
      toast.success("Student updated");
    } else {
      await base44.entities.Student.create({ ...data, classes_in_current_belt: 0, total_classes_attended: 0, belt_start_date: new Date().toISOString().split("T")[0] });
      toast.success("Student added");
    }
    setShowModal(false);
    setEditStudent(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this student? This cannot be undone.")) return;
    await base44.entities.Student.delete(id);
    toast.success("Student deleted");
    load();
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(s => s.id)));
    }
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} students? This cannot be undone.`)) return;
    setBulkLoading(true);
    for (const id of selected) {
      await base44.entities.Student.delete(id);
    }
    setSelected(new Set());
    setBulkLoading(false);
    setShowBulkMenu(false);
    toast.success(`${selected.size} students deleted`);
    load();
  };

  const bulkSetStatus = async (status) => {
    setBulkLoading(true);
    for (const id of selected) {
      await base44.entities.Student.update(id, { membership_status: status });
    }
    setSelected(new Set());
    setBulkLoading(false);
    setShowBulkMenu(false);
    toast.success(`Updated ${selected.size} students to ${status}`);
    load();
  };

  const bulkSetBelt = async (belt) => {
    setBulkLoading(true);
    const today = new Date().toISOString().split("T")[0];
    for (const id of selected) {
      await base44.entities.Student.update(id, { current_belt: belt, classes_in_current_belt: 0, belt_start_date: today });
    }
    setSelected(new Set());
    setBulkLoading(false);
    setShowBulkMenu(false);
    toast.success(`Set ${selected.size} students to ${belt} belt`);
    load();
  };

  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  return (
    <div className="space-y-6" onClick={() => showBulkMenu && setShowBulkMenu(false)}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-1">{students.length} total students</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowImport(true)} className="gap-2">
            <Upload className="w-4 h-4" /> Import CSV
          </Button>
          <Button onClick={() => { setEditStudent(null); setShowModal(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Add Student
          </Button>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search students..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {["All", ...BELT_ORDER].map(belt => (
            <button
              key={belt}
              onClick={() => setBeltFilter(belt)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${beltFilter === belt ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
            >
              {belt}
            </button>
          ))}
          <div className="flex items-center gap-1 ml-2 border border-border rounded-lg bg-card overflow-hidden">
            <select
              value={sortField}
              onChange={e => setSortField(e.target.value)}
              className="text-sm px-2 py-1.5 bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="full_name">Full Name</option>
              <option value="first_name">First Name</option>
              <option value="last_name">Last Name</option>
              <option value="age">Age</option>
            </select>
            <button
              onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
              className="px-2 py-1.5 hover:bg-muted transition-colors border-l border-border"
              title={sortDir === "asc" ? "A → Z" : "Z → A"}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="sr-only">{sortDir === "asc" ? "Ascending" : "Descending"}</span>
            </button>
            <span className="text-xs text-muted-foreground px-2 select-none">{sortDir === "asc" ? "A→Z" : "Z→A"}</span>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
          <span className="font-medium text-sm text-primary">{selected.size} selected</span>
          <div className="flex gap-2 ml-auto flex-wrap">
            <div className="relative" onClick={e => e.stopPropagation()}>
              <Button variant="outline" size="sm" onClick={() => setShowBulkMenu(v => !v)} className="gap-1.5" disabled={bulkLoading}>
                Set Belt <ChevronDown className="w-3 h-3" />
              </Button>
              {showBulkMenu && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-20 py-1 min-w-[140px]">
                  {BELT_ORDER.map(b => (
                    <button key={b} onClick={() => bulkSetBelt(b)} className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: { White:"#ccc", Yellow:"#facc15", Orange:"#f97316", Green:"#22c55e", Blue:"#3b82f6", Red:"#ef4444", Black:"#111" }[b] }} />
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => bulkSetStatus("active")} disabled={bulkLoading}>Set Active</Button>
            <Button variant="outline" size="sm" onClick={() => bulkSetStatus("inactive")} disabled={bulkLoading}>Set Inactive</Button>
            <Button variant="outline" size="sm" onClick={() => bulkSetStatus("suspended")} disabled={bulkLoading}>Set Suspended</Button>
            <Button variant="destructive" size="sm" onClick={bulkDelete} disabled={bulkLoading} className="gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No students found.</div>
          ) : (
            <div className="divide-y divide-border">
              {/* Select all header */}
              <div className="flex items-center gap-4 px-4 py-2 bg-muted/30">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded cursor-pointer accent-primary"
                />
                <span className="text-xs text-muted-foreground font-medium">Select all ({filtered.length})</span>
              </div>
              {filtered.map(student => {
                const { eligible } = checkEligibility(student, DEFAULT_BELT_REQUIREMENTS);
                return (
                  <div key={student.id} className={`flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors ${selected.has(student.id) ? "bg-primary/5" : ""}`}>
                    <input
                      type="checkbox"
                      checked={selected.has(student.id)}
                      onChange={() => toggleSelect(student.id)}
                      className="w-4 h-4 rounded cursor-pointer accent-primary flex-shrink-0"
                    />
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden border border-border">
                      {student.photo_url ? (
                        <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
                      ) : (
                        student.full_name?.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{student.full_name}</span>
                        {eligible && student.current_belt !== "Black" && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Ready to test</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{student.email || "—"} • {student.classes_in_current_belt || 0} classes this belt</p>
                    </div>
                    <BeltBadge belt={student.current_belt} size="sm" />
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${student.membership_status === "active" ? "bg-green-100 text-green-700" : student.membership_status === "suspended" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {student.membership_status}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditStudent(student); setShowModal(true); }}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <StudentFormModal
          student={editStudent}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditStudent(null); }}
        />
      )}

      {showImport && (
        <CsvImportModal
          onClose={() => setShowImport(false)}
          onImported={() => { load(); }}
        />
      )}
    </div>
  );
}