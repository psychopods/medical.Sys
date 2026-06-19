// /home/labdoo/medical.Sys/fingerprint-system/src/components/Dashboard/Layout.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { menuItems, getPageTitle } from './menuItems';
import NotificationBell from '../NotificationBell';
import './Layout.css';

const Layout = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const mainContentRef = useRef(null);
  const scrollPositions = useRef({});
  const userMenuRef = useRef(null);
  const sidebarRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  // Check if mobile on resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileSidebarOpen(false);
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isMobileSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsMobileSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isMobileSidebarOpen]);

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // ===== REFRESH NOTIFICATIONS EVERY 5 SECONDS =====
  useEffect(() => {
    // Start the refresh interval
    refreshIntervalRef.current = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 5000); // 5 seconds

    // Cleanup interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, []);

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role) || user?.role === 'superuser'
  );

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout();
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

  // Determine sidebar classes
  const sidebarClasses = `dashboard-sidebar ${isMobile ? 'mobile' : ''} ${isMobileSidebarOpen ? 'mobile-open' : 'mobile-closed'} ${!isMobile && !isSidebarOpen ? 'sidebar-closed' : ''}`;

  return (
    <div className={`dashboard-layout ${!isMobile && !isSidebarOpen ? 'sidebar-closed' : ''}`}>
      {/* Mobile Overlay */}
      {isMobile && isMobileSidebarOpen && (
        <div className="mobile-sidebar-overlay" onClick={closeMobileSidebar}></div>
      )}

      {/* Sidebar */}
      <aside className={sidebarClasses} ref={sidebarRef}>
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
            {(!isMobile || (isMobile && isMobileSidebarOpen)) && <span className="logo-text">TRHM System</span>}
          </div>
          <button className="toggle-btn" onClick={toggleSidebar}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isMobile ? (
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              ) : (
                isSidebarOpen ? (
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                ) : (
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                )
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
              onClick={closeMobileSidebar}
            >
              <span className="nav-icon">{item.icon}</span>
              {(!isMobile || (isMobile && isMobileSidebarOpen)) && <span className="nav-label">{item.label}</span>}
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
            {(!isMobile || (isMobile && isMobileSidebarOpen)) && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main" ref={mainContentRef}>
        <div className="main-header">
          {/* Mobile Menu Button */}
          <button className="mobile-menu-btn" onClick={toggleSidebar}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeLinecap="round"/>
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeLinecap="round"/>
              <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeLinecap="round"/>
            </svg>
          </button>
          <h1>{getPageTitle(location.pathname)}</h1>
          <div className="header-actions">
            {/* Notification Bell - Pass refreshTrigger as prop */}
            {user && <NotificationBell user={user} refreshTrigger={refreshTrigger} />}
            
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
        <div className="main-content" onClick={closeMobileSidebar}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;