import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Award, CheckCircle, Clock, AlertCircle, Star } from "lucide-react";
import { calculateMonthsInBelt } from "../utils/beltUtils";

export default function StudentPortal() {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [beltReqs, setBeltReqs] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      setUser(me);
      const [students, reqs, attendance, promos] = await Promise.all([
        base44.entities.Student.filter({ email: me.email }),
        base44.entities.BeltRequirement.list(),
        base44.entities.Attendance.filter({ student_name: me.full_name }, "-date", 10),
        base44.entities.Promotion.filter({ student_name: me.full_name }, "-promotion_date"),
      ]);
      setStudent(students[0] || null);
      setBeltReqs(reqs);
      setRecentAttendance(attendance);
      setPromotions(promos);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  if (!student) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">No Student Record Found</h2>
        <p className="text-muted-foreground">Your account isn't linked to a student record yet. Please contact your instructor.</p>
        <p className="text-xs text-muted-foreground mt-2">Logged in as: {user?.email}</p>
      </div>
    );
  }

  const req = beltReqs.find(r => r.belt === student.current_belt);
  const classesProgress = req ? Math.min((student.classes_in_current_belt || 0) / req.required_classes * 100, 100) : 0;
  const monthsInBelt = calculateMonthsInBelt(student.belt_start_date);
  const monthsProgress = req ? Math.min(monthsInBelt / req.minimum_months * 100, 100) : 0;
  const isEligible = req ? (student.classes_in_current_belt || 0) >= req.required_classes && monthsInBelt >= req.minimum_months : false;

  const BELT_COLORS_MAP = {
    White: { bg: "#f3f4f6", text: "#1f2937" },
    Yellow: { bg: "#fef08a", text: "#78350f" },
    Orange: { bg: "#fed7aa", text: "#7c2d12" },
    Green: { bg: "#bbf7d0", text: "#14532d" },
    Blue: { bg: "#bfdbfe", text: "#1e3a8a" },
    Red: { bg: "#fecaca", text: "#7f1d1d" },
    Black: { bg: "#111827", text: "#ffffff" },
  };
  const beltColor = BELT_COLORS_MAP[student.current_belt] || BELT_COLORS_MAP.White;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Welcome header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center font-bold text-2xl flex-shrink-0 overflow-hidden border-2 border-border">
          {student.photo_url ? (
            <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
          ) : (
            student.full_name?.charAt(0)
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {student.full_name?.split(" ")[0]}!</h1>
          <p className="text-muted-foreground mt-1">Here's your training progress.</p>
        </div>
      </div>

      {/* Current belt card */}
      <div className="rounded-2xl p-6 border border-border" style={{ background: `linear-gradient(135deg, ${beltColor.bg}, ${beltColor.bg}cc)` }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm font-medium opacity-70" style={{ color: beltColor.text }}>Current Rank</p>
            <h2 className="text-4xl font-black mt-1" style={{ color: beltColor.text }}>{student.current_belt} Belt</h2>
            {student.belt_start_date && (
              <p className="text-sm mt-1 opacity-60" style={{ color: beltColor.text }}>Since {new Date(student.belt_start_date).toLocaleDateString()}</p>
            )}
          </div>
          <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center" style={{ borderColor: beltColor.text + "40", background: beltColor.text + "15" }}>
            <Award className="w-10 h-10" style={{ color: beltColor.text }} />
          </div>
        </div>
        {isEligible && student.current_belt !== "Black" && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/20 border border-green-500/30">
            <Star className="w-4 h-4 text-green-700" />
            <span className="text-sm font-semibold text-green-800">You're eligible for your next belt test!</span>
          </div>
        )}
      </div>

      {/* Progress toward next belt */}
      {req && student.current_belt !== "Black" && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-lg">Progress to Next Belt</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Classes Attended</span>
                <span className="font-semibold">{student.classes_in_current_belt || 0} / {req.required_classes}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${classesProgress}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Time in Rank</span>
                <span className="font-semibold">{monthsInBelt} / {req.minimum_months} months</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${monthsProgress}%` }} />
              </div>
            </div>
          </div>
          {req.required_skills?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {req.required_skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-muted text-sm border border-border">{skill}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-primary">{student.total_classes_attended || 0}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Total Classes</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-blue-600">{promotions.length}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Belt Promotions</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-3xl font-black text-green-600">{student.stripes || 0}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Stripes</p>
        </div>
      </div>

      {/* Recent attendance */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold">Recent Classes</h3>
        </div>
        {recentAttendance.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">No classes recorded yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {recentAttendance.map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{a.class_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{a.belt_at_time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Belt history */}
      {promotions.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold">Belt History</h3>
          </div>
          <div className="divide-y divide-border">
            {promotions.map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <Award className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{p.from_belt} → {p.to_belt}</p>
                  <p className="text-xs text-muted-foreground">{new Date(p.promotion_date).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.test_result === "pass" ? "bg-green-100 text-green-700" : p.test_result === "fail" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {p.test_result || "pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}