import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function PatientWorkspace() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'notes', label: 'Clinical Notes', icon: '📝' },
    { id: 'orders', label: 'Orders', icon: '💊' },
    { id: 'results', label: 'Results', icon: '🧪' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Patient Overview</h2>
            <p className="text-slate-500">Select a tab to view patient information</p>
          </div>
        );
      case 'notes':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Clinical Notes</h2>
            <p className="text-slate-500">No clinical notes available</p>
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Orders</h2>
            <p className="text-slate-500">No orders available</p>
          </div>
        );
      case 'results':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Results</h2>
            <p className="text-slate-500">No results available</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Patient Workspace</h1>
          <p className="text-slate-600">Manage patient information, orders, and clinical data</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}