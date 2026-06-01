import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import SuperUserDashboard from './SuperUserDashboard';
import NurseDashboard from './NurseDashboard';
import DoctorDashboard from './DoctorDashboard';
import LabTechnicianDashboard from './LabTechnicianDashboard';
import PharmacistDashboard from './PharmacistDashboard';
import StaffDashboard from './StaffDashboard';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user from storage
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // Check both user AND token for better security
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      console.log('User loaded:', JSON.parse(storedUser));
    } else {
      console.log('No user or token found, redirecting to login');
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  const renderDashboardContent = () => {
    if (!user) return null;

    // Role to component mapping (cleaner than switch)
    const roleComponents = {
      superuser: SuperUserDashboard,
      nurse: NurseDashboard,
      doctor: DoctorDashboard,
      lab_technician: LabTechnicianDashboard,
      pharmacist: PharmacistDashboard,
      staff: StaffDashboard,
    };

    const DashboardComponent = roleComponents[user.role] || StaffDashboard;
    return <DashboardComponent user={user} onLogout={handleLogout} />;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      {renderDashboardContent()}
    </Layout>
  );
};

export default Dashboard;