'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function CustomersPage() {
  const { getToken, orgId } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', address: '', gstin: '', state: ''
  });

  const fetchCustomers = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-workspace-id': orgId || '',
        },
        cache: 'no-store'
      });
      if (res.ok) setCustomers(await res.json());
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) fetchCustomers();
  }, [orgId, getToken]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      address: customer.address || '',
      gstin: customer.gstin || '',
      state: customer.state || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client? This will NOT delete their existing invoices, but it will remove them from this list.")) return;
    
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-workspace-id': orgId || '',
        }
      });
      if (res.ok) fetchCustomers();
    } catch (error) {
      console.error("Failed to delete customer:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = await getToken();
      const url = editingCustomer 
        ? `${process.env.NEXT_PUBLIC_API_URL}/customers/${editingCustomer.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/customers`;
      
      // Auto-uppercase GSTIN for cleaner data
      const payload = {
        ...formData,
        gstin: formData.gstin.toUpperCase()
      };

      const res = await fetch(url, {
        method: editingCustomer ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-workspace-id': orgId || '',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingCustomer(null);
        setFormData({ name: '', email: '', address: '', gstin: '', state: '' });
        fetchCustomers();
      }
    } catch (error) {
      console.error("Error saving customer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients & Customers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your client directory and billing details.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCustomer(null);
            setFormData({ name: '', email: '', address: '', gstin: '', state: '' });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          Add Client
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Client Details</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Location & GST</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Invoices</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">Loading clients...</td></tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">No clients found</h3>
                    <p className="text-sm text-slate-500 mt-1">Get started by adding your first client.</p>
                  </div>
                </td>
              </tr>
            ) : (
              customers.map((customer: any) => (
                <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{customer.name}</div>
                    {customer.email && <div className="text-sm text-slate-500 mt-0.5">{customer.email}</div>}
                  </td>
                  <td className="px-6 py-4">
                    {customer.state ? (
                      <div className="text-sm font-medium text-slate-700">{customer.state}</div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No state set</span>
                    )}
                    {customer.gstin && <div className="text-xs text-slate-400 mt-0.5 uppercase">GSTIN: {customer.gstin}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {customer._count?.invoices || 0} Invoices
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditClick(customer)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Edit</button>
                      <button onClick={() => handleDeleteClick(customer.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
            
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-slate-900">
                {editingCustomer ? 'Edit Client Details' : 'Add New Client'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-slate-50/50">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Client / Company Name *</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all shadow-sm bg-white" placeholder="e.g. Stark Industries" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all shadow-sm bg-white" placeholder="billing@company.com" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Billing Address</label>
                  <textarea name="address" value={formData.address} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all shadow-sm bg-white" placeholder="Full address..." rows={2} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">State (Place of Supply)</label>
                  <input name="state" value={formData.state} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm bg-white" placeholder="e.g. Maharashtra" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">GSTIN Number</label>
                  <input name="gstin" value={formData.gstin} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm bg-white uppercase" placeholder="27AAAAA0000A1Z5" />
                </div>
              </div>

              <div className="pt-5 flex justify-end gap-3 border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-700 font-semibold hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2">
                  {isSubmitting ? 'Saving...' : (editingCustomer ? 'Save Changes' : 'Create Client')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}