import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './UserManagement.css';

const UserManagement = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  const handleAddUser = () => {
    alert('Add New User Form');
  };

  const handleManageRoles = () => {
    alert('Role Management');
  };

  const handleViewAuditLogs = () => {
    alert('Audit Logs');
  };

  const users = [
    { name: 'John Doe', email: 'john@fingerprint.com', role: 'Admin', status: 'active', lastActive: '2024-01-15' },
    { name: 'Jane Smith', email: 'jane@fingerprint.com', role: 'Nurse', status: 'active', lastActive: '2024-01-14' },
    { name: 'Dr. Sarah Johnson', email: 'sarah@fingerprint.com', role: 'Doctor', status: 'active', lastActive: '2024-01-13' },
    { name: 'Mike Brown', email: 'mike@fingerprint.com', role: 'Lab Technician', status: 'inactive', lastActive: '2024-01-10' },
    { name: 'Lisa Wilson', email: 'lisa@fingerprint.com', role: 'Pharmacist', status: 'active', lastActive: '2024-01-12' },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="user-management-container">
        <div className="page-header">
          <h1>User Management</h1>
          <p>Manage system users, roles, and permissions</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 16.8 15.2 15 13 15H5C2.8 15 1 16.8 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 21V19C22.9 16.8 21.1 15 19 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3.13C17.2 3.72 18 5.01 18 6.5C18 7.99 17.2 9.28 16 9.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>25</h3>
              <p>Total Users</p>
              <span className="trend">+3 this month</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>5</h3>
              <p>Active Roles</p>
              <span className="trend">Admin, Nurse, Doctor, Lab, Pharma</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="4" fill="currentColor" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>12</h3>
              <p>Online Now</p>
              <span className="trend">Currently active</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section-title">Quick Actions</div>
        <div className="actions-grid">
          <div className="action-card" onClick={handleAddUser}>
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 22L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="action-info">
              <h4>Add New User</h4>
              <p>Create new system user account</p>
            </div>
          </div>
          <div className="action-card" onClick={handleManageRoles}>
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="action-info">
              <h4>Manage Roles</h4>
              <p>Configure roles and permissions</p>
            </div>
          </div>
          <div className="action-card" onClick={handleViewAuditLogs}>
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 3L3 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="5" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="action-info">
              <h4>View Audit Logs</h4>
              <p>Track system activities</p>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="section-title">System Users</div>
        <div className="recent-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Last Active</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userItem, index) => (
                <tr key={index}>
                  <td>{userItem.name}</td>
                  <td>{userItem.email}</td>
                  <td>{userItem.role}</td>
                  <td>{userItem.lastActive}</td>
                  <td>
                    <span className={`status-badge ${userItem.status === 'active' ? 'status-completed' : 'status-pending'}`}>
                      {userItem.status}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn edit-btn" onClick={() => alert(`Edit ${userItem.name}`)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3L21 7L7 21H3V17L17 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button className="action-btn delete-btn" onClick={() => alert(`Delete ${userItem.name}`)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default UserManagement;