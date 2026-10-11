import React from 'react';
import LoyaltyManagement from '../components/admin/LoyaltyManagement';

export default function LoyaltyAdmin() {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Loyalty Program</h1>
          <p className="text-slate-600 mt-1">Manage rewards and member tiers</p>
        </div>
        <LoyaltyManagement />
      </div>
    </div>
  );
}