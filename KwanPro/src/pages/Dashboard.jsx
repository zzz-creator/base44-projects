import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Users, Award, TrendingUp, CreditCard, AlertTriangle, CheckCircle, ChevronRight, Calendar } from "lucide-react";
import BeltBadge from "../components/BeltBadge";
import { BELT_ORDER, BELT_COLORS, checkEligibility, DEFAULT_BELT_REQUIREMENTS } from "../utils/beltUtils";

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [requirements, setRequirements] = useState(DEFAULT_BELT_REQUIREMENTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [s, p, a, br] = await Promise.all([
        base44.entities.Student.list(),
        base44.entities.Payment.list(),
        base44.entities.Announcement.filter({ is_published: true }, "-created_date", 5),
        base44.entities.BeltRequirement.list(),
      ]);
      setStudents(s);
      setPayments(p);
      setAnnouncements(a);
      if (br.length > 0) {
        const reqMap = {};
        br.forEach(r => { reqMap[r.belt] = r; });
        setRequirements(reqMap);
      }
      setLoading(false);
    }
    load();
  }, []);

  const activeStudents = students.filter(s => s.membership_status === "active");
  const eligible = students.filter(s => {
    const { eligible } = checkEligibility(s, requirements);
    return eligible && s.current_belt !== "Black";
  });
  const overduePayments = payments.filter(p => p.status === "overdue");
  const totalRevenue = payments.filter(p => p.status === "paid").reduce((sum, p) => sum + (p.amount || 0), 0);

  const beltDistribution = BELT_ORDER.map(belt => ({
    belt,
    count: students.filter(s => s.current_belt === belt).length,
  })).filter(b => b.count > 0);

  const recentEligible = eligible.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back — here's your dojo at a glance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Active Students" value={activeStudents.length} color="blue" />
        <StatCard icon={Award} label="Eligible for Promotion" value={eligible.length} color="green" />
        <StatCard icon={CreditCard} label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} color="purple" />
        <StatCard icon={AlertTriangle} label="Overdue Payments" value={overduePayments.length} color="red" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Belt Distribution */}
        <div className="xl:col-span-2 bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-5">Belt Distribution</h2>
          <div className="space-y-3">
            {beltDistribution.map(({ belt, count }) => {
              const colors = BELT_COLORS[belt];
              const pct = students.length > 0 ? (count / students.length) * 100 : 0;
              return (
                <div key={belt} className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${colors.dot}`} />
                  <span className="text-sm w-16 font-medium">{belt}</span>
                  <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors.dot}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                </div>
              );
            })}
            {beltDistribution.length === 0 && (
              <p className="text-muted-foreground text-sm">No students yet.</p>
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-lg">Announcements</h2>
            <Link to="/announcements" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {announcements.length === 0 && <p className="text-muted-foreground text-sm">No announcements.</p>}
            {announcements.map(a => (
              <div key={a.id} className="p-3 bg-muted/50 rounded-xl">
                <p className="text-sm font-medium leading-tight">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Eligible for Promotion */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="font-semibold text-lg">Ready for Promotion</h2>
          </div>
          <Link to="/promotions" className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {recentEligible.length === 0 ? (
          <p className="text-muted-foreground text-sm">No students currently eligible for promotion.</p>
        ) : (
          <div className="divide-y divide-border">
            {recentEligible.map(s => (
              <div key={s.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center font-semibold text-sm">
                    {s.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">{s.classes_in_current_belt || 0} classes completed</p>
                  </div>
                </div>
                <BeltBadge belt={s.current_belt} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}