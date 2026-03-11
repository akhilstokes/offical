import { useState } from 'react';
import './RequestBarrels.css';

const RequestBarrels = () => {
  const [formData, setFormData] = useState({
    quantity: '',
    deliveryAddress: {
      houseName: '',
      area: '',
      pincode: '',
      landmark: '',
      phoneNumber: ''
    },
    notes: '',
    urgency: 'normal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [requestId, setRequestId] = useState('');

  // Validate number input - only positive numbers allowed
  const validateNumberInput = (value, min = 1, max = 100) => {
    if (value === '') return '';
    const num = parseInt(value);
    if (isNaN(num) || num < min || num > max) return '';
    return value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.quantity || formData.quantity < 1) {
      alert('Please enter a valid quantity');
      return;
    }

    if (!formData.deliveryAddress.houseName || !formData.deliveryAddress.area || !formData.deliveryAddress.pincode) {
      alert('Please fill in all required address fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Generate request ID
      const newRequestId = `REQ${Date.now().toString().slice(-6)}`;
      
      // Here you would make API call to submit request
      const requestData = {
        ...formData,
        requestId: newRequestId,
        requestDate: new Date().toISOString(),
        status: 'pending',
        userId: 'current-user-id' // This would come from auth context
      };
      
      console.log('Submitting request:', requestData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setRequestId(newRequestId);
      setShowSuccess(true);
      
      // Reset form
      setFormData({
        quantity: '',
        deliveryAddress: {
          houseName: '',
          area: '',
          pincode: '',
          landmark: '',
          phoneNumber: ''
        },
        notes: '',
        urgency: 'normal'
      });

    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Error submitting request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddressChange = (field, value) => {
    setFormData({
      ...formData,
      deliveryAddress: {
        ...formData.deliveryAddress,
        [field]: value
      }
    });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="request-barrels">
      <div className="page-header">
        <h1>📦 Request New Barrels</h1>
        <p>Submit a request for new barrels to be delivered to your location</p>
      </div>

      <div className="content-grid">
        {/* Request Form */}
        <div className="request-form">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h2>Request Details</h2>
              
              <div className="form-group">
                <label>Request Date *</label>
                <input
                  type="text"
                  value={getCurrentDate()}
                  disabled
                  className="system-generated"
                />
                <small>System generated - cannot be modified</small>
              </div>

              <div className="form-group">
                <label>Number of Barrels *</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.quantity}
                  onChange={(e) => {
                    const validated = validateNumberInput(e.target.value, 1, 10);
                    setFormData({...formData, quantity: validated === '' ? 1 : parseInt(validated)});
                  }}
                  placeholder="Enter quantity (1-10)"
                  required
                />
              </div>

              <div className="form-group">
                <label>Urgency Level</label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                >
                  <option value="normal">Normal (3-5 days)</option>
                  <option value="urgent">Urgent (1-2 days)</option>
                  <option value="emergency">Emergency (Same day)</option>
                </select>
              </div>
            </div>

            <div className="form-section">
              <h2>Delivery Address</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>House/Building Name *</label>
                  <input
                    type="text"
                    value={formData.deliveryAddress.houseName}
                    onChange={(e) => handleAddressChange('houseName', e.target.value)}
                    placeholder="e.g., Green Villa, Apartment 3B"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Area/Street *</label>
                  <input
                    type="text"
                    value={formData.deliveryAddress.area}
                    onChange={(e) => handleAddressChange('area', e.target.value)}
                    placeholder="e.g., MG Road, Kakkanad"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    pattern="[0-9]{6}"
                    value={formData.deliveryAddress.pincode}
                    onChange={(e) => handleAddressChange('pincode', e.target.value)}
                    placeholder="e.g., 682001"
                    maxLength="6"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    pattern="[0-9]{10}"
                    value={formData.deliveryAddress.phoneNumber}
                    onChange={(e) => handleAddressChange('phoneNumber', e.target.value)}
                    placeholder="e.g., 9876543210"
                    maxLength="10"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Landmark (Optional)</label>
                <input
                  type="text"
                  value={formData.deliveryAddress.landmark}
                  onChange={(e) => handleAddressChange('landmark', e.target.value)}
                  placeholder="e.g., Near City Mall, Opposite Bank"
                />
              </div>
            </div>

            <div className="form-section">
              <h2>Additional Information</h2>
              
              <div className="form-group">
                <label>Special Instructions (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any special delivery instructions or requirements..."
                  rows="4"
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Panel */}
        <div className="info-panel">
          <div className="info-card">
            <h3>📋 Request Process</h3>
            <div className="process-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Submit Request</h4>
                  <p>Fill out the form with your requirements</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Admin Review</h4>
                  <p>Admin reviews and approves your request</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Barrel Assignment</h4>
                  <p>Available barrels are assigned to you</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Delivery</h4>
                  <p>Delivery staff brings barrels to your location</p>
                </div>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h3>⏰ Delivery Times</h3>
            <div className="delivery-times">
              <div className="time-option">
                <span className="urgency normal">Normal</span>
                <span className="duration">3-5 business days</span>
              </div>
              <div className="time-option">
                <span className="urgency urgent">Urgent</span>
                <span className="duration">1-2 business days</span>
              </div>
              <div className="time-option">
                <span className="urgency emergency">Emergency</span>
                <span className="duration">Same day delivery</span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h3>📞 Need Help?</h3>
            <p>If you have any questions about your request, contact our support team:</p>
            <div className="contact-info">
              <p><i className="fas fa-phone"></i> +91 9876543210</p>
              <p><i className="fas fa-envelope"></i> support@company.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="success-modal">
          <div className="modal-content">
            <div className="success-header">
              <i className="fas fa-check-circle"></i>
              <h2>Request Submitted Successfully!</h2>
            </div>
            
            <div className="success-details">
              <p><strong>Request ID:</strong> #{requestId}</p>
              <p><strong>Quantity:</strong> {formData.quantity} barrels</p>
              <p><strong>Status:</strong> <span className="status-pending">Pending Review</span></p>
              <p><strong>Submitted:</strong> {getCurrentDate()}</p>
            </div>

            <div className="success-message">
              <p>Your barrel request has been submitted and is now pending admin approval. You will receive a notification once your request is reviewed.</p>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowSuccess(false)}
              >
                Close
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowSuccess(false);
                  // Navigate to requests page
                  window.location.href = '/user/my-requests';
                }}
              >
                <i className="fas fa-list"></i>
                View My Requests
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestBarrels;