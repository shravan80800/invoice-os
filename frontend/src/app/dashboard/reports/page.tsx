'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend 
} from 'recharts';

export default function ReportsPage() {
  const { getToken, orgId } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🚀 Safe Date Defaults (Last 30 Days)
  const defaultEnd = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 30);

  // Stored as YYYY-MM-DD for the HTML inputs
  const [startDate, setStartDate] = useState(defaultStart.toLocaleDateString('en-CA'));
  const [endDate, setEndDate] = useState(defaultEnd.toLocaleDateString('en-CA')); 
  const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'yearly'>('daily');

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };

    if (orgId) fetchInvoices();
  }, [orgId, getToken]);

  // ==========================================
  // 🚀 ROBUST TIMEZONE-SAFE ENGINE
  // ==========================================
  
  // 1. Convert strings to real Dates spanning the FULL days (00:00:00 to 23:59:59)
  const startObj = new Date(startDate);
  startObj.setHours(0, 0, 0, 0);
  
  const endObj = new Date(endDate);
  endObj.setHours(23, 59, 59, 999);

  // 2. Filter using real timestamp math
  const filteredInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.createdAt);
    return invDate >= startObj && invDate <= endObj;
  });

  // 3. Generate Chart Data based on Daily / Monthly / Yearly selection
  const generateChartData = () => {
    const groupedData: Record<string, { label: string, paid: number, pending: number }> = {};

    filteredInvoices.forEach(inv => {
      const dateObj = new Date(inv.createdAt);
      let key = '';
      let label = '';

      // Use local timezone strings to prevent UTC shift bugs
      if (viewMode === 'daily') {
        key = dateObj.toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
        label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // 'Jan 15'
      } else if (viewMode === 'monthly') {
        key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`; // '2026-01'
        label = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); // 'Jan 2026'
      } else if (viewMode === 'yearly') {
        key = dateObj.getFullYear().toString(); // '2026'
        label = key; 
      }

      if (!groupedData[key]) {
        groupedData[key] = { label, paid: 0, pending: 0 };
      }

      if (inv.status === 'PAID') groupedData[key].paid += (inv.grandTotal || 0);
      if (inv.status === 'SENT' || inv.status === 'OVERDUE') groupedData[key].pending += (inv.grandTotal || 0);
    });

    // Sort chronologically by the generated keys
    return Object.keys(groupedData)
      .sort()
      .map(key => groupedData[key]);
  };

  const chartData = generateChartData();

  // 4. Extract Detailed Item Sales securely
  const generateSalesData = () => {
    const itemsData: Record<string, { qty: number, revenue: number }> = {};
    let totalItemsSold = 0;

    filteredInvoices.forEach(inv => {
      // Only count items from finalized invoices
      if (inv.status === 'PAID' || inv.status === 'SENT') {
        // Safe check in case backend failed to include items
        const items = inv.items || []; 
        
        items.forEach((item: any) => {
          const desc = item.description?.trim() || 'Unknown Item';
          if (!itemsData[desc]) itemsData[desc] = { qty: 0, revenue: 0 };
          
          itemsData[desc].qty += (item.quantity || 0);
          itemsData[desc].revenue += (item.total || 0);
          totalItemsSold += (item.quantity || 0);
        });
      }
    });

    const sortedItems = Object.keys(itemsData)
      .map(name => ({ name, ...itemsData[name] }))
      .sort((a, b) => b.revenue - a.revenue);

    return { sortedItems, totalItemsSold };
  };

  const { sortedItems, totalItemsSold } = generateSalesData();

  // Summary Metrics
  const periodPaid = filteredInvoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  const periodPending = filteredInvoices.filter(i => i.status === 'SENT' || i.status === 'OVERDUE').reduce((sum, i) => sum + (i.grandTotal || 0), 0);

  if (loading) return <div className="p-8 text-gray-500">Generating reports...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 print:bg-white print:p-0 text-zinc-900">
      
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
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <button 
            onClick={() => window.print()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export as PDF
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">From</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-sm font-medium text-gray-600 ml-2">To</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          
          <div className="w-px h-8 bg-gray-200 hidden md:block mx-2"></div>

          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(['daily', 'monthly', 'yearly'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${viewMode === mode ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Printable Area */}
      <div id="report-container" className="print:p-8">
        
        <div className="hidden print:block border-b border-gray-200 pb-6 mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Custom Financial & Sales Report</h1>
          <p className="text-gray-500 mt-2">
            Period: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:shadow-none print:border-gray-300">
            <p className="text-sm font-medium text-gray-500">Collected Revenue</p>
            <h2 className="text-3xl font-bold text-green-600 mt-1">₹{periodPaid.toFixed(2)}</h2>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:shadow-none print:border-gray-300">
            <p className="text-sm font-medium text-gray-500">Pending Collection</p>
            <h2 className="text-3xl font-bold text-blue-600 mt-1">₹{periodPending.toFixed(2)}</h2>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:shadow-none print:border-gray-300">
            <p className="text-sm font-medium text-gray-500">Total Items / Services Sold</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">{totalItemsSold}</h2>
          </div>
        </div>

        {/* Charts */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 print:shadow-none print:border-gray-300">
          <h3 className="text-lg font-bold text-gray-900 mb-6 capitalize">{viewMode} Revenue Trend</h3>
          <div className="h-80 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {viewMode === 'daily' ? (
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" />
                    <Line type="monotone" name="Paid" dataKey="paid" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" name="Pending" dataKey="pending" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" />
                    <Bar name="Paid" dataKey="paid" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    <Bar name="Pending" dataKey="pending" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                No invoices found in this date range.
              </div>
            )}
          </div>
        </div>

        {/* Itemized Sales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-gray-300">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900">Itemized Sales Breakdown</h3>
            <p className="text-sm text-gray-500 mt-1">Top performing products and services in the selected period (excludes Drafts).</p>
          </div>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200 text-sm">
                <th className="p-4 font-semibold text-gray-600">Product / Service Description</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Quantity Sold</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{item.name}</td>
                  <td className="p-4 text-gray-600 text-right">{item.qty}</td>
                  <td className="p-4 font-bold text-gray-900 text-right">₹{item.revenue.toFixed(2)}</td>
                </tr>
              ))}
              {sortedItems.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">No finalized sales found in this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="hidden print:block mt-16 text-center text-sm text-gray-400 border-t border-gray-200 pt-4">
          Generated via InvoiceOS • Confidential Financial Data
        </div>
      </div>
    </div>
  );
}