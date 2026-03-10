import React, { useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';
import './userDashboardTheme.css';

const UserBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [activeTab, setActiveTab] = useState('sales'); // 'sales', 'purchases', or 'gst-invoices'
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    loadBills();
  }, [page, activeTab]);

  const loadBills = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      let apiUrl;
      if (activeTab === 'sales') {
        apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/bills/user/my-bills?page=${page}&limit=${pageSize}`;
      } else if (activeTab === 'purchases') {
        apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/invoices/my?page=${page}&limit=${pageSize}`;
      } else if (activeTab === 'gst-invoices') {
        apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/gst-invoices/user/my-invoices?page=${page}&limit=${pageSize}`;
      }

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (activeTab === 'sales') {
          setBills(data.bills || []);
          setTotal(data.total || 0);
        } else if (activeTab === 'purchases') {
          // Invoice API returns { success, invoices, count } or just an array
          const items = data.invoices || (Array.isArray(data) ? data : []);
          setBills(items);
          setTotal(data.count || items.length);
        } else if (activeTab === 'gst-invoices') {
          setBills(data.invoices || []);
          setTotal(data.count || 0);
        }
      } else {
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

  const handlePrintBill = async () => {
    try {
      const element = document.getElementById('printable-bill');
      if (!element) return;

      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Calculate top margin to center if preferred, or just 0
      const margin = 10;
      pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth - (margin * 2), pdfHeight - (margin * 2));
      pdf.save(`Bill_${selectedBill?.billNumber || selectedBill?.invoiceNumber || 'Receipt'}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
    }
  };

  const downloadGSTInvoicePDF = async (invoiceId) => {
    try {
      // Use user-accessible route for downloading GST invoices
      const printWindow = window.open(`/user/invoice/print/${invoiceId}?download=true`, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
    } catch (error) {
      console.error('Error downloading GST invoice:', error);
      alert('Failed to download GST invoice PDF');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'manager_verified': { bg: '#dcfce7', color: '#166534', text: 'Verified' },
      'approved': { bg: '#dbeafe', color: '#1e40af', text: 'Approved' },
      'paid': { bg: '#d1fae5', color: '#065f46', text: 'Paid' },
      'pending': { bg: '#fef3c7', color: '#92400e', text: 'Pending' },
      'rejected': { bg: '#fee2e2', color: '#991b1b', text: 'Rejected' },
      'delivered': { bg: '#d1fae5', color: '#065f46', text: 'Delivered' }
    };

    const config = statusConfig[status.toLowerCase()] || statusConfig['pending'];

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
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 0.5rem 0' }}>
            <i className="fas fa-file-invoice-dollar" style={{ color: '#8b5cf6' }}></i>
            Financial Documents
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>
            {activeTab === 'sales' ? 'View bills from your rubber sales' : 
             activeTab === 'purchases' ? 'View invoices from your product purchases' :
             'View GST invoices and download PDFs'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', gap: '4px' }}>
          <button
            onClick={() => { setActiveTab('sales'); setPage(1); }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'sales' ? 'white' : 'transparent',
              color: activeTab === 'sales' ? '#4f46e5' : '#64748b',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: activeTab === 'sales' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Rubber Sales
          </button>
          <button
            onClick={() => { setActiveTab('purchases'); setPage(1); }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'purchases' ? 'white' : 'transparent',
              color: activeTab === 'purchases' ? '#4f46e5' : '#64748b',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: activeTab === 'purchases' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Product Purchases
          </button>
          <button
            onClick={() => { setActiveTab('gst-invoices'); setPage(1); }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'gst-invoices' ? 'white' : 'transparent',
              color: activeTab === 'gst-invoices' ? '#4f46e5' : '#64748b',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: activeTab === 'gst-invoices' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            GST Invoices
          </button>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#8b5cf6' }}></i>
          <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading {activeTab === 'sales' ? 'bills' : activeTab === 'purchases' ? 'invoices' : 'GST invoices'}...</p>
        </div>
      ) : bills.length === 0 ? (
        <div className="dash-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <i className={activeTab === 'sales' ? "fas fa-leaf" : activeTab === 'purchases' ? "fas fa-shopping-bag" : "fas fa-file-invoice-dollar"} style={{ fontSize: '1.75rem', color: '#94a3b8' }}></i>
          </div>
          <h3 style={{ fontSize: '1.25rem', color: '#1e293b', margin: '0 0 0.5rem 0' }}>No {activeTab === 'sales' ? 'Sales' : activeTab === 'purchases' ? 'Orders' : 'Invoices'} Found</h3>
          <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto' }}>
            {activeTab === 'sales'
              ? "You don't have any rubber sale bills yet."
              : activeTab === 'purchases' 
              ? "You haven't placed any product orders yet."
              : "No GST invoices found for your account."}
          </p>
        </div>
      ) : (
        <div className="dash-card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="table">
              <thead>
                {activeTab === 'sales' ? (
                  <tr>
                    <th>Bill No.</th>
                    <th>Date</th>
                    <th>Barrels</th>
                    <th>DRC %</th>
                    <th>Amount (₹)</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                ) : activeTab === 'purchases' ? (
                  <tr>
                    <th>Invoice No.</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total (₹)</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Invoice No.</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Taxable (₹)</th>
                    <th>Total (₹)</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {bills.map(item => (
                  <tr key={item._id}>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        background: activeTab === 'sales' ? '#f3e8ff' : activeTab === 'purchases' ? '#e0f2fe' : '#fef3c7',
                        color: activeTab === 'sales' ? '#7c3aed' : activeTab === 'purchases' ? '#0369a1' : '#92400e',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {activeTab === 'sales' ? item.billNumber : item.invoiceNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                          <i className="fas fa-calendar-day" style={{ fontSize: '0.8rem' }}></i>
                        </div>
                        <span style={{ fontWeight: '500' }}>
                          {new Date(item.createdAt || item.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </td>
                    {activeTab === 'sales' ? (
                      <>
                        <td><span style={{ fontWeight: '600' }}>{item.barrelCount}</span></td>
                        <td><span>{item.drcPercent}%</span></td>
                      </>
                    ) : activeTab === 'purchases' ? (
                      <td>
                        <span style={{ fontWeight: '500', fontSize: '14px' }}>
                          {item.items?.length || 0} Item(s)
                        </span>
                      </td>
                    ) : (
                      <>
                        <td>
                          <span style={{ fontWeight: '500', fontSize: '14px' }}>
                            {item.customerName}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: '500', fontSize: '14px' }}>
                            {item.items?.length || 0} Item(s)
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '14px' }}>
                            ₹{item.taxableValue?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0.00'}
                          </span>
                        </td>
                      </>
                    )}
                    <td>
                      <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '15px' }}>
                        ₹{(activeTab === 'gst-invoices' ? item.grandTotal : item.totalAmount)?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0.00'}
                      </span>
                    </td>
                    <td>
                      {getStatusBadge(item.status)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {activeTab === 'sales' ? (
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            setSelectedBill(item);
                            setShowBillModal(true);
                          }}
                          style={{ padding: '6px 12px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                        >
                          <i className="fas fa-file-pdf" style={{ marginRight: '6px', color: '#ef4444' }}></i>
                          Download as PDF
                        </button>
                      ) : activeTab === 'purchases' ? (
                        <button
                          className="btn-secondary"
                          onClick={() => window.open(`/user/invoices/${item._id}`, '_blank')}
                          style={{ padding: '6px 12px', fontSize: '0.85rem', whiteSpace: 'nowrap', color: '#0284c7' }}
                        >
                          <i className="fas fa-eye" style={{ marginRight: '6px' }}></i>
                          View Invoice
                        </button>
                      ) : (
                        <button
                          className="btn-secondary"
                          onClick={() => downloadGSTInvoicePDF(item._id)}
                          style={{ padding: '6px 12px', fontSize: '0.85rem', whiteSpace: 'nowrap', color: '#dc2626' }}
                        >
                          <i className="fas fa-file-pdf" style={{ marginRight: '6px' }}></i>
                          Download PDF
                        </button>
                      )}
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
        <div className="modal-overlay" onClick={(e) => {
          if (e.target.className === 'modal-overlay') setShowBillModal(false);
        }}>
          <div className="bill-modal">
            <div className="bill-content" id="printable-bill">
              {/* Professional Header with QR */}
              <div className="bill-header">
                <div className="bill-header-left">
                  <h1 className="company-name">HOLY FAMILY POLYMERS</h1>
                  <p className="company-location">Koorppada, P.O. - 686 502</p>
                  <p className="company-gst">GST No: 32AAHFH5388M1ZX</p>
                  <p className="company-contact">Email: info@holyfamilypolymers.com</p>
                  <p className="company-phone">Phone: +91 9876543210</p>
                  <div className="bill-divider"></div>
                </div>
                <div className="bill-header-right">
                  <div className="bill-qr-container">
                    <QRCodeCanvas
                      value={`BILL:${selectedBill.billNumber || selectedBill.invoiceNumber || selectedBill._id}`}
                      size={80}
                      level={"H"}
                    />
                  </div>
                </div>
              </div>

              {/* Bill Info Grid */}
              <div className="bill-info-section">
                <div className="bill-info-column">
                  <div className="bill-info-item">
                    <span className="bill-label">Name:</span>
                    <span className="bill-value">{selectedBill.customerName || selectedBill.buyer || 'N/A'}</span>
                  </div>
                  <div className="bill-info-item">
                    <span className="bill-label">Phone:</span>
                    <span className="bill-value">{selectedBill.customerPhone || selectedBill.phone || 'N/A'}</span>
                  </div>
                </div>
                <div className="bill-info-column">
                  <div className="bill-info-item">
                    <span className="bill-label">Date:</span>
                    <span className="bill-value">{new Date(selectedBill.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="bill-info-item">
                    <span className="bill-label">Total Barrels:</span>
                    <span className="bill-value">{selectedBill.barrelCount || selectedBill.barrels || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Bill Table */}
              <div className="bill-table-container">
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
                    {Array.from({ length: selectedBill.barrelCount || 1 }, (_, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{((selectedBill.latexVolume || 0) / (selectedBill.barrelCount || 1)).toFixed(2)}</td>
                        <td>{selectedBill.drcPercent}%</td>
                        <td>₹{selectedBill.marketRate || 0}</td>
                        <td>₹{((selectedBill.totalAmount || 0) / (selectedBill.barrelCount || 1)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '12px 20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontWeight: '700', color: '#4b5563', marginRight: '12px' }}>Total Payment Amount:</span>
                  <span style={{ fontWeight: '800', color: '#111827', fontSize: '1.1rem' }}>₹{(selectedBill.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Verification Section */}
              <div className="bill-verification" style={{ display: 'flex', justifyContent: 'space-around', marginTop: '40px', textAlign: 'center' }}>
                <div className="verification-box">
                  <p className="verification-label" style={{ fontWeight: '600', color: '#374151', marginBottom: '40px' }}>Verified By:</p>
                  <div className="signature-line" style={{ borderTop: '1px solid #d1d5db', width: '150px', margin: '0 auto 8px auto' }}></div>
                  <p className="verification-sublabel" style={{ fontSize: '0.75rem', color: '#6b7280' }}>Accountant Signature</p>
                </div>
                <div className="verification-box">
                  <p className="verification-label" style={{ fontWeight: '600', color: '#374151', marginBottom: '40px' }}>Approved By:</p>
                  <div className="signature-line" style={{ borderTop: '1px solid #d1d5db', width: '150px', margin: '0 auto 8px auto' }}></div>
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
                className="btn-secondary bill-close-btn"
                onClick={() => setShowBillModal(false)}
              >
                Close
              </button>
              <button
                className="btn bill-print-btn"
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
