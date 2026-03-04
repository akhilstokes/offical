import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listMyTasks, updateStatus } from '../../services/deliveryService';
import './DeliveryTheme.css';

const DeliveryTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Load both delivery tasks and sell requests
      const [deliveryTasks, sellRequests] = await Promise.all([
        listMyTasks(),
        loadAssignedSellRequests()
      ]);
      
      // Combine and filter out completed tasks
      const allTasks = [...deliveryTasks, ...sellRequests].filter(task => {
        // Filter out tasks with intake_completed or delivered status
        const status = (task.status || '').toLowerCase().replace(/_/g, '');
        return status !== 'intakecompleted' && status !== 'deliveredtolab';
      });
      
      setTasks(allTasks);
    } catch { 
      setTasks([]); 
    }
    finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh when page becomes visible (user returns from barrel intake)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refreshing tasks...');
        load();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refresh when window gains focus
    const handleFocus = () => {
      console.log('Window gained focus, refreshing tasks...');
      load();
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [load]);

  const statuses = ['pickup_scheduled','enroute_pickup','picked_up','enroute_drop','delivered','cancelled'];

  const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
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
            customerName: r.farmerId?.name || r.farmerId?.email || 'Unknown Customer',
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

  const deliverToLab = async (task) => {
    try {
      // Follow allowed transitions in order to avoid 400 from the server
      const order = ['pickup_scheduled','enroute_pickup','picked_up','enroute_drop','delivered'];
      const idx = Math.max(order.indexOf(task.status), 0);
      for (let i = idx + 1; i < order.length; i++) {
        await updateStatus(task._id, { status: order[i] });
      }
      // If linked to a Sell Request, mark delivered to lab there too
      const sellReqId = task?.meta?.sellRequestId;
      if (sellReqId) {
        try {
          await fetch(`${API}/api/sell-requests/${sellReqId}/deliver-to-lab`, { method: 'PUT', headers: authHeaders() });
        } catch { /* ignore */ }
      }
      // Open Lab Check-In with prefilled params
      const customer = task?.customerUserId?.name || task?.customerUserId?.email || '';
      const count = task?.meta?.barrelCount ?? '';
      const receivedAt = new Date().toISOString().slice(0,16); // yyyy-MM-ddTHH:mm for datetime-local
      const sampleId = sellReqId || task?._id; // prefer sell request id if present
      const qs = new URLSearchParams({ sampleId: String(sampleId), customerName: String(customer), barrelCount: String(count), receivedAt });
      const checkInUrl = `/lab/check-in?${qs.toString()}`;
      const role = String(user?.role || '').toLowerCase().replace(/\s+/g,'_');
      if (role !== 'lab') {
        alert('Only Lab Staff can complete Sample Check-In. Please notify lab staff that the sample has been delivered.');
        return; // Don't navigate if not lab staff
      }
      navigate(checkInUrl);
    } catch (e) {
      alert(e?.message || 'Failed to update status');
    } finally {
      await load();
    }
  };

  const openLabCheckIn = (task) => {
    console.log('Opening Lab Check-In for task:', task);
    console.log('Task meta:', task?.meta);
    console.log('Task customerUserId:', task?.customerUserId);
    
    // Extract values with fallbacks
    const customer = task?.customerUserId?.name || task?.customerUserId?.email || task?.customerName || 'Unknown Customer';
    const count = task?.meta?.barrelCount || task?.barrelCount || '1';
    const receivedAt = new Date().toISOString().slice(0,16);
    const sampleId = task?.meta?.sellRequestId || task?._id || `TASK-${Date.now()}`;
    
    console.log('Extracted values:', { customer, count, receivedAt, sampleId });
    
    const qs = new URLSearchParams();
    qs.set('sampleId', String(sampleId));
    qs.set('customerName', String(customer));
    qs.set('barrelCount', String(count));
    qs.set('receivedAt', receivedAt);
    
    const barrelIds = Array.isArray(task?.meta?.barrels) ? task.meta.barrels : [];
    barrelIds.forEach(id => { if (id) qs.append('barrels', String(id)); });
    
    const checkInUrl = `/lab/check-in?${qs.toString()}`;
    console.log('Final URL:', checkInUrl);
    console.log('URLSearchParams:', qs.toString());
    
    const role = String(user?.role || '').toLowerCase().replace(/\s+/g,'_');
    if (role !== 'lab') {
      alert('Only Lab Staff can complete Sample Check-In. Please notify lab staff that the sample has been delivered.');
      return; // Don't navigate if not lab staff
    }
    navigate(checkInUrl);
  };



  return (
    <div>
      <h2>My Tasks</h2>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom: 16 }}>
        <button className="btn-secondary" onClick={load} disabled={loading}>
          <i className="fas fa-sync-alt" style={{ marginRight: '6px' }}></i>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading ? <p>Loading...</p> : tasks.length === 0 ? (
        <div className="no-data">No tasks found.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>When</th>
                <th>Title</th>
                <th>Customer</th>
                <th>Barrels</th>
                <th>Pickup</th>
                <th>Drop</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, i) => (
                <tr key={t._id} style={{ backgroundColor: t.isSellRequest ? '#f8f9fa' : 'inherit' }}>
                  <td>{i+1}</td>
                  <td>{t.scheduledAt ? new Date(t.scheduledAt).toLocaleString('en-IN') : '-'}</td>
                  <td>
                    {t.title}
                    {t.isSellRequest && (
                      <span style={{ 
                        marginLeft: '8px', 
                        padding: '2px 6px', 
                        backgroundColor: '#e3f2fd', 
                        color: '#1976d2', 
                        borderRadius: '4px', 
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        SELL REQUEST
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>
                      {t.customerUserId?.name || t.customerUserId?.email || t.customerName || '-'}
                    </div>
                    {t.customerUserId?.phoneNumber && (
                      <a 
                        href={`tel:${t.customerUserId.phoneNumber}`}
                        style={{
                          fontSize: '11px',
                          color: '#10b981',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <i className="fas fa-phone"></i>
                        {t.customerUserId.phoneNumber}
                      </a>
                    )}
                  </td>
                  <td>{t?.meta?.barrelCount ?? '-'}</td>
                  <td>{t.pickupAddress}</td>
                  <td>{t.dropAddress}</td>
                  <td style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <button 
                      className="btn" 
                      onClick={()=>{
                        const customer = t?.customerUserId?.name || t?.customerUserId?.email || t?.customerName || 'Unknown Customer';
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
                      style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: '600',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <i className="fas fa-clipboard-check"></i>
                      Barrel Intake
                    </button>
                    {!t.isSellRequest && (
                      <button 
                        className="btn-secondary" 
                        onClick={()=>deliverToLab(t)}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px'
                        }}
                      >
                        Delivered to Lab
                      </button>
                    )}
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

export default DeliveryTasks;
