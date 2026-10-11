import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Mail, Shield, Clock } from 'lucide-react';
import { format } from 'date-fns';

const roleConfig = {
  admin: { color: 'text-neon-red', bg: 'bg-neon-red/10', border: 'border-neon-red/30' },
  operator: { color: 'text-neon-amber', bg: 'bg-neon-amber/10', border: 'border-neon-amber/30' },
  viewer: { color: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/30' },
  user: { color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/30' },
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    base44.entities.User.list().then(setUsers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const invite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
    await base44.entities.Event.create({ type: 'user_action', description: `User invited: ${inviteEmail}` });
    setInviteEmail('');
    setInviting(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card/40 flex-shrink-0">
        <Users className="w-4 h-4 text-neon-blue" />
        <h1 className="text-sm font-mono font-semibold tracking-widest uppercase">User Management</h1>
      </div>

      {/* Invite */}
      <div className="px-6 py-4 border-b border-border bg-card/20 flex-shrink-0">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Invite User</div>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="user@example.com"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="flex-1 max-w-xs h-8 bg-input border border-border rounded-md px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-neon-blue"
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className="h-8 bg-input border border-border rounded-md px-2 text-sm font-mono text-foreground focus:outline-none"
          >
            <option value="user">VIEWER</option>
            <option value="admin">ADMIN</option>
          </select>
          <button
            onClick={invite}
            disabled={inviting || !inviteEmail}
            className="h-8 px-4 rounded-md border border-neon-blue/30 bg-neon-blue/10 text-neon-blue text-xs font-mono hover:bg-neon-blue/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {inviting ? 'SENDING...' : 'INVITE'}
          </button>
        </div>
      </div>

      {/* Users table */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <table className="w-full text-xs font-mono">
          <thead className="sticky top-0 bg-card border-b border-border z-10">
            <tr>
              {['User', 'Email', 'Role', 'Joined'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">LOADING...</td></tr>
            ) : users.map(user => {
              const roleCfg = roleConfig[user.role] || roleConfig.user;
              return (
                <tr key={user.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="text-foreground">{user.full_name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded border text-xs font-mono ${roleCfg.bg} ${roleCfg.border} ${roleCfg.color}`}>
                      {(user.role || 'user').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(user.created_date), 'MMM dd, yyyy')}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && users.length === 0 && (
          <div className="text-center py-16 text-muted-foreground font-mono text-xs">NO USERS FOUND</div>
        )}
      </div>
    </div>
  );
}