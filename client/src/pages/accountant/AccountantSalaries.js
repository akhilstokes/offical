import React, { useEffect, useState } from 'react';
import { useConfirm } from '../../components/common/ConfirmDialog';
import { toast } from 'react-toastify';
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

  // Track which staff have calculated salaries
  const [staffWithSalaries, setStaffWithSalaries] = useState(new Set());

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
    const staffIds = new Set();
    
    for (const staffMember of staffList) {
      try {
        const res = await fetch(`${API}/api/salary/history/${staffMember._id}`, {
          headers: authHeaders()
        });
        
        if (res.ok) {
          const response = await res.json();
          // Check if data array exists and has records
          if (response.data && response.data.length > 0) {
            staffIds.add(staffMember._id);
          }
        }
      } catch (error) {
        // Ignore errors for individual staff
      }
    }
    
    setStaffWithSalaries(staffIds);
  };

  // Open Calculator Modal
  const openCalculator = (staffMember) => {
    // Prevent opening calculator if salary already calculated
    if (staffWithSalaries.has(staffMember._id)) {
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
      
      toast.success(`Payslip for ${staffMember.name} - ${monthName} ${latestSalary.year}\nNet Salary: ₹${latestSalary.netSalary.toFixed(2)}`);
      
      // TODO: Generate actual PDF payslip here
      // For now, just show the data
      console.log('Payslip Data:', latestSalary);
      
    } catch (error) {
      toast.error('Failed to fetch salary records');
    }
  };

  // Send Payslip to Staff
  const sendPayslipToStaff = async (payslipData) => {
    try {
      setLoading(true);
      
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

      toast.success(`Payslip sent to ${payslipData.staff.name} successfully!`);
    } catch (error) {
      console.error('Error sending payslip:', error);
      toast.error('Failed to send payslip to staff');
    } finally {
      setLoading(false);
    }
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
                        className={`action-btn calculator-btn ${staffWithSalaries.has(s._id) ? 'disabled' : ''}`}
                        onClick={() => openCalculator(s)}
                        disabled={loading || staffWithSalaries.has(s._id)}
                        title={staffWithSalaries.has(s._id) ? 'Salary already calculated' : 'Calculate salary'}
                      >
                        <i className="fas fa-calculator"></i> {staffWithSalaries.has(s._id) ? 'Calculated' : 'Calculate'}
                      </button>
                    </td>
                    <td>
                      <button 
                        className={`action-btn payslip-btn ${!staffWithSalaries.has(s._id) ? 'disabled' : ''}`}
                        onClick={() => generatePayslip(s)}
                        disabled={loading || !staffWithSalaries.has(s._id)}
                        title={!staffWithSalaries.has(s._id) ? 'Calculate salary first' : 'Generate payslip'}
                      >
                        <i className="fas fa-file-invoice"></i> Payslip
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
                    <span className="detail-value">₹{payslipData.dailyRate.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="payslip-section">
                <h4>Earnings</h4>
                <div className="breakdown-table">
                  <div className="breakdown-row">
                    <span>Base Salary</span>
                    <span>₹{payslipData.baseSalary.toFixed(2)}</span>
                  </div>
                  {payslipData.medicalAllowance > 0 && (
                    <div className="breakdown-row">
                      <span>Medical Allowance</span>
                      <span>₹{payslipData.medicalAllowance.toFixed(2)}</span>
                    </div>
                  )}
                  {payslipData.transportationAllowance > 0 && (
                    <div className="breakdown-row">
                      <span>Transportation Allowance</span>
                      <span>₹{payslipData.transportationAllowance.toFixed(2)}</span>
                    </div>
                  )}
                  {payslipData.overtime > 0 && (
                    <div className="breakdown-row">
                      <span>Overtime</span>
                      <span>₹{payslipData.overtime.toFixed(2)}</span>
                    </div>
                  )}
                  {payslipData.bonus > 0 && (
                    <div className="breakdown-row">
                      <span>Bonus</span>
                      <span>₹{payslipData.bonus.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="breakdown-row total">
                    <span>Gross Salary</span>
                    <span>₹{payslipData.grossSalary.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div className="payslip-section">
                <h4>Deductions</h4>
                <div className="breakdown-table">
                  {payslipData.deductions.providentFund > 0 && (
                    <div className="breakdown-row deduction">
                      <span>Provident Fund</span>
                      <span>₹{payslipData.deductions.providentFund.toFixed(2)}</span>
                    </div>
                  )}
                  {payslipData.deductions.professionalTax > 0 && (
                    <div className="breakdown-row deduction">
                      <span>Professional Tax</span>
                      <span>₹{payslipData.deductions.professionalTax.toFixed(2)}</span>
                    </div>
                  )}
                  {payslipData.deductions.incomeTax > 0 && (
                    <div className="breakdown-row deduction">
                      <span>Income Tax</span>
                      <span>₹{payslipData.deductions.incomeTax.toFixed(2)}</span>
                    </div>
                  )}
                  {payslipData.deductions.otherDeductions > 0 && (
                    <div className="breakdown-row deduction">
                      <span>Other Deductions</span>
                      <span>₹{payslipData.deductions.otherDeductions.toFixed(2)}</span>
                    </div>
                  )}
                  {payslipData.totalDeductions === 0 && (
                    <div className="breakdown-row">
                      <span>No Deductions</span>
                      <span>₹0.00</span>
                    </div>
                  )}
                  {payslipData.totalDeductions > 0 && (
                    <div className="breakdown-row total deduction">
                      <span>Total Deductions</span>
                      <span>₹{payslipData.totalDeductions.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Net Salary */}
              <div className="payslip-net-salary">
                <div className="net-salary-row">
                  <span>Net Salary</span>
                  <span className="net-amount">₹{payslipData.netSalary.toFixed(2)}</span>
                </div>
                <p className="net-salary-words">
                  (Amount in words: {convertToWords(payslipData.netSalary)} Rupees Only)
                </p>
              </div>

              {/* Footer Note */}
              <div className="payslip-footer">
                <p>This is a computer-generated payslip and does not require a signature.</p>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                onClick={() => sendPayslipToStaff(payslipData)} 
                className="btn-success"
                disabled={loading}
              >
                <i className="fas fa-paper-plane"></i> Send to Staff
              </button>
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
