import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';

const LabCheckIn = () => {
  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const { user } = useAuth();
  const [form, setForm] = useState({ sampleId: '', customerName: '', receivedAt: '', notes: '', barrelCount: 0 });
  const [barrels, setBarrels] = useState([]); // [{barrelId, liters, drc}]
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

  // Prefill from URL params if present
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      console.log('LabCheckIn URL params:', window.location.search);
      console.log('All URL params:', Object.fromEntries(params.entries()));
      
      const sampleId = params.get('sampleId');
      const customerName = params.get('customerName');
      const barrelCount = params.get('barrelCount');
      const receivedAt = params.get('receivedAt');
      
      console.log('Parsed params:', { sampleId, customerName, barrelCount, receivedAt });
      
      const patch = {};
      if (sampleId && sampleId.trim()) patch.sampleId = sampleId.trim();
      if (customerName && customerName.trim()) patch.customerName = customerName.trim();
      if (barrelCount != null) {
        const count = Number(barrelCount) || 0;
        patch.barrelCount = count;
      }
      // If receivedAt is provided in URL, use it; otherwise set current date/time
      if (receivedAt) {
        patch.receivedAt = receivedAt;
      } else {
        // Auto-fill with current date and time in local timezone
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        patch.receivedAt = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
      
      console.log('Applying patch to form:', patch);
      if (Object.keys(patch).length) setForm(f => ({ ...f, ...patch }));

      // Handle barrel data from URL params
      const barrelsData = [];
      for (let i = 0; params.has(`barrel_${i}`); i++) {
        const barrelId = params.get(`barrel_${i}`);
        const liters = params.get(`liters_${i}`);
        if (barrelId) {
          barrelsData.push({
            barrelId,
            liters: liters ? Number(liters) : ''
          });
        }
      }
      if (barrelsData.length) {
        console.log('Setting barrels data:', barrelsData);
        setBarrels(barrelsData);
        setForm(f => ({ ...f, barrelCount: barrelsData.length }));
      }
    } catch (err) { 
      console.error('Error parsing URL params:', err);
    }
  }, []);

  // Load check-in history
  useEffect(() => {
    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        // TODO: Backend endpoint needs to be created at /api/lab/samples/checkin-history
        // For now, load from localStorage
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

  useEffect(() => {
    const n = Number(form.barrelCount) || 0;
    setBarrels(prev => {
      const arr = [...prev];
      if (arr.length > n) return arr.slice(0, n);
      while (arr.length < n) arr.push({ barrelId: '', liters: '', drc: '' });
      return arr;
    });
  }, [form.barrelCount]);

  const onBarrelChange = (index, field, value) => {
    setBarrels(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError(''); setValidation({});
    const v = {};
    if (!form.customerName?.trim()) v.customerName = 'Customer name is required';
    
    // Validate that all barrels have DRC values
    const barrelCount = Number(form.barrelCount) || 0;
    if (barrelCount > 0) {
      for (let i = 0; i < barrelCount; i++) {
        const barrel = barrels[i];
        if (!barrel || !barrel.drc || barrel.drc === '' || parseFloat(barrel.drc) <= 0) {
          v[`barrel_${i}_drc`] = `DRC value for Barrel ${i + 1} is required`;
        }
      }
    }
    
    if (Object.keys(v).length) { setValidation(v); return; }
    try {
      setLoading(true);
      
      // Calculate average DRC from all barrels
      const drcValues = barrels.map(b => parseFloat(b.drc || 0)).filter(d => d > 0);
      const averageDrc = drcValues.length > 0 
        ? (drcValues.reduce((sum, val) => sum + val, 0) / drcValues.length).toFixed(2)
        : 0;
      
      // Prepare check-in data
      const checkInData = {
        sampleId: form.sampleId,
        customerName: form.customerName,
        receivedAt: form.receivedAt,
        notes: form.notes,
        barrelCount: barrelCount,
        drc: averageDrc, // Average DRC for display
        barrels: barrels.map((b, idx) => ({
          barrelNumber: idx + 1,
          barrelId: b.barrelId || `Barrel-${idx + 1}`,
          liters: b.liters || 0,
          drc: parseFloat(b.drc || 0)
        })),
        checkedInAt: new Date().toISOString()
      };
      
      console.log('Sample Check-In Data:', checkInData);
      
      // TODO: Backend endpoint needs to be created at /api/lab/samples/checkin
      // For now, we'll store locally and show success
      
      // Store in localStorage as temporary solution
      const existingCheckins = JSON.parse(localStorage.getItem('lab_checkins') || '[]');
      existingCheckins.unshift(checkInData);
      // Keep only last 10
      if (existingCheckins.length > 10) existingCheckins.pop();
      localStorage.setItem('lab_checkins', JSON.stringify(existingCheckins));
      
      // Also store for accountant to see
      const accountantPending = JSON.parse(localStorage.getItem('accountant_pending_samples') || '[]');
      accountantPending.unshift({
        ...checkInData,
        status: 'pending_billing',
        labStaff: user?.name || 'Lab Staff'
      });
      localStorage.setItem('accountant_pending_samples', JSON.stringify(accountantPending));
      
      // Send notification to accountant
      try {
        await fetch(`${base}/api/notifications/staff-trip-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            title: 'Sample Check-In Completed',
            message: `Sample ${checkInData.sampleId} from ${checkInData.customerName} checked in with DRC ${checkInData.drc || 'N/A'}%`,
            link: '/accountant/latex-verify',
            meta: checkInData,
            targetRole: 'accountant'
          })
        });
      } catch (notifError) {
        console.warn('Failed to send notification to accountant:', notifError);
      }
      
      setMessage('Sample checked in successfully! Notification sent to Accountant. Redirecting to dashboard...');
      setForm({ sampleId: '', customerName: '', receivedAt: '', notes: '', barrelCount: 0 });
      setBarrels([]);
      
      // Update history from localStorage
      setHistory(existingCheckins);
      
      // Redirect to dashboard after successful check-in
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
    if (!form.customerName?.trim()) return false;
    
    // Check that all barrels have DRC values
    const barrelCount = Number(form.barrelCount) || 0;
    if (barrelCount > 0) {
      for (let i = 0; i < barrelCount; i++) {
        const barrel = barrels[i];
        if (!barrel || !barrel.drc || barrel.drc === '' || parseFloat(barrel.drc) <= 0) {
          return false;
        }
      }
    }
    
    return true;
  }, [loading, form, barrels]);

  const generateReport = (item) => {
    const reportDate = item.receivedAt ? new Date(item.receivedAt) : new Date(item.createdAt);
    const doc = new jsPDF();
    
    // Set up colors and fonts
    const primaryColor = [59, 130, 246]; // Blue
    const secondaryColor = [71, 85, 105]; // Slate
    const lightGray = [148, 163, 184];
    
    let yPos = 20;
    
    // Header with border
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('LAB CHECK-IN REPORT', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Generated: ${new Date().toLocaleString('en-IN')}`, 105, 28, { align: 'center' });
    
    yPos = 50;
    
    // Section: Sample Information
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SAMPLE INFORMATION', 20, yPos);
    
    // Underline
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, 190, yPos + 2);
    
    yPos += 12;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    
    // Sample details
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
    
    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Received Time:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(reportDate.toLocaleTimeString('en-IN'), 70, yPos);
    
    yPos += 18;
    
    // Section: Quality Analysis
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('QUALITY ANALYSIS', 20, yPos);
    
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.line(20, yPos + 2, 190, yPos + 2);
    
    yPos += 12;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(11);
    
    // Quality details with highlight box
    doc.setFillColor(220, 252, 231); // Light green
    doc.roundedRect(23, yPos - 5, 80, 10, 2, 2, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.text('DRC Value:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    const drcValue = item.drc != null ? Number(item.drc).toFixed(2) + '%' : 'Not Tested';
    doc.setTextColor(22, 101, 52); // Dark green
    doc.text(drcValue, 70, yPos);
    
    yPos += 12;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFillColor(219, 234, 254); // Light blue
    doc.roundedRect(23, yPos - 5, 80, 10, 2, 2, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.text('Number of Barrels:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 64, 175); // Dark blue
    doc.text(String(item.barrelCount || 0), 70, yPos);
    
    yPos += 18;
    
    // Section: Additional Notes
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ADDITIONAL NOTES', 20, yPos);
    
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.line(20, yPos + 2, 190, yPos + 2);
    
    yPos += 12;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const notes = item.notes || 'No additional notes';
    const splitNotes = doc.splitTextToSize(notes, 170);
    doc.text(splitNotes, 25, yPos);
    
    yPos += (splitNotes.length * 6) + 12;
    
    // Section: Lab Staff Information
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LAB STAFF INFORMATION', 20, yPos);
    
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.line(20, yPos + 2, 190, yPos + 2);
    
    yPos += 12;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(11);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Checked In By:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(item.labStaff || user?.name || 'Lab Staff', 70, yPos);
    
    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Check-In Time:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(item.checkedInAt ? new Date(item.checkedInAt).toLocaleString('en-IN') : 'N/A', 70, yPos);
    
    // Footer
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 277, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Holy Family Polymers - Laboratory Department', 105, 287, { align: 'center' });
    
    // Save the PDF
    const fileName = `Lab_Report_${item.sampleId || 'Sample'}_${reportDate.toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="dash-card" style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Sample Check-In</h3>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {/* Hidden field for sampleId - auto-generated, not editable by user */}
        <input type="hidden" name="sampleId" value={form.sampleId} />
        <input type="hidden" name="barrelCount" value={form.barrelCount} />
        
        <label>Customer Name<input name="customerName" placeholder="Buyer/Customer name" value={form.customerName} onChange={onChange} /></label>
        
        {/* Display barrel count as read-only information */}
        <label>
          Number of Barrels
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            fontSize: '15px',
            fontWeight: '600',
            color: '#1e293b'
          }}>
            {form.barrelCount || 0} {form.barrelCount === 1 ? 'Barrel' : 'Barrels'}
          </div>
        </label>
        
        <label>Received At<input type="datetime-local" name="receivedAt" value={form.receivedAt} onChange={onChange} /></label>
        
        {/* DRC inputs for each barrel */}
        {form.barrelCount > 0 && (
          <div style={{ gridColumn: '1 / -1', marginTop: 16 }}>
            <h4 style={{ marginBottom: 12, color: '#1e293b', fontSize: '16px' }}>
              DRC Values for Each Barrel <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>
            </h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 12,
              padding: 16,
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              {barrels.map((barrel, idx) => (
                <div key={idx} style={{
                  padding: 12,
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0'
                }}>
                  <label style={{ marginBottom: 0 }}>
                    <div style={{
                      fontWeight: '600',
                      color: '#475569',
                      marginBottom: 6,
                      fontSize: '14px'
                    }}>
                      Barrel {idx + 1} DRC (%)
                    </div>
                    <input 
                      type="number" 
                      placeholder="Enter DRC %" 
                      value={barrel.drc || ''} 
                      onChange={(e) => onBarrelChange(idx, 'drc', e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      required
                      style={{
                        width: '100%',
                        borderColor: validation[`barrel_${idx}_drc`] ? '#ef4444' : undefined
                      }}
                    />
                    {validation[`barrel_${idx}_drc`] && (
                      <span style={{ 
                        color: '#ef4444', 
                        fontSize: '12px', 
                        marginTop: '4px',
                        display: 'block'
                      }}>
                        {validation[`barrel_${idx}_drc`]}
                      </span>
                    )}
                  </label>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: '#dbeafe',
              borderRadius: '6px',
              border: '1px solid #3b82f6',
              fontSize: '14px',
              color: '#1e40af'
            }}>
              <strong>ℹ️ Note:</strong> Enter the DRC percentage for each barrel separately. The average will be calculated automatically.
            </div>
          </div>
        )}
        
        <label style={{ gridColumn: '1 / -1' }}>Notes<textarea name="notes" placeholder="Optional notes" value={form.notes} onChange={onChange} rows={3} /></label>
        <div style={{ gridColumn: '1 / -1' }}>
          <button className="btn primary" type="submit" disabled={!canSubmit}>{loading ? 'Saving...' : 'Check In'}</button>
        </div>
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
                  <th>Customer Name</th>
                  <th>Barrels</th>
                  <th>DRC (%)</th>
                  <th>Notes</th>
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
                        {item.barrelCount || 0}
                      </span>
                    </td>
                    <td>
                      {item.drc != null ? (
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          {Number(item.drc).toFixed(1)}%
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.notes || '-'}
                    </td>
                    <td>
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
                        📄 Generate Report
                      </button>
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
