import React, { useState, useEffect } from 'react';
import { FiBook, FiSearch, FiFilter, FiDownload, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiClock, FiPackage } from 'react-icons/fi';
import './BarrelIssueRegister.css';

const BarrelIssueRegister = () => {
  const [registers, setRegisters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Return modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedRegisters, setSelectedRegisters] = useState([]);
  const [returnCondition, setReturnCondition] = useState('GOOD');
  const [returnNotes, setReturnNotes] = useState('');
  
  // Message
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    loadData();
  }, [statusFilter, currentPage, dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRegisters(),
        loadStatistics()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('❌ Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const loadRegisters = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter.toUpperCase());
      }

      if (dateRange !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (dateRange) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          default:
            startDate = null;
        }

        if (startDate) {
          params.append('startDate', startDate.toISOString());
        }
      }

      const response = await fetch(`${API_URL}/api/barrel-issue-register?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRegisters(data.entries || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalRecords(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error loading registers:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/barrel-issue-register/statistics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleReturnBarrels = async () => {
    if (selectedRegisters.length === 0) {
      showNotification('⚠️ Please select barrels to return');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/barrel-issue-register/return`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          registerIds: selectedRegisters,
          returnCondition,
          returnNotes
        })
      });

      if (response.ok) {
        const data = await response.json();
        showNotification(`✅ Successfully returned ${data.returnedEntries.length} barrel(s)`);
        setShowReturnModal(false);
        setSelectedRegisters([]);
        setReturnNotes('');
        await loadData();
      } else {
        const error = await response.json();
        showNotification(`❌ ${error.message || 'Failed to return barrels'}`);
      }
    } catch (error) {
      console.error('Error returning barrels:', error);
      showNotification('❌ Error returning barrels');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg) => {
    setMessage(msg);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 4000);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'ISSUED': { color: '#10b981', icon: <FiCheckCircle />, text: 'Issued' },
      'RETURNED': { color: '#3b82f6', icon: <FiCheckCircle />, text: 'Returned' },
      'OVERDUE': { color: '#ef4444', icon: <FiAlertCircle />, text: 'Overdue' },
      'LOST': { color: '#6b7280', icon: <FiAlertCircle />, text: 'Lost' }
    };
    return badges[status] || badges['ISSUED'];
  };

  const filteredRegisters = registers.filter(reg => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      reg.registerId?.toLowerCase().includes(search) ||
      reg.barrelId?.toLowerCase().includes(search) ||
      reg.userNameSnapshot?.toLowerCase().includes(search) ||
      reg.userEmailSnapshot?.toLowerCase().includes(search)
    );
  });

  const toggleSelectRegister = (registerId) => {
    setSelectedRegisters(prev => 
      prev.includes(registerId)
        ? prev.filter(id => id !== registerId)
        : [...prev, registerId]
    );
  };

  const exportToCSV = () => {
    const headers = ['Register ID', 'User', 'Barrel ID', 'Issue Date', 'Expected Return', 'Actual Return', 'Status', 'Days Overdue', 'Penalty'];
    const rows = filteredRegisters.map(reg => [
      reg.registerId,
      reg.userNameSnapshot,
      reg.barrelId,
      new Date(reg.issueDate).toLocaleDateString('en-GB'),
      new Date(reg.expectedReturnDate).toLocaleDateString('en-GB'),
      reg.actualReturnDate ? new Date(reg.actualReturnDate).toLocaleDateString('en-GB') : '-',
      reg.status,
      reg.daysOverdue || 0,
      reg.penaltyAmount || 0
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barrel-register-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="barrel-register">
      {/* Success Message */}
      {showMessage && (
        <div className="success-message">
          {message}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1><FiBook /> Barrel Issue Register</h1>
          <p>Complete transaction ledger for barrel assignments and returns</p>
        </div>
        <button className="btn-refresh" onClick={loadData} disabled={loading}>
          <FiRefreshCw /> {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="statistics-grid">
          <div className="stat-card issued">
            <div className="stat-icon"><FiPackage /></div>
            <div className="stat-content">
              <div className="stat-value">{statistics.totalIssued}</div>
              <div className="stat-label">Currently Issued</div>
            </div>
          </div>
          <div className="stat-card returned">
            <div className="stat-icon"><FiCheckCircle /></div>
            <div className="stat-content">
              <div className="stat-value">{statistics.totalReturned}</div>
              <div className="stat-label">Total Returned</div>
            </div>
          </div>
          <div className="stat-card overdue">
            <div className="stat-icon"><FiAlertCircle /></div>
            <div className="stat-content">
              <div className="stat-value">{statistics.totalOverdue}</div>
              <div className="stat-label">Overdue</div>
            </div>
          </div>
          <div className="stat-card penalties">
            <div className="stat-icon"><FiClock /></div>
            <div className="stat-content">
              <div className="stat-value">${statistics.totalPenalties}</div>
              <div className="stat-label">Total Penalties</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="controls-section">
        <div className="filters">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by Register ID, Barrel ID, or User..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="issued">Issued</option>
            <option value="returned">Returned</option>
            <option value="overdue">Overdue</option>
            <option value="lost">Lost</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>

        <div className="actions">
          {selectedRegisters.length > 0 && (
            <button
              className="btn-return"
              onClick={() => setShowReturnModal(true)}
            >
              <FiCheckCircle /> Return Selected ({selectedRegisters.length})
            </button>
          )}
          <button className="btn-export" onClick={exportToCSV}>
            <FiDownload /> Export CSV
          </button>
        </div>
      </div>

      {/* Register Table */}
      <div className="register-table-container">
        {loading ? (
          <div className="loading-state">
            <FiRefreshCw className="spin" />
            <p>Loading register entries...</p>
          </div>
        ) : filteredRegisters.length === 0 ? (
          <div className="empty-state">
            <FiBook size={64} />
            <h3>No Register Entries</h3>
            <p>No barrel issue records found matching your filters</p>
          </div>
        ) : (
          <>
            <table className="register-table">
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          const issuedIds = filteredRegisters
                            .filter(r => r.status === 'ISSUED' || r.status === 'OVERDUE')
                            .map(r => r.registerId);
                          setSelectedRegisters(issuedIds);
                        } else {
                          setSelectedRegisters([]);
                        }
                      }}
                      checked={selectedRegisters.length > 0 && selectedRegisters.length === filteredRegisters.filter(r => r.status === 'ISSUED' || r.status === 'OVERDUE').length}
                    />
                  </th>
                  <th>Register ID</th>
                  <th>User</th>
                  <th>Barrel ID</th>
                  <th>Issue Date</th>
                  <th>Expected Return</th>
                  <th>Actual Return</th>
                  <th>Status</th>
                  <th>Days Overdue</th>
                  <th>Penalty</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegisters.map((reg) => {
                  const statusBadge = getStatusBadge(reg.status);
                  const canReturn = reg.status === 'ISSUED' || reg.status === 'OVERDUE';
                  
                  return (
                    <tr key={reg._id} className={reg.status === 'OVERDUE' ? 'overdue-row' : ''}>
                      <td className="checkbox-col">
                        {canReturn && (
                          <input
                            type="checkbox"
                            checked={selectedRegisters.includes(reg.registerId)}
                            onChange={() => toggleSelectRegister(reg.registerId)}
                          />
                        )}
                      </td>
                      <td className="register-id">
                        <span className="id-badge">{reg.registerId}</span>
                      </td>
                      <td>
                        <div className="user-cell">
                          <strong>{reg.userNameSnapshot}</strong>
                          <span className="email">{reg.userEmailSnapshot}</span>
                        </div>
                      </td>
                      <td>
                        <span className="barrel-id-chip">{reg.barrelId}</span>
                      </td>
                      <td>
                        <div className="date-cell">
                          <div>{new Date(reg.issueDate).toLocaleDateString('en-GB')}</div>
                          <span className="time">{new Date(reg.issueDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="admin-name">By: {reg.issuedByAdminName}</span>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          {new Date(reg.expectedReturnDate).toLocaleDateString('en-GB')}
                        </div>
                      </td>
                      <td>
                        {reg.actualReturnDate ? (
                          <div className="date-cell">
                            <div>{new Date(reg.actualReturnDate).toLocaleDateString('en-GB')}</div>
                            <span className="time">{new Date(reg.actualReturnDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                            {reg.returnedByAdminName && (
                              <span className="admin-name">By: {reg.returnedByAdminName}</span>
                            )}
                            {reg.returnCondition && (
                              <span className={`condition-badge ${reg.returnCondition.toLowerCase()}`}>
                                {reg.returnCondition}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="not-returned">-</span>
                        )}
                      </td>
                      <td>
                        <div
                          className="status-badge"
                          style={{ background: statusBadge.color }}
                        >
                          {statusBadge.icon}
                          <span>{statusBadge.text}</span>
                        </div>
                      </td>
                      <td className="overdue-cell">
                        {reg.daysOverdue > 0 ? (
                          <span className="overdue-days">{reg.daysOverdue} days</span>
                        ) : (
                          <span className="on-time">-</span>
                        )}
                      </td>
                      <td className="penalty-cell">
                        {reg.penaltyAmount > 0 ? (
                          <span className="penalty-amount">${reg.penaltyAmount}</span>
                        ) : (
                          <span className="no-penalty">$0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
              <div className="pagination-info">
                Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalRecords)} of {totalRecords} entries
              </div>
              <div className="pagination-controls">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="page-number">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Return Modal */}
      {showReturnModal && (
        <div className="modal-overlay" onClick={() => setShowReturnModal(false)}>
          <div className="return-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FiCheckCircle /> Return Barrels</h2>
              <button className="close-btn" onClick={() => setShowReturnModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <p className="modal-description">
                You are returning <strong>{selectedRegisters.length}</strong> barrel(s).
              </p>

              <div className="form-group">
                <label>Return Condition *</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="form-select"
                >
                  <option value="GOOD">Good Condition</option>
                  <option value="FAIR">Fair Condition</option>
                  <option value="DAMAGED">Damaged</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>

              <div className="form-group">
                <label>Return Notes</label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Add any notes about the return condition..."
                  rows="4"
                  className="form-textarea"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowReturnModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={handleReturnBarrels}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarrelIssueRegister;
