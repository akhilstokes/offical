
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LabDashboard.css';

const LabDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('incoming');
  const [selectedBarrel, setSelectedBarrel] = useState(null);
  const [drcValue, setDrcValue] = useState('');
  const [testNotes, setTestNotes] = useState('');
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fetch incoming barrel intake requests from delivery staff
  useEffect(() => {
    fetchIncomingRequests();
    
    // Auto-refresh every 30 seconds to update the count
    const interval = setInterval(() => {
      if (activeTab === 'incoming') {
        fetchIncomingRequests();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchIncomingRequests = async () => {
    if (activeTab !== 'incoming') return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        setIncomingRequests([]);
        setLoading(false);
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch pending intake requests using lab-specific endpoint
      const url = `${apiBase}/api/delivery/barrels/intake/lab-pending?status=pending`;
      console.log('Fetching incoming requests from:', url);
      
      const res = await fetch(url, { headers });
      console.log('Response status:', res.status, res.statusText);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', res.status, res.statusText, errorText);
        throw new Error(`Failed to fetch incoming requests: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Raw API response:', data);
      
      // Handle both paginated and non-paginated responses
      const items = data.items || data;
      console.log('Items extracted:', items);
      
      const pendingItems = Array.isArray(items) 
        ? items.filter(item => {
            console.log('Checking item:', item._id, 'status:', item.status);
            
            // Check if this request has been checked in (from localStorage)
            const completedCheckins = JSON.parse(localStorage.getItem('lab_checkins') || '[]');
            const isCompleted = completedCheckins.some(checkin => 
              checkin.sampleId === (item.requestId || item._id)
            );
            
            if (isCompleted) {
              console.log('Request already checked in:', item._id);
              return false;
            }
            
            return item.status === 'pending' || !item.status;
          })
        : [];
      
      console.log('Filtered pending items:', pendingItems.length, pendingItems);
      setIncomingRequests(pendingItems);
    } catch (error) {
      console.error('Error fetching incoming requests:', error);
      setIncomingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Pending barrels from delivery staff - loaded from API
  const pendingBarrels = [];

  // Completed tests - loaded from API
  const completedTests = [];

  const handleStartTest = (barrel) => {
    setSelectedBarrel(barrel);
    setDrcValue('');
    setTestNotes('');
  };

  const handleSubmitTest = () => {
    if (!drcValue || drcValue < 0 || drcValue > 100) {
      alert('Please enter a valid DRC value between 0 and 100');
      return;
    }

    // Here you would typically send the data to your backend
    console.log('Submitting test results:', {
      barrelId: selectedBarrel.barrelId,
      userId: selectedBarrel.userId,
      drcValue: parseFloat(drcValue),
      testNotes,
      testDate: new Date().toISOString().split('T')[0],
      testedBy: 'Lab Staff' // This would come from auth context
    });

    alert(`Test results submitted for Barrel ${selectedBarrel.barrelId}\nDRC Value: ${drcValue}%\nResults sent to Accountant for billing.`);
    setSelectedBarrel(null);
    setDrcValue('');
    setTestNotes('');
  };

  return (
    <div className="lab-dashboard">
      <header className="dashboard-header">
        <h1>🧪 Lab Testing Dashboard</h1>
        <div className="user-info">
          <span>Lab Staff - Barrel Testing</span>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'incoming' ? 'active' : ''}
          onClick={() => setActiveTab('incoming')}
        >
          📥 Incoming Requests ({incomingRequests.length})
        </button>
        <button 
          className={activeTab === 'pending' ? 'active' : ''}
          onClick={() => setActiveTab('pending')}
        >
          Pending Tests ({pendingBarrels.length})
        </button>
        <button 
          className={activeTab === 'completed' ? 'active' : ''}
          onClick={() => setActiveTab('completed')}
        >
          Completed Tests
        </button>
        <button 
          className={activeTab === 'queue' ? 'active' : ''}
          onClick={() => setActiveTab('queue')}
        >
          Testing Queue
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'incoming' && (
          <div className="incoming-requests-section">
            <div className="section-header">
              <h2>📥 Incoming Barrel Intake Requests</h2>
              <div className="stats-summary">
                <span className="stat-item">
                  <strong>{incomingRequests.length}</strong> Requests from Delivery Staff
                </span>
              </div>
            </div>
            
            {loading ? (
              <div className="loading-state">
                <i className="fas fa-spinner fa-spin"></i> Loading requests...
              </div>
            ) : incomingRequests.length === 0 ? (
              <div className="no-data">
                <div className="no-data-icon">📦</div>
                <p>No incoming barrel intake requests</p>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Phone</th>
                      <th>Barrel Count</th>
                      <th>Request ID</th>
                      <th>Arrival Time</th>
                      <th>Submitted At</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomingRequests.map((request) => {
                      // Build Sample Check-In URL with parameters
                      const sampleId = request.requestId || request._id;
                      const checkInUrl = `/lab/check-in?sampleId=${encodeURIComponent(sampleId)}&customerName=${encodeURIComponent(request.name || '')}&barrelCount=${request.barrelCount || 0}`;

                      return (
                        <tr 
                          key={request._id}
                          onClick={() => navigate(checkInUrl)}
                          style={{ 
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          title="Click to start sample check-in"
                        >
                          <td><strong>{request.name || '-'}</strong></td>
                        <td>
                          {request.phone ? (
                            <a 
                              href={`tel:${request.phone}`}
                              style={{ color: '#10b981', textDecoration: 'none' }}
                            >
                              <i className="fas fa-phone" style={{ marginRight: '4px' }}></i>
                              {request.phone}
                            </a>
                          ) : '-'}
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}>
                            {request.barrelCount || 0}
                          </span>
                        </td>
                        <td>
                          {request.requestId ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              backgroundColor: '#f3e8ff',
                              color: '#7c3aed',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                              fontSize: '13px',
                              fontWeight: '600'
                            }}>
                              {request.requestId}
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          {request.arrivalTime ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              borderRadius: '4px',
                              fontSize: '13px',
                              fontWeight: '500'
                            }}>
                              <i className="fas fa-clock" style={{ marginRight: '4px' }}></i>
                              {new Date(request.arrivalTime).toLocaleString('en-IN')}
                            </span>
                          ) : '-'}
                        </td>
                        <td>{new Date(request.createdAt).toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`status ${request.status || 'pending'}`}>
                            {(request.status || 'pending').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="pending-tests-section">
            <div className="section-header">
              <h2>Pending Barrel Tests</h2>
              <div className="stats-summary">
                <span className="stat-item">
                  <strong>{pendingBarrels.length}</strong> Barrels Awaiting Test
                </span>
              </div>
            </div>
            
            <div className="barrels-grid">
              {pendingBarrels.map((barrel) => (
                <div key={barrel.barrelId} className="barrel-card">
                  <div className="barrel-header">
                    <h3>Barrel ID: {barrel.barrelId}</h3>
                    <span className="status pending">PENDING TEST</span>
                  </div>
                  
                  <div className="barrel-details">
                    <div className="detail-row">
                      <span className="label">User:</span>
                      <span className="value">{barrel.userName} ({barrel.userId})</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Delivery Date:</span>
                      <span className="value">{barrel.deliveryDate}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Delivery Staff:</span>
                      <span className="value">{barrel.deliveryStaff}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Vehicle:</span>
                      <span className="value">{barrel.vehicleNumber}</span>
                    </div>
                  </div>
                  
                  <button 
                    className="btn-primary"
                    onClick={() => handleStartTest(barrel)}
                  >
                    Start DRC Test
                  </button>
                </div>
              ))}
              
              {pendingBarrels.length === 0 && (
                <div className="no-data">
                  <div className="no-data-icon">🧪</div>
                  <p>No barrels pending for testing</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="completed-tests-section">
            <div className="section-header">
              <h2>Completed Tests</h2>
            </div>
            
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Barrel ID</th>
                    <th>User</th>
                    <th>Test Date</th>
                    <th>DRC Value</th>
                    <th>Status</th>
                    <th>Sent to Accountant</th>
                  </tr>
                </thead>
                <tbody>
                  {completedTests.map((test) => (
                    <tr key={test.barrelId}>
                      <td><strong>{test.barrelId}</strong></td>
                      <td>{test.userName}</td>



                      <td>{test.testDate}</td>
                      <td>
                        <span className="drc-value">{test.drcValue}%</span>
                      </td>
                      <td>
                        <span className="status completed">COMPLETED</span>
                      </td>
                      <td>
                        {test.sentToAccountant ? (
                          <span className="status sent">✓ SENT</span>
                        ) : (
                          <span className="status pending">PENDING</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="queue-section">
            <div className="section-header">
              <h2>Testing Queue Management</h2>
            </div>
            
            <div className="queue-stats">
              <div className="stat-card">
                <h3>Today's Tests</h3>
                <div className="stat-number">{completedTests.filter(t => t.testDate === '2025-01-02').length}</div>
              </div>
              <div className="stat-card">
                <h3>Pending Tests</h3>
                <div className="stat-number">{pendingBarrels.length}</div>
              </div>
              <div className="stat-card">
                <h3>Average DRC</h3>
                <div className="stat-number">
                  {completedTests.length > 0 
                    ? (completedTests.reduce((sum, test) => sum + test.drcValue, 0) / completedTests.length).toFixed(1)
                    : '0'
                  }%
                </div>
              </div>
            </div>
            
            <div className="queue-instructions">
              <h3>Testing Instructions</h3>
              <ul>
                <li>Receive barrels from delivery staff with scanned IDs</li>
                <li>Test each barrel for DRC (Distillation Recovery Coefficient) value</li>
                <li>Enter DRC percentage (0-100%)</li>
                <li>Add testing notes if required</li>
                <li>Submit results directly to Accountant for billing</li>
                <li>Do not view or modify billing calculations</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* DRC Test Modal */}
      {selectedBarrel && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>DRC Test - Barrel {selectedBarrel.barrelId}</h2>
              <button 
                className="close-btn"
                onClick={() => setSelectedBarrel(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="barrel-info">
                <h3>Barrel Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Barrel ID:</span>
                    <span className="value">{selectedBarrel.barrelId}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">User:</span>
                    <span className="value">{selectedBarrel.userName}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">User ID:</span>
                    <span className="value">{selectedBarrel.userId}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Delivery Date:</span>
                    <span className="value">{selectedBarrel.deliveryDate}</span>
                  </div>
                </div>
              </div>
              
              <div className="test-form">
                <h3>DRC Test Results</h3>
                <div className="form-group">
                  <label htmlFor="drcValue">DRC Value (%):</label>
                  <input
                    type="number"
                    id="drcValue"
                    min="0"
                    max="100"
                    step="0.1"
                    value={drcValue}
                    onChange={(e) => setDrcValue(e.target.value)}
                    placeholder="Enter DRC percentage (0-100)"
                    className="drc-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="testNotes">Test Notes (Optional):</label>
                  <textarea
                    id="testNotes"
                    value={testNotes}
                    onChange={(e) => setTestNotes(e.target.value)}
                    placeholder="Add any observations or notes about the test..."
                    rows="3"
                    className="notes-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setSelectedBarrel(null)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleSubmitTest}
                disabled={!drcValue}
              >
                Submit Test Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabDashboard;
