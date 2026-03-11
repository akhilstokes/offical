import React, { useState, useEffect } from 'react';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiDollarSign, FiSearch, FiX } from 'react-icons/fi';
import { listStaffUsers, deleteStaffUser, updateStaffUser } from '../../services/staffService';
import './AdminStaffManagement.css';

const AdminStaffManagement = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [selectedStaff, setSelectedStaff] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [staffList, setStaffList] = useState([]);

    // Form state
    const [staffForm, setStaffForm] = useState({
        name: '',
        role: 'Field Staff',
        experience: '',
        baseSalary: '',
        staffId: ''
    });

    const roles = [
        { label: 'Field Staff', value: 'field_staff' },
        { label: 'Lab Staff', value: 'lab_staff' },
        { label: 'Delivery Staff', value: 'delivery_staff' },
        { label: 'Accountant', value: 'accountant' },
        { label: 'Manager', value: 'manager' }
    ];

    // Fetch staff list on component mount
    useEffect(() => {
        fetchStaffList();
    }, []);

    const fetchStaffList = async () => {
        try {
            setLoading(true);
            // Fetch staff users (actual user accounts)
            const response = await listStaffUsers({ limit: 200 });
            const users = response?.users || response?.records || response?.data || response || [];
            
            // Map the data to include display names
            const mappedData = users.map(staff => ({
                ...staff,
                roleDisplay: roles.find(r => r.value === staff.role)?.label || staff.role,
                status: staff.status || 'active',
                experience: staff.experience || 0,
                baseSalary: staff.baseSalary || 0
            }));
            setStaffList(mappedData);
        } catch (err) {
            console.error('Error fetching staff:', err);
            setError('Error loading staff data');
        } finally {
            setLoading(false);
        }
    };

    const getStaffStats = () => {
        const stats = {
            total: staffList.length,
            field: staffList.filter(s => s.role === 'field_staff').length,
            lab: staffList.filter(s => s.role === 'lab_staff').length,
            delivery: staffList.filter(s => s.role === 'delivery_staff').length,
            accountant: staffList.filter(s => s.role === 'accountant').length,
            manager: staffList.filter(s => s.role === 'manager').length,
            active: staffList.filter(s => s.status === 'active').length,
            pending: staffList.filter(s => s.status === 'pending' || s.status === 'verified').length,
            approved: staffList.filter(s => s.status === 'approved').length
        };
        return stats;
    };

    const generateStaffId = (roleValue) => {
        const rolePrefix = {
            'field_staff': 'FS',
            'lab_staff': 'LS',
            'delivery_staff': 'DS',
            'accountant': 'AC',
            'manager': 'MG'
        };
        const prefix = rolePrefix[roleValue] || 'ST';
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `HFP${prefix}${randomNum}`;
    };

    const handleAddStaff = () => {
        setEditingStaff(null);
        setStaffForm({
            name: '',
            role: 'field_staff',
            experience: '',
            baseSalary: '',
            staffId: generateStaffId('field_staff')
        });
        setShowModal(true);
    };

    const handleEditStaff = (staff) => {
        setEditingStaff(staff);
        setStaffForm({
            name: staff.name,
            role: staff.role,
            experience: staff.experience,
            baseSalary: staff.baseSalary,
            staffId: staff.staffId
        });
        setShowModal(true);
    };

    const handleNumberInput = (value, min = 0) => {
        // Allow empty string for clearing the field
        if (value === '') return '';
        
        const num = parseFloat(value);
        
        // Reject if not a valid number
        if (isNaN(num)) return '';
        
        // Reject if negative
        if (num < min) return '';
        
        return value;
    };

    const handleSaveStaff = async () => {
        if (!staffForm.name || !staffForm.experience || !staffForm.baseSalary) {
            setError('Please fill all required fields');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            if (editingStaff) {
                // Update existing staff
                const response = await fetch(`/api/admin/staff/${editingStaff._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(staffForm)
                });
                
                if (response.ok) {
                    setSuccess('Staff updated successfully!');
                    fetchStaffList();
                } else {
                    setError('Failed to update staff');
                }
            } else {
                // Add new staff
                const response = await fetch('/api/admin/staff', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ...staffForm,
                        status: 'Active'
                    })
                });
                
                if (response.ok) {
                    setSuccess('Staff added successfully!');
                    fetchStaffList();
                } else {
                    setError('Failed to add staff');
                }
            }

            setShowModal(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error saving staff:', err);
            setError('Error saving staff data');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectStaff = (staffId) => {
        setSelectedStaff(prev => 
            prev.includes(staffId) 
                ? prev.filter(id => id !== staffId)
                : [...prev, staffId]
        );
    };

    const handleDeleteSelected = async () => {
        if (selectedStaff.length === 0) {
            setError('Please select staff to delete');
            return;
        }

        if (window.confirm(`Are you sure you want to delete ${selectedStaff.length} staff member(s)?`)) {
            try {
                setLoading(true);
                
                // Delete each selected staff
                for (const staffId of selectedStaff) {
                    await deleteStaffUser(staffId);
                }
                
                setSuccess('Selected staff deleted successfully!');
                setSelectedStaff([]);
                fetchStaffList();
                
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                console.error('Error deleting staff:', err);
                setError('Error deleting staff');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleToggleActive = async (staff) => {
        try {
            setLoading(true);
            const newStatus = staff.status === 'active' ? 'inactive' : 'active';
            await updateStaffUser(staff._id, { status: newStatus });
            setSuccess(`Staff ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
            fetchStaffList();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error updating staff status:', err);
            setError('Error updating staff status');
        } finally {
            setLoading(false);
        }
    };

    const filteredStaff = staffList.filter(staff =>
        staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.staffId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.roleDisplay?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = getStaffStats();

    return (
        <div className="admin-staff-management">
            {/* Header */}
            <div className="staff-header">
                <div className="header-left">
                    <h1 className="page-title">
                        <FiUsers /> Staff Management
                    </h1>
                    <p className="page-description">
                        Manage staff members, set salaries based on experience
                    </p>
                </div>
                <button className="add-staff-btn" onClick={handleAddStaff}>
                    <FiPlus /> Add Staff
                </button>
            </div>

            {/* Alerts */}
            {success && <div className="alert-success">{success}</div>}
            {error && <div className="alert-error">{error}</div>}

            {/* Staff Overview Cards */}
            <div className="staff-overview">
                <div className="overview-grid">
                    <div className="overview-card total">
                        <div className="card-label">Total Staff</div>
                        <div className="card-value">{stats.total}</div>
                    </div>
                    <div className="overview-card field">
                        <div className="card-label">Field Staff</div>
                        <div className="card-value">{stats.field}</div>
                    </div>
                    <div className="overview-card lab">
                        <div className="card-label">Lab Staff</div>
                        <div className="card-value">{stats.lab}</div>
                    </div>
                    <div className="overview-card delivery">
                        <div className="card-label">Delivery Staff</div>
                        <div className="card-value">{stats.delivery}</div>
                    </div>
                    <div className="overview-card accountant">
                        <div className="card-label">Accountant</div>
                        <div className="card-value">{stats.accountant}</div>
                    </div>
                    <div className="overview-card manager">
                        <div className="card-label">Manager</div>
                        <div className="card-value">{stats.manager}</div>
                    </div>
                    <div className="overview-card active">
                        <div className="card-label">Active</div>
                        <div className="card-value">{stats.active}</div>
                    </div>
                    <div className="overview-card pending">
                        <div className="card-label">Pending</div>
                        <div className="card-value">{stats.pending}</div>
                    </div>
                    <div className="overview-card approved">
                        <div className="card-label">Approved</div>
                        <div className="card-value">{stats.approved}</div>
                    </div>
                </div>
            </div>

            {/* Search and Actions */}
            <div className="staff-controls">
                <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by name, ID, or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {selectedStaff.length > 0 && (
                    <button className="delete-selected-btn" onClick={handleDeleteSelected}>
                        <FiTrash2 /> Delete Selected ({selectedStaff.length})
                    </button>
                )}
            </div>

            {/* Staff Table */}
            <div className="staff-table-container">
                <table className="staff-table">
                    <thead>
                        <tr>
                            <th width="50">
                                <input
                                    type="checkbox"
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedStaff(staffList.map(s => s._id || s.id));
                                        } else {
                                            setSelectedStaff([]);
                                        }
                                    }}
                                    checked={selectedStaff.length === staffList.length && staffList.length > 0}
                                />
                            </th>
                            <th>Staff ID</th>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Experience</th>
                            <th>Base Salary</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="no-data">
                                    Loading staff data...
                                </td>
                            </tr>
                        ) : filteredStaff.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="no-data">
                                    No staff members found
                                </td>
                            </tr>
                        ) : (
                            filteredStaff.map(staff => (
                                <tr key={staff._id || staff.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedStaff.includes(staff._id || staff.id)}
                                            onChange={() => handleSelectStaff(staff._id || staff.id)}
                                        />
                                    </td>
                                    <td className="staff-id">{staff.staffId || 'N/A'}</td>
                                    <td>{staff.name}</td>
                                    <td>
                                        <span className={`role-badge ${staff.role?.toLowerCase().replace('_', '-')}`}>
                                            {staff.roleDisplay || staff.role}
                                        </span>
                                    </td>
                                    <td>{staff.experience || 0} years</td>
                                    <td className="salary">₹{(staff.baseSalary || 0).toLocaleString()}</td>
                                    <td>
                                        <span className={`status-badge ${staff.status?.toLowerCase() || 'active'}`}>
                                            {staff.status || 'Active'}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="action-btn edit"
                                            onClick={() => handleEditStaff(staff)}
                                        >
                                            <FiEdit2 /> Edit
                                        </button>
                                        <button 
                                            className={`action-btn ${staff.status === 'active' ? 'deactivate' : 'activate'}`}
                                            onClick={() => handleToggleActive(staff)}
                                        >
                                            {staff.status === 'active' ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="staff-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingStaff ? 'Edit Staff' : 'Add New Staff'}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>
                                <FiX />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Staff ID</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={staffForm.staffId}
                                    readOnly
                                />
                            </div>
                            <div className="form-group">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={staffForm.name}
                                    onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                                    placeholder="Full Name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Role *</label>
                                <select
                                    className="form-select"
                                    value={staffForm.role}
                                    onChange={(e) => setStaffForm({
                                        ...staffForm, 
                                        role: e.target.value,
                                        staffId: editingStaff ? staffForm.staffId : generateStaffId(e.target.value)
                                    })}
                                >
                                    {roles.map(role => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Experience (Years) *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={staffForm.experience}
                                    onChange={(e) => {
                                        const validated = handleNumberInput(e.target.value, 0);
                                        setStaffForm({...staffForm, experience: validated});
                                    }}
                                    placeholder="e.g., 5"
                                    min="0"
                                    max="50"
                                />
                            </div>
                            <div className="form-group">
                                <label>Base Salary (₹) *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={staffForm.baseSalary}
                                    onChange={(e) => {
                                        const validated = handleNumberInput(e.target.value, 0);
                                        setStaffForm({...staffForm, baseSalary: validated});
                                    }}
                                    placeholder="e.g., 25000"
                                    min="0"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button className="save-btn" onClick={handleSaveStaff}>
                                {editingStaff ? 'Update' : 'Add'} Staff
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStaffManagement;