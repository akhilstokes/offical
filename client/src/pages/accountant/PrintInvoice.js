import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './PrintInvoice.css';

const PrintInvoice = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [invoice, setInvoice] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoiceData();
  }, [id]);

  useEffect(() => {
    if (invoice && companySettings) {
      if (searchParams.get('download') === 'true') {
        setTimeout(handleDownload, 500); // slight delay to ensure fonts/images loaded
      } else if (searchParams.get('print') === 'true') {
        setTimeout(() => window.print(), 500);
      }
    }
  }, [invoice, companySettings, searchParams]);

  const fetchInvoiceData = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const [invoiceRes, settingsRes] = await Promise.all([
        axios.get(`${API_URL}/api/gst-invoices/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/gst-invoices/company-settings`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setInvoice(invoiceRes.data.invoice);
      setCompanySettings(settingsRes.data.settings);
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      const element = document.querySelector('.invoice-page');
      if (!element) return;

      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${invoice.invoiceNumber}.pdf`);

      // Auto-close tab if opened just for downloading
      if (searchParams.get('download') === 'true') {
        window.close();
      }
    } catch (e) {
      console.error('Error generating PDF:', e);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return <div className="loading">Loading invoice...</div>;
  }

  if (!invoice || !companySettings) {
    return <div className="error">Invoice not found</div>;
  }

  const isSameState = invoice.customerState === companySettings.state;

  return (
    <div className="print-invoice-container">
      <div className="no-print">
        <button className="print-btn" onClick={handlePrint}>
          <i className="fas fa-print"></i> Print Invoice
        </button>
        <button className="print-close-btn" onClick={() => window.close()}>
          <i className="fas fa-times"></i> Close
        </button>
      </div>

      <div className="invoice-page">
        {/* Company Header */}
        <div className="invoice-header">
          <div className="company-info">
            <h1>{companySettings.companyName}</h1>
            <p>{companySettings.address}</p>
            <p>{companySettings.city}, {companySettings.state} - {companySettings.pincode}</p>
            <p>Phone: {companySettings.phone}</p>
            <p>Email: {companySettings.email}</p>
          </div>
          <div className="company-legal">
            <p><strong>PAN:</strong> {companySettings.panNumber}</p>
            <p><strong>GSTIN:</strong> {companySettings.gstNumber}</p>
            {companySettings.registrationNumber && (
              <p><strong>Rubber Board No:</strong> {companySettings.registrationNumber}</p>
            )}
          </div>
        </div>

        <div className="invoice-title">
          <h2>TAX INVOICE</h2>
        </div>

        {/* Invoice Details */}
        <div className="invoice-details-section">
          <table className="details-table">
            <tr>
              <td><strong>Invoice Number:</strong></td>
              <td>{invoice.invoiceNumber}</td>
              <td><strong>Reverse Charge:</strong></td>
              <td>{invoice.reverseCharge}</td>
            </tr>
            <tr>
              <td><strong>Invoice Date:</strong></td>
              <td>{formatDate(invoice.invoiceDate)}</td>
              <td><strong>Transportation Mode:</strong></td>
              <td>{invoice.transportationMode}</td>
            </tr>
            <tr>
              <td><strong>Date of Supply:</strong></td>
              <td>{formatDate(invoice.supplyDate)}</td>
              <td><strong>Vehicle Number:</strong></td>
              <td>{invoice.vehicleNumber || '-'}</td>
            </tr>
            <tr>
              <td><strong>Place of Supply:</strong></td>
              <td>{invoice.placeOfSupply}</td>
              <td><strong>State:</strong></td>
              <td>{companySettings.state}</td>
            </tr>
          </table>
        </div>

        {/* Vendor and Customer Details */}
        <div className="parties-section">
          <div className="party-box">
            <h3>Vendor/Supplier Details</h3>
            <p><strong>{invoice.vendorName}</strong></p>
            <p>{invoice.placeOfSupply}</p>
          </div>
          <div className="party-box">
            <h3>Customer/Receiver Details</h3>
            <p><strong>{invoice.customerName}</strong></p>
            <p>{invoice.customerAddress}</p>
            {invoice.customerGSTIN && <p><strong>GSTIN:</strong> {invoice.customerGSTIN}</p>}
            {invoice.customerPAN && (
              <p style={{
                fontFamily: 'monospace',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#1e40af',
                background: '#eff6ff',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #dbeafe',
                marginTop: '4px',
                display: 'inline-block'
              }}>
                <strong>PAN:</strong> {invoice.customerPAN}
              </p>
            )}
            <p><strong>State:</strong> {invoice.customerState} (Code: {invoice.customerStateCode})</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="items-table">
          <thead>
            <tr>
              <th>Sl No</th>
              <th>Description of Goods</th>
              <th>HSN/SAC</th>
              <th>GST Rate</th>
              <th>Qty</th>
              <th>Rate (₹)</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index}>
                <td>{item.slNo}</td>
                <td>{item.description}</td>
                <td>{item.hsnSac}</td>
                <td>{item.gstRate}%</td>
                <td>{formatCurrency(item.quantity)} {item.unit}</td>
                <td>{formatCurrency(item.rate)}</td>
                <td>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="6" className="text-right"><strong>Taxable Value</strong></td>
              <td><strong>₹{formatCurrency(invoice.taxableValue)}</strong></td>
            </tr>
            {isSameState ? (
              <>
                <tr>
                  <td colSpan="6" className="text-right">CGST</td>
                  <td>₹{formatCurrency(invoice.cgst)}</td>
                </tr>
                <tr>
                  <td colSpan="6" className="text-right">SGST</td>
                  <td>₹{formatCurrency(invoice.sgst)}</td>
                </tr>
              </>
            ) : (
              <tr>
                <td colSpan="6" className="text-right">IGST</td>
                <td>₹{formatCurrency(invoice.igst)}</td>
              </tr>
            )}
            <tr>
              <td colSpan="6" className="text-right"><strong>Total Tax</strong></td>
              <td><strong>₹{formatCurrency(invoice.totalTax)}</strong></td>
            </tr>
            <tr className="grand-total-row">
              <td colSpan="6" className="text-right"><strong>Grand Total</strong></td>
              <td><strong>₹{formatCurrency(invoice.grandTotal)}</strong></td>
            </tr>
          </tfoot>
        </table>

        {/* Amount in Words */}
        <div className="amount-words">
          <strong>Amount in Words:</strong> {invoice.amountInWords}
        </div>

        {/* Transport Details */}
        {(invoice.transporterName || invoice.driverName) && (
          <div className="transport-section">
            <h3>Transport Details</h3>
            <table className="details-table">
              <tr>
                {invoice.transporterName && (
                  <>
                    <td><strong>Transporter Name:</strong></td>
                    <td>{invoice.transporterName}</td>
                  </>
                )}
                {invoice.transporterGSTIN && (
                  <>
                    <td><strong>Transporter GSTIN:</strong></td>
                    <td>{invoice.transporterGSTIN}</td>
                  </>
                )}
              </tr>
              <tr>
                {invoice.driverName && (
                  <>
                    <td><strong>Driver Name:</strong></td>
                    <td>{invoice.driverName}</td>
                  </>
                )}
                {invoice.driverPhone && (
                  <>
                    <td><strong>Driver Phone:</strong></td>
                    <td>{invoice.driverPhone}</td>
                  </>
                )}
              </tr>
              {invoice.distance && (
                <tr>
                  <td><strong>Distance:</strong></td>
                  <td>{invoice.distance} KM</td>
                  <td colSpan="2"></td>
                </tr>
              )}
            </table>
          </div>
        )}

        {/* Bank Details */}
        <div className="bank-section">
          <h3>Bank Details</h3>
          <table className="details-table">
            <tr>
              <td><strong>Bank Name:</strong></td>
              <td>{companySettings.bankName}</td>
              <td><strong>Account Number:</strong></td>
              <td>{companySettings.accountNumber}</td>
            </tr>
            <tr>
              <td><strong>IFSC Code:</strong></td>
              <td>{companySettings.ifscCode}</td>
              <td><strong>Branch:</strong></td>
              <td>{companySettings.bankName}</td>
            </tr>
          </table>
        </div>

        {/* Footer */}
        <div className="invoice-footer">
          <div className="certification">
            <p>Certified that the particulars given above are true and correct.</p>
          </div>
          <div className="signature-section">
            <p><strong>For {companySettings.companyName}</strong></p>
            <div className="signature-space"></div>
            <p>Authorized Signatory</p>
          </div>
        </div>

        {/* Terms and Conditions */}
        {companySettings.termsAndConditions && (
          <div className="terms-section">
            <h4>Terms & Conditions:</h4>
            <p>{companySettings.termsAndConditions}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintInvoice;
