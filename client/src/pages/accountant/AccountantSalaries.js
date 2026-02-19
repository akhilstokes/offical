import React, { useEffect, useState } from 'react';
import { useConfirm } from '../../components/common/ConfirmDialog';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import './AccountantSalaries.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

const AccountantSalaries = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const doConfirm = useConfirm();

  // Track which staff have calculated salaries and their status
  const [staffSalariesInfo, setStaffSalariesInfo] = useState({});

  // Filter State - only one role can be selected at a time
  const [selectedRole, setSelectedRole] = useState('all'); // 'all', 'manager', 'accountant', 'field_staff', 'delivery_staff'

  // Edit Daily Salary State
  const [editingSalaryId, setEditingSalaryId] = useState(null);
  const [editSalaryValue, setEditSalaryValue] = useState('');

  // Calculator Modal State
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [calculatorData, setCalculatorData] = useState({
    // Period selection
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    // For weekly wages
    startDate: '',
    endDate: '',
    numberOfWeeks: 1,
    // Earnings
    workingDays: 0,
    basicSalary: 0,
    medicalAllowance: 0,
    transportationAllowance: 0,
    overtime: 0,
    bonus: 0,
    // Deductions
    providentFund: 0,
    professionalTax: 0,
    incomeTax: 0,
    otherDeductions: 0
  });

  // Payslip Modal State
  const [showPayslip, setShowPayslip] = useState(false);
  const [payslipData, setPayslipData] = useState(null);

  // Credit Salary Modal State
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [bankDetails, setBankDetails] = useState({ accountNumber: '', ifsc: '' });
  const [upiId, setUpiId] = useState('');
  const [upiHandle, setUpiHandle] = useState('@okaxis');
  const [processingPayment, setProcessingPayment] = useState(false);

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyStaff, setHistoryStaff] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load initial data
  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users`, { headers: authHeaders() });
      const data = await res.json();

      const arr = Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : []);
      // Filter staff members (exclude admin, user, lab_manager, lab_staff, and specific manager user)
      const excludedRoles = ['admin', 'user', 'lab_manager', 'lab_staff'];
      const excludedEmails = ['manager@xyz.com']; // Exclude specific manager user
      
      const filteredStaff = arr.filter(u => 
        !excludedRoles.includes(u.role) && 
        !excludedEmails.includes(u.email?.toLowerCase())
      );
      
      setStaff(filteredStaff);
      
      // Check which staff have salary records
      await checkStaffSalaries(filteredStaff);
    } catch (err) {
      setError('Failed to load staff');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  // Check which staff members have calculated salaries
  const checkStaffSalaries = async (staffList) => {
    const info = {};
    
    for (const staffMember of staffList) {
      try {
        const res = await fetch(`${API}/api/salary/history/${staffMember._id}`, {
          headers: authHeaders()
        });
        
        if (res.ok) {
          const response = await res.json();
          // Check if data array exists and has records
          if (response.data && response.data.length > 0) {
            const latest = response.data[0];
            info[staffMember._id] = {
              hasSalary: true,
              status: latest.status || 'pending',
              salaryId: latest._id,
              netSalary: latest.netSalary
            };
          }
        }
      } catch (error) {
        // Ignore errors for individual staff
      }
    }
    
    setStaffSalariesInfo(info);
  };

  // Open Calculator Modal
  const openCalculator = (staffMember) => {
    // Prevent opening calculator if salary already calculated
    if (staffSalariesInfo[staffMember._id]?.hasSalary) {
      toast.info('Salary already calculated for this staff member');
      return;
    }
    
    setSelectedStaff(staffMember);
    
    // Get the staff member's daily salary (custom or default)
    const dailySalary = getDailySalary(staffMember);
    const isWeekly = getWageType(staffMember) === 'Weekly';
    
    setCalculatorData({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      startDate: '',
      endDate: '',
      numberOfWeeks: 1,
      workingDays: isWeekly ? 6 : 26, // Default: 6 days/week or 26 days/month
      basicSalary: dailySalary,
      medicalAllowance: 0,
      transportationAllowance: 0,
      overtime: 0,
      bonus: 0,
      providentFund: 0,
      professionalTax: 0,
      incomeTax: 0,
      otherDeductions: 0
    });
    setShowCalculator(true);
  };

  // Calculate Salary
  const handleCalculateSalary = async (e) => {
    e.preventDefault();
    
    const isWeekly = getWageType(selectedStaff) === 'Weekly';
    
    // Calculate base salary based on wage type
    let baseSalaryAmount = 0;
    if (isWeekly) {
      // Weekly: daily rate × working days × number of weeks
      baseSalaryAmount = (calculatorData.basicSalary || 0) * (calculatorData.workingDays || 0) * (calculatorData.numberOfWeeks || 1);
    } else {
      // Monthly: daily rate × working days
      baseSalaryAmount = (calculatorData.basicSalary || 0) * (calculatorData.workingDays || 0);
    }
    
    const grossSalary = 
      baseSalaryAmount +
      (calculatorData.medicalAllowance || 0) + 
      (calculatorData.transportationAllowance || 0) + 
      (calculatorData.overtime || 0) + 
      (calculatorData.bonus || 0);
    
    const totalDeductions = 
      (calculatorData.providentFund || 0) + 
      (calculatorData.professionalTax || 0) + 
      (calculatorData.incomeTax || 0) + 
      (calculatorData.otherDeductions || 0);
    
    const netSalary = grossSalary - totalDeductions;

    const periodText = isWeekly 
      ? `${calculatorData.numberOfWeeks} week(s) (${calculatorData.startDate} to ${calculatorData.endDate})`
      : `${getMonthName(calculatorData.month)} ${calculatorData.year}`;

    const ok = await doConfirm(
      'Generate Salary', 
      `Generate salary for ${selectedStaff.name} for ${periodText}?\n\nGross: ₹${grossSalary.toFixed(2)}\nDeductions: ₹${totalDeductions.toFixed(2)}\nNet: ₹${netSalary.toFixed(2)}`
    );
    
    if (!ok) return;

    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`${API}/api/salary/generate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          staffId: selectedStaff._id,
          month: calculatorData.month,
          year: calculatorData.year,
          startDate: calculatorData.startDate,
          endDate: calculatorData.endDate,
          numberOfWeeks: calculatorData.numberOfWeeks,
          workingDays: calculatorData.workingDays,
          dailyRate: calculatorData.basicSalary,
          basicSalary: baseSalaryAmount,
          medicalAllowance: calculatorData.medicalAllowance,
          transportationAllowance: calculatorData.transportationAllowance,
          overtime: calculatorData.overtime,
          bonus: calculatorData.bonus,
          grossSalary,
          deductions: {
            providentFund: calculatorData.providentFund,
            professionalTax: calculatorData.professionalTax,
            tax: calculatorData.incomeTax,
            other: calculatorData.otherDeductions
          },
          totalDeductions,
          netSalary,
          wageType: getWageType(selectedStaff)
        }),
      });
      
      if (!res.ok) throw new Error(`Generate failed (${res.status})`);
      
      toast.success('Salary generated successfully');
      
      // Close calculator first
      setShowCalculator(false);
      
      // Prepare payslip data
      const payslip = {
        staff: selectedStaff,
        period: isWeekly 
          ? `${calculatorData.numberOfWeeks} week(s) (${calculatorData.startDate} to ${calculatorData.endDate})`
          : `${getMonthName(calculatorData.month)} ${calculatorData.year}`,
        monthName: getMonthName(calculatorData.month),
        year: calculatorData.year,
        wageType: getWageType(selectedStaff),
        workingDays: calculatorData.workingDays,
        numberOfWeeks: calculatorData.numberOfWeeks,
        dailyRate: calculatorData.basicSalary,
        baseSalary: baseSalaryAmount,
        medicalAllowance: calculatorData.medicalAllowance,
        transportationAllowance: calculatorData.transportationAllowance,
        overtime: calculatorData.overtime,
        bonus: calculatorData.bonus,
        grossSalary,
        deductions: {
          providentFund: calculatorData.providentFund,
          professionalTax: calculatorData.professionalTax,
          incomeTax: calculatorData.incomeTax,
          otherDeductions: calculatorData.otherDeductions
        },
        totalDeductions,
        netSalary,
        generatedDate: new Date().toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        })
      };
      
      // Reload staff list to update button states
      await loadStaff();
      
      // Show payslip after staff list is updated
      setPayslipData(payslip);
      setShowPayslip(true);
    } catch (e) {
      setError(e?.message || 'Failed to generate salary');
    } finally {
      setLoading(false);
    }
  };

  // Open Credit Salary Modal
  const openCreditModal = (staffMember) => {
    const info = staffSalariesInfo[staffMember._id];
    if (!info || !info.hasSalary) {
      toast.warning('Please calculate salary first');
      return;
    }
    
    if (info.status === 'paid' || info.status === 'credited') {
      toast.info('Salary already credited');
      return;
    }

    setSelectedStaff(staffMember);
    setPaymentMethod('bank'); // Default to bank if we have details
    
    // Auto-fill bank details if available in staff object
    setBankDetails({ 
      accountNumber: staffMember.accountNumber || '', 
      ifsc: staffMember.ifscCode || '' 
    });
    
    setUpiId('');
    setUpiHandle('@okaxis');
    setShowCreditModal(true);
  };

  // Handle Credit Salary
  const handleCreditSalary = async () => {
    const info = staffSalariesInfo[selectedStaff._id];
    const salaryId = info.salaryId;

    let remarks = '';
    let transactionId = 'N/A';

    if (paymentMethod === 'bank') {
      if (!bankDetails.accountNumber || !bankDetails.ifsc) {
        toast.error('Please enter bank account number and IFSC');
        return;
      }
      remarks = `Bank Transfer: ${bankDetails.accountNumber} (${bankDetails.ifsc})`;
      transactionId = `BANK-${Date.now()}`;
      
      const ok = await doConfirm(
        'Confirm Payment',
        `Are you sure you want to credit ₹${info.netSalary?.toFixed(2)} to ${selectedStaff.name} via BANK TRANSFER?`
      );
      if (!ok) return;
    } else if (paymentMethod === 'upi') {
      if (!upiId) {
        toast.error('Please enter UPI username');
        return;
      }
      const fullUpiId = upiId.includes('@') ? upiId : `${upiId}${upiHandle}`;
      remarks = `UPI: ${fullUpiId}`;
      transactionId = `UPI-${Date.now()}`;
      
      const ok = await doConfirm(
        'Confirm Payment',
        `Are you sure you want to credit ₹${info.netSalary?.toFixed(2)} to ${selectedStaff.name} via UPI (${fullUpiId})?`
      );
      if (!ok) return;
    } else {
      remarks = 'Paid in Cash';
      transactionId = `CASH-${Date.now()}`;
      
      const ok = await doConfirm(
        'Confirm Payment',
        `Are you sure you want to credit ₹${info.netSalary?.toFixed(2)} to ${selectedStaff.name} via CASH?`
      );
      if (!ok) return;
    }

    try {
      setProcessingPayment(true);
      
      const res = await fetch(`${API}/api/salary/${salaryId}/pay`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          paymentMethod,
          transactionId,
          remarks,
          paymentDate: new Date()
        })
      });

      if (!res.ok) throw new Error('Payment processing failed');

      toast.success('Salary credited successfully');
      setShowCreditModal(false);
      
      // Update local state
      await loadStaff();
      
      // Generate Receipt
      generatePaymentReceipt(selectedStaff, info, { paymentMethod, transactionId, remarks });

    } catch (err) {
      toast.error(err.message || 'Failed to credit salary');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Generate Payment Receipt
  const generatePaymentReceipt = (staff, salaryInfo, payment) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 44, 52);
    doc.text('HOLY FAMILY POLYMERS', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('SALARY PAYMENT RECEIPT', 105, 30, { align: 'center' });
    
    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Info
    doc.setFontSize(12);
    doc.text(`Staff Name: ${staff.name}`, 20, 45);
    doc.text(`Staff ID: ${staff.staffId || 'N/A'}`, 20, 52);
    doc.text(`Role: ${staff.role?.replace('_', ' ').toUpperCase()}`, 20, 59);
    
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 140, 45);
    doc.text(`Receipt No: ${payment.transactionId}`, 140, 52);
    
    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(20, 70, 170, 10, 'F');
    doc.setFont(undefined, 'bold');
    doc.text('Description', 25, 77);
    doc.text('Amount (INR)', 150, 77);
    
    // Content
    doc.setFont(undefined, 'normal');
    doc.text('Net Salary Paid', 25, 90);
    doc.text(`₹${salaryInfo.netSalary?.toFixed(2)}`, 150, 90);
    
    doc.line(20, 95, 190, 95);
    
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL PAID', 25, 105);
    doc.text(`INR ${salaryInfo.netSalary?.toFixed(2)}`, 150, 105);
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    doc.text('Payment Details:', 20, 120);
    const methodDisplay = payment.paymentMethod === 'upi' ? 'UPI' : 
                         payment.paymentMethod === 'bank' ? 'Bank Transfer' : 
                         payment.paymentMethod === 'cash' ? 'Cash' : payment.paymentMethod.toUpperCase();
    doc.text(`Method: ${methodDisplay}`, 25, 130);
    doc.text(`Transaction ID: ${payment.transactionId}`, 25, 140);
    
    if (payment.paymentMethod === 'upi') {
      doc.text(`UPI ID: ${payment.remarks.replace('UPI: ', '')}`, 25, 150);
    } else {
      doc.text(`Remarks: ${payment.remarks}`, 25, 150);
    }
    
    // Footer
    doc.setFontSize(10);
    doc.text('__________________________', 140, 180);
    doc.text('Authorized Signatory', 143, 187);
    
    doc.text('This is a computer generated receipt.', 105, 220, { align: 'center' });
    
    doc.save(`Receipt_${staff.name.replace(' ', '_')}_${Date.now()}.pdf`);
  };

  // Helper function to get month name
  const getMonthName = (monthNum) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNum - 1] || 'Unknown';
  };

  // Generate Payslip
  const generatePayslip = async (staffMember) => {
    // Check if staff has any salary records
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/salary/history/${staffMember._id}`, {
        headers: authHeaders()
      });
      
      if (!res.ok) {
        toast.warning('No salary records found. Please calculate salary first.');
        return;
      }
      
      const response = await res.json();
      
      if (!response.data || response.data.length === 0) {
        toast.warning('No salary records found. Please calculate salary first.');
        return;
      }
      
      // Show the most recent salary record
      const latestSalary = response.data[0];
      const monthName = getMonthName(latestSalary.month);
      
      // Prepare payslip data for modal
      const payslip = {
        staff: staffMember,
        monthName: monthName,
        month: latestSalary.month,
        year: latestSalary.year,
        period: latestSalary.period || `${monthName} ${latestSalary.year}`,
        wageType: latestSalary.wageType || getWageType(staffMember),
        workingDays: latestSalary.presentDays || latestSalary.totalDays || latestSalary.workingDays || 0,
        numberOfWeeks: latestSalary.numberOfWeeks || 1,
        dailyRate: latestSalary.dailyRate || getDailySalary(staffMember),
        basicSalary: latestSalary.basicSalary || 0,
        medicalAllowance: latestSalary.medicalAllowance || 0,
        transportationAllowance: latestSalary.transportationAllowance || 0,
        overtime: latestSalary.overtime || 0,
        bonus: latestSalary.bonus || 0,
        grossSalary: latestSalary.grossSalary || 0,
        deductions: {
          providentFund: latestSalary.deductions?.providentFund || 0,
          professionalTax: latestSalary.deductions?.professionalTax || 0,
          incomeTax: latestSalary.deductions?.tax || latestSalary.deductions?.incomeTax || 0,
          otherDeductions: latestSalary.deductions?.other || latestSalary.deductions?.otherDeductions || 0
        },
        totalDeductions: latestSalary.totalDeductions || 0,
        netSalary: latestSalary.netSalary || 0,
        status: latestSalary.status || 'pending',
        paymentMethod: latestSalary.paymentMethod,
        transactionId: latestSalary.transactionId,
        paymentDate: latestSalary.paymentDate,
        generatedAt: latestSalary.createdAt,
        generatedDate: new Date().toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        }),
        payslipSent: latestSalary.payslipSent || false,
        payslipSentAt: latestSalary.payslipSentAt
      };
      
      // Show payslip modal
      setPayslipData(payslip);
      setShowPayslip(true);
      
    } catch (error) {
      console.error('Error generating payslip:', error);
      toast.error('Failed to fetch salary records');
    } finally {
      setLoading(false);
    }
  };

  // Send Payslip to Staff
  const sendPayslipToStaff = async (payslipData) => {
    try {
      setLoading(true);
      
      // Send notification
      const res = await fetch(`${API}/api/notifications`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          userId: payslipData.staff._id,
          role: 'staff',
          title: 'Salary Payslip Available',
          message: `Your salary for ${payslipData.monthName} ${payslipData.year} is ready. Net Salary: ₹${payslipData.netSalary.toFixed(2)}`,
          link: '/staff/my-salary',
          meta: {
            month: payslipData.monthName,
            year: payslipData.year,
            netSalary: payslipData.netSalary,
            type: 'payslip_notification'
          }
        })
      });

      if (!res.ok) {
        throw new Error('Failed to send notification');
      }

      // Mark payslip as sent in database
      const markSentRes = await fetch(`${API}/api/salary/mark-sent`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          staffId: payslipData.staff._id,
          month: payslipData.month,
          year: payslipData.year
        })
      });

      if (!markSentRes.ok) {
        console.error('Failed to mark payslip as sent');
      }

      // Update payslip data to reflect sent status
      setPayslipData({
        ...payslipData,
        payslipSent: true,
        payslipSentAt: new Date()
      });

      toast.success(`Payslip sent to ${payslipData.staff.name} successfully!`);
    } catch (error) {
      console.error('Error sending payslip:', error);
      toast.error('Failed to send payslip to staff');
    } finally {
      setLoading(false);
    }
  };

  // Open History Modal
  const openHistoryModal = async (staffMember) => {
    setHistoryStaff(staffMember);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    
    try {
      const res = await fetch(`${API}/api/salary/history/${staffMember._id}`, {
        headers: authHeaders()
      });
      
      if (res.ok) {
        const response = await res.json();
        setSalaryHistory(response.data || []);
      } else {
        setSalaryHistory([]);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setSalaryHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // View Payslip from History
  const viewHistoryPayslip = (record) => {
    const monthName = getMonthName(record.month);
    
    const payslip = {
      staff: historyStaff,
      monthName: monthName,
      month: record.month,
      year: record.year,
      period: record.period || `${monthName} ${record.year}`,
      wageType: record.wageType || getWageType(historyStaff),
      workingDays: record.presentDays || record.totalDays || record.workingDays || 0,
      numberOfWeeks: record.numberOfWeeks || 1,
      dailyRate: record.dailyRate || getDailySalary(historyStaff),
      basicSalary: record.basicSalary || 0,
      medicalAllowance: record.medicalAllowance || 0,
      transportationAllowance: record.transportationAllowance || 0,
      overtime: record.overtime || 0,
      bonus: record.bonus || 0,
      grossSalary: record.grossSalary || 0,
      deductions: {
        providentFund: record.deductions?.providentFund || 0,
        professionalTax: record.deductions?.professionalTax || 0,
        incomeTax: record.deductions?.tax || record.deductions?.incomeTax || 0,
        otherDeductions: record.deductions?.other || record.deductions?.otherDeductions || 0
      },
      totalDeductions: record.totalDeductions || 0,
      netSalary: record.netSalary || 0,
      status: record.status || 'pending',
      paymentMethod: record.paymentMethod,
      transactionId: record.transactionId,
      paymentDate: record.paymentDate,
      generatedAt: record.createdAt,
      generatedDate: new Date(record.createdAt).toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }),
      payslipSent: record.payslipSent || false,
      payslipSentAt: record.payslipSentAt
    };
    
    // Close history modal and show payslip
    setShowHistoryModal(false);
    setPayslipData(payslip);
    setShowPayslip(true);
  };

  // Get wage type display
  const getWageType = (staffMember) => {
    // Field staff and delivery staff get weekly wage type
    if (staffMember.role === 'field_staff' || staffMember.role === 'delivery_staff') {
      return 'Weekly';
    }
    
    // Check salaryType field
    if (staffMember.salaryType === 'monthly') return 'Monthly';
    if (staffMember.salaryType === 'weekly') return 'Weekly';
    if (staffMember.salaryType === 'daily') return 'Daily';
    
    // Default to Monthly for other roles
    return 'Monthly';
  };

  // Get daily salary based on role
  const getDailySalary = (staffMember) => {
    // Check if staff has custom daily salary stored
    if (staffMember.dailySalary) {
      return staffMember.dailySalary;
    }
    
    // Default rates based on role
    switch (staffMember.role) {
      case 'manager':
        return 1000;
      case 'accountant':
        return 700;
      case 'lab':
      case 'lab_staff':
        return 750;
      case 'field_staff':
        return 500;
      case 'delivery_staff':
        return 500;
      default:
        return staffMember.baseSalary || 500;
    }
  };

  // Start editing daily salary
  const startEditSalary = (staffMember) => {
    setEditingSalaryId(staffMember._id);
    setEditSalaryValue(getDailySalary(staffMember).toString());
  };

  // Cancel editing
  const cancelEditSalary = () => {
    setEditingSalaryId(null);
    setEditSalaryValue('');
  };

  // Save daily salary
  const saveDailySalary = async (staffMember) => {
    const newSalary = parseFloat(editSalaryValue);
    
    if (isNaN(newSalary) || newSalary < 0) {
      toast.error('Please enter a valid salary amount');
      return;
    }

    try {
      // Optimistic update - update UI immediately
      setStaff(prevStaff => 
        prevStaff.map(s => 
          s._id === staffMember._id 
            ? { ...s, dailySalary: newSalary }
            : s
        )
      );
      
      // Close edit mode immediately
      setEditingSalaryId(null);
      setEditSalaryValue('');
      
      // Update backend in background
      const res = await fetch(`${API}/api/users/${staffMember._id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ dailySalary: newSalary })
      });

      if (!res.ok) {
        // If backend fails, revert the optimistic update
        setStaff(prevStaff => 
          prevStaff.map(s => 
            s._id === staffMember._id 
              ? { ...s, dailySalary: staffMember.dailySalary }
              : s
          )
        );
        throw new Error('Failed to update salary');
      }

      toast.success('Daily salary updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update salary');
    }
  };

  // Handle role filter change
  const handleRoleFilter = (role) => {
    setSelectedRole(role);
  };

  // Get filtered staff based on selected role
  const filteredStaff = selectedRole === 'all' 
    ? staff 
    : staff.filter(s => s.role === selectedRole);

  return (
    <div className="accountant-salaries">
      <div className="salaries-header">
        <h1>Staff Salaries Management</h1>
        <p>Manage staff salaries, calculate wages, and generate payslips</p>
      </div>

      {error && <div className="error-alert">{error}</div>}

      {/* Staff Table */}
      <div className="staff-table-card">
        <div className="table-header">
          <h2>All Staff Members</h2>
          <div className="filter-section">
            <span className="filter-label">Filter by Role:</span>
            <div className="checkbox-filters">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedRole === 'all'}
                  onChange={() => handleRoleFilter('all')}
                />
                <span>All</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedRole === 'manager'}
                  onChange={() => handleRoleFilter('manager')}
                />
                <span>Manager Only</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedRole === 'accountant'}
                  onChange={() => handleRoleFilter('accountant')}
                />
                <span>Accountant Only</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedRole === 'field_staff'}
                  onChange={() => handleRoleFilter('field_staff')}
                />
                <span>Field Staff Only</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedRole === 'delivery_staff'}
                  onChange={() => handleRoleFilter('delivery_staff')}
                />
                <span>Delivery Staff Only</span>
              </label>
            </div>
          </div>
        </div>
        <p className="staff-count">{filteredStaff.length} staff members</p>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading staff...</p>
          </div>
        ) : filteredStaff.length > 0 ? (
          <div className="table-wrapper">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>S.NO</th>
                  <th>STAFF NAME</th>
                  <th>ROLE</th>
                  <th>DAILY SALARY</th>
                  <th>SALARY TYPE (WEEKLY/MONTHLY)</th>
                  <th>CALCULATOR</th>
                  <th>PAYSLIP</th>
                  <th>PAYMENT</th>
                  <th>HISTORY</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((s, idx) => (
                  <tr key={s._id}>
                    <td>{idx + 1}</td>
                    <td>
                      <div className="staff-name-cell">
                        <div className="staff-avatar">
                          {s.name?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div>
                          <div className="staff-name">{s.name || 'N/A'}</div>
                          <div className="staff-email">{s.email || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="role-badge">
                        {s.role?.replace('_', ' ').toUpperCase() || 'STAFF'}
                      </span>
                    </td>
                    <td>
                      {editingSalaryId === s._id ? (
                        <div className="salary-edit-cell">
                          <input
                            type="number"
                            className="salary-edit-input"
                            value={editSalaryValue}
                            onChange={(e) => setEditSalaryValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveDailySalary(s);
                              if (e.key === 'Escape') cancelEditSalary();
                            }}
                            autoFocus
                          />
                          <button 
                            className="salary-save-btn"
                            onClick={() => saveDailySalary(s)}
                            disabled={loading}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button 
                            className="salary-cancel-btn"
                            onClick={cancelEditSalary}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="salary-display-cell">
                          <span className="daily-salary">₹{getDailySalary(s)}</span>
                          <button 
                            className="salary-edit-btn"
                            onClick={() => startEditSalary(s)}
                            title="Edit daily salary"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="wage-type-badge">
                        {getWageType(s)}
                      </span>
                    </td>
                    <td>
                      <button 
                        className={`action-btn calculator-btn ${staffSalariesInfo[s._id]?.hasSalary ? 'disabled' : ''}`}
                        onClick={() => openCalculator(s)}
                        disabled={loading || staffSalariesInfo[s._id]?.hasSalary}
                        title={staffSalariesInfo[s._id]?.hasSalary ? 'Salary already calculated' : 'Calculate salary'}
                      >
                        <i className="fas fa-calculator"></i> {staffSalariesInfo[s._id]?.hasSalary ? 'CALCULATED' : 'CALCULATE'}
                      </button>
                    </td>
                    <td>
                      <button 
                        className={`action-btn payslip-btn ${!staffSalariesInfo[s._id]?.hasSalary ? 'disabled' : ''}`}
                        onClick={() => generatePayslip(s)}
                        disabled={loading || !staffSalariesInfo[s._id]?.hasSalary}
                        title={!staffSalariesInfo[s._id]?.hasSalary ? 'Calculate salary first' : 'Generate payslip'}
                      >
                        <i className="fas fa-file-invoice-dollar"></i> PAYSLIP
                      </button>
                    </td>
                    <td>
                      <button 
                        className={`action-btn payment-btn ${
                          !staffSalariesInfo[s._id]?.hasSalary ? 'disabled' : ''
                        }`}
                        onClick={() => openCreditModal(s)}
                        disabled={
                          loading || 
                          !staffSalariesInfo[s._id]?.hasSalary
                        }
                        title={
                          !staffSalariesInfo[s._id]?.hasSalary 
                            ? 'Calculate salary first' 
                            : (staffSalariesInfo[s._id]?.status === 'paid' || staffSalariesInfo[s._id]?.status === 'credited' 
                                ? 'Edit payment details' 
                                : 'Credit Salary')
                        }
                      >
                        <i className="fas fa-money-bill-wave"></i> {
                          staffSalariesInfo[s._id]?.status === 'paid' || staffSalariesInfo[s._id]?.status === 'credited' 
                            ? 'CREDITED' 
                            : 'CREDIT SALARY'
                        }
                      </button>
                    </td>
                    <td>
                      <button 
                        className="action-btn history-btn"
                        onClick={() => openHistoryModal(s)}
                        disabled={loading}
                        title="View salary history"
                      >
                        <i className="fas fa-folder-open"></i> HISTORY
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-users"></i>
            <p>No staff members found</p>
          </div>
        )}
      </div>

      {/* Calculator Modal */}
      {showCalculator && selectedStaff && (
        <div className="modal-overlay" onClick={() => setShowCalculator(false)}>
          <div className="modal-content calculator-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Salary Calculator</h3>
              <button className="close-btn" onClick={() => setShowCalculator(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="staff-info-banner">
              <div className="staff-avatar-large">
                {selectedStaff.name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div>
                <h4>{selectedStaff.name}</h4>
                <p>{selectedStaff.role?.replace('_', ' ')} • {getWageType(selectedStaff)}</p>
              </div>
            </div>

            <form onSubmit={handleCalculateSalary}>
              {/* Period Selection - Different for Weekly vs Monthly */}
              {getWageType(selectedStaff) === 'Weekly' ? (
                <>
                  <div className="section-title">Weekly Period Selection</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={calculatorData.startDate}
                        onChange={e => setCalculatorData({ ...calculatorData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input
                        type="date"
                        value={calculatorData.endDate}
                        onChange={e => setCalculatorData({ ...calculatorData, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Number of Weeks</label>
                      <input
                        type="number"
                        min="1"
                        max="52"
                        value={calculatorData.numberOfWeeks}
                        onChange={e => setCalculatorData({ ...calculatorData, numberOfWeeks: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Working Days</label>
                      <input
                        type="number"
                        min="1"
                        max="7"
                        value={calculatorData.workingDays}
                        onChange={e => setCalculatorData({ ...calculatorData, workingDays: Number(e.target.value) })}
                        required
                      />
                      <small style={{color: '#6b7280', fontSize: '11px'}}>Days per week</small>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="section-title">Monthly Period Selection</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Month</label>
                      <select
                        value={calculatorData.month}
                        onChange={e => setCalculatorData({ ...calculatorData, month: Number(e.target.value) })}
                        required
                        style={{padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px'}}
                      >
                        <option value={1}>January</option>
                        <option value={2}>February</option>
                        <option value={3}>March</option>
                        <option value={4}>April</option>
                        <option value={5}>May</option>
                        <option value={6}>June</option>
                        <option value={7}>July</option>
                        <option value={8}>August</option>
                        <option value={9}>September</option>
                        <option value={10}>October</option>
                        <option value={11}>November</option>
                        <option value={12}>December</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Year</label>
                      <input
                        type="number"
                        min="2020"
                        max="2100"
                        value={calculatorData.year}
                        onChange={e => setCalculatorData({ ...calculatorData, year: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Working Days</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={calculatorData.workingDays}
                        onChange={e => setCalculatorData({ ...calculatorData, workingDays: Number(e.target.value) })}
                        required
                      />
                      <small style={{color: '#6b7280', fontSize: '11px'}}>Days worked in the month</small>
                    </div>
                    <div className="form-group">
                      <label>Daily Rate</label>
                      <input
                        type="number"
                        value={calculatorData.basicSalary}
                        onChange={e => setCalculatorData({ ...calculatorData, basicSalary: Number(e.target.value) })}
                        required
                      />
                      <small style={{color: '#6b7280', fontSize: '11px'}}>₹ per day</small>
                    </div>
                  </div>
                </>
              )}

              <div className="section-title">Additional Earnings</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Medical Allowance</label>
                  <input
                    type="number"
                    value={calculatorData.medicalAllowance}
                    onChange={e => setCalculatorData({ ...calculatorData, medicalAllowance: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Transportation Allowance</label>
                  <input
                    type="number"
                    value={calculatorData.transportationAllowance}
                    onChange={e => setCalculatorData({ ...calculatorData, transportationAllowance: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Overtime</label>
                  <input
                    type="number"
                    value={calculatorData.overtime}
                    onChange={e => setCalculatorData({ ...calculatorData, overtime: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Bonus</label>
                  <input
                    type="number"
                    value={calculatorData.bonus}
                    onChange={e => setCalculatorData({ ...calculatorData, bonus: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="section-title">Deductions</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Provident Fund</label>
                  <input
                    type="number"
                    value={calculatorData.providentFund}
                    onChange={e => setCalculatorData({ ...calculatorData, providentFund: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Professional Tax</label>
                  <input
                    type="number"
                    value={calculatorData.professionalTax}
                    onChange={e => setCalculatorData({ ...calculatorData, professionalTax: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Income Tax</label>
                  <input
                    type="number"
                    value={calculatorData.incomeTax}
                    onChange={e => setCalculatorData({ ...calculatorData, incomeTax: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Other Deductions</label>
                  <input
                    type="number"
                    value={calculatorData.otherDeductions}
                    onChange={e => setCalculatorData({ ...calculatorData, otherDeductions: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="salary-summary">
                <div className="summary-row">
                  <span>Base Salary:</span>
                  <span className="amount">
                    ₹{(() => {
                      const isWeekly = selectedStaff && getWageType(selectedStaff) === 'Weekly';
                      if (isWeekly) {
                        return ((calculatorData.basicSalary || 0) * (calculatorData.workingDays || 0) * (calculatorData.numberOfWeeks || 1)).toFixed(2);
                      } else {
                        return ((calculatorData.basicSalary || 0) * (calculatorData.workingDays || 0)).toFixed(2);
                      }
                    })()}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Additional Earnings:</span>
                  <span className="amount">
                    +₹{(
                      (calculatorData.medicalAllowance || 0) + 
                      (calculatorData.transportationAllowance || 0) + 
                      (calculatorData.overtime || 0) + 
                      (calculatorData.bonus || 0)
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Gross Salary:</span>
                  <span className="amount">
                    ₹{(() => {
                      const isWeekly = selectedStaff && getWageType(selectedStaff) === 'Weekly';
                      const baseSalary = isWeekly 
                        ? (calculatorData.basicSalary || 0) * (calculatorData.workingDays || 0) * (calculatorData.numberOfWeeks || 1)
                        : (calculatorData.basicSalary || 0) * (calculatorData.workingDays || 0);
                      return (
                        baseSalary +
                        (calculatorData.medicalAllowance || 0) + 
                        (calculatorData.transportationAllowance || 0) + 
                        (calculatorData.overtime || 0) + 
                        (calculatorData.bonus || 0)
                      ).toFixed(2);
                    })()}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Total Deductions:</span>
                  <span className="amount deduction">
                    -₹{(
                      (calculatorData.providentFund || 0) + 
                      (calculatorData.professionalTax || 0) + 
                      (calculatorData.incomeTax || 0) + 
                      (calculatorData.otherDeductions || 0)
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="summary-row total">
                  <span>Net Salary:</span>
                  <span className="amount">
                    ₹{(() => {
                      const isWeekly = selectedStaff && getWageType(selectedStaff) === 'Weekly';
                      const baseSalary = isWeekly 
                        ? (calculatorData.basicSalary || 0) * (calculatorData.workingDays || 0) * (calculatorData.numberOfWeeks || 1)
                        : (calculatorData.basicSalary || 0) * (calculatorData.workingDays || 0);
                      return (
                        baseSalary +
                        (calculatorData.medicalAllowance || 0) + 
                        (calculatorData.transportationAllowance || 0) + 
                        (calculatorData.overtime || 0) + 
                        (calculatorData.bonus || 0) -
                        (calculatorData.providentFund || 0) - 
                        (calculatorData.professionalTax || 0) - 
                        (calculatorData.incomeTax || 0) - 
                        (calculatorData.otherDeductions || 0)
                      ).toFixed(2);
                    })()}
                  </span>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowCalculator(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Generating...' : 'Generate Salary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {showPayslip && payslipData && (
        <div className="modal-overlay" onClick={() => setShowPayslip(false)}>
          <div className="modal-content payslip-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Salary Payslip</h3>
              <button className="close-btn" onClick={() => setShowPayslip(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="payslip-content">
              {/* Company Header */}
              <div className="payslip-header">
                <h2>Holy Family Polymers</h2>
                <h3>Salary Slip</h3>
                <p className="payslip-month">{payslipData.monthName} {payslipData.year}</p>
                <p className="generated-date">Generated on: {payslipData.generatedDate}</p>
              </div>

              {/* Employee Details */}
              <div className="payslip-section">
                <h4>Employee Details</h4>
                <div className="detail-grid">
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{payslipData.staff.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{payslipData.staff.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Role:</span>
                    <span className="detail-value">{payslipData.staff.role?.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Wage Type:</span>
                    <span className="detail-value">{payslipData.wageType}</span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              {(payslipData.status === 'paid' || payslipData.status === 'credited') && (
                <div className="payslip-section" style={{ borderLeft: '4px solid #f97316' }}>
                  <h4>Payment Information</h4>
                  <div className="detail-grid">
                    <div className="detail-row">
                      <span className="detail-label">Status:</span>
                      <span className="detail-value" style={{ color: '#10b981' }}>CREDITED</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Payment Method:</span>
                      <span className="detail-value">
                        {payslipData.paymentMethod === 'upi' ? 'Paid via UPI' : 
                         payslipData.paymentMethod === 'bank' ? 'Bank Transfer' : 
                         payslipData.paymentMethod === 'cash' ? 'Cash Payment' : 'N/A'}
                      </span>
                    </div>
                    {payslipData.transactionId && (
                      <div className="detail-row">
                        <span className="detail-label">Transaction ID:</span>
                        <span className="detail-value">{payslipData.transactionId}</span>
                      </div>
                    )}
                    {payslipData.paymentDate && (
                      <div className="detail-row">
                        <span className="detail-label">Payment Date:</span>
                        <span className="detail-value">
                          {new Date(payslipData.paymentDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Salary Period */}
              <div className="payslip-section">
                <h4>Salary Period</h4>
                <div className="detail-grid">
                  <div className="detail-row">
                    <span className="detail-label">Period:</span>
                    <span className="detail-value">{payslipData.period}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Working Days:</span>
                    <span className="detail-value">
                      {payslipData.workingDays} {payslipData.wageType === 'Weekly' ? `days/week × ${payslipData.numberOfWeeks} weeks` : 'days'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Daily Rate:</span>
                    <span className="detail-value">₹{(payslipData.dailyRate || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="payslip-section">
                <h4>Earnings</h4>
                <div className="breakdown-table">
                  <div className="breakdown-row">
                    <span>Base Salary</span>
                    <span>₹{(payslipData.baseSalary || 0).toFixed(2)}</span>
                  </div>
                  {(payslipData.medicalAllowance || 0) > 0 && (
                    <div className="breakdown-row">
                      <span>Medical Allowance</span>
                      <span>₹{(payslipData.medicalAllowance || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(payslipData.transportationAllowance || 0) > 0 && (
                    <div className="breakdown-row">
                      <span>Transportation Allowance</span>
                      <span>₹{(payslipData.transportationAllowance || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(payslipData.overtime || 0) > 0 && (
                    <div className="breakdown-row">
                      <span>Overtime</span>
                      <span>₹{(payslipData.overtime || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(payslipData.bonus || 0) > 0 && (
                    <div className="breakdown-row">
                      <span>Bonus</span>
                      <span>₹{(payslipData.bonus || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="breakdown-row total">
                    <span>Gross Salary</span>
                    <span>₹{(payslipData.grossSalary || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div className="payslip-section">
                <h4>Deductions</h4>
                <div className="breakdown-table">
                  {(payslipData.deductions?.providentFund || 0) > 0 && (
                    <div className="breakdown-row deduction">
                      <span>Provident Fund</span>
                      <span>₹{(payslipData.deductions?.providentFund || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(payslipData.deductions?.professionalTax || 0) > 0 && (
                    <div className="breakdown-row deduction">
                      <span>Professional Tax</span>
                      <span>₹{(payslipData.deductions?.professionalTax || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(payslipData.deductions?.incomeTax || 0) > 0 && (
                    <div className="breakdown-row deduction">
                      <span>Income Tax</span>
                      <span>₹{(payslipData.deductions?.incomeTax || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(payslipData.deductions?.otherDeductions || 0) > 0 && (
                    <div className="breakdown-row deduction">
                      <span>Other Deductions</span>
                      <span>₹{(payslipData.deductions?.otherDeductions || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(payslipData.totalDeductions || 0) === 0 && (
                    <div className="breakdown-row">
                      <span>No Deductions</span>
                      <span>₹0.00</span>
                    </div>
                  )}
                  {(payslipData.totalDeductions || 0) > 0 && (
                    <div className="breakdown-row total deduction">
                      <span>Total Deductions</span>
                      <span>₹{(payslipData.totalDeductions || 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Net Salary */}
              <div className="payslip-net-salary">
                <div className="net-salary-row">
                  <span>Net Salary</span>
                  <span className="net-amount">₹{(payslipData.netSalary || 0).toFixed(2)}</span>
                </div>
                <p className="net-salary-words">
                  (Amount in words: {convertToWords(payslipData.netSalary || 0)} Rupees Only)
                </p>
              </div>

              {/* Footer Note */}
              <div className="payslip-footer">
                <p>This is a computer-generated payslip and does not require a signature.</p>
              </div>
            </div>

            <div className="modal-actions">
              {!payslipData.payslipSent ? (
                <button 
                  type="button" 
                  onClick={() => sendPayslipToStaff(payslipData)} 
                  className="btn-success"
                  disabled={loading}
                >
                  <i className="fas fa-paper-plane"></i> Send to Staff
                </button>
              ) : (
                <div className="payslip-sent-badge">
                  <i className="fas fa-check-circle"></i> Payslip Sent
                  {payslipData.payslipSentAt && (
                    <span className="sent-date">
                      {new Date(payslipData.payslipSentAt).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </div>
              )}
              <button 
                type="button" 
                onClick={() => window.print()} 
                className="btn-secondary"
              >
                <i className="fas fa-print"></i> Print
              </button>
              <button 
                type="button" 
                onClick={() => setShowPayslip(false)} 
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Salary Modal */}
      {showCreditModal && selectedStaff && (
        <div className="modal-overlay" onClick={() => setShowCreditModal(false)}>
          <div className="modal-content credit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Credit Salary to {selectedStaff.name}</h3>
              <button className="close-btn" onClick={() => setShowCreditModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="credit-modal-body">
              <div className="payment-summary-box">
                <div className="summary-item">
                  <span>Net Salary:</span>
                  <span className="amount">₹{staffSalariesInfo[selectedStaff._id]?.netSalary?.toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span>Period:</span>
                  <span>{staffSalariesInfo[selectedStaff._id]?.period || 'Current Month'}</span>
                </div>
              </div>

              <div className="payment-options">
                <label className="section-label">Select Payment Method</label>
                <div className="options-grid">
                  <div 
                    className={`option-card ${paymentMethod === 'cash' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <i className="fas fa-money-bill-wave"></i>
                    <span>Cash</span>
                  </div>
                  <div 
                    className={`option-card ${paymentMethod === 'bank' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('bank')}
                  >
                    <i className="fas fa-university"></i>
                    <span>Bank Transfer</span>
                  </div>
                  <div 
                    className={`option-card ${paymentMethod === 'upi' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('upi')}
                  >
                    <i className="fas fa-mobile-alt"></i>
                    <span>UPI</span>
                  </div>
                </div>
              </div>

              {paymentMethod === 'bank' && (
                <div className="payment-form">
                  <div className="form-group">
                    <label>Bank Account Number</label>
                    <input 
                      type="text" 
                      placeholder="Enter Account Number"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>IFSC Code</label>
                    <input 
                      type="text" 
                      placeholder="Enter IFSC Code"
                      value={bankDetails.ifsc}
                      onChange={(e) => setBankDetails({...bankDetails, ifsc: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div className="payment-form">
                  <div className="form-group">
                    <label>UPI ID</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="username"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <select 
                        value={upiHandle} 
                        onChange={(e) => setUpiHandle(e.target.value)}
                        style={{ 
                          padding: '10px', 
                          borderRadius: '6px', 
                          border: '1px solid #d1d5db',
                          background: '#f9fafb',
                          fontWeight: '600',
                          color: '#374151',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="@okaxis">@okaxis</option>
                        <option value="@hdfc">@hdfc</option>
                        <option value="@ybl">@ybl</option>
                        <option value="@upi">@upi</option>
                        <option value="@icici">@icici</option>
                        <option value="@sbi">@sbi</option>
                      </select>
                    </div>
                    <small className="help-text" style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px', display: 'block' }}>
                      Enter the UPI username and select the bank handle.
                    </small>
                  </div>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="info-notice">
                  <i className="fas fa-info-circle"></i>
                  <span>Please ensure the cash is handed over before confirming.</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCreditModal(false)}>Cancel</button>
              <button 
                className="btn-primary credit-submit-btn" 
                onClick={handleCreditSalary}
                disabled={processingPayment}
              >
                {processingPayment ? 'Processing...' : `Confirm & Credit ₹${staffSalariesInfo[selectedStaff._id]?.netSalary?.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && historyStaff && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Salary History - {historyStaff.name}</h3>
                <p className="history-subtitle">{historyStaff.email}</p>
              </div>
              <button className="close-btn" onClick={() => setShowHistoryModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="history-content">
              {loadingHistory ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading history...</p>
                </div>
              ) : salaryHistory.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-folder-open"></i>
                  <p>No salary records found</p>
                </div>
              ) : (
                <div className="history-folders">
                  {salaryHistory.map((record, index) => (
                    <div key={record._id || index} className="history-folder">
                      <div className="folder-icon">
                        <i className="fas fa-folder"></i>
                      </div>
                      <div className="folder-content">
                        <div className="folder-header">
                          <h4>{getMonthName(record.month)} {record.year}</h4>
                          <span className={`status-badge badge-${record.status || 'pending'}`}>
                            {(record.status || 'pending').toUpperCase()}
                          </span>
                        </div>
                        <div className="folder-details">
                          <div className="detail-item">
                            <i className="fas fa-calendar"></i>
                            <span>Generated: {new Date(record.createdAt).toLocaleDateString('en-IN')}</span>
                          </div>
                          <div className="detail-item">
                            <i className="fas fa-rupee-sign"></i>
                            <span>Net Salary: ₹{record.netSalary?.toFixed(2)}</span>
                          </div>
                          <div className="detail-item">
                            <i className="fas fa-briefcase"></i>
                            <span>{record.wageType || 'Monthly'}</span>
                          </div>
                        </div>
                        <button 
                          className="view-payslip-btn"
                          onClick={() => viewHistoryPayslip(record)}
                        >
                          <i className="fas fa-file-invoice"></i>
                          View Payslip
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to convert number to words (for Indian numbering system)
function convertToWords(amount) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  if (amount === 0) return 'Zero';
  
  const num = Math.floor(amount);
  let words = '';
  
  // Lakhs
  if (num >= 100000) {
    words += convertToWords(Math.floor(num / 100000)) + ' Lakh ';
    amount = num % 100000;
  }
  
  // Thousands
  if (num >= 1000) {
    words += convertToWords(Math.floor(num / 1000)) + ' Thousand ';
    amount = num % 1000;
  }
  
  // Hundreds
  if (num >= 100) {
    words += ones[Math.floor(num / 100)] + ' Hundred ';
    amount = num % 100;
  }
  
  // Tens and Ones
  if (num >= 20) {
    words += tens[Math.floor(num / 10)] + ' ';
    words += ones[num % 10];
  } else if (num >= 10) {
    words += teens[num - 10];
  } else if (num > 0) {
    words += ones[num];
  }
  
  return words.trim();
}

export default AccountantSalaries;
