import React, { useEffect, useState } from 'react';
import './DeliveryAssignedSellRequests.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function authHeaders() {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

const DeliveryAssignedSellRequests = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('scheduledAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch delivery tasks and fallback sell-requests assignments in parallel
      const [tasksRes, assignedReqRes] = await Promise.all([
        fetch(`${API}/api/delivery/my`, { headers: authHeaders(), cache: 'no-cache' }).catch(() => null),
        fetch(`${API}/api/sell-requests/delivery/my-assigned`, { headers: authHeaders(), cache: 'no-cache' }).catch(() => null)
      ]);

      // Normalize delivery tasks
      let tasks = [];
      if (tasksRes && tasksRes.ok) {
        const data = await tasksRes.json();
        tasks = Array.isArray(data) ? data : [];
      }

      // Normalize assigned sell-requests
      let assigned = [];
      if (assignedReqRes && assignedReqRes.ok) {
        const data = await assignedReqRes.json();
        const list = Array.isArray(data?.records) ? data.records : (Array.isArray(data) ? data : []);
        assigned = list.map(r => ({
          _id: `sr_${r._id}`,
          title: r._type ? `${r._type} Pickup` : (r.barrelCount != null ? `Sell Request Pickup (${r.barrelCount})` : 'Sell Request Pickup'),
          status: r.status || 'DELIVER_ASSIGNED',
          scheduledAt: r.assignedAt || r.updatedAt || r.createdAt,
          createdAt: r.createdAt,
          customerUserId: r.customerUserId || { name: 'Unknown Customer' },
          barrelCount: r.barrelCount || 0,
          priority: r.priority || 'medium',
          location: r.location || 'Not specified',
          phone: r.customerUserId?.phone || 'Not provided'
        }));
      }

      const merged = [...tasks, ...assigned];
      setRows(merged);
    } catch (e) {
      setError(e?.message || 'Failed to load assigned requests');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
  }, []);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(() => { 
      load(); 
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const updateTaskStatus = async (taskId, newStatus) => {
    setBusyId(taskId);
    try {
      const response = await fetch(`${API}/api/delivery/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await load(); // Refresh the list
      } else {
        setError('Failed to update task status');
      }
    } catch (e) {
      setError(e?.message || 'Failed to update task');
    } finally {
      setBusyId('');
    }
  };

  const markDeliveredToLab = async (sellRequestId) => {
    // Extract the actual ID (remove sr_ prefix if present)
    const actualId = sellRequestId.startsWith('sr_') ? sellRequestId.substring(3) : sellRequestId;
    
    setBusyId(sellRequestId);
    try {
      const response = await fetch(`${API}/api/sell-requests/${actualId}/delivered-to-lab`, {
        method: 'PUT',
        headers: authHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Successfully delivered to lab!\n\nIntake ID: ${data.intakeId}\nThe lab will now see this in their incoming requests.`);
        await load(); // Refresh the list
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.message || 'Failed to mark as delivered to lab');
      }
    } catch (e) {
      setError(e?.message || 'Failed to mark as delivered to lab');
    } finally {
      setBusyId('');
    }
  };

  // Filter and sort rows
  const filteredRows = rows
    .filter(row => {
      if (filter !== 'all' && row.status !== filter) return false;
      if (searchTerm && !row.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getStatusColor = (status) => {
    const colors = {
      'assigned': '#fbbf24',
      'in_progress': '#3b82f6',
      'completed': '#10b981',
      'DELIVER_ASSIGNED': '#f59e0b',
      'DELIVERED': '#10b981'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusText = (status) => {
    const texts = {
      'assigned': 'Assigned',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'DELIVER_ASSIGNED': 'Assigned for Delivery',
      'DELIVERED': 'Delivered'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="delivery-assigned-requests">
        <div className="loading-container">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading assigned requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="delivery-assigned-requests">
      <div className="page-header">
        <h2>
          <i className="fas fa-clipboard-list"></i>
          Assigned Requests
        </h2>
        <button onClick={load} className="refresh-btn" disabled={loading}>
          <i className="fas fa-sync-alt"></i>
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
          <button onClick={() => setError('')} className="close-error">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className="filters-section">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="DELIVER_ASSIGNED">Delivery Assigned</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search requests..."
          />
        </div>

        <div className="filter-group">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="scheduledAt">Scheduled Date</option>
            <option value="createdAt">Created Date</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="sort-order-btn"
          >
            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
          </button>
        </div>
      </div>

      <div className="requests-list">
        {filteredRows.length === 0 ? (
          <div className="no-data">
            <i className="fas fa-inbox"></i>
            <h3>No Assigned Requests</h3>
            <p>You don't have any assigned requests at the moment.</p>
          </div>
        ) : (
          filteredRows.map((row) => (
            <div key={row._id} className="request-card">
              <div className="card-header">
                <div className="request-title">
                  <h3>{row.title}</h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(row.status) }}
                  >
                    {getStatusText(row.status)}
                  </span>
                </div>
                <div className="request-date">
                  {row.scheduledAt ? new Date(row.scheduledAt).toLocaleDateString() : 'No date'}
                </div>
              </div>

              <div className="card-body">
                <div className="request-details">
                  <div className="detail-item">
                    <i className="fas fa-user"></i>
                    <span>Customer: {row.customerUserId?.name || 'Unknown'}</span>
                  </div>
                  {row.phone && (
                    <div className="detail-item">
                      <i className="fas fa-phone"></i>
                      <span>Phone: {row.phone}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>Location: {row.location}</span>
                  </div>
                  {row.barrelCount > 0 && (
                    <div className="detail-item">
                      <i className="fas fa-drum"></i>
                      <span>Barrels: {row.barrelCount}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card-actions">
                {row.status === 'assigned' && (
                  <button
                    onClick={() => updateTaskStatus(row._id, 'in_progress')}
                    disabled={busyId === row._id}
                    className="btn btn-primary"
                  >
                    {busyId === row._id ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-play"></i>
                    )}
                    Start Task
                  </button>
                )}
                {row.status === 'in_progress' && (
                  <button
                    onClick={() => updateTaskStatus(row._id, 'completed')}
                    disabled={busyId === row._id}
                    className="btn btn-success"
                  >
                    {busyId === row._id ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-check"></i>
                    )}
                    Complete Task
                  </button>
                )}
                {(row.status === 'DELIVER_ASSIGNED' || row.status === 'COLLECTED') && row._id.startsWith('sr_') && (
                  <button
                    onClick={() => markDeliveredToLab(row._id)}
                    disabled={busyId === row._id}
                    className="btn btn-success"
                    style={{ backgroundColor: '#10b981' }}
                  >
                    {busyId === row._id ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-flask"></i>
                    )}
                    Mark Delivered to Lab
                  </button>
                )}
                <button className="btn btn-secondary">
                  <i className="fas fa-map"></i>
                  View Location
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DeliveryAssignedSellRequests;