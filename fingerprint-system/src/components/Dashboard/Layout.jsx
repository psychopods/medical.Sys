import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const mainContentRef = useRef(null);
  const scrollPositions = useRef({});
  const userMenuRef = useRef(null);

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

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { 
      path: '/dashboard', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
    { 
      path: '/gallery-admin', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="8.5" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      label: 'Gallery Manager', 
      roles: ['superuser', 'admin'] 
    },
    { 
      path: '/reports-admin', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 12H18L15 21L9 3L6 12H3" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 2L15 9H22L16 14L19 21L12 17L5 21L8 14L2 9H9L12 2Z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ), 
      label: 'Reports Manager', 
      roles: ['superuser', 'admin'] 
    },
    { 
      path: '/volunteer-admin', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M17 3.5L18.5 2L20 3.5L18.5 5L17 3.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1"/>
        </svg>
      ), 
      label: 'Volunteer Manager', 
      roles: ['superuser', 'admin'] 
    },
    { 
      path: '/contact-admin', 
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ), 
      label: 'Contact Manager', 
      roles: ['superuser', 'admin'] 
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role) || user?.role === 'superuser'
  );

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
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
      '/gallery-admin': 'Gallery Manager',
      '/reports-admin': 'Reports Manager',
      '/volunteer-admin': 'Volunteer Manager',
      '/contact-admin': 'Contact Manager',
    };
    return titles[path] || 'Dashboard';
  };

  // Helper function to get user display name
  const getUserDisplayName = () => {
    if (!user) return 'User';
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.name) return user.name;
    if (user.username) return user.username;
    return 'Staff User';
  };

  // Helper function to get user avatar initial
  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  // Helper function to get user role display name
  const getUserRoleDisplay = () => {
    if (!user) return 'Staff';
    if (user.roleName) return user.roleName;
    if (user.role) return user.role.charAt(0).toUpperCase() + user.role.slice(1);
    if (user.role_id) return user.role_id;
    return 'Staff';
  };

  return (
    <div className={`dashboard-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="logo-section">
            <div className="logo-icon">
              <img 
                src="/trhm.jpg" 
                alt="TRHM Logo" 
                className="sidebar-logo-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            {isSidebarOpen && <span className="logo-text">TRHM System</span>}
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
            {/* User Info in Right Corner */}
            <div className="user-menu-container" ref={userMenuRef}>
              <button 
                className="user-badge" 
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-avatar-small">
                  {getUserInitial()}
                </div>
                <div className="user-info-text">
                  <span className="user-name-text">{getUserDisplayName()}</span>
                  <span className="user-role-text">{getUserRoleDisplay()}</span>
                </div>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`dropdown-arrow ${showUserMenu ? 'open' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">
                      {getUserInitial()}
                    </div>
                    <div className="dropdown-info">
                      <div className="dropdown-name">{getUserDisplayName()}</div>
                      <div className="dropdown-email">{user?.email || 'No email'}</div>
                      <div className="dropdown-role">{getUserRoleDisplay()}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={() => navigate('/profile')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    My Profile
                  </button>
                  <button className="dropdown-item" onClick={() => navigate('/settings')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    Settings
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
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