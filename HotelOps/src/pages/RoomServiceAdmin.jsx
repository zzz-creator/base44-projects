import React from 'react';
import RoomServiceManagement from '../components/admin/RoomServiceManagement';

export default function RoomServiceAdmin() {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Room Service</h1>
          <p className="text-slate-600 mt-1">Manage orders and menu items</p>
        </div>
        <RoomServiceManagement />
      </div>
    </div>
  );
}