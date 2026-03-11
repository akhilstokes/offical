import React, { useState, useEffect } from 'react';

const ManagerStock = () => {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    productName: '',
    quantity: 0,
    unit: 'litre',
    type: 'in'
  });
  const [editForm, setEditForm] = useState({
    quantity: 0
  });

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  // Validate number input - only positive numbers allowed
  const validateNumberInput = (value, min = 0) => {
    if (value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num) || num < min) return '';
    return value;
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE}/api/stock/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStock(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load stock data');
      }
    } catch (err) {
      console.error('Error fetching stock:', err);
      setError('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.productName || !form.quantity) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate quantity range
    if (form.quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (form.quantity > 10000) {
      setError('Quantity cannot exceed 10,000');
      return;
    }

    try {
      // Convert quantity based on transaction type
      const quantityChange = form.type === 'in' ? form.quantity : -form.quantity;
      
      // First, try to find if the product exists
      const existingProduct = stock.find(item => 
        item.productName.toLowerCase() === form.productName.toLowerCase()
      );

      let response;
      
      if (existingProduct) {
        // Update existing product using PUT /api/stock/items/:id
        response = await fetch(`${API_BASE}/api/stock/items/${existingProduct._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            quantityInLiters: Math.max(0, existingProduct.quantityInLiters + quantityChange)
          })
        });
      } else {
        // Create new product with initial quantity
        response = await fetch(`${API_BASE}/api/stock/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            productName: form.productName,
            quantityInLiters: Math.max(0, quantityChange)
          })
        });
      }

      if (response.ok) {
        setMessage(`Stock ${existingProduct ? 'updated' : 'created'} successfully`);
        setShowAddForm(false);
        setForm({ productName: '', quantity: 0, unit: 'litre', type: 'in' });
        setError('');
        await fetchStock();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to update stock');
      }
    } catch (err) {
      console.error('Error updating stock:', err);
      setError('Failed to update stock');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setEditForm({ quantity: item.quantityInLiters });
    setShowEditForm(true);
    setError('');
    setMessage('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editForm.quantity || editForm.quantity < 0) {
      setError('Quantity must be 0 or greater');
      return;
    }

    if (editForm.quantity > 10000) {
      setError('Quantity cannot exceed 10,000');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/stock/items/${editingItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quantityInLiters: editForm.quantity
        })
      });

      if (response.ok) {
        setMessage('Stock updated successfully');
        setShowEditForm(false);
        setEditingItem(null);
        setEditForm({ quantity: 0 });
        setError('');
        await fetchStock();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to update stock');
      }
    } catch (err) {
      console.error('Error updating stock:', err);
      setError('Failed to update stock');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>
          Stock Management
        </h1>
        <p style={{ color: '#6b7280', fontSize: 16 }}>
          Monitor and manage inventory levels
        </p>
      </div>

      {error && (
        <div style={{
          padding: 12,
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 6,
          color: '#dc2626',
          marginBottom: 16
        }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{
          padding: 12,
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 6,
          color: '#16a34a',
          marginBottom: 16
        }}>
          {message}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          Add Stock Entry
        </button>
        <button
          onClick={fetchStock}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          Refresh
        </button>
      </div>

      {/* Add Stock Form */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 24,
            maxWidth: 500,
            width: '90%'
          }}>
            <h3 style={{ marginBottom: 20, fontSize: 20, fontWeight: 600 }}>
              Add Stock Entry
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  Product Name *
                </label>
                {stock.length > 0 && (
                  <select
                    value={form.productName}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '__new__') {
                        setForm(prev => ({ ...prev, productName: '' }));
                      } else {
                        setForm(prev => ({ ...prev, productName: value }));
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14,
                      marginBottom: 8
                    }}
                  >
                    <option value="">Select existing product...</option>
                    {stock.map(item => (
                      <option key={item._id} value={item.productName}>
                        {item.productName} (Current: {item.quantityInLiters.toFixed(2)} L)
                      </option>
                    ))}
                    <option value="__new__">+ Add New Product</option>
                  </select>
                )}
                <input
                  type="text"
                  value={form.productName}
                  onChange={(e) => setForm(prev => ({ ...prev, productName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="Or enter new product name"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => {
                      const validated = validateNumberInput(e.target.value, 0);
                      if (validated === '' || parseFloat(validated) <= 10000) {
                        setForm(prev => ({ ...prev, quantity: validated === '' ? 0 : parseFloat(validated) }));
                        setError('');
                      } else {
                        setError('Quantity cannot exceed 10,000');
                      }
                    }}
                    min="0"
                    max="10000"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                    placeholder="Max: 10,000"
                    required
                  />
                  <small style={{ color: '#6b7280', fontSize: 12, marginTop: 4, display: 'block' }}>
                    Maximum: 10,000
                  </small>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                    Unit
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm(prev => ({ ...prev, unit: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 14
                    }}
                  >
                    <option value="litre">Litre</option>
                    <option value="kg">Kilogram</option>
                    <option value="piece">Piece</option>
                    <option value="box">Box</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  Transaction Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                >
                  <option value="in">Stock In</option>
                  <option value="out">Stock Out</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Stock Form */}
      {showEditForm && editingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 24,
            maxWidth: 500,
            width: '90%'
          }}>
            <h3 style={{ marginBottom: 8, fontSize: 20, fontWeight: 600 }}>
              Edit Stock Quantity
            </h3>
            <p style={{ marginBottom: 20, fontSize: 14, color: '#6b7280' }}>
              Product: <strong>{editingItem.productName}</strong>
            </p>
            
            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  Current Quantity
                </label>
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: 6,
                  fontSize: 16,
                  fontFamily: 'monospace',
                  color: '#374151',
                  marginBottom: 16
                }}>
                  {editingItem.quantityInLiters.toFixed(2)} Litres
                </div>

                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  New Quantity *
                </label>
                <input
                  type="number"
                  value={editForm.quantity}
                  onChange={(e) => {
                    const validated = validateNumberInput(e.target.value, 0);
                    if (validated === '' || parseFloat(validated) <= 10000) {
                      setEditForm({ quantity: validated === '' ? 0 : parseFloat(validated) });
                      setError('');
                    } else {
                      setError('Quantity cannot exceed 10,000');
                    }
                  }}
                  min="0"
                  max="10000"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14
                  }}
                  placeholder="Enter new quantity"
                  required
                />
                <small style={{ color: '#6b7280', fontSize: 12, marginTop: 4, display: 'block' }}>
                  Maximum: 10,000 Litres
                </small>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingItem(null);
                    setEditForm({ quantity: 0 });
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 14,
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Update Quantity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Product Name
              </th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Quantity
              </th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Unit
              </th>
              <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Last Updated
              </th>
              <th style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#374151' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, color: '#6b7280' }}>Loading stock data...</div>
                </td>
              </tr>
            ) : stock.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#64748b', marginBottom: 4 }}>
                    No stock records found
                  </div>
                  <div style={{ fontSize: 14, color: '#94a3b8' }}>
                    Add your first stock entry to get started
                  </div>
                </td>
              </tr>
            ) : (
              stock.map((item, index) => (
                <tr key={item._id || index} style={{ borderTop: index > 0 ? '1px solid #e5e7eb' : 'none' }}>
                  <td style={{ padding: 12 }}>
                    <div style={{ fontWeight: 500, color: '#1f2937' }}>
                      {item.productName || 'Unknown Product'}
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ color: '#374151', fontFamily: 'monospace' }}>
                      {(item.quantityInLiters || 0).toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ color: '#374151', textTransform: 'capitalize' }}>
                      Litres
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ color: '#6b7280', fontSize: 14 }}>
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    <button
                      onClick={() => handleEdit(item)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 13,
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#d97706'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#f59e0b'}
                    >
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerStock;