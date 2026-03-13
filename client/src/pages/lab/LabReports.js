import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import './LabDashboard.css'; // Ensure we use the dashboard theme



const LabReports = () => {
  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReport, setNewReport] = useState({ date: '', sampleId: '', supplier: '', drc: '', barrels: '' });



  const run = async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`${base}/api/latex/reports/drc?${params.toString()}`, { headers });
      if (!res.ok) throw new Error(`Report failed (${res.status})`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []));
    } catch (e2) { setError(e2?.message || 'Failed to load report'); setRows([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { /* on mount, optionally auto-load today */ }, []);


  const handleCreate = async () => {
    // Validate inputs
    if (!newReport.date || !newReport.sampleId || !newReport.supplier || !newReport.drc || !newReport.barrels) {
      setError('Please fill all fields');
      return;
    }

    // Create report entry
    const reportEntry = {
      analyzedAt: newReport.date,
      sampleId: newReport.sampleId,
      supplier: newReport.supplier,
      batch: `BATCH-${Date.now()}`,
      quantityLiters: parseInt(newReport.barrels) * 200, // Assuming 200L per barrel
      drc: parseFloat(newReport.drc)
    };

    // Add to rows
    setRows([reportEntry, ...rows]);
    
    // Reset form and close modal
    setNewReport({ date: '', sampleId: '', supplier: '', drc: '', barrels: '' });
    setShowCreateModal(false);
  };

  const downloadReportPDF = (report) => {
    const doc = new jsPDF();
    
    const primaryColor = [59, 130, 246];
    const secondaryColor = [71, 85, 105];
    
    let yPos = 20;
    
    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('LAB ANALYSIS REPORT', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 105, 28, { align: 'center' });
    
    yPos = 50;
    
    // Report Information
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORT DETAILS', 20, yPos);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, 190, yPos + 2);
    
    yPos += 12;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(11);
    
    // Date
    doc.setFont('helvetica', 'bold');
    doc.text('Analysis Date:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(report.analyzedAt ? new Date(report.analyzedAt).toLocaleDateString('en-IN') : 'N/A', 70, yPos);
    
    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Sample ID:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(report.sampleId || 'N/A', 70, yPos);
    
    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Supplier:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(report.supplier || 'N/A', 70, yPos);
    
    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Batch:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(report.batch || 'N/A', 70, yPos);
    
    yPos += 18;
    
    // Analysis Results
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ANALYSIS RESULTS', 20, yPos);
    doc.line(20, yPos + 2, 190, yPos + 2);
    
    yPos += 12;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(11);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Quantity:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${report.quantityLiters || 0} Liters`, 70, yPos);
    
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('DRC (Dry Rubber Content):', 25, yPos);
    doc.setFont('helvetica', 'normal');
    const drcColor = report.drc > 30 ? [22, 163, 74] : [234, 88, 12];
    doc.setTextColor(drcColor[0], drcColor[1], drcColor[2]);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${report.drc}%`, 70, yPos);
    
    yPos += 20;
    
    // Quality Assessment
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('QUALITY ASSESSMENT', 20, yPos);
    doc.line(20, yPos + 2, 190, yPos + 2);
    
    yPos += 12;
    doc.setFontSize(11);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'normal');
    
    const quality = report.drc > 35 ? 'Excellent' : report.drc > 30 ? 'Good' : report.drc > 25 ? 'Fair' : 'Poor';
    const qualityColor = report.drc > 35 ? [22, 163, 74] : report.drc > 30 ? [34, 197, 94] : report.drc > 25 ? [251, 146, 60] : [239, 68, 68];
    
    doc.text('Quality Grade:', 25, yPos);
    doc.setTextColor(qualityColor[0], qualityColor[1], qualityColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(quality, 70, yPos);
    
    // Footer
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 277, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Holy Family Polymers - Laboratory Department', 105, 287, { align: 'center' });
    
    const fileName = `Lab_Report_${report.sampleId || 'Sample'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="lab-dashboard" style={{ position: 'relative' }}>
      {/* Header Section */}
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="dashboard-title">Reports</h1>
          <p className="dashboard-subtitle">Generate and manage lab analysis reports.</p>
        </div>
        <button
          className="btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            fontSize: '14px',
            flex: '0 0 auto',
            width: 'auto',
            minWidth: 'auto'
          }}
          onClick={() => setShowCreateModal(true)}
        >
          <i className="fas fa-plus" style={{ fontSize: '14px' }}></i> Add
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Report Configuration Card */}
      <div className="dash-card" style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        <h2 className="section-title" style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          Report Configuration
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', alignItems: 'end' }}>

          {/* From Date Input with Styled Group */}
          <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ background: '#f8fafc', padding: '10px 16px', borderRight: '1px solid #e2e8f0', color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center' }}>
              From Date
            </div>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{ border: 'none', padding: '10px 16px', outline: 'none', width: '100%', color: '#1e293b' }}
            />
          </div>

          {/* To Date Input with Styled Group */}
          <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ background: '#f8fafc', padding: '10px 16px', borderRight: '1px solid #e2e8f0', color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center' }}>
              To Date
            </div>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{ border: 'none', padding: '10px 16px', outline: 'none', width: '100%', color: '#1e293b' }}
            />
          </div>

          {/* Action Button */}
          <button
            className="action-button action-primary"
            onClick={run}
            disabled={loading}
            style={{ border: 'none', cursor: 'pointer', justifyContent: 'center', height: '42px' }}
          >
            {loading ? (
              <span><i className="fas fa-spinner fa-spin"></i> Processing...</span>
            ) : (
              <span>Click Me</span>
            )}
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="dash-card" style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <h3 className="section-title" style={{ fontSize: '18px', marginBottom: '16px' }}>Generated Results</h3>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sample ID</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supplier</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Batch</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty (L)</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DRC %</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', color: '#334155' }}>
                    {r.analyzedAt ? new Date(r.analyzedAt).toLocaleDateString() : '-'}
                  </td>
                  <td style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', fontWeight: '500', color: '#0f172a' }}>
                    {r.sampleId || '-'}
                  </td>
                  <td style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', color: '#64748b' }}>
                    {r.supplier || '-'}
                  </td>
                  <td style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9' }}>
                    <span className="badge" style={{ background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      {r.batch || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', fontWeight: '600', color: '#334155' }}>
                    {r.quantityLiters ?? '-'}
                  </td>
                  <td style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9' }}>
                    {r.drc ? (
                      <span style={{ color: r.drc > 30 ? '#16a34a' : '#ea580c', fontWeight: '700' }}>
                        {r.drc}%
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <button
                      onClick={() => downloadReportPDF(r)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                    >
                      <i className="fas fa-file-pdf"></i> PDF
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📊</div>
                    <div>No data found for the selected range</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Report Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#1e293b' }}>Create New Report</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Date</label>
              <input
                type="date"
                value={newReport.date}
                onChange={(e) => setNewReport({ ...newReport, date: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Sample ID</label>
              <input
                type="text"
                placeholder="Enter Sample ID"
                value={newReport.sampleId}
                onChange={(e) => setNewReport({ ...newReport, sampleId: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Supplier Name</label>
              <input
                type="text"
                placeholder="Enter Supplier Name"
                value={newReport.supplier}
                onChange={(e) => setNewReport({ ...newReport, supplier: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>DRC %</label>
              <input
                type="number"
                placeholder="Enter DRC Rate"
                value={newReport.drc}
                onChange={(e) => setNewReport({ ...newReport, drc: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Number of Barrels</label>
              <input
                type="number"
                placeholder="Enter Number of Barrels"
                value={newReport.barrels}
                onChange={(e) => setNewReport({ ...newReport, barrels: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: '500', color: '#64748b' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)', cursor: 'pointer', fontWeight: '600', color: 'white' }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LabReports;
