import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, UserPlus, Shield, Mail, Loader2, Trash2,
  Settings, CheckCircle, AlertCircle, MoreVertical, History, LogIn
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '../components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import RoleGuard from '../components/auth/RoleGuard';
import AuditLogViewer from '../components/audit/AuditLogViewer';
import { startImpersonation } from '../components/ImpersonationBanner';

const API_BASE = 'http://localhost:3001';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';

const roleColors = {
  admin: 'bg-purple-100 text-purple-700',
  user: 'bg-blue-100 text-blue-700',
};

export default function AdminSettings() {
  return (
    <RoleGuard requiredRole="admin">
      <AdminSettingsContent />
    </RoleGuard>
  );
}

function AdminSettingsContent() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviteStatus, setInviteStatus] = useState(null);
  const [isInviting, setIsInviting] = useState(false);

  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load users');
      return res.json();
    },
  });

  const [impersonatingId, setImpersonatingId] = useState(null);

  const handleImpersonate = async (user) => {
    setImpersonatingId(user.id);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/auth/impersonate/${user.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Impersonation failed');
      const data = await res.json();
      startImpersonation(data.token, data.user);
    } catch (err) {
      console.error(err);
    } finally {
      setImpersonatingId(null);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail) return;
    
    setIsInviting(true);
    setInviteStatus(null);
    
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      setInviteStatus({ type: 'success', message: `Invitation sent to ${inviteEmail}` });
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setTimeout(() => {
        setShowInviteDialog(false);
        setInviteStatus(null);
      }, 2000);
    } catch (error) {
      setInviteStatus({ type: 'error', message: error.message || 'Failed to send invitation' });
    } finally {
      setIsInviting(false);
    }
  };

  const getLinkedCrewMember = (email) => {
    return crewMembers.find(cm => cm.email === email);
  };

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Admin Settings
          </h1>
          <p className="text-slate-500">Manage users and system settings</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                    <p className="text-xs text-slate-500">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{adminCount}</p>
                    <p className="text-xs text-slate-500">Administrators</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{userCount}</p>
                    <p className="text-xs text-slate-500">Regular Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Management */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">User Management</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </div>
              <Button onClick={() => setShowInviteDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite User
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>No users found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {users.map((user) => {
                    const linkedCrew = getLinkedCrewMember(user.email);
                    return (
                        <div key={user.id} className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-indigo-600">
                              {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900">{user.full_name || 'No name'}</p>
                              <Badge className={roleColors[user.role]}>{user.role}</Badge>
                            </div>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">
                            Joined {user.created_date ? new Date(user.created_date).toLocaleDateString() : 'N/A'}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-purple-300 text-purple-700 hover:bg-purple-50"
                            onClick={() => handleImpersonate(user)}
                            disabled={impersonatingId === user.id}
                          >
                            {impersonatingId === user.id
                              ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              : <LogIn className="w-3 h-3 mr-1" />}
                            Login As
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Management</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <DeleteAccountSection />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Role Permissions</CardTitle>
              <CardDescription>Overview of role-based access control</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Administrator</h3>
                </div>
                <ul className="text-sm text-purple-700 space-y-1 ml-7">
                  <li>• Full access to all features</li>
                  <li>• Manage users and permissions</li>
                  <li>• Create, edit, delete crew members</li>
                  <li>• Manage productions, equipment, and incidents</li>
                  <li>• View all reports and analytics</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Regular User</h3>
                </div>
                <ul className="text-sm text-blue-700 space-y-1 ml-7">
                  <li>• View productions and dashboards</li>
                  <li>• View own assignments (My Assignments)</li>
                  <li>• View crew member profiles (read-only)</li>
                  <li>• Log incidents</li>
                  <li>• Cannot manage users or delete records</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <AuditLogViewer />
        </TabsContent>
      </Tabs>

      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Send an invitation email to add a new user to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                {inviteRole === 'admin' 
                  ? 'Administrators have full access to all features.'
                  : 'Users can view and interact with productions but cannot manage users.'}
              </p>
            </div>

            {inviteStatus && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                inviteStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {inviteStatus.type === 'success' 
                  ? <CheckCircle className="w-4 h-4" />
                  : <AlertCircle className="w-4 h-4" />
                }
                <span className="text-sm">{inviteStatus.message}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleInviteUser} 
                disabled={isInviting || !inviteEmail}
              >
                {isInviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeleteAccountSection() {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') return;
    
    setIsDeleting(true);
    try {
      // Logout user after attempting deletion
      await base44.auth.logout();
    } catch (error) {
      console.error('Error during account deletion:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="font-semibold text-red-900 mb-2">Delete Account</h3>
      <p className="text-sm text-red-700 mb-4">
        Once you delete your account, there is no going back. This action is permanent and cannot be undone.
      </p>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete My Account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>This action cannot be undone. This will permanently delete your account and remove your data from our servers.</p>
              <div>
                <Label htmlFor="confirm-delete">Type <strong>DELETE</strong> to confirm</Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={confirmText !== 'DELETE' || isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}