'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import CreateInvoiceForm from '@/components/CreateInvoiceForm';

export default function DashboardOverview() {
  const { getToken, orgId } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': orgId || '' },
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) fetchInvoices();
  }, [orgId, getToken]);

  const handleEdit = async (invoice: any) => {
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoice.id}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': orgId || '' },
      });
      if (response.ok) {
        const fullInvoice = await response.json();
        setEditingInvoice(fullInvoice);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch invoice details", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This cannot be undone.')) return;
    
    setInvoices(current => current.filter(inv => inv.id !== id));
    
    try {
      const token = await getToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': orgId || '' }
      });
    } catch (error) {
      console.error("Failed to delete invoice", error);
      fetchInvoices();
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    setInvoices(current => current.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus } : inv));
    try {
      const token = await getToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoiceId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'x-workspace-id': orgId || '' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) { 
      fetchInvoices(); 
    }
  };

  // Modern pill styling for statuses
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20';
      case 'SENT': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20';
      case 'OVERDUE': return 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20';
      default: return 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20';
    }
  };

  // Helper for Indian Rupee formatting
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingInvoice(null);
  };

  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.grandTotal || 0), 0);
  const outstandingAmount = invoices.filter(i => i.status === 'SENT' || i.status === 'OVERDUE').reduce((s, i) => s + (i.grandTotal || 0), 0);
  const draftAmount = invoices.filter(i => i.status === 'DRAFT').reduce((s, i) => s + (i.grandTotal || 0), 0);

  // Modern skeleton loading state
  if (loading) return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-8 animate-pulse">
      <div className="h-10 bg-gray-200 rounded-lg w-48"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>)}
      </div>
      <div className="h-96 bg-gray-100 rounded-2xl"></div>
    </div>
  );

  return (
    <div className="p-8 w-full max-w-7xl mx-auto bg-[#FAFAFA] min-h-screen font-sans text-zinc-900 selection:bg-blue-100">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your invoices and track your revenue.</p>
        </div>
        <button 
          onClick={() => { setEditingInvoice(null); setIsModalOpen(true); }} 
          className="group relative inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.1)] active:scale-95"
        >
          <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Invoice
        </button>
      </div>

      {/* Modern Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/60 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          </div>
          <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Total Revenue (Paid)</p>
          <h2 className="text-3xl font-bold mt-2 text-zinc-900">{formatCurrency(totalRevenue)}</h2>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/60 relative overflow-hidden group">
          <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Outstanding</p>
          <h2 className="text-3xl font-bold mt-2 text-zinc-900">{formatCurrency(outstandingAmount)}</h2>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/60 relative overflow-hidden group">
          <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Drafts</p>
          <h2 className="text-3xl font-bold mt-2 text-zinc-900">{formatCurrency(draftAmount)}</h2>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50/80 backdrop-blur-sm border-b border-gray-200/60">
              <tr>
                <th className="p-5 text-xs font-semibold tracking-wider text-zinc-500 uppercase">Invoice Number</th>
                <th className="p-5 text-xs font-semibold tracking-wider text-zinc-500 uppercase">Client</th>
                <th className="p-5 text-xs font-semibold tracking-wider text-zinc-500 uppercase">Amount</th>
                <th className="p-5 text-xs font-semibold tracking-wider text-zinc-500 uppercase">Status</th>
                <th className="p-5 text-xs font-semibold tracking-wider text-zinc-500 uppercase">Date</th>
                <th className="p-5 text-xs font-semibold tracking-wider text-zinc-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="p-5 font-medium text-zinc-900">{inv.invoiceNumber}</td>
                  <td className="p-5">
                    <div className="font-medium text-zinc-900">{inv.customer?.name}</div>
                    <div className="text-sm text-zinc-500 mt-0.5">{inv.customer?.email}</div>
                  </td>
                  <td className="p-5 font-medium text-zinc-900">{formatCurrency(inv.grandTotal || 0)}</td>
                  <td className="p-5">
                    {/* Modern hidden-chevron Select */}
                    <div className="relative inline-block">
                      <select
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                        className={`appearance-none text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer pr-8 outline-none transition-all ${getStatusConfig(inv.status)}`}
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="SENT">SENT</option>
                        <option value="PAID">PAID</option>
                        <option value="OVERDUE">OVERDUE</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 text-sm text-zinc-600">
                    {new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="p-5">
                    <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      {/* View PDF */}
                      <Link 
                        href={`/dashboard/invoices/${inv.id}`} 
                        className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View PDF"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </Link>
                      {/* Edit */}
                      <button 
                        onClick={() => handleEdit(inv)} 
                        className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Invoice"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      {/* Delete */}
                      <button 
                        onClick={() => handleDelete(inv.id)} 
                        className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Invoice"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {/* Modern Empty State */}
              {invoices.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-2">
                        <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-zinc-900">No invoices found</h3>
                      <p className="text-zinc-500 text-sm max-w-sm">You haven't created any invoices yet. Click the button above to create your first one.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal with sleek backdrop */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-900/40 backdrop-blur-sm transition-opacity">
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-zinc-900">{editingInvoice ? 'Edit Invoice' : 'New Invoice'}</h2>
              <button 
                onClick={closeModal} 
                className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <CreateInvoiceForm 
                existingInvoice={editingInvoice} 
                onSuccess={() => { closeModal(); fetchInvoices(); }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}