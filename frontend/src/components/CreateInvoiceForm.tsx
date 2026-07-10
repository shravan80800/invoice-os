'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

interface CreateInvoiceFormProps {
  existingInvoice?: any;
  onSuccess?: () => void; // Used to close the modal and refresh the table
}

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (INR)' },
  { code: 'USD', symbol: '$', label: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP)' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar (AUD)' },
];

export default function CreateInvoiceForm({ existingInvoice, onSuccess }: CreateInvoiceFormProps) {
  const { getToken, orgId } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const isEditing = !!existingInvoice;

  // 🚀 FIXED: Added state to safely track when the user is typing a custom currency
  const [isCustomCurrency, setIsCustomCurrency] = useState(false);

  const [formData, setFormData] = useState({
    customerName: existingInvoice?.customer?.name || '',
    customerEmail: existingInvoice?.customer?.email || '',
    invoiceNumber: existingInvoice?.invoiceNumber || `INV-${Math.floor(Math.random() * 10000)}`,
    dueDate: existingInvoice?.dueDate 
      ? new Date(existingInvoice.dueDate).toISOString().split('T')[0] 
      : new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    currency: existingInvoice?.currency || 'INR',
  });

  // 🚀 NEW: Load remembered currency from previous sessions and trigger custom mode if needed
  useEffect(() => {
    if (!existingInvoice) {
      const savedCurrency = localStorage.getItem('invoiceos_pref_currency');
      if (savedCurrency) {
        setFormData(prev => ({ ...prev, currency: savedCurrency }));
        // If the saved currency is not in the standard list, show the custom input box
        if (!CURRENCIES.some(c => c.code === savedCurrency)) {
          setIsCustomCurrency(true);
        }
      }
    } else {
      // Also check if we are editing an invoice that already has a custom currency
      if (!CURRENCIES.some(c => c.code === existingInvoice.currency)) {
        setIsCustomCurrency(true);
      }
    }
  }, [existingInvoice]);

  const [items, setItems] = useState(
    existingInvoice?.items?.length > 0
      ? existingInvoice.items.map((i: any) => ({
          description: i.description,
          quantity: i.quantity,
          price: i.price,
        }))
      : [{ description: '', quantity: 1, price: 0 }]
  );

  const initialTaxRate = existingInvoice && existingInvoice.subTotal > 0
    ? (existingInvoice.taxTotal / existingInvoice.subTotal) * 100
    : 18;
  const [taxRate, setTaxRate] = useState<number>(initialTaxRate);
  const [totals, setTotals] = useState({ subTotal: 0, taxTotal: 0, grandTotal: 0 });

  // 🚀 UPDATED: Safeguard to ensure "CUSTOM" never accidentally shows up as a symbol
  const activeSymbol = CURRENCIES.find(c => c.code === formData.currency)?.symbol 
    || (formData.currency && formData.currency !== 'CUSTOM' ? `${formData.currency} ` : '');

  useEffect(() => {
    const subTotal = items.reduce((sum: number, item: any) => sum + (item.quantity * (item.price || 0)), 0);
    const taxTotal = subTotal * (taxRate / 100); 
    const grandTotal = subTotal + taxTotal;
    
    setTotals({ subTotal, taxTotal, grandTotal });
  }, [items, taxRate]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_: any, i: number) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 🚀 NEW: Save their currency choice to their browser for next time
    localStorage.setItem('invoiceos_pref_currency', formData.currency || 'INR');

    try {
      const token = await getToken();
      const url = isEditing 
  ? `${process.env.NEXT_PUBLIC_API_URL}/invoices/${existingInvoice.id}`
  : `${process.env.NEXT_PUBLIC_API_URL}/invoices`;

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-workspace-id': orgId || '',
        },
        body: JSON.stringify({
          ...formData,
          ...totals,
          items, 
        }),
      });

      if (response.ok) {
        if (onSuccess) {
          onSuccess(); 
        } else {
          window.location.reload(); 
        }
      }
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} invoice:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-zinc-900">
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
          <input 
            required 
            type="text" 
            value={formData.customerName}
            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="Acme Corp"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
          <input 
            required 
            type="email" 
            value={formData.customerEmail}
            onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="billing@acme.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
          <input 
            required 
            type="text" 
            value={formData.invoiceNumber}
            onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input 
              required 
              type="date" 
              value={formData.dueDate}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            {/* 🚀 FIXED: Condition based on isCustomCurrency boolean, allowing typing without glitching out */}
            {isCustomCurrency ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  required
                  type="text"
                  value={formData.currency}
                  placeholder="e.g. KES"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white uppercase"
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                />
                <button 
                  type="button" 
                  onClick={() => {
                    setIsCustomCurrency(false);
                    setFormData({ ...formData, currency: 'INR' });
                  }}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-300 rounded-lg"
                >
                  Back
                </button>
              </div>
            ) : (
              <select
                value={formData.currency}
                onChange={(e) => {
                  if (e.target.value === 'CUSTOM') {
                    setIsCustomCurrency(true);
                    setFormData({ ...formData, currency: '' });
                  } else {
                    setFormData({ ...formData, currency: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                ))}
                <option value="CUSTOM">Type custom...</option>
              </select>
            )}
          </div>
        </div>
      </div>

      <hr className="border-gray-200" />

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Line Items</h3>
        <div className="space-y-3">
          {items.map((item: any, index: number) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="flex-1">
                <input 
                  required 
                  type="text" 
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="Item description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div className="w-20">
                <input 
                  required 
                  type="number" 
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                  placeholder="Qty"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              
              <div className="w-32 relative">
                <span className="absolute left-3 top-2 text-gray-500 text-sm">{activeSymbol}</span>
                <input 
                  required 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                  placeholder="Price"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>

              {items.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => handleRemoveItem(index)} 
                  className="p-2 mt-0.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        
        <button 
          type="button" 
          onClick={handleAddItem} 
          className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center"
        >
          + Add Another Item
        </button>
      </div>

      <hr className="border-gray-200" />

      <div className="flex justify-end">
        <div className="w-72 space-y-3 text-sm">
          
          <div className="flex justify-between items-center text-gray-600">
            <span>Subtotal</span>
            <span>{activeSymbol}{totals.subTotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center text-gray-600">
            <div className="flex items-center gap-2">
              <span>Tax Rate (%)</span>
              <input 
                type="number"
                min="0"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 text-center"
              />
            </div>
            <span>{activeSymbol}{totals.taxTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
            <span>Total Due</span>
            <span>{activeSymbol}{totals.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading 
          ? (isEditing ? 'Updating Invoice...' : 'Creating Invoice...') 
          : (isEditing ? 'Update Invoice' : 'Create Invoice')}
      </button>
    </form>
  );
}