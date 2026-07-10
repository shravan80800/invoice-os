'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function SettingsPage() {
  const { getToken, orgId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    phone: ''
  });

  // Fetch existing settings when page loads
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = await getToken();
        const res = await fetch('${process.env.NEXT_PUBLIC_API_URL}/invoices/settings/workspace', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-workspace-id': orgId || '',
          },
        });

        if (res.ok) {
          // 1. Read as text first to prevent JSON parse errors on empty responses
          const text = await res.text();
          
          // 2. Only parse if we actually received data
          if (text) {
            const data = JSON.parse(text);
            if (data) {
              setFormData({
                companyName: data.companyName || '',
                address: data.address || '',
                phone: data.phone || ''
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to load settings', error);
      }
    };
    
    if (orgId) {
      fetchSettings();
    }
  }, [orgId, getToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const token = await getToken();
      const res = await fetch('${process.env.NEXT_PUBLIC_API_URL}/invoices/settings/workspace', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-workspace-id': orgId || '',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
        // Hide the success message after 3 seconds for a cleaner UI
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-zinc-900">
      <h1 className="text-2xl font-bold mb-8">Workspace Settings</h1>
      
      <div className="max-w-2xl bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-1">Company Details</h2>
        <p className="text-sm text-gray-500 mb-6">These details will automatically appear on all your generated PDF invoices.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input 
              type="text" 
              value={formData.companyName}
              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="e.g. Shravan Software Services" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
            <textarea 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]" 
              placeholder="Pune, Maharashtra&#10;India" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input 
              type="text" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="+91 98765 43210" 
            />
          </div>

          <div className="pt-4 flex items-center gap-4">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
            {success && <span className="text-green-600 font-medium text-sm">✓ Settings saved successfully</span>}
          </div>
        </form>
      </div>
    </div>
  );
}