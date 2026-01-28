import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createSellBarrelIntake, getMySellBarrelIntakes, getMyCompanyBarrelsCount } from '../../services/customerService';
import { useConfirm } from '../../components/common/ConfirmDialog';
import './userDashboardTheme.css';

const SellBarrels = () => {
  const { user: authUser, validateToken } = useAuth();
  const [sellRequests, setSellRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myCompanyBarrels, setMyCompanyBarrels] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const confirm = useConfirm();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '', // Add address field
    barrelCount: 1,
    notes: '',
    location: null,
    locationAccuracy: null
  });

  const [geo, setGeo] = useState({ lat: null, lng: null, accuracy: null });
  const [geoStatus, setGeoStatus] = useState('');

  useEffect(() => {
    loadData();
    loadMyCompanyBarrels();
  }, []);

  useEffect(() => {
    // Auto-fill user data
    if (authUser) {
      const name = authUser?.name || authUser?.fullName || authUser?.profile?.name || '';
      const phone = authUser?.phoneNumber || authUser?.phone || authUser?.mobile || authUser?.profile?.phone || '';
      const isGoogle = String(authUser?.provider || '').toLowerCase().includes('google');
      
      setFormData(prev => ({
        ...prev,
        name: name || prev.name,
        phone: isGoogle ? '' : (phone || prev.phone)
      }));
    }
  }, [authUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getMySellBarrelIntakes();
      setSellRequests(Array.isArray(data) ? data : (data.items || []));
    } catch (err) {
      console.error('Error loading sell requests:', err);
      setSellRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMyCompanyBarrels = async () => {
    try {
      const count = await getMyCompanyBarrelsCount();
      setMyCompanyBarrels(Number(count) || 0);
    } catch {
      setMyCompanyBarrels(0);
    }
  };

  const getLocation = () => {
    if (!(navigator && 'geolocation' in navigator)) {
      setGeoStatus('Geolocation not supported');
      return;
    }
    setGeoStatus('Getting location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGeo({ lat: latitude, lng: longitude, accuracy });
        setGeoStatus(`Location captured (±${Math.round(accuracy)}m)`);
      },
      (err) => {
        setGeoStatus(err?.message || 'Failed to get location');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    
    if (myCompanyBarrels === 0) {
      setError('You do not have any company barrels. Please request barrels first.');
      return;
    }

    if (!formData.name || !formData.barrelCount) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.phone || formData.phone.trim() === '') {
      setError('Phone number is required');
      return;
    }

    // ✅ VALIDATE ADDRESS IS PROVIDED (MANDATORY)
    if (!formData.address || formData.address.trim() === '') {
      setError('Address is required. Please provide your complete address for barrel pickup.');
      return;
    }

    const count = Number(formData.barrelCount);
    if (count < 1) {
      setError('Barrel count must be at least 1');
      return;
    }

    if (count > myCompanyBarrels) {
      setError(`You only have ${myCompanyBarrels} barrel(s) available`);
      return;
    }

    const confirmed = await confirm(
      'Confirm Submission',
      `Submit request to sell ${count} barrel(s)?`
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(), // Include address
        barrelCount: count,
        notes: formData.notes || ''
      };

      if (geo.lat && geo.lng) {
        payload.location = { type: 'Point', coordinates: [geo.lng, geo.lat] };
        payload.locationAccuracy = geo.accuracy;
      }

      const response = await createSellBarrelIntake(payload);
      
      // Update barrel count immediately based on response
      if (response && response.remainingBarrels !== undefined) {
        setMyCompanyBarrels(response.remainingBarrels);
        setSuccess(`Sell barrel request submitted successfully! You now have ${response.remainingBarrels} barrel(s) remaining.`);
      } else {
        // Fallback: reload from server
        await loadMyCompanyBarrels();
        setSuccess('Sell barrel request submitted successfully!');
      }
      
      setShowCreateModal(false);
      resetForm();
      await loadData(); // Reload sell requests list
    } catch (err) {
      console.error('Error submitting sell request:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: authUser?.name || '',
      phone: authUser?.phone || '',
      address: authUser?.address || '', // Reset address
      barrelCount: 1,
      notes: ''
    });
    setGeo({ lat: null, lng: null, accuracy: null });
    setGeoStatus('');
    setEditingRequest(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444',
      completed: '#3b82f6'
    };
    return colors[status?.toLowerCase()] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: 'fa-clock',
      approved: 'fa-check-circle',
      rejected: 'fa-times-circle',
      completed: 'fa-flag-checkered'
    };
    return icons[status?.toLowerCase()] || 'fa-circle';
  };

  const handleRepeat = async (request) => {
    setError('');
    setSuccess('');
    
    if (myCompanyBarrels === 0) {
      setError('You do not have any company barrels. Please request barrels first.');
      return;
    }

    const count = Number(request.barrelCount);
    if (count > myCompanyBarrels) {
      setError(`You only have ${myCompanyBarrels} barrel(s) available. This request needs ${count} barrel(s).`);
      return;
    }

    const confirmed = await confirm(
      'Repeat Sell Request',
      `Resubmit the same request to sell ${count} barrel(s)?`
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const payload = {
        name: request.name || request.customerName,
        phone: request.phone || request.customerPhone,
        address: request.address || '', // Include address from previous request
        barrelCount: count,
        notes: request.notes || ''
      };

      // Include location if it exists in the original request
      if (request.location && request.location.coordinates) {
        payload.location = request.location;
        payload.locationAccuracy = request.locationAccuracy;
      }

      await createSellBarrelIntake(payload);
      
      setSuccess('Sell barrel request repeated successfully!');
      await Promise.all([loadData(), loadMyCompanyBarrels()]);
    } catch (err) {
      setError(err?.message || 'Failed to repeat request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: '#0f172a',
          margin: '0 0 0.5rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <i className="fas fa-truck-loading" style={{ color: '#10b981' }}></i>
          Sell Barrels
        </h1>
        <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
          Submit requests to sell your latex-filled barrels
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{
          background: '#fee',
          border: '1px solid #fcc',
          color: '#c33',
          padding: '12px 20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#d1fae5',
          border: '1px solid #6ee7b7',
          color: '#065f46',
          padding: '12px 20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {success}
        </div>
      )}

      {/* Barrel Count Card */}
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        padding: '20px 24px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: 'white'
      }}>
        <div>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px', fontWeight: 500 }}>
            Your Available Barrels
          </div>
          <div style={{ fontSize: '36px', fontWeight: 700, lineHeight: 1 }}>
            {myCompanyBarrels} {myCompanyBarrels === 1 ? 'Barrel' : 'Barrels'}
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          disabled={myCompanyBarrels === 0}
          style={{
            background: 'white',
            color: '#059669',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: myCompanyBarrels === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            opacity: myCompanyBarrels === 0 ? 0.5 : 1
          }}
        >
          <i className="fas fa-plus-circle"></i>
          New Sell Request
        </button>
      </div>

      {/* Requests Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#0f172a' }}>
            My Sell Requests
          </h2>
          <button
            onClick={loadData}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fas fa-sync-alt"></i>
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#10b981' }}></i>
            <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading requests...</p>
          </div>
        ) : sellRequests.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📦</div>
            <div style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              No Sell Requests Yet
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              Create your first sell request to get started
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    Request ID
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    Date
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    Contact
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    Barrels
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    Status
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    Address
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sellRequests.map((request) => (
                  <tr
                    key={request._id}
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                  >
                    <td style={{ padding: '14px 16px', fontSize: '0.875rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        background: '#f3e8ff',
                        color: '#7c3aed',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {request.requestNumber || request._id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: '#475569' }}>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.875rem' }}>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>
                        {request.customerName || request.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {request.customerPhone || request.phone}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>
                      {request.barrelCount}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: `${getStatusColor(request.status)}15`,
                        color: getStatusColor(request.status)
                      }}>
                        <i className={`fas ${getStatusIcon(request.status)}`}></i>
                        {request.status || 'pending'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: '#64748b' }}>
                      {request.address || request.notes || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleRepeat(request)}
                        disabled={submitting || myCompanyBarrels === 0}
                        title="Repeat this request with same details"
                        style={{
                          background: myCompanyBarrels === 0 ? '#e2e8f0' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: myCompanyBarrels === 0 || submitting ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          opacity: myCompanyBarrels === 0 || submitting ? 0.5 : 1,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (myCompanyBarrels > 0 && !submitting) {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <i className="fas fa-redo"></i>
                        Repeat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#1e293b' }}>
              New Sell Barrel Request
            </h3>

            {myCompanyBarrels === 0 && (
              <div style={{
                background: '#fee',
                border: '1px solid #fcc',
                color: '#c33',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '16px'
              }}>
                ⚠️ You don't have any barrels available. Please request barrels first.
              </div>
            )}

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${!formData.phone ? '#fca5a5' : '#e2e8f0'}`,
                    outline: 'none',
                    background: !formData.phone ? '#fef2f2' : 'white'
                  }}
                />
                {!formData.phone && (
                  <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                    <i className="fas fa-exclamation-circle"></i> Phone number is required
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
                  Complete Address * (Required for pickup)
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows="3"
                  placeholder="Enter your complete address including house/building name, street, area, city, pincode..."
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${!formData.address ? '#fca5a5' : '#e2e8f0'}`,
                    outline: 'none',
                    resize: 'vertical',
                    background: !formData.address ? '#fef2f2' : 'white'
                  }}
                />
                {!formData.address && (
                  <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                    <i className="fas fa-exclamation-circle"></i> Complete address is required for barrel pickup
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
                  Number of Barrels * (Available: {myCompanyBarrels})
                </label>
                <input
                  type="number"
                  min="1"
                  max={myCompanyBarrels}
                  value={formData.barrelCount}
                  onChange={(e) => setFormData({ ...formData, barrelCount: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
                  Location (Optional)
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={getLocation}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    <i className="fas fa-map-marker-alt"></i> Get Location
                  </button>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{geoStatus}</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="2"
                  placeholder="Any additional information..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  cursor: 'pointer',
                  fontWeight: '500',
                  color: '#64748b'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || myCompanyBarrels === 0}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: myCompanyBarrels === 0 ? '#cbd5e1' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  cursor: myCompanyBarrels === 0 || submitting ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  color: 'white'
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellBarrels;
