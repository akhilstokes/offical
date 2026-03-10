import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BillGeneration.css';

const BillGeneration = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchInvoices();
  }, [filters]);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const params = new URLSearchParams();

      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(`${API_URL}/api/gst-invoices?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setInvoices(response.data.invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Draft': 'badge-draft',
      'Generated': 'badge-generated',
      'Sent': 'badge-sent',
      'Paid': 'badge-paid',
      'Cancelled': 'badge-cancelled'
    };
    return statusColors[status] || 'badge-draft';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="bill-generation-container">
      <div className="page-header">
        <div>
          <h1>Bill Generation</h1>
          <p>Manage GST invoices and bills</p>
        </div>
        <button
          className="create-invoice-btn"
          onClick={() => navigate('/accountant/bill-generation/new')}
        >
          <i className="fas fa-plus"></i> Generate New Bill
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            name="search"
            placeholder="Search by invoice number, customer..."
            value={filters.search}
            onChange={handleFilterChange}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Generated">Generated</option>
            <option value="Sent">Sent</option>
            <option value="Paid">Paid</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="filter-group">
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i> Loading invoices...
        </div>
      ) : invoices.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-file-invoice fa-3x"></i>
          <h3>No invoices found</h3>
          <p>Create your first GST invoice to get started</p>
          <button
            className="create-invoice-btn"
            onClick={() => navigate('/accountant/bill-generation/new')}
          >
            <i className="fas fa-plus"></i> Generate New Bill
          </button>
        </div>
      ) : (
        <div className="invoices-table-container">
          <table className="invoices-table">
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Vendor</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice._id}>
                  <td className="invoice-number">{invoice.invoiceNumber}</td>
                  <td>{formatDate(invoice.invoiceDate)}</td>
                  <td>{invoice.customerName}</td>
                  <td>{invoice.vendorName}</td>
                  <td>{invoice.items.length} item(s)</td>
                  <td className="amount">{formatCurrency(invoice.grandTotal)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadge(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn view-btn"
                        onClick={() => navigate(`/accountant/bill-generation/view/${invoice._id}`)}
                        title="View Invoice"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        className="action-btn print-btn"
                        onClick={() => window.open(`/accountant/bill-generation/print/${invoice._id}`, '_blank')}
                        title="Print Invoice"
                      >
                        <i className="fas fa-print"></i>
                      </button>
                      <button
                        className="action-btn download-btn"
                        onClick={() => window.open(`/accountant/bill-generation/print/${invoice._id}?download=true`, '_blank')}
                        title="Download PDF"
                      >
                        <i className="fas fa-download"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Cards */}
      {invoices.length > 0 && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon" style={{ background: '#667eea' }}>
              <i className="fas fa-file-invoice"></i>
            </div>
            <div className="summary-content">
              <h4>Total Invoices</h4>
              <p>{invoices.length}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon" style={{ background: '#28a745' }}>
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="summary-content">
              <h4>Paid</h4>
              <p>{invoices.filter(inv => inv.status === 'Paid').length}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon" style={{ background: '#ffc107' }}>
              <i className="fas fa-clock"></i>
            </div>
            <div className="summary-content">
              <h4>Pending</h4>
              <p>{invoices.filter(inv => ['Generated', 'Sent'].includes(inv.status)).length}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon" style={{ background: '#17a2b8' }}>
              <i className="fas fa-rupee-sign"></i>
            </div>
            <div className="summary-content">
              <h4>Total Amount</h4>
              <p>{formatCurrency(invoices.reduce((sum, inv) => sum + inv.grandTotal, 0))}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillGeneration;
