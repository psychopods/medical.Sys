import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const mainContentRef = useRef(null);
  const scrollPositions = useRef({});

  // Save scroll position before navigation
  useEffect(() => {
    const saveScrollPosition = () => {
      if (mainContentRef.current) {
        scrollPositions.current[location.pathname] = mainContentRef.current.scrollTop;
      }
    };

    const mainElement = mainContentRef.current;
    if (mainElement) {
      mainElement.addEventListener('scroll', saveScrollPosition);
      return () => mainElement.removeEventListener('scroll', saveScrollPosition);
    }
  }, [location.pathname]);

  // Restore scroll position after navigation
  useEffect(() => {
    if (mainContentRef.current) {
      const savedPosition = scrollPositions.current[location.pathname] || 0;
      mainContentRef.current.scrollTop = savedPosition;
    }
  }, [location.pathname]);

  const menuItems = [
    { 
      path: '/dashboard', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      label: 'Dashboard', 
      roles: ['superuser', 'nurse', 'doctor', 'lab_technician', 'pharmacist', 'staff'] 
    },
    { 
      path: '/user-management', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21V19C17 16.8 15.2 15 13 15H5C2.8 15 1 16.8 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M23 21V19C22.9 16.8 21.1 15 19 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 3.13C17.2 3.72 18 5.01 18 6.5C18 7.99 17.2 9.28 16 9.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      label: 'User Management', 
      roles: ['superuser'] 
    },
    { 
      path: '/child-registration', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5.5 20V19C5.5 16.8 7.3 15 9.5 15H14.5C16.7 15 18.5 16.8 18.5 19V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      label: 'Child Registration', 
      roles: ['superuser', 'nurse', 'staff'] 
    },
    { 
      path: '/medical-examination', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      label: 'Medical Examination', 
      roles: ['superuser', 'doctor'] 
    },
    { 
      path: '/laboratory', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 3H16L18 9L12 21L6 9L8 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 9H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      label: 'Laboratory', 
      roles: ['superuser', 'lab_technician'] 
    },
    { 
      path: '/pharmacy', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      label: 'Pharmacy', 
      roles: ['superuser', 'pharmacist'] 
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role) || user?.role === 'superuser'
  );

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    onLogout();
  };

  const getPageTitle = (path) => {
    const titles = {
      '/dashboard': 'Dashboard Overview',
      '/user-management': 'User Management',
      '/child-registration': 'Child Registration',
      '/medical-examination': 'Medical Examination',
      '/laboratory': 'Laboratory',
      '/pharmacy': 'Pharmacy',
    };
    return titles[path] || 'Dashboard';
  };

  return (
    <div className={`dashboard-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="logo-section">
            <div className="logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="#667eea" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18" stroke="#667eea" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14" stroke="#667eea" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 12C18 8.69 15.31 6 12 6" stroke="#667eea" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {isSidebarOpen && <span className="logo-text">Fingerprint System</span>}
          </div>
          <button className="toggle-btn" onClick={toggleSidebar}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isSidebarOpen ? (
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {filteredMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {isSidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {isSidebarOpen && (
              <div className="user-details">
                <p className="user-name">{user?.name || 'User'}</p>
                <p className="user-role">{user?.roleName || 'Staff'}</p>
              </div>
            )}
          </div>
          <button className="logout-btn-sidebar" onClick={handleLogout}>
            <span className="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            {isSidebarOpen && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main" ref={mainContentRef}>
        <div className="main-header">
          <h1>{getPageTitle(location.pathname)}</h1>
          <div className="header-actions">
            <div className="date-time">
              {new Date().toLocaleDateString()}
            </div>
            <div className="user-badge">
              <span>{user?.name || 'User'}</span>
            </div>
          </div>
        </div>
        <div className="main-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;