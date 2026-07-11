'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import CreateInvoiceForm from '@/components/CreateInvoiceForm';

export default function DashboardOverview() {
  const { getToken, orgId } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  
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
    if (!confirm('INITIATING DELETION: Are you sure you want to permanently erase this record?')) return;
    
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

  // High-tech neon badge styling
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
      case 'SENT': return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]';
      case 'OVERDUE': return 'bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]';
      default: return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30';
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingInvoice(null);
  };

  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.grandTotal || 0), 0);
  const outstandingAmount = invoices.filter(i => i.status === 'SENT' || i.status === 'OVERDUE').reduce((s, i) => s + (i.grandTotal || 0), 0);
  const draftAmount = invoices.filter(i => i.status === 'DRAFT').reduce((s, i) => s + (i.grandTotal || 0), 0);

  // Holographic loading skeleton
  if (loading) return (
    <div className="p-8 w-full min-h-screen bg-[#09090b] relative overflow-hidden flex flex-col gap-8">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="h-10 bg-zinc-800/50 rounded-lg w-48 animate-pulse border border-zinc-700/50"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-zinc-800/30 rounded-xl border border-zinc-800 animate-pulse"></div>)}
      </div>
      <div className="h-96 bg-zinc-800/20 rounded-xl border border-zinc-800 animate-pulse"></div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#030712] text-zinc-300 font-sans selection:bg-cyan-500/30 overflow-hidden">
      
      {/* Tech Grid Background & Neon Glow */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-cyan-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 p-8 w-full max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
              System Overview
            </h1>
            <p className="text-sm text-cyan-400/80 mt-1 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Live Financial Telemetry
            </p>
          </div>
          <button 
            onClick={() => { setEditingInvoice(null); setIsModalOpen(true); }} 
            className="group relative inline-flex items-center justify-center gap-2 bg-cyan-500/10 text-cyan-300 px-6 py-2.5 rounded-lg font-mono text-sm tracking-wider uppercase border border-cyan-500/50 hover:bg-cyan-500/20 hover:text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Initialize Invoice
          </button>
        </div>

        {/* Glassmorphic Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/40 backdrop-blur-md p-6 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:text-cyan-400 transition-all">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            </div>
            <p className="text-xs font-mono tracking-widest text-zinc-500 uppercase">Gross Yield</p>
            <h2 className="text-3xl font-bold mt-2 text-white font-mono">{formatCurrency(totalRevenue)}</h2>
          </div>
          
          <div className="bg-zinc-900/40 backdrop-blur-md p-6 rounded-xl border border-white/5 hover:border-violet-500/30 transition-all relative overflow-hidden group">
            <p className="text-xs font-mono tracking-widest text-zinc-500 uppercase">Pending Settl.</p>
            <h2 className="text-3xl font-bold mt-2 text-white font-mono">{formatCurrency(outstandingAmount)}</h2>
          </div>
          
          <div className="bg-zinc-900/40 backdrop-blur-md p-6 rounded-xl border border-white/5 hover:border-zinc-500/50 transition-all relative overflow-hidden group">
            <p className="text-xs font-mono tracking-widest text-zinc-500 uppercase">Local Drafts</p>
            <h2 className="text-3xl font-bold mt-2 text-white font-mono">{formatCurrency(draftAmount)}</h2>
          </div>
        </div>

        {/* Cyberpunk Data Table */}
        <div className="bg-zinc-900/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-black/40 border-b border-white/10">
                <tr>
                  <th className="p-4 text-xs font-mono tracking-widest text-zinc-400 uppercase">ID_REF</th>
                  <th className="p-4 text-xs font-mono tracking-widest text-zinc-400 uppercase">Entity</th>
                  <th className="p-4 text-xs font-mono tracking-widest text-zinc-400 uppercase">Value</th>
                  <th className="p-4 text-xs font-mono tracking-widest text-zinc-400 uppercase">State</th>
                  <th className="p-4 text-xs font-mono tracking-widest text-zinc-400 uppercase">Timestamp</th>
                  <th className="p-4 text-xs font-mono tracking-widest text-zinc-400 uppercase text-right">Execute</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-cyan-900/10 hover:shadow-[inset_4px_0_0_rgba(34,211,238,0.5)] transition-all group">
                    <td className="p-4 font-mono text-sm text-cyan-100">{inv.invoiceNumber}</td>
                    <td className="p-4">
                      <div className="font-medium text-zinc-200">{inv.customer?.name}</div>
                      <div className="text-xs font-mono text-zinc-500 mt-0.5">{inv.customer?.email}</div>
                    </td>
                    <td className="p-4 font-mono text-sm text-zinc-200">{formatCurrency(inv.grandTotal || 0)}</td>
                    <td className="p-4">
                      <div className="relative inline-block w-full max-w-[120px]">
                        <select
                          value={inv.status}
                          onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                          className={`w-full appearance-none text-[10px] font-mono tracking-wider px-3 py-1.5 rounded outline-none transition-all cursor-pointer ${getStatusConfig(inv.status)}`}
                        >
                          <option value="DRAFT" className="bg-zinc-900 text-zinc-300">DRAFT</option>
                          <option value="SENT" className="bg-zinc-900 text-cyan-300">SENT</option>
                          <option value="PAID" className="bg-zinc-900 text-emerald-300">PAID</option>
                          <option value="OVERDUE" className="bg-zinc-900 text-rose-300">OVERDUE</option>
                        </select>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-mono text-zinc-500">
                      {new Date(inv.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-3 opacity-100 md:opacity-30 md:group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/dashboard/invoices/${inv.id}`} 
                          className="text-zinc-500 hover:text-cyan-400 hover:drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] transition-all"
                          title="Extract PDF"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </Link>
                        <button 
                          onClick={() => handleEdit(inv)} 
                          className="text-zinc-500 hover:text-emerald-400 hover:drop-shadow-[0_0_5px_rgba(16,185,129,0.8)] transition-all"
                          title="Modify Record"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(inv.id)} 
                          className="text-zinc-500 hover:text-rose-400 hover:drop-shadow-[0_0_5px_rgba(244,63,94,0.8)] transition-all"
                          title="Purge Record"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {/* Tech Empty State */}
                {invoices.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 rounded-full border border-zinc-800 flex items-center justify-center relative">
                          <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping"></div>
                          <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-mono text-zinc-300">DATA_NOT_FOUND</h3>
                          <p className="text-zinc-600 text-sm font-mono mt-1 max-w-sm mx-auto">No telemetry data available. Awaiting first invoice initialization.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cyberpunk Modal Backdrop */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md transition-opacity">
          <div 
            className="bg-[#09090b] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(34,211,238,0.1)] border border-white/10 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Tech Header */}
            <div className="sticky top-0 bg-[#09090b]/90 backdrop-blur-md z-10 flex justify-between items-center px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-mono tracking-widest text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                {editingInvoice ? 'OVERRIDE_RECORD' : 'GENERATE_RECORD'}
              </h2>
              <button 
                onClick={closeModal} 
                className="p-2 text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
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
      
      {/* Custom Tailwind Animation definition for the button shimmer */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}