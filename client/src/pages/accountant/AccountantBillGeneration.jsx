import React, { useState, useEffect } from 'react';
import { FiFileText, FiSave, FiPrinter, FiUser, FiTruck, FiCalendar, FiMapPin, FiPlus } from 'react-icons/fi';
import './AccountantBillGeneration.css';

const AccountantBillGeneration = () => {
    const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        vendor: '',
        billTo: '',
        invoiceDate: new Date().toISOString().slice(0, 10),
        vehicleNumber: '',
        distance: '',
        placeOfSupply: 'Kooroppada',
        bankAccount: '',
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

            if (!response.ok) throw new Error('Failed to generate bill');

            setSuccess('Bill generated successfully!');
            setFormData({
                vendor: '',
                billTo: '',
                invoiceDate: new Date().toISOString().slice(0, 10),
                vehicleNumber: '',
                distance: '',
                placeOfSupply: 'Kooroppada',
                bankAccount: '',
                items: [
                    { description: 'Vulcanised Rubber Other Than Hard Rubber (Rubber Bands)', hsn: '40169920', quantity: 0, rate: 0, amount: 0 }
                ]
            });
            
            // Show bank account modal after successful bill generation (optional)
            // setTimeout(() => {
            //     setSuccess('');
            //     setShowBankAccountModal(true);
            // }, 1500);
            
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

    // Create New Party Modal State
    const [showCreatePartyModal, setShowCreatePartyModal] = useState(false);
    const [newPartyForm, setNewPartyForm] = useState({
        partyName: '',
        mobileNumber: '',
        showAddress: false,
        showGstin: false,
        // Address fields
        billingAddress: '',
        state: '',
        pincode: '',
        city: '',
        shippingSameAsBilling: false,
        // GSTIN
        gstin: ''
    });

    // Available parties for Bill To
    const [availableParties, setAvailableParties] = useState([
        { id: 1, name: 'Sanjay Trading Co', mobile: '+91 9876543210', address: '1031 Gali Guy Wali, Pan Mandi, Sadar Bazar, Delhi - 110006', gstin: '07AECPG1178B1ZZ' },
        { id: 2, name: 'ABC Suppliers', mobile: '+91 9876543211', address: 'Mumbai, Maharashtra', gstin: '27AABCU9603R1ZX' },
        { id: 3, name: 'XYZ Enterprises', mobile: '+91 9876543212', address: 'Bangalore, Karnataka', gstin: '29AABCU9603R1ZY' }
    ]);

    // Indian States
    const [indianStates] = useState([
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
        'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
        'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
        'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir',
        'Ladakh', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep', 'Puducherry'
    ]);
    const [showCreateItemModal, setShowCreateItemModal] = useState(false);
    const [activeItemTab, setActiveItemTab] = useState('basic'); // 'basic', 'advance', 'stock', 'pricing', 'party', 'custom'
    const [newItemForm, setNewItemForm] = useState({
        // Basic Details
        itemType: 'Product', // 'Product' or 'Service'
        itemName: '',
        category: '',
        showInOnlineStore: false,
        salesPrice: '',
        salesPriceType: 'With Tax', // 'With Tax' or 'Without Tax'
        gstTaxRate: 'None',
        measuringUnit: 'Pieces(PCS)',
        openingStock: '',
        
        // Advanced Details
        itemCode: '',
        hsnCode: '',
        alternativeUnit: '',
        description: '',
        images: [],
        
        // Stock Details
        enableLowStockWarning: false,
        lowStockQuantity: '',
        asOfDate: new Date().toISOString().slice(0, 10),
        
        // Pricing Details
        purchasePrice: '',
        purchasePriceType: 'With Tax',
        totalAmount: '',
        
        // Custom Fields
        customItem: '',
        customRate: '',
        customGst: 'None',
        customInfo: ''
    });

    // Categories for dropdown
    const [itemCategories] = useState([
        'Raw Materials',
        'Finished Goods',
        'Office Supplies',
        'Equipment',
        'Services',
        'Consumables',
        'Packaging Materials',
        'Other'
    ]);

    // GST Tax Rates
    const [gstRates] = useState([
        'None',
        'GST 0%',
        'GST 5%',
        'GST 12%',
        'GST 18%',
        'GST 28%'
    ]);

    // Measuring Units
    const [measuringUnits] = useState([
        'Pieces(PCS)',
        'Kilograms(KG)',
        'Grams(GM)',
        'Litres(LTR)',
        'Metres(MTR)',
        'Boxes(BOX)',
        'Packets(PKT)',
        'Dozens(DOZ)',
        'Sets(SET)',
        'Units(UNT)'
    ]);

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

    // Handle new party form changes
    const handleNewPartyChange = (field, value) => {
        setNewPartyForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle party creation
    const handleCreateParty = async () => {
        try {
            // Validate required fields
            if (!newPartyForm.partyName.trim()) {
                setError('Party name is mandatory');
                return;
            }

            // Create full address string
            let fullAddress = '';
            if (newPartyForm.showAddress) {
                const addressParts = [
                    newPartyForm.billingAddress,
                    newPartyForm.city,
                    newPartyForm.state,
                    newPartyForm.pincode
                ].filter(part => part.trim());
                fullAddress = addressParts.join(', ');
            }

            // Create new party object
            const newParty = {
                id: availableParties.length + 1,
                name: newPartyForm.partyName,
                mobile: newPartyForm.mobileNumber || '',
                address: fullAddress,
                gstin: newPartyForm.gstin || ''
            };

            // Add to available parties
            setAvailableParties(prev => [...prev, newParty]);

            // Select the new party
            setFormData(prev => ({
                ...prev,
                billTo: newParty.id.toString()
            }));

            // Reset form and close modal
            setNewPartyForm({
                partyName: '',
                mobileNumber: '',
                showAddress: false,
                showGstin: false,
                billingAddress: '',
                state: '',
                pincode: '',
                city: '',
                shippingSameAsBilling: false,
                gstin: ''
            });
            
            setShowCreatePartyModal(false);
            setSuccess('Party added successfully!');
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            setError('Failed to create party');
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
    const handleNewItemChange = (field, value) => {
        setNewItemForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Generate item code
    const generateItemCode = () => {
        const code = `ITM${Date.now().toString().slice(-5)}`;
        handleNewItemChange('itemCode', code);
    };

    // Generate barcode (placeholder function)
    const generateBarcode = () => {
        const barcode = Math.random().toString(36).substr(2, 9).toUpperCase();
        console.log('Generated barcode:', barcode);
    };

    // Handle item creation
    const handleCreateItem = async () => {
        try {
            // Validate required fields
            if (!newItemForm.itemName.trim()) {
                setError('Please enter the item name');
                return;
            }

            // Create new item object
            const newItem = {
                description: newItemForm.itemName,
                hsn: newItemForm.hsnCode || '',
                quantity: 1,
                rate: parseFloat(newItemForm.salesPrice) || 0,
                amount: parseFloat(newItemForm.salesPrice) || 0
            };

            // Add to current form items
            setFormData(prev => ({
                ...prev,
                items: [...prev.items, newItem]
            }));

            // Reset form and close modal
            setNewItemForm({
                itemType: 'Product',
                itemName: '',
                category: '',
                showInOnlineStore: false,
                salesPrice: '',
                salesPriceType: 'With Tax',
                gstTaxRate: 'None',
                measuringUnit: 'Pieces(PCS)',
                openingStock: '',
                itemCode: '',
                hsnCode: '',
                alternativeUnit: '',
                description: '',
                images: [],
                enableLowStockWarning: false,
                lowStockQuantity: '',
                asOfDate: new Date().toISOString().slice(0, 10),
                purchasePrice: '',
                purchasePriceType: 'With Tax',
                totalAmount: '',
                customItem: '',
                customRate: '',
                customGst: 'None',
                customInfo: ''
            });
            setActiveItemTab('basic');
            setShowCreateItemModal(false);
            setSuccess('Item added successfully!');
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            setError('Failed to create item');
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

                            <div className="form-group">
                                <label className="form-label">📋 Bill To</label>
                                <div className="bill-to-container">
                                    {formData.billTo ? (
                                        <div className="selected-party">
                                            <div className="party-info">
                                                <div className="party-name">{availableParties.find(p => p.id.toString() === formData.billTo)?.name}</div>
                                                <div className="party-details">
                                                    <span>{availableParties.find(p => p.id.toString() === formData.billTo)?.mobile}</span>
                                                    {availableParties.find(p => p.id.toString() === formData.billTo)?.gstin && (
                                                        <span>GSTIN: {availableParties.find(p => p.id.toString() === formData.billTo)?.gstin}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <button 
                                                type="button"
                                                className="change-party-btn"
                                                onClick={() => setFormData(prev => ({ ...prev, billTo: '' }))}
                                            >
                                                Change
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="add-party-container">
                                            <button 
                                                type="button"
                                                className="add-party-btn"
                                                onClick={() => setShowCreatePartyModal(true)}
                                            >
                                                + Add Party
                                            </button>
                                            <div className="party-dropdown">
                                                <select
                                                    name="billTo"
                                                    className="form-select"
                                                    value={formData.billTo}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">Select existing party</option>
                                                    {availableParties.map(party => (
                                                        <option key={party.id} value={party.id}>{party.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

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
                                <input
                                    name="vehicleNumber"
                                    className="form-input"
                                    value={formData.vehicleNumber}
                                    onChange={handleChange}
                                    placeholder="e.g. KL-01-AB-1234"
                                />
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
                            <button 
                                type="button" 
                                className="add-new-item-btn"
                                onClick={() => setShowCreateItemModal(true)}
                            >
                                <FiPlus /> Add New Item
                            </button>
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
                                <span>IGST (12%)</span>
                                <span>₹{taxAmount.toFixed(2)}</span>
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

            {/* Create New Party Modal */}
            {showCreatePartyModal && (
                <div className="modal-overlay">
                    <div className="create-party-modal">
                        <div className="create-party-header">
                            <h2>Create New Party</h2>
                            <button 
                                className="modal-close" 
                                onClick={() => setShowCreatePartyModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="create-party-content">
                            <div className="party-form-section">
                                <div className="form-group full-width">
                                    <label className="form-label">
                                        Party Name <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={`form-input ${!newPartyForm.partyName ? 'error-border' : ''}`}
                                        placeholder="Enter name"
                                        value={newPartyForm.partyName}
                                        onChange={(e) => handleNewPartyChange('partyName', e.target.value)}
                                    />
                                    {!newPartyForm.partyName && (
                                        <span className="error-text">This field is mandatory</span>
                                    )}
                                </div>

                                <div className="form-group full-width">
                                    <label className="form-label">Mobile Number</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="Enter Mobile Number"
                                        value={newPartyForm.mobileNumber}
                                        onChange={(e) => handleNewPartyChange('mobileNumber', e.target.value)}
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <button 
                                        type="button" 
                                        className="add-optional-btn"
                                        onClick={() => handleNewPartyChange('showAddress', !newPartyForm.showAddress)}
                                    >
                                        + Add Address (Optional)
                                    </button>
                                </div>

                                {newPartyForm.showAddress && (
                                    <div className="address-section">
                                        <div className="address-header">
                                            <h3>Address (Optional)</h3>
                                            <button 
                                                type="button"
                                                className="remove-address-btn"
                                                onClick={() => handleNewPartyChange('showAddress', false)}
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        <div className="form-group full-width">
                                            <label className="form-label">
                                                BILLING ADDRESS <span className="required">*</span>
                                            </label>
                                            <textarea
                                                className="form-textarea"
                                                placeholder="Enter billing address"
                                                rows="3"
                                                value={newPartyForm.billingAddress}
                                                onChange={(e) => handleNewPartyChange('billingAddress', e.target.value)}
                                            />
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">STATE</label>
                                                <select
                                                    className="form-select"
                                                    value={newPartyForm.state}
                                                    onChange={(e) => handleNewPartyChange('state', e.target.value)}
                                                >
                                                    <option value="">Enter State</option>
                                                    {indianStates.map(state => (
                                                        <option key={state} value={state}>{state}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            <div className="form-group">
                                                <label className="form-label">PINCODE</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Enter Pincode"
                                                    value={newPartyForm.pincode}
                                                    onChange={(e) => handleNewPartyChange('pincode', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group full-width">
                                            <label className="form-label">CITY</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Enter City"
                                                value={newPartyForm.city}
                                                onChange={(e) => handleNewPartyChange('city', e.target.value)}
                                            />
                                        </div>

                                        <div className="form-group full-width">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={newPartyForm.shippingSameAsBilling}
                                                    onChange={(e) => handleNewPartyChange('shippingSameAsBilling', e.target.checked)}
                                                />
                                                <span className="checkbox-custom"></span>
                                                Shipping address same as billing address
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div className="form-group full-width">
                                    <button 
                                        type="button" 
                                        className="add-optional-btn"
                                        onClick={() => handleNewPartyChange('showGstin', !newPartyForm.showGstin)}
                                    >
                                        + Add GSTIN (Optional)
                                    </button>
                                </div>

                                {newPartyForm.showGstin && (
                                    <div className="form-group full-width">
                                        <label className="form-label">GSTIN</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Enter GSTIN"
                                            value={newPartyForm.gstin}
                                            onChange={(e) => handleNewPartyChange('gstin', e.target.value)}
                                        />
                                    </div>
                                )}

                                <div className="custom-fields-note">
                                    <p>You can add Custom Fields from <span className="link-text">Party Settings</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="create-party-footer">
                            <button 
                                type="button" 
                                className="cancel-btn"
                                onClick={() => setShowCreatePartyModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="save-btn"
                                onClick={handleCreateParty}
                            >
                                Save
                            </button>
                        </div>
                    </div>
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

            {/* Create New Item Modal */}
            {showCreateItemModal && (
                <div className="modal-overlay">
                    <div className="create-item-modal">
                        <div className="create-item-header">
                            <h2>Create New Item</h2>
                            <button 
                                className="modal-close" 
                                onClick={() => setShowCreateItemModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="create-item-content">
                            {/* Left Sidebar Navigation */}
                            <div className="item-nav-sidebar">
                                <div 
                                    className={`nav-item ${activeItemTab === 'basic' ? 'active' : ''}`}
                                    onClick={() => setActiveItemTab('basic')}
                                >
                                    <span className="nav-icon">📋</span>
                                    <span>Basic Details</span>
                                    <span className="required-indicator">*</span>
                                </div>
                                
                                <div className="nav-section-title">Advance Details</div>
                                
                                <div 
                                    className={`nav-item ${activeItemTab === 'stock' ? 'active' : ''}`}
                                    onClick={() => setActiveItemTab('stock')}
                                >
                                    <span className="nav-icon">📦</span>
                                    <span>Stock Details</span>
                                </div>
                                
                                <div 
                                    className={`nav-item ${activeItemTab === 'pricing' ? 'active' : ''}`}
                                    onClick={() => setActiveItemTab('pricing')}
                                >
                                    <span className="nav-icon">💰</span>
                                    <span>Pricing Details</span>
                                </div>
                            </div>

                            {/* Right Content Area */}
                            <div className="item-form-content">
                                {/* Basic Details Tab */}
                                {activeItemTab === 'basic' && (
                                    <div className="item-form-section">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">Item Type *</label>
                                                <div className="radio-group">
                                                    <label className="radio-option">
                                                        <input
                                                            type="radio"
                                                            name="itemType"
                                                            value="Product"
                                                            checked={newItemForm.itemType === 'Product'}
                                                            onChange={(e) => handleNewItemChange('itemType', e.target.value)}
                                                        />
                                                        <span className="radio-custom"></span>
                                                        Product
                                                    </label>
                                                    <label className="radio-option">
                                                        <input
                                                            type="radio"
                                                            name="itemType"
                                                            value="Service"
                                                            checked={newItemForm.itemType === 'Service'}
                                                            onChange={(e) => handleNewItemChange('itemType', e.target.value)}
                                                        />
                                                        <span className="radio-custom"></span>
                                                        Service
                                                    </label>
                                                </div>
                                            </div>
                                            
                                            <div className="form-group">
                                                <label className="form-label">Category</label>
                                                <select
                                                    className="form-select"
                                                    value={newItemForm.category}
                                                    onChange={(e) => handleNewItemChange('category', e.target.value)}
                                                >
                                                    <option value="">Select Category</option>
                                                    {itemCategories.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group full-width">
                                                <label className="form-label">Item Name *</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="ex: Maggie 20gm"
                                                    value={newItemForm.itemName}
                                                    onChange={(e) => handleNewItemChange('itemName', e.target.value)}
                                                />
                                                {!newItemForm.itemName && (
                                                    <span className="error-text">Please enter the item name</span>
                                                )}
                                            </div>
                                            
                                            <div className="form-group">
                                                <label className="form-label">Show Item in Online Store</label>
                                                <div className="toggle-switch">
                                                    <input
                                                        type="checkbox"
                                                        id="onlineStore"
                                                        checked={newItemForm.showInOnlineStore}
                                                        onChange={(e) => handleNewItemChange('showInOnlineStore', e.target.checked)}
                                                    />
                                                    <label htmlFor="onlineStore" className="toggle-slider"></label>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">Sales Price</label>
                                                <div className="price-input-group">
                                                    <span className="currency-symbol">₹</span>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        placeholder="ex: ₹200"
                                                        value={newItemForm.salesPrice}
                                                        onChange={(e) => handleNewItemChange('salesPrice', e.target.value)}
                                                    />
                                                    <select
                                                        className="price-type-select"
                                                        value={newItemForm.salesPriceType}
                                                        onChange={(e) => handleNewItemChange('salesPriceType', e.target.value)}
                                                    >
                                                        <option value="With Tax">With Tax</option>
                                                        <option value="Without Tax">Without Tax</option>
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <div className="form-group">
                                                <label className="form-label">GST Tax Rate(%)</label>
                                                <select
                                                    className="form-select"
                                                    value={newItemForm.gstTaxRate}
                                                    onChange={(e) => handleNewItemChange('gstTaxRate', e.target.value)}
                                                >
                                                    {gstRates.map(rate => (
                                                        <option key={rate} value={rate}>{rate}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">Measuring Unit</label>
                                                <select
                                                    className="form-select"
                                                    value={newItemForm.measuringUnit}
                                                    onChange={(e) => handleNewItemChange('measuringUnit', e.target.value)}
                                                >
                                                    {measuringUnits.map(unit => (
                                                        <option key={unit} value={unit}>{unit}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            <div className="form-group">
                                                <label className="form-label">Opening Stock</label>
                                                <div className="stock-input-group">
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        placeholder="ex: 150 PCS"
                                                        value={newItemForm.openingStock}
                                                        onChange={(e) => handleNewItemChange('openingStock', e.target.value)}
                                                    />
                                                    <span className="unit-label">PCS</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Custom Fields Section */}
                                        <div className="custom-fields-section">
                                            <h4 className="section-title">Custom Fields</h4>
                                            
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label className="form-label">Item</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder="Enter item details"
                                                        value={newItemForm.customItem || ''}
                                                        onChange={(e) => handleNewItemChange('customItem', e.target.value)}
                                                    />
                                                </div>
                                                
                                                <div className="form-group">
                                                    <label className="form-label">Rate</label>
                                                    <div className="price-input-group">
                                                        <span className="currency-symbol">₹</span>
                                                        <input
                                                            type="number"
                                                            className="form-input"
                                                            placeholder="Enter rate"
                                                            value={newItemForm.customRate || ''}
                                                            onChange={(e) => handleNewItemChange('customRate', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label className="form-label">GST</label>
                                                    <select
                                                        className="form-select"
                                                        value={newItemForm.customGst || 'None'}
                                                        onChange={(e) => handleNewItemChange('customGst', e.target.value)}
                                                    >
                                                        <option value="None">None</option>
                                                        <option value="GST 0%">GST 0%</option>
                                                        <option value="GST 5%">GST 5%</option>
                                                        <option value="GST 12%">GST 12%</option>
                                                        <option value="GST 18%">GST 18%</option>
                                                        <option value="GST 28%">GST 28%</option>
                                                    </select>
                                                </div>
                                                
                                                <div className="form-group">
                                                    <label className="form-label">Additional Info</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder="Enter additional information"
                                                        value={newItemForm.customInfo || ''}
                                                        onChange={(e) => handleNewItemChange('customInfo', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Stock Details Tab */}
                                {activeItemTab === 'stock' && (
                                    <div className="item-form-section">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">Item Code</label>
                                                <div className="code-input-group">
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder="ex: ITM12549"
                                                        value={newItemForm.itemCode}
                                                        onChange={(e) => handleNewItemChange('itemCode', e.target.value)}
                                                    />
                                                    <button 
                                                        type="button" 
                                                        className="generate-btn"
                                                        onClick={generateItemCode}
                                                    >
                                                        Generate Barcode
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="form-group">
                                                <label className="form-label">HSN code</label>
                                                <div className="hsn-input-group">
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder="ex: 4010"
                                                        value={newItemForm.hsnCode}
                                                        onChange={(e) => handleNewItemChange('hsnCode', e.target.value)}
                                                    />
                                                    <button type="button" className="find-hsn-btn">
                                                        Find HSN Code
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">Measuring Unit</label>
                                                <select
                                                    className="form-select"
                                                    value={newItemForm.measuringUnit}
                                                    onChange={(e) => handleNewItemChange('measuringUnit', e.target.value)}
                                                >
                                                    {measuringUnits.map(unit => (
                                                        <option key={unit} value={unit}>{unit}</option>
                                                    ))}
                                                </select>
                                                <button type="button" className="alternative-unit-btn">
                                                    + Alternative Unit
                                                </button>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">Opening Stock</label>
                                                <div className="stock-input-group">
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        placeholder="ex: 150 PCS"
                                                        value={newItemForm.openingStock}
                                                        onChange={(e) => handleNewItemChange('openingStock', e.target.value)}
                                                    />
                                                    <span className="unit-label">PCS</span>
                                                </div>
                                            </div>
                                            
                                            <div className="form-group">
                                                <label className="form-label">As of Date</label>
                                                <input
                                                    type="date"
                                                    className="form-input"
                                                    value={newItemForm.asOfDate}
                                                    onChange={(e) => handleNewItemChange('asOfDate', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group full-width">
                                                <button 
                                                    type="button" 
                                                    className="low-stock-warning-btn"
                                                    onClick={() => handleNewItemChange('enableLowStockWarning', !newItemForm.enableLowStockWarning)}
                                                >
                                                    + Enable Low stock quantity warning ℹ️
                                                </button>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group full-width">
                                                <label className="form-label">Description</label>
                                                <textarea
                                                    className="form-textarea"
                                                    placeholder="Enter Description"
                                                    rows="4"
                                                    value={newItemForm.description}
                                                    onChange={(e) => handleNewItemChange('description', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group full-width">
                                                <div className="file-upload-area">
                                                    <div className="upload-icon">📁</div>
                                                    <p>Please select or drag and drop 5 files.</p>
                                                    <p className="upload-note">Maximum of 5 images in PNG or JPEG, file size no more than 5 MB</p>
                                                    <button type="button" className="select-file-btn">
                                                        Select File
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Pricing Details Tab */}
                                {activeItemTab === 'pricing' && (
                                    <div className="item-form-section">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">Sales Price</label>
                                                <div className="price-input-group">
                                                    <span className="currency-symbol">₹</span>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        placeholder="ex: ₹200"
                                                        value={newItemForm.salesPrice}
                                                        onChange={(e) => handleNewItemChange('salesPrice', e.target.value)}
                                                    />
                                                    <select
                                                        className="price-type-select"
                                                        value={newItemForm.salesPriceType}
                                                        onChange={(e) => handleNewItemChange('salesPriceType', e.target.value)}
                                                    >
                                                        <option value="With Tax">With Tax</option>
                                                        <option value="Without Tax">Without Tax</option>
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <div className="form-group">
                                                <label className="form-label">Purchase Price</label>
                                                <div className="price-input-group">
                                                    <span className="currency-symbol">₹</span>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        placeholder="ex: ₹200"
                                                        value={newItemForm.purchasePrice}
                                                        onChange={(e) => handleNewItemChange('purchasePrice', e.target.value)}
                                                    />
                                                    <select
                                                        className="price-type-select"
                                                        value={newItemForm.purchasePriceType}
                                                        onChange={(e) => handleNewItemChange('purchasePriceType', e.target.value)}
                                                    >
                                                        <option value="With Tax">With Tax</option>
                                                        <option value="Without Tax">Without Tax</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label className="form-label">GST Tax Rate(%)</label>
                                                <select
                                                    className="form-select"
                                                    value={newItemForm.gstTaxRate}
                                                    onChange={(e) => handleNewItemChange('gstTaxRate', e.target.value)}
                                                >
                                                    {gstRates.map(rate => (
                                                        <option key={rate} value={rate}>{rate}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            <div className="form-group">
                                                <label className="form-label">Total Amount</label>
                                                <div className="price-input-group">
                                                    <span className="currency-symbol">₹</span>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        placeholder="ex: ₹1000"
                                                        value={newItemForm.totalAmount || ''}
                                                        onChange={(e) => handleNewItemChange('totalAmount', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="create-item-footer">
                            <button 
                                type="button" 
                                className="cancel-btn"
                                onClick={() => setShowCreateItemModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="save-btn"
                                onClick={handleCreateItem}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountantBillGeneration;
