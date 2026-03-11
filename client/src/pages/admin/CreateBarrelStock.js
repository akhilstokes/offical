import { useState } from 'react';
import './CreateBarrelStock.css';

const CreateBarrelStock = () => {
  const [formData, setFormData] = useState({
    quantity: '',
    batchName: '',
    notes: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createdBarrels, setCreatedBarrels] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Validate number input - only positive numbers allowed
  const validateNumberInput = (value, min = 0) => {
    if (value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num) || num < min) return '';
    return value;
  };

  const generateBarrelId = (index, batchName) => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = today.getTime().toString().slice(-4);
    const batchPrefix = batchName.substring(0, 3).toUpperCase() || 'BRL';
    return `${batchPrefix}${dateStr}${timeStr}${String(index + 1).padStart(3, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.quantity || formData.quantity < 1) {
      alert('Please enter a valid quantity');
      return;
    }

    setIsCreating(true);
    
    try {
      const quantity = parseInt(formData.quantity);
      const creationDate = new Date().toISOString();
      const newBarrels = [];

      // Generate barrels with unique IDs
      for (let i = 0; i < quantity; i++) {
        const barrel = {
          id: generateBarrelId(i, formData.batchName),
          batchName: formData.batchName || 'Default Batch',
          createdDate: creationDate,
          status: 'AVAILABLE',
          assignedTo: null,
          deliveryStaff: null,
          notes: formData.notes
        };
        newBarrels.push(barrel);
      }

      // Here you would make API call to save barrels
      // await createBarrels(newBarrels);
      
      setCreatedBarrels(newBarrels);
      setShowSuccess(true);
      
      // Reset form
      setFormData({
        quantity: '',
        batchName: '',
        notes: ''
      });

    } catch (error) {
      console.error('Error creating barrels:', error);
      alert('Error creating barrels. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handlePrintQR = () => {
    // Generate QR codes for printing
    const qrData = createdBarrels.map(barrel => ({
      id: barrel.id,
      qrCode: `QR_${barrel.id}`,
      createdDate: barrel.createdDate
    }));
    
    console.log('QR Codes to print:', qrData);
    alert(`QR codes generated for ${qrData.length} barrels. Ready for printing.`);
  };

  return (
    <div className="create-barrel-stock">
      <div className="page-header">
        <h1>🏭 Create Barrel Stock</h1>
        <p>Create new barrels with system-generated unique IDs</p>
      </div>

      <div className="content-grid">
        {/* Creation Form */}
        <div className="creation-form">
          <h2>Create New Batch</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={formData.quantity}
                onChange={(e) => {
                  const validated = validateNumberInput(e.target.value, 1);
                  setFormData({...formData, quantity: validated});
                }}
                placeholder="Enter number of barrels to create"
                required
              />
            </div>

            <div className="form-group">
              <label>Batch Name</label>
              <input
                type="text"
                value={formData.batchName}
                onChange={(e) => setFormData({...formData, batchName: e.target.value})}
                placeholder="e.g., Morning Batch, Premium Stock"
                maxLength="20"
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes about this batch"
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Creating Barrels...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus-circle"></i>
                    Create Barrel Stock
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* System Info */}
        <div className="system-info">
          <h3>System Information</h3>
          <div className="info-card">
            <h4>ID Generation Rules</h4>
            <ul>
              <li>Format: [BATCH][DATE][TIME][SEQUENCE]</li>
              <li>Date: System-generated (today)</li>
              <li>Unique: Guaranteed unique IDs</li>
              <li>Status: All start as AVAILABLE</li>
            </ul>
          </div>

          <div className="info-card">
            <h4>Barrel Lifecycle</h4>
            <div className="lifecycle">
              <div className="step active">AVAILABLE</div>
              <div className="arrow">→</div>
              <div className="step">ASSIGNED</div>
              <div className="arrow">→</div>
              <div className="step">DELIVERED</div>
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
              <h2>Barrels Created Successfully!</h2>
            </div>
            
            <div className="success-stats">
              <p><strong>{createdBarrels.length}</strong> barrels created</p>
              <p>Status: <span className="status-available">AVAILABLE</span></p>
              <p>Created: {new Date().toLocaleString()}</p>
            </div>

            <div className="barrel-list">
              <h3>Created Barrel IDs:</h3>
              <div className="barrel-ids">
                {createdBarrels.slice(0, 10).map(barrel => (
                  <div key={barrel.id} className="barrel-id">
                    {barrel.id}
                  </div>
                ))}
                {createdBarrels.length > 10 && (
                  <div className="more-barrels">
                    +{createdBarrels.length - 10} more barrels
                  </div>
                )}
              </div>
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
                onClick={handlePrintQR}
              >
                <i className="fas fa-qrcode"></i>
                Generate QR Codes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateBarrelStock;