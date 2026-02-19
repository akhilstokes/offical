import React, { useEffect, useState } from 'react';
import './userDashboardTheme.css';

const UserBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    loadBills();
  }, [page]);

  const loadBills = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🔐 Token:', token ? 'Present' : 'Missing');
      
      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/bills/user/my-bills?page=${page}&limit=${pageSize}`;
      console.log('📡 Fetching bills from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📊 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Bills received:', data.bills?.length || 0);
        console.log('📋 Bills data:', data);
        setBills(data.bills || []);
        setTotal(data.total || 0);
      } else {
        const errorData = await response.text();
        console.error('❌ API Error:', response.status, errorData);
        setBills([]);
        setTotal(0);
      }
    } catch (e) {
      console.error('❌ Error loading bills:', e);
      setBills([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintBill = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'manager_verified': { bg: '#dcfce7', color: '#166534', text: 'Verified' },
      'approved': { bg: '#dbeafe', color: '#1e40af', text: 'Approved' },
      'paid': { bg: '#d1fae5', color: '#065f46', text: 'Paid' },
      'pending': { bg: '#fef3c7', color: '#92400e', text: 'Pending' },
      'rejected': { bg: '#fee2e2', color: '#991b1b', text: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig['pending'];
    
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 10px',
        background: config.bg,
        color: config.color,
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="transactions-page" style={{ paddingLeft: '20px', paddingRight: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 0.5rem 0' }}>
          <i className="fas fa-file-invoice-dollar" style={{ color: '#8b5cf6' }}></i>
          Bills
        </h1>
        <p style={{ color: '#64748b', margin: 0 }}>
          View bills verified by manager
        </p>
      </div>

      {/* Content Section */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#8b5cf6' }}></i>
          <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading bills...</p>
        </div>
      ) : bills.length === 0 ? (
        <div className="dash-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <i className="fas fa-file-invoice" style={{ fontSize: '1.75rem', color: '#94a3b8' }}></i>
          </div>
          <h3 style={{ fontSize: '1.25rem', color: '#1e293b', margin: '0 0 0.5rem 0' }}>No Bills Found</h3>
          <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
            You don't have any bills yet. Bills will appear here once they are verified by the manager.
          </p>
        </div>
      ) : (
        <div className="dash-card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Bill No.</th>
                  <th>Date</th>
                  <th>Barrels</th>
                  <th>DRC %</th>
                  <th>Amount (₹)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(bill => (
                  <tr key={bill._id}>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        background: '#f3e8ff',
                        color: '#7c3aed',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {bill.billNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                          <i className="fas fa-calendar-day" style={{ fontSize: '0.8rem' }}></i>
                        </div>
                        <span style={{ fontWeight: '500' }}>
                          {new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600' }}>{bill.barrelCount}</span>
                    </td>
                    <td>
                      <span>{bill.drcPercent}%</span>
                    </td>
                    <td>
                      <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '15px' }}>
                        ₹{bill.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      {getStatusBadge(bill.status)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn-secondary" 
                        onClick={() => {
                          setSelectedBill(bill);
                          setShowBillModal(true);
                        }}
                        style={{ padding: '6px 12px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                      >
                        <i className="fas fa-file-pdf" style={{ marginRight: '6px', color: '#ef4444' }}></i>
                        Download as PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Showing page <span style={{ fontWeight: '600', color: '#0f172a' }}>{page}</span> of {Math.ceil(total / pageSize)}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-secondary"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ opacity: page === 1 ? 0.5 : 1 }}
              >
                <i className="fas fa-chevron-left" style={{ marginRight: '6px' }}></i> Prev
              </button>
              <button
                className="btn-secondary"
                disabled={page * pageSize >= total}
                onClick={() => setPage(p => p + 1)}
                style={{ opacity: (page * pageSize >= total) ? 0.5 : 1 }}
              >
                Next <i className="fas fa-chevron-right" style={{ marginLeft: '6px' }}></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Modal */}
      {showBillModal && selectedBill && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ padding: '40px' }} id="printable-bill">
              {/* Company Header */}
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px 0', letterSpacing: '1px' }}>
                  HOLY FAMILY POLYMERS
                </h1>
                <p style={{ fontSize: '16px', color: '#666', margin: '0 0 15px 0' }}>
                  Koorppada, Kottayam
                </p>
                <div style={{ height: '3px', background: 'linear-gradient(to right, #4f46e5, #7c3aed)', margin: '15px auto', width: '200px' }}></div>
              </div>

              {/* Bill Info */}
              <div style={{ marginBottom: '30px', padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Bill No:</span>
                    <span style={{ color: '#1f2937', fontWeight: '500' }}>{selectedBill.billNumber}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Date:</span>
                    <span style={{ color: '#1f2937', fontWeight: '500' }}>
                      {new Date(selectedBill.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Customer:</span>
                    <span style={{ color: '#1f2937', fontWeight: '500' }}>{selectedBill.customerName}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ fontWeight: '600', color: '#374151' }}>Phone:</span>
                    <span style={{ color: '#1f2937', fontWeight: '500' }}>{selectedBill.customerPhone}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Total Barrels:</span>
                  <span style={{ color: '#1f2937', fontWeight: '500' }}>{selectedBill.barrelCount}</span>
                </div>
              </div>

              {/* Bill Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', border: '2px solid #e5e7eb' }}>
                <thead style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white' }}>
                  <tr>
                    <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>SI No.</th>
                    <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Qty (Liters)</th>
                    <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>DRC %</th>
                    <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Rate (₹/100KG)</th>
                    <th style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: selectedBill.barrelCount }, (_, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', color: '#374151', fontSize: '14px' }}>{index + 1}</td>
                      <td style={{ padding: '12px', color: '#374151', fontSize: '14px' }}>
                        {(selectedBill.latexVolume / selectedBill.barrelCount).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', color: '#374151', fontSize: '14px' }}>{selectedBill.drcPercent}%</td>
                      <td style={{ padding: '12px', color: '#374151', fontSize: '14px' }}>₹{selectedBill.marketRate}</td>
                      <td style={{ padding: '12px', color: '#374151', fontSize: '14px' }}>
                        ₹{selectedBill.perBarrelAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ background: '#f3f4f6', borderTop: '3px solid #4f46e5' }}>
                  <tr>
                    <td colSpan="4" style={{ padding: '16px 12px', fontWeight: '700', fontSize: '16px', textAlign: 'right', color: '#1f2937' }}>
                      Total Payment Amount:
                    </td>
                    <td style={{ padding: '16px 12px', fontWeight: '700', fontSize: '18px', color: '#059669' }}>
                      ₹{selectedBill.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Footer */}
              <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '2px solid #e5e7eb', color: '#6b7280', fontSize: '13px' }}>
                <p style={{ margin: '5px 0' }}>Thank you for your business!</p>
                <p style={{ fontStyle: 'italic', color: '#9ca3af', marginTop: '15px' }}>This is a computer-generated bill</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '20px', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }} className="no-print">
              <button 
                className="btn-secondary"
                onClick={() => setShowBillModal(false)}
              >
                Close
              </button>
              <button 
                className="btn"
                onClick={handlePrintBill}
              >
                <i className="fas fa-file-pdf" style={{ marginRight: '8px' }}></i>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBills;
