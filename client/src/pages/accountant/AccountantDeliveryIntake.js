import React, { useState, useEffect } from 'react';
import { FiTruck, FiPackage, FiUser, FiPhone, FiCalendar, FiRefreshCw, FiPlus } from 'react-icons/fi';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';
import './AccountantDeliveryIntake.css';

const AccountantDeliveryIntake = () => {
    const [loading, setLoading] = useState(false);
    const [deliveries, setDeliveries] = useState([]);
    const [showAddIntakeModal, setShowAddIntakeModal] = useState(false);
    const [showBillModal, setShowBillModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [userBankDetails, setUserBankDetails] = useState(null);
    const [selectedBill, setSelectedBill] = useState(null);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
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
        perBarrel: '',
        paymentMethod: 'Bank Transfer'
    });

    // Admin-approved company rate
    const [approvedCompanyRate, setApprovedCompanyRate] = useState(null);
    const [loadingRate, setLoadingRate] = useState(false);



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
            const transformedDeliveries = labPendingSamples.map((sample, index) => {
                // Use DRC from first barrel only (no need to check all barrels)
                let drcValue = 0;
                if (sample.barrels && sample.barrels.length > 0) {
                    // Get DRC from first barrel
                    drcValue = sample.barrels[0].drc?.value || 0;
                } else if (sample.drc) {
                    // Fallback to old single DRC value if exists
                    drcValue = sample.drc;
                }

                return {
                    id: `lab-${index}`,
                    date: sample.receivedAt ? new Date(sample.receivedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
                    buyer: sample.customerName || 'N/A',
                    phone: sample.phone || '-',
                    barrels: sample.barrelCount || sample.barrels?.length || 0,
                    drcPercent: typeof drcValue === 'number' ? drcValue.toFixed(2) : drcValue, // DRC from first barrel
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
                };
            });

            setTimeout(() => {
                setDeliveries(transformedDeliveries);
                setLoading(false);
            }, 500);
        } catch (err) {
            console.error('Error fetching deliveries:', err);
            setDeliveries([]);
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
                paymentMethod: intakeForm.paymentMethod,
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

    const handleViewReceipt = async (billId) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/bills/${billId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.ok) {
                const data = await response.json();
                setSelectedReceipt(data.bill);
                setShowReceiptModal(true);
            }
        } catch (err) {
            console.error('❌ Error fetching receipt:', err);
            setError('Failed to load receipt details');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (delivery) => {
        try {
            setLoading(true);
            setSelectedBill(delivery);
            setError(''); // Clear previous errors

            // Fetch User Bank Details
            const token = localStorage.getItem('token');
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

            let user = null;

            // 1. Try fetching by userId if available
            if (delivery.userId && delivery.userId.match(/^[0-9a-fA-F]{24}$/)) {
                console.log('🔍 Fetching bank details by User ID:', delivery.userId);
                try {
                    const response = await fetch(`${API_URL}/api/users/${delivery.userId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        user = data.user;
                    }
                } catch (e) {
                    console.warn('⚠️ Failed to fetch by ID, falling back to phone:', e.message);
                }
            }

            // 2. Try fetching by phone if userId failed or not available
            if (!user && delivery.phone && delivery.phone !== '-' && delivery.phone !== 'N/A') {
                console.log('🔍 Fetching bank details by phone:', delivery.phone);
                try {
                    const response = await fetch(
                        `${API_URL}/api/users/find-by-phone?phone=${encodeURIComponent(delivery.phone)}`,
                        { headers: { 'Authorization': `Bearer ${token}` } }
                    );
                    if (response.ok) {
                        const data = await response.json();
                        user = data.user;
                    }
                } catch (e) {
                    console.warn('⚠️ Failed to fetch by phone:', e.message);
                }
            }

            if (user) {
                console.log('✅ Found user bank details:', user.name);
                setUserBankDetails({
                    accountHolderName: user.accountHolderName || user.name,
                    accountNumber: user.accountNumber || 'Not Provided',
                    ifscCode: user.ifscCode || 'Not Provided',
                    bankName: user.bankName || 'Not Provided',
                    branchName: user.branchName || 'Not Provided'
                });
            } else {
                console.log('⚠️ No bank details found for this user');
                setUserBankDetails(null);
            }

            setShowPaymentModal(true);
        } catch (err) {
            console.error('❌ Error in handlePayment:', err);
            setError('Failed to load bank details: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadBill = async () => {
        try {
            const element = document.getElementById('printable-bill');
            if (!element) return;

            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            const margin = 10;
            pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth - (margin * 2), pdfHeight - (margin * 2));
            pdf.save(`Bill_${selectedBill?.buyer || 'Receipt'}.pdf`);
        } catch (e) {
            console.error('Error generating PDF:', e);
        }
    };

    const processFinalPayment = async () => {
        if (!selectedBill) return;

        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

            // Ensure we have a bill ID - if it's a new delivery, it might only have .id (which is billId)
            const billId = selectedBill.billId || selectedBill.id || selectedBill._id;

            if (!billId) {
                throw new Error('Missing Bill ID. Please ensure the bill is correctly calculated and saved.');
            }

            console.log(`💸 Processing payment for bill: ${billId}`);

            const response = await fetch(
                `${API_URL}/api/bills/${billId}/approve-pay`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        managerNotes: 'Paid by Accountant (Immediate)',
                        paymentMethod: selectedBill.paymentMethod || 'Bank Transfer',
                        bankDetails: userBankDetails || {}
                    })
                }
            );

            // Handle non-JSON responses (like HTML error pages)
            const contentType = response.headers.get("content-type");
            if (!response.ok) {
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Payment failed');
                } else {
                    const errorText = await response.text();
                    console.error('❌ Server returned non-JSON error:', errorText.substring(0, 100));
                    throw new Error(`Server error (${response.status}). Please check if the bill ID is valid.`);
                }
            }

            if (contentType && contentType.indexOf("application/json") !== -1) {
                const result = await response.json();
                console.log('✅ Payment result:', result);

                setSuccess(`✅ Payment processed successfully for ${selectedBill.buyer}!`);

                // Show success message for a bit then close
                setTimeout(() => {
                    setSuccess('');
                    setShowPaymentModal(false);
                    setUserBankDetails(null);
                    // Refresh list to show updated status
                    fetchDeliveries();
                }, 2000);

            } else {
                throw new Error('Invalid response from server. Expected JSON but received something else.');
            }
        } catch (err) {
            console.error('❌ Payment error:', err);
            setError('Payment failed: ' + err.message);
            // Don't auto-clear error immediately so user can read it
            setTimeout(() => setError(''), 10000);
        } finally {
            setLoading(false);
        }
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
                                            <span className="sample-id-badge">
                                                {delivery.sampleId}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td><strong>{delivery.buyer}</strong></td>
                                    <td>{delivery.phone}</td>
                                    <td>
                                        <span className="barrel-badge">
                                            {delivery.barrels}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="drc-badge">
                                            {delivery.drcPercent}%
                                        </span>
                                    </td>
                                    <td>
                                        {delivery.labStaff ? (
                                            <span className="lab-staff-badge">
                                                {delivery.labStaff}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        {delivery.status === 'paid' ? (
                                            <span className="status-paid">✓ Paid</span>
                                        ) : delivery.status === 'verified' ? (
                                            <span className="verified-badge">✓ Verified</span>
                                        ) : delivery.status === 'calculated' ? (
                                            <span className="calculated-badge">✓ Calculated</span>
                                        ) : delivery.amount > 0 ? (
                                            <span className="calculated-badge">Calculated</span>
                                        ) : (
                                            <span className="status-pending">Pending</span>
                                        )}
                                    </td>
                                    <td>
                                        {delivery.status === 'paid' ? (
                                            <div className="action-cell">
                                                <button
                                                    className="action-btn view-bill-btn"
                                                    onClick={() => {
                                                        setSelectedBill(delivery);
                                                        setShowBillModal(true);
                                                    }}
                                                    title="View Bill"
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </svg>
                                                    Bill
                                                </button>
                                                <button
                                                    className="action-btn receipt-btn"
                                                    onClick={() => handleViewReceipt(delivery.billId)}
                                                    title="View Receipt"
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                        <polyline points="14 2 14 8 20 8"></polyline>
                                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                                    </svg>
                                                    Receipt
                                                </button>
                                            </div>
                                        ) : delivery.status === 'verified' || delivery.status === 'calculated' ? (
                                            <div className="action-cell">
                                                <button
                                                    className="action-btn view-bill-btn"
                                                    onClick={() => {
                                                        setSelectedBill(delivery);
                                                        setShowBillModal(true);
                                                    }}
                                                    title="View Bill"
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </svg>
                                                    Bill
                                                </button>
                                                {delivery.billId && (
                                                    <button
                                                        className="action-btn payment-btn"
                                                        onClick={() => handlePayment(delivery)}
                                                        title="Process Payment"
                                                    >
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                                                            <line x1="2" y1="10" x2="22" y2="10"></line>
                                                        </svg>
                                                        Pay
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                className="action-btn process-btn"
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
                                                        barrelVolumes: {},
                                                        totalKg: delivery.totalKg || '',
                                                        marketRate: delivery.marketRate || '',
                                                        sampleId: delivery.sampleId,
                                                        labStaff: delivery.labStaff
                                                    });
                                                }}
                                                title="Process Bill"
                                            >
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                                        <span style={{
                                            marginLeft: '8px',
                                            fontSize: '11px',
                                            color: '#059669',
                                            fontWeight: '600',
                                            backgroundColor: '#d1fae5',
                                            padding: '2px 6px',
                                            borderRadius: '3px'
                                        }}>FROM LAB</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="buyer"
                                        className="form-input readonly-field"
                                        value={intakeForm.buyer}
                                        readOnly
                                        style={{
                                            backgroundColor: '#f0fdf4',
                                            color: '#059669',
                                            fontWeight: '600',
                                            cursor: 'not-allowed',
                                            border: '2px solid #86efac'
                                        }}
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

                                {/* DRC % - Simple single field */}
                                <div className="form-group">
                                    <label className="form-label">
                                        DRC %
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
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={`${intakeForm.drcPercent}%`}
                                        readOnly
                                        style={{
                                            backgroundColor: '#f0fdf4',
                                            color: '#059669',
                                            fontWeight: '600',
                                            cursor: 'not-allowed',
                                            border: '2px solid #86efac'
                                        }}
                                    />
                                </div>

                                {/* Latex Volume - Simple single field */}
                                <div className="form-group">
                                    <label className="form-label">
                                        Latex Volume (Liters) *
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
                                    <input
                                        type="number"
                                        name="totalKg"
                                        className="form-input"
                                        value={intakeForm.totalKg}
                                        onChange={handleInputChange}
                                        placeholder="Enter total latex volume"
                                        min="0"
                                        step="0.01"
                                        required
                                        style={{
                                            border: '2px solid #fbbf24',
                                            backgroundColor: '#fffbeb'
                                        }}
                                    />
                                    <small style={{
                                        color: '#92400e',
                                        fontSize: 11,
                                        marginTop: 4,
                                        display: 'block'
                                    }}>
                                        Enter total latex volume for all {intakeForm.barrels} barrels
                                    </small>
                                </div>

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

                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Payment Method</label>
                                    <select
                                        name="paymentMethod"
                                        className="form-input"
                                        value={intakeForm.paymentMethod}
                                        onChange={handleInputChange}
                                        style={{
                                            border: '2px solid #8b5cf6',
                                            backgroundColor: '#f5f3ff',
                                            fontWeight: '600'
                                        }}
                                    >
                                        <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                                        <option value="UPI">UPI (Google Pay/PhonePe)</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Cheque">Cheque</option>
                                    </select>
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
                            {/* Professional Header with QR */}
                            <div className="bill-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
                                <div className="bill-header-left" style={{ textAlign: 'left' }}>
                                    <h1 className="company-name" style={{ fontSize: '1.8rem', fontWeight: '700', color: '#111827', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {selectedBill.companyName || 'HOLY FAMILY POLYMERS'}
                                    </h1>
                                    <p className="company-location" style={{ fontSize: '0.95rem', color: '#6b7280', margin: '4px 0' }}>
                                        {selectedBill.companyAddress || 'Koorppada, P.O. - 686 502'}
                                    </p>
                                    <p className="company-gst" style={{ fontSize: '0.85rem', color: '#6b7280', margin: '2px 0' }}>GST No: {selectedBill.companyGST || '32AAHFH5388M1ZX'}</p>
                                    <p className="company-contact" style={{ fontSize: '0.85rem', color: '#6b7280', margin: '2px 0' }}>Email: {selectedBill.companyEmail || 'info@holyfamilypolymers.com'}</p>
                                    <p className="company-phone" style={{ fontSize: '0.85rem', color: '#6b7280', margin: '2px 0' }}>Phone: {selectedBill.companyPhone || '+91 9876543210'}</p>
                                    <div className="bill-divider" style={{ height: '3px', background: '#3b82f6', width: '120px', margin: '16px 0' }}></div>
                                </div>
                                <div className="bill-header-right" style={{ textAlign: 'right' }}>
                                    <div className="bill-qr-container">
                                        <QRCodeCanvas
                                            value={`BILL:${selectedBill.id || selectedBill._id}`}
                                            size={80}
                                            level={"H"}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bill Info Grid */}
                            <div className="bill-info-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
                                <div className="bill-info-column" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div className="bill-info-item" style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center' }}>
                                        <span className="bill-label" style={{ fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>Name:</span>
                                        <span className="bill-value" style={{ color: '#111827', fontSize: '0.9rem' }}>{selectedBill.buyer}</span>
                                    </div>
                                    <div className="bill-info-item" style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center' }}>
                                        <span className="bill-label" style={{ fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>Phone:</span>
                                        <span className="bill-value" style={{ color: '#111827', fontSize: '0.9rem' }}>{selectedBill.phone}</span>
                                    </div>
                                </div>
                                <div className="bill-info-column" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div className="bill-info-item" style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center' }}>
                                        <span className="bill-label" style={{ fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>Date:</span>
                                        <span className="bill-value" style={{ color: '#111827', fontSize: '0.9rem' }}>{new Date(selectedBill.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                    <div className="bill-info-item" style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center' }}>
                                        <span className="bill-label" style={{ fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>Total Barrels:</span>
                                        <span className="bill-value" style={{ color: '#111827', fontSize: '0.9rem' }}>{selectedBill.barrels}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bill Table */}
                            <div className="bill-table-container" style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
                                <table className="bill-table" style={{ width: '100%', borderCollapse: 'collapse', background: '#ffffff' }}>
                                    <thead style={{ background: '#f8fafc' }}>
                                        <tr>
                                            <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: '700', color: '#4b5563', borderBottom: '1px solid #e5e7eb', fontSize: '0.8rem', textTransform: 'uppercase' }}>SI No.</th>
                                            <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: '700', color: '#4b5563', borderBottom: '1px solid #e5e7eb', fontSize: '0.8rem', textTransform: 'uppercase' }}>Qty (Liters)</th>
                                            <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: '700', color: '#4b5563', borderBottom: '1px solid #e5e7eb', fontSize: '0.8rem', textTransform: 'uppercase' }}>DRC %</th>
                                            <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: '700', color: '#4b5563', borderBottom: '1px solid #e5e7eb', fontSize: '0.8rem', textTransform: 'uppercase' }}>Company Rate (₹/100KG)</th>
                                            <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: '700', color: '#4b5563', borderBottom: '1px solid #e5e7eb', fontSize: '0.8rem', textTransform: 'uppercase' }}>Total (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: selectedBill.barrels }, (_, index) => (
                                            <tr key={index}>
                                                <td style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', color: '#1e293b', fontSize: '0.9rem' }}>{index + 1}</td>
                                                <td style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', color: '#1e293b', fontSize: '0.9rem' }}>{(selectedBill.totalKg / selectedBill.barrels).toFixed(2)}</td>
                                                <td style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', color: '#1e293b', fontSize: '0.9rem' }}>{selectedBill.drcPercent}%</td>
                                                <td style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', color: '#1e293b', fontSize: '0.9rem' }}>₹{selectedBill.marketRate}</td>
                                                <td style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', color: '#1e293b', fontSize: '0.9rem' }}>₹{(selectedBill.amount / selectedBill.barrels).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                                <div style={{ background: '#f8fafc', padding: '12px 20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                    <span style={{ fontWeight: '700', color: '#4b5563', marginRight: '12px' }}>Total Payment Amount:</span>
                                    <span style={{ fontWeight: '800', color: '#111827', fontSize: '1.1rem' }}>₹{selectedBill.amount?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0.00'}</span>
                                </div>
                            </div>

                            {/* Verification Section */}
                            <div className="bill-verification" style={{ display: 'flex', justifyContent: 'space-around', marginTop: '40px', textAlign: 'center' }}>
                                <div className="verification-box">
                                    <p className="verification-label" style={{ fontWeight: '600', color: '#374151', marginBottom: '40px' }}>Verified By:</p>
                                    {selectedBill.accountantSignature ? (
                                        <>
                                            {selectedBill.accountantSignatureUrl ? (
                                                <img
                                                    src={selectedBill.accountantSignatureUrl}
                                                    alt="Accountant Signature"
                                                    className="signature-image"
                                                    style={{ maxWidth: '120px', height: 'auto', marginBottom: '8px' }}
                                                />
                                            ) : (
                                                <div className="signature-text" style={{ fontSize: '1.2rem', fontFamily: 'cursive', color: '#1e3a8a', marginBottom: '8px' }}>{selectedBill.accountantSignature}</div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="signature-line" style={{ borderTop: '1px solid #d1d5db', width: '150px', margin: '0 auto 8px auto' }}></div>
                                    )}
                                    <p className="verification-sublabel" style={{ fontSize: '0.75rem', color: '#6b7280' }}>Accountant Signature</p>
                                </div>
                                <div className="verification-box">
                                    <p className="verification-label" style={{ fontWeight: '600', color: '#374151', marginBottom: '40px' }}>Approved By:</p>
                                    {selectedBill.managerSignature ? (
                                        <>
                                            {selectedBill.managerSignatureUrl ? (
                                                <img
                                                    src={selectedBill.managerSignatureUrl}
                                                    alt="Manager Signature"
                                                    className="signature-image"
                                                    style={{ maxWidth: '120px', height: 'auto', marginBottom: '8px' }}
                                                />
                                            ) : (
                                                <div className="signature-text" style={{ fontSize: '1.2rem', fontFamily: 'cursive', color: '#1e3a8a', marginBottom: '8px' }}>{selectedBill.managerSignature}</div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="signature-line" style={{ borderTop: '1px solid #d1d5db', width: '150px', margin: '0 auto 8px auto' }}></div>
                                    )}
                                    <p className="verification-sublabel" style={{ fontSize: '0.75rem', color: '#6b7280' }}>Manager Signature</p>
                                </div>
                            </div>

                            {/* Bill Footer */}
                            <div className="bill-footer" style={{ marginTop: '40px', textAlign: 'center', borderTop: '1px solid #f3f4f6', paddingTop: '20px' }}>
                                <p style={{ margin: '4px 0', color: '#6b7280', fontSize: '0.85rem' }}>Sample ID: {selectedBill.sampleId || 'N/A'}</p>
                                <p style={{ margin: '4px 0', color: '#6b7280', fontSize: '0.85rem' }}>Lab Staff: {selectedBill.labStaff || 'N/A'}</p>
                                <p className="bill-note" style={{ fontStyle: 'italic', color: '#9ca3af', fontSize: '0.8rem', marginTop: '12px' }}>This is a computer-generated bill</p>
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
                                        perBarrel: '',
                                        paymentMethod: 'Bank Transfer'
                                    });

                                    setShowBillModal(false);
                                    setSuccess('Bill generated successfully!');
                                    setTimeout(() => setSuccess(''), 3000);
                                }}
                            >
                                Close
                            </button>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="bill-print-btn"
                                    onClick={handlePrintBill}
                                    style={{ background: '#f3f4f6', color: '#374151', padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Print Bill
                                </button>
                                <button
                                    className="bill-print-btn"
                                    onClick={handleDownloadBill}
                                    style={{ background: '#3b82f6', color: '#ffffff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                    <i className="fas fa-file-pdf" style={{ marginRight: '6px' }}></i>
                                    Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Confirmation Modal */}
            {showPaymentModal && selectedBill && (
                <div className="modal-overlay">
                    <div className="payment-modal" style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '12px',
                        maxWidth: '500px',
                        width: '90%',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #f3f4f6', paddingBottom: '12px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>Confirm Payment</h2>
                            <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#9ca3af' }}>×</button>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <p style={{ margin: 0, color: '#92400e', fontSize: '14px', fontWeight: '600' }}>
                                    Please verify banking details before processing the payment of <strong>₹{selectedBill.amount}</strong>.
                                </p>
                            </div>

                            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Beneficiary Banking Details</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b', fontSize: '14px' }}>Account Holder:</span>
                                    <span style={{ color: '#1e293b', fontWeight: '600', fontSize: '14px' }}>{userBankDetails?.accountHolderName || 'Not Set'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b', fontSize: '14px' }}>Account Number:</span>
                                    <span style={{ color: '#1e293b', fontWeight: '600', fontSize: '14px', letterSpacing: '0.05em' }}>{userBankDetails?.accountNumber || 'Not Set'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b', fontSize: '14px' }}>IFSC Code:</span>
                                    <span style={{ color: '#1e293b', fontWeight: '600', fontSize: '14px', letterSpacing: '0.05em' }}>{userBankDetails?.ifscCode || 'Not Set'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b', fontSize: '14px' }}>Bank Name:</span>
                                    <span style={{ color: '#1e293b', fontWeight: '600', fontSize: '14px' }}>{userBankDetails?.bankName || 'Not Set'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b', fontSize: '14px' }}>Payment Method:</span>
                                    <span style={{ color: '#8b5cf6', fontWeight: '700', fontSize: '14px' }}>{selectedBill.paymentMethod}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    backgroundColor: 'white',
                                    color: '#374151',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={processFinalPayment}
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#8b5cf6',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading ? 'Processing...' : 'Confirm & Pay'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {showReceiptModal && selectedReceipt && (
                <div className="modal-overlay">
                    <div className="receipt-modal" style={{
                        backgroundColor: 'white',
                        padding: '32px',
                        borderRadius: '16px',
                        maxWidth: '550px',
                        width: '90%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        position: 'relative'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                backgroundColor: '#dcfce7',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px auto'
                            }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', margin: '0 0 4px 0' }}>Payment Successful</h2>
                            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Transaction Reference: {selectedReceipt.paymentReference}</p>
                        </div>

                        <div style={{ borderTop: '1px dashed #e2e8f0', borderBottom: '1px dashed #e2e8f0', padding: '20px 0', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ color: '#64748b' }}>Amount Paid</span>
                                <span style={{ fontWeight: '700', color: '#111827', fontSize: '18px' }}>₹{selectedReceipt.totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ color: '#64748b' }}>Date & Time</span>
                                <span style={{ fontWeight: '600', color: '#111827' }}>{new Date(selectedReceipt.paymentDate).toLocaleString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ color: '#64748b' }}>Payment Method</span>
                                <span style={{ fontWeight: '600', color: '#111827' }}>{selectedReceipt.paymentMethod}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Paid To</span>
                                <span style={{ fontWeight: '600', color: '#111827' }}>{selectedReceipt.customerName}</span>
                            </div>
                        </div>

                        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Bank Details</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#64748b', fontSize: '13px' }}>Bank Name</span>
                                <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>{selectedReceipt.paymentBankName || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#64748b', fontSize: '13px' }}>Account Number</span>
                                <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>{selectedReceipt.paymentAccountNumber || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: '13px' }}>IFSC Code</span>
                                <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>{selectedReceipt.paymentIfscCode || 'N/A'}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowReceiptModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    backgroundColor: 'white',
                                    color: '#374151',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                            <button
                                onClick={() => window.print()}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#059669',
                                    color: 'white',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountantDeliveryIntake;