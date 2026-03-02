import React, { useState, useEffect } from 'react';
import { 
  FiTruck, FiSearch, FiFilter, FiAlertCircle, 
  FiCheckCircle, FiClock, FiUser, FiRefreshCw, FiEye 
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './AccountantVehicles.css';

const AccountantVehicles = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // View details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
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

  const openDetailsModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedVehicle(null);
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
    <div className="accountant-vehicles">
      <div className="page-header">
        <div className="header-left">
          <FiTruck className="page-icon" />
          <div>
            <h1>Vehicle Information</h1>
            <p>View vehicle details and compliance status</p>
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
                        className="btn btn-sm btn-secondary"
                        onClick={() => openDetailsModal(vehicle)}
                      >
                        <FiEye /> View Details
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

      {showDetailsModal && selectedVehicle && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Vehicle Details</h2>
              <button className="modal-close" onClick={closeDetailsModal}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-item">
                  <label>Vehicle Number</label>
                  <p>{selectedVehicle.vehicleNumber}</p>
                </div>

                <div className="detail-item">
                  <label>Vehicle Type</label>
                  <p>{selectedVehicle.vehicleType}</p>
                </div>

                <div className="detail-item">
                  <label>RC Number</label>
                  <p>{selectedVehicle.rcNumber}</p>
                </div>

                <div className="detail-item">
                  <label>Status</label>
                  <p>{getStatusBadge(selectedVehicle.status)}</p>
                </div>

                <div className="detail-item">
                  <label>Insurance Start Date</label>
                  <p>{new Date(selectedVehicle.insuranceStartDate).toLocaleDateString()}</p>
                </div>

                <div className="detail-item">
                  <label>Insurance Expiry Date</label>
                  <p>{new Date(selectedVehicle.insuranceExpiryDate).toLocaleDateString()}</p>
                </div>

                <div className="detail-item">
                  <label>Pollution Expiry Date</label>
                  <p>{new Date(selectedVehicle.pollutionExpiryDate).toLocaleDateString()}</p>
                </div>

                <div className="detail-item">
                  <label>Assigned Driver</label>
                  <p>
                    {selectedVehicle.assignedDriver ? (
                      <>
                        <FiUser /> {selectedVehicle.assignedDriver.name}
                        <br />
                        <small>{selectedVehicle.assignedDriver.email}</small>
                      </>
                    ) : (
                      <span className="text-muted">Not Assigned</span>
                    )}
                  </p>
                </div>

                <div className="detail-item full-width">
                  <label>Compliance Status</label>
                  <p>{getExpiryStatusBadge(selectedVehicle.expiryStatus)}</p>
                </div>

                <div className="detail-item full-width">
                  <label>Created</label>
                  <p>{new Date(selectedVehicle.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="read-only-notice">
                <FiAlertCircle />
                <p>This is a read-only view. Contact admin to make changes.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDetailsModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountantVehicles;
