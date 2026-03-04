import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMyTasks, updateStatus } from '../../services/deliveryService';
import './DeliveryDashboard.css';

const StatusBadge = ({ s }) => (
  <span className={`badge status-${String(s).replace(/_/g,'-')}`}>{s}</span>
);

const DeliveryDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [barrelDeliveries, setBarrelDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shiftInfo, setShiftInfo] = useState(null);
  const [todayEarnings, setTodayEarnings] = useState(null);
  const navigate = useNavigate();

  const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 
      Authorization: `Bearer ${token}`, 
      'Content-Type': 'application/json' 
    } : { 
      'Content-Type': 'application/json' 
    };
  };

  const load = async () => {
    try { 
      // Load delivery tasks, assigned sell requests, barrel deliveries, and earnings
      const [deliveryTasks, assignedRequests, barrelDeliveryTasks] = await Promise.all([
        loadDeliveryTasks(),
        loadAssignedSellRequests(),
        loadBarrelDeliveries()
      ]);
      
      // Combine delivery tasks and sell requests
      const allTasks = [...deliveryTasks, ...assignedRequests];
      setTasks(allTasks);
      setBarrelDeliveries(barrelDeliveryTasks);
      
      // Load shift info and earnings separately
      await Promise.all([
        loadShiftInfo(),
        loadTodayEarnings()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setTasks([]);
      setBarrelDeliveries([]);
    } finally { 
      setLoading(false); 
    }
  };

  const loadBarrelDeliveries = async () => {
    try {
      const response = await fetch(`${API}/api/barrels/my-delivery-tasks`, {
        headers: authHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        return data.tasks || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading barrel deliveries:', error);
      return [];
    }
  };

  const loadDeliveryTasks = async () => {
    try {
      const tasks = await listMyTasks();
      return tasks;
    } catch (error) {
      console.error('Error loading delivery tasks:', error);
      return [];
    }
  };

  const loadAssignedSellRequests = async () => {
    try {
      const response = await fetch(`${API}/api/sell-requests/delivery/my-assigned`, {
        headers: authHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const assigned = Array.isArray(data?.records) ? data.records : (Array.isArray(data) ? data : []);
        // Filter out completed intakes - check for DELIVERED_TO_LAB status
        return assigned
          .filter(r => {
            const status = (r.status || '').toUpperCase();
            // Exclude if already delivered to lab or intake completed
            return status !== 'DELIVERED_TO_LAB' && status !== 'INTAKE_COMPLETED';
          })
          .map(r => ({
            _id: `sr_${r._id}`,
            title: r._type ? `${r._type} Pickup` : (r.barrelCount != null ? `Sell Request Pickup (${r.barrelCount})` : 'Sell Request Pickup'),
            status: r.status || 'DELIVER_ASSIGNED',
            scheduledAt: r.assignedAt || r.updatedAt || r.createdAt,
            createdAt: r.createdAt,
            customerUserId: r.farmerId,
            pickupAddress: r.notes || r.capturedAddress || r.farmerId?.location || 'Customer pickup location',
            dropAddress: 'HFP Lab / Yard',
            meta: {
              barrelCount: r.barrelCount,
              sellRequestId: r._id
            },
            isSellRequest: true
          }));
      }
      return [];
    } catch (error) {
      console.error('Error loading assigned sell requests:', error);
      return [];
    }
  };

  const loadShiftInfo = async () => {
    try {
      const response = await fetch(`${API}/api/delivery/shift-schedule`, {
        headers: authHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setShiftInfo(data.myAssignment);
      }
    } catch (error) {
      console.error('Error loading shift info:', error);
    }
  };

  const loadTodayEarnings = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${API}/api/wages/my-wages?date=${today}`, {
        headers: authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Wages data:', data);
        
        // Calculate today's total - handle different response formats
        let todayTotal = 0;
        
        if (Array.isArray(data)) {
          // If data is directly an array
          todayTotal = data
            .filter(w => w.date && w.date.startsWith(today))
            .reduce((sum, w) => sum + (w.totalAmount || w.amount || 0), 0);
        } else if (data.wages && Array.isArray(data.wages)) {
          // If data has wages property
          todayTotal = data.wages
            .filter(w => w.date && w.date.startsWith(today))
            .reduce((sum, w) => sum + (w.totalAmount || w.amount || 0), 0);
        } else if (data.totalAmount !== undefined) {
          // If data has direct totalAmount
          todayTotal = data.totalAmount;
        }
        
        console.log('Today total earnings:', todayTotal);
        setTodayEarnings(todayTotal);
      } else {
        console.log('Wages API response not ok:', response.status);
        setTodayEarnings(0);
      }
    } catch (error) {
      console.error('Error loading today earnings:', error);
      setTodayEarnings(0);
    }
  };

  useEffect(() => { 
    load(); 
  }, []);

  // Auto-refresh when page becomes visible (user returns from barrel intake)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Dashboard became visible, refreshing data...');
        load();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refresh when window gains focus
    const handleFocus = () => {
      console.log('Window gained focus, refreshing data...');
      load();
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const quickAction = async (t, next) => {
    await updateStatus(t._id, { status: next });
    await load();
  };

  const deliverToLab = async (t) => {
    try {
      // follow allowed transitions to avoid 400s
      const order = ['pickup_scheduled','enroute_pickup','picked_up','enroute_drop','delivered'];
      const idx = Math.max(order.indexOf(t.status), 0);
      for (let i = idx + 1; i < order.length; i++) {
        await updateStatus(t._id, { status: order[i] });
      }
      const sellReqId = t?.meta?.sellRequestId;
      if (sellReqId) {
        try { 
          await fetch(`${API}/api/sell-requests/${sellReqId}/deliver-to-lab`, { 
            method: 'PUT', 
            headers: authHeaders() 
          }); 
        } catch (err) {
          console.error('Error updating sell request:', err);
        }
      }
      // Notify lab staff instead of navigating to lab pages
      try {
        const customer = t?.customerUserId?.name || t?.customerUserId?.email || '';
        const count = t?.meta?.barrelCount ?? '';
        const sampleId = sellReqId || t?._id;
        await fetch(`${API}/api/notifications/staff-trip-event`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            title: 'Delivery to Lab',
            message: `Sample ${String(sampleId)} delivered by delivery staff`,
            link: '/lab/check-in',
            meta: {
              sampleId: String(sampleId),
              sellRequestId: sellReqId || undefined,
              intakeId: !sellReqId ? String(t?._id) : undefined,
              barrelCount: String(count),
              customer,
              barrels: Array.isArray(t?.meta?.barrels) ? t.meta.barrels.map(id => ({ barrelId: id })) : undefined
            },
            targetRole: 'lab'
          })
        });
      } catch (err) {
        console.error('Error sending notification:', err);
      }
      await load();
      alert('Delivered to lab successfully. Lab staff has been notified.');
    } catch (error) {
      console.error('Error in deliverToLab:', error);
      alert('Failed to mark as delivered to lab. Please try again.');
    }
  };

  const handleSellRequestAction = async (t, action) => {
    try {
      if (action === 'start_pickup') {
        // Update sell request status to indicate pickup started
        const response = await fetch(`${API}/api/sell-requests/${t.meta.sellRequestId}/status`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ status: 'PICKUP_STARTED' })
        });
        if (response.ok) {
          await load(); // Reload to show updated status
        }
      } else if (action === 'mark_picked') {
        // Mark as collected
        const response = await fetch(`${API}/api/sell-requests/${t.meta.sellRequestId}/collected`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ 
            totalVolumeKg: t.meta.barrelCount || 0,
            notes: 'Collected by delivery staff'
          })
        });
        if (response.ok) {
          await load(); // Reload to show updated status
        }
      } else if (action === 'deliver_to_lab') {
        // Mark as delivered to lab
        const response = await fetch(`${API}/api/sell-requests/${t.meta.sellRequestId}/delivered-to-lab`, {
          method: 'PUT',
          headers: authHeaders()
        });
        if (response.ok) {
          await load(); // Reload to show updated status
        }
      }
    } catch (error) {
      console.error('Error handling sell request action:', error);
      alert('Failed to update sell request status');
    }
  };

  return (
    <div className="delivery-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0 }}>Delivery Dashboard</h2>
        
        {/* Today's Earnings Badge - Always show */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          minWidth: '140px'
        }}>
          <i className="fas fa-rupee-sign" style={{ fontSize: '14px' }}></i>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.9 }}>Today's Earnings</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {todayEarnings !== null ? `₹${todayEarnings.toFixed(2)}` : 'Loading...'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Shift Information */}
      {shiftInfo && (
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
            <i className="fas fa-clock" style={{ marginRight: '6px' }}></i>
            Today's Shift: {shiftInfo.name}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div>
              <div style={{ opacity: 0.9, marginBottom: '4px' }}>Start</div>
              <div style={{ fontWeight: 'bold' }}>{shiftInfo.startTime}</div>
            </div>
            <div>
              <div style={{ opacity: 0.9, marginBottom: '4px' }}>End</div>
              <div style={{ fontWeight: 'bold' }}>{shiftInfo.endTime}</div>
            </div>
          </div>
        </div>
      )}

      {/* Barrel Deliveries Section */}
      {barrelDeliveries.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-truck" style={{ color: '#3b82f6' }}></i>
              Barrel Deliveries
              <span style={{ 
                background: '#3b82f6', 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: '12px', 
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {barrelDeliveries.filter(d => d.deliveryStatus !== 'delivered').length}
              </span>
            </h3>
            <button 
              className="btn-secondary"
              onClick={() => navigate('/delivery/barrel-deliveries')}
            >
              View All <i className="fas fa-arrow-right"></i>
            </button>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '12px' 
          }}>
            {barrelDeliveries.slice(0, 3).map(delivery => (
              <div key={delivery._id} style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                    #{delivery._id.slice(-6)}
                  </span>
                  <span className="badge" style={{
                    background: delivery.deliveryStatus === 'delivered' ? '#d1fae5' : '#fef3c7',
                    color: delivery.deliveryStatus === 'delivered' ? '#065f46' : '#92400e'
                  }}>
                    {delivery.deliveryStatus === 'delivered' ? 'Delivered' : 'Pending'}
                  </span>
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                    {delivery.user?.name || 'Unknown Customer'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {delivery.quantity} barrel(s)
                  </div>
                </div>
                
                <button 
                  className="btn"
                  onClick={() => {
                    const customer = delivery.user?.name || 'Unknown Customer';
                    const phone = delivery.user?.phoneNumber || '';
                    const count = delivery.quantity || '1';
                    const taskId = delivery._id || '';
                    const requestId = delivery.requestId || '';
                    
                    const qs = new URLSearchParams();
                    qs.set('customerName', String(customer));
                    qs.set('customerPhone', String(phone));
                    qs.set('barrelCount', String(count));
                    qs.set('taskId', String(taskId));
                    if (requestId) qs.set('requestId', String(requestId));
                    
                    navigate(`/delivery/barrel-intake?${qs.toString()}`);
                  }}
                  style={{ width: '100%' }}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? <p>Loading...</p> : tasks.length === 0 ? (
        <div className="no-data">No assigned tasks</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Title</th>
                <th>Customer</th>
                <th>Barrels</th>
                <th>Pickup</th>
                <th>Drop</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t._id}>
                  <td>{t.scheduledAt ? new Date(t.scheduledAt).toLocaleString('en-IN') : '-'}</td>
                  <td>
                    {t.title}
                    {t.isSellRequest && (
                      <span className="badge" style={{ 
                        marginLeft: '6px', 
                        backgroundColor: '#e3f2fd', 
                        color: '#1976d2'
                      }}>
                        SELL
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>
                      {t.customerUserId?.name || t.customerUserId?.email || '-'}
                    </div>
                    {t.customerUserId?.phoneNumber && (
                      <a 
                        href={`tel:${t.customerUserId.phoneNumber}`}
                        style={{ fontSize: '11px', color: '#10b981', textDecoration: 'none' }}
                      >
                        <i className="fas fa-phone"></i> {t.customerUserId.phoneNumber}
                      </a>
                    )}
                  </td>
                  <td>{t?.meta?.barrelCount ?? '-'}</td>
                  <td style={{ maxWidth: '200px', fontSize: '12px' }}>
                    {t.pickupAddress}
                  </td>
                  <td style={{ fontSize: '12px' }}>{t.dropAddress}</td>
                  <td>
                    {t.isSellRequest ? '-' : <StatusBadge s={t.status} />}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {t.isSellRequest ? (
                        <button 
                          className="btn" 
                          onClick={()=>{
                            const customer = t?.customerUserId?.name || t?.customerUserId?.email || 'Unknown Customer';
                            const phone = t?.customerUserId?.phoneNumber || '';
                            const count = t?.meta?.barrelCount || '1';
                            const taskId = t?._id || '';
                            const requestId = t?.meta?.sellRequestId || '';
                            
                            const qs = new URLSearchParams();
                            qs.set('customerName', String(customer));
                            qs.set('customerPhone', String(phone));
                            qs.set('barrelCount', String(count));
                            qs.set('taskId', String(taskId));
                            if (requestId) qs.set('requestId', String(requestId));
                            
                            navigate(`/delivery/barrel-intake?${qs.toString()}`);
                          }}
                        >
                          <i className="fas fa-eye"></i> View
                        </button>
                      ) : (
                        <>
                          {t.status === 'pickup_scheduled' && (
                            <button className="btn-secondary" onClick={()=>quickAction(t,'enroute_pickup')}>Start</button>
                          )}
                          {t.status === 'enroute_pickup' && (
                            <button className="btn" onClick={()=>quickAction(t,'picked_up')}>Picked</button>
                          )}
                          {t.status === 'picked_up' && (
                            <button className="btn-secondary" onClick={()=>quickAction(t,'enroute_drop')}>Drop</button>
                          )}
                          {t.status === 'enroute_drop' && (
                            <button className="btn" onClick={()=>quickAction(t,'delivered')}>Delivered</button>
                          )}
                          {t.status !== 'delivered' && (
                            <button className="btn-secondary" onClick={()=>deliverToLab(t)}>To Lab</button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;