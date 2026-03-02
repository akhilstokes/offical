import React, { useState, useEffect } from 'react';
import { 
  FiTruck, FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, 
  FiAlertCircle, FiCheckCircle, FiClock, FiUser, FiRefreshCw 
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './VehicleManagement.css';

const VehicleManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [deliveryStaff, setDeliveryStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    vehicleType: 'Truck',
    insuranceStartDate: '',
    insuranceExpiryDate: '',
    rcNumber: '',
    pollutionExpiryDate: '',
    status: 'Active',
    assignedDriver: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    loadVehicles();
    loadDeliveryStaff();
  }, [currentPage, statusFilter, typeFilter, searchTerm]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20
      });
      
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('vehicleType', typeFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`${API_URL}/api/vehicles?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        showMessage('error', 'Failed to load vehicles');
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      showMessage('error', 'Error loading vehicles');
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveryStaff = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/all-staff`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Staff API Response:', data);
        
        const allStaff = data.staff || data.users || data.data || [];
        console.log('📋 All staff:', allStaff);
        
        const deliveryOnly = allStaff.filter(s => 
          s.role === 'delivery_staff' || 
          s.role === 'delivery' ||
          s.role?.toLowerCase().includes('delivery')
        );
        
        console.log('🚚 Delivery staff filtered:', deliveryOnly);
        setDeliveryStaff(deliveryOnly);
        
        if (deliveryOnly.length === 0) {
          console.warn('⚠️  No delivery staff found. Available roles:', allStaff.map(s => s.role));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to load delivery staff:', response.status, errorData);
        
        if (response.status === 401) {
          showMessage('error', 'Session expired. Please logout and login again.');
        } else if (response.status === 400) {
          showMessage('error', 'Bad request. Please try logging out and back in.');
        } else {
          showMessage('error', `Failed to load delivery staff (${response.status})`);
        }
      }
    } catch (error) {
      console.error('❌ Error loading delivery staff:', error);
      showMessage('error', 'Network error. Please check your connection.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.vehicleNumber.trim()) {
      errors.vehicleNumber = 'Vehicle number is required';
    }
    if (!formData.vehicleType) {
      errors.vehicleType = 'Vehicle type is required';
    }
    if (!formData.insuranceStartDate) {
      errors.insuranceStartDate = 'Insurance start date is required';
    }
    if (!formData.insuranceExpiryDate) {
      errors.insuranceExpiryDate = 'Insurance expiry date is required';
    }
    if (!formData.rcNumber.trim()) {
      errors.rcNumber = 'RC number is required';
    }
    if (!formData.pollutionExpiryDate) {
      errors.pollutionExpiryDate = 'Pollution expiry date is required';
    }

    // Date validation
    if (formData.insuranceStartDate && formData.insuranceExpiryDate) {
      if (new Date(formData.insuranceExpiryDate) <= new Date(formData.insuranceStartDate)) {
        errors.insuranceExpiryDate = 'Expiry date must be after start date';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const url = modalMode === 'create' 
        ? `${API_URL}/api/vehicles`
        : `${API_URL}/api/vehicles/${selectedVehicle._id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', `Vehicle ${modalMode === 'create' ? 'created' : 'updated'} successfully`);
        closeModal();
        loadVehicles();
      } else {
        showMessage('error', data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      showMessage('error', 'Error saving vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle? This will also delete all associated alerts.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showMessage('success', 'Vehicle deleted successfully');
        loadVehicles();
      } else {
        const data = await response.json();
        showMessage('error', data.message || 'Failed to delete vehicle');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showMessage('error', 'Error deleting vehicle');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedVehicle(null);
    setFormData({
      vehicleNumber: '',
      vehicleType: 'Truck',
      insuranceStartDate: '',
      insuranceExpiryDate: '',
      rcNumber: '',
      pollutionExpiryDate: '',
      status: 'Active',
      assignedDriver: ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (vehicle) => {
    setModalMode('edit');
    setSelectedVehicle(vehicle);
    setFormData({
      vehicleNumber: vehicle.vehicleNumber,
      vehicleType: vehicle.vehicleType,
      insuranceStartDate: vehicle.insuranceStartDate?.split('T')[0] || '',
      insuranceExpiryDate: vehicle.insuranceExpiryDate?.split('T')[0] || '',
      rcNumber: vehicle.rcNumber,
      pollutionExpiryDate: vehicle.pollutionExpiryDate?.split('T')[0] || '',
      status: vehicle.status,
      assignedDriver: vehicle.assignedDriver?._id || ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVehicle(null);
    setFormData({
      vehicleNumber: '',
      vehicleType: 'Truck',
      insuranceStartDate: '',
      insuranceExpiryDate: '',
      rcNumber: '',
      pollutionExpiryDate: '',
      status: 'Active',
      assignedDriver: ''
    });
    setFormErrors({});
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const getExpiryStatusBadge = (expiryStatus) => {
    if (!expiryStatus) return null;

    const hasIssues = expiryStatus.insurance !== 'valid' || expiryStatus.pollution !== 'valid';
    
    if (!hasIssues) {
      return <span className="badge badge-success"><FiCheckCircle /> All Valid</span>;
    }

    const issues = [];
    if (expiryStatus.insurance === 'expired') issues.push('Insurance Expired');
    if (expiryStatus.insurance === 'expiring_soon') issues.push('Insurance Expiring');
    if (expiryStatus.pollution === 'expired') issues.push('Pollution Expired');
    if (expiryStatus.pollution === 'expiring_soon') issues.push('Pollution Expiring');

    const isExpired = expiryStatus.insurance === 'expired' || expiryStatus.pollution === 'expired';
    
    return (
      <span className={`badge ${isExpired ? 'badge-danger' : 'badge-warning'}`}>
        <FiAlertCircle /> {issues.join(', ')}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Active': { class: 'badge-success', icon: <FiCheckCircle /> },
      'Maintenance': { class: 'badge-warning', icon: <FiClock /> },
      'Inactive': { class: 'badge-danger', icon: <FiAlertCircle /> }
    };

    const config = statusConfig[status] || statusConfig['Active'];
    return <span className={`badge ${config.class}`}>{config.icon} {status}</span>;
  };

  return (
    <div className="vehicle-management">
      <div className="page-header">
        <div className="header-left">
          <FiTruck className="page-icon" />
          <div>
            <h1>Vehicle Management</h1>
            <p>Manage delivery vehicles and compliance</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <FiPlus /> Add Vehicle
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="filters-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by vehicle number or RC number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <FiFilter />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="Truck">Truck</option>
            <option value="Van">Van</option>
            <option value="Bike">Bike</option>
          </select>

          <button className="btn btn-secondary" onClick={loadVehicles}>
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading vehicles...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state">
          <FiTruck />
          <h3>No Vehicles Found</h3>
          <p>Add your first vehicle to get started</p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <FiPlus /> Add Vehicle
          </button>
        </div>
      ) : (
        <>
          <div className="vehicles-table">
            <table>
              <thead>
                <tr>
                  <th>Vehicle Number</th>
                  <th>Type</th>
                  <th>RC Number</th>
                  <th>Status</th>
                  <th>Assigned Driver</th>
                  <th>Insurance Expiry</th>
                  <th>Pollution Expiry</th>
                  <th>Compliance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(vehicle => (
                  <tr key={vehicle._id}>
                    <td><strong>{vehicle.vehicleNumber}</strong></td>
                    <td>{vehicle.vehicleType}</td>
                    <td>{vehicle.rcNumber}</td>
                    <td>{getStatusBadge(vehicle.status)}</td>
                    <td>
                      {vehicle.assignedDriver ? (
                        <span className="driver-info">
                          <FiUser /> {vehicle.assignedDriver.name}
                        </span>
                      ) : (
                        <span className="text-muted">Not Assigned</span>
                      )}
                    </td>
                    <td>{new Date(vehicle.insuranceExpiryDate).toLocaleDateString()}</td>
                    <td>{new Date(vehicle.pollutionExpiryDate).toLocaleDateString()}</td>
                    <td>{getExpiryStatusBadge(vehicle.expiryStatus)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon btn-edit" 
                          onClick={() => openEditModal(vehicle)}
                          title="Edit Vehicle"
                        >
                          <FiEdit2 />
                        </button>
                        <button 
                          className="btn-icon btn-delete" 
                          onClick={() => handleDelete(vehicle._id)}
                          title="Delete Vehicle"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'create' ? 'Add New Vehicle' : 'Edit Vehicle'}</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Vehicle Number *</label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., KL01AB1234"
                    className={formErrors.vehicleNumber ? 'error' : ''}
                  />
                  {formErrors.vehicleNumber && <span className="error-text">{formErrors.vehicleNumber}</span>}
                </div>

                <div className="form-group">
                  <label>Vehicle Type *</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    className={formErrors.vehicleType ? 'error' : ''}
                  >
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                    <option value="Bike">Bike</option>
                  </select>
                  {formErrors.vehicleType && <span className="error-text">{formErrors.vehicleType}</span>}
                </div>

                <div className="form-group">
                  <label>RC Number *</label>
                  <input
                    type="text"
                    name="rcNumber"
                    value={formData.rcNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., KL01RC1234"
                    className={formErrors.rcNumber ? 'error' : ''}
                  />
                  {formErrors.rcNumber && <span className="error-text">{formErrors.rcNumber}</span>}
                </div>

                <div className="form-group">
                  <label>Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Insurance Start Date *</label>
                  <input
                    type="date"
                    name="insuranceStartDate"
                    value={formData.insuranceStartDate}
                    onChange={handleInputChange}
                    className={formErrors.insuranceStartDate ? 'error' : ''}
                  />
                  {formErrors.insuranceStartDate && <span className="error-text">{formErrors.insuranceStartDate}</span>}
                </div>

                <div className="form-group">
                  <label>Insurance Expiry Date *</label>
                  <input
                    type="date"
                    name="insuranceExpiryDate"
                    value={formData.insuranceExpiryDate}
                    onChange={handleInputChange}
                    className={formErrors.insuranceExpiryDate ? 'error' : ''}
                  />
                  {formErrors.insuranceExpiryDate && <span className="error-text">{formErrors.insuranceExpiryDate}</span>}
                </div>

                <div className="form-group">
                  <label>Pollution Expiry Date *</label>
                  <input
                    type="date"
                    name="pollutionExpiryDate"
                    value={formData.pollutionExpiryDate}
                    onChange={handleInputChange}
                    className={formErrors.pollutionExpiryDate ? 'error' : ''}
                  />
                  {formErrors.pollutionExpiryDate && <span className="error-text">{formErrors.pollutionExpiryDate}</span>}
                </div>

                <div className="form-group">
                  <label>Assigned Driver</label>
                  <select
                    name="assignedDriver"
                    value={formData.assignedDriver}
                    onChange={handleInputChange}
                  >
                    <option value="">Not Assigned</option>
                    {deliveryStaff.map(staff => (
                      <option key={staff._id} value={staff._id}>
                        {staff.name} ({staff.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : modalMode === 'create' ? 'Create Vehicle' : 'Update Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;
