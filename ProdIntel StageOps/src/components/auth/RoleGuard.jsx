import React, { useState, useEffect } from 'react';
import { base44 } from '../../api/base44Client';
import { Shield, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function RoleGuard({ children, allowedRoles = ['admin', 'user'], requiredRole = null }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setLoading(false);
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const userRole = user?.role || 'user';
  const hasAccess = requiredRole 
    ? userRole === requiredRole 
    : allowedRoles.includes(userRole);

  if (!hasAccess) {
    return (
      <div className="flex justify-center py-12">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12">
            <Shield className="w-16 h-16 text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Restricted</h2>
            <p className="text-slate-500 text-center mb-4">
              You don't have permission to view this page. 
              {requiredRole === 'admin' && ' Administrator access required.'}
            </p>
            <Link to={createPageUrl('Dashboard')}>
              <Button>Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setLoading(false);
    };
    fetchUser();
  }, []);

  return { user, loading, isAdmin: user?.role === 'admin' };
}