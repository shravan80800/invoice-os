'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend 
} from 'recharts';

export default function ReportsPage() {
  const { getToken, orgId } = useAuth();
  
  // 🚀 Added Products state for Inventory Valuation
  const [invoices, setInvoices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Safe Date Defaults (Last 30 Days)
  const defaultEnd = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 30);

  const [startDate, setStartDate] = useState(defaultStart.toLocaleDateString('en-CA'));
  const [endDate, setEndDate] = useState(defaultEnd.toLocaleDateString('en-CA')); 
  const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'yearly'>('daily');

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const token = await getToken();
        const headers = {
          'Authorization': `Bearer ${token}`,
          'x-workspace-id': orgId || '',
        };

        // 🚀 Fetch both datasets simultaneously
        const [invRes, prodRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices`, { headers, cache: 'no-store' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, { headers, cache: 'no-store' })
        ]);

        if (invRes.ok) setInvoices(await invRes.json());
        if (prodRes.ok) setProducts(await prodRes.json());
        
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orgId) fetchReportData();
  }, [orgId, getToken]);

  // ==========================================
  // 🚀 ROBUST TIMEZONE-SAFE ENGINE
  // ==========================================
  
  const startObj = new Date(startDate);
  startObj.setHours(0, 0, 0, 0);
  
  const endObj = new Date(endDate);
  endObj.setHours(23, 59, 59, 999);

  const filteredInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.createdAt);
    return invDate >= startObj && invDate <= endObj;
  });

  const generateChartData = () => {
    const groupedData: Record<string, { label: string, paid: number, pending: number }> = {};

    filteredInvoices.forEach(inv => {
      const dateObj = new Date(inv.createdAt);
      let key = '';
      let label = '';

      if (viewMode === 'daily') {
        key = dateObj.toLocaleDateString('en-CA'); 
        label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); 
      } else if (viewMode === 'monthly') {
        key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`; 
        label = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); 
      } else if (viewMode === 'yearly') {
        key = dateObj.getFullYear().toString(); 
        label = key; 
      }

      if (!groupedData[key]) {
        groupedData[key] = { label, paid: 0, pending: 0 };
      }

      if (inv.status === 'PAID') groupedData[key].paid += (inv.grandTotal || 0);
      if (inv.status === 'SENT' || inv.status === 'OVERDUE') groupedData[key].pending += (inv.grandTotal || 0);
    });

    return Object.keys(groupedData).sort().map(key => groupedData[key]);
  };

  const chartData = generateChartData();

  const generateSalesData = () => {
    const itemsData: Record<string, { qty: number, revenue: number }> = {};
    let totalItemsSold = 0;

    filteredInvoices.forEach(inv => {
      // 🚀 FIX 1: Make sure we include OVERDUE invoices in the count!
      if (inv.status === 'PAID' || inv.status === 'SENT' || inv.status === 'OVERDUE') {
        const items = inv.items || []; 
        
        items.forEach((item: any) => {
          const desc = item.description?.trim() || 'Unknown Item';
          if (!itemsData[desc]) itemsData[desc] = { qty: 0, revenue: 0 };
          
          // 🚀 FIX 2: Force strict Number() conversion so it adds mathematically
          const qty = Number(item.quantity) || 0;
          const rev = Number(item.total) || 0;

          itemsData[desc].qty += qty;
          itemsData[desc].revenue += rev;
          totalItemsSold += qty;
        });
      }
    });

    const sortedItems = Object.keys(itemsData)
      .map(name => ({ name, ...itemsData[name] }))
      .sort((a, b) => b.revenue - a.revenue);

    return { sortedItems, totalItemsSold };
  };

  const { sortedItems, totalItemsSold } = generateSalesData();

  // 🚀 NEW: Comprehensive Financial Metrics
  const periodPaid = filteredInvoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  const periodPending = filteredInvoices.filter(i => i.status === 'SENT' || i.status === 'OVERDUE').reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  
  // Tax Liability: Any non-draft invoice in this period
  const taxLiability = filteredInvoices.filter(i => i.status !== 'DRAFT').reduce((sum, i) => sum + (i.taxTotal || 0), 0);
  
  // Inventory is absolute (not bound by date range)
  const inventoryValue = products.reduce((sum, p) => sum + (p.stockQuantity > 0 ? p.stockQuantity * p.price : 0), 0);


  if (loading) return <div className="p-8 text-gray-500 animate-pulse">Generating reports...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 print:bg-white print:p-0 text-slate-900">
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-container, #report-container * { visibility: visible; }
          #report-container { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      {/* Controls */}
      <div className="mb-8 print:hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
            <p className="text-sm text-slate-500 mt-1">Real-time insights into your revenue, receivables, and tax liabilities.</p>
          </div>
          <button 
            onClick={() => window.print()} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export as PDF
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">From</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" />
            <span className="text-sm font-medium text-slate-600 ml-2">To</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" />
          </div>
          
          <div className="w-px h-8 bg-slate-200 hidden md:block mx-2"></div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
            {(['daily', 'monthly', 'yearly'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md capitalize transition-colors ${viewMode === mode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Printable Area */}
      <div id="report-container" className="print:p-8">
        
        <div className="hidden print:block border-b border-slate-200 pb-6 mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900">Custom Financial & Sales Report</h1>
          <p className="text-slate-500 mt-2">
            Period: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
          </p>
        </div>

        {/* 🚀 UPGRADED: Beautified 4-Metric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm shadow-emerald-100/50 relative overflow-hidden group print:border-slate-300 print:shadow-none">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-16 h-16 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            </div>
            <p className="text-sm font-semibold text-emerald-600 mb-1 relative z-10">Total Revenue (Paid)</p>
            <h3 className="text-3xl font-bold text-slate-900 relative z-10">₹{periodPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm shadow-amber-100/50 relative overflow-hidden group print:border-slate-300 print:shadow-none">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-16 h-16 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-sm font-semibold text-amber-600 mb-1 relative z-10">Outstanding Receivables</p>
            <h3 className="text-3xl font-bold text-slate-900 relative z-10">₹{periodPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm shadow-rose-100/50 relative overflow-hidden group print:border-slate-300 print:shadow-none">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-16 h-16 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-4 8h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-sm font-semibold text-rose-600 mb-1 relative z-10">GST Liability</p>
            <h3 className="text-3xl font-bold text-slate-900 relative z-10">₹{taxLiability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm shadow-indigo-100/50 relative overflow-hidden group print:border-slate-300 print:shadow-none">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-16 h-16 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <p className="text-sm font-semibold text-indigo-600 mb-1 relative z-10">Inventory Asset Value</p>
            <h3 className="text-3xl font-bold text-slate-900 relative z-10">₹{inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>

        </div>

        {/* Charts */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 print:shadow-none print:border-slate-300">
          <h3 className="text-lg font-bold text-slate-900 mb-6 capitalize">{viewMode} Revenue Trend</h3>
          <div className="h-80 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {viewMode === 'daily' ? (
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Line type="monotone" name="Paid Revenue" dataKey="paid" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" name="Pending Revenue" dataKey="pending" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar name="Paid Revenue" dataKey="paid" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar name="Pending Revenue" dataKey="pending" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium">
                No revenue data found in this date range.
              </div>
            )}
          </div>
        </div>

        {/* Itemized Sales */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-slate-300">
          <div className="p-6 border-b border-slate-200 bg-slate-50/50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Itemized Sales Breakdown</h3>
                <p className="text-sm text-slate-500 mt-1">Top performing products and services in the selected period.</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Units Sold</p>
                <p className="text-lg font-bold text-indigo-600">{totalItemsSold}</p>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-sm">
                  <th className="px-6 py-4 font-semibold text-slate-600">Product / Service Description</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-right">Quantity Sold</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                    <td className="px-6 py-4 text-slate-600 text-right">{item.qty}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-right">₹{item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {sortedItems.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">No finalized sales found in this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="hidden print:block mt-16 text-center text-sm text-slate-400 border-t border-slate-200 pt-4">
          Generated via InvoiceOS • Confidential Financial Data
        </div>
      </div>
    </div>
  );
}