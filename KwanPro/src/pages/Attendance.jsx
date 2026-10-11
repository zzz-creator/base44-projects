import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Users } from "lucide-react";
import { BELT_ORDER } from "../utils/beltUtils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BeltBadge from "../components/BeltBadge";
import { toast } from "sonner";

export default function Attendance() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [existingAttendance, setExistingAttendance] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const [c, s] = await Promise.all([
        base44.entities.Class.filter({ is_active: true }),
        base44.entities.Student.filter({ membership_status: "active" }, "full_name"),
      ]);
      setClasses(c);
      setStudents(s);
      if (c.length > 0) setSelectedClass(c[0].id);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedClass || !date) return;
    async function loadAttendance() {
      const existing = await base44.entities.Attendance.filter({ class_id: selectedClass, date });
      setExistingAttendance(existing);
      const map = {};
      existing.forEach(a => { map[a.student_id] = true; });
      setAttendanceMap(map);
    }
    loadAttendance();
  }, [selectedClass, date]);

  const toggle = (studentId) => {
    setAttendanceMap(m => ({ ...m, [studentId]: !m[studentId] }));
  };

  const selectedClassObj = classes.find(c => c.id === selectedClass);

  const eligibleStudents = selectedClassObj
    ? students.filter(s => {
        const beltIdx = BELT_ORDER.indexOf(s.current_belt);
        const minIdx = selectedClassObj.belt_min ? BELT_ORDER.indexOf(selectedClassObj.belt_min) : 0;
        const maxIdx = selectedClassObj.belt_max ? BELT_ORDER.indexOf(selectedClassObj.belt_max) : BELT_ORDER.length - 1;
        return beltIdx >= minIdx && beltIdx <= maxIdx;
      })
    : students;

  const markedCount = eligibleStudents.filter(s => attendanceMap[s.id]).length;

  const selectAll = () => {
    const map = { ...attendanceMap };
    eligibleStudents.forEach(s => { map[s.id] = true; });
    setAttendanceMap(map);
  };

  const handleSave = async () => {
    setSaving(true);
    const classObj = selectedClassObj;
    const presentStudents = eligibleStudents.filter(s => attendanceMap[s.id]);
    const absentStudents = eligibleStudents.filter(s => !attendanceMap[s.id]);

    // Delete attendance for absent students (if they were previously marked)
    for (const s of absentStudents) {
      const existing = existingAttendance.find(a => a.student_id === s.id);
      if (existing) await base44.entities.Attendance.delete(existing.id);
    }

    // Create or skip for present students
    for (const s of presentStudents) {
      const alreadyMarked = existingAttendance.find(a => a.student_id === s.id);
      if (!alreadyMarked) {
        await base44.entities.Attendance.create({
          student_id: s.id,
          student_name: s.full_name,
          class_id: selectedClass,
          class_name: classObj?.name || "",
          date,
          belt_at_time: s.current_belt,
        });
        // Update student class counts
        await base44.entities.Student.update(s.id, {
          classes_in_current_belt: (s.classes_in_current_belt || 0) + 1,
          total_classes_attended: (s.total_classes_attended || 0) + 1,
        });
      }
    }

    toast.success("Attendance saved!");
    setSaving(false);
  };



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground mt-1">Mark attendance for a class session.</p>
      </div>

      {/* Controls */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Class</label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Select class..." />
            </SelectTrigger>
            <SelectContent>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name} — {c.day_of_week} {c.start_time}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Stats bar */}
      {selectedClassObj && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{markedCount} present / {eligibleStudents.length} students</span>
          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{selectedClassObj.name} — {selectedClassObj.level}</span>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <span className="font-medium text-sm">{eligibleStudents.length} Eligible Students</span>
          <button onClick={selectAll} className="text-xs text-primary hover:underline">Select All</button>
        </div>
        {eligibleStudents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No eligible students for this class.</div>
        ) : (
          <div className="divide-y divide-border">
            {eligibleStudents.map(student => {
              const present = !!attendanceMap[student.id];
              return (
                <button
                  key={student.id}
                  onClick={() => toggle(student.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 transition-colors text-left ${present ? "bg-green-50" : "hover:bg-muted/30"}`}
                >
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${present ? "bg-green-500 border-green-500" : "border-muted-foreground/40"}`}>
                    {present && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {student.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{student.full_name}</p>
                    <p className="text-xs text-muted-foreground">{student.classes_in_current_belt || 0} classes this belt</p>
                  </div>
                  <BeltBadge belt={student.current_belt} size="sm" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="px-8">
          {saving ? "Saving..." : "Save Attendance"}
        </Button>
      </div>
    </div>
  );
}