import * as React from 'react';
const { useState, useEffect } = React;
import { dataProvider as base44 } from '../../components/data/DataProvider';
import { AlertTriangle, Lock, Mail } from 'lucide-react';
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

const OWNER_EMAIL = 'mr.keefe.au@gmail.com';

export default function AdminAuthentication({ onAuthenticationSuccess, onAuthenticationFailed }) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [adminStatus, setAdminStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      setIsLoading(true);
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Check if user has admin role
      if (user.role !== 'admin') {
        setError('Insufficient privileges. Admin access required.');
        setAdminStatus('unauthorized');
        onAuthenticationFailed('User does not have admin role');
        return;
      }

      // Check admin access control
      try {
        const accessControl = await base44.entities.AdminAccessControl.filter(
          { userEmail: user.email },
          '-created_date',
          1
        );
        
        if (accessControl && accessControl.length > 0) {
          const control = accessControl[0];
          
          // System owner access cannot be disabled
          if (!control.adminAccessEnabled && user.email !== OWNER_EMAIL) {
            setError(`Admin panel access is disabled. Reason: ${control.accessDisabledReason || 'Not specified'}`);
            setAdminStatus('disabled');
            onAuthenticationFailed('Admin access disabled by super admin');
            return;
          }

          // Check temporary access restriction
          if (control.accessDisabledUntil && new Date(control.accessDisabledUntil) > new Date()) {
            const untilTime = new Date(control.accessDisabledUntil).toLocaleString();
            setError(`Admin panel access is temporarily disabled until ${untilTime}`);
            setAdminStatus('temporary_disabled');
            onAuthenticationFailed('Temporary access restriction');
            return;
          }

          // Check session validity
          if (control.sessionExpiresAt && new Date(control.sessionExpiresAt) < new Date()) {
            setError('Your admin session has expired. Please refresh to create a new session.');
            setAdminStatus('session_expired');
            onAuthenticationFailed('Session expired');
            return;
          }

          // Access granted
          setAdminStatus('authenticated');
          
          // Ensure system owner has all privileges
          const isOwner = user.email === OWNER_EMAIL;
          if (isOwner && !control.isSuperAdmin) {
            await base44.entities.AdminAccessControl.update(control.id, {
              isSuperAdmin: true,
              adminAccessEnabled: true,
              lastLoginTime: new Date().toISOString(),
              failedLoginAttempts: 0
            });
            control.isSuperAdmin = true;
          }
          
          // Update last login time
          await base44.entities.AdminAccessControl.update(control.id, {
            lastLoginTime: new Date().toISOString(),
            failedLoginAttempts: 0
          });

          onAuthenticationSuccess(user, control);
        } else {
          // No access control record - create one
          if (user.role === 'admin') {
            const isOwner = user.email === OWNER_EMAIL;
            const newControl = await base44.entities.AdminAccessControl.create({
              userEmail: user.email,
              adminAccessEnabled: true,
              isSuperAdmin: isOwner, // System owner is automatically super admin
              lastLoginTime: new Date().toISOString()
            });
            setAdminStatus('authenticated');
            onAuthenticationSuccess(user, newControl);
          }
        }
      } catch (err) {
        // If no access control exists, allow first admin
        if (user.role === 'admin') {
          setAdminStatus('authenticated');
          onAuthenticationSuccess(user, null);
        } else {
          throw err;
        }
      }
    } catch (err) {
      setError('Authentication failed. Please ensure you are logged in.');
      setAdminStatus('error');
      onAuthenticationFailed(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-[#2a2a3e] border-t-amber-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  if (adminStatus === 'authenticated') {
    return null; // Component will unmount when auth is successful
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#12121a]">
      <div className="w-full max-w-md p-8 bg-[#0d0d14] border border-[#2a2a3e] rounded-lg shadow-2xl">
        <div className="flex items-center justify-center mb-6">
          {/* @ts-ignore */}
          <Lock className="w-8 h-8 text-orange-500 mr-3" />
          <h1 className="text-2xl font-bold text-gray-100">ADMIN ACCESS</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            {/* @ts-ignore */}
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400 font-semibold mb-1">Access Denied</p>
              <p className="text-xs text-red-300">{error}</p>
            </div>
          </div>
        )}

        {currentUser && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-400 mb-1">Logged in as:</p>
            <p className="text-sm font-mono text-blue-300">{currentUser.email}</p>
          </div>
        )}

        <div className="space-y-4 text-center">
          <p className="text-xs text-gray-500">
            {adminStatus === 'unauthorized' 
              ? 'Your account does not have admin privileges.' 
              : adminStatus === 'disabled'
              ? 'Your admin access has been disabled.'
              : 'Unable to authenticate. Please contact your administrator.'}
          </p>
          
          {/* @ts-ignore */}
          <Button
            onClick={checkAdminStatus}
            className="w-full bg-amber-600 hover:bg-amber-500"
          >
            Retry Authentication
          </Button>

          {/* @ts-ignore */}
          <Button
            onClick={() => base44.auth.logout()}
            variant="outline"
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}