'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function SettingsPage() {
  const { getToken, orgId } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    phone: '',
    gstin: '',
    state: ''
  });

  // Fetch existing workspace settings
  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const token = await getToken();
        // Assuming your backend has a route to get the current workspace
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-workspace-id': orgId || '',
          },
          cache: 'no-store'
        });

        if (res.ok) {
          const data = await res.json();
          setFormData({
            companyName: data.companyName || '',
            address: data.address || '',
            phone: data.phone || '',
            gstin: data.gstin || '',
            state: data.state || '',
          });
        }
      } catch (error) {
        console.error("Failed to fetch workspace data", error);
      } finally {
        setLoading(false);
      }
    };

    if (orgId) fetchWorkspace();
  }, [orgId, getToken]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-workspace-id': orgId || '',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccessMessage('Settings updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Failed to update settings');
      }
    } catch (error) {
      console.error("Error updating settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500">Loading settings...</div>;
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Workspace Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your business identity, address, and compliance details for your invoices.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          
          {/* General Information */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Business Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company / Business Name *</label>
                <input 
                  required
                  name="companyName" 
                  value={formData.companyName} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all bg-slate-50 focus:bg-white" 
                  placeholder="e.g. Acme Technologies" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Registered Address</label>
                <textarea 
                  name="address" 
                  value={formData.address} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all bg-slate-50 focus:bg-white" 
                  placeholder="Full billing address..." 
                  rows={3} 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Support Phone / Contact</label>
                <input 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all bg-slate-50 focus:bg-white" 
                  placeholder="+91 98765 43210" 
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* GST & Compliance Section */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Tax & Compliance</h2>
            <p className="text-sm text-slate-500 mb-4">
              These details are used to calculate CGST/SGST vs IGST automatically.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">GSTIN Number</label>
                <input 
                  name="gstin" 
                  value={formData.gstin} 
                  onChange={(e) => setFormData(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all bg-slate-50 focus:bg-white uppercase font-medium" 
                  placeholder="e.g. 27AAAAA0000A1Z5" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Registered State (Place of Supply) *</label>
                <input 
                  required
                  name="state" 
                  value={formData.state} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all bg-slate-50 focus:bg-white font-medium" 
                  placeholder="e.g. Maharashtra" 
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-end gap-4 border-t border-slate-100">
            {successMessage && (
              <span className="text-sm font-semibold text-emerald-600 animate-in fade-in slide-in-from-right-4 duration-300">
                {successMessage}
              </span>
            )}
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}