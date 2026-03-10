import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiFileText, FiSave, FiPrinter, FiUser, FiTruck, FiCalendar, FiMapPin, FiPlus } from 'react-icons/fi';
import './AccountantBillGeneration.css';

const AccountantBillGeneration = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        vendor: '',
        invoiceDate: new Date().toISOString().slice(0, 10),
        vehicleNumber: '',
        vehicleType: 'Company', // 'Company' | 'Outside'
        driverName: '',
        driverPhone: '',
        distance: '',
        placeOfSupply: 'Kooroppada',
        bankAccount: '',
        customerPAN: '', // Add PAN number field
        items: [
            { description: 'Vulcanised Rubber Other Than Hard Rubber (Rubber Bands)', hsn: '40169920', quantity: 0, rate: 0, amount: 0 }
        ]
    });

    // History State
    const [invoices, setInvoices] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchInvoices();
        }
    }, [activeTab]);

    // Handle Prefill from Wholesale Orders
    useEffect(() => {
        if (location.state?.prefillOrder) {
            const order = location.state.prefillOrder;
            setFormData(prev => ({
                ...prev,
                vendor: order.customerId?.name || 'Wholesale Customer',
                vehicleNumber: order.assignedDeliveryStaffId?.vehicleNumber || order.vehicleNumber || '',
                driverName: order.driverName || '',
                driverPhone: order.driverPhone || '',
                placeOfSupply: order.deliveryAddress || 'Kooroppada',
                customerPAN: order.panNumber || '', // Include PAN number from order
                // Map payment method to bank account for hint
                bankAccount: order.paymentMethod === 'UPI' ? 'personal' : 'business',
                items: [
                    {
                        description: `Rubber Bands (${order.packSizeName})`,
                        hsn: '40169920',
                        quantity: order.quantity,
                        rate: 0, // Accountant must provide rate
                        amount: 0,
                        isWholesaleOrder: true,
                        orderId: order._id
                    }
                ]
            }));
            setSuccess('Order details imported successfully!');
        }
    }, [location.state]);

    const fetchInvoices = async () => {
        setHistoryLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/invoices?invoiceType=purchase_bill`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                const data = await response.json();
                setInvoices(data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch invoices", err);
        } finally {
            setHistoryLoading(false);
        }
    };


    // Calculate totals
    const totalAmount = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxRate = 0.12;
    const taxAmount = totalAmount * taxRate;
    const finalTotal = totalAmount + taxAmount;

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        if (field === 'quantity' || field === 'rate') {
            const qty = parseFloat(newItems[index].quantity) || 0;
            const rate = parseFloat(newItems[index].rate) || 0;
            newItems[index].amount = qty * rate;
        }

        setFormData({ ...formData, items: newItems });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                ...formData,
                subtotal: totalAmount,
                taxAmount: taxAmount,
                totalAmount: finalTotal,
                invoiceType: 'purchase_bill',
                dueDate: formData.invoiceDate,
                invoiceNumber: `INV-${Date.now()}`
            };

            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/invoices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            const createdInvoiceId = result.data?._id;

            // If this was a wholesale order, use the dedicated billing endpoint
            const billedItem = formData.items.find(item => item.isWholesaleOrder && item.orderId);
            if (billedItem) {
                try {
                    await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/product-orders/${billedItem.orderId}/bill`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            unitPrice: formData.items[0].rate,
                            driverName: formData.driverName,
                            driverPhone: formData.driverPhone,
                            vehicleNumber: formData.vehicleNumber,
                            items: formData.items
                        })
                    });
                } catch (err) {
                    console.error("Failed to update wholesale order billing", err);
                }
            }

            setSuccess('Bill generated successfully!');

            // Redirect to the newly created invoice view after a short delay
            if (createdInvoiceId) {
                setTimeout(() => {
                    navigate(`/accountant/invoices/${createdInvoiceId}`);
                }, 1500);
            }

            setFormData({
                vendor: '',
                invoiceDate: new Date().toISOString().slice(0, 10),
                vehicleNumber: '',
                vehicleType: 'Company',
                distance: '',
                placeOfSupply: 'Kooroppada',
                bankAccount: '',
                customerPAN: '', // Reset PAN field
                items: [
                    { description: 'Vulcanised Rubber Other Than Hard Rubber (Rubber Bands)', hsn: '40169920', quantity: 0, rate: 0, amount: 0 }
                ]
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentForm, setPaymentForm] = useState({
        method: 'Bank Transfer',
        reference: ''
    });

    // Add Bank Account Modal State
    const [showBankAccountModal, setShowBankAccountModal] = useState(false);
    const [bankAccountForm, setBankAccountForm] = useState({
        accountName: '',
        openingBalance: '',
        asOfDate: new Date().toISOString().slice(0, 10),
        addBankDetails: false,
        bankAccountNumber: '',
        reEnterBankAccountNumber: '',
        ifscCode: '',
        bankBranchName: '',
        accountHolderName: '',
        upiId: ''
    });


    const initiatePayment = (invoice) => {
        setSelectedInvoice(invoice);
        setPaymentForm({ method: 'Bank Transfer', reference: '' });
        setShowPaymentModal(true);
    };

    const submitPayment = async (e) => {
        e.preventDefault();
        if (!selectedInvoice) return;

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/invoices/${selectedInvoice._id}/payment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: selectedInvoice.totalAmount,
                    paymentMethod: paymentForm.method,
                    paymentDate: new Date(),
                    paymentReference: paymentForm.reference || `AUTO-${Date.now()}`
                })
            });

            if (response.ok) {
                fetchInvoices();
                setSuccess("Bill marked as paid successfully.");
                setShowPaymentModal(false);
                setTimeout(() => setSuccess(''), 3000);
            } else {
                const errData = await response.json();
                setError(errData.message || "Failed to record payment");
            }
        } catch (err) {
            setError("Failed to update status");
        }
    };


    // Handle bank account form changes
    const handleBankAccountChange = (field, value) => {
        setBankAccountForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle bank account submission
    const handleBankAccountSubmit = async () => {
        try {
            // Validate required fields
            if (!bankAccountForm.accountName.trim()) {
                setError('Please enter account name');
                return;
            }

            if (bankAccountForm.addBankDetails) {
                if (!bankAccountForm.bankAccountNumber || !bankAccountForm.reEnterBankAccountNumber) {
                    setError('Please enter bank account number');
                    return;
                }

                if (bankAccountForm.bankAccountNumber !== bankAccountForm.reEnterBankAccountNumber) {
                    setError('Bank account numbers do not match');
                    return;
                }

                if (!bankAccountForm.ifscCode || !bankAccountForm.bankBranchName || !bankAccountForm.accountHolderName) {
                    setError('Please fill all required bank details');
                    return;
                }
            }

            // Here you would typically save to your backend
            console.log('Bank Account Data:', bankAccountForm);

            // Reset form and close modal
            setBankAccountForm({
                accountName: '',
                openingBalance: '',
                asOfDate: new Date().toISOString().slice(0, 10),
                addBankDetails: false,
                bankAccountNumber: '',
                reEnterBankAccountNumber: '',
                ifscCode: '',
                bankBranchName: '',
                accountHolderName: '',
                upiId: ''
            });

            setShowBankAccountModal(false);
            setSuccess('Bank account added successfully!');
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            setError('Failed to add bank account');
        }
    };


    return (
        <div className="accountant-bill-generation">
            {/* Header - Modern Design */}
            <div className="bill-gen-header-modern">
                <div className="header-left">
                    <h1 className="page-title">
                        <FiFileText /> Purchase Bills
                    </h1>
                </div>
                <div className="header-right">
                    <button className="reports-btn">
                        <span>📊</span>
                        Reports
                    </button>
                    <button className="settings-btn">
                        <span>⚙️</span>
                    </button>
                    <button className="more-btn">
                        <span>⋯</span>
                    </button>
                    {activeTab === 'new' && (
                        <button className="print-btn" onClick={() => window.print()}>
                            <FiPrinter /> Print
                        </button>
                    )}
                    <button
                        className="add-bank-account-btn"
                        onClick={() => setShowBankAccountModal(true)}
                    >
                        <FiPlus /> Add Bank Account
                    </button>
                </div>
            </div>

            {/* Filters and Create Button */}
            <div className="bill-filters">
                <div className="filter-left">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search bills..."
                        />
                    </div>
                    <select className="date-filter">
                        <option value="">All Dates</option>
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">This Month</option>
                    </select>
                    <select className="status-filter">
                        <option value="">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                    </select>
                </div>
                <button
                    className="create-bill-btn"
                    onClick={() => setActiveTab('new')}
                >
                    <FiPlus /> Create Bill
                </button>
            </div>

            <div className="tabs-container">
                <button
                    className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
                    onClick={() => setActiveTab('new')}
                >
                    Generate New Bill
                </button>
                <button
                    className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    Bill History & Payments
                </button>
            </div>

            {success && <div className="alert-success">{success}</div>}
            {error && <div className="alert-error">{error}</div>}

            {/* NEW BILL FORM */}
            {activeTab === 'new' && (
                <form onSubmit={handleSubmit} className="bill-gen-form-card">
                    {/* Main Form Section */}
                    <div className="bill-form-layout">
                        {/* Left Column */}
                        <div className="form-column-left">
                            <div className="form-group">
                                <label className="form-label"><FiUser /> Vendor/Supplier Name</label>
                                <input
                                    name="vendor"
                                    className="form-input"
                                    value={formData.vendor}
                                    onChange={handleChange}
                                    placeholder="Enter supplier name"
                                    required
                                />
                            </div>

                            {formData.customerPAN && (
                                <div className="form-group">
                                    <label className="form-label">Customer PAN Number</label>
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
                                    <small style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                                        PAN number from wholesale order for tax compliance
                                    </small>
                                </div>
                            )}


                            <div className="form-group">
                                <label className="form-label"><FiMapPin /> Place of Supply</label>
                                <input
                                    name="placeOfSupply"
                                    className="form-input"
                                    value={formData.placeOfSupply}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="form-column-right">
                            <div className="form-group">
                                <label className="form-label"><FiTruck /> Vehicle Number</label>
                                <div className="vehicle-input-row">
                                    <input
                                        name="vehicleNumber"
                                        className="form-input"
                                        value={formData.vehicleNumber}
                                        onChange={handleChange}
                                        placeholder="e.g. KL-01-AB-1234"
                                    />
                                    <select
                                        name="vehicleType"
                                        className="vehicle-type-select"
                                        value={formData.vehicleType}
                                        onChange={handleChange}
                                    >
                                        <option value="Company">🏢 Company</option>
                                        <option value="Outside">🚛 Outside</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">👤 Driver Details</label>
                                <div className="vehicle-input-row">
                                    <input
                                        name="driverName"
                                        className="form-input"
                                        value={formData.driverName}
                                        onChange={handleChange}
                                        placeholder="Driver Name"
                                    />
                                    <input
                                        name="driverPhone"
                                        className="form-input"
                                        value={formData.driverPhone}
                                        onChange={handleChange}
                                        placeholder="Phone Number"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">📏 Distance (KM)</label>
                                <input
                                    name="distance"
                                    type="number"
                                    className="form-input"
                                    value={formData.distance}
                                    onChange={handleChange}
                                    placeholder="Enter distance in KM"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label"><FiCalendar /> Supply Date</label>
                                <input
                                    type="date"
                                    name="invoiceDate"
                                    className="form-input"
                                    value={formData.invoiceDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="items-table-container">
                        <div className="items-table-header">
                            <h3>Items</h3>
                        </div>
                        <table className="items-table">
                            <thead>
                                <tr>
                                    <th>Description of Goods</th>
                                    <th>HSN/SAC</th>
                                    <th>Qty (Kg)</th>
                                    <th>Rate (₹)</th>
                                    <th>Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.map((item, index) => (
                                    <tr key={index}>
                                        <td>
                                            <input
                                                className="form-input"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                className="form-input"
                                                style={{ width: '80px' }}
                                                value={item.hsn}
                                                onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                placeholder="0"
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={item.rate}
                                                onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td className="amount-display">
                                            ₹{item.amount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="summary-section">
                        <div className="bill-summary">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>₹{totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>CGST (6%)</span>
                                <span>₹{(taxAmount / 2).toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>SGST (6%)</span>
                                <span>₹{(taxAmount / 2).toFixed(2)}</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total Amount</span>
                                <span>₹{finalTotal.toFixed(2)}</span>
                            </div>

                            {/* Bank Account Details */}
                            {formData.bankAccount && (
                                <div className="bank-details-summary">
                                    <h4>Payment Details</h4>
                                    <div className="bank-info">
                                        <div className="bank-info-row">
                                            <span>Account:</span>
                                            <span>
                                                {formData.bankAccount === 'personal' && 'Personal Account'}
                                                {formData.bankAccount === 'business' && 'Business Account'}
                                                {formData.bankAccount === 'savings' && 'Savings Account'}
                                            </span>
                                        </div>
                                        <div className="bank-info-row">
                                            <span>Account No:</span>
                                            <span>
                                                {formData.bankAccount === 'personal' && '****7950'}
                                                {formData.bankAccount === 'business' && '****2341'}
                                                {formData.bankAccount === 'savings' && '****8765'}
                                            </span>
                                        </div>
                                        <div className="bank-info-row">
                                            <span>IFSC:</span>
                                            <span>
                                                {formData.bankAccount === 'personal' && 'HDFC000075'}
                                                {formData.bankAccount === 'business' && 'ICIC000123'}
                                                {formData.bankAccount === 'savings' && 'SBI000456'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Signature Section */}
                            <div className="signature-section">
                                <div className="signature-info">
                                    <span className="signature-label">Authorized signatory for</span>
                                    <span className="company-name">holyfamily polymers</span>
                                </div>
                                <div className="signature-box">
                                    <button type="button" className="add-signature-btn">
                                        + Add Signature
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="btn-generate" disabled={loading}>
                                <FiSave /> {loading ? 'Generating...' : 'Generate Bill'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* HISTORY TABLE */}
            {activeTab === 'history' && (
                <div className="bill-gen-form-card">
                    {historyLoading ? (
                        <div className="bill-loading">
                            <div className="loading-spinner"></div>
                        </div>
                    ) : invoices.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-content">
                                <div className="empty-icon">📄</div>
                                <p>No Bills Matching the current filter</p>
                            </div>
                        </div>
                    ) : (
                        <div className="items-table-container">
                            <table className="items-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Invoice #</th>
                                        <th>Vendor</th>
                                        <th>Vehicle</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map(inv => (
                                        <tr key={inv._id}>
                                            <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                                            <td>{inv.invoiceNumber}</td>
                                            <td>{inv.vendor}</td>
                                            <td>{inv.vehicleNumber || '-'}</td>
                                            <td className="amount-display">₹{inv.totalAmount.toFixed(2)}</td>
                                            <td>
                                                <span className={`status-badge ${inv.status}`}>{inv.status}</span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn-pay-small"
                                                    onClick={() => navigate(`/accountant/invoices/${inv._id}`)}
                                                >
                                                    <FiFileText /> View
                                                </button>
                                                {inv.status !== 'paid' && (
                                                    <button
                                                        className="btn-pay-small"
                                                        onClick={() => initiatePayment(inv)}
                                                    >
                                                        Mark Paid
                                                    </button>
                                                )}
                                                {inv.status === 'paid' && <span className="text-green-600"><FiFileText /> Paid</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}


            {/* Add Bank Account Modal */}
            {showBankAccountModal && (
                <div className="modal-overlay">
                    <div className="bank-account-modal">
                        <div className="bank-account-header">
                            <h2>Add Bank Account</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowBankAccountModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="bank-account-content">
                            <div className="bank-form-section">
                                <div className="form-row">
                                    <div className="form-group full-width">
                                        <label className="form-label">
                                            Account Name <span className="required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="ex: Personal Account"
                                            value={bankAccountForm.accountName}
                                            onChange={(e) => handleBankAccountChange('accountName', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Opening Balance</label>
                                        <div className="balance-input-group">
                                            <span className="currency-symbol">₹</span>
                                            <input
                                                type="number"
                                                className="form-input"
                                                placeholder="ex: ₹10,000"
                                                value={bankAccountForm.openingBalance}
                                                onChange={(e) => handleBankAccountChange('openingBalance', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">As of Date</label>
                                        <input
                                            type="date"
                                            className="form-input date-input"
                                            value={bankAccountForm.asOfDate}
                                            onChange={(e) => handleBankAccountChange('asOfDate', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group full-width">
                                        <div className="bank-details-toggle">
                                            <label className="form-label">Add Bank Details</label>
                                            <div className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    id="addBankDetails"
                                                    checked={bankAccountForm.addBankDetails}
                                                    onChange={(e) => handleBankAccountChange('addBankDetails', e.target.checked)}
                                                />
                                                <label htmlFor="addBankDetails" className="toggle-slider"></label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {bankAccountForm.addBankDetails && (
                                    <>
                                        <div className="bank-details-section">
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label className="form-label">
                                                        Bank Account Number <span className="required">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder="ex: 123456789157950"
                                                        value={bankAccountForm.bankAccountNumber}
                                                        onChange={(e) => handleBankAccountChange('bankAccountNumber', e.target.value)}
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">
                                                        Re-Enter Bank Account Number <span className="required">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder="ex: 123456789157950"
                                                        value={bankAccountForm.reEnterBankAccountNumber}
                                                        onChange={(e) => handleBankAccountChange('reEnterBankAccountNumber', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label className="form-label">
                                                        IFSC Code <span className="required">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder="ex: HDFC000075"
                                                        value={bankAccountForm.ifscCode}
                                                        onChange={(e) => handleBankAccountChange('ifscCode', e.target.value)}
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">
                                                        Bank & Branch Name <span className="required">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder="ex: HDFC, Old Madras"
                                                        value={bankAccountForm.bankBranchName}
                                                        onChange={(e) => handleBankAccountChange('bankBranchName', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label className="form-label">
                                                        Account Holders Name <span className="required">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder="ex: Elisa wolf"
                                                        value={bankAccountForm.accountHolderName}
                                                        onChange={(e) => handleBankAccountChange('accountHolderName', e.target.value)}
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">UPI ID</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder="ex: elisa@okhdfc"
                                                        value={bankAccountForm.upiId}
                                                        onChange={(e) => handleBankAccountChange('upiId', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="bank-account-footer">
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() => setShowBankAccountModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="submit-btn"
                                onClick={handleBankAccountSubmit}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div >
    );
};

export default AccountantBillGeneration;
