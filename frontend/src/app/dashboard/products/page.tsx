'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function ProductsPage() {
  const { getToken, orgId } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null); // 🚀 NEW: Tracks what we are editing
  const [formData, setFormData] = useState({
    name: '', description: '', sku: '', price: '', stockQuantity: '', taxRate: '', hsnCode: ''
  });

  const fetchProducts = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-workspace-id': orgId || '',
        },
        cache: 'no-store'
      });
      if (res.ok) setProducts(await res.json());
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) fetchProducts();
  }, [orgId, getToken]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 🚀 NEW: Opens modal in Edit mode
  const handleEditClick = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      sku: product.sku || '',
      price: product.price,
      stockQuantity: product.stockQuantity,
      taxRate: product.taxRate || '',
      hsnCode: product.hsnCode || ''
    });
    setIsModalOpen(true);
  };

  // 🚀 NEW: Deletes a product
  const handleDeleteClick = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-workspace-id': orgId || '',
        }
      });
      if (res.ok) fetchProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = await getToken();
      // Dynamically switch between POST (new) and PUT (update)
      const url = editingProduct 
        ? `${process.env.NEXT_PUBLIC_API_URL}/products/${editingProduct.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/products`;
      
      const res = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-workspace-id': orgId || '',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData({ name: '', description: '', sku: '', price: '', stockQuantity: '', taxRate: '', hsnCode: '' });
        fetchProducts();
      }
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🚀 NEW: Professional Stock Badge UI Logic
  const getStockBadge = (qty: number) => {
    if (qty <= 0) return <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold">Out of Stock</span>;
    if (qty < 5) return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">Low Stock ({qty})</span>;
    return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">In Stock ({qty})</span>;
  };

  return (
    <div className="p-8 relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products & Services</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your inventory, pricing, and stock levels.</p>
        </div>
        <button 
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', description: '', sku: '', price: '', stockQuantity: '', taxRate: '', hsnCode: '' });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Item
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Product / Service</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">SKU / HSN</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Price</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">Loading inventory...</td></tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">No items found</h3>
                    <p className="text-sm text-slate-500 mt-1">Get started by adding your first product or service.</p>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((product: any) => (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{product.name}</div>
                    {product.description && <div className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-xs">{product.description}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-700">{product.sku || '--'}</div>
                    {product.hsnCode && <div className="text-xs text-slate-400 mt-0.5">HSN: {product.hsnCode}</div>}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">₹{parseFloat(product.price).toLocaleString()}</td>
                  <td className="px-6 py-4">{getStockBadge(product.stockQuantity)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditClick(product)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Edit</button>
                      <button onClick={() => handleDeleteClick(product.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
            
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-slate-900">
                {editingProduct ? 'Edit Item Details' : 'Add New Item'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-slate-50/50">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Product/Service Name *</label>
                <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all shadow-sm bg-white" placeholder="e.g. Website Maintenance Retainer" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all shadow-sm bg-white" placeholder="Detailed description for the invoice..." rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Price (₹) *</label>
                  <input required type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm bg-white font-medium text-slate-900" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Stock Available</label>
                  <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm bg-white font-medium text-slate-900" placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">SKU / Barcode</label>
                  <input name="sku" value={formData.sku} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm bg-white uppercase" placeholder="e.g. WEB-01" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">HSN / SAC Code</label>
                  <input name="hsnCode" value={formData.hsnCode} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm bg-white" placeholder="e.g. 998314" />
                </div>
              </div>

              <div className="pt-5 flex justify-end gap-3 border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-700 font-semibold hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2">
                  {isSubmitting ? 'Saving...' : (editingProduct ? 'Save Changes' : 'Create Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}