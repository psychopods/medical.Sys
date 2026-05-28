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
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      console.log('User loaded:', JSON.parse(storedUser));
    } else {
      console.log('No user found, redirecting to login');
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

  const renderDashboardContent = () => {
    if (!user) return null;

    switch (user.role) {
      case 'superuser':
        return <SuperUserDashboard user={user} />;
      case 'nurse':
        return <NurseDashboard user={user} />;
      case 'doctor':
        return <DoctorDashboard user={user} />;
      case 'lab_technician':
        return <LabTechnicianDashboard user={user} />;
      case 'pharmacist':
        return <PharmacistDashboard user={user} />;
      case 'staff':
        return <StaffDashboard user={user} />;
      default:
        return <StaffDashboard user={user} />;
    }
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