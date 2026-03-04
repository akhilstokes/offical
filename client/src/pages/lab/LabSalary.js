import React, { useEffect, useMemo, useState, useCallback } from 'react';

const LabSalary = () => {
  const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  }, []);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadMonthly = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true); setError(''); setRecord(null);
    try {
      const res = await fetch(`${base}/api/salary/history/${user._id}?year=${year}&limit=12`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Load failed (${res.status})`);
      }
      const data = await res.json();
      const list = data?.data || [];
      const r = list.find(x => Number(x.month) === Number(month));
      if (!r && list.length === 0) {
        setError('No salary data available. Please contact HR or try a different month.');
      }
      setRecord(r || null);
    } catch (e) {
      setError(e?.message || 'Failed to load salary');
    } finally { setLoading(false); }
  }, [base, token, user, year, month]);

  useEffect(() => { loadMonthly(); }, [loadMonthly]);

  const downloadSlip = async (rec) => {
    if (!rec) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    let y = 20;
    
    // Header
    doc.setFontSize(18); 
    doc.setFont(undefined, 'bold');
    doc.text('HOLY FAMILY POLYMERS', 105, y, { align: 'center' }); 
    y += 8;
    doc.setFontSize(14); 
    doc.text('Lab Staff Salary Slip', 105, y, { align: 'center' }); 
    y += 15;
    
    // Employee Details
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Employee: ${rec.staff?.name || user?.name || ''}`, 14, y); y += 6;
    doc.text(`ID: ${rec.staff?.staffId || user?.staffId || ''}`, 14, y); y += 6;
    doc.text(`Month: ${new Date(rec.year, rec.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`, 14, y); y += 6;
    doc.text(`Status: ${(rec.status || '').toUpperCase()}`, 14, y); y += 12;
    
    // Earnings Section
    doc.setFontSize(12); 
    doc.setFont(undefined, 'bold');
    doc.text('EARNINGS', 14, y); y += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    const earnings = [
      ['Basic Salary', rec.basicSalary?.toFixed(2) || '0.00'],
      ['Medical Allowance', rec.medicalAllowance?.toFixed(2) || '0.00'],
      ['Transportation Allowance', rec.transportationAllowance?.toFixed(2) || '0.00'],
      ['Overtime', rec.overtime?.toFixed(2) || '0.00'],
      ['Bonus', rec.bonus?.toFixed(2) || '0.00'],
    ];
    
    earnings.forEach(([label, value]) => {
      doc.text(label, 20, y);
      doc.text(`₹${value}`, 180, y, { align: 'right' });
      y += 6;
    });
    
    y += 2;
    doc.setFont(undefined, 'bold');
    doc.text('Gross Salary', 20, y);
    doc.text(`₹${rec.grossSalary?.toFixed(2) || '0.00'}`, 180, y, { align: 'right' });
    y += 12;
    
    // Deductions Section
    doc.setFontSize(12);
    doc.text('DEDUCTIONS', 14, y); y += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    const deductions = [
      ['Tax', rec.deductions?.tax?.toFixed(2) || '0.00'],
      ['Provident Fund', rec.deductions?.providentFund?.toFixed(2) || '0.00'],
      ['Professional Tax', rec.deductions?.professionalTax?.toFixed(2) || '0.00'],
      ['Other Deductions', rec.deductions?.other?.toFixed(2) || '0.00'],
    ];
    
    deductions.forEach(([label, value]) => {
      doc.text(label, 20, y);
      doc.text(`₹${value}`, 180, y, { align: 'right' });
      y += 6;
    });
    
    y += 2;
    doc.setFont(undefined, 'bold');
    doc.text('Total Deductions', 20, y);
    doc.text(`₹${rec.totalDeductions?.toFixed(2) || '0.00'}`, 180, y, { align: 'right' });
    y += 12;
    
    // Net Salary
    doc.setFontSize(14);
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 8;
    doc.text('NET SALARY', 20, y);
    doc.text(`₹${rec.netSalary?.toFixed(2) || '0.00'}`, 180, y, { align: 'right' });
    y += 2;
    doc.line(14, y, 196, y);
    y += 12;
    
    // Attendance Info
    if (rec.totalDays || rec.presentDays) {
      doc.setFontSize(12);
      doc.text('ATTENDANCE', 14, y); y += 8;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Days: ${rec.totalDays || 0}`, 20, y); y += 6;
      doc.text(`Present Days: ${rec.presentDays || 0}`, 20, y); y += 6;
      if (rec.absentDays) { doc.text(`Absent Days: ${rec.absentDays}`, 20, y); y += 6; }
      if (rec.leaveDays) { doc.text(`Leave Days: ${rec.leaveDays}`, 20, y); y += 6; }
    }
    
    // Footer
    y = 280;
    doc.setFontSize(8);
    doc.text('This is a computer-generated document. No signature required.', 105, y, { align: 'center' });
    
    doc.save(`lab_salary_${rec.year}_${rec.month}.pdf`);
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <h2 style={{ margin: 0 }}>My Salary (Lab)</h2>
        <button 
          className="btn-secondary" 
          onClick={loadMonthly} 
          disabled={loading}
          style={{ padding: '6px 12px', fontSize: '13px' }}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <form onSubmit={(e)=>{ e.preventDefault(); loadMonthly(); }} style={{ display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', marginTop: 12 }}>
        <label style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <span style={{ color:'#334155', fontWeight:600 }}>Year</span>
          <input type="number" min={2000} max={2100} value={year} onChange={(e)=>setYear(Number(e.target.value || now.getFullYear()))} 
                 style={{ padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8 }} />
        </label>
        <label style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <span style={{ color:'#334155', fontWeight:600 }}>Month</span>
          <input type="number" min={1} max={12} value={month} onChange={(e)=>setMonth(Number(e.target.value || (now.getMonth()+1)))} 
                 style={{ padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8 }} />
        </label>
        <div style={{ display:'flex', alignItems:'flex-end' }}>
          <button type="submit" className="btn btn-primary">VIEW</button>
        </div>
      </form>

      {error && (
        <div style={{ 
          background: '#fef2f2', 
          color: '#991b1b', 
          padding: '12px 16px', 
          borderRadius: '8px', 
          marginTop: '12px',
          border: '1px solid #fecaca',
          fontSize: '14px'
        }}>
          <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
          No salary data available. Please contact HR or try a different month.
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        {loading && (
          <div className="dash-card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ color:'#64748b' }}>Loading salary data...</div>
          </div>
        )}
        {!record && !loading && !error ? (
          <div className="dash-card" style={{ padding: 16 }}>
            <div style={{ color:'#64748b' }}>No salary record found for the selected month.</div>
          </div>
        ) : null}
        {record && (
          <div className="dash-card" style={{ padding: 20, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '2px solid #e5e7eb', paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#1e293b' }}>
                {new Date(record.year, record.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <span style={{ 
                padding: '4px 12px', 
                borderRadius: 6, 
                fontSize: 12, 
                fontWeight: 600,
                background: record.status === 'paid' ? '#dcfce7' : record.status === 'approved' ? '#dbeafe' : '#fef3c7',
                color: record.status === 'paid' ? '#166534' : record.status === 'approved' ? '#1e40af' : '#92400e'
              }}>
                {(record.status || '').toUpperCase()}
              </span>
            </div>
            
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom: 20 }}>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ color:'#64748b', fontSize:13, marginBottom: 4 }}>Basic Salary</div>
                <div style={{ fontWeight:700, fontSize: 20, color: '#1e293b' }}>₹{record.basicSalary?.toFixed(2) ?? '0.00'}</div>
              </div>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ color:'#64748b', fontSize:13, marginBottom: 4 }}>Gross Salary</div>
                <div style={{ fontWeight:700, fontSize: 20, color: '#1e293b' }}>₹{record.grossSalary?.toFixed(2) ?? '0.00'}</div>
              </div>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ color:'#64748b', fontSize:13, marginBottom: 4 }}>Total Deductions</div>
                <div style={{ fontWeight:700, fontSize: 20, color: '#dc2626' }}>₹{record.totalDeductions?.toFixed(2) ?? '0.00'}</div>
              </div>
              <div style={{ padding: 12, background: '#dcfce7', borderRadius: 8 }}>
                <div style={{ color:'#166534', fontSize:13, marginBottom: 4 }}>Net Salary</div>
                <div style={{ fontWeight:700, fontSize: 22, color: '#166534' }}>₹{record.netSalary?.toFixed(2) ?? '0.00'}</div>
              </div>
            </div>

            {/* Additional Details */}
            {(record.medicalAllowance || record.transportationAllowance || record.overtime || record.bonus) && (
              <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#1e293b' }}>Allowances & Bonuses</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, fontSize: 13 }}>
                  {record.medicalAllowance > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Medical:</span>
                      <span style={{ fontWeight: 600 }}>₹{record.medicalAllowance.toFixed(2)}</span>
                    </div>
                  )}
                  {record.transportationAllowance > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Transportation:</span>
                      <span style={{ fontWeight: 600 }}>₹{record.transportationAllowance.toFixed(2)}</span>
                    </div>
                  )}
                  {record.overtime > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Overtime:</span>
                      <span style={{ fontWeight: 600 }}>₹{record.overtime.toFixed(2)}</span>
                    </div>
                  )}
                  {record.bonus > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Bonus:</span>
                      <span style={{ fontWeight: 600 }}>₹{record.bonus.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Deductions Breakdown */}
            {record.deductions && (
              <div style={{ marginBottom: 16, padding: 12, background: '#fef2f2', borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#1e293b' }}>Deductions Breakdown</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, fontSize: 13 }}>
                  {record.deductions.tax > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Tax:</span>
                      <span style={{ fontWeight: 600, color: '#dc2626' }}>₹{record.deductions.tax.toFixed(2)}</span>
                    </div>
                  )}
                  {record.deductions.providentFund > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>PF:</span>
                      <span style={{ fontWeight: 600, color: '#dc2626' }}>₹{record.deductions.providentFund.toFixed(2)}</span>
                    </div>
                  )}
                  {record.deductions.professionalTax > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Professional Tax:</span>
                      <span style={{ fontWeight: 600, color: '#dc2626' }}>₹{record.deductions.professionalTax.toFixed(2)}</span>
                    </div>
                  )}
                  {record.deductions.other > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Other:</span>
                      <span style={{ fontWeight: 600, color: '#dc2626' }}>₹{record.deductions.other.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Attendance Info */}
            {(record.totalDays || record.presentDays) && (
              <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#1e293b' }}>Attendance</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Total Days:</span>
                    <span style={{ fontWeight: 600 }}>{record.totalDays || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Present:</span>
                    <span style={{ fontWeight: 600, color: '#16a34a' }}>{record.presentDays || 0}</span>
                  </div>
                  {record.absentDays > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Absent:</span>
                      <span style={{ fontWeight: 600, color: '#dc2626' }}>{record.absentDays}</span>
                    </div>
                  )}
                  {record.leaveDays > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Leave:</span>
                      <span style={{ fontWeight: 600, color: '#f59e0b' }}>{record.leaveDays}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ marginTop: 16, display:'flex', gap:8, flexWrap:'wrap' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={()=>downloadSlip(record)}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                📄 Download Payslip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabSalary;
