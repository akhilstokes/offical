import React, { useEffect, useState } from 'react';

import './LatexSelling.css'; // Reuse the CSS from LatexSelling

const SubmitRequest = () => {
    const [assigned, setAssigned] = useState([]);
    const [assignedLoading, setAssignedLoading] = useState(false);
    const [assignedErr, setAssignedErr] = useState('');

    const [formData, setFormData] = useState({
        quantity: '',
        drcPercentage: '',
        quality: 'Grade A',
        location: '',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validate number input - only positive numbers allowed
    const validateNumberInput = (value, min = 0, max = 100) => {
        if (value === '') return '';
        const num = parseFloat(value);
        if (isNaN(num) || num < min || num > max) return '';
        return value;
    };

    useEffect(() => {
        const loadAssigned = async () => {
            setAssignedLoading(true);
            setAssignedErr('');
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/barrels/my-assigned`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (!res.ok) throw new Error(`Failed to load assigned barrels (${res.status})`);
                const j = await res.json();
                const list = Array.isArray(j?.records) ? j.records : Array.isArray(j) ? j : [];
                setAssigned(list);
            } catch (e) {
                setAssignedErr(e?.message || 'Failed to load');
                setAssigned([]);
            } finally {
                setAssignedLoading(false);
            }
        };
        loadAssigned();
    }, []);

    const handleInputChange = (field, value) => {
        let v = value;
        
        // Validate numeric fields
        if (field === 'quantity') {
            const validated = validateNumberInput(v, 0);
            v = validated;
        } else if (field === 'drcPercentage') {
            const validated = validateNumberInput(v, 0, 100);
            v = validated;
        }
        
        setFormData(prev => ({
            ...prev,
            [field]: v
        }));
    };

    const calculateEstimatedPayment = () => {
        const { quantity, drcPercentage } = formData;
        const rate = 200; // Default rate, you might want to fetch this from API

        if (quantity && drcPercentage) {
            return (quantity * (drcPercentage / 100) * rate).toFixed(2);
        }
        return '0.00';
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/latex/submit-request`, {
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

    return (
        <div className="activity-wrapper">
            <div className="activity-header">
                <h2>Submit Latex Sell Request</h2>
            </div>

            <div className="submit-request-section">
                <p>Submit your latex for sale with quantity and DRC percentage</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                        <span style={{ color: '#6b7280', marginRight: 8 }}>Company barrels assigned</span>
                        <strong>{assignedLoading ? '...' : assigned.length}</strong>
                    </div>
                    {assignedErr && <div style={{ color: 'tomato' }}>{assignedErr}</div>}
                </div>

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
                                onKeyDown={(evt) => ['e', 'E', '+', '-'].includes(evt.key) && evt.preventDefault()}
                                onWheel={(e) => e.currentTarget.blur()}
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
                                onKeyDown={(evt) => ['e', 'E', '+', '-'].includes(evt.key) && evt.preventDefault()}
                                onWheel={(e) => e.currentTarget.blur()}
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
                                required
                            >
                                <option value="Grade A">Grade A</option>
                                <option value="Grade B">Grade B</option>
                                <option value="Grade C">Grade C</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label>Location:</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                placeholder="Enter your location"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-group full-width">
                            <label>Notes (Optional):</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                placeholder="Any additional notes..."
                                rows="3"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label>Estimated Payment:</label>
                            <div className="estimated-payment">
                                ₹{calculateEstimatedPayment()}
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubmitRequest;