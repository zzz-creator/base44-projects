import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Swords, Plus, Trophy, Minus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BeltBadge from "../components/BeltBadge";
import { toast } from "sonner";

export default function SparringMatches() {
  const [matches, setMatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    student1_id: "", student2_id: "",
    result: "draw",
    instructor_feedback: "", student1_feedback: "", student2_feedback: "",
  });

  const load = async () => {
    const [m, s] = await Promise.all([
      base44.entities.SparringMatch.list("-date", 200),
      base44.entities.Student.list(),
    ]);
    setMatches(m);
    setStudents(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    const s1 = students.find(s => s.id === form.student1_id);
    const s2 = students.find(s => s.id === form.student2_id);
    if (!s1 || !s2) return toast.error("Select both students");
    if (s1.id === s2.id) return toast.error("Students must be different");

    let winner_id = null, winner_name = null;
    if (form.result === "student1_wins") { winner_id = s1.id; winner_name = s1.full_name; }
    if (form.result === "student2_wins") { winner_id = s2.id; winner_name = s2.full_name; }

    await base44.entities.SparringMatch.create({
      ...form,
      student1_name: s1.full_name, student1_belt: s1.current_belt,
      student2_name: s2.full_name, student2_belt: s2.current_belt,
      winner_id, winner_name,
    });
    toast.success("Match logged!");
    setShowForm(false);
    setForm({ date: new Date().toISOString().split("T")[0], student1_id: "", student2_id: "", result: "draw", instructor_feedback: "", student1_feedback: "", student2_feedback: "" });
    load();
  };

  // Stats per student
  const getStats = (studentId) => {
    const relevant = matches.filter(m => m.student1_id === studentId || m.student2_id === studentId);
    const wins = relevant.filter(m => m.winner_id === studentId).length;
    const draws = relevant.filter(m => m.result === "draw").length;
    const losses = relevant.length - wins - draws;
    return { wins, losses, draws, total: relevant.length };
  };

  const filtered = matches.filter(m =>
    m.student1_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.student2_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  // Leaderboard: students with matches
  const studentIds = [...new Set(matches.flatMap(m => [m.student1_id, m.student2_id]).filter(Boolean))];
  const leaderboard = studentIds
    .map(id => ({ student: students.find(s => s.id === id), ...getStats(id) }))
    .filter(x => x.student)
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sparring Matches</h1>
          <p className="text-muted-foreground mt-1">Log practice matches and track student win/loss records.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" /> Log Match</Button>
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <p className="font-semibold text-sm">Leaderboard</p>
          </div>
          <div className="divide-y divide-border">
            {leaderboard.slice(0, 10).map(({ student, wins, losses, draws, total }, idx) => (
              <div key={student.id} className="flex items-center gap-4 px-5 py-3 flex-wrap">
                <span className="text-lg font-bold text-muted-foreground w-6 flex-shrink-0">#{idx + 1}</span>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                  {student.full_name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{student.full_name}</p>
                  <BeltBadge belt={student.current_belt} size="sm" />
                </div>
                <div className="flex gap-4 text-sm flex-shrink-0">
                  <span className="text-green-600 font-semibold">{wins}W</span>
                  <span className="text-red-500 font-semibold">{losses}L</span>
                  <span className="text-muted-foreground">{draws}D</span>
                  <span className="text-muted-foreground text-xs">{total} matches</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match History */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-semibold">Match History</h2>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by student..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No matches recorded yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(match => (
                <div key={match.id} className="px-5 py-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{match.date}</span>
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                      <span className={`font-medium text-sm ${match.result === "student1_wins" ? "text-green-600" : match.result === "student2_wins" ? "text-red-500" : ""}`}>
                        {match.student1_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {match.result === "draw" ? "drew with" : match.result === "student1_wins" ? "beat" : "lost to"}
                      </span>
                      <span className={`font-medium text-sm ${match.result === "student2_wins" ? "text-green-600" : match.result === "student1_wins" ? "text-red-500" : ""}`}>
                        {match.student2_name}
                      </span>
                    </div>
                    {match.result === "draw" ? (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">Draw</span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> {match.winner_name}
                      </span>
                    )}
                  </div>
                  {match.instructor_feedback && (
                    <p className="text-xs text-muted-foreground mt-1.5 ml-24 italic">"{match.instructor_feedback}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Log Match Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
              <h3 className="font-semibold text-lg">Log Sparring Match</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Student 1</Label>
                  <Select value={form.student1_id} onValueChange={v => set("student1_id", v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Student 2</Label>
                  <Select value={form.student2_id} onValueChange={v => set("student2_id", v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Result</Label>
                <Select value={form.result} onValueChange={v => set("result", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draw">Draw</SelectItem>
                    <SelectItem value="student1_wins">{form.student1_id ? students.find(s => s.id === form.student1_id)?.full_name || "Student 1" : "Student 1"} wins</SelectItem>
                    <SelectItem value="student2_wins">{form.student2_id ? students.find(s => s.id === form.student2_id)?.full_name || "Student 2" : "Student 2"} wins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>General Instructor Feedback</Label>
                <textarea value={form.instructor_feedback} onChange={e => set("instructor_feedback", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background p-3 text-sm h-20 resize-none" placeholder="Overall notes about the match..." />
              </div>
              <div>
                <Label>Feedback for {form.student1_id ? students.find(s => s.id === form.student1_id)?.full_name || "Student 1" : "Student 1"}</Label>
                <textarea value={form.student1_feedback} onChange={e => set("student1_feedback", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background p-3 text-sm h-16 resize-none" placeholder="Private feedback visible to this student..." />
              </div>
              <div>
                <Label>Feedback for {form.student2_id ? students.find(s => s.id === form.student2_id)?.full_name || "Student 2" : "Student 2"}</Label>
                <textarea value={form.student2_feedback} onChange={e => set("student2_feedback", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background p-3 text-sm h-16 resize-none" placeholder="Private feedback visible to this student..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.student1_id || !form.student2_id}>
                <Swords className="w-4 h-4 mr-1.5" /> Log Match
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}