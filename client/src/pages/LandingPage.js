import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const stats = [
    { icon: '📅', value: '25+', label: 'YEARS EXPERIENCE' },
    { icon: '👥', value: '500+', label: 'HAPPY CLIENTS' },
    { icon: '⭐', value: '99.9%', label: 'QUALITY RATE' },
    { icon: '🌍', value: '15+', label: 'STATES SERVED' }
  ];

  const quickNav = [
    {
      icon: '📖',
      title: 'Our History',
      description: 'Explore our journey from 1999 to becoming an industry leader in rubber manufacturing',
      link: '/history',
      color: '#3b82f6'
    },
    {
      icon: '🖼️',
      title: 'Gallery',
      description: 'View our state of the art facilities, production processes, and team in action',
      link: '/gallery',
      color: '#ec4899'
    },
    {
      icon: '📧',
      title: 'Contact Us',
      description: 'Get in touch with our team for inquiries, support, or partnership opportunities',
      link: '/contact',
      color: '#f59e0b'
    }
  ];

  return (
    <div className="landing-page-new">
      {/* Navigation */}
      <nav className="landing-nav-new">
        <div className="nav-brand-new">
          <img src="/logo.png" alt="HolyFamily" className="nav-logo" onError={(e) => e.target.style.display = 'none'} />
          <span>HolyFamily</span>
        </div>
        <div className="nav-links-new">
          <a onClick={() => navigate('/')}>Home</a>
          <a onClick={() => navigate('/about')}>About</a>
          <a onClick={() => navigate('/history')}>History</a>
          <a onClick={() => navigate('/gallery')}>Gallery</a>
          <a onClick={() => navigate('/awards')}>Awards</a>
          <a onClick={() => navigate('/contact')}>Contact</a>
        </div>
        <div className="nav-buttons-new">
          <button className="btn-signup-new" onClick={() => navigate('/register')}>Sign Up</button>
          <button className="btn-signin-new" onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </nav>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Navigation Section */}
      <section className="quick-nav-section">
        <div className="section-header">
          <span className="section-badge">EXPLORE</span>
          <h2 className="section-title-new">QUICK NAVIGATION</h2>
          <p className="section-subtitle">Discover more about our company, services, and get in touch with us</p>
        </div>

        <div className="quick-nav-grid">
          {quickNav.map((item, index) => (
            <div key={index} className="quick-nav-card" onClick={() => navigate(item.link)}>
              <div className="quick-nav-icon" style={{ color: item.color }}>
                {item.icon}
              </div>
              <h3 className="quick-nav-title">{item.title}</h3>
              <p className="quick-nav-description">{item.description}</p>
              <div className="quick-nav-arrow" style={{ color: item.color }}>→</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <div className="cta-icon">🚀</div>
          <h2 className="cta-title">Ready to Get Started?</h2>
          <p className="cta-description">Join hundreds of satisfied customers and experience quality rubber manufacturing</p>
          <div className="cta-buttons">
            <button className="btn-cta-primary" onClick={() => navigate('/register')}>Create Account</button>
            <button className="btn-cta-secondary" onClick={() => navigate('/contact')}>Contact Sales</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer-new">
        <div className="footer-content">
          <div className="footer-section">
            <h4>HolyFamily Polymers</h4>
            <p>Leading rubber manufacturing since 1999</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <a onClick={() => navigate('/about')}>About Us</a>
            <a onClick={() => navigate('/history')}>Our History</a>
            <a onClick={() => navigate('/gallery')}>Gallery</a>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: info@holyfamily.com</p>
            <p>Phone: +91 123 456 7890</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 HolyFamily Polymers. All rights reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
