import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, Mail, Shield, User, Search, Link2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { X } from "lucide-react";

export default function Accounts() {
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [linkModal, setLinkModal] = useState(null);
  const [resettingId, setResettingId] = useState(null);

  const load = async () => {
    const [u, s] = await Promise.all([
      base44.entities.User.list(),
      base44.entities.Student.list(),
    ]);
    setUsers(u);
    setStudents(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const adminUsers = users.filter(u => u.role === "admin");
  const filtered = adminUsers.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
    setShowInvite(false);
    setInviting(false);
    load();
  };

  const handleChangeRole = async (userId, newRole) => {
    await base44.entities.User.update(userId, { role: newRole });
    toast.success("Role updated");
    load();
  };

  const handleLinkStudent = async (userId, studentId) => {
    // Update student email to match user email so the portal can find them
    const user = users.find(u => u.id === userId);
    const student = students.find(s => s.id === studentId);
    if (!user || !student) return;
    await base44.entities.Student.update(studentId, { email: user.email });
    toast.success(`Linked ${student.full_name} to ${user.full_name}`);
    setLinkModal(null);
    load();
  };

  const getLinkedStudent = (user) => students.find(s => s.email === user.email);

  const handleSendPasswordReset = async (user) => {
    setResettingId(user.id);
    const loginUrl = window.location.origin;
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: "Password Reset Instructions",
      body: `Hi ${user.full_name || "there"},\n\nYou (or your instructor) requested a password reset for your TKD Dojo Pro account.\n\nTo reset your password, visit the login page and click "Forgot password?":\n${loginUrl}\n\nIf you did not request this, you can safely ignore this email.\n\nThanks,\nTKD Dojo Pro`,
    });
    toast.success(`Password reset email sent to ${user.email}`);
    setResettingId(null);
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground mt-1">{adminUsers.length} admin / instructor accounts</p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="gap-2">
          <UserPlus className="w-4 h-4" /> Invite User
        </Button>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Invite User</h2>
              <button onClick={() => setShowInvite(false)} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <Label>Email Address *</Label>
              <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="student@example.com" className="mt-1" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin / Instructor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">They'll receive an email invitation to create an admin / instructor account.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowInvite(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleInvite} disabled={!inviteEmail.trim() || inviting} className="flex-1">
                {inviting ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Link Student Modal */}
      {linkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Link to Student Record</h2>
              <button onClick={() => setLinkModal(null)} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground">Linking will set the student's email to match <strong>{linkModal.email}</strong> so the portal displays their data.</p>
            <div className="max-h-60 overflow-y-auto space-y-1.5">
              {students.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleLinkStudent(linkModal.id, s.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-muted text-left transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">{s.full_name?.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-medium">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">{s.current_belt} Belt · {s.email || "no email"}</p>
                  </div>
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={() => setLinkModal(null)} className="w-full">Cancel</Button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search users..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Users list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No users found.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(user => {
              const linked = getLinkedStudent(user);
              return (
                <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors flex-wrap">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                    {user.full_name?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{user.full_name || "Unknown"}</span>
                      {linked && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Link2 className="w-2.5 h-2.5" /> {linked.full_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      {user.email}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Select value={user.role || "user"} onValueChange={v => handleChangeRole(user.id, v)}>
                      <SelectTrigger className="h-8 text-xs w-36">
                        <div className="flex items-center gap-1.5">
                          {user.role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Student (User)</SelectItem>
                        <SelectItem value="admin">Admin / Instructor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLinkModal(user)}
                      className="gap-1.5 text-xs h-8"
                    >
                      <Link2 className="w-3 h-3" /> Link Student
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendPasswordReset(user)}
                      disabled={resettingId === user.id}
                      className="gap-1.5 text-xs h-8"
                    >
                      <KeyRound className="w-3 h-3" /> {resettingId === user.id ? "Sending..." : "Reset Password"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}