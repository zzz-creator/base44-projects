import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

const STATUS_CONFIG = {
  paid: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100", label: "Paid" },
  pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100", label: "Pending" },
  overdue: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-100", label: "Overdue" },
};

export default function PortalPayments() {
  const [payments, setPayments] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const me = await base44.auth.me();
      const students = await base44.entities.Student.filter({ email: me.email });
      const s = students[0] || null;
      setStudent(s);
      if (s) {
        const pays = await base44.entities.Payment.filter({ student_id: s.id }, "-due_date");
        setPayments(pays);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const outstanding = payments.filter(p => p.status !== "paid").reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Payments</h1>
        <p className="text-muted-foreground mt-1">Your membership payment history.</p>
      </div>

      {outstanding > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800">Outstanding Balance: ${outstanding.toFixed(2)}</p>
            <p className="text-sm text-red-600">Please contact the dojo to settle outstanding payments.</p>
          </div>
        </div>
      )}

      {!student ? (
        <div className="text-center py-16 text-muted-foreground">No student record linked to your account.</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No payment records found.</div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {payments.map((p, i) => {
              const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{p.plan ? p.plan.charAt(0).toUpperCase() + p.plan.slice(1) : "Membership"}</p>
                    <p className="text-xs text-muted-foreground">Due: {new Date(p.due_date).toLocaleDateString()}{p.paid_date ? ` · Paid: ${new Date(p.paid_date).toLocaleDateString()}` : ""}</p>
                    {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${p.amount?.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}