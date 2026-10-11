import React from 'react';
import MarketingCampaigns from '../components/admin/MarketingCampaigns';

export default function MarketingAdmin() {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Marketing Campaigns</h1>
          <p className="text-slate-600 mt-1">AI-powered personalized marketing and offers</p>
        </div>
        <MarketingCampaigns />
      </div>
    </div>
  );
}