import React, { useState, useEffect } from 'react';
import '../accountant/AccountantExpenseTracker.css';

const AdminExpenses = () => {
    // State management
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [gstEnabled, setGstEnabled] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        expenseNumber: '',
        partyName: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        items: [{ description: '', quantity: 1, amount: 0 }]
    });

    // Categories for dropdown
    const categories = [
        'Office Supplies',
        'Travel & Transport',
        'Utilities',
        'Marketing',
        'Equipment',
        'Professional Services',
        'Maintenance',
        'Other'
    ];

    // Status options
    const statusOptions = [
        { value: '', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' }
    ];

    // Generate expense number
    const generateExpenseNumber = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `EXP-${year}${month}${day}-${random}`;
    };

    // Initialize form when modal opens
    useEffect(() => {
        if (isModalOpen) {
            setFormData(prev => ({
                ...prev,
                expenseNumber: generateExpenseNumber(),
                date: new Date().toISOString().split('T')[0]
            }));
        }
    }, [isModalOpen]);

    // Load expenses from backend
    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/api/expenses`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to load expenses: ${response.status}`);
            }
            
            const data = await response.json();
            const expenseList = data.expenses || data.data || data || [];
            setExpenses(Array.isArray(expenseList) ? expenseList : []);
        } catch (err) {
            console.error('Error loading expenses:', err);
            setError('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle item changes
    const handleItemChange = (index, field, value) => {
        const updatedItems = [...formData.items];
        updatedItems[index] = {
            ...updatedItems[index],
            [field]: field === 'quantity' || field === 'amount' ? parseFloat(value) || 0 : value
        };
        setFormData(prev => ({
            ...prev,
            items: updatedItems
        }));
    };

    // Add new item
    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { description: '', quantity: 1, amount: 0 }]
        }));
    };

    // Remove item
    const removeItem = (index) => {
        if (formData.items.length > 1) {
            const updatedItems = formData.items.filter((_, i) => i !== index);
            setFormData(prev => ({
                ...prev,
                items: updatedItems
            }));
        }
    };

    // Calculate total amount
    const calculateTotal = () => {
        const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.amount), 0);
        const gstAmount = gstEnabled ? subtotal * 0.18 : 0;
        return subtotal + gstAmount;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            
            const expenseData = {
                ...formData,
                totalAmount: calculateTotal(),
                gstEnabled,
                gstAmount: gstEnabled ? formData.items.reduce((sum, item) => sum + (item.quantity * item.amount), 0) * 0.18 : 0,
                status: 'approved' // Admin expenses are auto-approved
            };

            const response = await fetch(`${apiUrl}/api/expenses`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(expenseData)
            });

            if (!response.ok) {
                throw new Error(`Failed to create expense: ${response.status}`);
            }

            // Reload expenses from backend
            await loadExpenses();
            
            // Reset form and close modal
            setFormData({
                expenseNumber: '',
                partyName: '',
                category: '',
                date: new Date().toISOString().split('T')[0],
                description: '',
                items: [{ description: '', quantity: 1, amount: 0 }]
            });
            setGstEnabled(false);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error creating expense:', error);
            setError('Failed to create expense');
        } finally {
            setLoading(false);
        }
    };

    // Handle expense approval (Admin can approve any expense)
    const handleApprove = async (expenseId) => {
        setError('');
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            
            const response = await fetch(`${apiUrl}/api/expenses/${expenseId}/approve`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to approve expense: ${response.status}`);
            }

            // Reload expenses
            await loadExpenses();
        } catch (error) {
            console.error('Error approving expense:', error);
            setError('Failed to approve expense');
        }
    };

    // Handle expense rejection (Admin can reject any expense)
    const handleReject = async (expenseId) => {
        const reason = prompt('Please enter rejection reason:');
        if (reason) {
            setError('');
            try {
                const token = localStorage.getItem('token');
                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                
                const response = await fetch(`${apiUrl}/api/expenses/${expenseId}/reject`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ reason })
                });

                if (!response.ok) {
                    throw new Error(`Failed to reject expense: ${response.status}`);
                }

                // Reload expenses
                await loadExpenses();
            } catch (error) {
                console.error('Error rejecting expense:', error);
                setError('Failed to reject expense');
            }
        }
    };

    // Filter expenses based on search and filters
    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            expense.expenseNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !categoryFilter || expense.category === categoryFilter;
        const matchesDate = !dateFilter || expense.date === dateFilter;
        const matchesStatus = !statusFilter || expense.status === statusFilter;
        
        return matchesSearch && matchesCategory && matchesDate && matchesStatus;
    });

    // Get status badge class
    const getStatusBadge = (status) => {
        const badges = {
            pending: 'status-pending',
            approved: 'status-approved',
            rejected: 'status-rejected'
        };
        return badges[status] || 'status-pending';
    };

    return (
        <div className="expense-tracker">
            {/* Header */}
            <div className="expense-header">
                <div className="header-left">
                    <h1 className="page-title">Admin Expense Management</h1>
                </div>
                <div className="header-right">
                    <button className="reports-btn">
                        <span>📊</span>
                        Reports
                    </button>
                    <button className="settings-btn">
                        <span>⚙️</span>
                    </button>
                    <button className="more-btn">
                        <span>⋯</span>
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ 
                    padding: '12px 16px', 
                    backgroundColor: '#fee2e2', 
                    color: '#991b1b', 
                    borderRadius: '6px',
                    marginBottom: '16px',
                    border: '1px solid #fecaca'
                }}>
                    {error}
                </div>
            )}

            {/* Filters */}
            <div className="expense-filters">
                <div className="filter-left">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search expenses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="date-filter"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    >
                        <option value="">All Dates</option>
                        <option value={new Date().toISOString().split('T')[0]}>Today</option>
                        <option value={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>Last 7 Days</option>
                    </select>
                    <select
                        className="category-filter"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                    <select
                        className="category-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
                <button
                    className="create-expense-btn"
                    onClick={() => setIsModalOpen(true)}
                >
                    + Create Expense
                </button>
            </div>

            {/* Table */}
            <div className="expense-table-container">
                {loading ? (
                    <div className="expense-loading">
                        <div className="loading-spinner"></div>
                    </div>
                ) : filteredExpenses.length > 0 ? (
                    <table className="expense-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Expense Number</th>
                                <th>Party Name</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map((expense, index) => (
                                <tr key={index}>
                                    <td>{new Date(expense.date).toLocaleDateString()}</td>
                                    <td>{expense.expenseNumber}</td>
                                    <td>{expense.partyName}</td>
                                    <td>{expense.category}</td>
                                    <td>₹{expense.totalAmount?.toFixed(2) || '0.00'}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusBadge(expense.status)}`}>
                                            {expense.status?.toUpperCase() || 'PENDING'}
                                        </span>
                                    </td>
                                    <td>
                                        {expense.status === 'pending' && (
                                            <div className="action-buttons">
                                                <button
                                                    className="approve-btn"
                                                    onClick={() => handleApprove(expense.expenseNumber)}
                                                >
                                                    ✓ Approve
                                                </button>
                                                <button
                                                    className="reject-btn"
                                                    onClick={() => handleReject(expense.expenseNumber)}
                                                >
                                                    ✗ Reject
                                                </button>
                                            </div>
                                        )}
                                        {expense.status === 'approved' && (
                                            <span className="action-text">Approved</span>
                                        )}
                                        {expense.status === 'rejected' && (
                                            <span className="action-text">Rejected</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <div className="empty-content">
                            <div className="empty-icon">📄</div>
                            <p>No Transactions Matching the current filter</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Expense Modal - Same as AccountantExpenseTracker */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="expense-modal">
                        <div className="expense-modal-header">
                            <div className="modal-header-left">
                                <button
                                    className="back-button"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    ←
                                </button>
                                <h2>Create Expense</h2>
                            </div>
                            <div className="modal-header-right">
                                <button
                                    className="cancel-button"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="save-button"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>

                        <div className="expense-modal-content">
                            <form onSubmit={handleSubmit}>
                                <div className="expense-form-grid">
                                    <div className="expense-form-left">
                                        <div className="form-group">
                                            <label className="form-label">Expense Number</label>
                                            <input
                                                type="text"
                                                name="expenseNumber"
                                                className="form-input"
                                                value={formData.expenseNumber}
                                                onChange={handleInputChange}
                                                readOnly
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Party Name</label>
                                            <input
                                                type="text"
                                                name="partyName"
                                                className="form-input"
                                                value={formData.partyName}
                                                onChange={handleInputChange}
                                                placeholder="Enter party name"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Category</label>
                                            <select
                                                name="category"
                                                className="form-select"
                                                value={formData.category}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(category => (
                                                    <option key={category} value={category}>{category}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="expense-form-right">
                                        <div className="form-group">
                                            <label className="form-label">Date</label>
                                            <input
                                                type="date"
                                                name="date"
                                                className="form-input"
                                                value={formData.date}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className="form-group toggle-group">
                                            <label className="toggle-label">
                                                GST Applicable
                                                <div className="toggle-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={gstEnabled}
                                                        onChange={(e) => setGstEnabled(e.target.checked)}
                                                    />
                                                    <span className="toggle-slider"></span>
                                                </div>
                                            </label>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Description</label>
                                            <textarea
                                                name="description"
                                                className="form-textarea"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                placeholder="Enter description"
                                                rows="3"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Items Section */}
                                <div className="expense-items-section">
                                    <div className="items-header">
                                        <h3>Items</h3>
                                    </div>
                                    
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="expense-item">
                                            <div className="item-fields">
                                                <input
                                                    type="text"
                                                    className="item-description"
                                                    placeholder="Item description"
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                />
                                                <input
                                                    type="number"
                                                    className="item-quantity"
                                                    placeholder="Qty"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                    min="1"
                                                />
                                                <input
                                                    type="number"
                                                    className="item-amount"
                                                    placeholder="Amount"
                                                    value={item.amount}
                                                    onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>
                                            {formData.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="remove-item-button"
                                                    onClick={() => removeItem(index)}
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        className="add-item-button"
                                        onClick={addItem}
                                    >
                                        + Add Item
                                    </button>

                                    <div className="total-amount-section">
                                        <div className="total-amount">
                                            <span className="total-label">Total Amount:</span>
                                            <span className="total-value">₹{calculateTotal().toFixed(2)}</span>
                                        </div>
                                        {gstEnabled && (
                                            <div className="total-amount">
                                                <span className="total-label">GST (18%):</span>
                                                <span className="total-value">
                                                    ₹{(formData.items.reduce((sum, item) => sum + (item.quantity * item.amount), 0) * 0.18).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .status-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                }
                .status-pending {
                    background: #fef3c7;
                    color: #92400e;
                }
                .status-approved {
                    background: #d1fae5;
                    color: #065f46;
                }
                .status-rejected {
                    background: #fee2e2;
                    color: #991b1b;
                }
                .action-buttons {
                    display: flex;
                    gap: 8px;
                }
                .approve-btn, .reject-btn {
                    padding: 4px 8px;
                    border: none;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                }
                .approve-btn {
                    background: #10b981;
                    color: white;
                }
                .reject-btn {
                    background: #ef4444;
                    color: white;
                }
                .action-text {
                    font-size: 12px;
                    color: #6b7280;
                }
            `}</style>
        </div>
    );
};

export default AdminExpenses;