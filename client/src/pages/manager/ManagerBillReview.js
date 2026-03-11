import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ManagerBillReview = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bills, setBills] = useState([]);
  const [selectedBills, setSelectedBills] = useState([]);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    sortBy: 'submittedAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    totalPages: 0,
    currentPage: 1,
    total: 0
  });
  const [stats, setStats] = useState([]);

  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Validate number input - only positive numbers allowed
  const validateNumberInput = (value, min = 0) => {
    if (value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num) || num < min) return '';
    return value;
  };

  const loadBills = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const params = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await axios.get(`${base}/api/bills/manager/pending?${params}`, config);
      
      setBills(response.data.bills || []);
      setPagination({
        totalPages: response.data.totalPages || 0,
        currentPage: response.data.currentPage || 1,
        total: response.data.total || 0
      });
      setStats(response.data.stats || []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load bill requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (billId, approvedAmount, managerNotes) => {
    try {
      setError('');
      setSuccess('');
      
      await axios.post(`${base}/api/bills/manager/${billId}/approve`, {
        approvedAmount: parseFloat(approvedAmount),
        managerNotes
      }, config);
      
      setSuccess('Bill request approved successfully');
      await loadBills();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to approve bill request');
    }
  };

  const handleReject = async (billId, managerNotes) => {
    try {
      setError('');
      setSuccess('');
      
      await axios.post(`${base}/api/bills/manager/${billId}/reject`, {
        managerNotes
      }, config);
      
      setSuccess('Bill request rejected');
      await loadBills();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to reject bill request');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedBills.length === 0) {
      setError('Please select bills to approve');
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      const promises = selectedBills.map(billId => 
        axios.post(`${base}/api/bills/manager/${billId}/approve`, {
          approvedAmount: bills.find(b => b._id === billId)?.requestedAmount,
          managerNotes: 'Bulk approved by manager'
        }, config)
      );
      
      await Promise.all(promises);
      setSuccess(`Successfully approved ${selectedBills.length} bill requests`);
      setSelectedBills([]);
      await loadBills();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to bulk approve bills');
    }
  };

  const handleBulkReject = async () => {
    if (selectedBills.length === 0) {
      setError('Please select bills to reject');
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      const promises = selectedBills.map(billId => 
        axios.post(`${base}/api/bills/manager/${billId}/reject`, {
          managerNotes: 'Bulk rejected by manager'
        }, config)
      );
      
      await Promise.all(promises);
      setSuccess(`Successfully rejected ${selectedBills.length} bill requests`);
      setSelectedBills([]);
      await loadBills();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to bulk reject bills');
    }
  };

  const toggleBillSelection = (billId) => {
    setSelectedBills(prev => 
      prev.includes(billId) 
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    );
  };

  const selectAllBills = () => {
    setSelectedBills(bills.map(bill => bill._id));
  };

  const clearSelection = () => {
    setSelectedBills([]);
  };

  useEffect(() => {
    loadBills();
  }, [filters.page, filters.sortBy, filters.sortOrder]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Bill Request Review</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={loadBills} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: 'tomato', marginBottom: 16, padding: 12, background: '#fee', borderRadius: 4 }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ color: 'green', marginBottom: 16, padding: 12, background: '#efe', borderRadius: 4 }}>
          {success}
        </div>
      )}

      {/* Statistics */}
      {stats.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4>Bill Statistics by Category</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {stats.map((stat, idx) => (
              <div key={idx} className="dash-card">
                <div style={{ fontWeight: 'bold' }}>{stat._id}</div>
                <div>Count: {stat.count}</div>
                <div>Total: {formatCurrency(stat.totalAmount)}</div>
                <div>Avg: {formatCurrency(stat.avgAmount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {bills.length > 0 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16,
          padding: 12,
          background: '#f8f9fa',
          borderRadius: 4
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input 
                type="checkbox" 
                checked={selectedBills.length === bills.length && bills.length > 0}
                onChange={selectedBills.length === bills.length ? clearSelection : selectAllBills}
              />
              Select All ({selectedBills.length} selected)
            </label>
          </div>
          
          {selectedBills.length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn btn-success" 
                onClick={handleBulkApprove}
                disabled={loading}
              >
                Approve Selected ({selectedBills.length})
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleBulkReject}
                disabled={loading}
              >
                Reject Selected ({selectedBills.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bills Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="dashboard-table" style={{ minWidth: 1000 }}>
          <thead>
            <tr>
              <th>Select</th>
              <th>Staff</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Submitted</th>
              <th>Receipts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill) => (
              <BillRow
                key={bill._id}
                bill={bill}
                isSelected={selectedBills.includes(bill._id)}
                onToggleSelection={() => toggleBillSelection(bill._id)}
                onApprove={handleApprove}
                onReject={handleReject}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
              />
            ))}
            {!loading && bills.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#6b7280', padding: 24 }}>
                  No pending bill requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: 12, 
          marginTop: 24 
        }}>
          <button 
            disabled={filters.page <= 1}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages} 
            ({pagination.total} total bills)
          </span>
          <button 
            disabled={filters.page >= pagination.totalPages}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const BillRow = ({ bill, isSelected, onToggleSelection, onApprove, onReject, formatDate, formatCurrency }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState(bill.requestedAmount);
  const [managerNotes, setManagerNotes] = useState('');

  const handleApprove = () => {
    onApprove(bill._id, approvedAmount, managerNotes);
  };

  const handleReject = () => {
    onReject(bill._id, managerNotes);
  };

  return (
    <>
      <tr>
        <td>
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={onToggleSelection}
          />
        </td>
        <td>
          <div>
            <div style={{ fontWeight: 'bold' }}>{bill.staff?.name || 'Unknown'}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              {bill.staff?.email || ''}
            </div>
            {bill.staff?.staffId && (
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                ID: {bill.staff.staffId}
              </div>
            )}
          </div>
        </td>
        <td>
          <span style={{ 
            padding: '4px 8px', 
            borderRadius: 4, 
            background: '#e5e7eb', 
            fontSize: 12 
          }}>
            {bill.category}
          </span>
        </td>
        <td>
          <div style={{ fontWeight: 'bold' }}>
            {formatCurrency(bill.requestedAmount)}
          </div>
        </td>
        <td>
          <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {bill.description}
          </div>
        </td>
        <td>
          <div style={{ fontSize: 12 }}>
            {formatDate(bill.submittedAt)}
          </div>
        </td>
        <td>
          {bill.receipts && bill.receipts.length > 0 ? (
            <span style={{ color: '#16a34a' }}>
              {bill.receipts.length} file(s)
            </span>
          ) : (
            <span style={{ color: '#6b7280' }}>No receipts</span>
          )}
        </td>
        <td>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className="btn btn-sm btn-outline"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide' : 'Details'}
            </button>
          </div>
        </td>
      </tr>
      
      {showDetails && (
        <tr>
          <td colSpan={8} style={{ background: '#f8f9fa', padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <h5>Bill Details</h5>
                <div style={{ marginBottom: 8 }}>
                  <strong>Description:</strong> {bill.description}
                </div>
                {bill.receipts && bill.receipts.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>Receipts:</strong>
                    <ul style={{ margin: 4, paddingLeft: 20 }}>
                      {bill.receipts.map((receipt, idx) => (
                        <li key={idx}>
                          <a href={`${process.env.REACT_APP_API_URL}/uploads/${receipt.filename}`} 
                             target="_blank" rel="noopener noreferrer">
                            {receipt.originalName}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div>
                <h5>Manager Action</h5>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 4 }}>
                    Approved Amount:
                  </label>
                  <input 
                    type="number" 
                    value={approvedAmount}
                    onChange={(e) => {
                      const validated = validateNumberInput(e.target.value, 0);
                      setApprovedAmount(validated);
                    }}
                    style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 4 }}>
                    Manager Notes:
                  </label>
                  <textarea 
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                    style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4, minHeight: 60 }}
                    placeholder="Add notes for admin review..."
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={handleApprove}
                  >
                    Approve
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={handleReject}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default ManagerBillReview;
