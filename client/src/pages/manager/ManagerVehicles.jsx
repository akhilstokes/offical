import React, { useState, useEffect } from 'react';
import { 
  FiTruck, FiSearch, FiFilter, FiAlertCircle, 
  FiCheckCircle, FiClock, FiUser, FiRefreshCw 
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './ManagerVehicles.css';

const ManagerVehicles = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Status update modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    loadVehicles();
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

  const openStatusModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setNewStatus(vehicle.status);
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedVehicle(null);
    setNewStatus('');
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    
    if (!newStatus) {
      showMessage('error', 'Please select a status');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/vehicles/${selectedVehicle._id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', 'Vehicle status updated successfully');
        closeStatusModal();
        loadVehicles();
      } else {
        showMessage('error', data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showMessage('error', 'Error updating status');
    } finally {
      setLoading(false);
    }
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
    <div className="manager-vehicles">
      <div className="page-header">
        <div className="header-left">
          <FiTruck className="page-icon" />
          <div>
            <h1>Vehicle Management</h1>
            <p>View vehicles and update status</p>
          </div>
        </div>
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
          <p>No vehicles match your search criteria</p>
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
                  <th>Action</th>
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
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => openStatusModal(vehicle)}
                      >
                        Update Status
                      </button>
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

      {showStatusModal && (
        <div className="modal-overlay" onClick={closeStatusModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Vehicle Status</h2>
              <button className="modal-close" onClick={closeStatusModal}>&times;</button>
            </div>

            <form onSubmit={handleStatusUpdate}>
              <div className="modal-body">
                <div className="vehicle-info">
                  <p><strong>Vehicle:</strong> {selectedVehicle?.vehicleNumber}</p>
                  <p><strong>Type:</strong> {selectedVehicle?.vehicleType}</p>
                  <p><strong>Current Status:</strong> {getStatusBadge(selectedVehicle?.status)}</p>
                </div>

                <div className="form-group">
                  <label>New Status *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="status-info">
                  <p><FiAlertCircle /> Note: Only status can be updated. Contact admin for other changes.</p>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeStatusModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerVehicles;
