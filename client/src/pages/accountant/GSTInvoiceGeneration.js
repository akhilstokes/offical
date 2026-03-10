import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GSTInvoiceGeneration.css';

const GSTInvoiceGeneration = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [companySettings, setCompanySettings] = useState(null);
  const [formData, setFormData] = useState({
    reverseCharge: 'No',
    vendorName: '',
    placeOfSupply: '',
    customerName: '',
    customerAddress: '',
    customerGSTIN: '',
    customerState: '',
    customerStateCode: '',
    customerPAN: '', // Add PAN field
    transportationMode: 'Road',
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    distance: '',
    transporterName: '',
    transporterGSTIN: '',
    supplyDate: new Date().toISOString().split('T')[0]
  });

  const [items, setItems] = useState([{
    description: '',
    hsnSac: '',
    gstRate: 12,
    quantity: '',
    unit: 'KG',
    rate: '',
    amount: 0
  }]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCompanySettings();
    // Auto-fill from wholesale order if passed via location state
    if (location.state?.wholesaleOrder) {
      const order = location.state.wholesaleOrder;
      
      // Map pack size to product description
      const packSizeMap = {
        '100kg_pack': 'Vulcanised Rubber Bands (100 KG Pack)',
        '200kg_pack': 'Vulcanised Rubber Bands (200 KG Pack)',
        '500kg_pack': 'Vulcanised Rubber Bands (500 KG Pack)',
        '1ton_bulk': 'Vulcanised Rubber Bands (1 Ton Bulk)'
      };
      
      const productDescription = packSizeMap[order.productType] || 'Vulcanised Rubber Bands';
      
      setFormData(prev => ({
        ...prev,
        vendorName: order.customerId?.name || '',
        customerName: order.customerId?.name || '',
        customerAddress: order.deliveryAddress || '',
        customerPAN: order.panNumber || '',
        customerState: order.customerId?.state || '',
        customerStateCode: order.customerId?.stateCode || '32', // Default to Kerala (32)
        driverName: order.driverName || '',
        driverPhone: order.driverPhone || '',
        vehicleNumber: order.vehicleNumber || '',
        transportationMode: 'Road'
      }));
      // Pre-fill first item with order details
      setItems([{
        description: productDescription,
        hsnSac: '40169920',
        gstRate: 12,
        quantity: order.quantity || '',
        unit: 'KG',
        rate: '',
        amount: 0
      }]);
    }
  }, [location.state]);

  const fetchCompanySettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const response = await axios.get(`${API_URL}/api/gst-invoices/company-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanySettings(response.data.settings);
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Auto-fill related fields based on product selection
    if (field === 'description') {
      const productDetails = {
        'Vulcanised Rubber Bands': { hsn: '40169920', gst: 12, unit: 'KG' },
        'Natural Rubber Sheets': { hsn: '40012910', gst: 5, unit: 'KG' },
        'Rubber Latex': { hsn: '40011010', gst: 5, unit: 'KG' },
        'Crepe Rubber': { hsn: '40012100', gst: 5, unit: 'KG' },
        'RSS Rubber': { hsn: '40012200', gst: 5, unit: 'KG' },
        'Rubber Compound': { hsn: '40051000', gst: 18, unit: 'KG' },
        'Standard Amber Rubber Bands': { hsn: '40169920', gst: 12, unit: 'KG' },
        'Colored Rubber Bands': { hsn: '40169920', gst: 12, unit: 'KG' },
        'Stretch Rubber Bands': { hsn: '40169920', gst: 12, unit: 'KG' },
        'Latex-Free Rubber Bands': { hsn: '39269099', gst: 18, unit: 'KG' },
        'Industrial Rubber Bands': { hsn: '40169920', gst: 18, unit: 'KG' },
        'Silicone Rubber Bands': { hsn: '39269099', gst: 18, unit: 'KG' }
      };

      if (productDetails[value]) {
        newItems[index].hsnSac = productDetails[value].hsn;
        newItems[index].gstRate = productDetails[value].gst;
        newItems[index].unit = productDetails[value].unit;
      } else if (value === 'Custom' || value === '') {
        newItems[index].hsnSac = '';
        newItems[index].gstRate = '';
      }
    }

    // Calculate amount
    if (field === 'quantity' || field === 'rate') {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const rate = parseFloat(newItems[index].rate) || 0;
      newItems[index].amount = qty * rate;
    }

    // Recalculate amount if rate/quantity was already set and product changed (though unlikely to have rate before product)
    const qty = parseFloat(newItems[index].quantity) || 0;
    const rate = parseFloat(newItems[index].rate) || 0;
    newItems[index].amount = qty * rate;

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, {
      description: '',
      hsnSac: '',
      gstRate: 12,
      quantity: '',
      unit: 'KG',
      rate: '',
      amount: 0
    }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const taxableValue = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalQty = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);

    let totalTax = 0;
    items.forEach(item => {
      totalTax += (item.amount * (item.gstRate || 0)) / 100;
    });

    const grandTotal = taxableValue + totalTax;

    return { taxableValue, totalQty, totalTax, grandTotal };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const response = await axios.post(`${API_URL}/api/gst-invoices`, {
        ...formData,
        items: items.filter(item => item.description && item.quantity && item.rate).map(item => ({
          ...item,
          description: item.description === 'Custom' ? item.customDescription : item.description
        }))
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(`Invoice ${response.data.invoice.invoiceNumber} created successfully!`);

      // Redirect to bill generation page after 2 seconds
      setTimeout(() => {
        navigate('/accountant/bill-generation', {
          state: { 
            gstInvoiceId: response.data.invoice._id,
            gstInvoiceNumber: response.data.invoice.invoiceNumber
          }
        });
      }, 2000);

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  if (!companySettings) {
    return <div className="loading">Loading company settings...</div>;
  }

  return (
    <div className="gst-invoice-container">
      <div className="invoice-header-section">
        <button
          className="back-btn"
          onClick={() => window.history.back()}
        >
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <h1>Generate New GST Invoice</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="invoice-form">
        {/* Company Header Preview */}
        <div className="company-header-preview">
          <h2>{companySettings.companyName}</h2>
          <p>{companySettings.address}, {companySettings.city}, {companySettings.state} - {companySettings.pincode}</p>
          <p>Phone: {companySettings.phone} | Email: {companySettings.email}</p>
          <p>PAN: {companySettings.panNumber} | GSTIN: {companySettings.gstNumber}</p>
        </div>

        {/* Invoice Information */}
        <div className="form-section">
          <h3>Invoice Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Reverse Charge</label>
              <select
                name="reverseCharge"
                value={formData.reverseCharge}
                onChange={handleInputChange}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="Nil">Nil</option>
              </select>
            </div>
            <div className="form-group">
              <label>Supply Date *</label>
              <input
                type="date"
                name="supplyDate"
                value={formData.supplyDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Transportation Mode</label>
              <select
                name="transportationMode"
                value={formData.transportationMode}
                onChange={handleInputChange}
              >
                <option value="Road">Road</option>
                <option value="Rail">Rail</option>
                <option value="Air">Air</option>
                <option value="Ship">Ship</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vendor/Supplier Details */}
        <div className="form-section">
          <h3>Vendor/Supplier Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Vendor/Supplier Name *</label>
              <input
                type="text"
                name="vendorName"
                value={formData.vendorName}
                onChange={handleInputChange}
                placeholder="Enter supplier name"
                required
              />
            </div>
            <div className="form-group">
              <label>Place of Supply *</label>
              <input
                type="text"
                name="placeOfSupply"
                value={formData.placeOfSupply}
                onChange={handleInputChange}
                placeholder="e.g., Kooroppada"
                required
              />
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="form-section">
          <h3>Customer/Receiver Details</h3>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Customer Name *</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="Enter customer name"
                required
              />
            </div>
            <div className="form-group full-width">
              <label>Customer Address *</label>
              <textarea
                name="customerAddress"
                value={formData.customerAddress}
                onChange={handleInputChange}
                placeholder="Enter complete address"
                rows="2"
                required
              />
            </div>
            <div className="form-group">
              <label>Customer GSTIN</label>
              <input
                type="text"
                name="customerGSTIN"
                value={formData.customerGSTIN}
                onChange={handleInputChange}
                placeholder="e.g., 32AAHFH5388M1ZX"
              />
            </div>
            <div className="form-group">
              <label>Customer PAN Number</label>
              {formData.customerPAN ? (
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#1e40af',
                  background: '#eff6ff',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #dbeafe',
                  marginTop: '4px'
                }}>
                  {formData.customerPAN}
                </div>
              ) : (
                <input
                  type="text"
                  name="customerPAN"
                  value={formData.customerPAN}
                  onChange={handleInputChange}
                  placeholder="e.g., ABCDE1234F"
                />
              )}
            </div>
            <div className="form-group">
              <label>State *</label>
              {formData.customerState ? (
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#1e40af',
                  background: '#eff6ff',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #dbeafe',
                  marginTop: '4px'
                }}>
                  {formData.customerState}
                </div>
              ) : (
                <input
                  type="text"
                  name="customerState"
                  value={formData.customerState}
                  onChange={handleInputChange}
                  placeholder="e.g., Kerala"
                  required
                />
              )}
            </div>
            <div className="form-group">
              <label>State Code *</label>
              {formData.customerStateCode ? (
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#1e40af',
                  background: '#eff6ff',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #dbeafe',
                  marginTop: '4px'
                }}>
                  {formData.customerStateCode}
                </div>
              ) : (
                <input
                  type="text"
                  name="customerStateCode"
                  value={formData.customerStateCode}
                  onChange={handleInputChange}
                  placeholder="e.g., 32"
                  required
                />
              )}
            </div>
          </div>
        </div>

        {/* Transport Details */}
        <div className="form-section">
          <h3>Transport Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Vehicle Number</label>
              <input
                type="text"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleInputChange}
                placeholder="e.g., KL-01-AB-1234"
              />
            </div>
            <div className="form-group">
              <label>Driver Name</label>
              <input
                type="text"
                name="driverName"
                value={formData.driverName}
                onChange={handleInputChange}
                placeholder="Enter driver name"
              />
            </div>
            <div className="form-group">
              <label>Driver Phone</label>
              <input
                type="tel"
                name="driverPhone"
                value={formData.driverPhone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            </div>
            <div className="form-group">
              <label>Distance (KM)</label>
              <input
                type="number"
                name="distance"
                value={formData.distance}
                onChange={handleInputChange}
                placeholder="Enter distance"
              />
            </div>
            <div className="form-group">
              <label>Transporter Name</label>
              <input
                type="text"
                name="transporterName"
                value={formData.transporterName}
                onChange={handleInputChange}
                placeholder="Enter transporter name"
              />
            </div>
            <div className="form-group">
              <label>Transporter GSTIN</label>
              <input
                type="text"
                name="transporterGSTIN"
                value={formData.transporterGSTIN}
                onChange={handleInputChange}
                placeholder="Enter GSTIN"
              />
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="form-section">
          <div className="section-header">
            <h3>Items</h3>
            <button type="button" className="add-item-btn" onClick={addItem}>
              <i className="fas fa-plus"></i> Add Item
            </button>
          </div>

          <div className="items-table-container">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Sl No</th>
                  <th>Description of Goods *</th>
                  <th>HSN/SAC *</th>
                  <th>GST Rate (%) *</th>
                  <th>Qty *</th>
                  <th>Unit</th>
                  <th>Rate (₹) *</th>
                  <th>Amount (₹)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <select
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        required
                      >
                        <option value="">Select Product</option>
                        <option value="Vulcanised Rubber Bands">Vulcanised Rubber Bands</option>
                        <option value="Natural Rubber Sheets">Natural Rubber Sheets</option>
                        <option value="Rubber Latex">Rubber Latex</option>
                        <option value="Crepe Rubber">Crepe Rubber</option>
                        <option value="RSS Rubber">RSS Rubber</option>
                        <option value="Rubber Compound">Rubber Compound</option>
                        <option value="Standard Amber Rubber Bands">Standard Amber Rubber Bands</option>
                        <option value="Colored Rubber Bands">Colored Rubber Bands</option>
                        <option value="Stretch Rubber Bands">Stretch Rubber Bands</option>
                        <option value="Latex-Free Rubber Bands">Latex-Free Rubber Bands</option>
                        <option value="Industrial Rubber Bands">Industrial Rubber Bands</option>
                        <option value="Silicone Rubber Bands">Silicone Rubber Bands</option>
                        <option value="Custom">Custom (Type below)</option>
                      </select>
                      {item.description === 'Custom' && (
                        <input
                          type="text"
                          value={item.customDescription || ''}
                          onChange={(e) => handleItemChange(index, 'customDescription', e.target.value)}
                          placeholder="Enter custom product name"
                          style={{ marginTop: '5px' }}
                        />
                      )}
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.hsnSac}
                        onChange={(e) => handleItemChange(index, 'hsnSac', e.target.value)}
                        placeholder="e.g., 40169920"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.gstRate}
                        onChange={(e) => handleItemChange(index, 'gstRate', e.target.value)}
                        min="0"
                        max="28"
                        step="0.01"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        min="0"
                        step="0.01"
                        required
                      />
                    </td>
                    <td>
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      >
                        <option value="KG">KG</option>
                        <option value="PCS">PCS</option>
                        <option value="LTR">LTR</option>
                        <option value="MTR">MTR</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                        min="0"
                        step="0.01"
                        required
                      />
                    </td>
                    <td className="amount-cell">₹{item.amount.toFixed(2)}</td>
                    <td>
                      <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="totals-row">
                  <td colSpan="4"><strong>Total</strong></td>
                  <td><strong>{totals.totalQty.toFixed(2)}</strong></td>
                  <td></td>
                  <td></td>
                  <td><strong>₹{totals.taxableValue.toFixed(2)}</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Tax Summary */}
        <div className="tax-summary">
          <div className="summary-row">
            <span>Taxable Amount:</span>
            <span>₹{totals.taxableValue.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Total Tax ({formData.customerState === companySettings.state ? 'CGST + SGST' : 'IGST'}):</span>
            <span>₹{totals.totalTax.toFixed(2)}</span>
          </div>
          <div className="summary-row grand-total">
            <span>Grand Total:</span>
            <span>₹{totals.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Generating Invoice...' : 'Generate Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GSTInvoiceGeneration;
