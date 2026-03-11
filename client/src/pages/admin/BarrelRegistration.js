import React, { useState, useEffect } from 'react';
import { FiPackage, FiPlus, FiSave, FiRefreshCw, FiUser, FiCalendar } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import barrelManagementService from '../../services/barrelManagementService';
import './BarrelRegistration.css';

const BarrelRegistration = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    barrelType: 'standard',
    capacity: '200',
    material: 'plastic',
    color: 'blue',
    quantity: 1,
    location: 'warehouse-a',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [registeredBarrels, setRegisteredBarrels] = useState([]);

  // Validate number input - only positive numbers allowed
  const validateNumberInput = (value, min = 0) => {
    if (value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num) || num < min) return '';
    return value;
  };

  // Get current date in readable format
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get current user name
  const getCurrentUser = () => {
    return user?.name || 'Admin User';
  };

  useEffect(() => {
    loadRegisteredBarrels();
  }, []);

  const loadRegisteredBarrels = async () => {
    try {
      const response = await barrelManagementService.getRegisteredBarrels();
      setRegisteredBarrels(response.barrels || []);
    } catch (error) {
      console.error('Error loading registered barrels:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await barrelManagementService.registerBarrels(formData);
      
      if (response.success) {
        // Add new barrels to the list
        setRegisteredBarrels(prev => [...response.barrels, ...prev]);
        
        // Reset form
        setFormData({
          barrelType: 'standard',
          capacity: '200',
          material: 'plastic',
          color: 'blue',
          quantity: 1,
          location: 'warehouse-a',
          notes: ''
        });

        alert(`✅ Success!\n${response.message}\nRegistered on: ${getCurrentDate()}`);
      }
    } catch (error) {
      console.error('Error registering barrels:', error);
      alert('❌ Error registering barrels. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="barrel-registration">
      <div className="page-header">
        <div className="header-content">
          <h1><FiPackage /> Barrel Registration</h1>
          <p>Register new barrels into the system inventory</p>
        </div>
      </div>

      <div className="registration-container">
        <div className="registration-form-section">
          <div className="form-card">
            <div className="form-header">
              <h2><FiPlus /> Register New Barrels</h2>
              <p>Fill in the details to register barrels in the system</p>
            </div>

            <form onSubmit={handleSubmit} className="barrel-form">
              {/* Auto-populated fields display */}
              <div className="auto-fields">
                <div className="auto-field">
                  <label><FiUser /> Registered By</label>
                  <div className="auto-value">{getCurrentUser()}</div>
                </div>
                <div className="auto-field">
                  <label><FiCalendar /> Registration Date</label>
                  <div className="auto-value">{getCurrentDate()}</div>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="barrelType">Barrel Type</label>
                  <select
                    id="barrelType"
                    name="barrelType"
                    value={formData.barrelType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="standard">Standard Barrel</option>
                    <option value="heavy-duty">Heavy Duty</option>
                    <option value="lightweight">Lightweight</option>
                    <option value="industrial">Industrial Grade</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="capacity">Capacity (Liters)</label>
                  <select
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
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
                  <label htmlFor="material">Material</label>
                  <select
                    id="material"
                    name="material"
                    value={formData.material}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="plastic">High-Grade Plastic</option>
                    <option value="steel">Stainless Steel</option>
                    <option value="aluminum">Aluminum</option>
                    <option value="composite">Composite Material</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="color">Color</label>
                  <select
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
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
                  <label htmlFor="quantity">Quantity to Register</label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={(e) => {
                      const validated = validateNumberInput(e.target.value, 1);
                      setFormData(prev => ({...prev, quantity: validated === '' ? 1 : parseInt(validated)}));
                    }}
                    min="1"
                    max="100"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Storage Location</label>
                  <select
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="warehouse-a">Warehouse A</option>
                    <option value="warehouse-b">Warehouse B</option>
                    <option value="storage-yard">Storage Yard</option>
                    <option value="production-floor">Production Floor</option>
                    <option value="quality-check">Quality Check Area</option>
                  </select>
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="notes">Additional Notes (Optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional information about these barrels..."
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FiRefreshCw className="spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <FiSave />
                      Register {formData.quantity} Barrel{formData.quantity > 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="recent-registrations">
          <div className="registrations-card">
            <div className="card-header">
              <h3>Recently Registered Barrels</h3>
              <span className="count-badge">{registeredBarrels.length}</span>
            </div>

            <div className="registrations-list">
              {registeredBarrels.length > 0 ? (
                registeredBarrels.slice(0, 10).map((barrel) => (
                  <div key={barrel.id} className="registration-item">
                    <div className="barrel-info">
                      <div className="barrel-id">
                        <strong>{barrel.id}</strong>
                      </div>
                      <div className="barrel-details">
                        <span className="detail">{barrel.capacity}L {barrel.type}</span>
                        <span className="detail">{barrel.material} - {barrel.color}</span>
                        <span className="location">{barrel.location}</span>
                        <span className="registered-by">By: {barrel.registeredBy || getCurrentUser()}</span>
                      </div>
                    </div>
                    <div className="registration-meta">
                      <span className="status available">Available</span>
                      <span className="date">
                        {new Date(barrel.registeredDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-registrations">
                  <FiPackage className="empty-icon" />
                  <p>No barrels registered yet</p>
                  <p className="sub-text">Use the form to register your first barrel</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarrelRegistration;