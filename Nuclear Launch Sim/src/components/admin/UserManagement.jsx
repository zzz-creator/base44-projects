// @ts-nocheck
import * as React from 'react';
const { useState, useEffect } = React;
import { dataProvider as base44 } from '../../components/data/DataProvider';
import { ShieldCheck, Unlock, Clock, Shield } from 'lucide-react';

const DURATION_PRESETS = [
  { label: '1 Hour', ms: 3600000 },
  { label: '4 Hours', ms: 14400000 },
  { label: '1 Day', ms: 86400000 },
  { label: 'Permanent', ms: 0 }
];

const OWNER_EMAIL = 'mr.keefe.au@gmail.com';

export default function UserManagement({ isSuperAdmin, currentUser, addLog }) {
  const [users, setUsers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      loadUsers();
    }
  }, [isSuperAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await base44.entities.User.list('-created_date', 100);
      setUsers(allUsers);
      
      const accessControls = await base44.entities.AdminAccessControl.list('-created_date', 100);
      setAdminUsers(accessControls);
    } catch (err) {
      addLog('error', `Failed to load users: ${err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminRole = async (user, makeAdmin) => {
    try {
      // Update user role via Base44
      await base44.auth.updateMe({ role: makeAdmin ? 'admin' : 'user' });

      // Create/update access control
      if (makeAdmin) {
        const existing = adminUsers.find(a => a.userEmail === user.email);
        if (!existing) {
          await base44.entities.AdminAccessControl.create({
            userEmail: user.email,
            adminAccessEnabled: true,
            isSuperAdmin: false
          });
        } else {
          await base44.entities.AdminAccessControl.update(existing.id, {
            adminAccessEnabled: true
          });
        }
      }

      // Audit log
      await base44.entities.AdminAuditLog.create({
        action: 'ROLE_CHANGE',
        targetUser: user.email,
        performedBy: currentUser.email,
        details: { newRole: makeAdmin ? 'admin' : 'user' }
      });

      addLog('system', `User role changed for ${user.email}`, true);
      loadUsers();
    } catch (err) {
      addLog('error', `Failed to update user role: ${err.message}`, true);
    }
  };

  const enableAdminAccess = async (user) => {
    try {
      const adminControl = adminUsers.find(a => a.userEmail === user.email);
      if (adminControl) {
        await base44.entities.AdminAccessControl.update(adminControl.id, {
          adminAccessEnabled: true,
          accessDisabledReason: null,
          accessDisabledUntil: null
        });
      }

      // Audit log
      await base44.entities.AdminAuditLog.create({
        action: 'ADMIN_ENABLED',
        targetUser: user.email,
        performedBy: currentUser.email
      });

      addLog('system', `Admin access enabled for ${user.email}`, true);
      loadUsers();
    } catch (err) {
      addLog('error', `Failed to enable access: ${err.message}`, true);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
        Super Admin privileges required to manage users.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b border-[#2a2a3e] flex-shrink-0">
        <span className="text-xs font-mono uppercase tracking-wider text-gray-400">
          User Management
        </span>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {users.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No users found</p>
          ) : (
            users.map((user) => {
              const adminControl = adminUsers.find(a => a.userEmail === user.email);
              const isAdmin = user.role === 'admin';
              const isDisabled = adminControl && !adminControl.adminAccessEnabled;
              const isSelf = user.email === currentUser.email;

              return (
                <div key={user.id} className="p-3 bg-[#1a1a2e] border border-[#2a2a3e] rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-200">{user.full_name}</p>
                      <p className="text-xs text-gray-500 font-mono">{user.email}</p>
                    </div>
                    {isSelf && (
                      <span className="px-2 py-1 bg-green-600/20 border border-green-600/50 text-green-400 text-xs rounded">
                        YOU
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-[#2a2a3e]">
                    {isAdmin ? (
                      <>
                        <span className="px-2 py-1 bg-orange-600/20 border border-orange-600/50 text-orange-400 text-xs rounded flex items-center gap-1">
                          {/* @ts-ignore */}
                          <ShieldCheck className="w-3 h-3" />
                          Admin
                        </span>
                        
                        {user.email !== OWNER_EMAIL && !isSelf && (
                          <button
                            onClick={() => toggleAdminRole(user, false)}
                            className="px-2 py-1 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/50 text-yellow-400 text-xs rounded transition-colors"
                          >
                            Revoke Admin
                          </button>
                        )}
                        {user.email === OWNER_EMAIL && (
                          <span className="px-2 py-1 bg-purple-600/20 border border-purple-600/50 text-purple-400 text-xs rounded flex items-center gap-1">
                            {/* @ts-ignore */}
                            <Shield className="w-3 h-3" />
                            System Owner
                          </span>
                        )}
                        {isDisabled && user.email !== OWNER_EMAIL && (
                          <button
                            onClick={() => enableAdminAccess(user)}
                            className="px-2 py-1 bg-green-600/20 hover:bg-green-600/30 border border-green-600/50 text-green-400 text-xs rounded transition-colors flex items-center gap-1"
                          >
                            {/* @ts-ignore */}
                            <Unlock className="w-3 h-3" />
                            Enable Access
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => toggleAdminRole(user, true)}
                        className="px-2 py-1 bg-green-600/20 hover:bg-green-600/30 border border-green-600/50 text-green-400 text-xs rounded transition-colors"
                      >
                        {/* @ts-ignore */}
                        <ShieldCheck className="w-3 h-3 inline mr-1" />
                        Grant Admin
                      </button>
                    )}
                  </div>

                  {isDisabled && adminControl?.accessDisabledReason && (
                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                      <p>Reason: {adminControl.accessDisabledReason}</p>
                      {adminControl.accessDisabledUntil && (
                        <p className="flex items-center gap-1 mt-1">
                          {/* @ts-ignore */}
                          <Clock className="w-3 h-3" />
                          Until: {new Date(adminControl.accessDisabledUntil).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
    </div>
  );
}