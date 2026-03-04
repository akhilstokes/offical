import React from 'react';
import { Link } from 'react-router-dom';

const Card = ({ title, desc, to, action = 'Open' }) => (
  <div className="card" style={{ borderRadius: 12 }}>
    <div className="card-body">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {desc ? <div style={{ color: '#a3a3a3', marginBottom: 12 }}>{desc}</div> : null}
      <Link className="btn btn-primary" to={to}>{action}</Link>
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <h2 style={{ margin: '0 0 12px 0' }}>{title}</h2>
    <div className="card-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 16,
    }}>
      {children}
    </div>
  </div>
);

const AdminHome = () => {
  const [pendingRequests, setPendingRequests] = React.useState(0);

  // Fetch pending barrel requests
  React.useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API}/api/barrel-management/admin/barrel-requests`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          console.warn('Failed to fetch barrel requests:', response.status);
          return;
        }
        
        const data = await response.json();
        // Handle both array and object responses
        const requests = Array.isArray(data) ? data : (data.requests || data.data || []);
        // Count pending barrel requests
        const pending = requests.filter(r => r.status === 'pending').length;
        setPendingRequests(pending);
      } catch (error) {
        console.error('Error fetching requests:', error);
        // Silently fail - don't show errors to user
      }
    };
    
    fetchPendingRequests();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {/* Notification Banner for Pending Requests */}
      {pendingRequests > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          padding: '16px 20px',
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              🔔
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                {pendingRequests} Pending Barrel {pendingRequests === 1 ? 'Request' : 'Requests'}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                Users are waiting for barrel allocation approval
              </div>
            </div>
          </div>
          <Link 
            to="/admin/barrel-requests"
            style={{
              background: 'white',
              color: '#d97706',
              padding: '10px 20px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
            }}
          >
            <i className="fas fa-eye"></i>
            View Requests
          </Link>
        </div>
      )}

      {/* ADMIN CORE RESPONSIBILITIES */}
      <Section title="🏭 System Management">
        <Card 
          title="Barrel Management" 
          desc="Complete barrel lifecycle management system" 
          to="/admin/barrel-management" 
          action="Manage Barrels" 
        />
        <Card 
          title="User Management" 
          desc="Manage system users and roles" 
          to="/admin/users" 
          action="Manage Users" 
        />
        <Card 
          title="System Settings" 
          desc="Configure system parameters" 
          to="/admin/settings" 
          action="Settings" 
        />
        <Card 
          title="Reports & Analytics" 
          desc="View system reports and analytics" 
          to="/admin/reports" 
          action="View Reports" 
        />
      </Section>

      <Section title="Manager">
        <Card title="Create Barrel" desc="Create barrel IDs and print QR" to="/admin/create-barrel" action="Open" />
        <Card title="Approve Barrel" desc="Approve purchase by ID" to="/admin/create-barrel" action="Go" />
        <Card title="Barrel History" desc="View movement logs" to="/manager/barrel-history" action="View" />
        <Card title="Scan Barrel" desc="Scan and verify" to="/manager/barrel-scan" action="Scan" />
      </Section>
    </div>
  );
};

export default AdminHome;
