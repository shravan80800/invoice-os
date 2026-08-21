'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$'
};

export default function InvoicePDFPage() {
  const { getToken, orgId } = useAuth();
  const params = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSingleInvoice = async () => {
      try {
        const token = await getToken();
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${params.id}?_t=${Date.now()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-workspace-id': orgId || '',
          },
          cache: 'no-store'
        });

        if (response.ok) {
          const data = await response.json();
          setInvoice(data);
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orgId && params.id) fetchSingleInvoice();
  }, [orgId, params.id, getToken]);

  const handlePrint = () => {
    if (!invoice) return;
    
    const originalTitle = document.title;
    const safeClientName = invoice.customer?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Client';
    
    document.title = `Invoice_${invoice.invoiceNumber}_${safeClientName}`;
    window.print();
    
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading PDF...</div>;
  if (!invoice) return <div className="min-h-screen flex items-center justify-center">Invoice not found.</div>;

  const symbol = CURRENCY_SYMBOLS[invoice.currency] || (invoice.currency ? invoice.currency + ' ' : '₹');
  
  // 🚀 NEW: Calculate the dynamic tax percentages for the UI
  const totalTaxRate = invoice.subTotal > 0 ? Math.round((invoice.taxTotal / invoice.subTotal) * 100) : 0;
  const splitRate = (totalTaxRate / 2).toFixed(1).replace('.0', ''); // Turns 9.0 into 9

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white text-zinc-900 font-sans">
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href="/dashboard/invoices" className="text-blue-600 hover:underline font-medium">
          &larr; Back to Invoices
        </Link>
        <button 
          onClick={handlePrint} 
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
        >
          Save as PDF
        </button>
      </div>

      <div id="printable-invoice" className="max-w-4xl mx-auto bg-white p-12 rounded-xl shadow-lg print:shadow-none print:m-0 print:p-0">
        
        {/* Header Section */}
        <div className="flex justify-between items-start border-b pb-8 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-blue-600 tracking-tight">INVOICE</h1>
            <p className="text-gray-500 mt-1 font-medium">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <h2 className="font-bold text-gray-900 text-xl">
              {invoice.workspace?.companyName || 'Set Company Name in Settings'}
            </h2>
            <p className="text-gray-500 mt-1 text-sm whitespace-pre-wrap">
              {invoice.workspace?.address || 'Set Address in Settings'}
            </p>
            <p className="text-gray-500 mt-1 text-sm">
              {invoice.workspace?.phone || ''}
            </p>
            {/* 🚀 NEW: Workspace GSTIN Display */}
            {invoice.workspace?.gstin && (
              <p className="text-gray-600 mt-1 text-sm font-semibold">
                GSTIN: {invoice.workspace.gstin}
              </p>
            )}
            {invoice.workspace?.state && (
              <p className="text-gray-500 text-sm">
                State: {invoice.workspace.state}
              </p>
            )}
          </div>
        </div>

        {/* Bill To & Dates */}
        <div className="flex justify-between mb-12">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</p>
            <p className="font-bold text-lg text-gray-900">{invoice.customer?.name}</p>
            <p className="text-gray-600">{invoice.customer?.email}</p>
            {/* 🚀 NEW: Customer GSTIN Display */}
            {invoice.customer?.gstin && (
              <p className="text-gray-600 mt-1 text-sm font-medium">GSTIN: {invoice.customer.gstin}</p>
            )}
            {invoice.customer?.state && (
              <p className="text-gray-500 text-sm">Place of Supply: {invoice.customer.state}</p>
            )}
          </div>
          <div className="text-right">
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Issue Date</p>
              <p className="font-medium text-gray-900">{new Date(invoice.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Due Date</p>
              <p className="font-medium text-gray-900">{new Date(invoice.dueDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Breakdown Table */}
        <table className="w-full text-left mb-12">
          <thead>
            <tr className="border-b-2 border-gray-900 text-sm">
              <th className="py-3 font-bold text-gray-900">Description</th>
              <th className="py-3 font-bold text-gray-900 text-center">Qty</th>
              <th className="py-3 font-bold text-gray-900 text-right">Price</th>
              <th className="py-3 font-bold text-gray-900 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item: any) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-4 text-gray-800">{item.description}</td>
                  <td className="py-4 text-center text-gray-800">{item.quantity}</td>
                  <td className="py-4 text-right text-gray-800">{symbol}{item.price?.toFixed(2)}</td>
                  <td className="py-4 text-right text-gray-800">{symbol}{item.total?.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr className="border-b border-gray-200">
                <td className="py-4 text-gray-800">Custom Software Services</td>
                <td className="py-4 text-center text-gray-800">1</td>
                <td className="py-4 text-right text-gray-800">{symbol}{invoice.subTotal?.toFixed(2)}</td>
                <td className="py-4 text-right text-gray-800">{symbol}{invoice.subTotal?.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-end">
          <div className="w-72">
            <div className="flex justify-between py-2 text-gray-600">
              <span>Subtotal</span>
              <span>{symbol}{invoice.subTotal?.toFixed(2)}</span>
            </div>
            
            {/* 🚀 NEW: Dynamic GST Engine Rendering */}
            {invoice.taxType === 'CGST_SGST' ? (
              <>
                <div className="flex justify-between py-2 text-gray-600">
                  <span>CGST ({splitRate}%)</span>
                  <span>{symbol}{invoice.cgstTotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 text-gray-600 border-b border-gray-200">
                  <span>SGST ({splitRate}%)</span>
                  <span>{symbol}{invoice.sgstTotal?.toFixed(2)}</span>
                </div>
              </>
            ) : invoice.taxType === 'IGST' ? (
              <div className="flex justify-between py-2 text-gray-600 border-b border-gray-200">
                <span>IGST ({totalTaxRate}%)</span>
                <span>{symbol}{invoice.igstTotal?.toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex justify-between py-2 text-gray-600 border-b border-gray-200">
                <span>Tax</span>
                <span>{symbol}{invoice.taxTotal?.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between py-4 text-xl font-bold text-gray-900">
              <span>Total Due</span>
              <span>{symbol}{invoice.grandTotal?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>Thank you for your business!</p>
          <p>Please make payment within 30 days of the issue date.</p>
        </div>

      </div>
    </div>
  );
}