'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function ClientsPage() {
  const { getToken, orgId } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', address: '', taxId: '' });

  const fetchClients = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': orgId || '' },
      });
      if (response.ok) setClients(await response.json());
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) fetchClients();
  }, [orgId, getToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const url = editingClient 
        ? `${process.env.NEXT_PUBLIC_API_URL}/customers/${editingClient.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/customers`;
        
      const response = await fetch(url, {
        method: editingClient ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, 
          'x-workspace-id': orgId || '' 
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchClients();
      }
    } catch (error) {
      console.error('Failed to save client', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client? This cannot be undone.')) return;
    try {
      const token = await getToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': orgId || '' }
      });
      fetchClients();
    } catch (error) {
      console.error('Failed to delete client', error);
    }
  };

  const openModal = (client: any = null) => {
    setEditingClient(client);
    setFormData(client ? { 
      name: client.name || '', 
      email: client.email || '', 
      address: client.address || '', 
      taxId: client.taxId || '' 
    } : { name: '', email: '', address: '', taxId: '' });
    setIsModalOpen(true);
  };

  if (loading) return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="h-10 bg-slate-200 rounded-lg w-64"></div>
      <div className="h-96 bg-white rounded-2xl border border-slate-200"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Address Book</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your clients to auto-fill invoices instantly.</p>
          </div>
          <button 
            onClick={() => openModal()} 
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add New Client
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Client Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Contact</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Billing Info</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Total Invoices</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{client.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{client.email || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div>{client.address || 'No address provided'}</div>
                      {client.taxId && <div className="text-xs text-slate-400 mt-0.5">Tax ID: {client.taxId}</div>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                        {client._count?.invoices || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openModal(client)} 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(client.id)} 
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No clients found</h3>
                        <p className="text-slate-500 text-sm mt-1 mb-6">Add your regular clients here so you never have to type their details manually again.</p>
                        <button onClick={() => openModal()} className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg font-semibold transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          Add Client
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl ring-1 ring-slate-900/5">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">{editingClient ? 'Edit Client' : 'New Client'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-full">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Company / Client Name *</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Acme Corp" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="billing@acmecorp.com" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tax ID / GST Number (Optional)</label>
                <input type="text" value={formData.taxId} onChange={(e) => setFormData({...formData, taxId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="GST123456789" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Billing Address</label>
                <textarea rows={3} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="123 Business Rd, Suite 100..." />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}