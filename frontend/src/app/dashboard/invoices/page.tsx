'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import CreateInvoiceForm from '@/components/CreateInvoiceForm';

export default function InvoicesPage() {
  const { getToken, orgId } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  
  const CURRENCY_SYMBOLS: Record<string, string> = {
    INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$'
  };
  // Helper function to resolve symbol
  const getSymbol = (curr: string) => CURRENCY_SYMBOLS[curr] || (curr ? curr + ' ' : '₹');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  
  // 🚀 NEW: Search state
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInvoices = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-workspace-id': orgId || '',
        },
        cache: 'no-store' 
      });
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  useEffect(() => {
    if (orgId) fetchInvoices();
  }, [orgId, getToken]);

  const handleEdit = async (invoice: any) => {
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoice.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-workspace-id': orgId || '',
        },
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
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-workspace-id': orgId || '',
        }
      });
    } catch (error) {
      console.error("Failed to delete invoice", error);
      fetchInvoices(); 
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    setInvoices(currentInvoices => 
      currentInvoices.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus } : inv)
    );

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${invoiceId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-workspace-id': orgId || '',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) fetchInvoices();
    } catch (error) {
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

  // 🚀 NEW: Filter invoices based on the search query
  const filteredInvoices = invoices.filter((invoice) => {
    const query = searchQuery.toLowerCase();
    return (
      invoice.invoiceNumber?.toLowerCase().includes(query) ||
      invoice.customer?.name?.toLowerCase().includes(query) ||
      invoice.customer?.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        
        {/* 🚀 NEW: Search Bar and Create Button wrapper */}
        <div className="flex w-full md:w-auto gap-4">
          <div className="relative flex-1 md:w-64">
            <input 
              type="text" 
              placeholder="Search client or invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-900"
            />
            {/* Search Icon */}
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <button 
            onClick={() => { setEditingInvoice(null); setIsModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            + Create Invoice
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm">
              <th className="p-4 font-semibold text-gray-600">Invoice Number</th>
              <th className="p-4 font-semibold text-gray-600">Client</th>
              <th className="p-4 font-semibold text-gray-600">Amount</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
              <th className="p-4 font-semibold text-gray-600">Date</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* 🚀 Map over filteredInvoices instead of invoices */}
            {filteredInvoices.map((invoice: any) => (
              <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-gray-900">{invoice.invoiceNumber}</td>
                <td className="p-4 text-gray-600">
                  {invoice.customer?.name}
                  <div className="text-xs text-gray-400">{invoice.customer?.email}</div>
                </td>
                
                {/* 🚀 FIXED: Dynamic Currency Symbol applies here */}
                <td className="p-4 font-medium text-gray-900">
                  {getSymbol(invoice.currency)}{invoice.grandTotal?.toFixed(2)}
                </td>
                
                <td className="p-4">
                  <select
                    value={invoice.status}
                    onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer outline-none appearance-none ${getStatusColor(invoice.status)}`}
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="SENT">SENT</option>
                    <option value="PAID">PAID</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </td>

                <td className="p-4 text-gray-600 text-sm">
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-right space-x-4">
                  <Link 
                    href={`/dashboard/invoices/${invoice.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    View PDF
                  </Link>
                  <button 
                    onClick={() => handleEdit(invoice)} 
                    className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(invoice.id)} 
                    className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            
            {/* Handle empty states based on whether there's a search query or just no invoices */}
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  {searchQuery 
                    ? `No invoices found matching "${searchQuery}"` 
                    : "No invoices found. Create your first one!"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Shared Creation & Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
              </h2>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light"
              >
                &times;
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