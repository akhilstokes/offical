import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';

const LabCheckIn = () => {
  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const { user } = useAuth();
  
  // Form state
  const [form, setForm] = useState({ 
    sampleId: '', 
    customerName: '', 
    receivedAt: '', 
    notes: '', 
    barrelCount: 0
  });
  
  // Single measurement state - applies to all barrels
  const [measurements, setMeasurements] = useState({
    drc: { w1: '', w2: '', value: '0.00' },
    tsc: { w1: '', w2: '', value: '0.00' },
    ph: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [validation, setValidation] = useState({});
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const navigate = useNavigate();

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Calculate DRC and TSC values
  const calculateValues = () => {
    const drcW1 = parseFloat(measurements.drc.w1) || 0;
    const drcW2 = parseFloat(measurements.drc.w2) || 0;
    const tscW1 = parseFloat(measurements.tsc.w1) || 0;
    const tscW2 = parseFloat(measurements.tsc.w2) || 0;
    
    let drcValue = 0;
    let tscValue = 0;
    
    if (drcW2 > 0) {
      drcValue = (drcW1 / drcW2) * 100;
    }
    
    if (tscW2 > 0) {
      tscValue = (tscW1 / tscW2) * 100;
    }
    
    return {
      drc: drcValue.toFixed(2),
      tsc: tscValue.toFixed(2)
    };
  };

  // Update measurement field
  const onMeasurementChange = (section, field, value) => {
    setMeasurements(prev => {
      const updated = { ...prev };
      
      if (section === 'ph') {
        updated.ph = value;
      } else {
        // Update the field
        updated[section] = {
          ...updated[section],
          [field]: value
        };
        
        // Recalculate
        const calculated = calculateValues();
        updated[section].value = calculated[section];
      }
      
      return updated;
    });
    
    // Clear validation error
    if (validation[`${section}_${field}`]) {
      setValidation(v => ({ ...v, [`${section}_${field}`]: undefined }));
    }
  };

  // Validation function
  const validateForm = () => {
    const v = {};
    
    // Basic validations
    if (!form.customerName?.trim()) v.customerName = 'Customer name is required';
    if (!form.barrelCount || form.barrelCount <= 0) v.barrelCount = 'Barrel count must be greater than 0';
    
    // Only validate measurements if barrel count > 0
    if (form.barrelCount > 0) {
      // DRC validations
      const drcW1 = parseFloat(measurements.drc.w1);
      const drcW2 = parseFloat(measurements.drc.w2);
      
      if (!measurements.drc.w1 || isNaN(drcW1) || drcW1 <= 0) {
        v.drc_w1 = 'W1_DRC must be a positive number';
      }
      
      if (!measurements.drc.w2 || isNaN(drcW2) || drcW2 <= 0) {
        v.drc_w2 = 'W2_DRC must be a positive number';
      } else if (drcW2 === 0) {
        v.drc_w2 = 'W2_DRC cannot be zero';
      }
      
      if (drcW1 > 0 && drcW2 > 0 && drcW1 > drcW2) {
        v.drc_w1 = 'W1_DRC must be ≤ W2_DRC';
      }
      
      // TSC validations
      const tscW1 = parseFloat(measurements.tsc.w1);
      const tscW2 = parseFloat(measurements.tsc.w2);
      
      if (!measurements.tsc.w1 || isNaN(tscW1) || tscW1 <= 0) {
        v.tsc_w1 = 'W1_TSC must be a positive number';
      }
      
      if (!measurements.tsc.w2 || isNaN(tscW2) || tscW2 <= 0) {
        v.tsc_w2 = 'W2_TSC must be a positive number';
      } else if (tscW2 === 0) {
        v.tsc_w2 = 'W2_TSC cannot be zero';
      }
      
      if (tscW1 > 0 && tscW2 > 0 && tscW1 > tscW2) {
        v.tsc_w1 = 'W1_TSC must be ≤ W2_TSC';
      }
      
      // Scientific validation: TSC >= DRC
      const calculated = calculateValues();
      const drcValue = parseFloat(calculated.drc);
      const tscValue = parseFloat(calculated.tsc);
      
      if (tscValue < drcValue) {
        v.tsc_validation = 'Invalid measurement: TSC cannot be less than DRC';
      }
      
      // pH validation
      const ph = parseFloat(measurements.ph);
      if (!measurements.ph || isNaN(ph)) {
        v.ph = 'pH is required';
      } else if (ph < 0 || ph > 14) {
        v.ph = 'pH must be between 0 and 14';
      }
    }
    
    return v;
  };

  // Prefill from URL params
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sampleId = params.get('sampleId');
      const customerName = params.get('customerName');
      const barrelCount = params.get('barrelCount');
      const receivedAt = params.get('receivedAt');
      
      const patch = {};
      if (sampleId && sampleId.trim()) patch.sampleId = sampleId.trim();
      if (customerName && customerName.trim()) patch.customerName = customerName.trim();
      if (barrelCount != null) {
        const count = Number(barrelCount) || 0;
        patch.barrelCount = count;
      }
      
      if (receivedAt) {
        patch.receivedAt = receivedAt;
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        patch.receivedAt = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
      
      if (Object.keys(patch).length) setForm(f => ({ ...f, ...patch }));
    } catch (err) { 
      console.error('Error parsing URL params:', err);
    }
  }, []);

  // Load check-in history
  useEffect(() => {
    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const localCheckins = JSON.parse(localStorage.getItem('lab_checkins') || '[]');
        setHistory(localCheckins);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [base, token]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); 
    setError(''); 
    setValidation({});
    
    // Validate form
    const v = validateForm();
    if (Object.keys(v).length) { 
      setValidation(v); 
      setError('Please fix the validation errors before submitting');
      return; 
    }
    
    try {
      setLoading(true);
      
      // Prepare barrel data - same measurements for all barrels
      const drcW1 = parseFloat(measurements.drc.w1);
      const drcW2 = parseFloat(measurements.drc.w2);
      const tscW1 = parseFloat(measurements.tsc.w1);
      const tscW2 = parseFloat(measurements.tsc.w2);
      const ph = parseFloat(measurements.ph);
      
      // Calculate values
      const drcValue = (drcW1 / drcW2) * 100;
      const tscValue = (tscW1 / tscW2) * 100;
      
      // Create barrel data array with same measurements for each barrel
      const barrelsData = Array.from({ length: form.barrelCount }, (_, idx) => ({
        barrelNumber: idx + 1,
        drc: {
          w1: drcW1,
          w2: drcW2,
          value: Number(drcValue.toFixed(2))
        },
        tsc: {
          w1: tscW1,
          w2: tscW2,
          value: Number(tscValue.toFixed(2))
        },
        ph: ph
      }));
      
      // Prepare check-in data
      const checkInData = {
        sampleId: form.sampleId || `SAMPLE-${Date.now()}`,
        customerName: form.customerName,
        receivedAt: form.receivedAt,
        notes: form.notes,
        barrels: barrelsData,
        checkedInAt: new Date().toISOString(),
        labStaff: user?.name || 'Lab Staff'
      };
      
      console.log('Sample Check-In Data:', checkInData);
      
      // Update the intake status in database if sampleId exists
      if (form.sampleId && form.sampleId.match(/^[a-fA-F0-9]{24}$/)) {
        try {
          const updateResponse = await fetch(`${base}/api/delivery/barrels/intake/${form.sampleId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: 'checked_in' })
          });
          
          if (updateResponse.ok) {
            console.log('✅ Intake status updated to checked_in in database');
          } else {
            console.warn('⚠️ Failed to update intake status in database');
          }
        } catch (updateError) {
          console.warn('⚠️ Error updating intake status:', updateError);
        }
      }
      
      // Store in localStorage as backup
      const existingCheckins = JSON.parse(localStorage.getItem('lab_checkins') || '[]');
      existingCheckins.unshift(checkInData);
      if (existingCheckins.length > 10) existingCheckins.pop();
      localStorage.setItem('lab_checkins', JSON.stringify(existingCheckins));
      
      // Store for accountant
      const accountantPending = JSON.parse(localStorage.getItem('accountant_pending_samples') || '[]');
      accountantPending.unshift({
        ...checkInData,
        status: 'pending_billing'
      });
      localStorage.setItem('accountant_pending_samples', JSON.stringify(accountantPending));
      
      // Send notification to accountant
      try {
        await fetch(`${base}/api/notifications/staff-trip-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            title: 'Sample Check-In Completed',
            message: `Sample ${checkInData.sampleId} from ${checkInData.customerName} - ${barrelsData.length} barrel(s) checked in`,
            link: '/accountant/latex-verify',
            meta: checkInData,
            targetRole: 'accountant'
          })
        });
      } catch (notifError) {
        console.warn('Failed to send notification:', notifError);
      }
      
      setMessage('Sample checked in successfully! Redirecting to dashboard...');
      setForm({ 
        sampleId: '', 
        customerName: '', 
        receivedAt: '', 
        notes: '', 
        barrelCount: 0
      });
      setMeasurements({
        drc: { w1: '', w2: '', value: '0.00' },
        tsc: { w1: '', w2: '', value: '0.00' },
        ph: ''
      });
      
      setHistory(existingCheckins);
      
      // Inform dashboard to refresh incoming counts
      try {
        localStorage.setItem('labCheckInUpdated', 'true');
      } catch (e) {
        // ignore storage errors
      }

      setTimeout(() => {
        navigate(`/lab/dashboard`);
      }, 1500);
    } catch (e2) {
      setError(e2?.message || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = useMemo(() => {
    if (loading) return false;
    const v = validateForm();
    return Object.keys(v).length === 0;
  }, [loading, form, measurements]);

  const loadImageAsDataUrl = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to load image');
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const generateReport = async (item) => {
    const reportDate = item.receivedAt ? new Date(item.receivedAt) : new Date(item.createdAt);
    const doc = new jsPDF();
    
    const primaryColor = [59, 130, 246];
    const secondaryColor = [71, 85, 105];
    
    let yPos = 20;
    
    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 35, 'F');

    // Logo (optional)
    try {
      const logoData = await loadImageAsDataUrl('/images/logo.png');
      if (logoData) {
        doc.addImage(logoData, 'PNG', 12, 7, 28, 20);
      }
    } catch (e) {
      // Logo is optional; ignore failures
      console.warn('Could not load logo for report', e);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('LAB TESTING REPORT', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Generated: ${new Date().toLocaleString('en-IN')}`, 105, 28, { align: 'center' });
    
    yPos = 50;
    
    // Sample Information
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SAMPLE INFORMATION', 20, yPos);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, 190, yPos + 2);
    
    yPos += 12;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    
    doc.text('Sample ID:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(item.sampleId || 'N/A', 70, yPos);
    
    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Name:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(item.customerName || 'N/A', 70, yPos);
    
    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Received Date:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(reportDate.toLocaleDateString('en-IN'), 70, yPos);
    
    yPos += 18;
    
    // Barrel Summary
    const barrelCount = item.barrels?.length || 0;
    const firstBarrel = item.barrels?.[0] || {};
    const sampleDrc = firstBarrel.drc?.value || firstBarrel.drc || 'N/A';
    const sampleTsc = firstBarrel.tsc?.value || firstBarrel.tsc || 'N/A';
    const samplePh = firstBarrel.ph || 'N/A';

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('BARREL SUMMARY', 20, yPos);
    doc.line(20, yPos + 2, 190, yPos + 2);

    yPos += 10;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(10);

    doc.setFont('helvetica', 'bold');
    doc.text('Number of Barrels:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${barrelCount}`, 70, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('DRC:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${sampleDrc !== 'N/A' ? Number(sampleDrc).toFixed(2) : 'N/A'}%`, 45, yPos);

    doc.setFont('helvetica', 'bold');
    doc.text('TSC:', 90, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${sampleTsc !== 'N/A' ? Number(sampleTsc).toFixed(2) : 'N/A'}%`, 115, yPos);

    doc.setFont('helvetica', 'bold');
    doc.text('pH:', 155, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${samplePh}`, 170, yPos);
    
    // Footer
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 277, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Holy Family Polymers - Laboratory Department', 105, 287, { align: 'center' });
    
    const fileName = `Lab_Report_${item.sampleId || 'Sample'}_${reportDate.toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="dash-card" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Sample Check-In</h3>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Basic Information */}
        <div style={{ 
          padding: 16, 
          backgroundColor: '#f8fafc', 
          borderRadius: 8, 
          border: '1px solid #e2e8f0' 
        }}>
          <h4 style={{ marginTop: 0, marginBottom: 12, color: '#1e293b' }}>Basic Information</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <label>
              Customer Name <span style={{ color: '#ef4444' }}>*</span>
              <input 
                name="customerName" 
                placeholder="Buyer/Customer name" 
                value={form.customerName} 
                onChange={onChange}
                style={{ borderColor: validation.customerName ? '#ef4444' : undefined }}
              />
              {validation.customerName && (
                <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {validation.customerName}
                </span>
              )}
            </label>
            
            <label>
              Received At
              <input 
                type="datetime-local" 
                name="receivedAt" 
                value={form.receivedAt} 
                onChange={onChange} 
              />
            </label>
            
            <label>
              Number of Barrels <span style={{ color: '#ef4444' }}>*</span>
              <input 
                type="number" 
                name="barrelCount" 
                placeholder="Enter number of barrels" 
                value={form.barrelCount} 
                onChange={onChange}
                min="0"
                step="1"
              />
            </label>
          </div>
        </div>

        {/* Single Measurement Section - Applies to all barrels */}
        {form.barrelCount > 0 && (
        <div style={{ 
          padding: 20, 
          backgroundColor: '#fef3c7', 
          borderRadius: 12, 
          border: '3px solid #f59e0b',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            marginTop: 0, 
            marginBottom: 16, 
            color: '#92400e',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🧪 Barrel Measurements
          </h3>
              
              {/* DRC SECTION */}
              <div style={{ 
                padding: 16, 
                backgroundColor: '#dbeafe', 
                borderRadius: 8, 
                border: '2px solid #3b82f6',
                marginBottom: 16
              }}>
                <h4 style={{ marginTop: 0, marginBottom: 8, color: '#1e40af', fontSize: '16px' }}>
                  📊 DRC Calculation (Dry Rubber Content)
                </h4>
                <p style={{ fontSize: '13px', color: '#1e40af', marginBottom: 12, fontStyle: 'italic' }}>
                  Formula: DRC (%) = (W1_DRC / W2_DRC) × 100
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <label>
                    W1_DRC - Weight of Dry Rubber (g) <span style={{ color: '#ef4444' }}>*</span>
                    <input 
                      type="number" 
                      placeholder="Enter W1_DRC" 
                      value={measurements.drc.w1} 
                      onChange={(e) => onMeasurementChange('drc', 'w1', e.target.value)}
                      min="0"
                      step="0.01"
                      style={{ borderColor: validation.drc_w1 ? '#ef4444' : undefined }}
                    />
                    {validation.drc_w1 && (
                      <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        {validation.drc_w1}
                      </span>
                    )}
                  </label>
                  
                  <label>
                    W2_DRC - Weight of Original Latex Sample (g) <span style={{ color: '#ef4444' }}>*</span>
                    <input 
                      type="number" 
                      placeholder="Enter W2_DRC" 
                      value={measurements.drc.w2} 
                      onChange={(e) => onMeasurementChange('drc', 'w2', e.target.value)}
                      min="0"
                      step="0.01"
                      style={{ borderColor: validation.drc_w2 ? '#ef4444' : undefined }}
                    />
                    {validation.drc_w2 && (
                      <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        {validation.drc_w2}
                      </span>
                    )}
                  </label>
                  
                  <label>
                    DRC (%) - Calculated
                    <input 
                      type="text" 
                      value={measurements.drc.value} 
                      readOnly
                      style={{ 
                        backgroundColor: '#eff6ff', 
                        fontWeight: '700', 
                        color: '#1e40af',
                        cursor: 'not-allowed',
                        fontSize: '16px'
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* TSC SECTION */}
              <div style={{ 
                padding: 16, 
                backgroundColor: '#dcfce7', 
                borderRadius: 8, 
                border: '2px solid #10b981',
                marginBottom: 16
              }}>
                <h4 style={{ marginTop: 0, marginBottom: 8, color: '#166534', fontSize: '16px' }}>
                  📈 TSC Calculation (Total Solids Content)
                </h4>
                <p style={{ fontSize: '13px', color: '#166534', marginBottom: 12, fontStyle: 'italic' }}>
                  Formula: TSC (%) = (W1_TSC / W2_TSC) × 100
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <label>
                    W1_TSC - Weight of Total Dried Residue (g) <span style={{ color: '#ef4444' }}>*</span>
                    <input 
                      type="number" 
                      placeholder="Enter W1_TSC" 
                      value={measurements.tsc.w1} 
                      onChange={(e) => onMeasurementChange('tsc', 'w1', e.target.value)}
                      min="0"
                      step="0.01"
                      style={{ borderColor: validation.tsc_w1 ? '#ef4444' : undefined }}
                    />
                    {validation.tsc_w1 && (
                      <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        {validation.tsc_w1}
                      </span>
                    )}
                  </label>
                  
                  <label>
                    W2_TSC - Weight of Original Latex Sample (g) <span style={{ color: '#ef4444' }}>*</span>
                    <input 
                      type="number" 
                      placeholder="Enter W2_TSC" 
                      value={measurements.tsc.w2} 
                      onChange={(e) => onMeasurementChange('tsc', 'w2', e.target.value)}
                      min="0"
                      step="0.01"
                      style={{ borderColor: validation.tsc_w2 ? '#ef4444' : undefined }}
                    />
                    {validation.tsc_w2 && (
                      <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        {validation.tsc_w2}
                      </span>
                    )}
                  </label>
                  
                  <label>
                    TSC (%) - Calculated
                    <input 
                      type="text" 
                      value={measurements.tsc.value} 
                      readOnly
                      style={{ 
                        backgroundColor: '#f0fdf4', 
                        fontWeight: '700', 
                        color: '#166534',
                        cursor: 'not-allowed',
                        fontSize: '16px'
                      }}
                    />
                  </label>
                </div>
                
                {/* Scientific Validation Error */}
                {validation.tsc_validation && (
                  <div style={{ 
                    marginTop: 12, 
                    padding: 12, 
                    backgroundColor: '#fee2e2', 
                    border: '2px solid #ef4444',
                    borderRadius: 6,
                    color: '#991b1b',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    ⚠️ {validation.tsc_validation}
                  </div>
                )}
              </div>
              
              {/* pH SECTION */}
              <div style={{ 
                padding: 16, 
                backgroundColor: '#fef3c7', 
                borderRadius: 8, 
                border: '2px solid #f59e0b'
              }}>
                <h4 style={{ marginTop: 0, marginBottom: 8, color: '#92400e', fontSize: '16px' }}>
                  🧪 pH Measurement
                </h4>
                
                <div style={{ maxWidth: '300px' }}>
                  <label>
                    pH Value (0-14) <span style={{ color: '#ef4444' }}>*</span>
                    <input 
                      type="number" 
                      placeholder="Enter pH value" 
                      value={measurements.ph} 
                      onChange={(e) => onMeasurementChange('ph', null, e.target.value)}
                      min="0"
                      max="14"
                      step="0.1"
                      style={{ borderColor: validation.ph ? '#ef4444' : undefined }}
                    />
                    {validation.ph && (
                      <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        {validation.ph}
                      </span>
                    )}
                  </label>
                </div>
              </div>
            </div>
        )}

        {/* Additional Notes */}
        {form.barrelCount > 0 && (
          <div style={{ 
            padding: 16, 
            backgroundColor: '#f8fafc', 
            borderRadius: 8, 
            border: '1px solid #e2e8f0' 
          }}>
            <label>
              Additional Notes
              <textarea 
                name="notes" 
                placeholder="Optional notes about the sample" 
                value={form.notes} 
                onChange={onChange} 
                rows={3} 
              />
            </label>
          </div>
        )}

        {/* Submit Button */}
        {form.barrelCount > 0 && (
          <div>
            <button 
              className="btn primary" 
              type="submit" 
              disabled={!canSubmit}
              style={{ 
                opacity: canSubmit ? 1 : 0.5,
                cursor: canSubmit ? 'pointer' : 'not-allowed'
              }}
            >
              {loading ? 'Saving...' : 'Check In Sample'}
            </button>
            {!canSubmit && !loading && (
              <p style={{ fontSize: '13px', color: '#ef4444', marginTop: 8 }}>
                Please fill all required fields correctly to enable submission
              </p>
            )}
          </div>
        )}
      </form>

      {/* Check-In History */}
      <div style={{ marginTop: 32 }}>
        <h4 style={{ marginBottom: 12, color: '#1e293b' }}>Recent Check-Ins</h4>
        {loadingHistory ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>Loading history...</div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>No check-in history available</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="dashboard-table" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sample ID</th>
                  <th>Customer</th>
                  <th>Barrels</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.receivedAt ? new Date(item.receivedAt).toLocaleString('en-IN') : new Date(item.createdAt).toLocaleString('en-IN')}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        backgroundColor: '#f3e8ff',
                        color: '#7c3aed',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        {item.sampleId || '-'}
                      </span>
                    </td>
                    <td>{item.customerName || '-'}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: '4px',
                        fontWeight: '600'
                      }}>
                        {item.barrels?.length || 0}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => generateReport(item)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                          onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                        >
                          📄 Report
                        </button>
                        <button
                          onClick={() => {
                            // Store sample data for AI Process
                            localStorage.setItem('ai_process_sample_data', JSON.stringify(item));
                            navigate('/lab/ai-rubber-process');
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                          onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
                        >
                          🤖 More
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabCheckIn;
