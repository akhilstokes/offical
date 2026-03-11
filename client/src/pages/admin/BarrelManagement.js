

  import React, { useState, useEffect } from 'react';
import { FiPackage, FiPlus, FiList, FiCheckCircle, FiClock, FiSearch, FiRefreshCw, FiRotateCcw } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import barrelManagementService from '../../services/barrelManagementService';
import './BarrelManagement.css';

const BarrelManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('register');
  const [loading, setLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  
  // Registration Form State
  const [registrationForm, setRegistrationForm] = useState({
    barrelType: 'standard',
    capacity: '200',
    material: 'plastic',
    color: 'blue',
    quantity: 1,
    location: 'warehouse-a',
    notes: ''
  });

  // Data State
  const [barrels, setBarrels] = useState([]);
  const [barrelRequests, setBarrelRequests] = useState([]);
  const [returnedBarrels, setReturnedBarrels] = useState([]);
  const [deliveryStaff, setDeliveryStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Assign Barrel Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [assignSource, setAssignSource] = useState(''); // 'returned' or 'inventory'
  const [barrelIdsInput, setBarrelIdsInput] = useState('');
  
  // Delivery Assignment State
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedDeliveryStaff, setSelectedDeliveryStaff] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');

  // Get current date and user
  const getCurrentDate = () => new Date().toLocaleDateString('en-GB');
  const getCurrentUser = () => user?.name || 'Admin User';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [barrelsData, requestsData] = await Promise.all([
        barrelManagementService.getRegisteredBarrels(),
        barrelManagementService.getBarrelRequests()
      ]);
      setBarrels(barrelsData.barrels || []);
      setBarrelRequests(requestsData || []);
      
      // Load returned barrels from API
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/barrels/returned`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setReturnedBarrels(data.returnedBarrels || data || []);
        }
      } catch (err) {
        console.error('Error loading returned barrels:', err);
      }
      
      // Load delivery staff
      try {
        const staffResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/all-staff`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (staffResponse.ok) {
          const staffData = await staffResponse.json();
          const allStaff = staffData.staff || staffData.users || staffData.data || [];
          console.log('All staff loaded:', allStaff);
          // Filter only delivery staff - check for both 'delivery_staff' and 'DELIVERY STAFF'
          const deliveryOnly = allStaff.filter(s => 
            s.role === 'delivery_staff' || 
            s.role === 'DELIVERY STAFF' ||
            s.role?.toLowerCase().includes('delivery')
          );
          console.log('Filtered delivery staff:', deliveryOnly);
          setDeliveryStaff(deliveryOnly);
        }
      } catch (err) {
        console.error('Error loading delivery staff:', err);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg) => {
    setMessage(msg);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 4000);
  };

  const generateBarrelId = () => {
    // Get current year
    const year = new Date().getFullYear();
    
    // Find the highest barrel number from existing barrels
    let maxNumber = 0;
    
    // Check all barrels for BRL-YYYY-XXX pattern
    barrels.forEach(barrel => {
      const id = barrel.id || barrel.barrelId || '';
      const match = id.match(/^BRL-(\d{4})-(\d{3})$/);
      if (match) {
        const barrelYear = parseInt(match[1]);
        const barrelNumber = parseInt(match[2]);
        // Only count barrels from current year
        if (barrelYear === year) {
          maxNumber = Math.max(maxNumber, barrelNumber);
        }
      }
    });
    
    // Increment and format with leading zeros
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
    return `BRL-${year}-${nextNumber}`;
  };

  // Validate number input - only positive numbers allowed
  const validateNumberInput = (value, min = 0) => {
    if (value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num) || num < min) return '';
    return value;
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await barrelManagementService.registerBarrels(registrationForm);
      if (response.success) {
        setBarrels(prev => [...response.barrels, ...prev]);
        setRegistrationForm({
          barrelType: 'standard',
          capacity: '200',
          material: 'plastic',
          color: 'blue',
          quantity: 1,
          location: 'warehouse-a',
          notes: ''
        });
        showNotification(`✅ Successfully registered ${registrationForm.quantity} barrel(s)!`);
      }
    } catch (error) {
      console.error('Error registering barrels:', error);
      showNotification('❌ Error registering barrels');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (request) => {
    try {
      // First approve the request
      await barrelManagementService.approveBarrelRequest(request._id);
      await loadData();
      showNotification('✅ Request approved! Now assign barrels.');
      
      // Then open the assign barrel modal
      setSelectedRequest(request);
      setShowAssignModal(true);
      setAssignSource('');
      setBarrelIdsInput('');
    } catch (error) {
      console.error('Error approving request:', error);
      showNotification('❌ Error approving request');
    }
  };

  const handleOpenAssignModal = (request) => {
    setSelectedRequest(request);
    setShowAssignModal(true);
    setAssignSource('');
    setBarrelIdsInput('');
  };

  const handleAssignBarrels = async () => {
    // Parse barrel IDs from text input (comma or newline separated)
    const barrelIds = barrelIdsInput
      .split(/[,\n]/)
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (barrelIds.length === 0) {
      showNotification('⚠️ Please enter at least one barrel ID');
      return;
    }

    if (barrelIds.length !== selectedRequest?.quantity) {
      showNotification(`⚠️ Please enter exactly ${selectedRequest?.quantity} barrel ID(s)`);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/barrels/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId: selectedRequest._id,
          barrelIds: barrelIds,
          source: assignSource,
          userId: selectedRequest.user?._id
        })
      });

      if (response.ok) {
        showNotification(`✅ Barrels assigned! Now assign delivery staff.`);
        setShowAssignModal(false);
        setAssignSource('');
        setBarrelIdsInput('');
        await loadData();
        
        // Automatically open delivery staff assignment modal
        handleOpenDeliveryModal(selectedRequest);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        console.error('Server error:', response.status, errorData);
        showNotification(`❌ ${errorData.message || 'Failed to assign barrels'}. Please restart the server.`);
      }
    } catch (error) {
      console.error('Error assigning barrels:', error);
      showNotification('❌ Error assigning barrels. Please restart the backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeliveryModal = (request) => {
    setSelectedRequest(request);
    setShowDeliveryModal(true);
    setSelectedDeliveryStaff('');
    // Auto-fill location from user's request if available
    setDeliveryLocation(request.user?.address || request.deliveryLocation || '');
    // Set default delivery date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDeliveryDate(tomorrow.toISOString().split('T')[0]);
  };

  const handleAssignDeliveryStaff = async () => {
    if (!selectedDeliveryStaff) {
      showNotification('⚠️ Please select a delivery staff member');
      return;
    }

    if (!deliveryDate) {
      showNotification('⚠️ Please select a delivery date');
      return;
    }

    if (!deliveryLocation) {
      showNotification('⚠️ Please enter delivery location');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/barrels/assign-delivery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId: selectedRequest._id,
          deliveryStaffId: selectedDeliveryStaff,
          deliveryDate: deliveryDate,
          deliveryLocation: deliveryLocation
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server needs to be restarted. Please restart the backend server.');
      }

      const data = await response.json();
      
      if (response.ok) {
        showNotification('✅ Delivery staff assigned successfully!');
        setShowDeliveryModal(false);
        setSelectedRequest(null);
        setSelectedDeliveryStaff('');
        setDeliveryDate('');
        setDeliveryLocation('');
        await loadData();
      } else {
        console.error('Server error:', data);
        showNotification(`❌ ${data.message || 'Failed to assign delivery staff'}`);
      }
    } catch (error) {
      console.error('Error assigning delivery staff:', error);
      if (error.message.includes('restart')) {
        showNotification('⚠️ Please restart the backend server to enable this feature');
      } else {
        showNotification('❌ Error assigning delivery staff');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredBarrels = barrels.filter(barrel => {
    const matchesSearch = !searchTerm || 
      barrel.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      barrel.type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || barrel.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const TabButton = ({ id, label, icon, active, onClick }) => (
    <button
      className={`tab-button ${active ? 'active' : ''}`}
      onClick={() => onClick(id)}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="barrel-management">
      {/* Success Message */}
      {showMessage && (
        <div className="success-message">
          {message}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <h1><FiPackage /> Barrel Management System</h1>
        <p>Complete barrel lifecycle management - Register, Track, Approve & Monitor</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <TabButton
          id="register"
          label="Register Barrels"
          icon={<FiPlus />}
          active={activeTab === 'register'}
          onClick={setActiveTab}
        />
        <TabButton
          id="inventory"
          label="Barrel Inventory"
          icon={<FiList />}
          active={activeTab === 'inventory'}
          onClick={setActiveTab}
        />
        <TabButton
          id="returned"
          label="Returned Barrels"
          icon={<FiRotateCcw />}
          active={activeTab === 'returned'}
          onClick={setActiveTab}
        />
        <TabButton
          id="requests"
          label="User Requests"
          icon={<FiClock />}
          active={activeTab === 'requests'}
          onClick={setActiveTab}
        />
        <TabButton
          id="approved"
          label="Approved Barrels"
          icon={<FiCheckCircle />}
          active={activeTab === 'approved'}
          onClick={setActiveTab}
        />
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Register Barrels Tab */}
        {activeTab === 'register' && (
          <div className="register-tab">
            <div className="form-header">
              <h2><FiPlus /> Register New Barrels</h2>
            </div>

            {/* Auto-populated fields */}
            <div className="auto-fields">
              <div className="auto-field">
                <label>Registered By</label>
                <div className="auto-value">{getCurrentUser()}</div>
              </div>
              <div className="auto-field">
                <label>Registration Date</label>
                <div className="auto-value">{getCurrentDate()}</div>
              </div>
            </div>

            <form onSubmit={handleRegistrationSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Barrel Type *</label>
                  <select
                    value={registrationForm.barrelType}
                    onChange={(e) => setRegistrationForm(prev => ({...prev, barrelType: e.target.value}))}
                    required
                  >
                    <option value="standard">Standard Barrel</option>
                    <option value="heavy-duty">Heavy Duty</option>
                    <option value="lightweight">Lightweight</option>
                    <option value="industrial">Industrial Grade</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Capacity (Liters) *</label>
                  <select
                    value={registrationForm.capacity}
                    onChange={(e) => setRegistrationForm(prev => ({...prev, capacity: e.target.value}))}
                    required
                  >
                    <option value="100">100L</option>
                    <option value="150">150L</option>
                    <option value="200">200L</option>
                    <option value="250">250L</option>
                    <option value="300">300L</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Material *</label>
                  <select
                    value={registrationForm.material}
                    onChange={(e) => setRegistrationForm(prev => ({...prev, material: e.target.value}))}
                    required
                  >
                    <option value="plastic">High-Grade Plastic</option>
                    <option value="steel">Stainless Steel</option>
                    <option value="aluminum">Aluminum</option>
                    <option value="composite">Composite Material</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Color *</label>
                  <select
                    value={registrationForm.color}
                    onChange={(e) => setRegistrationForm(prev => ({...prev, color: e.target.value}))}
                    required
                  >
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="red">Red</option>
                    <option value="yellow">Yellow</option>
                    <option value="black">Black</option>
                    <option value="white">White</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    value={registrationForm.quantity}
                    onChange={(e) => {
                      const validated = validateNumberInput(e.target.value, 1);
                      setRegistrationForm(prev => ({...prev, quantity: validated === '' ? 1 : parseInt(validated)}));
                    }}
                    min="1"
                    max="100"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Storage Location *</label>
                  <select
                    value={registrationForm.location}
                    onChange={(e) => setRegistrationForm(prev => ({...prev, location: e.target.value}))}
                    required
                  >
                    <option value="warehouse-a">Warehouse A</option>
                    <option value="warehouse-b">Warehouse B</option>
                    <option value="storage-yard">Storage Yard</option>
                    <option value="production-floor">Production Floor</option>
                    <option value="quality-check">Quality Check Area</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Additional Notes</label>
                  <textarea
                    value={registrationForm.notes}
                    onChange={(e) => setRegistrationForm(prev => ({...prev, notes: e.target.value}))}
                    placeholder="Any additional information about these barrels..."
                    rows="4"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Registering...' : 'REGISTER BARREL'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setRegistrationForm({
                    barrelType: 'standard', capacity: '200', material: 'plastic', color: 'blue',
                    quantity: 1, location: 'warehouse-a', notes: ''
                  })}
                >
                  RESET FORM
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Barrel Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="inventory-tab">
            <div className="inventory-header">
              <h2><FiList /> Barrel Inventory</h2>
              <div className="inventory-controls">
                <div className="search-box">
                  <FiSearch />
                  <input
                    type="text"
                    placeholder="Search barrels..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="status-filter"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="in-use">In Use</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <button className="btn-secondary" onClick={loadData}>
                  <FiRefreshCw /> Refresh
                </button>
              </div>
            </div>

            <div className="inventory-stats">
              <div className="stat-card">
                <div className="stat-number">{barrels.length}</div>
                <div className="stat-label">Total Barrels</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{barrels.filter(b => b.status === 'available').length}</div>
                <div className="stat-label">Available</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{barrels.filter(b => b.status === 'in-use').length}</div>
                <div className="stat-label">In Use</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{barrelRequests.filter(r => r.status === 'pending').length}</div>
                <div className="stat-label">Pending Requests</div>
              </div>
            </div>

            <div className="barrel-grid">
              {filteredBarrels.map((barrel) => (
                <div key={barrel.id} className="barrel-card">
                  <div className="barrel-header">
                    <div className="barrel-id">{barrel.id}</div>
                    <div className={`barrel-status ${barrel.status || 'available'}`}>
                      {barrel.status || 'available'}
                    </div>
                  </div>
                  <div className="barrel-details">
                    <div className="detail-row">
                      <span>Type:</span> {barrel.type}
                    </div>
                    <div className="detail-row">
                      <span>Capacity:</span> {barrel.capacity}L
                    </div>
                    <div className="detail-row">
                      <span>Material:</span> {barrel.material}
                    </div>
                    <div className="detail-row">
                      <span>Location:</span> {barrel.location}
                    </div>
                    <div className="detail-row">
                      <span>Registered:</span> {new Date(barrel.registeredDate).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Requests Tab */}
        {activeTab === 'requests' && (
          <div className="requests-tab">
            <div className="requests-header">
              <h2>
                <FiClock /> Pending User Requests
                <span className="requests-count">
                  {barrelRequests.filter(r => r.status === 'pending').length}
                </span>
              </h2>
            </div>

            <div className="requests-list">
              {barrelRequests.filter(r => r.status === 'pending').map((request) => (
                <div key={request._id} className="request-card">
                  <div className="request-info">
                    <div className="user-info">
                      <strong>{request.user?.name || 'Unknown User'}</strong>
                      <span className="user-email">{request.user?.email}</span>
                    </div>
                    <div className="request-details">
                      <div>Quantity: <strong>{request.quantity}</strong> barrels</div>
                      <div>Requested: {new Date(request.createdAt).toLocaleDateString('en-GB')}</div>
                      {request.notes && <div>Notes: {request.notes}</div>}
                    </div>
                  </div>
                  <div className="request-actions">
                    <button
                      className="btn-approve"
                      onClick={() => handleApproveRequest(request)}
                    >
                      <FiCheckCircle /> Approve & Assign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Barrels Tab */}
        {activeTab === 'approved' && (
          <div className="approved-tab">
            <div className="approved-header">
              <h2><FiCheckCircle /> Approved Barrel Requests</h2>
            </div>

            <div className="approved-list">
              {barrelRequests.filter(r => r.status === 'approved' || r.status === 'assigned').map((request) => (
                <div key={request._id} className="approved-card">
                  <div className="approved-info">
                    <div className="user-info">
                      <strong>{request.user?.name || 'Unknown User'}</strong>
                      <span className="approved-date">
                        Approved: {new Date(request.updatedAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <div className="approved-details">
                      <div>Quantity: <strong>{request.quantity}</strong> barrels</div>
                      {request.adminNotes && <div>Admin Notes: {request.adminNotes}</div>}
                      {request.assignedBarrels && request.assignedBarrels.length > 0 && (
                        <div style={{ marginTop: '8px', padding: '8px', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #0ea5e9' }}>
                          <strong>📦 Assigned Barrels:</strong> {request.assignedBarrels.join(', ')}
                        </div>
                      )}
                      {request.deliveryStaff && (
                        <div style={{ marginTop: '8px', color: '#10b981', fontWeight: '600' }}>
                          ✓ Assigned to: {request.deliveryStaff.name}
                          {request.deliveryDate && ` | Delivery: ${new Date(request.deliveryDate).toLocaleDateString('en-GB')}`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="approved-actions">
                    {!request.assignedBarrels || request.assignedBarrels.length === 0 ? (
                      <button
                        className="btn-assign-delivery"
                        onClick={() => handleOpenAssignModal(request)}
                        style={{ background: '#f59e0b' }}
                      >
                        <FiPackage /> Assign Barrels First
                      </button>
                    ) : !request.deliveryStaff ? (
                      <button
                        className="btn-assign-delivery"
                        onClick={() => handleOpenDeliveryModal(request)}
                      >
                        <FiPackage /> Assign to Delivery
                      </button>
                    ) : (
                      <span className="status-badge delivered">Assigned</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Returned Barrels Tab */}
        {activeTab === 'returned' && (
          <div className="returned-tab">
            <div className="returned-header">
              <h2>
                <FiRotateCcw /> Returned Barrels from Field Staff
                <span className="returned-count">
                  {returnedBarrels.length}
                </span>
              </h2>
              <button className="btn-secondary" onClick={loadData}>
                <FiRefreshCw /> Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                Loading returned barrels...
              </div>
            ) : returnedBarrels.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
                <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>
                  No Returned Barrels
                </div>
                <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                  Barrels returned by field staff will appear here
                </div>
              </div>
            ) : (
              <div className="returned-grid">
                {returnedBarrels.map((barrel) => (
                  <div key={barrel._id || barrel.id} className="returned-card">
                    <div className="returned-card-header">
                      <div className="barrel-id-badge">
                        <FiPackage />
                        <span>{barrel.barrelId || barrel.id || 'N/A'}</span>
                      </div>
                      <div className={`returned-status ${barrel.condition || 'good'}`}>
                        {barrel.condition || 'Good'}
                      </div>
                    </div>
                    
                    <div className="returned-details">
                      <div className="detail-row">
                        <span className="detail-label">Returned By:</span>
                        <span className="detail-value">{barrel.returnedBy?.name || barrel.staffName || 'Unknown'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Staff ID:</span>
                        <span className="detail-value">{barrel.returnedBy?.staffId || barrel.staffId || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Return Date:</span>
                        <span className="detail-value">
                          {barrel.returnDate ? new Date(barrel.returnDate).toLocaleDateString('en-GB') : 'N/A'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Return Time:</span>
                        <span className="detail-value">
                          {barrel.returnDate ? new Date(barrel.returnDate).toLocaleTimeString('en-GB') : 'N/A'}
                        </span>
                      </div>
                      {barrel.location && (
                        <div className="detail-row">
                          <span className="detail-label">Location:</span>
                          <span className="detail-value">{barrel.location}</span>
                        </div>
                      )}
                      {barrel.notes && (
                        <div className="detail-row full-width">
                          <span className="detail-label">Notes:</span>
                          <span className="detail-value">{barrel.notes}</span>
                        </div>
                      )}
                    </div>

                    <div className="returned-actions">
                      <button 
                        className="btn-view"
                        onClick={() => {
                          alert(`Barrel Details:\n\nID: ${barrel.barrelId || barrel.id}\nReturned By: ${barrel.returnedBy?.name || barrel.staffName}\nCondition: ${barrel.condition || 'Good'}\nDate: ${barrel.returnDate ? new Date(barrel.returnDate).toLocaleString('en-GB') : 'N/A'}`);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign Barrel Modal */}
      {showAssignModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="assign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FiPackage /> Assign Barrels to {selectedRequest.user?.name}
              </h2>
              <button className="close-btn" onClick={() => setShowAssignModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="request-summary">
                <p><strong>Requested Quantity:</strong> {selectedRequest.quantity} barrel(s)</p>
                <p><strong>User:</strong> {selectedRequest.user?.email}</p>
              </div>

              {!assignSource ? (
                <div className="source-selection">
                  <h3>Select Barrel Source:</h3>
                  <div className="source-buttons">
                    <button
                      className="source-btn returned"
                      onClick={() => setAssignSource('returned')}
                    >
                      <FiRotateCcw size={32} />
                      <span>Returned Barrels</span>
                      <small>{returnedBarrels.length} available</small>
                    </button>
                    <button
                      className="source-btn inventory"
                      onClick={() => setAssignSource('inventory')}
                    >
                      <FiList size={32} />
                      <span>Barrel Inventory</span>
                      <small>{barrels.filter(b => b.status === 'available').length} available</small>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="barrel-input-section">
                  <div className="selection-header">
                    <h3>
                      Select Barrel IDs from {assignSource === 'returned' ? 'Returned Barrels' : 'Inventory'}
                    </h3>
                    <button className="btn-back" onClick={() => {
                      setAssignSource('');
                      setBarrelIdsInput('');
                    }}>
                      ← Back
                    </button>
                  </div>

                  {/* Available Barrels List */}
                  <div style={{ marginBottom: '16px', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <p style={{ fontWeight: '600', marginBottom: '8px', color: '#475569', fontSize: '13px' }}>
                      📦 Available Barrels (click to add):
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '100px', overflowY: 'auto' }}>
                      {(assignSource === 'returned' 
                        ? returnedBarrels.map(b => b.barrelId || b.id)
                        : barrels.filter(b => b.status === 'available').map(b => b.id)
                      ).map((barrelId) => (
                        <button
                          key={barrelId}
                          type="button"
                          onClick={() => {
                            const currentIds = barrelIdsInput.split(/[,\n]/).map(id => id.trim()).filter(id => id.length > 0);
                            if (!currentIds.includes(barrelId)) {
                              setBarrelIdsInput(prev => prev ? `${prev}\n${barrelId}` : barrelId);
                            }
                          }}
                          style={{
                            padding: '4px 10px',
                            background: barrelIdsInput.includes(barrelId) ? '#10b981' : 'white',
                            color: barrelIdsInput.includes(barrelId) ? 'white' : '#0369a1',
                            border: '1px solid #0ea5e9',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {barrelId} {barrelIdsInput.includes(barrelId) && '✓'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="input-instructions">
                    <p>Selected: {barrelIdsInput.split(/[,\n]/).filter(id => id.trim().length > 0).length} / {selectedRequest.quantity} barrel(s)</p>
                    <p className="example-text">Click barrels above or type manually below</p>
                  </div>

                  <textarea
                    className="barrel-ids-input"
                    value={barrelIdsInput}
                    onChange={(e) => setBarrelIdsInput(e.target.value)}
                    placeholder={`Click barrels above or enter IDs here...\nBRL-2026-001\nBRL-2026-002`}
                    rows={Math.max(5, selectedRequest.quantity + 2)}
                  />

                  <div className="input-count">
                    Entered: {barrelIdsInput.split(/[,\n]/).filter(id => id.trim().length > 0).length} / {selectedRequest.quantity}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAssignModal(false)}>
                Cancel
              </button>
              {assignSource && (
                <button
                  className="btn-confirm"
                  onClick={handleAssignBarrels}
                  disabled={loading}
                >
                  {loading ? 'Assigning...' : 'Assign Barrels'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delivery Staff Assignment Modal */}
      {showDeliveryModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowDeliveryModal(false)}>
          <div className="delivery-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FiPackage /> Assign Delivery Staff
              </h2>
              <button className="close-btn" onClick={() => setShowDeliveryModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="request-summary">
                <p><strong>Customer:</strong> {selectedRequest.user?.name}</p>
                <p><strong>Quantity:</strong> {selectedRequest.quantity} barrel(s)</p>
                {selectedRequest.assignedBarrels && selectedRequest.assignedBarrels.length > 0 && (
                  <p style={{ marginTop: '8px', padding: '8px', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #0ea5e9' }}>
                    <strong>📦 Assigned Barrel IDs:</strong><br/>
                    <span style={{ color: '#0369a1', fontWeight: '600' }}>
                      {selectedRequest.assignedBarrels.join(', ')}
                    </span>
                  </p>
                )}
              </div>

              <div className="delivery-form">
                <div className="form-group">
                  <label>Select Delivery Staff *</label>
                  <select
                    className="delivery-select"
                    value={selectedDeliveryStaff}
                    onChange={(e) => setSelectedDeliveryStaff(e.target.value)}
                  >
                    <option value="">-- Select Delivery Staff --</option>
                    {deliveryStaff.map((staff) => (
                      <option key={staff._id} value={staff._id}>
                        {staff.name} ({staff.staffId || staff.email})
                      </option>
                    ))}
                  </select>
                  {deliveryStaff.length === 0 ? (
                    <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>
                      ⚠️ No delivery staff found. Please add delivery staff in Staff Management first.
                    </p>
                  ) : (
                    <p style={{ color: '#10b981', fontSize: '13px', marginTop: '8px' }}>
                      ✓ {deliveryStaff.length} delivery staff available
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label>Delivery Location *</label>
                  <input
                    type="text"
                    className="delivery-date-input"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    placeholder="Enter delivery address"
                  />
                  <p style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                    {deliveryLocation ? `📍 ${deliveryLocation}` : 'Auto-filled from customer address'}
                  </p>
                </div>

                <div className="form-group">
                  <label>Delivery Date *</label>
                  <input
                    type="date"
                    className="delivery-date-input"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDeliveryModal(false)}>
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={handleAssignDeliveryStaff}
                disabled={loading || !selectedDeliveryStaff || !deliveryDate || !deliveryLocation}
              >
                {loading ? 'Assigning...' : 'Assign Delivery Staff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarrelManagement;