import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createTask } from '../../services/deliveryService';
import './ManagerSellRequests.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ASSIGN_BASE = process.env.REACT_APP_ASSIGN_BASE || '';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

const ManagerSellRequests = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: 'PENDING' });
  const [typeSeg, setTypeSeg] = useState('ALL'); // ALL | BARRELS | EMPTY | PRODUCTION
  const [viewMode, setViewMode] = useState('table'); // 'cards' | 'table' - default to table
  const [assignDeliveryId, setAssignDeliveryId] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [approvedRequests, setApprovedRequests] = useState(new Set());
  const [assignedRequests, setAssignedRequests] = useState(new Set());
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [maxRetries] = useState(3);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRows, setHistoryRows] = useState([]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const url = `${API}/api/sell-requests/admin/all?limit=200`;
      const res = await fetch(url, { headers: authHeaders(), cache: 'no-cache' });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data?.records) ? data.records : (Array.isArray(data) ? data : []);
      const rows = list.map(r => ({
        id: r._id,
        user: r.farmerId?.name || r.farmerId?.email || r.name || r.user?.name || '-',
        staff: r.assignedDeliveryStaffId?.name || r.assignedDeliveryStaffId?.email || '-',
        date: r.updatedAt || r.createdAt,
        status: r.status || '-'
      })).sort((a,b)=> new Date(b.date||0) - new Date(a.date||0));
      setHistoryRows(rows);
    } catch (e) {
      setError(e?.message || 'Failed to load history');
      setHistoryRows([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const statusOptions = useMemo(() => ([
    'PENDING','APPROVED','ASSIGNED','REQUESTED','FIELD_ASSIGNED','COLLECTED','DELIVER_ASSIGNED','DELIVERED_TO_LAB','TESTED','ACCOUNT_CALCULATED','VERIFIED','INVOICED'
  ]), []);

  const load = async (force = false) => {
    // Prevent multiple concurrent requests
    if (loading && !force) {
      return;
    }

    // Simple rate limiting: prevent requests if last request was less than 10 seconds ago
    const now = Date.now();
    if (!force && now - lastRequestTime < 10000) {
      // Silently ignore rapid clicks without showing a message
      return;
    }

    setLoading(true); 
    setError('');
    setLastRequestTime(now);
    
    try {
      // Try multiple endpoints to get all types of user requests
      const endpoints = [
        '/api/sell-requests/admin/all',
        '/api/latex/admin/requests',
        '/api/barrel-requests/admin/all',
        // '/api/chemical-requests/admin/all', // removed (route not available)
        '/api/delivery/barrels/intake'
      ];
      
      let allRequests = [];
      let lastError = '';
      
      // Add small delays between requests to avoid rate limiting
      for (const endpoint of endpoints) {
        try {
          const url = `${API}${endpoint}`;
          const res = await fetch(url, { 
            headers: authHeaders(),
            cache: 'no-cache'
          });
          
          if (res.status === 429) {
            // Rate limited - wait and retry once
            const retryAfter = res.headers.get('Retry-After') || 5;
            console.warn(`Rate limited on ${endpoint}, waiting ${retryAfter}s...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            
            // Retry the request
            const retryRes = await fetch(url, { 
              headers: authHeaders(),
              cache: 'no-cache'
            });
            
            if (!retryRes.ok) {
              lastError = `Failed to load from ${endpoint} (${retryRes.status})`;
              continue;
            }
            
            const data = await retryRes.json();
            const raw = data?.records || data?.items || data?.results || data?.data || (Array.isArray(data) ? data : []);
            
            if (raw && raw.length > 0) {
              const typedRequests = raw.map(r => ({
                ...r,
                _source: endpoint,
                _type: endpoint.includes('latex') ? 'LATEX' : 
                       endpoint.includes('delivery/barrels') ? 'SELL_BARRELS' :
                       endpoint.includes('barrel') ? 'BARREL' :
                       endpoint.includes('chemical') ? 'CHEMICAL' : 'SELL'
              }));
              allRequests = allRequests.concat(typedRequests);
            }
            continue;
          }
          
          if (!res.ok) { 
            lastError = `Failed to load from ${endpoint} (${res.status})`;
            continue;
          }
          
          const data = await res.json();
          const raw = data?.records || data?.items || data?.results || data?.data || (Array.isArray(data) ? data : []);
          
          if (raw && raw.length > 0) {
            // Add source type to each request
            const typedRequests = raw.map(r => ({
              ...r,
              _source: endpoint,
              _type: endpoint.includes('latex') ? 'LATEX' : 
                     endpoint.includes('delivery/barrels') ? 'SELL_BARRELS' :
                     endpoint.includes('barrel') ? 'BARREL' :
                     endpoint.includes('chemical') ? 'CHEMICAL' : 'SELL'
            }));
            allRequests = allRequests.concat(typedRequests);
          }
          
          // Add 200ms delay between requests to avoid rate limiting
          if (endpoint !== endpoints[endpoints.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (e) {
          console.log(`Error fetching ${endpoint}:`, e.message);
          continue;
        }
      }
      
      if (allRequests.length === 0) { 
        setError('No user requests found in any category');
        setRows([]);
        return;
      }
      
      // Sort by creation date (newest first)
      allRequests.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.requestedAt || a.submittedAt || 0);
        const dateB = new Date(b.createdAt || b.requestedAt || b.submittedAt || 0);
        return dateB - dateA;
      });
      
      const normalized = allRequests.map(r => {
        const s = r.status ?? r.requestStatus ?? r.state ?? r.currentStatus;
        return {
          ...r,
          _statusUpper: typeof s === 'string' ? s.toUpperCase() : '',
          _createdAt: r.createdAt || r.requestedAt || r.submittedAt || r.created_on || r.date || r.timestamp,
          _type: r._type || r.type || r.requestType || r.category || 'USER REQUEST',
          _notes: r.notes || r.subject || r.description || r.remark || r.message || 
                  (r.barrelCount ? `Sell ${r.barrelCount} barrel(s)` : undefined) ||
                  (r.quantity ? `${r.quantity}kg latex` : undefined) ||
                  (r.chemicalName ? `Chemical: ${r.chemicalName}` : undefined),
          _farmer: r.name || r.contactName || r.farmerName || r.user?.name || r.userName || 
                   r.farmerId?.name || r.farmerId?.email || r.user?.email || r.email ||
                   r.requestedBy?.name || r.createdBy?.name || 'Unknown User',
        };
      });
      
      setRows(normalized);
      setRetryCount(0);
      setIsRetrying(false);
      
    } catch (e) {
      setError(`Failed to load user requests: ${e?.message || 'Network error'}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters.status]);
  // No automatic polling - only manual refresh to prevent 429 errors

  // minimized: removed enrichment

  // assignField removed per request

  const openAssignDelivery = async (id) => {
    // Show delivery staff selection modal
    setAssignDeliveryId(id);
    setShowAssignModal(true);
    setError('');
    setInfo('');
    setStaffError('');
    setStaffLoading(true);
    try {
      // Try multiple endpoints to get delivery staff
      let deliveryStaff = [];
      
      // First try the user-management endpoint
      try {
        const res = await fetch(`${API}/api/user-management/staff?role=delivery_staff&status=active&limit=100`, { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data?.users) ? data.users : (Array.isArray(data?.records) ? data.records : []);
          deliveryStaff = list.filter(u => (u.role || '').toLowerCase() === 'delivery_staff');
        }
      } catch (e) {
        console.log('User-management endpoint failed, trying shifts endpoint');
      }
      
      // If no results, try the shifts endpoint
      if (deliveryStaff.length === 0) {
        try {
          const res = await fetch(`${API}/api/shifts/staff`, { headers: authHeaders() });
          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data?.staff) ? data.staff : (Array.isArray(data) ? data : []);
            deliveryStaff = list.filter(u => (u.role || '').toLowerCase() === 'delivery_staff');
          }
        } catch (e) {
          console.log('Shifts endpoint failed, trying fallback');
        }
      }
      
      // Fallback: try the old users endpoint
      if (deliveryStaff.length === 0) {
        try {
          const res = await fetch(`${API}/api/users`, { headers: authHeaders() });
          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : []);
            deliveryStaff = list.filter(u => (u.role || '').toLowerCase() === 'delivery_staff');
          }
        } catch (e) {
          console.log('All endpoints failed');
        }
      }
      
      setStaffList(deliveryStaff);
      if (deliveryStaff.length === 0) {
        setStaffError('No delivery staff found. Please ensure delivery staff are registered in the system.');
      }
    } catch (e) {
      setStaffError('Failed to load delivery staff');
      setStaffList([]);
    } finally {
      setStaffLoading(false);
    }
  };

  const confirmAssignDelivery = async () => {
    if (!selectedStaff) {
      setError('Please select a delivery staff member');
      return;
    }
    
    // Disable button after clicking
    setAssignedRequests(prev => new Set([...prev, assignDeliveryId]));
    
    try {
      const req = rows.find(r => r._id === assignDeliveryId) || {};
      
      // For SELL requests, assign on SellRequest; for SELL_BARRELS (delivery intakes), skip and directly create a task
      if (req._type === 'SELL') {
        const assignResponse = await fetch(`${API}/api/sell-requests/${assignDeliveryId}/assign-delivery`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ deliveryStaffId: selectedStaff })
        });
        if (!assignResponse.ok) {
          throw new Error(`Failed to assign delivery staff: ${assignResponse.status}`);
        }
      }
      
      // Extract location data (GPS coordinates)
      const locationData = req.location || req.pickupLocation || req.gpsLocation;
      
      // Build pickup address from multiple sources
      // Priority: notes (user's address) > user location > pickupAddress field > fallback
      let pickupAddress = 'Customer pickup location';
      
      // First try to get address from notes field (where users enter their address)
      if (req.notes && typeof req.notes === 'string' && req.notes.trim()) {
        pickupAddress = req.notes.trim();
      } 
      // Then try user's location field
      else if (req.user?.location && typeof req.user.location === 'string' && req.user.location.trim()) {
        pickupAddress = req.user.location.trim();
      }
      // Then try farmerId location
      else if (req.farmerId?.location && typeof req.farmerId.location === 'string' && req.farmerId.location.trim()) {
        pickupAddress = req.farmerId.location.trim();
      }
      // Then try other address fields
      else {
        const rawPickup = req.pickupAddress || req.address || req.capturedAddress;
        if (typeof rawPickup === 'string' && rawPickup.trim()) {
          pickupAddress = rawPickup.trim();
        } else if (rawPickup && typeof rawPickup === 'object' && (rawPickup.label || rawPickup.name || rawPickup.address)) {
          pickupAddress = (rawPickup.label || rawPickup.name || rawPickup.address).trim();
        }
      }

      // Build delivery task payload with location
      const metaData = {};
      if (req.barrelCount) metaData.barrelCount = req.barrelCount;
      if (req._type === 'SELL' && req._id) metaData.sellRequestId = req._id;
      if (req._type === 'SELL_BARRELS' && req._id) metaData.intakeId = req._id;
      if (req.locationAccuracy) metaData.locationAccuracy = req.locationAccuracy;
      
      const payload = {
        title: req._type ? `${req._type} Pickup` : 'Pickup Task',
        assignedTo: selectedStaff,
        pickupAddress,
        dropAddress: 'HFP Lab / Yard',
        scheduledAt: new Date().toISOString(),
        meta: metaData
      };
      
      // Add optional fields only if they exist
      if (req.createdBy || req.user?._id || req.userId) {
        payload.customerUserId = req.createdBy || req.user?._id || req.userId;
      }
      if (req._notes) {
        payload.notes = req._notes;
      }

      // Add GPS location ONLY if we have valid coordinates
      // Don't send pickupLocation at all if coordinates are missing
      if (locationData && 
          locationData.type === 'Point' && 
          Array.isArray(locationData.coordinates) && 
          locationData.coordinates.length === 2 &&
          typeof locationData.coordinates[0] === 'number' &&
          typeof locationData.coordinates[1] === 'number') {
        payload.pickupLocation = {
          type: 'Point',
          coordinates: locationData.coordinates
        };
        console.log('Added GPS location:', payload.pickupLocation);
      } else {
        console.log('No valid GPS location data, skipping pickupLocation field');
      }
      
      console.log('Creating delivery task with payload:', payload);
      
      await createTask(payload);
      
      // Update the sell request/intake status to ASSIGNED in the database
      if (req._type === 'SELL_BARRELS' && req._id) {
        // Update delivery intake status
        try {
          await fetch(`${API}/api/delivery/barrels/intake/${req._id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ 
              status: 'assigned',
              assignedDeliveryStaffId: selectedStaff
            })
          });
        } catch (updateError) {
          console.error('Failed to update intake status (non-critical):', updateError);
        }
      }
      
      setInfo('Assigned successfully');
      
      // Get the staff name for display
      const assignedStaffObj = staffList.find(s => s._id === selectedStaff);
      const assignedStaffName = assignedStaffObj?.name || assignedStaffObj?.email || 'Assigned';
      
      // Update table with assigned staff info
      setRows(prev => prev.map(r => (
        r._id === assignDeliveryId ? { 
          ...r, 
          status: 'assigned', 
          _statusUpper: 'ASSIGNED',
          assignedDeliveryStaffId: { name: assignedStaffName },
          assignedTo: { name: assignedStaffName }
        } : r
      )));
      setAssignedRequests(prev => new Set([...prev, assignDeliveryId]));
      
    } catch (e) {
      // Extract more detailed error information
      const errorDetails = e?.response?.data?.details || e?.response?.data?.error || e?.message || 'Unknown error';
      setError(`Failed to assign delivery staff: ${errorDetails}`);
      console.error('Assignment error:', e);
      console.error('Error response:', e?.response?.data);
      
      // Remove from assigned set since it failed
      setAssignedRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(assignDeliveryId);
        return newSet;
      });
    }
    
    setShowAssignModal(false);
    setSelectedStaff('');
    setAssignDeliveryId(null);
  };


  const [verifyingId, setVerifyingId] = useState('');
  const [approvingId, setApprovingId] = useState('');
  const [info, setInfo] = useState('');
  const [cbEditId, setCbEditId] = useState('');
  const [cbEditValue, setCbEditValue] = useState('');
  const [bcEditId, setBcEditId] = useState('');
  const [bcEditValue, setBcEditValue] = useState('');

  const verify = async (id) => {
    if (verifyingId) return; // prevent duplicate clicks
    if (!window.confirm('Mark this request as verified?')) return;
    try {
      setVerifyingId(id);
      setError(''); setInfo('');
      // Use sell-requests API for verification
      const target = `${API}/api/sell-requests/${id}/verify`;
      const res = await fetch(target, { method: 'PUT', headers: authHeaders() });
      if (!res.ok) throw new Error(`Verify failed ${res.status} @ ${target}`);
      setInfo('Verified successfully.');
      // Optimistically mark status as approved in the table
      setRows(prev => prev.map(r => (
        r._id === id ? { ...r, status: 'approved', _statusUpper: 'APPROVED' } : r
      )));
      await load();
    } catch (e) {
      setError((e?.message || 'Verify failed').replace(/<[^>]*>/g, ''));
    } finally {
      setVerifyingId('');
    }
  };

  const approve = async (id) => {
    // Find the request to get details for confirmation
    const r = rows.find(x => x._id === id) || {};
    const customerName = displayFarmer(r);
    const barrelCount = r.barrelCount || r.quantity || 'N/A';
    
    // Show confirmation dialog with request details
    const confirmMessage = `Are you sure you want to approve this request?\n\n` +
      `Customer: ${customerName}\n` +
      `Barrels: ${barrelCount}\n` +
      `Type: ${r._type || 'SELL'}\n\n` +
      `After approval, you can assign delivery staff.`;
    
    if (!window.confirm(confirmMessage)) {
      return; // User cancelled
    }
    
    // Disable approve button while processing
    setApprovingId(id);
    setError('');
    
    try {
      // If this row came from delivery barrel intake list, mark approved via generic update
      // The /approve endpoint requires pricePerBarrel and returns 400 without it.
      if (String(r._source || '').includes('/delivery/barrels/intake')) {
        const target = `${API}/api/delivery/barrels/intake/${id}`;
        const res = await fetch(target, { 
          method: 'PUT', 
          headers: authHeaders(), 
          body: JSON.stringify({ status: 'approved' }) 
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData.message || errorData.error || `Server error (${res.status})`;
          throw new Error(errorMessage);
        }
        
        const responseData = await res.json().catch(() => ({}));
        console.log('Approval response:', responseData);
      }
      
      // Update approved requests Set AFTER successful API call
      setApprovedRequests(prev => new Set([...prev, id]));
      
      // Reflect approved status immediately in the table
      setRows(prev => prev.map(x => x._id === id ? { 
        ...x, 
        status: 'approved', 
        _statusUpper: 'APPROVED',
        approvedAt: new Date().toISOString(),
        approvedBy: user?.name || 'Manager'
      } : x));
      
      setInfo(`✅ Request approved successfully! You can now assign delivery staff to ${customerName}.`);
      
    } catch (error) {
      // Better error message
      let errorMsg = 'Failed to approve request';
      if (error.message) {
        errorMsg += `: ${error.message}`;
      }
      if (error.message && error.message.includes('500')) {
        errorMsg += '. Please restart the server to apply recent updates.';
      }
      
      setError(errorMsg);
      console.error('Approval error:', error);
      console.error('Request ID:', id);
      console.error('Request data:', r);
    } finally {
      setApprovingId('');
    }
  };

  // Delete request function
  const deleteRequest = async (id) => {
    const r = rows.find(x => x._id === id) || {};
    const customerName = displayFarmer(r);
    const barrelCount = r.barrelCount || r.quantity || 'N/A';
    
    // Show confirmation dialog
    const confirmMessage = `⚠️ DELETE REQUEST - This action CANNOT be undone!\n\n` +
      `Customer: ${customerName}\n` +
      `Barrels: ${barrelCount}\n` +
      `Type: ${r._type || 'SELL'}\n\n` +
      `Are you absolutely sure you want to delete this request?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setError('');
    setInfo('');
    
    try {
      let endpoint = '';
      
      // Determine the correct endpoint based on request type
      if (String(r._source || '').includes('/delivery/barrels/intake')) {
        endpoint = `${API}/api/delivery/barrels/intake/${id}`;
      } else if (r._type === 'SELL') {
        endpoint = `${API}/api/sell-requests/${id}`;
      } else if (r._type === 'SELL_BARRELS') {
        endpoint = `${API}/api/delivery/barrels/intake/${id}`;
      } else {
        throw new Error('Unknown request type');
      }
      
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: authHeaders()
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete (${res.status})`);
      }
      
      // Remove from local state immediately
      setRows(prev => prev.filter(x => x._id !== id));
      setApprovedRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setAssignedRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      
      setInfo(`✅ Request from ${customerName} deleted successfully`);
      
    } catch (error) {
      let errorMsg = 'Failed to delete request';
      if (error.message) {
        errorMsg += `: ${error.message}`;
      }
      setError(errorMsg);
      console.error('Delete error:', error);
    }
  };

  const saveCompanyBarrel = async (id, value) => {
    const clean = String(value).trim();
    if (!clean) { setError('Company barrel cannot be empty'); return; }
    try {
      setError(''); setInfo('');
      const res = await fetch(`${API}/api/delivery/barrels/intake/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ companyBarrel: clean })
      });
      if (!res.ok) throw new Error(`Failed to set company barrel (${res.status})`);
      setInfo('Company barrel updated');
      await load(true);
      setCbEditId('');
      setCbEditValue('');
    } catch (e) {
      setError(e?.message || 'Failed to update company barrel');
    }
  };

  const onSaveBarrelCount = async (id, value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1) { setError('Barrel count must be at least 1'); return; }
    try {
      setError(''); setInfo('');
      const res = await fetch(`${API}/api/delivery/barrels/intake/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ barrelCount: n })
      });
      if (!res.ok) throw new Error(`Failed to update barrel count (${res.status})`);
      setInfo('Barrel count updated');
      await load(true);
      setBcEditId('');
      setBcEditValue('');
    } catch (e) {
      setError(e?.message || 'Failed to update barrel count');
    }
  };

  const setUserAllowance = async (userId, currentLabel = '') => {
    if (!userId) { setError('Missing user id for allowance'); return; }
    const input = window.prompt(`Set user allowance (total barrels). ${currentLabel ? `Current: ${currentLabel}` : ''}`);
    if (input == null) return;
    const n = Number(input);
    if (!Number.isFinite(n) || n < 0) { setError('Allowance must be a number >= 0'); return; }
    try {
      setError(''); setInfo('');
      const res = await fetch(`${API}/api/delivery/barrels/allowance/${userId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ allowance: n })
      });
      if (!res.ok) throw new Error(`Failed to set allowance (${res.status})`);
      const data = await res.json();
      setInfo(`Allowance set. Total: ${data.allowance ?? n}, Remaining: ${Number.isFinite(data.remaining) ? data.remaining : 'Unlimited'}`);
      await load(true);
    } catch (e) {
      setError(e?.message || 'Failed to set allowance');
    }
  };

  const filtered = rows.filter(r => {
    // Type segmentation
    let typeOk = true;
    if (typeSeg === 'BARRELS') typeOk = r._type === 'BARREL';
    else if (typeSeg === 'EMPTY') typeOk = r._type === 'SELL_BARRELS';
    else if (typeSeg === 'PRODUCTION') typeOk = r._type === 'LATEX';

    // Status filter
    if (!filters.status) return typeOk;
    const wanted = filters.status.toUpperCase();
    if (wanted === 'PENDING') {
      return typeOk && (r._statusUpper === 'PENDING' || r._statusUpper === 'REQUESTED');
    }
    return typeOk && (r._statusUpper === wanted);
  });

  const safeDate = (d) => {
    if (!d) return '-';
    try { const dt = new Date(d); return Number.isNaN(dt.getTime()) ? '-' : dt.toLocaleString(); } catch { return '-'; }
  };

  const displayFarmer = (r) => {
    const toStr = (v) => {
      if (v == null) return '';
      if (typeof v === 'string' || typeof v === 'number') return String(v);
      if (typeof v === 'object') {
        // Try common fields
        const cand = v.name || v.fullName || v.email || v.phone || v.mobile || v._id;
        return cand ? String(cand) : '';
      }
      return '';
    };

    const name = toStr(r._farmer) || toStr(r.farmerName) || toStr(r.userName) || toStr(r.name) || toStr(r.customerName) || toStr(r.contactName) || toStr(r.farmer?.name) || toStr(r.requestedBy?.name) || toStr(r.createdBy?.name) || toStr(r.requester?.name) || toStr(r.ownerName) || toStr(r.profile?.name) || toStr(r.user?.fullName) || toStr(r.user?.name) || toStr(r.customer?.name);
    const phone = toStr(r.phone) || toStr(r.mobile) || toStr(r.contact) || toStr(r.user?.phone) || toStr(r.user?.mobile) || toStr(r.customer?.phone);
    const email = toStr(r.email) || toStr(r.user?.email) || toStr(r.customer?.email) || toStr(r.farmerId?.email);
    if (name && phone) return `${name} (${phone})`;
    if (name) return name;
    if (phone) return phone;
    if (email) return email;
    return '-';
  };

  // Calculate stats
  const stats = {
    total: filtered.length,
    pending: filtered.filter(r => r._statusUpper === 'PENDING' || r._statusUpper === 'REQUESTED').length,
    approved: filtered.filter(r => r._statusUpper === 'APPROVED' || r.status === 'approved' || approvedRequests.has(r._id)).length,
    assigned: filtered.filter(r => r._statusUpper === 'ASSIGNED' || assignedRequests.has(r._id)).length
  };

  return (
    <div className="manager-sell-requests">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-top">
          <div className="header-title">
            <div className="title-icon">
              <i className="fas fa-clipboard-list" />
            </div>
            <div className="title-content">
              <h1>Sell Requests Management</h1>
              <p className="header-subtitle">Manage and track all customer sell requests</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => load(true)} 
              disabled={loading}
              className="btn btn-refresh"
              title="Refresh data"
            >
              <i className={loading ? "fas fa-sync-alt fa-spin" : "fas fa-sync-alt"} />
              <span className="btn-text">Refresh</span>
            </button>
            <button 
              onClick={() => navigate('/manager/live')}
              className="btn btn-map"
              title="View live check-ins"
            >
              <i className="fas fa-users" />
              <span className="btn-text">Live Check-ins</span>
            </button>
            <button 
              onClick={() => { setShowHistory(true); loadHistory(); }}
              className="btn btn-history-primary"
              title="View request history"
            >
              <i className="fas fa-history" />
              <span className="btn-text">View History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Total Requests</span>
            <div className="stat-icon total">
              <i className="fas fa-list" />
            </div>
          </div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Pending</span>
            <div className="stat-icon pending">
              <i className="fas fa-clock" />
            </div>
          </div>
          <div className="stat-value">{stats.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Approved</span>
            <div className="stat-icon approved">
              <i className="fas fa-check-circle" />
            </div>
          </div>
          <div className="stat-value">{stats.approved}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Assigned</span>
            <div className="stat-icon assigned">
              <i className="fas fa-truck" />
            </div>
          </div>
          <div className="stat-value">{stats.assigned}</div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle" />
          {error}
        </div>
      )}

      {info && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle" />
          {info}
        </div>
      )}

      {/* Controls Panel */}
      <div className="controls-panel">
        <div className="controls-row">
          <div className="filter-group">
            <label className="filter-label">Status Filter:</label>
            <select 
              value={filters.status} 
              onChange={e => setFilters(s => ({ ...s, status: e.target.value }))}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <div className="type-filters">
            {[
              { key: 'ALL', label: 'All Types', icon: 'fas fa-th' },
              { key: 'BARRELS', label: 'Barrels', icon: 'fas fa-drum' },
              { key: 'EMPTY', label: 'Empty Barrels', icon: 'fas fa-box-open' },
              { key: 'PRODUCTION', label: 'Production', icon: 'fas fa-industry' }
            ].map(seg => (
              <button
                key={seg.key}
                onClick={() => setTypeSeg(seg.key)}
                className={`type-filter-btn ${typeSeg === seg.key ? 'active' : ''}`}
              >
                <i className={seg.icon} />
                {seg.label}
              </button>
            ))}
          </div>

          <div className="view-toggle">
            <button
              onClick={() => setViewMode('cards')}
              className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              title="Card View"
            >
              <i className="fas fa-th-large" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              title="Table View"
            >
              <i className="fas fa-list" />
            </button>
          </div>
        </div>
      </div>

      {/* Requests Display */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin" />
          </div>
          <div className="loading-text">Loading sell requests...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-inbox" />
          </div>
          <div className="empty-title">No sell requests found</div>
          {(filters.status || typeSeg !== 'ALL') && (
            <div className="empty-subtitle">Try adjusting your filters to see more results</div>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* Card View */
        <div className="requests-grid">
          {filtered.map((r) => {
            const toStr = (v) => {
              if (v == null) return '';
              if (typeof v === 'string' || typeof v === 'number') return String(v);
              if (typeof v === 'object') {
                const cand = v.name || v.fullName || v.email || v.phone || v.mobile || v._id;
                return cand ? String(cand) : '';
              }
              return '';
            };

            const name = toStr(r._farmer) || toStr(r.farmerName) || toStr(r.userName) || toStr(r.name) || toStr(r.customerName) || toStr(r.contactName) || toStr(r.farmer?.name) || toStr(r.requestedBy?.name) || toStr(r.createdBy?.name) || toStr(r.requester?.name) || toStr(r.ownerName) || toStr(r.profile?.name) || toStr(r.user?.fullName) || toStr(r.user?.name) || toStr(r.customer?.name);
            const phone = toStr(r.phone) || toStr(r.mobile) || toStr(r.contact) || toStr(r.user?.phone) || toStr(r.user?.mobile) || toStr(r.customer?.phone);
            const email = toStr(r.email) || toStr(r.user?.email) || toStr(r.customer?.email) || toStr(r.farmerId?.email);

            return (
              <div key={r._id} className="request-card">
                <div className="request-card-header">
                  <div className="request-id-section">
                    <span className="request-id-label">Request ID</span>
                    <span className="request-id-value">#{r._id?.slice(-8) || 'N/A'}</span>
                  </div>
                  <div className="request-type-section">
                    <span className={`type-badge ${(r._type || '').toLowerCase().replace('_', '-')}`}>
                      <i className={
                        r._type === 'LATEX' ? 'fas fa-flask' :
                        r._type === 'BARREL' ? 'fas fa-drum' :
                        r._type === 'SELL_BARRELS' ? 'fas fa-box-open' :
                        r._type === 'CHEMICAL' ? 'fas fa-vial' : 'fas fa-shopping-cart'
                      } />
                      {r._type || 'SELL'}
                    </span>
                    <span className={`status-badge ${
                      (r._statusUpper === 'PENDING' || r._statusUpper === 'REQUESTED') ? 'pending' :
                      (r._statusUpper === 'APPROVED' || r.status === 'approved' || approvedRequests.has(r._id)) ? 'approved' :
                      (r._statusUpper === 'ASSIGNED' || assignedRequests.has(r._id)) ? 'assigned' : 'default'
                    }`}>
                      <i className={
                        (r._statusUpper === 'PENDING' || r._statusUpper === 'REQUESTED') ? 'fas fa-clock' :
                        (r._statusUpper === 'APPROVED' || r.status === 'approved' || approvedRequests.has(r._id)) ? 'fas fa-check-circle' :
                        (r._statusUpper === 'ASSIGNED' || assignedRequests.has(r._id)) ? 'fas fa-truck' : 'fas fa-info-circle'
                      } />
                      {assignedRequests.has(r._id) ? 'ASSIGNED' : (r.status || 'PENDING')}
                    </span>
                  </div>
                </div>

                <div className="request-customer-section">
                  <span className="customer-label">Customer Information</span>
                  <div className="customer-info">
                    <div className="customer-name-display">
                      <i className="fas fa-user-circle" />
                      {name || 'Unknown'}
                    </div>
                    {phone && (
                      <div className="customer-contact-info">
                        <i className="fas fa-phone" />
                        {phone}
                      </div>
                    )}
                    {!phone && email && (
                      <div className="customer-contact-info">
                        <i className="fas fa-envelope" />
                        {email}
                      </div>
                    )}
                  </div>
                </div>

                <div className="request-details-section">
                  <div className="details-grid">
                    {r._type === 'SELL_BARRELS' && r.barrelCount && (
                      <div className="detail-item">
                        <span className="detail-item-label">Barrel Count</span>
                        <span className="detail-item-value">
                          <i className="fas fa-drum" />
                          {r.barrelCount}
                        </span>
                      </div>
                    )}
                    {r._type === 'SELL_BARRELS' && r.companyBarrel && (
                      <div className="detail-item">
                        <span className="detail-item-label">Company</span>
                        <span className="detail-item-value">
                          <i className="fas fa-building" />
                          {r.companyBarrel}
                        </span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-item-label">Requested Date</span>
                      <span className="detail-item-value">
                        <i className="fas fa-calendar" />
                        {safeDate(r._createdAt || r.requestedAt || r.createdAt)}
                      </span>
                    </div>
                  </div>
                  {r._notes && (
                    <div className="request-notes">
                      <span className="notes-label">Address</span>
                      <p className="notes-text">{r._notes}</p>
                    </div>
                  )}
                </div>

                <div className="request-footer">
                  <div className="request-actions">
                    {r._type === 'SELL' && (
                      <>
                        <button
                          onClick={() => openAssignDelivery(r._id)}
                          disabled={assignedRequests.has(r._id)}
                          className="action-btn action-btn-assign"
                        >
                          <i className="fas fa-truck" />
                          {assignedRequests.has(r._id) ? 'Assigned' : 'Assign'}
                        </button>
                        <button
                          disabled={verifyingId === r._id}
                          onClick={() => verify(r._id)}
                          className="action-btn action-btn-verify"
                        >
                          <i className="fas fa-check-circle" />
                          {verifyingId === r._id ? 'Verifying...' : 'Verify'}
                        </button>
                      </>
                    )}
                    {r._type === 'SELL_BARRELS' && (
                      <>
                        <button
                          onClick={() => approve(r._id)}
                          disabled={approvedRequests.has(r._id) || approvingId === r._id || r._statusUpper === 'APPROVED'}
                          className="action-btn action-btn-approve"
                        >
                          <i className={approvingId === r._id ? "fas fa-spinner fa-spin" : "fas fa-thumbs-up"} />
                          {approvingId === r._id ? 'Approving...' : (approvedRequests.has(r._id) || r._statusUpper === 'APPROVED' ? 'Approved ✓' : 'Approve')}
                        </button>
                        <button
                          onClick={() => openAssignDelivery(r._id)}
                          disabled={assignedRequests.has(r._id) || (!approvedRequests.has(r._id) && r._statusUpper !== 'APPROVED')}
                          className="action-btn action-btn-assign"
                          title={
                            assignedRequests.has(r._id) 
                              ? 'Already assigned to delivery staff' 
                              : (!approvedRequests.has(r._id) && r._statusUpper !== 'APPROVED') 
                                ? '⚠️ Click APPROVE button first before assigning delivery staff' 
                                : 'Assign delivery staff to pickup barrels'
                          }
                          style={{
                            opacity: (!approvedRequests.has(r._id) && r._statusUpper !== 'APPROVED') ? 0.6 : 1
                          }}
                        >
                          <i className="fas fa-truck" />
                          {assignedRequests.has(r._id) ? 'Assigned ✓' : 
                           (!approvedRequests.has(r._id) && r._statusUpper !== 'APPROVED') ? '🔒 Assign Staff' : 
                           'Assign Staff'}
                        </button>
                        <button
                          onClick={() => deleteRequest(r._id)}
                          className="action-btn action-btn-delete"
                          title="Delete this request permanently"
                          style={{
                            backgroundColor: '#dc2626',
                            color: 'white'
                          }}
                        >
                          <i className="fas fa-trash" />
                          Delete
                        </button>
                      </>
                    )}
                    {r._type !== 'SELL' && r._type !== 'SELL_BARRELS' && (
                      <button
                        onClick={() => alert(`View ${r._type} request details`)}
                        className="action-btn action-btn-details"
                      >
                        <i className="fas fa-info-circle" />
                        Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Status</th>
                <th>Details</th>
                <th>Assigned To</th>
                <th>Location</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const toStr = (v) => {
                  if (v == null) return '';
                  if (typeof v === 'string' || typeof v === 'number') return String(v);
                  if (typeof v === 'object') {
                    const cand = v.name || v.fullName || v.email || v.phone || v.mobile || v._id;
                    return cand ? String(cand) : '';
                  }
                  return '';
                };

                const name = toStr(r._farmer) || toStr(r.farmerName) || toStr(r.userName) || toStr(r.name) || toStr(r.customerName) || toStr(r.contactName) || toStr(r.farmer?.name) || toStr(r.requestedBy?.name) || toStr(r.createdBy?.name) || toStr(r.requester?.name) || toStr(r.ownerName) || toStr(r.profile?.name) || toStr(r.user?.fullName) || toStr(r.user?.name) || toStr(r.customer?.name);
                const phone = toStr(r.phone) || toStr(r.mobile) || toStr(r.contact) || toStr(r.user?.phone) || toStr(r.user?.mobile) || toStr(r.customer?.phone);
                const email = toStr(r.email) || toStr(r.user?.email) || toStr(r.customer?.email) || toStr(r.farmerId?.email);

                return (
                  <tr key={r._id}>
                    <td>
                      <span className="cell-id">#{r._id?.slice(-8) || 'N/A'}</span>
                    </td>
                    <td>
                      <div className="cell-customer">
                        <span className="customer-name">{name || 'Unknown'}</span>
                        {phone && <span className="customer-contact"><i className="fas fa-phone" /> {phone}</span>}
                        {!phone && email && <span className="customer-contact"><i className="fas fa-envelope" /> {email}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`type-badge ${(r._type || '').toLowerCase().replace('_', '-')}`}>
                        <i className={
                          r._type === 'LATEX' ? 'fas fa-flask' :
                          r._type === 'BARREL' ? 'fas fa-drum' :
                          r._type === 'SELL_BARRELS' ? 'fas fa-box-open' :
                          r._type === 'CHEMICAL' ? 'fas fa-vial' : 'fas fa-shopping-cart'
                        } />
                        {r._type || 'SELL'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${
                        (r._statusUpper === 'PENDING' || r._statusUpper === 'REQUESTED') ? 'pending' :
                        (r._statusUpper === 'APPROVED' || r.status === 'approved' || approvedRequests.has(r._id)) ? 'approved' :
                        (r._statusUpper === 'ASSIGNED' || assignedRequests.has(r._id)) ? 'assigned' : 'default'
                      }`}>
                        <i className={
                          (r._statusUpper === 'PENDING' || r._statusUpper === 'REQUESTED') ? 'fas fa-clock' :
                          (r._statusUpper === 'APPROVED' || r.status === 'approved' || approvedRequests.has(r._id)) ? 'fas fa-check-circle' :
                          (r._statusUpper === 'ASSIGNED' || assignedRequests.has(r._id)) ? 'fas fa-truck' : 'fas fa-info-circle'
                        } />
                        {assignedRequests.has(r._id) ? 'ASSIGNED' : (r.status || 'PENDING')}
                      </span>
                    </td>
                    <td>
                      <div className="cell-details">
                        {r._type === 'SELL_BARRELS' && (
                          <>
                            {r.barrelCount && (
                              <div className="detail-row">
                                <i className="fas fa-drum" />
                                <span className="detail-label">Barrels:</span>
                                <span className="detail-value">{r.barrelCount}</span>
                              </div>
                            )}
                            {r.companyBarrel && (
                              <div className="detail-row">
                                <i className="fas fa-building" />
                                <span className="detail-label">Company:</span>
                                <span className="detail-value">{r.companyBarrel}</span>
                              </div>
                            )}
                          </>
                        )}
                        {r._notes && (
                          <div className="detail-row">
                            <i className="fas fa-map-pin" />
                            <span className="detail-value">{r._notes.length > 40 ? r._notes.substring(0, 40) + '...' : r._notes}</span>
                          </div>
                        )}
                        {!r._notes && !r.barrelCount && <span className="detail-value">-</span>}
                      </div>
                    </td>
                    <td>
                      <div className="cell-assigned-to">
                        {r.assignedDeliveryStaffId?.name || r.assignedTo?.name || (assignedRequests.has(r._id) ? 'Assigned' : '-')}
                      </div>
                    </td>
                    <td>
                      <div className="cell-location">
                        {(() => {
                          // Extract GPS coordinates if available
                          const locationData = r.location || r.pickupLocation || r.gpsLocation;
                          const hasLocation = locationData && locationData.type === 'Point' && Array.isArray(locationData.coordinates) && locationData.coordinates.length === 2;
                          
                          if (hasLocation) {
                            const [lng, lat] = locationData.coordinates;
                            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                            const accuracy = r.locationAccuracy;
                            
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <a 
                                  href={mapsUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="location-link"
                                  style={{ 
                                    color: '#3b82f6', 
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.875rem'
                                  }}
                                >
                                  <i className="fas fa-map-marker-alt"></i>
                                  View Map
                                </a>
                                {accuracy && (
                                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                    ±{Math.round(accuracy)}m
                                  </small>
                                )}
                              </div>
                            );
                          } else if (r.capturedAddress) {
                            return (
                              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                <i className="fas fa-map-pin"></i> {r.capturedAddress.substring(0, 30)}...
                              </div>
                            );
                          } else {
                            return <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No location</span>;
                          }
                        })()}
                      </div>
                    </td>
                    <td>
                      <span className="cell-date">{safeDate(r._createdAt || r.requestedAt || r.createdAt)}</span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        {r._type === 'SELL' && (
                          <>
                            <button
                              onClick={() => openAssignDelivery(r._id)}
                              disabled={assignedRequests.has(r._id)}
                              className="action-btn action-btn-assign"
                            >
                              <i className="fas fa-truck" />
                              {assignedRequests.has(r._id) ? 'Assigned' : 'Assign'}
                            </button>
                            <button
                              disabled={verifyingId === r._id}
                              onClick={() => verify(r._id)}
                              className="action-btn action-btn-verify"
                            >
                              <i className="fas fa-check-circle" />
                              {verifyingId === r._id ? 'Verifying...' : 'Verify'}
                            </button>
                          </>
                        )}
                        {r._type === 'SELL_BARRELS' && (
                          <>
                            <button
                              onClick={() => approve(r._id)}
                              disabled={approvedRequests.has(r._id) || approvingId === r._id || r._statusUpper === 'APPROVED'}
                              className="action-btn action-btn-approve"
                            >
                              <i className={approvingId === r._id ? "fas fa-spinner fa-spin" : "fas fa-thumbs-up"} />
                              {approvingId === r._id ? 'Approving...' : (approvedRequests.has(r._id) || r._statusUpper === 'APPROVED' ? 'Approved ✓' : 'Approve')}
                            </button>
                            <button
                              onClick={() => openAssignDelivery(r._id)}
                              disabled={assignedRequests.has(r._id) || (!approvedRequests.has(r._id) && r._statusUpper !== 'APPROVED')}
                              className="action-btn action-btn-assign"
                              title={(!approvedRequests.has(r._id) && r._statusUpper !== 'APPROVED') ? 'Approve first before assigning' : ''}
                            >
                              <i className="fas fa-truck" />
                              {assignedRequests.has(r._id) ? 'Assigned ✓' : 'Assign Staff'}
                            </button>
                            <button
                              onClick={() => deleteRequest(r._id)}
                              className="action-btn action-btn-delete"
                              title="Delete this request permanently"
                              style={{
                                backgroundColor: '#dc2626',
                                color: 'white',
                                fontSize: '0.875rem',
                                padding: '6px 12px'
                              }}
                            >
                              <i className="fas fa-trash" />
                              Delete
                            </button>
                          </>
                        )}
                        {r._type !== 'SELL' && r._type !== 'SELL_BARRELS' && (
                          <button
                            onClick={() => alert(`View ${r._type} request details`)}
                            className="action-btn action-btn-details"
                          >
                            <i className="fas fa-info-circle" />
                            Details
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">
                <div className="modal-title-icon">
                  <i className="fas fa-history" />
                </div>
                <h3>Sell Requests History</h3>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="modal-close-btn"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={loadHistory}
                  disabled={historyLoading}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '13px' }}
                >
                  <i className="fas fa-sync-alt" />
                  {historyLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              <table className="history-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Delivery Staff</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map(r => (
                    <tr key={r.id}>
                      <td>{r.user}</td>
                      <td>{r.staff}</td>
                      <td>{r.date ? new Date(r.date).toLocaleString() : '-'}</td>
                      <td>
                        <span className={`status-badge ${
                          r.status?.toLowerCase() === 'pending' ? 'pending' :
                          r.status?.toLowerCase() === 'approved' ? 'approved' :
                          r.status?.toLowerCase() === 'assigned' ? 'assigned' : 'default'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {historyRows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="empty-table-message">
                        {historyLoading ? 'Loading...' : 'No history found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">
                <div className="modal-title-icon">
                  <i className="fas fa-user-plus" />
                </div>
                <h3>Assign Delivery Staff</h3>
              </div>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedStaff('');
                  setAssignDeliveryId(null);
                }}
                className="modal-close-btn"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {/* Customer Info */}
              {assignDeliveryId && (() => {
                const req = [...pendingRequests, ...approvedRequests].find(r => r._id === assignDeliveryId);
                if (req) {
                  const customerName = req.customerName || req.name || req.user?.name || req.farmerId?.name || 'Customer';
                  const customerAddress = req.address || req.user?.address || req.farmerId?.address || req.notes || 'Address not provided';
                  const barrelCount = req.barrelCount || 0;
                  
                  return (
                    <div style={{
                      background: '#f8fafc',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ marginBottom: '12px' }}>
                        <strong style={{ color: '#64748b', fontSize: '13px' }}>Customer:</strong>
                        <div style={{ color: '#0f172a', fontSize: '15px', fontWeight: '600', marginTop: '4px' }}>
                          {customerName}
                        </div>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <strong style={{ color: '#64748b', fontSize: '13px' }}>Quantity:</strong>
                        <div style={{ color: '#0f172a', fontSize: '15px', fontWeight: '600', marginTop: '4px' }}>
                          {barrelCount} barrel(s)
                        </div>
                      </div>
                      <div>
                        <strong style={{ color: '#64748b', fontSize: '13px' }}>Delivery Location *</strong>
                        <input
                          type="text"
                          value={customerAddress}
                          readOnly
                          placeholder="Enter delivery address"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            marginTop: '6px',
                            background: '#f1f5f9',
                            color: '#475569',
                            fontSize: '14px'
                          }}
                        />
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                          Auto-filled from customer address
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              <p style={{ marginBottom: '12px', color: '#475569', fontSize: '14px' }}>Select a delivery staff member to assign this request:</p>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="modal-select"
              >
                <option value="">Choose delivery staff...</option>
                {staffLoading && <option value="" disabled>Loading...</option>}
                {!staffLoading && staffList.map(s => (
                  <option key={s._id} value={s._id}>{s.name || s.email}</option>
                ))}
                {!staffLoading && !staffList.length && <option value="" disabled>No delivery staff found</option>}
              </select>
              {staffError && (
                <div className="alert alert-error">
                  <i className="fas fa-exclamation-circle" />
                  {staffError}
                </div>
              )}
              <div className="modal-actions">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedStaff('');
                    setAssignDeliveryId(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAssignDelivery}
                  disabled={!selectedStaff}
                  className="btn btn-primary"
                >
                  <i className="fas fa-check" />
                  Assign Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerSellRequests;
