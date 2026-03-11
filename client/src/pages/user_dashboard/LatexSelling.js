import React, { useState, useEffect } from 'react';
import './LatexSelling.css';

const LatexSelling = () => {
    const [activeTab, setActiveTab] = useState('submit-request');
    const [formData, setFormData] = useState({
        quantity: '',
        drcPercentage: '',
        quality: 'Grade A',
        location: '',
        notes: ''
    });
    const [requests, setRequests] = useState([]);
    const [marketRates, setMarketRates] = useState({
        liveRate: 0,
        companyRate: 0,
        lastUpdated: new Date()
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Fetch market rates and user requests
        fetchMarketRates();
        fetchUserRequests();
    }, []);

    const fetchMarketRates = async () => {
        try {
            const response = await fetch('/api/rates/live', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setMarketRates(data.rates);
            }
        } catch (error) {
            console.error('Error fetching market rates:', error);
        }
    };

    const fetchUserRequests = async () => {
        try {
            const response = await fetch('/api/latex/requests', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setRequests(data.requests);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    const handleInputChange = (field, value) => {
        let v = value;
        
        // Validate numeric fields - only positive numbers
        if (field === 'quantity') {
            const num = parseFloat(v);
            if (v !== '' && (isNaN(num) || num < 0)) return;
        } else if (field === 'drcPercentage') {
            const num = parseFloat(v);
            if (v !== '' && (isNaN(num) || num < 0 || num > 100)) return;
            if (!isNaN(num)) {
                if (num < 0) v = '0';
                if (num > 100) v = '100';
            }
        }
        
        setFormData(prev => ({
            ...prev,
            [field]: v
        }));
    };

    const calculateEstimatedPayment = () => {
        const quantity = parseFloat(formData.quantity) || 0;
        const drc = parseFloat(formData.drcPercentage) || 0;
        const rate = marketRates.companyRate || 0;
        
        if (quantity && rate) {
            // Payment = Quantity × DRC% × Company Rate
            return (quantity * (drc / 100) * rate).toFixed(2);
        }
        return '0.00';
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/latex/submit-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...formData,
                    estimatedPayment: calculateEstimatedPayment()
                })
            });

            const data = await response.json();
            
            if (data.success) {
                alert('Sell request submitted successfully!');
                setFormData({
                    quantity: '',
                    drcPercentage: '',
                    quality: 'Grade A',
                    location: '',
                    notes: ''
                });
                fetchUserRequests(); // Refresh requests
            } else {
                alert('Error submitting request: ' + data.message);
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            alert('Error submitting request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return '#28a745';
            case 'rejected': return '#dc3545';
            case 'pending': return '#ffc107';
            case 'processing': return '#17a2b8';
            default: return '#6c757d';
        }
    };

    const renderSubmitRequest = () => (
        <div className="submit-request-section">
            <h3>Submit Latex Sell Request</h3>
            <p>Submit your latex for sale with quantity and DRC percentage</p>

            <form onSubmit={handleSubmitRequest} className="sell-request-form">
                <div className="form-row">
                    <div className="input-group">
                        <label>Quantity (kg):</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            inputMode="decimal"
                            value={formData.quantity}
                            onChange={(e) => handleInputChange('quantity', e.target.value)}
                            onKeyDown={(evt)=>['e','E','+','-'].includes(evt.key) && evt.preventDefault()}
                            onWheel={(e)=>e.currentTarget.blur()}
                            placeholder="Enter quantity in kg"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>DRC Percentage (%):</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            inputMode="decimal"
                            value={formData.drcPercentage}
                            onChange={(e) => handleInputChange('drcPercentage', e.target.value)}
                            onKeyDown={(evt)=>['e','E','+','-'].includes(evt.key) && evt.preventDefault()}
                            onWheel={(e)=>e.currentTarget.blur()}
                            placeholder="Enter DRC % (optional)"
                            required={false}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="input-group">
                        <label>Quality Grade:</label>
                        <select
                            value={formData.quality}
                            onChange={(e) => handleInputChange('quality', e.target.value)}
                        >
                            <option value="Grade A">Grade A (Premium)</option>
                            <option value="Grade B">Grade B (Standard)</option>
                            <option value="Grade C">Grade C (Basic)</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Location:</label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            placeholder="Enter collection location"
                            required
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label>Notes (Optional):</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="Any additional notes or special requirements"
                        rows="3"
                    />
                </div>

                <div className="payment-preview">
                    <h4>Estimated Payment Preview</h4>
                    <div className="payment-details">
                        <div className="payment-item">
                            <span>Quantity:</span>
                            <span>{formData.quantity || '0'} kg</span>
                        </div>
                        <div className="payment-item">
                            <span>DRC:</span>
                            <span>{formData.drcPercentage || '0'}%</span>
                        </div>
                        <div className="payment-item">
                            <span>Company Rate:</span>
                            <span>₹{marketRates.companyRate}/kg</span>
                        </div>
                        <div className="payment-item total">
                            <span>Estimated Payment:</span>
                            <span>₹{calculateEstimatedPayment()}</span>
                        </div>
                    </div>
                </div>

                <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Sell Request'}
                </button>
            </form>
        </div>
    );

    const renderTrackRequests = () => (
        <div className="track-requests-section">
            <h3>Track Your Requests</h3>
            <p>Monitor the status of your latex sell requests</p>

            <div className="requests-list">
                {requests.length === 0 ? (
                    <div className="no-requests">
                        <i className="fas fa-inbox"></i>
                        <p>No sell requests found</p>
                    </div>
                ) : (
                    requests.map((request) => {
                        const rid = request._id || request.id;
                        const verified = request.status === 'VERIFIED';
                        return (
                        <div key={rid} className="request-card">
                            <div className="request-header">
                                <div className="request-id">
                                    <span>Request #{rid}</span>
                                    <span className="request-date">
                                        {new Date(request.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div 
                                    className="request-status"
                                    style={{ backgroundColor: getStatusColor(request.status) }}
                                >
                                    {request.status.toUpperCase()}
                                </div>
                            </div>

                            <div className="request-details">
                                <div className="detail-row">
                                    <span>Quantity:</span>
                                    <span>{request.quantity} kg</span>
                                </div>
                                <div className="detail-row">
                                    <span>DRC:</span>
                                    <span>{request.drcPercentage ?? '-'}%</span>
                                </div>
                                <div className="detail-row">
                                    <span>Quality:</span>
                                    <span>{request.quality}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Estimated Payment:</span>
                                    <span>₹{request.estimatedPayment}</span>
                                </div>
                                {request.marketRate != null && (
                                    <div className="detail-row">
                                        <span>Market Rate Used:</span>
                                        <span>₹{request.marketRate}/kg</span>
                                    </div>
                                )}
                                {request.finalPayment != null && (
                                    <div className="detail-row">
                                        <span>Final Verified Amount:</span>
                                        <span>₹{request.finalPayment}</span>
                                    </div>
                                )}
                            </div>

                            {request.adminNotes && (
                                <div className="admin-notes">
                                    <strong>Admin Notes:</strong>
                                    <p>{request.adminNotes}</p>
                                </div>
                            )}

                            <div className="request-actions">
                                {verified && (
                                    <a className="download-receipt-btn" href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/latex/invoice/${rid}`} target="_blank" rel="noreferrer">
                                        <i className="fas fa-download"></i>
                                        Download Invoice
                                    </a>
                                )}
                            </div>
                        </div>
                    )})
                )}
            </div>
        </div>
    );

    return (
        <div className="latex-selling">
            <div className="latex-header">
                <h2>
                    <i className="fas fa-seedling"></i>
                    Latex Selling
                </h2>
                <p>Submit and track your latex sell requests</p>
            </div>

            <div className="market-rates-card">
                <h3>Current Market Rates</h3>
                <div className="rates-grid">
                    <div className="rate-item">
                        <span className="rate-label">Live Market Rate:</span>
                        <span className="rate-value">₹{marketRates.liveRate}/kg</span>
                    </div>
                    <div className="rate-item">
                        <span className="rate-label">Company Buying Rate:</span>
                        <span className="rate-value">₹{marketRates.companyRate}/kg</span>
                    </div>
                    <div className="rate-item">
                        <span className="rate-label">Last Updated:</span>
                        <span className="rate-value">
                            {marketRates.lastUpdated.toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="latex-tabs">
                <button 
                    className={activeTab === 'submit-request' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('submit-request')}
                >
                    <i className="fas fa-plus-circle"></i>
                    Submit Request
                </button>
                <button 
                    className={activeTab === 'track-requests' ? 'tab active' : 'tab'}
                    onClick={() => setActiveTab('track-requests')}
                >
                    <i className="fas fa-tracking"></i>
                    Track Requests
                </button>
            </div>

            <div className="latex-content">
                {activeTab === 'submit-request' && renderSubmitRequest()}
                {activeTab === 'track-requests' && renderTrackRequests()}
            </div>
        </div>
    );
};

export default LatexSelling;

