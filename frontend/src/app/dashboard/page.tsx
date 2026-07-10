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

  // Handle Edit Click
  const handleEdit = async (invoice: any) => {
    try {
      const token = await getToken();
      // Fetch full invoice details (including line items) before opening modal
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

  // Handle Delete Click
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This cannot be undone.')) return;
    
    // Optimistic UI update
    setInvoices(current => current.filter(inv => inv.id !== id));
    
    try {
      const token = await getToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': orgId || '' }
      });
    } catch (error) {
      console.error("Failed to delete invoice", error);
      fetchInvoices(); // Revert on failure
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800 border-green-200';
      case 'SENT': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'OVERDUE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingInvoice(null);
  };

  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.grandTotal || 0), 0);
  const outstandingAmount = invoices.filter(i => i.status === 'SENT' || i.status === 'OVERDUE').reduce((s, i) => s + (i.grandTotal || 0), 0);
  const draftAmount = invoices.filter(i => i.status === 'DRAFT').reduce((s, i) => s + (i.grandTotal || 0), 0);

  if (loading) return <div className="p-8">Loading your workspace...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-zinc-900">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button 
          onClick={() => { setEditingInvoice(null); setIsModalOpen(true); }} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          + Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Revenue (Paid)</p>
          <h2 className="text-3xl font-bold mt-1">₹{totalRevenue.toFixed(2)}</h2>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Outstanding</p>
          <h2 className="text-3xl font-bold mt-1">₹{outstandingAmount.toFixed(2)}</h2>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Drafts</p>
          <h2 className="text-3xl font-bold mt-1">₹{draftAmount.toFixed(2)}</h2>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-600">Invoice Number</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Client</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Amount</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="p-4 text-sm font-semibold text-gray-600">Date</th>
              <th className="p-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4 font-medium">{inv.invoiceNumber}</td>
                <td className="p-4">
                  <div className="font-medium">{inv.customer?.name}</div>
                  <div className="text-xs text-gray-400">{inv.customer?.email}</div>
                </td>
                <td className="p-4 font-medium">₹{inv.grandTotal?.toFixed(2)}</td>
                <td className="p-4">
                  <select
                    value={inv.status}
                    onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer ${getStatusColor(inv.status)}`}
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="SENT">SENT</option>
                    <option value="PAID">PAID</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </td>
                <td className="p-4 text-sm text-gray-600">{new Date(inv.createdAt).toLocaleDateString()}</td>
                <td className="p-4 text-right space-x-3">
                  <Link href={`/dashboard/invoices/${inv.id}`} className="text-blue-600 text-sm font-medium hover:underline">View PDF</Link>
                  <button onClick={() => handleEdit(inv)} className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors">Edit</button>
                  <button onClick={() => handleDelete(inv.id)} className="text-gray-600 hover:text-red-600 text-sm font-medium transition-colors">Delete</button>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No invoices found. Create your first one!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingInvoice ? 'Edit Invoice' : 'New Invoice'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-900 text-2xl">&times;</button>
            </div>
            <CreateInvoiceForm 
              existingInvoice={editingInvoice} 
              onSuccess={() => { closeModal(); fetchInvoices(); }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}