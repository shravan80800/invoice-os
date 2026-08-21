'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

interface CreateInvoiceFormProps {
  existingInvoice?: any;
  onSuccess: () => void;
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
  
  // --- CLIENT & PRODUCT STATES ---
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]); 
  const [loadingData, setLoadingData] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState(existingInvoice?.customerId || '');
  
  // 🚀 UPDATED: Inline Client Creation States now include GSTIN and State
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', address: '', taxId: '', gstin: '', state: '' });

  // --- FORM STATES ---
  const [invoiceNumber, setInvoiceNumber] = useState(existingInvoice?.invoiceNumber || `INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [issueDate, setIssueDate] = useState(existingInvoice?.issueDate ? new Date(existingInvoice.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(existingInvoice?.dueDate ? new Date(existingInvoice.dueDate).toISOString().split('T')[0] : new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]);
  const [status, setStatus] = useState(existingInvoice?.status || 'DRAFT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- CURRENCY STATES ---
  const [currency, setCurrency] = useState(existingInvoice?.currency || 'INR');
  const [isCustomCurrency, setIsCustomCurrency] = useState(false);
  
  const activeSymbol = CURRENCIES.find(c => c.code === currency)?.symbol 
    || (currency && currency !== 'CUSTOM' ? `${currency} ` : '');

  // --- LINE ITEMS & TAX STATES ---
  const [items, setItems] = useState<any[]>(
    existingInvoice?.items?.length > 0 
      ? existingInvoice.items 
      : [{ id: crypto.randomUUID(), productId: '', description: '', quantity: 1, price: 0 }]
  );

  const initialTaxRate = existingInvoice && existingInvoice.subTotal > 0
    ? (existingInvoice.taxTotal / existingInvoice.subTotal) * 100
    : 18;
  const [taxRate, setTaxRate] = useState<number>(initialTaxRate);
  const [totals, setTotals] = useState({ subTotal: 0, taxTotal: 0, grandTotal: 0 });

  // --- EFFECTS ---

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = await getToken();
        const headers = { 'Authorization': `Bearer ${token}`, 'x-workspace-id': orgId || '' };
        
        const [clientsRes, productsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers`, { headers, cache: 'no-store' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, { headers, cache: 'no-store' })
        ]);

        if (clientsRes.ok) setClients(await clientsRes.json());
        if (productsRes.ok) setProducts(await productsRes.json());

      } catch (error) {
        console.error('Failed to fetch initial data', error);
      } finally {
        setLoadingData(false);
      }
    };
    if (orgId) fetchInitialData();
  }, [orgId, getToken]);

  useEffect(() => {
    if (!existingInvoice) {
      const savedCurrency = localStorage.getItem('invoiceos_pref_currency');
      if (savedCurrency) {
        setCurrency(savedCurrency);
        if (!CURRENCIES.some(c => c.code === savedCurrency)) {
          setIsCustomCurrency(true);
        }
      }
    } else {
      if (!CURRENCIES.some(c => c.code === existingInvoice.currency)) {
        setIsCustomCurrency(true);
      }
    }
  }, [existingInvoice]);

  useEffect(() => {
    const subTotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price || 0)), 0);
    const taxTotal = subTotal * (taxRate / 100); 
    const grandTotal = subTotal + taxTotal;
    setTotals({ subTotal, taxTotal, grandTotal });
  }, [items, taxRate]);

  // --- HANDLERS ---

  const handleAddItem = () => {
    setItems([...items, { id: crypto.randomUUID(), productId: '', description: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleProductSelect = (itemId: string, selectedProductId: string) => {
    if (selectedProductId === 'custom') {
       setItems(items.map(item => item.id === itemId ? { ...item, productId: '' } : item));
       return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (product) {
      setItems(items.map(item => item.id === itemId ? { 
        ...item, 
        productId: product.id, 
        description: product.description ? `${product.name} - ${product.description}` : product.name,
        price: product.price 
      } : item));
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.name) return alert("Client name is required");
    setIsSavingClient(true);
    
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, 
          'x-workspace-id': orgId || '' 
        },
        body: JSON.stringify(newClient),
      });

      if (response.ok) {
        const createdClient = await response.json();
        setClients([createdClient, ...clients]); 
        setSelectedCustomerId(createdClient.id); 
        setIsAddingClient(false); 
        // 🚀 UPDATED: Reset all fields including new GST properties
        setNewClient({ name: '', email: '', address: '', taxId: '', gstin: '', state: '' }); 
      } else {
        alert("Failed to save client.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingClient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return alert('Please select or create a client.');
    if (isAddingClient) return alert('Please save your new client first.');
    
    setIsSubmitting(true);
    localStorage.setItem('invoiceos_pref_currency', currency || 'INR');
    
    const payload = {
      invoiceNumber,
      customerId: selectedCustomerId,
      issueDate: new Date(issueDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      status,
      currency,
      subTotal: totals.subTotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      items: items.map(i => ({
        productId: i.productId || null, 
        description: i.description,
        quantity: Number(i.quantity),
        price: Number(i.price),
        total: Number(i.quantity) * Number(i.price)
      }))
    };

    try {
      const token = await getToken();
      const url = existingInvoice 
        ? `${process.env.NEXT_PUBLIC_API_URL}/invoices/${existingInvoice.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/invoices`;
        
      const response = await fetch(url, {
        method: existingInvoice ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, 
          'x-workspace-id': orgId || '' 
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const err = await response.json();
        alert(`Error: ${err.message || 'Failed to save invoice'}`);
      }
    } catch (error) {
      console.error('Failed to submit invoice', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClient = clients.find(c => c.id === selectedCustomerId);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      {/* 1. Meta & Client Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-100">
        
        {/* Left Column: Client Management */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-semibold text-slate-700">Client Details *</label>
            {!isAddingClient && (
              <button 
                type="button" 
                onClick={() => setIsAddingClient(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                New Client
              </button>
            )}
          </div>

          {isAddingClient ? (
            <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm space-y-3 ring-1 ring-indigo-500/10">
              <input 
                type="text" placeholder="Client / Company Name *" required autoFocus
                value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <input 
                type="email" placeholder="Email Address"
                value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <textarea 
                placeholder="Billing Address" rows={2}
                value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              
              {/* 🚀 NEW: GSTIN and State Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" placeholder="GSTIN (Optional)"
                  value={newClient.gstin} onChange={e => setNewClient({...newClient, gstin: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                />
                <input 
                  type="text" placeholder="State (e.g., Maharashtra)"
                  value={newClient.state} onChange={e => setNewClient({...newClient, state: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" onClick={() => setIsAddingClient(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="button" onClick={handleCreateClient} disabled={isSavingClient}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-70"
                >
                  {isSavingClient ? 'Saving...' : 'Save & Select'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {loadingData ? (
                <div className="w-full h-10 bg-slate-200 animate-pulse rounded-lg"></div>
              ) : (
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-900"
                >
                  <option value="" disabled>Choose a client...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              )}
              
              {selectedClient && (
                <div className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative group flex flex-col gap-0.5">
                  <span className="font-semibold text-slate-900 block">{selectedClient.name}</span>
                  {selectedClient.email && <span className="block">{selectedClient.email}</span>}
                  {selectedClient.address && <span className="block text-slate-500">{selectedClient.address}</span>}
                  {/* 🚀 NEW: Preview GST and State in the card */}
                  {(selectedClient.gstin || selectedClient.state) && (
                    <div className="mt-1 pt-1 border-t border-slate-100 text-xs flex gap-3 text-slate-500">
                      {selectedClient.gstin && <span><strong>GSTIN:</strong> {selectedClient.gstin}</span>}
                      {selectedClient.state && <span><strong>State:</strong> {selectedClient.state}</span>}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Invoice Details */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Invoice Number *</label>
              <input required type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-900" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Currency</label>
              {isCustomCurrency ? (
                <div className="flex gap-2">
                  <input
                    autoFocus required type="text" value={currency} placeholder="e.g. KES"
                    onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white uppercase text-slate-900 font-medium"
                  />
                  <button 
                    type="button" onClick={() => { setIsCustomCurrency(false); setCurrency('INR'); }}
                    className="px-3 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 border border-slate-200 bg-white rounded-lg transition-colors"
                  >
                    Back
                  </button>
                </div>
              ) : (
                <select
                  value={currency}
                  onChange={(e) => {
                    if (e.target.value === 'CUSTOM') { setIsCustomCurrency(true); setCurrency(''); } 
                    else { setCurrency(e.target.value); }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-slate-900"
                >
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                  <option value="CUSTOM">Type custom...</option>
                </select>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Issue Date *</label>
              <input required type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date *</label>
              <input required type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-semibold text-slate-700">
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Line Items Builder */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-3">Line Items</h3>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          
          <div className="hidden md:grid grid-cols-12 gap-4 bg-slate-50 px-4 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
            <div className="col-span-6">Product & Description</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">Total</div>
          </div>
          
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-3 items-start group hover:bg-slate-50 transition-colors">
                
                <div className="col-span-1 md:col-span-6 flex flex-col gap-2">
                  <select 
                    value={item.productId || 'custom'}
                    onChange={(e) => handleProductSelect(item.id, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 text-sm bg-white font-medium shadow-sm"
                  >
                    <option value="custom">Custom Item (Type manually)</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {activeSymbol}{p.price} {p.stockQuantity > 0 ? `(${p.stockQuantity} in stock)` : '(Out of stock)'}
                      </option>
                    ))}
                  </select>
                  
                  <input 
                    required 
                    type="text" 
                    placeholder="Specific details or custom description..." 
                    value={item.description} 
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 text-sm bg-slate-50 focus:bg-white transition-colors" 
                  />
                </div>

                <div className="col-span-1 md:col-span-2 mt-1">
                  <div className="flex items-center md:justify-end gap-2">
                    <span className="md:hidden text-sm font-medium text-slate-500">Qty:</span>
                    <input required type="number" min="1" step="1" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} className="w-full md:w-20 px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-right text-slate-900 font-medium" />
                  </div>
                </div>
                
                <div className="col-span-1 md:col-span-2 mt-1">
                  <div className="flex items-center md:justify-end gap-2 relative">
                    <span className="md:hidden text-sm font-medium text-slate-500">Price:</span>
                    <div className="relative w-full md:w-28">
                      <span className="absolute left-3 top-2.5 text-slate-400 text-sm">{activeSymbol}</span>
                      <input required type="number" min="0" step="0.01" value={item.price} onChange={(e) => updateItem(item.id, 'price', e.target.value)} className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-right text-slate-900 font-medium" />
                    </div>
                  </div>
                </div>
                
                <div className="col-span-1 md:col-span-2 flex justify-between items-center md:justify-end mt-1">
                  <span className="md:hidden text-sm font-medium text-slate-500">Total:</span>
                  <span className="font-semibold text-slate-900 px-3 py-2">{activeSymbol}{(Number(item.quantity) * Number(item.price)).toFixed(2)}</span>
                  
                  <button type="button" onClick={() => handleRemoveItem(item.id)} className={`ml-1 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ${items.length > 1 ? 'opacity-100 md:opacity-0 group-hover:opacity-100' : 'invisible'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 bg-white border-t border-slate-100">
            <button type="button" onClick={handleAddItem} className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add another item
            </button>
          </div>
        </div>
      </div>

      {/* 3. Totals & Submit */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 pt-6 border-t border-slate-200">
        
        {/* Tax & Totals Box */}
        <div className="w-full md:w-72 space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200 ml-auto">
          <div className="flex justify-between items-center text-sm font-medium text-slate-600">
            <span>Subtotal</span>
            <span className="text-slate-900">{activeSymbol}{totals.subTotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <span>Tax Rate (%)</span>
              <input 
                type="number" min="0" step="0.1" value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-center bg-white text-slate-900"
              />
            </div>
            <span className="text-slate-900">{activeSymbol}{totals.taxTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-base font-bold text-slate-900 pt-3 border-t border-slate-200">
            <span>Grand Total</span>
            <span className="text-indigo-600">{activeSymbol}{totals.grandTotal.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="w-full md:w-auto flex gap-3">
          <button type="button" onClick={() => onSuccess()} className="flex-1 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            ) : existingInvoice ? 'Update Invoice' : 'Save Invoice'}
          </button>
        </div>
      </div>
    </form>
  );
}