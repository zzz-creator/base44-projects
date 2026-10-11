import React from 'react';
import SystemConfiguration from '../components/admin/SystemConfiguration';

export default function SystemConfig() {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">System Configuration</h1>
          <p className="text-slate-600 mt-1">Manage floors, elevators, and rooms</p>
        </div>
        <SystemConfiguration />
      </div>
    </div>
  );
}