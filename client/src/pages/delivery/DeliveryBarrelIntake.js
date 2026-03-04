import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './DeliveryTheme.css';

const DeliveryBarrelIntake = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    barrelCount: 0,
    date: new Date().toLocaleString('en-IN'),
    taskId: '',
    requestId: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Review info, Step 2: Enter time, Step 3: Confirm and send
  const [arrivalTime, setArrivalTime] = useState('');
  const [intakeData, setIntakeData] = useState(null); // Store intake data for step 3
  const [sendingNotification, setSendingNotification] = useState(false);

  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Load customer details from URL parameters
  useEffect(() => {
    const name = searchParams.get('customerName') || '';
    const phone = searchParams.get('customerPhone') || '';
    const barrelCount = parseInt(searchParams.get('barrelCount')) || 0;
    const taskId = searchParams.get('taskId') || '';
    const reqId = searchParams.get('requestId') || '';
    
    console.log('URL Parameters:', {
      name,
      phone,
      barrelCount,
      taskId,
      requestId: reqId,
      allParams: Object.fromEntries(searchParams.entries())
    });
    
    // Reset all state when new parameters are loaded
    setStep(1);
    setMessage('');
    setError('');
    setLoading(false);
    setIntakeData(null);
    setSendingNotification(false);
    
    setCustomerInfo({
      name,
      phone,
      barrelCount,
      date: new Date().toLocaleString('en-IN'),
      taskId,
      requestId: reqId
    });

    // Auto-fill current time in datetime-local format
    const now = new Date();
    const timeString = now.toISOString().slice(0, 16);
    setArrivalTime(timeString);
  }, [searchParams]);

  const handleProceed = () => {
    setMessage(''); 
    setError('');
    
    if (!customerInfo.name || !customerInfo.phone) {
      setError('Customer information is missing');
      return;
    }
    
    if (!customerInfo.requestId) {
      setError('⚠️ Warning: Request ID is not assigned. You can still proceed, but it\'s recommended to have a Request ID from the manager.');
      // Allow proceeding after showing warning
      setTimeout(() => {
        setError('');
        setStep(2);
      }, 3000);
      return;
    }

    // Move to step 2
    setStep(2);
  };

  const handleSubmit = async () => {
    setMessage(''); 
    setError('');
    
    if (!arrivalTime) {
      setError('Please enter arrival time');
      return;
    }
    
    // Prevent multiple submissions
    if (loading) {
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      const headers = { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      };
 
      // Create intake record
      const payload = {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        barrelCount: customerInfo.barrelCount,
        taskId: customerInfo.taskId,
        requestId: customerInfo.requestId,
        arrivalTime: new Date(arrivalTime).toISOString(),
        address: 'Pickup location' // Default address for delivery staff intake
      };
      
      console.log('Submitting barrel intake:', payload);
      
      const res = await fetch(`${apiBase}/api/delivery/barrels/intake`, { 
        method: 'POST', 
        headers, 
        body: JSON.stringify(payload) 
      });
      
      console.log('Response status:', res.status);
      
      if (res.status === 401) {
        setError('Session expired. Please log in again.');
        setLoading(false);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to submit intake (${res.status})`);
      }
      
      const responseData = await res.json();
      
      // Update task status to completed if taskId exists (remove 'sr_' prefix if present)
      const actualTaskId = customerInfo.taskId.startsWith('sr_') 
        ? customerInfo.taskId.substring(3) 
        : customerInfo.taskId;
      
      if (actualTaskId && actualTaskId.match(/^[a-fA-F0-9]{24}$/)) {
        try {
          await fetch(`${apiBase}/api/delivery/${actualTaskId}/status`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ status: 'intake_completed' })
          });
          console.log('Task status updated to intake_completed');
        } catch (updateError) {
          console.log('Task status update failed (non-critical):', updateError);
        }
      }
      
      // Mark sell request as delivered to lab if requestId exists
      if (customerInfo.requestId && customerInfo.requestId.match(/^[a-fA-F0-9]{24}$/)) {
        try {
          await fetch(`${apiBase}/api/sell-requests/${customerInfo.requestId}/deliver-to-lab`, {
            method: 'PUT',
            headers
          });
          console.log('Sell request marked as delivered to lab');
        } catch (updateError) {
          console.log('Sell request status update failed (non-critical):', updateError);
        }
      }
      
      // Store intake data and move to step 3 (confirmation)
      setIntakeData({
        ...responseData,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        barrelCount: customerInfo.barrelCount,
        requestId: customerInfo.requestId || 'Not assigned',
        arrivalTime: new Date(arrivalTime).toLocaleString('en-IN'),
        actualTaskId
      });
      
      setMessage('✅ Barrel intake completed successfully! Please review and send to Lab & Accountant.');
      setLoading(false);
      setStep(3); // Move to confirmation step
      
    } catch (e) {
      console.error('Barrel intake error:', e);
      setError(e?.message || 'Failed to submit intake');
      setLoading(false);
    }
  };

  const handleSendNotifications = async () => {
    if (sendingNotification) return;
    
    try {
      setSendingNotification(true);
      const token = localStorage.getItem('token');
      const headers = { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      };
      
      const sampleId = customerInfo.requestId || intakeData.actualTaskId || intakeData._id;
      
      // Build check-in URL with parameters
      const checkInParams = new URLSearchParams({
        sampleId: String(sampleId),
        customerName: customerInfo.name,
        barrelCount: String(customerInfo.barrelCount),
        receivedAt: new Date(arrivalTime).toISOString().slice(0, 16)
      });
      const checkInUrl = `/lab/check-in?${checkInParams.toString()}`;
      
      // Send notification to lab staff
      await fetch(`${apiBase}/api/notifications/staff-trip-event`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'New Barrel Intake - Lab Action Required',
          message: `${customerInfo.barrelCount} barrel(s) from ${customerInfo.name} delivered. Sample ID: ${sampleId}`,
          link: checkInUrl,
          meta: {
            sampleId: String(sampleId),
            sellRequestId: customerInfo.requestId || undefined,
            intakeId: String(intakeData._id),
            barrelCount: String(customerInfo.barrelCount),
            customerName: customerInfo.name,
            customerPhone: customerInfo.phone,
            arrivalTime: new Date(arrivalTime).toISOString()
          },
          targetRole: 'lab'
        })
      });
      
      // Send notification to accountant
      await fetch(`${apiBase}/api/notifications/staff-trip-event`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'New Barrel Intake - Accountant Notification',
          message: `${customerInfo.barrelCount} barrel(s) from ${customerInfo.name} received. Sample ID: ${sampleId}`,
          link: '/accountant/dashboard',
          meta: {
            sampleId: String(sampleId),
            sellRequestId: customerInfo.requestId || undefined,
            intakeId: String(intakeData._id),
            barrelCount: String(customerInfo.barrelCount),
            customerName: customerInfo.name,
            customerPhone: customerInfo.phone,
            arrivalTime: new Date(arrivalTime).toISOString()
          },
          targetRole: 'accountant'
        })
      });
      
      setMessage('✅ Notifications sent successfully to Lab Staff and Accountant! Task moved to history.');
      // Move to step 4 to hide the send button and show completion message
      setStep(4);
      
    } catch (error) {
      console.error('Failed to send notifications:', error);
      setError('Failed to send notifications. Please try again.');
      setSendingNotification(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ 
        marginBottom: '24px', 
        color: '#1e293b', 
        fontSize: '24px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <i className="fas fa-clipboard-check"></i>
        Barrel Pickup Confirmation
      </h2>
      
      {message && (
        <div style={{ 
          padding: '12px 16px', 
          marginBottom: '16px', 
          backgroundColor: '#d1fae5', 
          color: '#065f46', 
          borderRadius: '8px',
          border: '1px solid #10b981'
        }}>
          <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
          {message}
        </div>
      )}
      
      {error && (
        <div style={{ 
          padding: '12px 16px', 
          marginBottom: '16px', 
          backgroundColor: '#fee2e2', 
          color: '#991b1b', 
          borderRadius: '8px',
          border: '1px solid #ef4444'
        }}>
          <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
          {error}
        </div>
      )}

      {/* Customer Information Table */}
      <div style={{ 
        backgroundColor: '#ffffff', 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
        marginBottom: '24px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          padding: '16px 20px', 
          backgroundColor: '#f8fafc', 
          borderBottom: '2px solid #e2e8f0',
          fontWeight: '600',
          color: '#334155',
          fontSize: '16px'
        }}>
          <i className="fas fa-user" style={{ marginRight: '8px' }}></i>
          Customer Information
        </div>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ 
                padding: '16px 20px', 
                fontWeight: '600', 
                color: '#64748b',
                backgroundColor: '#f8fafc'
              }}>
                Customer Name
              </td>
              <td style={{ padding: '16px 20px', color: '#1e293b' }}>
                {customerInfo.name || '-'}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ 
                padding: '16px 20px', 
                fontWeight: '600', 
                color: '#64748b',
                backgroundColor: '#f8fafc'
              }}>
                Phone Number
              </td>
              <td style={{ padding: '16px 20px', color: '#1e293b' }}>
                {customerInfo.phone ? (
                  <a 
                    href={`tel:${customerInfo.phone}`}
                    style={{
                      color: '#10b981',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="fas fa-phone"></i>
                    {customerInfo.phone}
                  </a>
                ) : '-'}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ 
                padding: '16px 20px', 
                fontWeight: '600', 
                color: '#64748b',
                backgroundColor: '#f8fafc'
              }}>
                Pickup Date & Time
              </td>
              <td style={{ padding: '16px 20px', color: '#1e293b' }}>
                {customerInfo.date}
              </td>
            </tr>
            <tr>
              <td style={{ 
                padding: '16px 20px',
                fontWeight: '600', 
                color: '#64748b',
                backgroundColor: '#f8fafc'
              }}>
                Barrel Count
              </td>
              <td style={{ padding: '16px 20px' }}>
                <span style={{ 
                  display: 'inline-block',
                  padding: '6px 14px',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '15px'
                }}>
                  {customerInfo.barrelCount}
                </span>
              </td>
            </tr>
            <tr>
              <td style={{ 
                padding: '16px 20px',
                fontWeight: '600', 
                color: '#64748b',
                backgroundColor: '#f8fafc'
              }}>
                Request ID
              </td>
              <td style={{ padding: '16px 20px' }}>
                {customerInfo.requestId ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '6px 14px',
                      backgroundColor: '#f3e8ff',
                      color: '#7c3aed',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '14px',
                      fontFamily: 'monospace'
                    }}>
                      {customerInfo.requestId}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#10b981',
                      backgroundColor: '#d1fae5',
                      padding: '4px 10px',
                      borderRadius: '4px'
                    }}>
                      <i className="fas fa-check-circle" style={{ marginRight: '4px' }}></i>
                      From Manager
                    </span>
                  </div>
                ) : (
                  <span style={{ color: '#ef4444', fontWeight: '500' }}>
                    <i className="fas fa-exclamation-triangle" style={{ marginRight: '4px' }}></i>
                    Not assigned
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Submit Button - Only show in Step 1 */}
      {step === 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginTop: '32px'
        }}>
          <button
            type="button"
            onClick={handleProceed}
            disabled={loading}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              background: loading
                ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                : customerInfo.requestId
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none',
              borderRadius: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: customerInfo.requestId 
                ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                : '0 4px 12px rgba(245, 158, 11, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {customerInfo.requestId ? (
              <>
                <i className="fas fa-arrow-right"></i>
                Proceed
              </>
            ) : (
              <>
                <i className="fas fa-exclamation-triangle"></i>
                Proceed Without Request ID
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2: Time Entry */}
      {step === 2 && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '24px',
          marginBottom: '24px',
          border: '2px solid #3b82f6'
        }}>
          <h3 style={{
            marginBottom: '20px',
            color: '#1e293b',
            fontSize: '18px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fas fa-clock"></i>
            Enter Arrival Time
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#475569',
              marginBottom: '8px'
            }}>
              Arrival Time <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="datetime-local"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            <p style={{
              fontSize: '13px',
              color: '#64748b',
              marginTop: '6px',
              fontStyle: 'italic'
            }}>
              <i className="fas fa-info-circle" style={{ marginRight: '4px' }}></i>
              Time when barrels arrived at the location
            </p>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={loading}
              style={{
                padding: '14px 28px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#64748b',
                background: '#f1f5f9',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
              Back
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !arrivalTime}
              style={{
                padding: '14px 32px',
                fontSize: '15px',
                fontWeight: '600',
                color: 'white',
                background: (!arrivalTime || loading)
                  ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '8px',
                cursor: (!arrivalTime || loading) ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Completing...
                </>
              ) : (
                <>
                  <i className="fas fa-check-circle"></i>
                  Complete Process
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation and Send */}
      {step === 3 && intakeData && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '24px',
          marginBottom: '24px',
          border: '2px solid #10b981'
        }}>
          <h3 style={{
            marginBottom: '20px',
            color: '#1e293b',
            fontSize: '18px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
            Intake Summary - Ready to Send
          </h3>

          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '8px', 
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            marginBottom: '20px'
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#475569'
                  }}>
                    Field
                  </th>
                  <th style={{ 
                    padding: '12px 16px', 
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#475569'
                  }}>
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#64748b' }}>
                    Request ID
                  </td>
                  <td style={{ padding: '12px 16px', color: '#1e293b' }}>
                    {intakeData.requestId !== 'Not assigned' ? (
                      <span style={{ 
                        display: 'inline-block',
                        padding: '4px 10px',
                        backgroundColor: '#f3e8ff',
                        color: '#7c3aed',
                        borderRadius: '4px',
                        fontWeight: '600',
                        fontFamily: 'monospace'
                      }}>
                        {intakeData.requestId}
                      </span>
                    ) : (
                      <span style={{ color: '#ef4444', fontWeight: '500' }}>
                        Not assigned
                      </span>
                    )}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#64748b' }}>
                    Customer Name
                  </td>
                  <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: '500' }}>
                    {intakeData.customerName}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#64748b' }}>
                    Phone Number
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <a 
                      href={`tel:${intakeData.customerPhone}`}
                      style={{
                        color: '#10b981',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '500'
                      }}
                    >
                      <i className="fas fa-phone"></i>
                      {intakeData.customerPhone}
                    </a>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#64748b' }}>
                    Number of Barrels
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '6px 14px',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '15px'
                    }}>
                      {intakeData.barrelCount}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#64748b' }}>
                    Arrival Date & Time
                  </td>
                  <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: '500' }}>
                    {intakeData.arrivalTime}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '24px'
          }}>
            <button
              type="button"
              onClick={handleSendNotifications}
              disabled={sendingNotification}
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                background: sendingNotification
                  ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '10px',
                cursor: sendingNotification ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {sendingNotification ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  Send to Lab Staff & Accountant
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Completion - Button hidden, show success */}
      {step === 4 && intakeData && (
        <div style={{
          backgroundColor: '#d1fae5',
          borderRadius: '12px',
          padding: '32px 24px',
          marginBottom: '24px',
          border: '2px solid #10b981',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            color: '#10b981',
            marginBottom: '16px'
          }}>
            <i className="fas fa-check-circle"></i>
          </div>
          <h3 style={{
            marginBottom: '12px',
            color: '#065f46',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            Process Completed Successfully!
          </h3>
          <p style={{
            fontSize: '15px',
            color: '#047857',
            marginBottom: '20px'
          }}>
            Notifications have been sent to Lab Staff and Accountant.
            <br />
            This task has been moved to Task History.
          </p>
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            marginTop: '24px'
          }}>
            <button
              onClick={() => navigate('/delivery')}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-home"></i>
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/delivery/task-history')}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#3b82f6',
                background: 'white',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fas fa-history"></i>
              View Task History
            </button>
          </div>
        </div>
      )}

      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#0c4a6e'
      }}>
        <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
        <strong>Step {step > 3 ? 3 : step} of 3:</strong> {
          step === 1 ? 'Review customer information and request ID' : 
          step === 2 ? 'Enter arrival time to complete the process' :
          step >= 3 ? 'Process completed and notifications sent' : ''
        }
      </div>
    </div>
  );
};

export default DeliveryBarrelIntake;
