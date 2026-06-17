import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SuperUserDashboard.css';
import { getChildren } from '../../services/api.js';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SuperUserDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'online-users'
  const [dashboardData, setDashboardData] = useState({
    totalChildren: 0,
    registeredToday: 0,
    fingerprintsCaptured: 0,
    totalUsers: 0,
    activeRoles: 0,
    totalPermissions: 0,
    totalCategories: 0,
    onlineNow: 0,
    youngPatients: 0,
    olderPatients: 0
  });
  const [recentChildren, setRecentChildren] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState({
    status: 'checking',
    lastChecked: null,
    responseTime: null
  });
  const [apiStatus, setApiStatus] = useState({
    children: { status: 'checking', statusCode: null },
    users: { status: 'checking', statusCode: null },
    roles: { status: 'checking', statusCode: null },
    permissions: { status: 'checking', statusCode: null },
    categories: { status: 'checking', statusCode: null }
  });
  const [chartData, setChartData] = useState({
    registrationsByMonth: [],
    fingerprintStatus: { captured: 0, pending: 0 },
    usersByRole: [],
    activityByHour: [],
    weeklyRegistrations: [],
    ageDistribution: { young: 0, older: 0 }
  });

  // ===== ONLINE USERS STATE =====
  const [onlineUsersList, setOnlineUsersList] = useState([]);
  const [loadingOnlineUsers, setLoadingOnlineUsers] = useState(false);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Helper function to calculate age
  const calculateAgeValue = (estimatedBirthYear) => {
    if (!estimatedBirthYear) return 0;
    const currentYear = new Date().getFullYear();
    return currentYear - estimatedBirthYear;
  };

  // Check database health - GET /health
  const checkDatabaseHealth = async () => {
    const startTime = performance.now();
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      if (response.ok) {
        const data = await response.json();
        setHealthStatus({
          status: data.status === 'ok' ? 'healthy' : 'degraded',
          lastChecked: new Date().toISOString(),
          responseTime: responseTime,
          details: data
        });
      } else {
        setHealthStatus({
          status: 'unhealthy',
          lastChecked: new Date().toISOString(),
          responseTime: responseTime,
          error: `HTTP ${response.status}`
        });
      }
    } catch (error) {
      setHealthStatus({
        status: 'offline',
        lastChecked: new Date().toISOString(),
        responseTime: null,
        error: error.message
      });
    }
  };

  // Check individual API endpoints
  const checkApiEndpoints = async () => {
    const endpoints = [
      { name: 'children', url: '/api/children' },
      { name: 'users', url: '/api/auth/users' },
      { name: 'roles', url: '/api/roles' },
      { name: 'permissions', url: '/api/permissions' },
      { name: 'categories', url: '/api/permission_categories' }
    ];

    const results = {};
    for (const endpoint of endpoints) {
      try {
        const startTime = performance.now();
        const response = await fetch(`${API_BASE_URL}${endpoint.url}`, {
          headers: getAuthHeaders()
        });
        const endTime = performance.now();
        
        results[endpoint.name] = {
          status: response.ok ? 'healthy' : 'degraded',
          statusCode: response.status,
          responseTime: Math.round(endTime - startTime)
        };
      } catch (error) {
        results[endpoint.name] = {
          status: 'offline',
          statusCode: null,
          responseTime: null,
          error: error.message
        };
      }
    }
    setApiStatus(results);
  };

  // Fetch children data with age categorization
  const fetchChildrenData = async () => {
    try {
      const children = await getChildren();
      
      // Calculate today's registrations
      const today = new Date().toISOString().split('T')[0];
      const todayRegistrations = children.filter(child => 
        child.createdAt && child.createdAt.split('T')[0] === today
      );
      
      // Calculate fingerprint status
      const captured = children.filter(child => child.fingerprintCaptured).length;
      const pending = children.length - captured;
      
      // Calculate age distribution
      let youngCount = 0;
      let olderCount = 0;
      
      children.forEach(child => {
        const age = calculateAgeValue(child.estimatedBirthYear);
        if (age < 18) {
          youngCount++;
        } else {
          olderCount++;
        }
      });
      
      // Calculate registrations by month for chart
      const registrationsByMonth = {};
      const weeklyRegistrations = {};
      const activityByHour = {};
      
      children.forEach(child => {
        if (child.createdAt) {
          const date = new Date(child.createdAt);
          const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
          registrationsByMonth[month] = (registrationsByMonth[month] || 0) + 1;
          
          // Weekly registrations
          const weekNum = Math.ceil(date.getDate() / 7);
          const weekKey = `Week ${weekNum}`;
          weeklyRegistrations[weekKey] = (weeklyRegistrations[weekKey] || 0) + 1;
          
          // Activity by hour
          const hour = date.getHours();
          activityByHour[hour] = (activityByHour[hour] || 0) + 1;
        }
      });
      
      const chartDataMonths = Object.entries(registrationsByMonth).map(([month, count]) => ({
        month,
        count
      })).slice(-6);
      
      const weeklyData = Object.entries(weeklyRegistrations).map(([week, count]) => ({
        week,
        count
      }));
      
      const hourlyData = Object.entries(activityByHour).map(([hour, count]) => ({
        hour: parseInt(hour),
        count
      })).sort((a, b) => a.hour - b.hour);
      
      setChartData(prev => ({
        ...prev,
        registrationsByMonth: chartDataMonths,
        fingerprintStatus: { captured, pending },
        weeklyRegistrations: weeklyData,
        activityByHour: hourlyData,
        ageDistribution: { young: youngCount, older: olderCount }
      }));
      
      return {
        totalChildren: children.length,
        registeredToday: todayRegistrations.length,
        fingerprintsCaptured: captured,
        recentChildren: children.slice(0, 5),
        youngPatients: youngCount,
        olderPatients: olderCount
      };
    } catch (error) {
      console.error('Error fetching children:', error);
    }
    return { totalChildren: 0, registeredToday: 0, fingerprintsCaptured: 0, recentChildren: [], youngPatients: 0, olderPatients: 0 };
  };

  // Fetch users data with role distribution
  const fetchUsersData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const users = await response.json();
        
        // Calculate users by role
        const usersByRole = {};
        users.forEach(user => {
          const roleName = user.roleName || 'Unknown';
          usersByRole[roleName] = (usersByRole[roleName] || 0) + 1;
        });
        
        const roleData = Object.entries(usersByRole).map(([role, count]) => ({
          role,
          count
        }));
        
        setChartData(prev => ({
          ...prev,
          usersByRole: roleData
        }));
        
        return {
          totalUsers: users.length,
          recentUsers: users.slice(0, 5)
        };
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    return { totalUsers: 0, recentUsers: [] };
  };

  // Fetch roles data
  const fetchRolesData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/roles`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const roles = await response.json();
        return roles.length;
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
    return 0;
  };

  // Fetch permissions data
  const fetchPermissionsData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/permissions`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const permissions = await response.json();
        return permissions.length;
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
    return 0;
  };

  // Fetch categories data
  const fetchCategoriesData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/permission_categories`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const categories = await response.json();
        return categories.length;
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
    return 0;
  };

  // ===== FIX: Fetch online users count using consistent logic =====
  const fetchOnlineUsersCount = async () => {
    try {
      // Fetch all users and filter active ones
      const usersResponse = await fetch(`${API_BASE_URL}/api/auth/users`, {
        headers: getAuthHeaders()
      });
      
      if (usersResponse.ok) {
        const allUsers = await usersResponse.json();
        const now = Date.now();
        const fiveMinutesAgo = now - (5 * 60 * 1000);
        
        const online = allUsers.filter(u => {
          if (!u.lastActive) return false;
          const lastActive = new Date(u.lastActive).getTime();
          return lastActive > fiveMinutesAgo;
        });
        
        return online.length;
      }
      return 0;
    } catch (error) {
      console.error('Error fetching online users:', error);
      return 0;
    }
  };

  // ===== FIX: Fetch detailed online users list using same logic =====
  const fetchOnlineUsersList = async () => {
    setLoadingOnlineUsers(true);
    try {
      // Fetch all users and filter active ones
      const usersResponse = await fetch(`${API_BASE_URL}/api/auth/users`, {
        headers: getAuthHeaders()
      });
      
      if (usersResponse.ok) {
        const allUsers = await usersResponse.json();
        const now = Date.now();
        const fiveMinutesAgo = now - (5 * 60 * 1000);
        
        const online = allUsers.filter(u => {
          if (!u.lastActive) return false;
          const lastActive = new Date(u.lastActive).getTime();
          return lastActive > fiveMinutesAgo;
        });
        
        setOnlineUsersList(online);
        // Also update dashboardData.onlineNow to match
        setDashboardData(prev => ({ ...prev, onlineNow: online.length }));
      } else {
        setOnlineUsersList([]);
      }
    } catch (error) {
      console.error('Error fetching online users list:', error);
      setOnlineUsersList([]);
    } finally {
      setLoadingOnlineUsers(false);
    }
  };

  // Load all dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    const [childrenResult, usersResult, rolesCount, permissionsCount, categoriesCount, onlineCount] = await Promise.all([
      fetchChildrenData(),
      fetchUsersData(),
      fetchRolesData(),
      fetchPermissionsData(),
      fetchCategoriesData(),
      fetchOnlineUsersCount()
    ]);

    setDashboardData({
      totalChildren: childrenResult.totalChildren,
      registeredToday: childrenResult.registeredToday,
      fingerprintsCaptured: childrenResult.fingerprintsCaptured,
      totalUsers: usersResult.totalUsers,
      activeRoles: rolesCount,
      totalPermissions: permissionsCount,
      totalCategories: categoriesCount,
      onlineNow: onlineCount,
      youngPatients: childrenResult.youngPatients,
      olderPatients: childrenResult.olderPatients
    });
    setRecentChildren(childrenResult.recentChildren);
    setRecentUsers(usersResult.recentUsers);
    setLoading(false);
  };

  // Load health data
  const loadHealthData = async () => {
    await Promise.all([
      checkDatabaseHealth(),
      checkApiEndpoints()
    ]);
  };

  useEffect(() => {
    loadDashboardData();
    loadHealthData();
    const interval = setInterval(() => {
      loadDashboardData();
      loadHealthData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle Online Now card click - show online users view
  const handleOnlineNowClick = () => {
    setCurrentView('online-users');
    fetchOnlineUsersList();
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const calculateAge = (birthYear) => {
    if (!birthYear) return 'N/A';
    const age = new Date().getFullYear() - birthYear;
    return `${age} years`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusDisplay = (status) => {
    switch(status) {
      case 'healthy':
        return { icon: '✓', class: 'sd-status-healthy', text: 'Healthy' };
      case 'degraded':
        return { icon: '⚠', class: 'sd-status-degraded', text: 'Degraded' };
      case 'unhealthy':
        return { icon: '✗', class: 'sd-status-unhealthy', text: 'Unhealthy' };
      case 'offline':
        return { icon: '●', class: 'sd-status-offline', text: 'Offline' };
      default:
        return { icon: '⟳', class: 'sd-status-checking', text: 'Checking...' };
    }
  };

  // Helper function to get max value for charts
  const getMaxValue = (data, key) => {
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map(d => d[key]), 1);
  };

  // ===== RENDER ONLINE USERS VIEW =====
  const renderOnlineUsersView = () => (
    <div className="sd-online-users-view">
      <div className="sd-page-header">
        <button className="sd-back-btn" onClick={handleBackToDashboard}>
          ← Back to Dashboard
        </button>
        <h1>Online Users</h1>
        <button className="sd-refresh-btn" onClick={fetchOnlineUsersList} disabled={loadingOnlineUsers}>
          {loadingOnlineUsers ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      <div className="sd-online-stats">
        <div className="sd-online-stats-card">
          <div className="sd-online-stats-icon">👤</div>
          <div className="sd-online-stats-info">
            <h2>{onlineUsersList.length}</h2>
            <p>Users Currently Online</p>
          </div>
        </div>
        <div className="sd-online-stats-card">
          <div className="sd-online-stats-icon">🟢</div>
          <div className="sd-online-stats-info">
            <h2>{dashboardData.totalUsers}</h2>
            <p>Total Registered Users</p>
          </div>
        </div>
      </div>

      {loadingOnlineUsers ? (
        <div className="sd-online-loading">
          <div className="sd-spinner"></div>
          <p>Loading online users...</p>
        </div>
      ) : (
        <div className="sd-online-table-container">
          {onlineUsersList.length === 0 ? (
            <div className="sd-online-empty">
              <div className="sd-online-empty-icon">🟢</div>
              <h3>No Users Online</h3>
              <p>There are currently no users active on the system.</p>
            </div>
          ) : (
            <table className="sd-data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Last Active</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {onlineUsersList.map((user, index) => (
                  <tr key={user.id || index}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td>
                      <div className="sd-online-user-username">
                        <span className="sd-online-indicator"></span>
                        {user.username}
                      </div>
                    </td>
                    <td>{user.firstName || ''} {user.lastName || ''}</td>
                    <td>{user.email || ''}</td>
                    <td>
                      <span className="sd-role-badge">
                        {user.roleName || user.role || 'User'}
                      </span>
                    </td>
                    <td>{formatDateTime(user.lastActive)}</td>
                    <td>
                      <span className="sd-status-online">
                        <span className="sd-online-dot"></span> Online
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );

  // ===== RENDER DASHBOARD VIEW =====
  const renderDashboardView = () => {
    const healthDisplay = getStatusDisplay(healthStatus.status);
    const maxRegistrations = getMaxValue(chartData.registrationsByMonth, 'count');
    const maxWeekly = getMaxValue(chartData.weeklyRegistrations, 'count');
    const maxHourly = getMaxValue(chartData.activityByHour, 'count');

    if (loading) {
      return (
        <div className="sd-loading-container">
          <div className="sd-spinner"></div>
          <p>Loading Dashboard...</p>
        </div>
      );
    }

    return (
      <>
        {/* Welcome Section */}
        <div className="sd-welcome-section">
          <div className="sd-welcome-content">
            <h1>{getGreeting()}, {user?.firstName || user?.username || 'Admin'}!</h1>
            <p>Welcome to Street Medicine System Dashboard</p>
          </div>
          <div className="sd-date-time">
            <div className="sd-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div className="sd-time">{new Date().toLocaleTimeString()}</div>
          </div>
        </div>

        {/* Database Health Section */}
        <div className="sd-health-section">
          <div className="sd-health-header">
            <h2>System Health Monitor</h2>
            <button className="sd-refresh-btn" onClick={() => { loadHealthData(); loadDashboardData(); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6"/>
                <path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
                <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
              </svg>
              Refresh
            </button>
          </div>
          
          <div className="sd-health-card sd-main-health">
            <div className={`sd-health-status-icon ${healthDisplay.class}`}>
              {healthDisplay.icon}
            </div>
            <div className="sd-health-status-info">
              <div className="sd-health-status-label">Database Status</div>
              <div className={`sd-health-status-value ${healthDisplay.class}`}>
                {healthDisplay.text}
              </div>
              {healthStatus.responseTime && (
                <div className="sd-health-response-time">Response: {healthStatus.responseTime}ms</div>
              )}
              {healthStatus.lastChecked && (
                <div className="sd-health-last-checked">Last checked: {formatTime(healthStatus.lastChecked)}</div>
              )}
              {healthStatus.error && <div className="sd-health-error">{healthStatus.error}</div>}
            </div>
          </div>

          <div className="sd-api-status-grid">
            <div className="sd-api-status-item">
              <div className="sd-api-status-header">
                <span className="sd-api-name">Children API</span>
                <span className={`sd-api-status-badge ${getStatusDisplay(apiStatus.children.status).class}`}>
                  {getStatusDisplay(apiStatus.children.status).text}
                </span>
              </div>
              <div className="sd-api-status-details">
                {apiStatus.children.statusCode && <span className="sd-api-status-code">HTTP {apiStatus.children.statusCode}</span>}
                {apiStatus.children.responseTime && <span className="sd-api-response-time">{apiStatus.children.responseTime}ms</span>}
              </div>
            </div>

            <div className="sd-api-status-item">
              <div className="sd-api-status-header">
                <span className="sd-api-name">Users API</span>
                <span className={`sd-api-status-badge ${getStatusDisplay(apiStatus.users.status).class}`}>
                  {getStatusDisplay(apiStatus.users.status).text}
                </span>
              </div>
              <div className="sd-api-status-details">
                {apiStatus.users.statusCode && <span className="sd-api-status-code">HTTP {apiStatus.users.statusCode}</span>}
                {apiStatus.users.responseTime && <span className="sd-api-response-time">{apiStatus.users.responseTime}ms</span>}
              </div>
            </div>

            <div className="sd-api-status-item">
              <div className="sd-api-status-header">
                <span className="sd-api-name">Roles API</span>
                <span className={`sd-api-status-badge ${getStatusDisplay(apiStatus.roles.status).class}`}>
                  {getStatusDisplay(apiStatus.roles.status).text}
                </span>
              </div>
              <div className="sd-api-status-details">
                {apiStatus.roles.statusCode && <span className="sd-api-status-code">HTTP {apiStatus.roles.statusCode}</span>}
                {apiStatus.roles.responseTime && <span className="sd-api-response-time">{apiStatus.roles.responseTime}ms</span>}
              </div>
            </div>

            <div className="sd-api-status-item">
              <div className="sd-api-status-header">
                <span className="sd-api-name">Permissions API</span>
                <span className={`sd-api-status-badge ${getStatusDisplay(apiStatus.permissions.status).class}`}>
                  {getStatusDisplay(apiStatus.permissions.status).text}
                </span>
              </div>
              <div className="sd-api-status-details">
                {apiStatus.permissions.statusCode && <span className="sd-api-status-code">HTTP {apiStatus.permissions.statusCode}</span>}
                {apiStatus.permissions.responseTime && <span className="sd-api-response-time">{apiStatus.permissions.responseTime}ms</span>}
              </div>
            </div>

            <div className="sd-api-status-item">
              <div className="sd-api-status-header">
                <span className="sd-api-name">Categories API</span>
                <span className={`sd-api-status-badge ${getStatusDisplay(apiStatus.categories.status).class}`}>
                  {getStatusDisplay(apiStatus.categories.status).text}
                </span>
              </div>
              <div className="sd-api-status-details">
                {apiStatus.categories.statusCode && <span className="sd-api-status-code">HTTP {apiStatus.categories.statusCode}</span>}
                {apiStatus.categories.responseTime && <span className="sd-api-response-time">{apiStatus.categories.responseTime}ms</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="sd-stats-grid">
          {/* 1. Total Patients */}
          <div className="sd-stat-card">
            <div className="sd-stat-icon sd-icon-primary">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4"/>
                <path d="M5.5 20V19C5.5 16.8 7.3 15 9.5 15H14.5C16.7 15 18.5 16.8 18.5 19V20"/>
              </svg>
            </div>
            <div className="sd-stat-info">
              <h3>{dashboardData.totalChildren}</h3>
              <p>Total Patients</p>
            </div>
          </div>

          {/* 2. Young Patients */}
          <div className="sd-stat-card sd-young-stat-card">
            <div className="sd-stat-icon sd-icon-young">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4"/>
                <path d="M5.5 20V19C5.5 16.8 7.3 15 9.5 15H14.5C16.7 15 18.5 16.8 18.5 19V20"/>
                <path d="M12 2v4M8 4l2 2M16 4l-2 2"/>
              </svg>
            </div>
            <div className="sd-stat-info">
              <h3>{dashboardData.youngPatients}</h3>
              <p>Young Patients</p>
              <small>&lt; 18 years</small>
            </div>
          </div>

          {/* 3. Older Patients */}
          <div className="sd-stat-card sd-older-stat-card">
            <div className="sd-stat-icon sd-icon-older">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
                <path d="M17 3.5a4 4 0 0 1 0 7"/>
              </svg>
            </div>
            <div className="sd-stat-info">
              <h3>{dashboardData.olderPatients}</h3>
              <p>Older Patients</p>
              <small>≥ 18 years</small>
            </div>
          </div>

          {/* 4. Registered Today */}
          <div className="sd-stat-card">
            <div className="sd-stat-icon sd-icon-success">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"/>
                <path d="M14 2V8H20"/>
              </svg>
            </div>
            <div className="sd-stat-info">
              <h3>{dashboardData.registeredToday}</h3>
              <p>Registered Today</p>
            </div>
          </div>

          {/* 5. Fingerprints Captured */}
          <div className="sd-stat-card">
            <div className="sd-stat-icon sd-icon-warning">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/>
                <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"/>
                <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14"/>
              </svg>
            </div>
            <div className="sd-stat-info">
              <h3>{dashboardData.fingerprintsCaptured}</h3>
              <p>Fingerprints Captured</p>
            </div>
          </div>

          {/* 6. System Users */}
          <div className="sd-stat-card">
            <div className="sd-stat-icon sd-icon-info">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21V19C17 16.8 15.2 15 13 15H5C2.8 15 1 16.8 1 19V21"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21V19C22.9 16.8 21.1 15 19 15"/>
                <path d="M16 3.13C17.2 3.72 18 5.01 18 6.5C18 7.99 17.2 9.28 16 9.87"/>
              </svg>
            </div>
            <div className="sd-stat-info">
              <h3>{dashboardData.totalUsers}</h3>
              <p>System Users</p>
            </div>
          </div>

          {/* 7. Active Roles */}
          <div className="sd-stat-card">
            <div className="sd-stat-icon sd-icon-secondary">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div className="sd-stat-info">
              <h3>{dashboardData.activeRoles}</h3>
              <p>Active Roles</p>
            </div>
          </div>

          {/* 8. Total Permissions */}
          <div className="sd-stat-card">
            <div className="sd-stat-icon sd-icon-purple">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                <path d="M2 17L12 22L22 17"/>
                <path d="M2 12L12 17L22 12"/>
              </svg>
            </div>
            <div className="sd-stat-info">
              <h3>{dashboardData.totalPermissions}</h3>
              <p>Total Permissions</p>
            </div>
          </div>

          {/* 9. Permission Categories */}
          <div className="sd-stat-card">
            <div className="sd-stat-icon sd-icon-cyan">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
              </svg>
            </div>
            <div className="sd-stat-info">
              <h3>{dashboardData.totalCategories}</h3>
              <p>Permission Categories</p>
            </div>
          </div>

          {/* 10. Online Now - Clickable Card */}
          <div 
            className="sd-stat-card sd-online-card" 
            onClick={handleOnlineNowClick}
            style={{ cursor: 'pointer' }}
          >
            <div className="sd-stat-icon sd-icon-danger">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="4" fill="currentColor"/>
              </svg>
            </div>
            <div className="sd-stat-info">
              <h3>{dashboardData.onlineNow}</h3>
              <p>Online Now</p>
              <small className="sd-click-hint">Click to view online users</small>
            </div>
            <div className="sd-online-indicator">
              <span className="sd-online-dot"></span>
            </div>
          </div>
        </div>

        {/* Row 1: Registration Charts */}
        <div className="sd-charts-row">
          {/* Bar Chart - Monthly Registrations */}
          <div className="sd-chart-card">
            <div className="sd-chart-header">
              <h3>Monthly Registrations</h3>
              <p>Last 6 months trend</p>
            </div>
            <div className="sd-bar-chart">
              {chartData.registrationsByMonth.length > 0 ? (
                chartData.registrationsByMonth.map((item, index) => {
                  const height = (item.count / maxRegistrations) * 150;
                  return (
                    <div key={index} className="sd-bar-item">
                      <div className="sd-bar" style={{ height: `${height}px` }}>
                        <span className="sd-bar-value">{item.count}</span>
                      </div>
                      <div className="sd-bar-label">{item.month}</div>
                    </div>
                  );
                })
              ) : (
                <div className="sd-no-data">No registration data available</div>
              )}
            </div>
          </div>

          {/* Line Chart - Weekly Registrations */}
          <div className="sd-chart-card">
            <div className="sd-chart-header">
              <h3>Weekly Registrations</h3>
              <p>Distribution by week of month</p>
            </div>
            <div className="sd-line-chart">
              {chartData.weeklyRegistrations.length > 0 ? (
                <div className="sd-line-container">
                  <svg className="sd-line-svg" viewBox="0 0 500 200" preserveAspectRatio="none">
                    <polyline
                      className="sd-line-path"
                      points={chartData.weeklyRegistrations.map((item, index) => {
                        const x = (index / (chartData.weeklyRegistrations.length - 1)) * 500;
                        const y = 180 - (item.count / maxWeekly) * 160;
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#667eea"
                      strokeWidth="2"
                    />
                    {chartData.weeklyRegistrations.map((item, index) => {
                      const x = (index / (chartData.weeklyRegistrations.length - 1)) * 500;
                      const y = 180 - (item.count / maxWeekly) * 160;
                      return (
                        <circle key={index} cx={x} cy={y} r="4" fill="#667eea" />
                      );
                    })}
                  </svg>
                  <div className="sd-line-labels">
                    {chartData.weeklyRegistrations.map((item, index) => (
                      <div key={index} className="sd-line-label-item">
                        <div className="sd-line-label">{item.week}</div>
                        <div className="sd-line-value">{item.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="sd-no-data">No weekly data available</div>
              )}
            </div>
          </div>

          {/* Area Chart - Hourly Activity */}
          <div className="sd-chart-card">
            <div className="sd-chart-header">
              <h3>Hourly Registration Activity</h3>
              <p>Registrations by hour of day</p>
            </div>
            <div className="sd-area-chart">
              {chartData.activityByHour.length > 0 ? (
                <div className="sd-area-container">
                  <svg className="sd-area-svg" viewBox="0 0 500 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#667eea" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#667eea" stopOpacity="0.0"/>
                      </linearGradient>
                    </defs>
                    <polygon
                      className="sd-area-polygon"
                      points={`0,180 ${chartData.activityByHour.map((item, index) => {
                        const x = (index / (chartData.activityByHour.length - 1)) * 500;
                        const y = 180 - (item.count / maxHourly) * 160;
                        return `${x},${y}`;
                      }).join(' ')} 500,180 0,180`}
                      fill="url(#areaGradient)"
                    />
                    <polyline
                      className="sd-area-line"
                      points={chartData.activityByHour.map((item, index) => {
                        const x = (index / (chartData.activityByHour.length - 1)) * 500;
                        const y = 180 - (item.count / maxHourly) * 160;
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#667eea"
                      strokeWidth="2"
                    />
                  </svg>
                  <div className="sd-area-labels">
                    {chartData.activityByHour.filter((_, i) => i % 4 === 0).map((item, index) => (
                      <div key={index} className="sd-area-label-item">
                        <div className="sd-area-label">{item.hour}:00</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="sd-no-data">No hourly data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Distribution Charts */}
        <div className="sd-charts-row">
          {/* Donut Chart - Fingerprint Status */}
          <div className="sd-chart-card">
            <div className="sd-chart-header">
              <h3>Fingerprint Enrollment Status</h3>
              <p>Biometric registration progress</p>
            </div>
            <div className="sd-donut-chart">
              <div className="sd-donut-container">
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <circle cx="90" cy="90" r="70" fill="none" stroke="#e8e8e8" strokeWidth="20"/>
                  <circle 
                    cx="90" cy="90" r="70" fill="none" 
                    stroke="#28a745" strokeWidth="20"
                    strokeDasharray={`${(chartData.fingerprintStatus.captured / (chartData.fingerprintStatus.captured + chartData.fingerprintStatus.pending || 1)) * 440} 440`}
                    strokeDashoffset="0" transform="rotate(-90 90 90)"
                  />
                  <text x="90" y="85" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#333">
                    {Math.round((chartData.fingerprintStatus.captured / (chartData.fingerprintStatus.captured + chartData.fingerprintStatus.pending || 1)) * 100)}%
                  </text>
                  <text x="90" y="105" textAnchor="middle" fontSize="12" fill="#888">Enrolled</text>
                </svg>
              </div>
              <div className="sd-donut-legend">
                <div className="sd-legend-item">
                  <span className="sd-legend-color sd-captured"></span>
                  <span>Captured: {chartData.fingerprintStatus.captured}</span>
                </div>
                <div className="sd-legend-item">
                  <span className="sd-legend-color sd-pending"></span>
                  <span>Pending: {chartData.fingerprintStatus.pending}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal Bar Chart - Users by Role */}
          <div className="sd-chart-card">
            <div className="sd-chart-header">
              <h3>Users by Role Distribution</h3>
              <p>System user breakdown</p>
            </div>
            <div className="sd-horizontal-bar-chart">
              {chartData.usersByRole.length > 0 ? (
                chartData.usersByRole.map((item, index) => {
                  const maxUsers = Math.max(...chartData.usersByRole.map(d => d.count), 1);
                  const width = (item.count / maxUsers) * 100;
                  return (
                    <div key={index} className="sd-horizontal-bar-item">
                      <div className="sd-horizontal-bar-label">{item.role}</div>
                      <div className="sd-horizontal-bar-container">
                        <div className="sd-horizontal-bar" style={{ width: `${width}%` }}>
                          <span className="sd-horizontal-bar-value">{item.count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="sd-no-data">No user role data available</div>
              )}
            </div>
          </div>

          {/* System Stats Summary */}
          <div className="sd-chart-card">
            <div className="sd-chart-header">
              <h3>System Overview</h3>
              <p>Platform statistics summary</p>
            </div>
            <div className="sd-system-stats">
              <div className="sd-system-stat-item">
                <div className="sd-system-stat-value">{dashboardData.totalPermissions}</div>
                <div className="sd-system-stat-label">Total Permissions</div>
              </div>
              <div className="sd-system-stat-item">
                <div className="sd-system-stat-value">{dashboardData.totalCategories}</div>
                <div className="sd-system-stat-label">Permission Categories</div>
              </div>
              <div className="sd-system-stat-item">
                <div className="sd-system-stat-value">{dashboardData.totalChildren}</div>
                <div className="sd-system-stat-label">Total Patients</div>
              </div>
              <div className="sd-system-stat-item">
                <div className="sd-system-stat-value">{dashboardData.totalUsers}</div>
                <div className="sd-system-stat-label">Registered Users</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="sd-recent-grid">
          <div className="sd-recent-card">
            <div className="sd-recent-header">
              <h3>Recently Registered Patients</h3>
            </div>
            <div className="sd-recent-table-container">
              <table className="sd-recent-table">
                <thead>
                  <tr><th>Name</th><th>Age</th><th>Registration Date</th><th>Fingerprint</th></tr>
                </thead>
                <tbody>
                  {recentChildren.length > 0 ? (
                    recentChildren.map((child, index) => (
                      <tr key={child.id || index}>
                        <td>{child.fullName}</td>
                        <td>{calculateAge(child.estimatedBirthYear)}</td>
                        <td>{formatDate(child.createdAt)}</td>
                        <td><span className={`sd-status-badge ${child.fingerprintCaptured ? 'sd-status-captured' : 'sd-status-pending'}`}>
                            {child.fingerprintCaptured ? 'Captured' : 'Pending'}
                          </span></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="sd-no-data">No patients registered yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sd-recent-card">
            <div className="sd-recent-header">
              <h3>Recent System Users</h3>
            </div>
            <div className="sd-recent-table-container">
              <table className="sd-recent-table">
                <thead>
                  <tr><th>Username</th><th>Full Name</th><th>Role</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {recentUsers.length > 0 ? (
                    recentUsers.map((userItem, index) => (
                      <tr key={userItem.id || index}>
                        <td>{userItem.username}</td>
                        <td>{userItem.firstName} {userItem.lastName}</td>
                        <td>{userItem.roleName}</td>
                        <td><span className="sd-status-badge sd-status-active">{userItem.securityStatus || 'ACTIVE'}</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="sd-no-data">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="sd-section-title">Quick Actions</div>
        
        {/* Quick Actions */}
        <div className="sd-actions-grid">
          <button className="sd-action-btn" onClick={() => navigate('/child-registration')}>
            <div className="sd-action-icon sd-icon-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4"/>
                <path d="M5.5 20V19C5.5 16.8 7.3 15 9.5 15H14.5C16.7 15 18.5 16.8 18.5 19V20"/>
              </svg>
            </div>
            <div className="sd-action-info">
              <h4>Register New Patients</h4>
              <p>Capture patient information and fingerprint</p>
            </div>
          </button>

          <button className="sd-action-btn" onClick={() => navigate('/user-management')}>
            <div className="sd-action-icon sd-icon-success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21"/>
                <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"/>
              </svg>
            </div>
            <div className="sd-action-info">
              <h4>Manage Users</h4>
              <p>Add, edit, or delete system users</p>
            </div>
          </button>

          <button className="sd-action-btn" onClick={() => navigate('/user-management')}>
            <div className="sd-action-icon sd-icon-warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div className="sd-action-info">
              <h4>Manage Roles & Permissions</h4>
              <p>Configure roles and access rights</p>
            </div>
          </button>

          <button className="sd-action-btn" onClick={() => navigate('/child-registration')}>
            <div className="sd-action-icon sd-icon-info">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                <path d="M12 6v6l4 2"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
              </svg>
            </div>
            <div className="sd-action-info">
              <h4>View Reports</h4>
              <p>Generate and export reports</p>
            </div>
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="superuser-dashboard">
      {currentView === 'dashboard' ? renderDashboardView() : renderOnlineUsersView()}
    </div>
  );
};

export default SuperUserDashboard;