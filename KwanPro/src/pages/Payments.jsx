import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, DollarSign, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const STATUS_STYLES = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  overdue: "bg-red-100 text-red-700",
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({ student_id: "", student_name: "", amount: 120, due_date: "", status: "pending", plan: "monthly", notes: "" });

  const load = async () => {
    const [p, s] = await Promise.all([
      base44.entities.Payment.list("-due_date"),
      base44.entities.Student.filter({ membership_status: "active" }, "full_name"),
    ]);
    setPayments(p);
    setStudents(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    await base44.entities.Payment.create(form);
    toast.success("Payment record created!");
    setShowForm(false);
    load();
  };

  const markPaid = async (payment) => {
    await base44.entities.Payment.update(payment.id, { status: "paid", paid_date: new Date().toISOString().split("T")[0] });
    toast.success("Marked as paid!");
    load();
  };

  const filtered = payments.filter(p => filterStatus === "all" || p.status === filterStatus);
  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status !== "paid").reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground mt-1">Track membership fees and billing.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Payment</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-muted-foreground text-sm mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-muted-foreground text-sm mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-amber-600">${totalPending.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-muted-foreground text-sm mb-1">Overdue Count</p>
          <p className="text-2xl font-bold text-red-600">{payments.filter(p => p.status === "overdue").length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "paid", "pending", "overdue"].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No payments found.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4 flex-wrap">
                <DollarSign className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{p.student_name}</p>
                  <p className="text-xs text-muted-foreground">Due: {p.due_date} • {p.plan}</p>
                </div>
                <p className="font-bold">${p.amount}</p>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[p.status] || "bg-muted text-muted-foreground"}`}>{p.status}</span>
                {p.status !== "paid" && (
                  <Button size="sm" variant="outline" onClick={() => markPaid(p)} className="gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Paid
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <h3 className="font-semibold text-lg mb-4">Add Payment Record</h3>
            <div className="space-y-3">
              <div>
                <Label>Student</Label>
                <Select value={form.student_id} onValueChange={v => {
                  const s = students.find(s => s.id === v);
                  set("student_id", v);
                  set("student_name", s?.full_name || "");
                }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select student..." /></SelectTrigger>
                  <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Amount ($)</Label>
                  <Input type="number" value={form.amount} onChange={e => set("amount", +e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Plan</Label>
                  <Select value={form.plan} onValueChange={v => set("plan", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => set("status", v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.student_id}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}