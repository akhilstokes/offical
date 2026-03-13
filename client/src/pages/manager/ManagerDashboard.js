import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import './ManagerDashboard.css';
import '../user_dashboard/userDashboardTheme.css';



const ManagerDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    attendance: {
      today: { present: 0, absent: 0, late: 0, unverified: 0 },
      week: { present: 0, absences: 0 },
      stats: { totalRecords: 0, verifiedRecords: 0, unverifiedRecords: 0 }
    },
    bills: {
      pending: 0,
      totalAmount: 0,
      byCategory: []
    },
    rates: {
      pending: 0,
      latest: []
    },
    stock: {
      summary: null,
      alerts: []
    }
  });
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  const config = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // Load data with staggered requests to avoid rate limiting
      const attendanceRes = await axios.get(`${base}/api/workers/attendance/summary/today`, config);
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      
      const attendanceStatsRes = await axios.get(`${base}/api/workers/attendance/stats`, config);
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      
      const billsRes = await axios.get(`${base}/api/bills/manager/pending`, config);
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      
      const ratesRes = await axios.get(`${base}/api/daily-rates/admin/pending`, config);
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      
      const stockRes = await axios.get(`${base}/api/stock/summary`, config);

      setDashboardData({
        attendance: {
          today: attendanceRes.data || { present: 0, absent: 0, late: 0 },
          week: { present: 0, absences: 0 }, // Will be loaded separately
          stats: attendanceStatsRes.data || { totalRecords: 0, verifiedRecords: 0, unverifiedRecords: 0 }
        },
        bills: {
          pending: billsRes.data?.total || 0,
          totalAmount: billsRes.data?.bills?.reduce((sum, bill) => sum + bill.requestedAmount, 0) || 0,
          byCategory: billsRes.data?.stats || []
        },
        rates: {
          pending: ratesRes.data?.total || 0,
          latest: ratesRes.data?.rates || []
        },
        stock: {
          summary: stockRes.data || null,
          alerts: [] // Will be implemented based on stock thresholds
        }
      });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [base, config]);

  useEffect(() => {
    loadDashboardData();
    // Reload dashboard data every 5 minutes to avoid rate limiting
    const interval = setInterval(loadDashboardData, 300000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  useEffect(() => {
    const loadNotifs = async () => {
      try {
        // Check if user is authenticated before making the request
        if (!token) {
          console.log('No authentication token found, skipping notifications');
          setNotifs([]);
          setUnread(0);
          return;
        }

        const res = await fetch(`${base}/api/notifications?limit=10`, { headers: config });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data?.notifications) ? data.notifications : (Array.isArray(data) ? data : []);
          setNotifs(list);
          setUnread(Number(data?.unread || (list.filter(n=>!n.read).length)));
        } else if (res.status === 401) {
          // Unauthorized - user needs to login
          console.log('User not authenticated, redirecting to login');
          navigate('/login');
          return;
        } else if (res.status === 429) {
          // Rate limited - don't spam console, just skip this update
          console.log('Notifications rate limited, will retry later');
          return;
        } else {
          setNotifs([]);
          setUnread(0);
        }
      } catch (error) {
        // Only log non-rate-limit errors
        if (!error.message?.includes('429')) {
          console.error('Error loading notifications:', error);
        }
        setNotifs([]);
        setUnread(0);
      }
    };
    loadNotifs();
    // Reduced frequency to avoid rate limiting (every 2 minutes instead of 30 seconds)
    const id = setInterval(loadNotifs, 120000);
    return () => clearInterval(id);
  }, [base, config, token, navigate]);

  const markRead = async (id) => {
    try {
      const res = await fetch(`${base}/api/notifications/${id}/read`, { method: 'PATCH', headers: config });
      if (res.ok) {
        setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        setUnread(u => Math.max(0, u - 1));
      }
    } catch {}
  };


  // Format notification metadata in a user-friendly way
  const formatMetadata = (meta) => {
    if (!meta) return null;
    
    const friendlyLabels = {
      sampleId: 'Sample ID',
      customerName: 'Customer',
      calculatedAmount: 'Amount',
      marketRate: 'Market Rate',
      companyRate: 'Company Rate',
      quantity: 'Quantity',
      drcPercentage: 'DRC %',
      requestId: 'Request ID',
      barrelCount: 'Barrel Count',
      customer: 'Customer',
      receivedAt: 'Received At',
      workerId: 'Worker ID',
      billId: 'Bill ID'
    };

    return Object.entries(meta)
      .filter(([k, v]) => v !== undefined && v !== null && v !== '')
      .map(([key, value]) => ({
        label: friendlyLabels[key] || key.replace(/([A-Z])/g, ' $1').trim(),
        value: String(value)
      }));
  };

  // Get notification icon based on title/type
  const getNotificationIcon = (title) => {
    if (!title) return '📋';
    const lower = title.toLowerCase();
    if (lower.includes('billing') || lower.includes('latex')) return '💰';
    if (lower.includes('drc') || lower.includes('test')) return '🧪';
    if (lower.includes('attendance')) return '👥';
    if (lower.includes('leave')) return '📅';
    if (lower.includes('bill') || lower.includes('payment')) return '💳';
    if (lower.includes('stock') || lower.includes('inventory')) return '📦';
    if (lower.includes('rate')) return '💹';
    if (lower.includes('delivery')) return '🚚';
    return '📋';
  };


  return (
    <div className="user-dashboard">
      <div className="userdash-header">
        <div className="userdash-title">
          <h2>Manager Dashboard</h2>
          <p>Real-time overview of operations, stock, and staff activity.</p>
        </div>
        <div className="userdash-header-actions">
          <button type="button" className="btn-secondary" onClick={loadDashboardData} disabled={loading}>
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            <span>Refresh All Data</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert error">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Stats Row */}
      <div className="userdash-stats-row">
        <div className="userdash-stat-card">
          <div className="userdash-stat-content">
            <div className="userdash-stat-icon-wrapper wallet">
              <i className="fas fa-users"></i>
            </div>
            <div className="userdash-stat-info">
              <span className="userdash-stat-label">Daily Attendance</span>
              <h3 className="userdash-stat-value">{dashboardData.attendance.today.present} Workers Present</h3>
            </div>
          </div>
          <div className="userdash-stat-link" onClick={() => navigate('/manager/attendance')} style={{ cursor: 'pointer' }}>
            <span>{dashboardData.attendance.stats.unverifiedRecords} Unverified Records</span>
            <i className="fas fa-chevron-right"></i>
          </div>
        </div>

        <div className="userdash-stat-card">
          <div className="userdash-stat-content">
            <div className="userdash-stat-icon-wrapper alert">
              <i className="fas fa-file-invoice-dollar"></i>
            </div>
            <div className="userdash-stat-info">
              <span className="userdash-stat-label">Pending Reviews</span>
              <h3 className="userdash-stat-value">{dashboardData.bills.pending} Bills to Verify</h3>
            </div>
          </div>
          <div className="userdash-stat-link" onClick={() => navigate('/manager/bill-verification')} style={{ cursor: 'pointer' }}>
            <span>Total Value: ₹{dashboardData.bills.totalAmount.toLocaleString()}</span>
            <i className="fas fa-chevron-right"></i>
          </div>
        </div>

        <div className="userdash-stat-card">
          <div className="userdash-stat-content">
            <div className="userdash-stat-icon-wrapper rate">
              <i className="fas fa-boxes"></i>
            </div>
            <div className="userdash-stat-info">
              <span className="userdash-stat-label">Current Stock</span>
              <h3 className="userdash-stat-value">{dashboardData.stock.summary?.latexLiters || 0}L Latex</h3>
            </div>
          </div>
          <div className="userdash-stat-link" onClick={() => navigate('/manager/stock')} style={{ cursor: 'pointer' }}>
            <span>{dashboardData.stock.summary?.rubberBandUnits || 0} Rubber Band Units</span>
            <i className="fas fa-chevron-right"></i>
          </div>
        </div>
      </div>

      <div className="userdash-content-grid">
        {/* Left Main Column: Quick Actions */}
        <div className="userdash-main-col">
          <div className="userdash-section-label">
            <h3>Operational Controls</h3>
            <div className="section-divider"></div>
          </div>

          <div className="userdash-grid">
            <div className="userdash-card" onClick={() => navigate('/manager/sell-requests')} style={{ cursor: 'pointer' }}>
              <div className="userdash-card-icon support">
                <i className="fas fa-handshake"></i>
              </div>
              <div className="userdash-card-body">
                <div className="userdash-card-title">Sell Requests</div>
                <div className="userdash-card-desc">Approve or reject customer barrel selling requests.</div>
              </div>
              <div className="userdash-card-cta">
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>

            <div className="userdash-card" onClick={() => navigate('/manager/barrel-allocation')} style={{ cursor: 'pointer' }}>
              <div className="userdash-card-icon profile">
                <i className="fas fa-truck-loading"></i>
              </div>
              <div className="userdash-card-body">
                <div className="userdash-card-title">Pickup Dispatch</div>
                <div className="userdash-card-desc">Assign field staff for collection tasks and deliveries.</div>
              </div>
              <div className="userdash-card-cta">
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>

            <div className="userdash-card" onClick={() => navigate('/manager/bill-verification')} style={{ cursor: 'pointer' }}>
              <div className="userdash-card-icon transactions">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="userdash-card-body">
                <div className="userdash-card-title">Verify Bills</div>
                <div className="userdash-card-desc">Final audit of bills before payment processing.</div>
              </div>
              <div className="userdash-card-cta">
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>

            <div className="userdash-card" onClick={() => navigate('/manager/shifts')} style={{ cursor: 'pointer' }}>
              <div className="userdash-card-icon notifications">
                <i className="fas fa-clock"></i>
              </div>
              <div className="userdash-card-body">
                <div className="userdash-card-title">Shift Planning</div>
                <div className="userdash-card-desc">Manage staff attendance and weekly work schedules.</div>
              </div>
              <div className="userdash-card-cta">
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>

            <div className="userdash-card" onClick={() => navigate('/manager/expenses')} style={{ cursor: 'pointer' }}>
              <div className="userdash-card-icon sell">
                <i className="fas fa-wallet"></i>
              </div>
              <div className="userdash-card-body">
                <div className="userdash-card-title">Expenses</div>
                <div className="userdash-card-desc">Track and approve operational expense claims.</div>
              </div>
              <div className="userdash-card-cta">
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>

            <div className="userdash-card" onClick={() => navigate('/manager/complaints')} style={{ cursor: 'pointer' }}>
              <div className="userdash-card-icon support">
                <i className="fas fa-headset"></i>
              </div>
              <div className="userdash-card-body">
                <div className="userdash-card-title">Complaints</div>
                <div className="userdash-card-desc">Resolve issues reported by customers or staff.</div>
              </div>
              <div className="userdash-card-cta">
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Column: Notifications */}
        <div className="userdash-side-col">
          <div className="dash-card">
            <div className="card-header" style={{ padding: '20px 24px' }}>
              <h3><i className="fas fa-bell"></i> Recent Activity</h3>
              <span className="badge status-pending">{unread} New</span>
            </div>
            
            {notifs.length === 0 ? (
              <div className="no-data" style={{ padding: '60px 20px' }}>
                <i className="fas fa-bell-slash" style={{ fontSize: '2rem', color: '#e2e8f0', marginBottom: '16px', display: 'block' }}></i>
                <span>No new updates</span>
              </div>
            ) : (
              <div className="notifications-list" style={{ padding: '0 16px 16px' }}>
                {notifs.slice(0, 6).map((n) => (
                  <div 
                    key={n._id} 
                    className={`notification-item ${!n.read ? 'unread' : ''}`}
                    onClick={() => markRead(n._id)}
                    style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div className="notification-icon" style={{ fontSize: '1.2rem', width: '32px', height: '32px' }}>
                        {getNotificationIcon(n.title)}
                      </div>
                      <div className="notification-content" style={{ flex: 1 }}>
                        <div className="notification-title" style={{ fontSize: '0.95rem' }}>{n.title}</div>
                        <div className="notification-message" style={{ fontSize: '0.85rem', color: '#64748b' }}>{n.message}</div>
                        <div className="notification-time" style={{ marginTop: '4px', fontSize: '0.75rem' }}>
                          {new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
              <button className="btn-secondary" onClick={() => navigate('/manager/notifications')} style={{ width: '100%', fontSize: '0.85rem' }}>
                View All Notifications
              </button>
            </div>
          </div>

          <div className="dash-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: 'none' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#2563eb', fontWeight: '800' }}>System Status</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.1)' }}></div>
              <span style={{ fontSize: '0.9rem', color: '#1e40af', fontWeight: '700' }}>Server Online</span>
            </div>
            <p style={{ margin: '12px 0 0 0', fontSize: '0.85rem', color: '#3b82f6', lineHeight: '1.5', fontWeight: '500' }}>
              All modules are functioning normally. Last sync was successful.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
