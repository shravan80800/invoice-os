'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

const CATEGORIES = ['SOFTWARE', 'SERVER_HOSTING', 'MARKETING', 'RENT', 'HARDWARE', 'FREELANCERS', 'OTHER'];

export default function BalanceSheetPage() {
  const { getToken, orgId } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ amount: '', category: 'SOFTWARE', description: '', date: new Date().toISOString().split('T')[0] });

  const fetchData = async () => {
    try {
      const token = await getToken();
      const headers = { 'Authorization': `Bearer ${token}`, 'x-workspace-id': orgId || '' };

      const [invRes, prodRes, expRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices`, { headers, cache: 'no-store' }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, { headers, cache: 'no-store' }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/expenses`, { headers, cache: 'no-store' })
      ]);

      if (invRes.ok) setInvoices(await invRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (expRes.ok) setExpenses(await expRes.json());
    } catch (error) {
      console.error("Failed to fetch financial data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (orgId) fetchData(); }, [orgId, getToken]);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'x-workspace-id': orgId || '' },
        body: JSON.stringify(newExpense),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`Failed to save: ${errorData.message || 'Unknown error'}`);
        return; 
      }

      setIsAddingExpense(false);
      setNewExpense({ amount: '', category: 'SOFTWARE', description: '', date: new Date().toISOString().split('T')[0] });
      fetchData(); 
    } catch (error) {
      console.error("Error saving expense", error);
      alert("A network error occurred while saving the expense.");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if(!confirm('Delete this expense?')) return;
    const token = await getToken();
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/expenses/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': orgId || '' },
    });
    fetchData();
  };

  // --- ACCOUNTING ENGINE ---
  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.subTotal || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  // ASSETS
  const cashOnHand = netProfit; 
  const accountsReceivable = invoices.filter(i => ['SENT', 'OVERDUE'].includes(i.status)).reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  const inventoryValue = products.reduce((sum, p) => sum + (p.stockQuantity > 0 ? p.stockQuantity * p.price : 0), 0);
  const totalAssets = cashOnHand + accountsReceivable + inventoryValue;

  // LIABILITIES
  const gstLiability = invoices.filter(i => i.status !== 'DRAFT').reduce((sum, i) => sum + (i.taxTotal || 0), 0);
  const totalLiabilities = gstLiability;

  // EQUITY
  const ownersEquity = totalAssets - totalLiabilities;

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Calculating Balance Sheet...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] print:bg-white text-slate-900 font-sans">
      
      {/* =========================================
          1. SCREEN UI (Hidden on Print) 
          ========================================= */}
      <div className="p-8 max-w-6xl mx-auto print:hidden">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Balance Sheet & Ledger</h1>
            <p className="text-sm text-slate-500 mt-1">Real-time assets, liabilities, and expense tracking.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsAddingExpense(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-semibold shadow-sm transition-colors">
              + Log Expense
            </button>
            <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print Formal Sheet
            </button>
          </div>
        </div>

        {/* P&L Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-sm font-semibold text-slate-500">Total Income (Paid)</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-sm font-semibold text-slate-500">Total Expenses</p>
            <h3 className="text-3xl font-bold text-rose-600 mt-1">-₹{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          </div>
          <div className={`p-6 rounded-2xl shadow-sm border ${netProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            <p className={`text-sm font-semibold ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>Net Profit / Loss</p>
            <h3 className={`text-3xl font-bold mt-1 ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              ₹{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Expense Ledger (Screen) */}
        <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Expenses Ledger</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-10">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Date</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Description</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Category</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600 text-right">Amount</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No expenses logged yet.</td></tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{exp.description || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg uppercase">
                        {exp.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-rose-600 text-right">₹{exp.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleDeleteExpense(exp.id)} className="text-rose-500 hover:text-rose-700 p-1">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================
          2. FORMAL PRINT UI (Hidden on Screen) 
          ========================================= */}
      <div className="hidden print:block max-w-4xl mx-auto p-8 text-black bg-white">
        {/* Formal Header */}
        <div className="text-center mb-12 border-b-2 border-black pb-6">
          <h1 className="text-3xl font-extrabold uppercase tracking-widest mb-2">Statement of Financial Position</h1>
          <h2 className="text-xl font-medium text-gray-700">InvoiceOS Workspace</h2>
          <p className="text-sm text-gray-500 mt-2">Prepared As Of: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* The Balance Sheet Grid */}
        <div className="grid grid-cols-2 gap-12">
          
          {/* ASSETS COLUMN */}
          <div>
            <h3 className="text-lg font-bold uppercase tracking-wider mb-4 border-b border-gray-400 pb-1">Assets</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-end">
                <span className="text-gray-800">Cash & Equivalents</span>
                <span className="text-right tabular-nums">₹{cashOnHand.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-gray-800">Accounts Receivable</span>
                <span className="text-right tabular-nums">₹{accountsReceivable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-gray-800">Inventory Assets</span>
                <span className="text-right tabular-nums">₹{inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Total Assets Line */}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-black border-b-4 border-double">
              <span>Total Assets</span>
              <span className="tabular-nums">₹{totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* LIABILITIES & EQUITY COLUMN */}
          <div>
            <h3 className="text-lg font-bold uppercase tracking-wider mb-4 border-b border-gray-400 pb-1">Liabilities & Equity</h3>
            
            {/* Liabilities */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-end text-gray-800">
                <span>GST & Tax Payable</span>
                <span className="text-right tabular-nums">₹{gstLiability.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-300">
                <span>Total Liabilities</span>
                <span className="tabular-nums">₹{totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Equity */}
            <div className="space-y-3 mb-6 mt-8">
              <div className="flex justify-between items-end text-gray-800">
                <span>Owner's Equity (Retained Earnings)</span>
                <span className="text-right tabular-nums">₹{ownersEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Total Liabilities & Equity Line */}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-black border-b-4 border-double">
              <span>Total Liabilities & Equity</span>
              <span className="tabular-nums">₹{(totalLiabilities + ownersEquity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

        </div>

        {/* P&L Annexure (Printed at bottom) */}
        <div className="mt-16 pt-8 border-t border-gray-300">
          <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-600">Annexure A: Profit & Loss Snapshot</h4>
          <div className="flex justify-between max-w-sm text-sm">
            <span>Gross Revenue (Paid):</span>
            <span className="tabular-nums">₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between max-w-sm text-sm mt-1 text-red-700">
            <span>Total Operating Expenses:</span>
            <span className="tabular-nums">-₹{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between max-w-sm text-sm font-bold mt-2 pt-1 border-t border-gray-400">
            <span>Net Income:</span>
            <span className="tabular-nums">₹{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-24 flex justify-between px-12">
          <div className="text-center">
            <div className="w-48 border-b border-black mb-2"></div>
            <p className="text-xs font-semibold uppercase">Prepared By</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-black mb-2"></div>
            <p className="text-xs font-semibold uppercase">Authorized Signatory</p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="fixed bottom-4 left-0 w-full text-center text-xs text-gray-400">
          Generated automatically by InvoiceOS Financial Systems • Document ID: BAL-{new Date().getTime().toString().slice(-6)}
        </div>
      </div>

      {/* =========================================
          3. EXPENSE MODAL
          ========================================= */}
      {isAddingExpense && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Log an Expense</h2>
              <button onClick={() => setIsAddingExpense(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 bg-slate-50/50">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                <input required type="number" min="0.01" step="0.01" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="e.g. 5000" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Category *</label>
                <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none bg-white">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <input type="text" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="e.g. AWS Hosting Bill" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                <input type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none" />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}