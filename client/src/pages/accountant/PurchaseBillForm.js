import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './PurchaseBillForm.css';

const PurchaseBillForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        supplier: {
            name: '',
            mobile: '',
            gstin: '',
            billingAddress: '',
            state: 'Kerala'
        },
        billDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        purchaseOrderNumber: '',
        placeOfSupply: 'Kerala',
        paymentTerms: 'net_30',
        items: [{ itemName: '', hsnCode: '', quantity: 1, unit: 'KG', rate: 0, gstRate: 18, amount: 0 }],
        transportationCharges: 0,
        otherCharges: 0,
        paymentStatus: 'unpaid',
        paymentMethod: 'bank',
        amountPaid: 0,
        internalNotes: '',
        termsAndConditions: ''
    });

    useEffect(() => {
        if (isEditMode) {
            fetchBillData();
        }
    }, [id]);

    const fetchBillData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/purchase-bills/${id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (data.success) {
                const bill = data.data;
                setFormData({
                    supplier: bill.supplier,
                    billDate: bill.billDate.split('T')[0],
                    dueDate: bill.dueDate.split('T')[0],
                    purchaseOrderNumber: bill.purchaseOrderNumber || '',
                    placeOfSupply: bill.placeOfSupply,
                    paymentTerms: bill.paymentTerms,
                    items: bill.items,
                    transportationCharges: bill.transportationCharges,
                    otherCharges: bill.otherCharges,
                    paymentStatus: bill.paymentStatus,
                    paymentMethod: bill.paymentMethod,
                    amountPaid: bill.amountPaid,
                    internalNotes: bill.internalNotes || '',
                    termsAndConditions: bill.termsAndConditions || ''
                });
            }
        } catch (error) {
            console.error('Error fetching bill:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = () => {
        const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
        const isIntraState = formData.supplier.state && formData.placeOfSupply && 
                            formData.supplier.state.toLowerCase() === formData.placeOfSupply.toLowerCase();
        
        let cgst = 0, sgst = 0, igst = 0;
        formData.items.forEach(item => {
            const gstAmount = (item.quantity * item.rate * item.gstRate) / 100;
            if (isIntraState) {
                cgst += gstAmount / 2;
                sgst += gstAmount / 2;
            } else {
                igst += gstAmount;
            }
        });

        const totalBeforeRoundOff = subtotal + cgst + sgst + igst + 
                                    parseFloat(formData.transportationCharges || 0) + 
                                    parseFloat(formData.otherCharges || 0);
        const roundOff = Math.round(totalBeforeRoundOff) - totalBeforeRoundOff;
        const totalAmount = Math.round(totalBeforeRoundOff);
        const balanceAmount = totalAmount - parseFloat(formData.amountPaid || 0);

        return { subtotal, cgst, sgst, igst, roundOff, totalAmount, balanceAmount };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.supplier.name) {
            alert('Supplier name is required');
            return;
        }
        if (formData.items.length === 0 || !formData.items[0].itemName) {
            alert('At least one item is required');
            return;
        }

        try {
            setLoading(true);
            const url = isEditMode ? `/api/purchase-bills/${id}` : '/api/purchase-bills';
            const method = isEditMode ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                alert(`Purchase bill ${isEditMode ? 'updated' : 'created'} successfully!`);
                navigate('/accountant/purchase-bills');
            } else {
                alert(data.message || `Error ${isEditMode ? 'updating' : 'creating'} purchase bill`);
            }
        } catch (error) {
            console.error('Error saving bill:', error);
            alert('Error saving purchase bill');
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { itemName: '', hsnCode: '', quantity: 1, unit: 'KG', rate: 0, gstRate: 18, amount: 0 }]
        }));
    };

    const removeItem = (index) => {
        if (formData.items.length > 1) {
            setFormData(prev => ({
                ...prev,
                items: prev.items.filter((_, i) => i !== index)
            }));
        }
    };

    const handleItemChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) => {
                if (i === index) {
                    const updated = { ...item, [field]: value };
                    updated.amount = updated.quantity * updated.rate;
                    return updated;
                }
                return item;
            })
        }));
    };

    const validateGSTIN = (gstin) => {
        // GSTIN format: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return gstinRegex.test(gstin);
    };

    const handleGSTINChange = (value) => {
        // Auto-format: convert to uppercase and remove spaces
        const formatted = value.toUpperCase().replace(/\s/g, '');
        setFormData(prev => ({
            ...prev,
            supplier: { ...prev.supplier, gstin: formatted }
        }));
    };

    const handleMobileChange = (value) => {
        // Only allow digits
        const formatted = value.replace(/\D/g, '');
        setFormData(prev => ({
            ...prev,
            supplier: { ...prev.supplier, mobile: formatted }
        }));
    };

    const totals = calculateTotals();

    if (loading && isEditMode) {
        return (
            <div className="purchase-bill-form-container">
                <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Loading bill data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="purchase-bill-form-container">
            <div className="pbf-header">
                <div className="pbf-title-section">
                    <h1><i className="fas fa-file-invoice"></i> {isEditMode ? 'Edit' : 'Create'} Purchase Bill</h1>
                    <p>Fill in the details below to {isEditMode ? 'update' : 'create'} a purchase bill</p>
                </div>
                <button className="btn-back" onClick={() => navigate('/accountant/purchase-bills')}>
                    <i className="fas fa-arrow-left"></i> Back to List
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="pbf-content">
                    {/* Section 1: Supplier & Bill Information */}
                    <div className="pbf-section">
                        <h2 className="section-title">
                            <i className="fas fa-building"></i> Supplier & Bill Information
                        </h2>
                        <div className="section-grid">
                            <div className="section-column">
                                <div className="form-group">
                                    <label>Supplier Name *</label>
                                    <input
                                        type="text"
                                        value={formData.supplier.name}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            supplier: { ...prev.supplier, name: e.target.value }
                                        }))}
                                        required
                                        placeholder="Enter supplier name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Mobile Number</label>
                                    <input
                                        type="text"
                                        value={formData.supplier.mobile}
                                        onChange={(e) => handleMobileChange(e.target.value)}
                                        placeholder="10-digit mobile number"
                                        maxLength="10"
                                    />
                                    {formData.supplier.mobile && formData.supplier.mobile.length === 10 && (
                                        <small className="input-hint success">✓ Valid mobile number</small>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>GSTIN</label>
                                    <input
                                        type="text"
                                        value={formData.supplier.gstin}
                                        onChange={(e) => handleGSTINChange(e.target.value)}
                                        placeholder="22AAAAA0000A1Z5 (15 characters)"
                                        maxLength="15"
                                        className={formData.supplier.gstin && formData.supplier.gstin.length === 15 ? 
                                            (validateGSTIN(formData.supplier.gstin) ? 'input-valid' : 'input-invalid') : ''}
                                    />
                                    {formData.supplier.gstin && formData.supplier.gstin.length === 15 && (
                                        validateGSTIN(formData.supplier.gstin) ? (
                                            <small className="input-hint success">✓ Valid GSTIN format</small>
                                        ) : (
                                            <small className="input-hint error">✗ Invalid GSTIN format</small>
                                        )
                                    )}
                                    {formData.supplier.gstin && formData.supplier.gstin.length < 15 && (
                                        <small className="input-hint">{formData.supplier.gstin.length}/15 characters</small>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Billing Address</label>
                                    <textarea
                                        value={formData.supplier.billingAddress}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            supplier: { ...prev.supplier, billingAddress: e.target.value }
                                        }))}
                                        placeholder="Enter billing address"
                                        rows="2"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>State</label>
                                    <input
                                        type="text"
                                        value={formData.supplier.state}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            supplier: { ...prev.supplier, state: e.target.value }
                                        }))}
                                        placeholder="Enter state"
                                    />
                                </div>
                            </div>

                            <div className="section-column">
                                <div className="form-group">
                                    <label>Bill Number</label>
                                    <input
                                        type="text"
                                        value={isEditMode ? 'Auto-generated' : 'Will be auto-generated'}
                                        disabled
                                        className="disabled-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Bill Date *</label>
                                    <input
                                        type="date"
                                        value={formData.billDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, billDate: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Due Date *</label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Place of Supply *</label>
                                    <input
                                        type="text"
                                        value={formData.placeOfSupply}
                                        onChange={(e) => setFormData(prev => ({ ...prev, placeOfSupply: e.target.value }))}
                                        required
                                        placeholder="Enter place of supply"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Payment Terms</label>
                                    <select
                                        value={formData.paymentTerms}
                                        onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                                    >
                                        <option value="immediate">Immediate</option>
                                        <option value="net_15">Net 15 Days</option>
                                        <option value="net_30">Net 30 Days</option>
                                        <option value="net_45">Net 45 Days</option>
                                        <option value="net_60">Net 60 Days</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>PO Number</label>
                                    <input
                                        type="text"
                                        value={formData.purchaseOrderNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, purchaseOrderNumber: e.target.value }))}
                                        placeholder="Purchase order number"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Items Table */}
                    <div className="pbf-section">
                        <div className="section-header">
                            <h2 className="section-title">
                                <i className="fas fa-box"></i> Items
                            </h2>
                            <button type="button" className="btn-add-item" onClick={addItem}>
                                <i className="fas fa-plus"></i> Add Item
                            </button>
                        </div>

                        <div className="items-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Item Name *</th>
                                        <th>HSN Code</th>
                                        <th>Quantity *</th>
                                        <th>Unit</th>
                                        <th>Rate (₹) *</th>
                                        <th>GST %</th>
                                        <th>Amount (₹)</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((item, index) => (
                                        <tr key={index}>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={item.itemName}
                                                    onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                                                    placeholder="Item name"
                                                    required
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={item.hsnCode}
                                                    onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                                                    placeholder="HSN"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                    min="0.001"
                                                    step="0.001"
                                                    required
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    value={item.unit}
                                                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                                >
                                                    <option value="KG">KG</option>
                                                    <option value="LITRE">LITRE</option>
                                                    <option value="PIECE">PIECE</option>
                                                    <option value="BOX">BOX</option>
                                                    <option value="METER">METER</option>
                                                    <option value="TON">TON</option>
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    value={item.gstRate}
                                                    onChange={(e) => handleItemChange(index, 'gstRate', parseInt(e.target.value))}
                                                >
                                                    <option value="0">0%</option>
                                                    <option value="5">5%</option>
                                                    <option value="12">12%</option>
                                                    <option value="18">18%</option>
                                                    <option value="28">28%</option>
                                                </select>
                                            </td>
                                            <td className="amount-cell">
                                                ₹{item.amount.toFixed(2)}
                                            </td>
                                            <td>
                                                {formData.items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="btn-remove-item"
                                                        onClick={() => removeItem(index)}
                                                        title="Remove item"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 3: Bill Summary & Payment */}
                    <div className="pbf-section">
                        <div className="summary-grid">
                            <div className="summary-left">
                                <h2 className="section-title">
                                    <i className="fas fa-sticky-note"></i> Additional Information
                                </h2>
                                
                                <div className="form-group">
                                    <label>Transportation Charges (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.transportationCharges}
                                        onChange={(e) => setFormData(prev => ({ ...prev, transportationCharges: parseFloat(e.target.value) || 0 }))}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Other Charges (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.otherCharges}
                                        onChange={(e) => setFormData(prev => ({ ...prev, otherCharges: parseFloat(e.target.value) || 0 }))}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Internal Notes</label>
                                    <textarea
                                        value={formData.internalNotes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
                                        placeholder="Internal notes (not visible on bill)"
                                        rows="3"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Terms & Conditions</label>
                                    <textarea
                                        value={formData.termsAndConditions}
                                        onChange={(e) => setFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                                        placeholder="Terms and conditions"
                                        rows="3"
                                    />
                                </div>
                            </div>

                            <div className="summary-right">
                                <div className="summary-panel">
                                    <h3>Bill Summary</h3>
                                    
                                    <div className="summary-row">
                                        <span>Subtotal:</span>
                                        <span>₹{totals.subtotal.toFixed(2)}</span>
                                    </div>

                                    {totals.cgst > 0 && (
                                        <>
                                            <div className="summary-row">
                                                <span>CGST:</span>
                                                <span>₹{totals.cgst.toFixed(2)}</span>
                                            </div>
                                            <div className="summary-row">
                                                <span>SGST:</span>
                                                <span>₹{totals.sgst.toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}

                                    {totals.igst > 0 && (
                                        <div className="summary-row">
                                            <span>IGST:</span>
                                            <span>₹{totals.igst.toFixed(2)}</span>
                                        </div>
                                    )}

                                    {formData.transportationCharges > 0 && (
                                        <div className="summary-row">
                                            <span>Transportation:</span>
                                            <span>₹{parseFloat(formData.transportationCharges).toFixed(2)}</span>
                                        </div>
                                    )}

                                    {formData.otherCharges > 0 && (
                                        <div className="summary-row">
                                            <span>Other Charges:</span>
                                            <span>₹{parseFloat(formData.otherCharges).toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="summary-row">
                                        <span>Round Off:</span>
                                        <span>₹{totals.roundOff.toFixed(2)}</span>
                                    </div>

                                    <div className="summary-row summary-total">
                                        <span>Total Amount:</span>
                                        <span>₹{totals.totalAmount.toLocaleString()}</span>
                                    </div>

                                    <div className="payment-section">
                                        <h4>Payment Details</h4>
                                        
                                        <div className="form-group">
                                            <label>Payment Status</label>
                                            <select
                                                value={formData.paymentStatus}
                                                onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                                            >
                                                <option value="unpaid">Unpaid</option>
                                                <option value="partial">Partial</option>
                                                <option value="paid">Paid</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label>Payment Method</label>
                                            <select
                                                value={formData.paymentMethod}
                                                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="bank">Bank Transfer</option>
                                                <option value="upi">UPI</option>
                                                <option value="cheque">Cheque</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label>Amount Paid (₹)</label>
                                            <input
                                                type="number"
                                                value={formData.amountPaid}
                                                onChange={(e) => setFormData(prev => ({ ...prev, amountPaid: parseFloat(e.target.value) || 0 }))}
                                                min="0"
                                                max={totals.totalAmount}
                                                step="0.01"
                                            />
                                        </div>

                                        <div className="summary-row balance-row">
                                            <span>Balance:</span>
                                            <span className="balance-amount">₹{totals.balanceAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                    <button type="button" className="btn-cancel-form" onClick={() => navigate('/accountant/purchase-bills')}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-submit-form" disabled={loading}>
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Saving...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save"></i> {isEditMode ? 'Update' : 'Create'} Purchase Bill
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PurchaseBillForm;
