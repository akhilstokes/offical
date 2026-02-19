import React, { useState, useEffect } from 'react';
import './MySchedule.css';

const MySchedule = () => {
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [requestForm, setRequestForm] = useState({
        requestDate: '',
        currentShift: '',
        requestedShift: '',
        reason: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [requests, setRequests] = useState([]);
    const [viewMode, setViewMode] = useState('week'); // 'week' or 'list'

    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const token = localStorage.getItem('token');

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await fetch(`${base}/api/workers/field/shift-schedule`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setSchedule(data);
            } else {
                setError(data.message || 'Failed to load shift schedule');
            }
        } catch (error) {
            console.error('Error fetching shift schedule:', error);
            setError('Failed to load shift schedule');
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        try {
            const response = await fetch(`${base}/api/workers/field/schedule-requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setRequests(data.requests || []);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    };

    useEffect(() => {
        fetchSchedule();
        fetchRequests();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
    };

    const getShiftIcon = (shiftType) => {
        switch(shiftType?.toLowerCase()) {
            case 'morning': return <i className="fas fa-sun"></i>;
            case 'evening': return <i className="fas fa-moon"></i>;
            case 'night': return <i className="fas fa-cloud-moon"></i>;
            default: return <i className="fas fa-clock"></i>;
        }
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await fetch(`${base}/api/workers/field/schedule-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestForm)
            });
            
            if (response.ok) {
                setShowRequestForm(false);
                setRequestForm({ requestDate: '', currentShift: '', requestedShift: '', reason: '' });
                fetchRequests();
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to submit request');
            }
        } catch (error) {
            setError('Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="my-schedule">
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Loading your schedule...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="my-schedule">
            <header className="page-header">
                <div className="header-content">
                    <div className="header-left">
                        <h2><i className="fas fa-calendar-alt"></i> My Schedule</h2>
                        <p className="header-subtitle">Manage your work shifts and track your time</p>
                    </div>
                    <div className="header-actions">
                        <div className="view-toggle">
                            <button className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>Week View</button>
                            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>List View</button>
                        </div>
                        <button className="request-btn" onClick={() => setShowRequestForm(true)}>
                            <i className="fas fa-edit"></i> Request Change
                        </button>
                    </div>
                </div>
            </header>

            {error && <div className="error">{error} <button onClick={fetchSchedule} className="retry-btn">Retry</button></div>}

            <div className="quick-stats">
                <div className="stat-card">
                    <div className="stat-icon">{getShiftIcon(schedule?.shift)}</div>
                    <div className="stat-info">
                        <span className="stat-label">Current Shift</span>
                        <span className="stat-value">{schedule?.shift || 'Not Assigned'}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><i className="fas fa-clock"></i></div>
                    <div className="stat-info">
                        <span className="stat-label">Shift Timing</span>
                        <span className="stat-value">{schedule?.startTime ? `${schedule.startTime} - ${schedule.endTime}` : 'N/A'}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><i className="fas fa-calendar-check"></i></div>
                    <div className="stat-info">
                        <span className="stat-label">Working Days</span>
                        <span className="stat-value">{schedule?.workingDays?.length || 0} Days/Week</span>
                    </div>
                </div>
            </div>

            {viewMode === 'week' ? (
                <div className="week-calendar">
                    <div className="week-header">
                        <h3><i className="fas fa-calendar-week"></i> This Week's Schedule</h3>
                    </div>
                    <div className="week-grid">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                            const isWorking = schedule?.workingDays?.includes(day);
                            return (
                                <div key={day} className={`day-card ${day === new Date().toLocaleDateString('en-US', {weekday: 'long'}) ? 'today' : ''}`}>
                                    <div className="day-header">
                                        <span className="day-name">{day}</span>
                                    </div>
                                    <div className="day-content">
                                        {isWorking ? (
                                            <div className={`shift-badge ${schedule.shift?.toLowerCase()}`}>
                                                {getShiftIcon(schedule.shift)}
                                                <span>{schedule.shift}</span>
                                            </div>
                                        ) : <span className="off-day">OFF</span>}
                                        {isWorking && <div className="shift-time">{schedule.startTime} - {schedule.endTime}</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="schedule-list-container">
                    <div className="list-header">
                        <h3><i className="fas fa-list-ul"></i> Detailed Schedule List</h3>
                    </div>
                    <div className="schedule-list">
                        {schedule?.workingDays?.map(day => (
                            <div key={day} className="schedule-list-item">
                                <div className="item-day"><strong>{day}</strong></div>
                                <div className="item-shift">
                                    <span className={`shift-tag ${schedule.shift?.toLowerCase()}`}>{schedule.shift}</span>
                                </div>
                                <div className="item-time"><i className="far fa-clock"></i> {schedule.startTime} - {schedule.endTime}</div>
                            </div>
                        )) || <p className="no-data">No schedule assigned</p>}
                    </div>
                </div>
            )}

            {requests.length > 0 && (
                <div className="my-requests">
                    <h3><i className="fas fa-history"></i> Recent Change Requests</h3>
                    <div className="requests-grid">
                        {requests.map(request => (
                            <div key={request._id} className="request-card">
                                <div className="request-header">
                                    <span className="request-date">{formatDate(request.requestDate)}</span>
                                    <span className={`status-badge ${request.status}`}>{request.status}</span>
                                </div>
                                <div className="request-body">
                                    <p><strong>From:</strong> {request.currentShift} <i className="fas fa-arrow-right"></i> <strong>To:</strong> {request.requestedShift}</p>
                                    <p className="reason">"{request.reason}"</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showRequestForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3><i className="fas fa-exchange-alt"></i> Request Shift Change</h3>
                            <button className="close-btn" onClick={() => setShowRequestForm(false)}><i className="fas fa-times"></i></button>
                        </div>
                        <form onSubmit={handleRequestSubmit} className="request-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Effective Date</label>
                                    <input type="date" value={requestForm.requestDate} onChange={(e) => setRequestForm({...requestForm, requestDate: e.target.value})} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Current Shift</label>
                                    <select value={requestForm.currentShift} onChange={(e) => setRequestForm({...requestForm, currentShift: e.target.value})} required>
                                        <option value="">Select shift</option>
                                        <option value="Morning">Morning</option>
                                        <option value="Evening">Evening</option>
                                        <option value="Night">Night</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Requested Shift</label>
                                    <select value={requestForm.requestedShift} onChange={(e) => setRequestForm({...requestForm, requestedShift: e.target.value})} required>
                                        <option value="">Select shift</option>
                                        <option value="Morning">Morning</option>
                                        <option value="Evening">Evening</option>
                                        <option value="Night">Night</option>
                                        <option value="Off">Off Day</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Reason for Request</label>
                                <textarea value={requestForm.reason} onChange={(e) => setRequestForm({...requestForm, reason: e.target.value})} required rows={3} placeholder="Explain why you need this change..."></textarea>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowRequestForm(false)}>Cancel</button>
                                <button type="submit" className="submit-btn" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MySchedule;