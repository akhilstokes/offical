import React, { useState, useEffect } from 'react';
import './VehicleInfo.css';

const VehicleInfo = () => {
  const [vehicleData, setVehicleData] = useState({
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    vehicleType: 'truck',
    capacity: '',
    fuelType: 'diesel',
    insuranceExpiry: '',
    lastService: '',
    currentLocation: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showTripHistoryModal, setShowTripHistoryModal] = useState(false);
  
  // Data states
  const [fuelLogs, setFuelLogs] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tripHistory, setTripHistory] = useState([]);

  useEffect(() => {
    loadVehicleData();
    getCurrentLocation();
    loadFuelLogs();
    loadMaintenanceRecords();
    loadDocuments();
    loadTripHistory();
  }, []);

  const loadVehicleData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load from API first
      const response = await fetch('/api/delivery/vehicle-info', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVehicleData(data);
      } else {
        // Fallback to localStorage
        const savedData = localStorage.getItem('deliveryVehicleData');
        if (savedData) {
          setVehicleData(JSON.parse(savedData));
        } else {
          // Default fallback data
          setVehicleData({
            vehicleNumber: 'KL-09-CD-5678',
            driverName: 'Ravi Kumar',
            driverPhone: '+91 9845678901',
            vehicleType: 'van',
            capacity: '8',
            fuelType: 'diesel',
            insuranceExpiry: '2024-11-30',
            lastService: '2024-01-10',
            currentLocation: ''
          });
        }
      }
      
      // Also load the vehicle number from ScanBarrels if available
      const savedVehicleNumber = localStorage.getItem('deliveryVehicleNumber');
      if (savedVehicleNumber && !vehicleData.vehicleNumber) {
        setVehicleData(prev => ({ ...prev, vehicleNumber: savedVehicleNumber }));
      }
    } catch (error) {
      console.error('Error loading vehicle data:', error);
      setError('Failed to load vehicle information');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback location
          setCurrentLocation({
            lat: 9.9816,
            lng: 76.2999,
            accuracy: null,
            timestamp: new Date().toISOString()
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      // Fallback for browsers without geolocation
      setCurrentLocation({
        lat: 9.9816,
        lng: 76.2999,
        accuracy: null,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVehicleData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to save to API first
      const response = await fetch('/api/delivery/vehicle-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...vehicleData,
          lastUpdated: new Date().toISOString()
        })
      });

      if (response.ok) {
        const savedData = await response.json();
        setVehicleData(savedData);
      } else {
        // Fallback to localStorage if API fails
        localStorage.setItem('deliveryVehicleData', JSON.stringify(vehicleData));
      }
      
      // Also update the vehicle number in ScanBarrels storage
      if (vehicleData.vehicleNumber) {
        localStorage.setItem('deliveryVehicleNumber', vehicleData.vehicleNumber);
      }
      
      setIsEditing(false);
      alert('Vehicle information saved successfully!');
    } catch (error) {
      console.error('Error saving vehicle data:', error);
      setError('Error saving vehicle information. Saved locally instead.');
      
      // Fallback to localStorage
      localStorage.setItem('deliveryVehicleData', JSON.stringify(vehicleData));
      if (vehicleData.vehicleNumber) {
        localStorage.setItem('deliveryVehicleNumber', vehicleData.vehicleNumber);
      }
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    loadVehicleData(); // Reset to original data
  };

  const formatLocation = (location) => {
    if (!location) return 'Location not available';
    return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
  };

  const refreshLocation = () => {
    getCurrentLocation();
  };

  // Load fuel logs
  const loadFuelLogs = () => {
    const saved = localStorage.getItem('vehicleFuelLogs');
    if (saved) {
      setFuelLogs(JSON.parse(saved));
    }
  };

  // Load maintenance records
  const loadMaintenanceRecords = () => {
    const saved = localStorage.getItem('vehicleMaintenanceRecords');
    if (saved) {
      setMaintenanceRecords(JSON.parse(saved));
    }
  };

  // Load documents
  const loadDocuments = () => {
    const saved = localStorage.getItem('vehicleDocuments');
    if (saved) {
      setDocuments(JSON.parse(saved));
    }
  };

  // Load trip history
  const loadTripHistory = () => {
    const saved = localStorage.getItem('vehicleTripHistory');
    if (saved) {
      setTripHistory(JSON.parse(saved));
    }
  };

  // Add fuel log
  const addFuelLog = (log) => {
    const newLog = {
      id: Date.now(),
      date: new Date().toISOString(),
      ...log
    };
    const updated = [newLog, ...fuelLogs];
    setFuelLogs(updated);
    localStorage.setItem('vehicleFuelLogs', JSON.stringify(updated));
  };

  // Add maintenance record
  const addMaintenanceRecord = (record) => {
    const newRecord = {
      id: Date.now(),
      date: new Date().toISOString(),
      ...record
    };
    const updated = [newRecord, ...maintenanceRecords];
    setMaintenanceRecords(updated);
    localStorage.setItem('vehicleMaintenanceRecords', JSON.stringify(updated));
  };

  // Add document
  const addDocument = (doc) => {
    const newDoc = {
      id: Date.now(),
      uploadDate: new Date().toISOString(),
      ...doc
    };
    const updated = [newDoc, ...documents];
    setDocuments(updated);
    localStorage.setItem('vehicleDocuments', JSON.stringify(updated));
  };

  if (loading && !vehicleData.vehicleNumber) {
    return (
      <div className="vehicle-info-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading vehicle information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-info-container">
      {error && (
        <div className="error-banner">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="close-error">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className="vehicle-info-header">
        <div className="header-content">
          <div className="header-icon">
            <i className="fas fa-car"></i>
          </div>
          <div className="header-text">
            <h1>Vehicle Information</h1>
            <p>Manage your delivery vehicle details and status</p>
          </div>
        </div>
        <div className="header-actions">
          {!isEditing ? (
            <button className="btn btn-primary" onClick={handleEdit}>
              <i className="fas fa-edit"></i>
              Edit Information
            </button>
          ) : (
            <div className="edit-actions">
              <button className="btn btn-secondary" onClick={handleCancel}>
                <i className="fas fa-times"></i>
                Cancel
              </button>
              <button 
                className="btn btn-success" 
                onClick={handleSave}
                disabled={loading}
              >
                <i className="fas fa-save"></i>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="vehicle-info-content">
        {/* Vehicle Details Card */}
        <div className="info-card">
          <div className="card-header">
            <h2><i className="fas fa-truck"></i> Vehicle Details</h2>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Vehicle Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={vehicleData.vehicleNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., KL-07-AB-1234"
                    className="form-input"
                  />
                ) : (
                  <div className="form-display">
                    {vehicleData.vehicleNumber || 'Not set'}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Vehicle Type</label>
                {isEditing ? (
                  <select
                    name="vehicleType"
                    value={vehicleData.vehicleType}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="truck">Truck</option>
                    <option value="van">Van</option>
                    <option value="pickup">Pickup</option>
                    <option value="motorcycle">Motorcycle</option>
                  </select>
                ) : (
                  <div className="form-display">
                    {vehicleData.vehicleType.charAt(0).toUpperCase() + vehicleData.vehicleType.slice(1)}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Capacity (Barrels)</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="capacity"
                    value={vehicleData.capacity}
                    onChange={handleInputChange}
                    placeholder="e.g., 10"
                    className="form-input"
                  />
                ) : (
                  <div className="form-display">
                    {vehicleData.capacity ? `${vehicleData.capacity} barrels` : 'Not set'}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Fuel Type</label>
                {isEditing ? (
                  <select
                    name="fuelType"
                    value={vehicleData.fuelType}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value="diesel">Diesel</option>
                    <option value="petrol">Petrol</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                ) : (
                  <div className="form-display">
                    {vehicleData.fuelType.charAt(0).toUpperCase() + vehicleData.fuelType.slice(1)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Driver Details Card */}
        <div className="info-card">
          <div className="card-header">
            <h2><i className="fas fa-user"></i> Driver Details</h2>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Driver Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="driverName"
                    value={vehicleData.driverName}
                    onChange={handleInputChange}
                    placeholder="Enter driver name"
                    className="form-input"
                  />
                ) : (
                  <div className="form-display">
                    {vehicleData.driverName || 'Not set'}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Driver Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="driverPhone"
                    value={vehicleData.driverPhone}
                    onChange={handleInputChange}
                    placeholder="e.g., +91 9876543210"
                    className="form-input"
                  />
                ) : (
                  <div className="form-display">
                    {vehicleData.driverPhone || 'Not set'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance & Documents Card */}
        <div className="info-card">
          <div className="card-header">
            <h2><i className="fas fa-tools"></i> Maintenance & Documents</h2>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Insurance Expiry</label>
                {isEditing ? (
                  <input
                    type="date"
                    name="insuranceExpiry"
                    value={vehicleData.insuranceExpiry}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                ) : (
                  <div className="form-display">
                    {vehicleData.insuranceExpiry ? 
                      new Date(vehicleData.insuranceExpiry).toLocaleDateString() : 
                      'Not set'
                    }
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Last Service Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    name="lastService"
                    value={vehicleData.lastService}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                ) : (
                  <div className="form-display">
                    {vehicleData.lastService ? 
                      new Date(vehicleData.lastService).toLocaleDateString() : 
                      'Not set'
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Current Location Card */}
        <div className="info-card">
          <div className="card-header">
            <h2><i className="fas fa-map-marker-alt"></i> Current Location</h2>
          </div>
          <div className="card-body">
            <div className="location-info">
              <div className="location-display">
                <i className="fas fa-location-arrow"></i>
                <span>{formatLocation(currentLocation)}</span>
                {currentLocation && currentLocation.accuracy && (
                  <span className="accuracy"> (±{Math.round(currentLocation.accuracy)}m)</span>
                )}
              </div>
              {currentLocation && (
                <>
                  <p className="location-timestamp">
                    Last updated: {new Date(currentLocation.timestamp).toLocaleString()}
                  </p>
                  <div className="location-actions">
                    <a 
                      href={`https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                    >
                      <i className="fas fa-map"></i>
                      View on Map
                    </a>
                    <button 
                      className="btn btn-outline"
                      onClick={refreshLocation}
                    >
                      <i className="fas fa-sync"></i>
                      Refresh Location
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-card">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-btn" onClick={() => setShowFuelModal(true)}>
              <i className="fas fa-gas-pump"></i>
              <span>Fuel Log</span>
            </button>
            <button className="action-btn" onClick={() => setShowMaintenanceModal(true)}>
              <i className="fas fa-wrench"></i>
              <span>Maintenance</span>
            </button>
            <button className="action-btn" onClick={() => setShowDocumentsModal(true)}>
              <i className="fas fa-file-alt"></i>
              <span>Documents</span>
            </button>
            <button className="action-btn" onClick={() => setShowTripHistoryModal(true)}>
              <i className="fas fa-route"></i>
              <span>Trip History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fuel Log Modal */}
      {showFuelModal && (
        <FuelLogModal
          fuelLogs={fuelLogs}
          onClose={() => setShowFuelModal(false)}
          onAdd={addFuelLog}
        />
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <MaintenanceModal
          records={maintenanceRecords}
          onClose={() => setShowMaintenanceModal(false)}
          onAdd={addMaintenanceRecord}
        />
      )}

      {/* Documents Modal */}
      {showDocumentsModal && (
        <DocumentsModal
          documents={documents}
          onClose={() => setShowDocumentsModal(false)}
          onAdd={addDocument}
        />
      )}

      {/* Trip History Modal */}
      {showTripHistoryModal && (
        <TripHistoryModal
          trips={tripHistory}
          onClose={() => setShowTripHistoryModal(false)}
        />
      )}
    </div>
  );
};

// Fuel Log Modal Component
const FuelLogModal = ({ fuelLogs, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    liters: '',
    cost: '',
    odometer: '',
    station: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({ liters: '', cost: '', odometer: '', station: '', notes: '' });
    alert('Fuel log added successfully!');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><i className="fas fa-gas-pump"></i> Fuel Log</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="fuel-form">
            <div className="form-row">
              <div className="form-group">
                <label>Liters</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.liters}
                  onChange={(e) => setFormData({...formData, liters: e.target.value})}
                  required
                  placeholder="e.g., 50"
                />
              </div>
              <div className="form-group">
                <label>Cost (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({...formData, cost: e.target.value})}
                  required
                  placeholder="e.g., 4500"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Odometer (km)</label>
                <input
                  type="number"
                  value={formData.odometer}
                  onChange={(e) => setFormData({...formData, odometer: e.target.value})}
                  required
                  placeholder="e.g., 45000"
                />
              </div>
              <div className="form-group">
                <label>Station</label>
                <input
                  type="text"
                  value={formData.station}
                  onChange={(e) => setFormData({...formData, station: e.target.value})}
                  placeholder="e.g., Indian Oil"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes..."
                rows="2"
              />
            </div>
            <button type="submit" className="btn btn-primary">Add Fuel Log</button>
          </form>

          <div className="logs-list">
            <h3>Recent Fuel Logs</h3>
            {fuelLogs.length === 0 ? (
              <p className="no-data">No fuel logs yet</p>
            ) : (
              fuelLogs.slice(0, 5).map(log => (
                <div key={log.id} className="log-item">
                  <div className="log-header">
                    <span className="log-date">{new Date(log.date).toLocaleDateString()}</span>
                    <span className="log-cost">₹{log.cost}</span>
                  </div>
                  <div className="log-details">
                    <span>{log.liters}L</span>
                    <span>•</span>
                    <span>{log.odometer} km</span>
                    {log.station && <><span>•</span><span>{log.station}</span></>}
                  </div>
                  {log.notes && <p className="log-notes">{log.notes}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Maintenance Modal Component
const MaintenanceModal = ({ records, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    type: 'service',
    description: '',
    cost: '',
    workshop: '',
    nextDue: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({ type: 'service', description: '', cost: '', workshop: '', nextDue: '' });
    alert('Maintenance record added successfully!');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><i className="fas fa-wrench"></i> Maintenance Records</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="maintenance-form">
            <div className="form-group">
              <label>Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                required
              >
                <option value="service">Regular Service</option>
                <option value="repair">Repair</option>
                <option value="tire">Tire Change</option>
                <option value="oil">Oil Change</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
                placeholder="Describe the maintenance work..."
                rows="3"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Cost (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({...formData, cost: e.target.value})}
                  required
                  placeholder="e.g., 5000"
                />
              </div>
              <div className="form-group">
                <label>Workshop</label>
                <input
                  type="text"
                  value={formData.workshop}
                  onChange={(e) => setFormData({...formData, workshop: e.target.value})}
                  placeholder="Workshop name"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Next Due Date</label>
              <input
                type="date"
                value={formData.nextDue}
                onChange={(e) => setFormData({...formData, nextDue: e.target.value})}
              />
            </div>
            <button type="submit" className="btn btn-primary">Add Record</button>
          </form>

          <div className="logs-list">
            <h3>Recent Maintenance</h3>
            {records.length === 0 ? (
              <p className="no-data">No maintenance records yet</p>
            ) : (
              records.slice(0, 5).map(record => (
                <div key={record.id} className="log-item">
                  <div className="log-header">
                    <span className="log-date">{new Date(record.date).toLocaleDateString()}</span>
                    <span className="log-type">{record.type}</span>
                  </div>
                  <p className="log-description">{record.description}</p>
                  <div className="log-details">
                    <span>₹{record.cost}</span>
                    {record.workshop && <><span>•</span><span>{record.workshop}</span></>}
                  </div>
                  {record.nextDue && (
                    <p className="log-next-due">Next due: {new Date(record.nextDue).toLocaleDateString()}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Documents Modal Component
const DocumentsModal = ({ documents, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'insurance',
    number: '',
    expiryDate: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({ name: '', type: 'insurance', number: '', expiryDate: '', notes: '' });
    alert('Document added successfully!');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><i className="fas fa-file-alt"></i> Vehicle Documents</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="documents-form">
            <div className="form-group">
              <label>Document Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                required
              >
                <option value="insurance">Insurance</option>
                <option value="registration">Registration</option>
                <option value="permit">Permit</option>
                <option value="pollution">Pollution Certificate</option>
                <option value="fitness">Fitness Certificate</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Document Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                placeholder="e.g., Vehicle Insurance Policy"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Document Number</label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  placeholder="e.g., POL123456"
                />
              </div>
              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes..."
                rows="2"
              />
            </div>
            <button type="submit" className="btn btn-primary">Add Document</button>
          </form>

          <div className="logs-list">
            <h3>Saved Documents</h3>
            {documents.length === 0 ? (
              <p className="no-data">No documents saved yet</p>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className="log-item">
                  <div className="log-header">
                    <span className="log-type">{doc.type}</span>
                    {doc.expiryDate && (
                      <span className={`log-expiry ${new Date(doc.expiryDate) < new Date() ? 'expired' : ''}`}>
                        {new Date(doc.expiryDate) < new Date() ? 'Expired' : 'Valid'}
                      </span>
                    )}
                  </div>
                  <p className="log-description">{doc.name}</p>
                  <div className="log-details">
                    {doc.number && <span>{doc.number}</span>}
                    {doc.expiryDate && (
                      <>
                        <span>•</span>
                        <span>Expires: {new Date(doc.expiryDate).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                  {doc.notes && <p className="log-notes">{doc.notes}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Trip History Modal Component
const TripHistoryModal = ({ trips, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><i className="fas fa-route"></i> Trip History</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="trip-stats">
            <div className="stat-card">
              <i className="fas fa-road"></i>
              <div>
                <h4>Total Trips</h4>
                <p>{trips.length}</p>
              </div>
            </div>
            <div className="stat-card">
              <i className="fas fa-calendar-week"></i>
              <div>
                <h4>This Week</h4>
                <p>{trips.filter(t => {
                  const tripDate = new Date(t.date);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return tripDate >= weekAgo;
                }).length}</p>
              </div>
            </div>
          </div>

          <div className="logs-list">
            <h3>Recent Trips</h3>
            {trips.length === 0 ? (
              <p className="no-data">No trip history available. Trips are automatically logged from your deliveries.</p>
            ) : (
              trips.slice(0, 10).map(trip => (
                <div key={trip.id} className="log-item trip-item">
                  <div className="log-header">
                    <span className="log-date">{new Date(trip.date).toLocaleDateString()}</span>
                    <span className="log-status">{trip.status}</span>
                  </div>
                  <div className="trip-route">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{trip.from}</span>
                    <i className="fas fa-arrow-right"></i>
                    <span>{trip.to}</span>
                  </div>
                  <div className="log-details">
                    {trip.distance && <span>{trip.distance} km</span>}
                    {trip.duration && <><span>•</span><span>{trip.duration}</span></>}
                    {trip.barrels && <><span>•</span><span>{trip.barrels} barrels</span></>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleInfo;