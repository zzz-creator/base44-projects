import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, ChevronLeft, ChevronRight, DollarSign, Trash2, RefreshCw, Lock } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
const ROLES_COLOR = {
  cashier: "bg-blue-900/40 text-blue-300 border-blue-700",
  supervisor: "bg-purple-900/40 text-purple-300 border-purple-700",
  manager: "bg-amber-900/40 text-amber-300 border-amber-700",
  administrator: "bg-red-900/40 text-red-300 border-red-700"
};
const MANAGER_ROLES = ["manager", "administrator"];

function dateStr(d) { return d.toISOString().slice(0, 10); }

function getWeekDates(offset = 0) {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay() + offset * 7);
  sunday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

// ── PIN Gate ─────────────────────────────────────────────────────────────────
function PinGate({ staffList, onAuthorized }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const verify = (p) => {
    const found = staffList.find(s => s.pin === p && MANAGER_ROLES.includes(s.role) && s.active);
    if (found) { onAuthorized(found); }
    else { setError("Invalid PIN or insufficient role"); setPin(""); }
  };

  const press = (v) => {
    if (v === "DEL") { setPin(p => p.slice(0, -1)); setError(""); return; }
    const next = pin + v;
    setPin(next);
    if (next.length >= 4) verify(next);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-xs text-center shadow-2xl">
        <Lock className="w-8 h-8 text-amber-400 mx-auto mb-3" />
        <div className="text-white font-bold font-mono mb-1">Manager PIN Required</div>
        <div className="text-gray-500 text-xs font-mono mb-5">Scheduling requires manager or admin PIN</div>
        {/* PIN dots */}
        <div className="flex justify-center gap-3 mb-4">
          {[0,1,2,3].map(i => (
            <div key={i} className={`w-3 h-3 rounded-full border-2 transition ${pin.length > i ? "bg-amber-400 border-amber-400" : "border-gray-600"}`} />
          ))}
        </div>
        {error && <div className="text-red-400 text-xs font-mono mb-3">{error}</div>}
        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2">
          {["1","2","3","4","5","6","7","8","9","DEL","0","✓"].map(k => (
            <button key={k} onClick={() => press(k === "✓" ? "verify" : k)}
              className={`py-3 rounded-xl text-sm font-mono font-bold transition
                ${k === "DEL" ? "bg-gray-800 text-gray-400 hover:bg-gray-700" :
                  k === "✓" ? "bg-amber-700 text-white hover:bg-amber-600" :
                  "bg-gray-800 text-white hover:bg-gray-700"}`}>
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Shift Form ────────────────────────────────────────────────────────────────
function ShiftForm({ initial, staffList, weekDates, onSave, onCancel }) {
  const defaultDate = dateStr(weekDates[1] || weekDates[0]);
  const [form, setForm] = useState(initial || {
    staff_id: "", date: defaultDate, start_time: "09:00", end_time: "17:00", hourly_rate: "", notes: "", status: "scheduled"
  });
  const [recurring, setRecurring] = useState(false);
  const [repeatDays, setRepeatDays] = useState([]); // 0=Sun..6=Sat
  const [repeatWeeks, setRepeatWeeks] = useState(4);
  const [startDate, setStartDate] = useState(defaultDate);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const staff = staffList.find(s => s.staff_id === form.staff_id);
  const hours = form.start_time && form.end_time
    ? Math.max(0, (new Date(`2000-01-01T${form.end_time}`) - new Date(`2000-01-01T${form.start_time}`)) / 3600000)
    : 0;

  const toggleDay = (d) => setRepeatDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const handleSave = () => {
    const base = { ...form, scheduled_hours: hours, role: staff?.role || "" };
    if (!recurring || repeatDays.length === 0) {
      onSave([base]);
      return;
    }
    // Generate shifts for each selected day over N weeks
    const shifts = [];
    const from = new Date(startDate + "T00:00:00");
    for (let w = 0; w < repeatWeeks; w++) {
      for (const day of repeatDays) {
        const d = new Date(from);
        // find the next occurrence of `day` on or after from + w weeks
        const weekStart = new Date(from);
        weekStart.setDate(from.getDate() + w * 7);
        // set to the correct day of that week
        const diff = (day - weekStart.getDay() + 7) % 7;
        const shiftDate = new Date(weekStart);
        shiftDate.setDate(weekStart.getDate() + diff);
        shifts.push({ ...base, date: dateStr(shiftDate) });
      }
    }
    onSave(shifts);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="text-white font-bold font-mono">{initial?.id ? "Edit Shift" : "Schedule Shift"}</div>
          <button onClick={onCancel}><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="space-y-3">
          {/* Staff */}
          <select value={form.staff_id} onChange={e => { set("staff_id", e.target.value); const s = staffList.find(x => x.staff_id === e.target.value); if (s) set("staff_name", s.name); }}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-600">
            <option value="">Select Staff Member *</option>
            {staffList.filter(s => s.active).map(s => <option key={s.id} value={s.staff_id}>{s.name} ({s.role})</option>)}
          </select>

          {/* Recurring toggle */}
          {!initial?.id && (
            <button onClick={() => setRecurring(r => !r)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono transition
                ${recurring ? "bg-green-900/30 border-green-700 text-green-400" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"}`}>
              <RefreshCw className="w-3.5 h-3.5" />
              {recurring ? "Recurring shift — ON" : "Make this a recurring shift"}
            </button>
          )}

          {recurring && !initial?.id ? (
            <>
              {/* Start date */}
              <div>
                <label className="text-gray-500 text-xs font-mono mb-1 block">Starting from week of</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-600" />
              </div>
              {/* Day selector */}
              <div>
                <label className="text-gray-500 text-xs font-mono mb-2 block">Repeat on days</label>
                <div className="flex gap-1.5">
                  {DAYS.map((day, i) => (
                    <button key={i} onClick={() => toggleDay(i)}
                      className={`flex-1 py-2 rounded-lg text-xs font-mono font-bold transition border
                        ${repeatDays.includes(i) ? "bg-green-700 border-green-600 text-white" : "bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-500"}`}>
                      {DAYS_SHORT[i]}
                    </button>
                  ))}
                </div>
              </div>
              {/* Repeat weeks */}
              <div className="flex items-center gap-3">
                <label className="text-gray-500 text-xs font-mono whitespace-nowrap">Repeat for</label>
                <input type="number" min={1} max={52} value={repeatWeeks} onChange={e => setRepeatWeeks(parseInt(e.target.value) || 1)}
                  className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-600" />
                <label className="text-gray-500 text-xs font-mono">weeks</label>
                {repeatDays.length > 0 && (
                  <span className="text-green-400 text-xs font-mono ml-auto">{repeatDays.length * repeatWeeks} shifts total</span>
                )}
              </div>
            </>
          ) : (
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-600" />
          )}

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-500 text-xs font-mono mb-1 block">Start Time</label>
              <input type="time" value={form.start_time} onChange={e => set("start_time", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-600" />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-mono mb-1 block">End Time</label>
              <input type="time" value={form.end_time} onChange={e => set("end_time", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-600" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="number" placeholder="Hourly rate ($)" value={form.hourly_rate} onChange={e => set("hourly_rate", e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-600" />
            {hours > 0 && <div className="text-gray-400 text-xs font-mono whitespace-nowrap">{hours}h / shift</div>}
          </div>

          {!recurring && (
            <select value={form.status} onChange={e => set("status", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-600">
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}

          <textarea placeholder="Notes" value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-600 resize-none" />
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="flex-1 bg-gray-800 border border-gray-700 text-gray-300 py-2 rounded-xl text-sm font-mono hover:bg-gray-700 transition">Cancel</button>
          <button onClick={handleSave}
            disabled={!form.staff_id || (!recurring && !form.date) || (recurring && repeatDays.length === 0)}
            className="flex-1 bg-green-700 hover:bg-green-600 text-white font-bold py-2 rounded-xl text-sm font-mono transition disabled:opacity-40">
            {recurring ? `Create ${repeatDays.length * repeatWeeks || 0} Shifts` : "Save Shift"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Labor Report ──────────────────────────────────────────────────────────────
function LaborReport({ shifts, staffList }) {
  const report = useMemo(() => {
    const map = {};
    shifts.filter(s => s.status !== "cancelled").forEach(s => {
      if (!map[s.staff_id]) {
        const staff = staffList.find(x => x.staff_id === s.staff_id);
        map[s.staff_id] = { name: s.staff_name || s.staff_id, role: staff?.role || "—", scheduled: 0, cost: 0 };
      }
      map[s.staff_id].scheduled += s.scheduled_hours || 0;
      map[s.staff_id].cost += (s.scheduled_hours || 0) * (s.hourly_rate || 0);
    });
    return Object.values(map).sort((a, b) => b.cost - a.cost);
  }, [shifts, staffList]);

  const totalHours = report.reduce((s, r) => s + r.scheduled, 0);
  const totalCost = report.reduce((s, r) => s + r.cost, 0);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="text-gray-300 font-semibold text-sm mb-3 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-green-400" /> Weekly Labor Cost Report
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-green-400 font-bold text-xl font-mono">{totalHours.toFixed(1)}h</div>
          <div className="text-gray-500 text-xs font-mono">Total Hours</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-amber-400 font-bold text-xl font-mono">${totalCost.toFixed(2)}</div>
          <div className="text-gray-500 text-xs font-mono">Estimated Cost</div>
        </div>
      </div>
      {report.length === 0 ? (
        <div className="text-gray-600 text-xs font-mono text-center py-4">No shifts this week</div>
      ) : (
        <table className="w-full text-xs font-mono">
          <thead>
            <tr>{["Staff","Role","Hours","Est. Cost"].map(h => <th key={h} className="text-left text-gray-500 py-1.5 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {report.map((r, i) => (
              <tr key={i} className="border-t border-gray-800">
                <td className="py-2 text-white font-semibold">{r.name}</td>
                <td className="py-2 text-gray-400 capitalize">{r.role}</td>
                <td className="py-2 text-blue-400">{r.scheduled.toFixed(1)}h</td>
                <td className="py-2 text-green-400 font-bold">{r.cost > 0 ? `$${r.cost.toFixed(2)}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────
export default function StaffSchedulingPanel() {
  const [shifts, setShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [view, setView] = useState("schedule");
  const [authorizedStaff, setAuthorizedStaff] = useState(null);

  const weekDates = getWeekDates(weekOffset);
  const weekStart = dateStr(weekDates[0]);
  const weekEnd = dateStr(weekDates[6]);

  useEffect(() => {
    Promise.all([
      base44.entities.ScheduledShift.list("date", 1000),
      base44.entities.Staff.list("name", 200)
    ]).then(([s, st]) => { setShifts(s); setStaff(st); setLoading(false); });
  }, []);

  const load = () => base44.entities.ScheduledShift.list("date", 1000).then(setShifts);

  const weekShifts = shifts.filter(s => s.date >= weekStart && s.date <= weekEnd);

  const handleSave = async (shiftArray) => {
    await Promise.all(
      shiftArray.map(s => editing?.id
        ? base44.entities.ScheduledShift.update(editing.id, s)
        : base44.entities.ScheduledShift.create(s)
      )
    );
    setEditing(null);
    load();
  };

  const handleDelete = async (s) => {
    await base44.entities.ScheduledShift.delete(s.id);
    setDeleteConfirm(null);
    load();
  };

  const statusBadge = (status) => {
    const m = { scheduled: "text-blue-400", completed: "text-green-400", missed: "text-red-400", cancelled: "text-gray-600" };
    return <span className={`font-mono text-xs ${m[status] || "text-gray-400"}`}>{status}</span>;
  };

  if (loading) return <div className="text-green-400 font-mono animate-pulse p-6">Loading schedule...</div>;

  // PIN gate — require manager/admin staff PIN
  if (!authorizedStaff) {
    return (
      <div className="h-full flex flex-col">
        <PinGate staffList={staff} onAuthorized={setAuthorizedStaff} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-800 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w - 1)} className="text-gray-500 hover:text-white transition p-1"><ChevronLeft className="w-4 h-4" /></button>
          <div className="text-gray-300 text-xs font-mono font-semibold">
            {weekDates[0].toLocaleDateString("en", { month: "short", day: "numeric" })} – {weekDates[6].toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
          </div>
          <button onClick={() => setWeekOffset(w => w + 1)} className="text-gray-500 hover:text-white transition p-1"><ChevronRight className="w-4 h-4" /></button>
          <button onClick={() => setWeekOffset(0)} className="text-gray-600 hover:text-gray-400 text-xs font-mono border border-gray-700 px-2 py-1 rounded-lg transition ml-1">Today</button>
        </div>
        <div className="flex gap-1 ml-auto">
          <button onClick={() => setView("schedule")} className={`px-3 py-1 rounded-lg text-xs font-mono transition ${view === "schedule" ? "bg-green-900/40 text-green-400 border border-green-800" : "text-gray-500 hover:text-gray-300"}`}>Schedule</button>
          <button onClick={() => setView("report")} className={`px-3 py-1 rounded-lg text-xs font-mono transition ${view === "report" ? "bg-green-900/40 text-green-400 border border-green-800" : "text-gray-500 hover:text-gray-300"}`}>Labor Report</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-xs font-mono">👤 {authorizedStaff.name}</span>
          <button onClick={() => setAuthorizedStaff(null)} className="text-gray-600 hover:text-gray-400 text-xs font-mono border border-gray-700 px-2 py-1 rounded-lg transition">Lock</button>
        </div>
        <button onClick={() => setEditing({})} className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white text-xs font-mono px-3 py-2 rounded-lg transition">
          <Plus className="w-3.5 h-3.5" /> Add Shift
        </button>
      </div>

      {view === "report" ? (
        <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
          <LaborReport shifts={weekShifts} staffList={staff} />
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {/* Header row */}
          <div className="grid grid-cols-7 border-b border-gray-800 bg-gray-900 sticky top-0 z-10 min-w-[700px]">
            {weekDates.map((d, i) => {
              const isToday = dateStr(d) === dateStr(new Date());
              const count = weekShifts.filter(s => s.date === dateStr(d)).length;
              return (
                <div key={i} className={`px-3 py-2 text-center border-r border-gray-800 last:border-0 ${isToday ? "bg-green-900/20" : ""}`}>
                  <div className="text-gray-500 text-xs font-mono">{DAYS[i]}</div>
                  <div className={`font-bold text-sm font-mono ${isToday ? "text-green-400" : "text-white"}`}>{d.getDate()}</div>
                  <div className="text-gray-600 text-xs font-mono">{count} shift{count !== 1 ? "s" : ""}</div>
                </div>
              );
            })}
          </div>
          {/* Day columns */}
          <div className="grid grid-cols-7 min-w-[700px]" style={{ minHeight: 300 }}>
            {weekDates.map((d, i) => {
              const dayShifts = weekShifts.filter(s => s.date === dateStr(d));
              const isToday = dateStr(d) === dateStr(new Date());
              return (
                <div key={i} className={`border-r border-gray-800 last:border-0 p-2 space-y-1.5 min-h-[300px] ${isToday ? "bg-green-900/5" : ""}`}>
                  {dayShifts.length === 0 && <div className="text-gray-800 text-xs font-mono text-center mt-6">—</div>}
                  {dayShifts.map(s => (
                    <div key={s.id}
                      className={`rounded-lg border p-2 text-xs font-mono cursor-pointer hover:opacity-90 transition ${ROLES_COLOR[s.role] || "bg-gray-800 text-gray-300 border-gray-700"}`}
                      onClick={() => setEditing(s)}>
                      <div className="font-bold truncate">{s.staff_name || s.staff_id}</div>
                      <div className="text-xs opacity-70">{s.start_time} – {s.end_time}</div>
                      <div className="flex items-center justify-between mt-1">
                        {statusBadge(s.status)}
                        <button onClick={e => { e.stopPropagation(); setDeleteConfirm(s); }} className="opacity-50 hover:opacity-100 transition">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editing !== null && (
        <ShiftForm
          initial={editing?.id ? editing : null}
          staffList={staff}
          weekDates={weekDates}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-800 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
            <div className="text-white font-bold mb-1">Delete Shift?</div>
            <div className="text-gray-400 text-sm mb-4">{deleteConfirm.staff_name} on {deleteConfirm.date}</div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-800 border border-gray-700 text-gray-300 py-2 rounded-xl text-sm transition hover:bg-gray-700">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded-xl text-sm transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}