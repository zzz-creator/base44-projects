import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Megaphone, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const TYPE_STYLES = {
  announcement: "bg-blue-100 text-blue-700",
  test_date: "bg-yellow-100 text-yellow-800",
  event: "bg-purple-100 text-purple-700",
  closure: "bg-red-100 text-red-700",
};

const ALL_BELTS = ["White", "Yellow", "Orange", "Green", "Blue", "Red", "Black"];

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", content: "", target_belts: [], type: "announcement", event_date: "", is_published: true });

  const load = async () => {
    const a = await base44.entities.Announcement.list("-created_date");
    setAnnouncements(a);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleBelt = (belt) => {
    setForm(f => ({
      ...f,
      target_belts: f.target_belts.includes(belt)
        ? f.target_belts.filter(b => b !== belt)
        : [...f.target_belts, belt]
    }));
  };

  const handleCreate = async () => {
    const target_belt = form.target_belts.length === 0 ? "All" : form.target_belts.join(",");
    await base44.entities.Announcement.create({ ...form, target_belt });
    toast.success("Announcement published!");
    setShowForm(false);
    setForm({ title: "", content: "", target_belts: [], type: "announcement", event_date: "", is_published: true });
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Announcement.delete(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground mt-1">Share news and events with your students.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" /> Post Announcement</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {announcements.length === 0 && (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">No announcements yet.</div>
          )}
          {announcements.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-2xl p-5 relative group">
              <button
                onClick={() => handleDelete(a.id)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-muted-foreground transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold">{a.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLES[a.type] || "bg-muted text-muted-foreground"}`}>{a.type?.replace("_", " ")}</span>
                    {a.target_belt && a.target_belt !== "All" && a.target_belt.split(",").map(b => (
                      <span key={b} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{b} Belt</span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a.content}</p>
                  {a.event_date && (
                    <div className="flex items-center gap-1.5 text-xs text-primary font-medium mt-2">
                      <Calendar className="w-3 h-3" /> {new Date(a.event_date).toLocaleDateString()}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">{new Date(a.created_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6">
            <h3 className="font-semibold text-lg mb-4">Post Announcement</h3>
            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={e => set("title", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Content</Label>
                <textarea value={form.content} onChange={e => set("content", e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background p-3 text-sm h-28 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => set("type", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="test_date">Test Date</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="closure">Closure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Target Belts (leave empty for All)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ALL_BELTS.map(b => (
                      <button key={b} type="button" onClick={() => toggleBelt(b)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border transition-all ${form.target_belts.includes(b) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
                        {b}
                      </button>
                    ))}
                  </div>
                  {form.target_belts.length === 0 && <p className="text-xs text-muted-foreground mt-1">All belts selected</p>}
                </div>
                <div className="col-span-2">
                  <Label>Event Date (optional)</Label>
                  <Input type="date" value={form.event_date} onChange={e => set("event_date", e.target.value)} className="mt-1" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.title || !form.content}>Publish</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}