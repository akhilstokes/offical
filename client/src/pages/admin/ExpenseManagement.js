import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './ExpenseManagement.css';

const ExpenseManagement = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [stats, setStats] = useState(null);
    
    const [filters, setFilters] = useState({
        category: '',
        status: '',
        startDate: '',
        endDate: '',
        search: ''
    });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'other_expenses',
        subcategory: '',
        paymentMethod: 'cash',
        transactionId: '',
        expenseDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        items: [{ name: '', rate: '', quantity: 1 }],
        gstEnabled: false,
        notes: ''
    });

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0
    });

    useEffect(() => {
        fetchExpenses();
        fetchStats();
    }, [filters, pagination.page]);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                ...filters,
                page: pagination.page,
                limit: pagination.limit
            });

            const response = await fetch(`/api/expenses?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                setExpenses(data.data);
                setPagination(prev => ({ ...prev, total: data.pagination.total }));
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/expenses/stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const calculateTotal = () => {
        const subtotal = formData.items.reduce((sum, item) => {
            return sum + (parseFloat(item.rate || 0) * parseFloat(item.quantity || 0));
        }, 0);
        const gstAmount = formData.gstEnabled ? subtotal * 0.18 : 0;
        return { subtotal, gstAmount, total: subtotal + gstAmount };
    };

    const handleCreateExpense = async (e) => {
        e.preventDefault();
        
        try {
            const totals = calculateTotal();
            const expenseData = {
                ...formData,
                amount: totals.total,
                totalAmount: totals.total,
                gstAmount: totals.gstAmount
            };

            const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(expenseData)
            });

            const data = await response.json();
            
            if (data.success) {
                alert('Expense created successfully!');
                setShowModal(false);
                resetForm();
                fetchExpenses();
                fetchStats();
            } else {
                alert(data.message || 'Error creating expense');
            }
        } catch (error) {
            console.error('Error creating expense:', error);
            alert('Error creating expense');
        }
    };

    const handleUpdateExpense = async (e) => {
        e.preventDefault();
        
        try {
            const totals = calculateTotal();
            const expenseData = {
                ...formData,
                amount: totals.total,
                totalAmount: totals.total,
                gstAmount: totals.gstAmount
            };

            const response = await fetch(`/api/expenses/${selectedExpense._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(expenseData)
            });

            const data = await response.json();
            
            if (data.success) {
                alert('Expense updated successfully!');
                setShowModal(false);
                resetForm();
                fetchExpenses();
            } else {
                alert(data.message || 'Error updating expense');
            }
        } catch (error) {
            console.error('Error updating expense:', error);
            alert('Error updating expense');
        }
    };

    const handleApprove = async (expenseId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this expense?`)) return;

        try {
            const response = await fetch(`/api/expenses/${expenseId}/approve`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ action })
            });

            const data = await response.json();
            
            if (data.success) {
                alert(`Expense ${action}d successfully!`);
                fetchExpenses();
                fetchStats();
            } else {
                alert(data.message || `Error ${action}ing expense`);
            }
        } catch (error) {
            console.error(`Error ${action}ing expense:`, error);
            alert(`Error ${action}ing expense`);
        }
    };

    const handleMarkPaid = async (expenseId) => {
        const transactionId = prompt('Enter transaction ID (optional):');
        
        try {
            const response = await fetch(`/api/expenses/${expenseId}/pay`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ 
                    paidDate: new Date(),
                    transactionId 
                })
            });

            const data = await response.json();
            
            if (data.success) {
                alert('Expense marked as paid!');
                fetchExpenses();
                fetchStats();
            } else {
                alert(data.message || 'Error marking expense as paid');
            }
        } catch (error) {
            console.error('Error marking paid:', error);
            alert('Error marking expense as paid');
        }
    };

    const handleDelete = async (expenseId) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) return;

        try {
            const response = await fetch(`/api/expenses/${expenseId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                alert('Expense deleted successfully!');
                fetchExpenses();
                fetchStats();
            } else {
                alert(data.message || 'Error deleting expense');
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
            alert('Error deleting expense');
        }
    };

    const openCreateModal = () => {
        setModalMode('create');
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (expense) => {
        setModalMode('edit');
        setSelectedExpense(expense);
        setFormData({
            title: expense.title,
            description: expense.description || '',
            category: expense.category,
            subcategory: expense.subcategory || '',
            paymentMethod: expense.paymentMethod,
            transactionId: expense.transactionId || '',
            expenseDate: expense.expenseDate.split('T')[0],
            dueDate: expense.dueDate ? expense.dueDate.split('T')[0] : '',
            items: expense.items || [{ name: '', rate: '', quantity: 1 }],
            gstEnabled: expense.gstEnabled || false,
            notes: expense.notes || ''
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            category: 'other_expenses',
            subcategory: '',
            paymentMethod: 'cash',
            transactionId: '',
            expenseDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            items: [{ name: '', rate: '', quantity: 1 }],
            gstEnabled: false,
            notes: ''
        });
        setSelectedExpense(null);
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { name: '', rate: '', quantity: 1 }]
        }));
    };

    const removeItem = (index) => {
        if (formData.items.length > 1) {
            setFormData(prev => ({
                ...prev,
                items: prev.items.filter((_, i) => i !== index)
            }));
        }
    };

    const handleItemChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) => 
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const canEdit = (expense) => {
        if (user.role === 'admin') return true;
        if (user.role === 'manager' && expense.createdByRole === 'manager') return true;
        if (user.role === 'accountant' && expense.createdBy._id === user._id) return true;
        return false;
    };

    const canApprove = () => user.role === 'admin';
    const canDelete = () => user.role === 'admin';

    return (
        <div className="expense-management">
            <div className="expense-header">
                <div className="expense-stats-grid">
                    <div className="stat-card stat-total">
                        <div className="stat-icon">
                            <i className="fas fa-receipt"></i>
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Total Expenses</div>
                            <div className="stat-value">
                                ₹{stats?.overall[0]?.totalExpenses?.toLocaleString() || 0}
                            </div>
                            <div className="stat-count">
                                {stats?.overall[0]?.totalCount || 0} entries
                            </div>
                        </div>
                    </div>

                    <div className="stat-card stat-pending">
                        <div className="stat-icon">
                            <i className="fas fa-clock"></i>
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Pending</div>
                            <div className="stat-value">
                                ₹{stats?.byStatus?.find(s => s._id === 'pending')?.total?.toLocaleString() || 0}
                            </div>
                        </div>
                    </div>

                    <div className="stat-card stat-approved">
                        <div className="stat-icon">
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Approved</div>
                            <div className="stat-value">
                                ₹{stats?.byStatus?.find(s => s._id === 'approved')?.total?.toLocaleString() || 0}
                            </div>
                        </div>
                    </div>

                    <div className="stat-card stat-paid">
                        <div className="stat-icon">
                            <i className="fas fa-money-bill-wave"></i>
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">Paid</div>
                            <div className="stat-value">
                                ₹{stats?.byStatus?.find(s => s._id === 'paid')?.total?.toLocaleString() || 0}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="expense-controls">
                <div className="filters-section">
                    <div className="search-box">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Search expenses..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>

                    <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="filter-select"
                    >
                        <option value="">All Categories</option>
                        <option value="bills">Bills</option>
                        <option value="other_expenses">Other Expenses</option>
                        <option value="utilities">Utilities</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="supplies">Supplies</option>
                        <option value="transport">Transport</option>
                        <option value="salaries">Salaries</option>
                        <option value="miscellaneous">Miscellaneous</option>
                    </select>

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="filter-select"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="paid">Paid</option>
                    </select>

                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        className="filter-date"
                        placeholder="Start Date"
                    />

                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        className="filter-date"
                        placeholder="End Date"
                    />

                    <button 
                        className="btn-clear-filters"
                        onClick={() => setFilters({ category: '', status: '', startDate: '', endDate: '', search: '' })}
                    >
                        <i className="fas fa-times"></i> Clear
                    </button>
                </div>

                <button className="btn-create-expense" onClick={openCreateModal}>
                    <i className="fas fa-plus"></i> Create Expense
                </button>
            </div>

            <div className="expense-table-container">
                {loading ? (
                    <div className="loading-state">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Loading expenses...</p>
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-inbox"></i>
                        <h3>No expenses found</h3>
                        <p>Create your first expense to get started</p>
                    </div>
                ) : (
                    <table className="expense-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Created By</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map(expense => (
                                <tr key={expense._id}>
                                    <td className="expense-id">{expense.expenseId}</td>
                                    <td className="expense-title">
                                        <div className="title-cell">
                                            <strong>{expense.title}</strong>
                                            {expense.description && (
                                                <small>{expense.description.substring(0, 50)}...</small>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`category-badge category-${expense.category}`}>
                                            {expense.category.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="expense-amount">₹{expense.amount.toLocaleString()}</td>
                                    <td>{new Date(expense.expenseDate).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`status-badge status-${expense.status}`}>
                                            {expense.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="creator-info">
                                            <strong>{expense.createdBy?.name}</strong>
                                            <small>{expense.createdByRole}</small>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            {canEdit(expense) && expense.status === 'pending' && (
                                                <button 
                                                    className="btn-action btn-edit"
                                                    onClick={() => openEditModal(expense)}
                                                    title="Edit"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                            )}
                                            
                                            {canApprove() && expense.status === 'pending' && (
                                                <>
                                                    <button 
                                                        className="btn-action btn-approve"
                                                        onClick={() => handleApprove(expense._id, 'approve')}
                                                        title="Approve"
                                                    >
                                                        <i className="fas fa-check"></i>
                                                    </button>
                                                    <button 
                                                        className="btn-action btn-reject"
                                                        onClick={() => handleApprove(expense._id, 'reject')}
                                                        title="Reject"
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </>
                                            )}

                                            {(user.role === 'admin' || user.role === 'accountant') && 
                                             expense.status === 'approved' && (
                                                <button 
                                                    className="btn-action btn-pay"
                                                    onClick={() => handleMarkPaid(expense._id)}
                                                    title="Mark as Paid"
                                                >
                                                    <i className="fas fa-money-bill"></i>
                                                </button>
                                            )}

                                            {canDelete() && (
                                                <button 
                                                    className="btn-action btn-delete"
                                                    onClick={() => handleDelete(expense._id)}
                                                    title="Delete"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {pagination.total > pagination.limit && (
                <div className="pagination">
                    <button 
                        disabled={pagination.page === 1}
                        onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    >
                        <i className="fas fa-chevron-left"></i> Previous
                    </button>
                    <span>Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}</span>
                    <button 
                        disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                        onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    >
                        Next <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                <i className="fas fa-receipt"></i>
                                {modalMode === 'create' ? 'Create New Expense' : 'Edit Expense'}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={modalMode === 'create' ? handleCreateExpense : handleUpdateExpense}>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Title *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        placeholder="Enter expense title"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Enter expense description"
                                        rows="3"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Category *</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        <option value="bills">Bills</option>
                                        <option value="other_expenses">Other Expenses</option>
                                        <option value="utilities">Utilities</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="supplies">Supplies</option>
                                        <option value="transport">Transport</option>
                                        <option value="salaries">Salaries</option>
                                        <option value="miscellaneous">Miscellaneous</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Payment Method</label>
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="upi">UPI</option>
                                        <option value="card">Card</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Expense Date *</label>
                                    <input
                                        type="date"
                                        value={formData.expenseDate}
                                        onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="toggle-label">
                                        <span>GST Applicable (18%)</span>
                                        <input
                                            type="checkbox"
                                            checked={formData.gstEnabled}
                                            onChange={(e) => setFormData({ ...formData, gstEnabled: e.target.checked })}
                                            style={{ marginLeft: '10px' }}
                                        />
                                    </label>
                                </div>

                                <div className="form-group full-width">
                                    <label style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', display: 'block' }}>
                                        Items
                                    </label>
                                    
                                    {formData.items.map((item, index) => (
                                        <div key={index} style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: '2fr 1fr 1fr auto', 
                                            gap: '12px', 
                                            marginBottom: '12px',
                                            alignItems: 'end'
                                        }}>
                                            <div>
                                                {index === 0 && <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block' }}>Item Name</label>}
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                                    placeholder="Item name"
                                                    style={{
                                                        padding: '10px 14px',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px',
                                                        fontSize: '14px',
                                                        width: '100%'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                {index === 0 && <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block' }}>Rate (₹)</label>}
                                                <input
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                                    placeholder="0.00"
                                                    min="0"
                                                    step="0.01"
                                                    style={{
                                                        padding: '10px 14px',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px',
                                                        fontSize: '14px',
                                                        width: '100%'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                {index === 0 && <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block' }}>Quantity</label>}
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                    placeholder="1"
                                                    min="1"
                                                    style={{
                                                        padding: '10px 14px',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px',
                                                        fontSize: '14px',
                                                        width: '100%'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                {formData.items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            background: '#fee2e2',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            color: '#991b1b',
                                                            fontSize: '18px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addItem}
                                        style={{
                                            padding: '10px 20px',
                                            background: '#f1f5f9',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            color: '#475569',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            marginTop: '8px'
                                        }}
                                    >
                                        + Add Item
                                    </button>

                                    <div style={{ 
                                        marginTop: '20px', 
                                        padding: '16px', 
                                        background: '#f8fafc', 
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '14px', color: '#64748b' }}>Subtotal:</span>
                                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                                                ₹{calculateTotal().subtotal.toFixed(2)}
                                            </span>
                                        </div>
                                        {formData.gstEnabled && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '14px', color: '#64748b' }}>GST (18%):</span>
                                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                                                    ₹{calculateTotal().gstAmount.toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                        <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            paddingTop: '12px', 
                                            borderTop: '2px solid #e5e7eb',
                                            marginTop: '8px'
                                        }}>
                                            <span style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>Total Amount:</span>
                                            <span style={{ fontSize: '18px', fontWeight: '800', color: '#16a34a' }}>
                                                ₹{calculateTotal().total.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label>Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Additional notes"
                                        rows="2"
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit">
                                    <i className="fas fa-save"></i>
                                    {modalMode === 'create' ? 'Create Expense' : 'Update Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseManagement;
