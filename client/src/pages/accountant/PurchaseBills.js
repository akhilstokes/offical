import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PurchaseBills.css';

const PurchaseBills = () => {
    const navigate = useNavigate();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [filters, setFilters] = useState({
        supplier: '',
        paymentStatus: '',
        status: '',
        startDate: '',
        endDate: '',
        search: ''
    });

    useEffect(() => {
        fetchBills();
        fetchStats();
    }, [filters]);

    const fetchBills = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`/api/purchase-bills?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setBills(data.data);
            }
        } catch (error) {
            console.error('Error fetching bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/purchase-bills/stats', {
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

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this purchase bill?')) return;
        
        try {
            const response = await fetch(`/api/purchase-bills/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                alert('Purchase bill deleted successfully');
                fetchBills();
                fetchStats();
            }
        } catch (error) {
            console.error('Error deleting bill:', error);
            alert('Error deleting purchase bill');
        }
    };

    return (
        <div className="purchase-bills-container">
            <div className="pb-header">
                <div className="pb-title-section">
                    <h1><i className="fas fa-shopping-cart"></i> Purchase Bills</h1>
                    <p>Manage supplier purchase bills and payments</p>
                </div>
                <button className="btn-create-bill" onClick={() => navigate('/accountant/purchase-bills/create')}>
                    <i className="fas fa-plus"></i> Create Purchase Bill
                </button>
            </div>

            {/* Stats Cards */}
            <div className="pb-stats-grid">
                <div className="pb-stat-card stat-total">
                    <div className="stat-icon">
                        <i className="fas fa-file-invoice"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total Bills</div>
                        <div className="stat-value">₹{stats?.overall?.totalAmount?.toLocaleString() || 0}</div>
                        <div className="stat-count">{stats?.overall?.totalBills || 0} bills</div>
                    </div>
                </div>

                <div className="pb-stat-card stat-paid">
                    <div className="stat-icon">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Paid</div>
                        <div className="stat-value">₹{stats?.overall?.totalPaid?.toLocaleString() || 0}</div>
                        <div className="stat-count">{stats?.byStatus?.find(s => s._id === 'paid')?.count || 0} bills</div>
                    </div>
                </div>

                <div className="pb-stat-card stat-unpaid">
                    <div className="stat-icon">
                        <i className="fas fa-clock"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Unpaid</div>
                        <div className="stat-value">₹{stats?.overall?.totalBalance?.toLocaleString() || 0}</div>
                        <div className="stat-count">{stats?.byStatus?.find(s => s._id === 'unpaid')?.count || 0} bills</div>
                    </div>
                </div>

                <div className="pb-stat-card stat-partial">
                    <div className="stat-icon">
                        <i className="fas fa-hourglass-half"></i>
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Partial</div>
                        <div className="stat-value">{stats?.byStatus?.find(s => s._id === 'partial')?.count || 0}</div>
                        <div className="stat-count">Partially paid</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="pb-filters">
                <input
                    type="text"
                    placeholder="Search by bill number or supplier..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="filter-search"
                />
                
                <select
                    value={filters.paymentStatus}
                    onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                    className="filter-select"
                >
                    <option value="">All Payment Status</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="unpaid">Unpaid</option>
                </select>

                <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="filter-date"
                />

                <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="filter-date"
                />

                <button 
                    className="btn-clear-filters"
                    onClick={() => setFilters({ supplier: '', paymentStatus: '', status: '', startDate: '', endDate: '', search: '' })}
                >
                    <i className="fas fa-times"></i> Clear
                </button>
            </div>

            {/* Bills Table */}
            <div className="pb-table-container">
                {loading ? (
                    <div className="pb-loading">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Loading purchase bills...</p>
                    </div>
                ) : bills.length === 0 ? (
                    <div className="pb-empty">
                        <i className="fas fa-inbox"></i>
                        <h3>No Purchase Bills Found</h3>
                        <p>Create your first purchase bill to get started</p>
                    </div>
                ) : (
                    <table className="pb-table">
                        <thead>
                            <tr>
                                <th>Bill Number</th>
                                <th>Date</th>
                                <th>Supplier</th>
                                <th>Amount</th>
                                <th>Paid</th>
                                <th>Balance</th>
                                <th>Payment Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bills.map(bill => (
                                <tr key={bill._id}>
                                    <td className="bill-number">{bill.billNumber}</td>
                                    <td>{new Date(bill.billDate).toLocaleDateString()}</td>
                                    <td>
                                        <div className="supplier-cell">
                                            <strong>{bill.supplier.name}</strong>
                                            {bill.supplier.gstin && <small>GSTIN: {bill.supplier.gstin}</small>}
                                        </div>
                                    </td>
                                    <td className="amount">₹{bill.totalAmount.toLocaleString()}</td>
                                    <td className="amount-paid">₹{bill.amountPaid.toLocaleString()}</td>
                                    <td className="amount-balance">₹{bill.balanceAmount.toLocaleString()}</td>
                                    <td>
                                        <span className={`status-badge status-${bill.paymentStatus}`}>
                                            {bill.paymentStatus}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button 
                                                className="btn-action btn-view"
                                                onClick={() => navigate(`/accountant/purchase-bills/${bill._id}`)}
                                                title="View"
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>
                                            <button 
                                                className="btn-action btn-edit"
                                                onClick={() => navigate(`/accountant/purchase-bills/edit/${bill._id}`)}
                                                title="Edit"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button 
                                                className="btn-action btn-delete"
                                                onClick={() => handleDelete(bill._id)}
                                                title="Delete"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default PurchaseBills;
