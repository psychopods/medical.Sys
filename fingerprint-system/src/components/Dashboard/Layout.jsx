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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const location = useLocation();
  const navigate = useNavigate();
  const mainContentRef = useRef(null);
  const scrollPositions = useRef({});
  const userMenuRef = useRef(null);
  const userButtonRef = useRef(null);
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

  // Calculate dropdown position
  useEffect(() => {
    if (showUserMenu && userButtonRef.current) {
      const rect = userButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right - 280 + window.scrollX,
      });
    }
  }, [showUserMenu]);

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
    refreshIntervalRef.current = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 5000);

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

  const getUserDisplayName = () => {
    if (!user) return 'User';
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.name) return user.name;
    if (user.username) return user.username;
    return 'Staff User';
  };

  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  const getUserRoleDisplay = () => {
    if (!user) return 'Staff';
    if (user.roleName) return user.roleName;
    if (user.role) return user.role.charAt(0).toUpperCase() + user.role.slice(1);
    if (user.role_id) return user.role_id;
    return 'Staff';
  };

  const sidebarClasses = `dashboard-sidebar ${isMobile ? 'mobile' : ''} ${isMobileSidebarOpen ? 'mobile-open' : 'mobile-closed'} ${!isMobile && !isSidebarOpen ? 'sidebar-closed' : ''}`;

  const isSmallMobile = window.innerWidth <= 480;

  return (
    <div className={`dashboard-layout ${!isMobile && !isSidebarOpen ? 'sidebar-closed' : ''}`}>
      {isMobile && isMobileSidebarOpen && (
        <div className="mobile-sidebar-overlay" onClick={closeMobileSidebar}></div>
      )}

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

      <main className="dashboard-main" ref={mainContentRef}>
        <div className="main-header">
          <button className="mobile-menu-btn" onClick={toggleSidebar}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeLinecap="round"/>
              <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeLinecap="round"/>
              <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeLinecap="round"/>
            </svg>
          </button>
          <h1>{getPageTitle(location.pathname)}</h1>
          <div className="header-actions">
            {user && <NotificationBell user={user} refreshTrigger={refreshTrigger} />}
            
            {/* User Dropdown - FORCED DOWN */}
            <div 
              ref={userMenuRef}
              style={{ 
                position: 'relative', 
                display: 'inline-block',
                zIndex: 9999
              }}
            >
              <button 
                ref={userButtonRef}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: isSmallMobile ? '6px' : '8px 12px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: '40px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  zIndex: 10000
                }}
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div style={{
                  width: isSmallMobile ? '32px' : '36px',
                  height: isSmallMobile ? '32px' : '36px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: isSmallMobile ? '12px' : '14px',
                  flexShrink: 0,
                }}>
                  {getUserInitial()}
                </div>
                {!isSmallMobile && (
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{getUserDisplayName()}</span>
                    <span style={{ fontSize: '11px', color: '#888' }}>{getUserRoleDisplay()}</span>
                  </div>
                )}
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  style={{
                    transition: 'transform 0.2s ease',
                    flexShrink: 0,
                    transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              
              {showUserMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  marginTop: '8px',
                  width: '280px',
                  maxHeight: '80vh',
                  background: '#ffffff',
                  border: '1px solid #e8e8e8',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 99999,
                  overflow: 'hidden',
                  transform: 'translateY(0)',
                  opacity: 1,
                  visibility: 'visible',
                  pointerEvents: 'auto',
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '16px',
                    background: '#fafafa',
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '18px',
                      flexShrink: 0,
                    }}>
                      {getUserInitial()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#333',
                        marginBottom: '4px',
                        wordBreak: 'break-word',
                      }}>{getUserDisplayName()}</div>
                      <div style={{
                        fontSize: '12px',
                        color: '#888',
                        marginBottom: '4px',
                        wordBreak: 'break-word',
                      }}>{user?.email || 'No email'}</div>
                      <div style={{
                        fontSize: '11px',
                        color: '#667eea',
                        fontWeight: '500',
                      }}>{getUserRoleDisplay()}</div>
                    </div>
                  </div>
                  
                  <div style={{ height: '1px', background: '#e8e8e8' }}></div>
                  
                  <button 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: '12px 16px',
                      background: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#333',
                      textAlign: 'left',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, stroke: '#888' }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    My Profile
                  </button>
                  
                  <div style={{ height: '1px', background: '#e8e8e8' }}></div>
                  
                  <button 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: '12px 16px',
                      background: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#dc3545',
                      textAlign: 'left',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#fff5f5'}
                    onMouseLeave={(e) => e.target.style.background = 'white'}
                    onClick={handleLogout}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, stroke: '#dc3545' }}>
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