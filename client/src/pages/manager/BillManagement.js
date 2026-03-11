import React, { useEffect, useState, useCallback } from 'react';
import BillSubmissionForm from '../../components/common/BillSubmissionForm';

const BillManagement = () => {
  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [actionForm, setActionForm] = useState({
    approvedAmount: '',
    managerNotes: '',
    adminNotes: ''
  });

  // Validate number input - only positive numbers allowed
  const validateNumberInput = (value, min = 0) => {
    if (value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num) || num < min) return '';
    return value;
  };

  const loadBills = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      
      const queryString = params.toString();
      const url = `${base}/api/bills/manager/pending${queryString ? `?${queryString}` : ''}`;
      
      const res = await fetch(url, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setBills(data.bills || []);
        setStats(data.stats || []);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || 'Failed to load bills');
      }
    } catch (err) {
      console.error('Error loading bills:', err);
      setError('Failed to load bills. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [base, token, filters]);

  useEffect(() => {
    if (token) {
      loadBills();
    }
  }, [token, loadBills]);

  const handleSubmitBill = async (formData) => {
    try {
      const res = await fetch(`${base}/api/bills/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setShowForm(false);
        await loadBills();
        alert('Bill request submitted successfully!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Failed to submit bill request');
      }
    } catch (err) {
      console.error('Error submitting bill:', err);
      alert('Failed to submit bill request. Please try again.');
    }
  };

  const handleApproveBill = async (billId) => {
    try {
      const res = await fetch(`${base}/api/bills/manager/${billId}/approve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          approvedAmount: actionForm.approvedAmount || selectedBill?.requestedAmount,
          managerNotes: actionForm.managerNotes
        })
      });
      
      if (res.ok) {
        setSelectedBill(null);
        setActionForm({ approvedAmount: '', managerNotes: '', adminNotes: '' });
        await loadBills();
        alert('Bill approved successfully!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Failed to approve bill');
      }
    } catch (err) {
      console.error('Error approving bill:', err);
      alert('Failed to approve bill. Please try again.');
    }
  };

  const handleRejectBill = async (billId) => {
    try {
      const res = await fetch(`${base}/api/bills/manager/${billId}/reject`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          managerNotes: actionForm.managerNotes
        })
      });
      
      if (res.ok) {
        setSelectedBill(null);
        setActionForm({ approvedAmount: '', managerNotes: '', adminNotes: '' });
        await loadBills();
        alert('Bill rejected successfully!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Failed to reject bill');
      }
    } catch (err) {
      console.error('Error rejecting bill:', err);
      alert('Failed to reject bill. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: '#ffc107',
      manager_approved: '#17a2b8',
      manager_rejected: '#dc3545',
      admin_approved: '#28a745',
      admin_rejected: '#dc3545',
      processing: '#6f42c1'
    };
    
    return (
      <span 
        style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          fontSize: '12px', 
          fontWeight: 'bold',
          backgroundColor: statusColors[status] || '#6c757d',
          color: 'white',
          textTransform: 'capitalize'
        }}
      >
        {status?.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  if (!token) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Bill Management</h2>
        <div style={{ color: 'crimson', marginTop: 8 }}>
          Please log in to access bill management.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Bill Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          Submit New Bill
        </button>
      </div>

      {error && <div style={{ color: 'crimson', marginBottom: 16, padding: 12, backgroundColor: '#f8d7da', borderRadius: 4 }}>{error}</div>}

      {/* Stats Cards */}
      {stats.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 16, 
          marginBottom: 20 
        }}>
          {stats.map((stat, index) => (
            <div key={index} style={{ padding: 16, backgroundColor: '#e3f2fd', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1976d2' }}>
                {stat.count}
              </div>
              <div style={{ fontSize: 14, color: '#666', textTransform: 'capitalize' }}>
                {stat._id} Bills
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                Total: {formatCurrency(stat.totalAmount)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ 
        marginBottom: 20, 
        padding: 16, 
        backgroundColor: '#f8f9fa', 
        borderRadius: 8,
        border: '1px solid #dee2e6'
      }}>
        <h5 style={{ marginBottom: 16 }}>Filters</h5>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Status</label>
            <select
              className="form-control"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="manager_approved">Manager Approved</option>
              <option value="manager_rejected">Manager Rejected</option>
              <option value="admin_approved">Admin Approved</option>
              <option value="admin_rejected">Admin Rejected</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Category</label>
            <select
              className="form-control"
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="all">All Categories</option>
              <option value="Transportation">Transportation</option>
              <option value="Materials">Materials</option>
              <option value="Equipment">Equipment</option>
              <option value="Meals">Meals</option>
              <option value="Accommodation">Accommodation</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>From Date</label>
            <input
              type="date"
              className="form-control"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>To Date</label>
            <input
              type="date"
              className="form-control"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              min={filters.dateFrom || undefined}
            />
          </div>
        </div>
      </div>

      {/* Bill Submission Form Modal */}
      {showForm && (
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
            maxWidth: 600, 
            width: '90%', 
            maxHeight: '90%', 
            overflow: 'auto' 
          }}>
            <div style={{ padding: 20 }}>
              <BillSubmissionForm 
                onSubmit={handleSubmitBill}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {selectedBill && (
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
            maxWidth: 600, 
            width: '90%', 
            maxHeight: '90%', 
            overflow: 'auto' 
          }}>
            <div style={{ padding: 20 }}>
              <h4 style={{ marginBottom: 20 }}>Review Bill Request</h4>
              <div style={{ marginBottom: 16 }}>
                <strong>Staff:</strong> {selectedBill.staff?.name || 'Unknown'}
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Amount:</strong> {formatCurrency(selectedBill.requestedAmount)}
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Category:</strong> {selectedBill.category}
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Description:</strong> {selectedBill.description}
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>Submitted:</strong> {formatDate(selectedBill.submittedAt)}
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Approved Amount</label>
                <input
                  type="number"
                  className="form-control"
                  value={actionForm.approvedAmount}
                  onChange={(e) => {
                    const validated = validateNumberInput(e.target.value, 0);
                    setActionForm(prev => ({ ...prev, approvedAmount: validated }));
                  }}
                  placeholder={selectedBill.requestedAmount}
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Manager Notes</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={actionForm.managerNotes}
                  onChange={(e) => setActionForm(prev => ({ ...prev, managerNotes: e.target.value }))}
                  placeholder="Add notes about this approval/rejection..."
                />
              </div>
              
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedBill(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleRejectBill(selectedBill._id)}
                >
                  Reject
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => handleApproveBill(selectedBill._id)}
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bills Table */}
      <div style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div>Loading bills...</div>
          </div>
        ) : (
          <table className="table table-striped table-hover" style={{ minWidth: 1000 }}>
            <thead className="table-dark">
              <tr>
                <th>Staff</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill, index) => (
                <tr key={bill._id || index}>
                  <td>{bill.staff?.name || 'Unknown'}</td>
                  <td>{formatCurrency(bill.requestedAmount)}</td>
                  <td>{bill.category}</td>
                  <td>{getStatusBadge(bill.status)}</td>
                  <td>{formatDate(bill.submittedAt)}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bill.description}
                  </td>
                  <td>
                    {bill.status === 'pending' && (
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setSelectedBill(bill)}
                      >
                        Review
                      </button>
                    )}
                    {bill.status !== 'pending' && (
                      <span style={{ color: '#6c757d', fontSize: '12px' }}>
                        {bill.status === 'manager_approved' ? 'Approved' : 
                         bill.status === 'manager_rejected' ? 'Rejected' : 'Processed'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {bills.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#6c757d' }}>
                    No bills found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BillManagement;










