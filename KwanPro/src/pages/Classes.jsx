import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Clock, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BELT_ORDER } from "../utils/beltUtils";
import { toast } from "sonner";

const LEVELS = ["Beginner", "Intermediate", "Advanced", "All Levels"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const LEVEL_COLORS = { Beginner: "bg-green-100 text-green-700", Intermediate: "bg-blue-100 text-blue-700", Advanced: "bg-red-100 text-red-700", "All Levels": "bg-purple-100 text-purple-700" };

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", level: "Beginner", instructor_name: "", day_of_week: "Monday", start_time: "09:00", end_time: "10:00", capacity: 20, is_active: true });

  const load = async () => {
    const c = await base44.entities.Class.list();
    setClasses(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    await base44.entities.Class.create(form);
    toast.success("Class created!");
    setShowForm(false);
    setForm({ name: "", level: "Beginner", instructor_name: "", day_of_week: "Monday", start_time: "09:00", end_time: "10:00", capacity: 20, is_active: true });
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Class.delete(id);
    load();
  };

  const grouped = DAYS.reduce((acc, day) => {
    acc[day] = classes.filter(c => c.day_of_week === day);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
          <p className="text-muted-foreground mt-1">Manage recurring class schedule.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Class</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          {DAYS.map(day => {
            const dayClasses = grouped[day];
            if (dayClasses.length === 0) return null;
            return (
              <div key={day}>
                <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider mb-3">{day}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {dayClasses.map(cls => (
                    <div key={cls.id} className="bg-card border border-border rounded-2xl p-5 relative group">
                      <button
                        onClick={() => handleDelete(cls.id)}
                        className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 text-muted-foreground transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold">{cls.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${LEVEL_COLORS[cls.level] || "bg-muted text-muted-foreground"}`}>{cls.level}</span>
                      </div>
                      <div className="space-y-1.5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" />{cls.start_time} – {cls.end_time}</div>
                        {cls.instructor_name && <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5" />{cls.instructor_name}</div>}
                        {cls.capacity && <div>Capacity: {cls.capacity}</div>}
                        {cls.belt_min && <div>Belts: {cls.belt_min} – {cls.belt_max || "Black"}</div>}
                      </div>
                      <div className={`mt-3 w-2 h-2 rounded-full ${cls.is_active ? "bg-green-500" : "bg-gray-300"}`} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {classes.length === 0 && (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">No classes scheduled yet.</div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6">
            <h3 className="font-semibold text-lg mb-4">Add Class</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Class Name</Label>
                  <Input value={form.name} onChange={e => set("name", e.target.value)} className="mt-1" placeholder="e.g. Beginner Taekwondo" />
                </div>
                <div>
                  <Label>Level</Label>
                  <Select value={form.level} onValueChange={v => set("level", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Day</Label>
                  <Select value={form.day_of_week} onValueChange={v => set("day_of_week", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Start Time</Label>
                  <Input type="time" value={form.start_time} onChange={e => set("start_time", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input type="time" value={form.end_time} onChange={e => set("end_time", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Instructor</Label>
                  <Input value={form.instructor_name} onChange={e => set("instructor_name", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input type="number" value={form.capacity} onChange={e => set("capacity", +e.target.value)} className="mt-1" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.name}>Create Class</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}