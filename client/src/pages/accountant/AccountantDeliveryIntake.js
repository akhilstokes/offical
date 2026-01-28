import React, { useState, useEffect } from 'react';
import { FiTruck, FiPackage, FiUser, FiPhone, FiCalendar, FiRefreshCw, FiPlus } from 'react-icons/fi';
import './AccountantDeliveryIntake.css';

const AccountantDeliveryIntake = () => {
    const [loading, setLoading] = useState(false);
    const [deliveries, setDeliveries] = useState([]);
    const [showAddIntakeModal, setShowAddIntakeModal] = useState(false);
    const [showBillModal, setShowBillModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [editingRow, setEditingRow] = useState(null);

    // Form state for new delivery intake
    const [intakeForm, setIntakeForm] = useState({
        date: new Date().toISOString().slice(0, 10),
        buyer: '',
        phone: '',
        barrels: '',
        drcPercent: '',
        barrelDetails: [], // Array of {barrelNumber, drc, liters}
        barrelVolumes: {}, // Object to store volume per barrel: {0: 100, 1: 100}
        totalKg: '',
        dryKg: '',
        marketRate: '',
        amount: '',
        perBarrel: ''
    });

    // Admin-approved company rate
    const [approvedCompanyRate, setApprovedCompanyRate] = useState(null);
    const [loadingRate, setLoadingRate] = useState(false);

    // Sample delivery data
    const [sampleDeliveries] = useState([
        {
            id: 1,
            date: '2026-01-03',
            buyer: 'Sanjay Trading Co',
            phone: '+91 9876543210',
            barrels: 25,
            drcPercent: 12,
            totalKg: 1200,
            dryKg: 1056,
            marketRate: 110,
            amount: 116160,
            perBarrel: 4646.4,
            status: 'verified'
        },
        {
            id: 2,
            date: '2026-01-02',
            buyer: 'ABC Suppliers',
            phone: '+91 9876543211',
            barrels: 30,
            drcPercent: 15,
            totalKg: 1500,
            dryKg: 1275,
            marketRate: 108,
            amount: 137700,
            perBarrel: 4590,
            status: 'pending'
        }
    ]);

    useEffect(() => {
        fetchDeliveries();
        fetchApprovedRate();
    }, []);

    const fetchApprovedRate = async () => {
        setLoadingRate(true);
        try {
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${API_URL}/api/rates/latex/today`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Check if admin rate is valid (within 24-hour window from 4 PM to 4 PM)
                if (data.admin && data.admin.isValid && data.admin.companyRate) {
                    const companyRate = data.admin.companyRate;
                    setApprovedCompanyRate(companyRate);
                    
                    // Auto-fill market rate with company rate
                    setIntakeForm(prev => ({
                        ...prev,
                        marketRate: companyRate.toString()
                    }));
                    
                    console.log('✓ Auto-filled company rate:', companyRate);
                    console.log('✓ Rate valid from:', data.admin.validFrom);
                    console.log('✓ Rate valid until:', data.admin.validUntil);
                } else if (data.admin && !data.admin.isValid) {
                    // Rate exists but is expired or not yet valid
                    setApprovedCompanyRate(null);
                    console.log('⚠️ Rate not valid:', data.admin.reason);
                    console.log('⚠️ Rate effective date:', data.admin.effectiveDate);
                    console.log('⚠️ Rate valid from:', data.admin.validFrom);
                    console.log('⚠️ Rate valid until:', data.admin.validUntil);
                } else {
                    // No rate found
                    setApprovedCompanyRate(null);
                    console.log('⚠️ No approved rate available');
                }
            }
        } catch (err) {
            console.error('Error fetching approved rate:', err);
        } finally {
            setLoadingRate(false);
        }
    };

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            // Load pending samples from lab check-ins
            const labPendingSamples = JSON.parse(localStorage.getItem('accountant_pending_samples') || '[]');
            
            // Transform lab data to delivery format - Auto-fill: buyer, phone, barrels, DRC
            const transformedDeliveries = labPendingSamples.map((sample, index) => ({
                id: `lab-${index}`,
                date: sample.receivedAt ? new Date(sample.receivedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                buyer: sample.customerName || 'N/A',
                phone: sample.phone || '-',
                barrels: sample.barrelCount || 0,
                drcPercent: sample.drc || 0, // Average DRC for display
                barrelDetails: sample.barrels || [], // Individual barrel DRC values
                // These fields are MANUAL ENTRY ONLY
                totalKg: sample.totalKg || 0,
                dryKg: sample.dryKg || 0,
                marketRate: sample.marketRate || 0,
                amount: sample.totalAmount || 0,
                perBarrel: sample.perBarrel || 0,
                // PRESERVE STATUS - If bill was already calculated, keep it as 'calculated'
                status: sample.status || 'pending',
                billId: sample.billId,
                billNumber: sample.billNumber,
                sampleId: sample.sampleId,
                labStaff: sample.labStaff,
                notes: sample.notes
            }));
            
            // Combine with sample deliveries if needed
            const allDeliveries = [...transformedDeliveries, ...sampleDeliveries];
            
            setTimeout(() => {
                setDeliveries(allDeliveries);
                setLoading(false);
            }, 500);
        } catch (err) {
            console.error('Error fetching deliveries:', err);
            setDeliveries(sampleDeliveries);
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // VALIDATION: Market Rate - max 50000, positive only
        if (name === 'marketRate') {
            const rateValue = parseFloat(value);
            if (value && rateValue < 0) {
                setError('⚠️ Market rate must be a positive number');
                setTimeout(() => setError(''), 3000);
                return;
            }
            if (value && rateValue > 50000) {
                setError('⚠️ Market rate cannot exceed ₹50,000 per 100KG');
                setTimeout(() => setError(''), 3000);
                return;
            }
        }
        
        // VALIDATION: Latex Volume - positive only
        if (name === 'totalKg') {
            const volumeValue = parseFloat(value);
            if (value && volumeValue < 0) {
                setError('⚠️ Latex volume must be a positive number');
                setTimeout(() => setError(''), 3000);
                return;
            }
        }
        
        setIntakeForm(prev => {
            const updatedForm = {
                ...prev,
                [name]: value
            };
            
            // Auto-calculate if latex volume (totalKg) is entered and we have rate and DRC
            if (name === 'totalKg' && value && parseFloat(value) > 0) {
                const totalKg = parseFloat(value);
                const marketRate = parseFloat(prev.marketRate) || 0;
                const drcPercent = parseFloat(prev.drcPercent) || 0;
                
                if (marketRate > 0 && drcPercent > 0) {
                    const dryKg = totalKg * (drcPercent / 100);
                    const perKgRate = marketRate / 100;
                    const amount = dryKg * perKgRate;
                    const barrels = parseFloat(prev.barrels) || 0;
                    const perBarrel = barrels > 0 ? amount / barrels : 0;
                    
                    updatedForm.dryKg = dryKg.toFixed(2);
                    updatedForm.amount = amount.toFixed(2);
                    updatedForm.perBarrel = perBarrel.toFixed(2);
                    
                    console.log('✓ Auto-calculated billing:', {
                        volume: totalKg,
                        drc: drcPercent,
                        dryRubber: dryKg.toFixed(2),
                        rate: marketRate,
                        amount: amount.toFixed(2)
                    });
                }
            }
            
            // Auto-calculate if market rate is changed and we have volume and DRC
            if (name === 'marketRate' && value && parseFloat(value) > 0) {
                const marketRate = parseFloat(value);
                const totalKg = parseFloat(prev.totalKg) || 0;
                const drcPercent = parseFloat(prev.drcPercent) || 0;
                
                if (totalKg > 0 && drcPercent > 0) {
                    const dryKg = totalKg * (drcPercent / 100);
                    const perKgRate = marketRate / 100;
                    const amount = dryKg * perKgRate;
                    const barrels = parseFloat(prev.barrels) || 0;
                    const perBarrel = barrels > 0 ? amount / barrels : 0;
                    
                    updatedForm.dryKg = dryKg.toFixed(2);
                    updatedForm.amount = amount.toFixed(2);
                    updatedForm.perBarrel = perBarrel.toFixed(2);
                    
                    console.log('✓ Auto-calculated billing (rate changed):', {
                        volume: totalKg,
                        drc: drcPercent,
                        dryRubber: dryKg.toFixed(2),
                        rate: marketRate,
                        amount: amount.toFixed(2)
                    });
                }
            }
            
            return updatedForm;
        });
    };

    const handleBarrelVolumeChange = (barrelIndex, value) => {
        // VALIDATION: Per-barrel volume - positive only, max 300 liters
        const volumeValue = parseFloat(value);
        if (value && volumeValue < 0) {
            setError('⚠️ Latex volume must be a positive number');
            setTimeout(() => setError(''), 3000);
            return;
        }
        if (value && volumeValue > 300) {
            setError('⚠️ Latex volume per barrel cannot exceed 300 liters');
            setTimeout(() => setError(''), 3000);
            return;
        }
        
        setIntakeForm(prev => {
            const newBarrelVolumes = {
                ...prev.barrelVolumes,
                [barrelIndex]: parseFloat(value) || 0
            };
            
            // Calculate total volume
            const totalVolume = Object.values(newBarrelVolumes).reduce((sum, vol) => sum + vol, 0);
            
            const updatedForm = {
                ...prev,
                barrelVolumes: newBarrelVolumes,
                totalKg: totalVolume.toString()
            };
            
            // Auto-calculate if we have all required data
            if (totalVolume > 0 && prev.marketRate && parseFloat(prev.marketRate) > 0 && prev.drcPercent) {
                const drcPercent = parseFloat(prev.drcPercent) || 0;
                const dryKg = totalVolume * (drcPercent / 100);
                const marketRate = parseFloat(prev.marketRate) || 0;
                const perKgRate = marketRate / 100;
                const amount = dryKg * perKgRate;
                const barrels = parseFloat(prev.barrels) || 0;
                const perBarrel = barrels > 0 ? amount / barrels : 0;
                
                updatedForm.dryKg = dryKg.toFixed(2);
                updatedForm.amount = amount.toFixed(2);
                updatedForm.perBarrel = perBarrel.toFixed(2);
                
                console.log('✓ Auto-calculated billing:', {
                    volume: totalVolume,
                    drc: drcPercent,
                    dryRubber: dryKg.toFixed(2),
                    rate: marketRate,
                    amount: amount.toFixed(2)
                });
            }
            
            return updatedForm;
        });
    };

    const handleCalculate = () => {
        // Validation
        if (!intakeForm.totalKg || parseFloat(intakeForm.totalKg) <= 0) {
            setError('Please enter Latex Volume (Liters)');
            setTimeout(() => setError(''), 3000);
            return;
        }
        
        if (!intakeForm.marketRate || parseFloat(intakeForm.marketRate) <= 0) {
            setError('Please enter Market Rate (₹/100KG)');
            setTimeout(() => setError(''), 3000);
            return;
        }

        // Calculate Dry Rubber using average DRC
        const totalKg = parseFloat(intakeForm.totalKg) || 0;
        const drcPercent = parseFloat(intakeForm.drcPercent) || 0;
        const dryKg = totalKg * (drcPercent / 100);

        // Calculate Amount
        const marketRate = parseFloat(intakeForm.marketRate) || 0;
        const perKgRate = marketRate / 100;
        const amount = dryKg * perKgRate;

        // Calculate per barrel
        const barrels = parseFloat(intakeForm.barrels) || 0;
        const perBarrel = barrels > 0 ? amount / barrels : 0;

        setIntakeForm(prev => ({
            ...prev,
            dryKg: dryKg.toFixed(2),
            amount: amount.toFixed(2),
            perBarrel: perBarrel.toFixed(2)
        }));

        setSuccess('✓ Calculation completed successfully!');
        setTimeout(() => setSuccess(''), 2000);
    };

    const handleAddIntake = async () => {
        try {
            // Validate that calculation was done
            if (!intakeForm.amount || parseFloat(intakeForm.amount) <= 0) {
                setError('Please click Calculate button first');
                setTimeout(() => setError(''), 3000);
                return;
            }

            // Validate required fields
            if (!intakeForm.buyer || !intakeForm.barrels || !intakeForm.totalKg) {
                setError('Please fill all required fields');
                setTimeout(() => setError(''), 3000);
                return;
            }

            // Save bill to database
            const token = localStorage.getItem('token');
            
            // Find user by phone number
            let userId = null;
            if (intakeForm.phone && intakeForm.phone !== 'N/A' && intakeForm.phone !== '-') {
                try {
                    const userResponse = await fetch(
                        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/find-by-phone?phone=${encodeURIComponent(intakeForm.phone)}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        }
                    );
                    
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        userId = userData.user?._id || userData.userId;
                        console.log('✅ Found user by phone:', userId);
                    } else {
                        console.log('⚠️ User not found by phone number');
                    }
                } catch (err) {
                    console.log('⚠️ Could not find user by phone:', err.message);
                }
            }
            
            const billData = {
                customerName: intakeForm.buyer,
                customerPhone: intakeForm.phone || 'N/A',
                sampleId: intakeForm.sampleId || selectedBill?.sampleId || '',
                labStaff: intakeForm.labStaff || selectedBill?.labStaff || '',
                drcPercent: parseFloat(intakeForm.drcPercent),
                barrelCount: parseInt(intakeForm.barrels),
                latexVolume: parseFloat(intakeForm.totalKg),
                marketRate: parseFloat(intakeForm.marketRate),
                accountantNotes: intakeForm.notes || '',
                userId: userId // Link bill to user
            };
            
            console.log('🔄 Sending bill creation request...');
            console.log('API URL:', `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/bills`);
            console.log('📤 Bill data being sent:', billData);
            
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/bills`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(billData)
            });

            console.log('📥 Response status:', response.status);
            console.log('📥 Response ok:', response.ok);

            if (!response.ok) {
                // Try to get error message from response
                let errorMessage = 'Failed to save bill';
                try {
                    const errorText = await response.text();
                    console.error('❌ Server response text:', errorText);
                    
                    // Try to parse as JSON
                    try {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.message || errorMessage;
                    } catch (e) {
                        // Not JSON, use text as message
                        errorMessage = errorText || errorMessage;
                    }
                } catch (e) {
                    console.error('❌ Could not read error response:', e);
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('✅ Bill created successfully:', data);

            // Prepare display data from server response
            const displayBillData = {
                ...data.bill,
                id: data.bill._id,
                date: data.bill.createdAt || new Date().toISOString(),
                buyer: data.bill.customerName,
                phone: data.bill.customerPhone,
                barrels: data.bill.barrelCount,
                totalKg: data.bill.latexVolume,
                dryKg: data.bill.dryRubber,
                amount: data.bill.totalAmount,
                perBarrel: data.bill.perBarrelAmount,
                billNumber: data.bill.billNumber,
                sampleId: data.bill.sampleId,
                labStaff: data.bill.labStaff,
                drcPercent: data.bill.drcPercent,
                marketRate: data.bill.marketRate,
                status: 'calculated' // Mark as calculated
            };

            // Update the existing delivery row instead of adding new one
            setDeliveries(prev => prev.map(d => {
                if (d.id === selectedBill?.id || 
                    (d.sampleId && d.sampleId === displayBillData.sampleId)) {
                    return {
                        ...d,
                        ...displayBillData,
                        status: 'calculated',
                        billId: data.bill._id
                    };
                }
                return d;
            }));

            // PERSIST STATUS TO LOCALSTORAGE - Update the sample status so it persists across page refreshes
            try {
                const labPendingSamples = JSON.parse(localStorage.getItem('accountant_pending_samples') || '[]');
                const updatedSamples = labPendingSamples.map(sample => {
                    if (sample.sampleId === displayBillData.sampleId) {
                        return {
                            ...sample,
                            status: 'calculated',
                            billId: data.bill._id,
                            billNumber: data.bill.billNumber,
                            totalAmount: data.bill.totalAmount,
                            calculatedAt: new Date().toISOString()
                        };
                    }
                    return sample;
                });
                localStorage.setItem('accountant_pending_samples', JSON.stringify(updatedSamples));
                console.log('✅ Bill status persisted to localStorage');
            } catch (err) {
                console.error('⚠️ Failed to update localStorage:', err);
            }

            // Show bill modal for printing
            setSelectedBill(displayBillData);
            setShowBillModal(true);
            setShowAddIntakeModal(false);
            
            setSuccess('Bill generated and sent to manager for verification!');
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            console.error('❌ Error saving bill:', err);
            setError('Failed to generate bill: ' + err.message);
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleVerifyDelivery = (deliveryId) => {
        const delivery = deliveries.find(d => d.id === deliveryId);
        
        // Validation: Check if required fields are filled
        if (!delivery.totalKg || delivery.totalKg <= 0) {
            setError('⚠️ Please enter Latex Volume (Liters) before verifying');
            setTimeout(() => setError(''), 4000);
            return;
        }
        
        if (!delivery.marketRate || delivery.marketRate <= 0) {
            // Auto-use approved company rate if available
            if (approvedCompanyRate && approvedCompanyRate > 0) {
                delivery.marketRate = approvedCompanyRate;
            } else {
                setError('⚠️ No approved company rate available. Admin must approve a rate first.');
                setTimeout(() => setError(''), 4000);
                return;
            }
        }
        
        if (!delivery.amount || delivery.amount <= 0) {
            setError('⚠️ Please click Calculate button first to compute the billing amount');
            setTimeout(() => setError(''), 4000);
            return;
        }
        
        // Show bill modal for printing
        setSelectedBill(delivery);
        setShowBillModal(true);
        
        setDeliveries(prev => 
            prev.map(d => 
                d.id === deliveryId 
                    ? { ...d, status: 'verified' }
                    : d
            )
        );
    };

    const handlePrintBill = () => {
        window.print();
    };

    // Handle inline field changes (without auto-calculation)
    const handleFieldChange = (deliveryId, field, value) => {
        setDeliveries(prev => 
            prev.map(delivery => {
                if (delivery.id === deliveryId) {
                    return { ...delivery, [field]: parseFloat(value) || 0 };
                }
                return delivery;
            })
        );
    };

    return (
        <div className="delivery-intake">
            {/* Header */}
            <div className="delivery-header">
                <div className="header-left">
                    <h1 className="page-title">
                        <FiTruck /> Delivery Intake / Verify
                    </h1>
                    <p className="page-description">
                        Lab check-ins auto-fill: Buyer Name, Phone, Barrels, DRC%. Enter Latex Volume (Liters) and Market Rate (₹/100KG), then click Calculate to compute Dry Rubber and Billing Amount.
                    </p>
                </div>
                <div className="header-right">
                    <button 
                        className="add-intake-btn"
                        onClick={() => setShowAddIntakeModal(true)}
                    >
                        <FiPlus /> Add Intake
                    </button>
                    <button 
                        className="refresh-btn"
                        onClick={fetchDeliveries}
                        disabled={loading}
                    >
                        <FiRefreshCw className={loading ? 'spinning' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* Success/Error Messages */}
            {success && <div className="alert-success">{success}</div>}
            {error && <div className="alert-error">{error}</div>}

            {/* Delivery Table */}
            <div className="delivery-table-container">
                {loading ? (
                    <div className="delivery-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading deliveries...</p>
                    </div>
                ) : deliveries.length > 0 ? (
                    <table className="delivery-table">
                        <thead>
                            <tr>
                                <th>DATE</th>
                                <th>SAMPLE ID</th>
                                <th>BUYER NAME</th>
                                <th>PHONE</th>
                                <th>BARRELS</th>
                                <th>DRC%</th>
                                <th>LAB STAFF</th>
                                <th>STATUS</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveries.map(delivery => (
                                <tr key={delivery.id} className={delivery.status === 'verified' ? 'verified-row' : ''}>
                                    <td>{new Date(delivery.date).toLocaleDateString()}</td>
                                    <td>
                                        {delivery.sampleId ? (
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '4px 8px',
                                                backgroundColor: '#f3e8ff',
                                                color: '#7c3aed',
                                                borderRadius: '4px',
                                                fontFamily: 'monospace',
                                                fontSize: '11px',
                                                fontWeight: '600'
                                            }}>
                                                {delivery.sampleId}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td><strong>{delivery.buyer}</strong></td>
                                    <td>{delivery.phone}</td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 10px',
                                            backgroundColor: '#dbeafe',
                                            color: '#1e40af',
                                            borderRadius: '4px',
                                            fontWeight: '600',
                                            fontSize: '13px'
                                        }}>
                                            {delivery.barrels}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '4px 10px',
                                            backgroundColor: '#dcfce7',
                                            color: '#166534',
                                            borderRadius: '4px',
                                            fontWeight: '600',
                                            fontSize: '13px'
                                        }}>
                                            {delivery.drcPercent}%
                                        </span>
                                    </td>
                                    <td>
                                        {delivery.labStaff ? (
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '4px 8px',
                                                backgroundColor: '#fef3c7',
                                                color: '#92400e',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }}>
                                                {delivery.labStaff}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        {delivery.status === 'verified' ? (
                                            <span className="verified-badge">✓ Verified</span>
                                        ) : delivery.status === 'calculated' ? (
                                            <span className="calculated-badge">✓ Calculated</span>
                                        ) : delivery.amount > 0 ? (
                                            <span className="calculated-badge">Calculated</span>
                                        ) : (
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '4px 10px',
                                                backgroundColor: '#fef3c7',
                                                color: '#92400e',
                                                borderRadius: '4px',
                                                fontSize: '11px',
                                                fontWeight: '600'
                                            }}>Pending</span>
                                        )}
                                    </td>
                                    <td>
                                        {delivery.status === 'verified' || delivery.status === 'calculated' ? (
                                            <button
                                                className="view-bill-btn"
                                                onClick={() => {
                                                    setSelectedBill(delivery);
                                                    setShowBillModal(true);
                                                }}
                                                title="View Bill"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                    <circle cx="12" cy="12" r="3"></circle>
                                                </svg>
                                                View Bill
                                            </button>
                                        ) : (
                                            <button
                                                className="process-btn"
                                                onClick={() => {
                                                    setSelectedBill(delivery);
                                                    setShowAddIntakeModal(true);
                                                    setIntakeForm({
                                                        ...intakeForm,
                                                        date: delivery.date,
                                                        buyer: delivery.buyer,
                                                        phone: delivery.phone,
                                                        barrels: delivery.barrels,
                                                        drcPercent: delivery.drcPercent,
                                                        barrelDetails: delivery.barrelDetails || [],
                                                        barrelVolumes: {}, // Reset volumes
                                                        totalKg: delivery.totalKg || '',
                                                        marketRate: delivery.marketRate || '',
                                                        sampleId: delivery.sampleId,
                                                        labStaff: delivery.labStaff
                                                    });
                                                }}
                                                title="Process Bill"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                                Process
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-state">
                        <div className="empty-content">
                            <FiPackage className="empty-icon" />
                            <p>No pending intakes.</p>
                            <button 
                                className="add-first-intake-btn"
                                onClick={() => setShowAddIntakeModal(true)}
                            >
                                Add First Intake
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Process/Calculate Modal */}
            {showAddIntakeModal && (
                <div className="modal-overlay">
                    <div className="intake-modal">
                        <div className="intake-modal-header">
                            <h2>Process Billing</h2>
                            <button 
                                className="modal-close" 
                                onClick={() => setShowAddIntakeModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="intake-modal-content">
                            <div className="intake-form-grid">
                                <div className="form-group">
                                    <label className="form-label">
                                        <FiCalendar /> Date
                                    </label>
                                    <input
                                        type="date"
                                        name="date"
                                        className="form-input"
                                        value={intakeForm.date}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <FiUser /> Buyer Name
                                    </label>
                                    <input
                                        type="text"
                                        name="buyer"
                                        className="form-input"
                                        value={intakeForm.buyer}
                                        onChange={handleInputChange}
                                        placeholder="Enter buyer name"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <FiPhone /> Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="form-input"
                                        value={intakeForm.phone}
                                        onChange={handleInputChange}
                                        placeholder="Enter phone number"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <FiPackage /> Number of Barrels
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={intakeForm.barrels}
                                        readOnly
                                        style={{
                                            backgroundColor: '#f3f4f6',
                                            cursor: 'not-allowed'
                                        }}
                                    />
                                </div>

                                {/* DRC Values - Show individual per barrel if available */}
                                {intakeForm.barrelDetails && intakeForm.barrelDetails.length > 0 ? (
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label" style={{ marginBottom: '12px' }}>
                                            DRC Values (Individual per Barrel)
                                            <span style={{
                                                marginLeft: '8px',
                                                fontSize: '11px',
                                                color: '#059669',
                                                fontWeight: '600',
                                                backgroundColor: '#d1fae5',
                                                padding: '2px 6px',
                                                borderRadius: '3px'
                                            }}>From Lab</span>
                                        </label>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                            gap: '12px',
                                            padding: '16px',
                                            backgroundColor: '#f0fdf4',
                                            borderRadius: '8px',
                                            border: '2px solid #86efac'
                                        }}>
                                            {intakeForm.barrelDetails.map((barrel, index) => (
                                                <div key={index} style={{
                                                    padding: '12px',
                                                    backgroundColor: '#ffffff',
                                                    borderRadius: '6px',
                                                    border: '1px solid #bbf7d0'
                                                }}>
                                                    <div style={{
                                                        fontSize: '12px',
                                                        color: '#059669',
                                                        fontWeight: '600',
                                                        marginBottom: '6px'
                                                    }}>
                                                        Barrel {barrel.barrelNumber || index + 1}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '20px',
                                                        color: '#166534',
                                                        fontWeight: '700'
                                                    }}>
                                                        {barrel.drc}%
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <small style={{ 
                                            color: '#059669', 
                                            fontSize: 12, 
                                            marginTop: 8, 
                                            display: 'block',
                                            fontStyle: 'italic'
                                        }}>
                                            ℹ️ Average DRC: {intakeForm.drcPercent}% (used for calculation)
                                        </small>
                                    </div>
                                ) : (
                                    <div className="form-group">
                                        <label className="form-label">DRC %</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={`${intakeForm.drcPercent}%`}
                                            readOnly
                                            style={{
                                                backgroundColor: '#f3f4f6',
                                                cursor: 'not-allowed'
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Latex Volume - Separate input per barrel if barrel details available */}
                                {intakeForm.barrelDetails && intakeForm.barrelDetails.length > 0 ? (
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label" style={{ marginBottom: '12px' }}>
                                            Latex Volume per Barrel (Liters) *
                                            <span style={{
                                                marginLeft: '8px',
                                                fontSize: '11px',
                                                color: '#dc2626',
                                                fontWeight: '600',
                                                backgroundColor: '#fee2e2',
                                                padding: '2px 6px',
                                                borderRadius: '3px'
                                            }}>Required</span>
                                        </label>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                            gap: '12px',
                                            padding: '16px',
                                            backgroundColor: '#fef3c7',
                                            borderRadius: '8px',
                                            border: '2px solid #fbbf24'
                                        }}>
                                            {intakeForm.barrelDetails.map((barrel, index) => (
                                                <div key={index} style={{
                                                    padding: '12px',
                                                    backgroundColor: '#ffffff',
                                                    borderRadius: '6px',
                                                    border: '1px solid #fde68a'
                                                }}>
                                                    <label style={{
                                                        fontSize: '12px',
                                                        color: '#92400e',
                                                        fontWeight: '600',
                                                        marginBottom: '6px',
                                                        display: 'block'
                                                    }}>
                                                        Barrel {barrel.barrelNumber || index + 1} (DRC: {barrel.drc}%)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        value={intakeForm.barrelVolumes[index] || ''}
                                                        onChange={(e) => handleBarrelVolumeChange(index, e.target.value)}
                                                        placeholder="Enter liters (max 300)"
                                                        min="0"
                                                        max="300"
                                                        step="0.01"
                                                        required
                                                        style={{
                                                            width: '100%',
                                                            padding: '8px',
                                                            fontSize: '14px',
                                                            border: '2px solid #fbbf24',
                                                            borderRadius: '4px'
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <small style={{ 
                                            color: '#92400e', 
                                            fontSize: 12, 
                                            marginTop: 8, 
                                            display: 'block',
                                            fontWeight: '600'
                                        }}>
                                            ℹ️ Total Volume: {intakeForm.totalKg || 0} liters (Max 300 liters per barrel)
                                        </small>
                                    </div>
                                ) : (
                                    <div className="form-group">
                                        <label className="form-label">Latex Volume (Liters)</label>
                                        <input
                                            type="number"
                                            name="totalKg"
                                            className="form-input"
                                            value={intakeForm.totalKg}
                                            onChange={handleInputChange}
                                            placeholder="Enter latex volume"
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">
                                        Dry Rubber (KG) 
                                        <span style={{
                                            marginLeft: '8px',
                                            fontSize: '11px',
                                            color: '#059669',
                                            fontWeight: '600',
                                            backgroundColor: '#d1fae5',
                                            padding: '2px 6px',
                                            borderRadius: '3px'
                                        }}>Auto-calculated</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="dryKg"
                                        className="form-input calculated-field"
                                        value={intakeForm.dryKg && parseFloat(intakeForm.dryKg) > 0 ? `${parseFloat(intakeForm.dryKg).toFixed(2)} kg` : ''}
                                        readOnly
                                        placeholder="Will calculate automatically"
                                        style={{
                                            backgroundColor: '#f0fdf4',
                                            color: '#059669',
                                            fontWeight: '600',
                                            cursor: 'not-allowed'
                                        }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Market Rate (₹/100KG)
                                        {approvedCompanyRate && (
                                            <span style={{
                                                marginLeft: '8px',
                                                fontSize: '11px',
                                                color: '#059669',
                                                fontWeight: '600',
                                                backgroundColor: '#d1fae5',
                                                padding: '2px 6px',
                                                borderRadius: '3px'
                                            }}>Auto-filled</span>
                                        )}
                                    </label>
                                    <input
                                        type="number"
                                        name="marketRate"
                                        className="form-input"
                                        value={intakeForm.marketRate}
                                        onChange={handleInputChange}
                                        placeholder={loadingRate ? "Loading approved rate..." : "Enter market rate (max ₹50,000)"}
                                        min="0"
                                        max="50000"
                                        step="0.01"
                                        required
                                        style={{
                                            backgroundColor: approvedCompanyRate ? '#f0fdf4' : '#ffffff',
                                            color: approvedCompanyRate ? '#059669' : '#000000',
                                            fontWeight: approvedCompanyRate ? '600' : 'normal',
                                            border: approvedCompanyRate ? '2px solid #86efac' : '1px solid #d1d5db'
                                        }}
                                    />
                                    {approvedCompanyRate && (
                                        <small style={{ color: '#059669', fontSize: 12, marginTop: 4, display: 'block' }}>
                                            ✓ Using admin-approved company rate (editable, max ₹50,000)
                                        </small>
                                    )}
                                    {!approvedCompanyRate && !loadingRate && (
                                        <small style={{ color: '#92400e', fontSize: 12, marginTop: 4, display: 'block' }}>
                                            ℹ️ No approved rate available. Please enter manually (max ₹50,000 per 100KG)
                                        </small>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Amount (₹)</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        className="form-input calculated-field"
                                        value={intakeForm.amount}
                                        readOnly
                                        placeholder="Auto-calculated"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="intake-modal-footer">
                            <button 
                                type="button" 
                                className="calculate-btn-modal"
                                onClick={handleCalculate}
                            >
                                Calculate
                            </button>
                            <button 
                                type="button" 
                                className="generate-bill-btn"
                                onClick={handleAddIntake}
                            >
                                Generate Bill
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bill Print Modal */}
            {showBillModal && selectedBill && (
                <div className="modal-overlay" onClick={(e) => {
                    if (e.target.className === 'modal-overlay') {
                        setShowBillModal(false);
                    }
                }}>
                    <div className="bill-modal">
                        <div className="bill-content" id="printable-bill">
                            {/* Company Header */}
                            <div className="bill-header">
                                <h1 className="company-name">HOLY FAMILY POLYMERS</h1>
                                <p className="company-location">Koorppada, Kottayam</p>
                                <div className="bill-divider"></div>
                            </div>

                            {/* Bill Info */}
                            <div className="bill-info-section">
                                <div className="bill-info-row">
                                    <div className="bill-info-item">
                                        <span className="bill-label">Name:</span>
                                        <span className="bill-value">{selectedBill.buyer}</span>
                                    </div>
                                    <div className="bill-info-item">
                                        <span className="bill-label">Date:</span>
                                        <span className="bill-value">{new Date(selectedBill.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                </div>
                                <div className="bill-info-row">
                                    <div className="bill-info-item">
                                        <span className="bill-label">Phone:</span>
                                        <span className="bill-value">{selectedBill.phone}</span>
                                    </div>
                                    <div className="bill-info-item">
                                        <span className="bill-label">Total Barrels:</span>
                                        <span className="bill-value">{selectedBill.barrels}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bill Table */}
                            <table className="bill-table">
                                <thead>
                                    <tr>
                                        <th>SI No.</th>
                                        <th>Qty (Liters)</th>
                                        <th>DRC %</th>
                                        <th>Company Rate (₹/100KG)</th>
                                        <th>Total (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: selectedBill.barrels }, (_, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{(selectedBill.totalKg / selectedBill.barrels).toFixed(2)}</td>
                                            <td>{selectedBill.drcPercent}%</td>
                                            <td>₹{selectedBill.marketRate}</td>
                                            <td>₹{(selectedBill.amount / selectedBill.barrels).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bill-total-row">
                                        <td colSpan="4" className="bill-total-label">Total Payment Amount:</td>
                                        <td className="bill-total-amount">₹{selectedBill.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                    </tr>
                                </tfoot>
                            </table>

                            {/* Verification Section */}
                            <div className="bill-verification">
                                <div className="verification-box">
                                    <p className="verification-label">Verified By:</p>
                                    <div className="signature-line"></div>
                                    <p className="verification-sublabel">Accountant Signature</p>
                                </div>
                                <div className="verification-box">
                                    <p className="verification-label">Approved By:</p>
                                    <div className="signature-line"></div>
                                    <p className="verification-sublabel">Manager Signature</p>
                                </div>
                            </div>

                            {/* Bill Footer */}
                            <div className="bill-footer">
                                <p>Sample ID: {selectedBill.sampleId || 'N/A'}</p>
                                <p>Lab Staff: {selectedBill.labStaff || 'N/A'}</p>
                                <p className="bill-note">This is a computer-generated bill</p>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="bill-modal-actions no-print">
                            <button 
                                className="bill-close-btn"
                                onClick={() => {
                                    // Add the delivery to the list when closing the bill
                                    if (selectedBill && !deliveries.find(d => d.id === selectedBill.id)) {
                                        setDeliveries(prev => [selectedBill, ...prev]);
                                    }
                                    
                                    // Reset form
                                    setIntakeForm({
                                        date: new Date().toISOString().slice(0, 10),
                                        buyer: '',
                                        phone: '',
                                        barrels: '',
                                        drcPercent: '',
                                        totalKg: '',
                                        dryKg: '',
                                        marketRate: '',
                                        amount: '',
                                        perBarrel: ''
                                    });
                                    
                                    setShowBillModal(false);
                                    setSuccess('Bill generated successfully!');
                                    setTimeout(() => setSuccess(''), 3000);
                                }}
                            >
                                Close
                            </button>
                            <button 
                                className="bill-print-btn"
                                onClick={handlePrintBill}
                            >
                                Print Bill
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountantDeliveryIntake;