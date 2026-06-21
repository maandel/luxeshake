'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../lib/store/authStore';
import { useToast } from '../../../context/ToastContext';
import ConfirmModal from '../../../components/admin/ConfirmModal';

interface Category {
  id: string;
  name: string;
  display_name: string;
  sort_order: number;
  is_active: boolean;
}

interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  small_price: number;
  big_price: number;
  image_url: string | null;
  image_path: string | null;
  tag: string;
  sort_order: number;
  is_active: boolean;
}

export default function AdminProductsPage() {
  const { role } = useAuthStore();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'products' | 'categories'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCatId, setProdCatId] = useState('');
  const [prodSmallPrice, setProdSmallPrice] = useState(0);
  const [prodBigPrice, setProdBigPrice] = useState(0);
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodTag, setProdTag] = useState('Drink');
  const [prodSortOrder, setProdSortOrder] = useState(0);
  const [prodActive, setProdActive] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catDisplayName, setCatDisplayName] = useState('');
  const [catSortOrder, setCatSortOrder] = useState(0);
  const [catActive, setCatActive] = useState(true);
  const [savingCategory, setSavingCategory] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'product' | 'category' | null;
    targetId: string | null;
  }>({ isOpen: false, type: null, targetId: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodResp, catResp] = await Promise.all([
        api.get('/admin/products'),
        api.get('/admin/categories')
      ]);
      setProducts(prodResp.data || []);
      setCategories(catResp.data || []);
    } catch (err: any) {
      showToast('Failed to load catalog data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openNewProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdDesc('');
    setProdCatId(categories[0]?.id || '');
    setProdSmallPrice(0);
    setProdBigPrice(0);
    setProdImageUrl('');
    setProdTag('Drink');
    setProdSortOrder(products.length);
    setProdActive(true);
    setSelectedFile(null);
    setShowProductModal(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdDesc(p.description);
    setProdCatId(p.category_id);
    setProdSmallPrice(p.small_price);
    setProdBigPrice(p.big_price);
    setProdImageUrl(p.image_url || '');
    setProdTag(p.tag || 'Drink');
    setProdSortOrder(p.sort_order);
    setProdActive(p.is_active);
    setSelectedFile(null);
    setShowProductModal(true);
  };

  const openNewCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDisplayName('');
    setCatSortOrder(categories.length);
    setCatActive(true);
    setShowCategoryModal(true);
  };

  const openEditCategory = (c: Category) => {
    setEditingCategory(c);
    setCatName(c.name);
    setCatDisplayName(c.display_name);
    setCatSortOrder(c.sort_order);
    setCatActive(c.is_active);
    setShowCategoryModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodCatId) {
      showToast('Name and Category are required.', 'error');
      return;
    }
    setSavingProduct(true);
    try {
      const payload = {
        name: prodName,
        description: prodDesc,
        category_id: prodCatId,
        small_price: prodSmallPrice,
        big_price: prodBigPrice,
        image_url: prodImageUrl || null,
        image_path: editingProduct ? editingProduct.image_path : null,
        tag: prodTag,
        sort_order: prodSortOrder,
        is_active: prodActive
      };

      let product: Product;
      if (editingProduct) {
        const resp = await api.put(`/admin/products/${editingProduct.id}`, payload);
        product = resp.data;
        showToast('Product updated successfully.', 'success');
      } else {
        const resp = await api.post('/admin/products', payload);
        product = resp.data;
        showToast('Product created successfully.', 'success');
      }

      if (selectedFile) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        await api.post(`/admin/products/${product.id}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Product image uploaded.', 'success');
      }

      setShowProductModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save product.', 'error');
    } finally {
      setSavingProduct(false);
      setUploadingImage(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catDisplayName) {
      showToast('Name and display name are required.', 'error');
      return;
    }
    setSavingCategory(true);
    try {
      const payload = {
        name: catName.toLowerCase(),
        display_name: catDisplayName,
        sort_order: catSortOrder,
        is_active: catActive
      };

      if (editingCategory) {
        await api.put(`/admin/categories/${editingCategory.id}`, payload);
        showToast('Category updated.', 'success');
      } else {
        await api.post('/admin/categories', payload);
        showToast('Category created.', 'success');
      }
      setShowCategoryModal(false);
      fetchData();
    } catch (err: any) {
      showToast('Failed to save category.', 'error');
    } finally {
      setSavingCategory(false);
    }
  };

  const triggerDeleteProduct = (id: string) => {
    setConfirmModal({ isOpen: true, type: 'product', targetId: id });
  };

  const triggerDeleteCategory = (id: string) => {
    setConfirmModal({ isOpen: true, type: 'category', targetId: id });
  };

  const executeDelete = async () => {
    const { type, targetId } = confirmModal;
    if (!targetId || !type) return;
    setConfirmModal({ isOpen: false, type: null, targetId: null });

    if (type === 'product') {
      try {
        await api.delete(`/admin/products/${targetId}`);
        showToast('Product deactivated.', 'info');
        fetchData();
      } catch (err: any) {
        showToast('Deactivation failed.', 'error');
      }
    } else if (type === 'category') {
      try {
        await api.delete(`/admin/categories/${targetId}`);
        showToast('Category deactivated.', 'info');
        fetchData();
      } catch (err: any) {
        showToast('Deactivation failed.', 'error');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2.2rem', color: 'var(--gold-lt)', margin: 0 }}>
            Product Management
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Manage categories, product sizes, prices, and upload premium assets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setActiveSubTab('products')}
            className={activeSubTab === 'products' ? 'size-opt active' : 'size-opt'}
            style={{ padding: '0.5rem 1rem' }}
          >
            Products
          </button>
          <button
            onClick={() => setActiveSubTab('categories')}
            className={activeSubTab === 'categories' ? 'size-opt active' : 'size-opt'}
            style={{ padding: '0.5rem 1rem' }}
          >
            Categories
          </button>
        </div>
      </div>

      <div className="gold-rule"></div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        {activeSubTab === 'products' ? (
          <button onClick={openNewProduct} className="btn-gold" style={{ padding: '0.5rem 1.2rem', fontSize: '0.75rem' }}>
            + Add New Product
          </button>
        ) : (
          <button onClick={openNewCategory} className="btn-gold" style={{ padding: '0.5rem 1.2rem', fontSize: '0.75rem' }}>
            + Add Category
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
          <span className="spinner" style={{ width: '30px', height: '30px' }}></span>
        </div>
      ) : activeSubTab === 'products' ? (
        /* PRODUCTS LIST */
        <div style={{ background: 'rgba(62, 39, 35, 0.2)', border: '1px solid rgba(201, 150, 62, 0.15)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.2)', color: 'var(--gold-lt)' }}>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Image</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Name</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Category</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Small (₦)</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Large (₦)</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Order</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Active</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');
                  const cat = categories.find((c) => c.id === p.category_id);
                  const img = p.image_path ? `${BACKEND_URL}${p.image_path}` : (p.image_url || 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=400');
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.08)' }}>
                      <td style={{ padding: '0.8rem 0.5rem' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(201,150,62,0.1)' }}>
                          <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      </td>
                      <td style={{ padding: '0.8rem 0.5rem', fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: '0.8rem 0.5rem' }}>{cat?.display_name || 'Unassigned'}</td>
                      <td style={{ padding: '0.8rem 0.5rem' }}>₦{p.small_price.toLocaleString()}</td>
                      <td style={{ padding: '0.8rem 0.5rem' }}>₦{p.big_price.toLocaleString()}</td>
                      <td style={{ padding: '0.8rem 0.5rem' }}>{p.sort_order}</td>
                      <td style={{ padding: '0.8rem 0.5rem' }}>
                        <span style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '100px',
                          fontSize: '0.7rem',
                          background: p.is_active ? 'rgba(46, 125, 50, 0.2)' : 'rgba(139, 58, 42, 0.2)',
                          color: p.is_active ? '#81C784' : '#E57373'
                        }}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '0.8rem 0.5rem' }}>
                        <button onClick={() => openEditProduct(p)} className="btn-outline" style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem', marginRight: '0.5rem' }}>
                          Edit
                        </button>
                        {p.is_active && (
                          <button onClick={() => triggerDeleteProduct(p.id)} className="confirm-cancel-btn" style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem' }}>
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CATEGORIES LIST */
        <div style={{ background: 'rgba(62, 39, 35, 0.2)', border: '1px solid rgba(201, 150, 62, 0.15)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.2)', color: 'var(--gold-lt)' }}>
                  <th style={{ padding: '0.8rem 0.5rem' }}>System Name</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Display Name</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Sort Order</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Active</th>
                  <th style={{ padding: '0.8rem 0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(201, 150, 62, 0.08)' }}>
                    <td style={{ padding: '0.8rem 0.5rem', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>{c.display_name}</td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>{c.sort_order}</td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '100px',
                        fontSize: '0.7rem',
                        background: c.is_active ? 'rgba(46, 125, 50, 0.2)' : 'rgba(139, 58, 42, 0.2)',
                        color: c.is_active ? '#81C784' : '#E57373'
                      }}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '0.8rem 0.5rem' }}>
                      <button onClick={() => openEditCategory(c)} className="btn-outline" style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem', marginRight: '0.5rem' }}>
                        Edit
                      </button>
                      {c.is_active && (
                        <button onClick={() => triggerDeleteCategory(c.id)} className="confirm-cancel-btn" style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem' }}>
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRODUCT DIALOG FORM */}
      {showProductModal && (
        <div className="order-overlay open" style={{ zIndex: 900 }}>
          <div className="order-modal" style={{ maxWidth: '550px' }}>
            <div className="order-modal-head">
              <h3>{editingProduct ? 'Edit Product' : 'Create Product'}</h3>
              <button onClick={() => setShowProductModal(false)} className="cart-close">✕</button>
            </div>
            <form onSubmit={handleSaveProduct} className="order-modal-body">
              <div className="form-group">
                <label className="form-label">Drink Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <div className="fulfillment-select-wrap">
                    <select
                      className="fulfillment-select"
                      value={prodCatId}
                      onChange={(e) => setProdCatId(e.target.value)}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.display_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tag (e.g. Drink, Best Seller)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={prodTag}
                    onChange={(e) => setProdTag(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Sort Order</label>
                  <input
                    type="number"
                    className="form-input"
                    value={prodSortOrder}
                    onChange={(e) => setProdSortOrder(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Small Price (₦)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={prodSmallPrice}
                    onChange={(e) => setProdSmallPrice(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Large Price (₦)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={prodBigPrice}
                    onChange={(e) => setProdBigPrice(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Fallback Image URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://example.com/shake.jpg"
                  value={prodImageUrl}
                  onChange={(e) => setProdImageUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Upload Local Image Asset (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                  }}
                  style={{
                    display: 'block', fontSize: '0.8rem', color: 'var(--text-body)', marginTop: '0.3rem'
                  }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <input
                  type="checkbox"
                  id="prodActiveCheckbox"
                  checked={prodActive}
                  onChange={(e) => setProdActive(e.target.checked)}
                />
                <label htmlFor="prodActiveCheckbox" style={{ fontSize: '0.85rem', color: 'var(--cream)' }}>
                  Active and visible on public menu catalog
                </label>
              </div>

              <button type="submit" className="submit-order-btn" disabled={savingProduct || uploadingImage}>
                {(savingProduct || uploadingImage) && <span className="spinner"></span>}
                {editingProduct ? 'Save Product Changes' : 'Create Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY DIALOG FORM */}
      {showCategoryModal && (
        <div className="order-overlay open" style={{ zIndex: 900 }}>
          <div className="order-modal" style={{ maxWidth: '450px' }}>
            <div className="order-modal-head">
              <h3>{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
              <button onClick={() => setShowCategoryModal(false)} className="cart-close">✕</button>
            </div>
            <form onSubmit={handleSaveCategory} className="order-modal-body">
              <div className="form-group">
                <label className="form-label">System name (lowercase identifier)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. signature"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Signature Shakes"
                  value={catDisplayName}
                  onChange={(e) => setCatDisplayName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sort Order</label>
                <input
                  type="number"
                  className="form-input"
                  value={catSortOrder}
                  onChange={(e) => setCatSortOrder(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <input
                  type="checkbox"
                  id="catActiveCheckbox"
                  checked={catActive}
                  onChange={(e) => setCatActive(e.target.checked)}
                />
                <label htmlFor="catActiveCheckbox" style={{ fontSize: '0.85rem', color: 'var(--cream)' }}>
                  Active category
                </label>
              </div>

              <button type="submit" className="submit-order-btn" disabled={savingCategory}>
                {savingCategory && <span className="spinner"></span>}
                {editingCategory ? 'Save Category' : 'Create Category'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.type === 'product' ? 'Deactivate Product' : 'Deactivate Category'}
        message={`Are you sure you want to deactivate this ${confirmModal.type}? It will no longer be visible to customers on the public menu.`}
        confirmText="Deactivate"
        isDangerous={true}
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, type: null, targetId: null })}
      />
    </div>
  );
}
