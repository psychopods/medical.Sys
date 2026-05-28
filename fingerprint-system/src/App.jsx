import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TopHeader from './components/TopHeader';
import BottomHeader from './components/BottomHeader';
import HeroSection from './components/HeroSection';
import Footer from './components/Footer';
import Login from './components/Login';
import Services from './components/Services';
import About from './components/About';
import Contact from './components/Contact';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard/Dashboard';
import UserManagement from './components/Dashboard/UserManagement';
import ChildRegistration from './components/Dashboard/ChildRegistration';
import MedicalExamination from './components/Dashboard/MedicalExamination';
import Laboratory from './components/Dashboard/Laboratory';
import Pharmacy from './components/Dashboard/Pharmacy';
import { ProtectedRoute, RoleBasedRoute } from './components/ProtectedRoute';
import './App.css';

// Layout for public pages (with headers and footer)
const PublicLayout = ({ children }) => {
  return (
    <>
      <TopHeader />
      <BottomHeader />
      {children}
      <Footer />
    </>
  );
};

// Layout for protected pages (without headers, just the content)
const ProtectedLayout = ({ children }) => {
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes with headers and footer */}
          <Route path="/" element={
            <PublicLayout>
              <HeroSection />
            </PublicLayout>
          } />
          <Route path="/login" element={
            <PublicLayout>
              <Login />
            </PublicLayout>
          } />
          <Route path="/forgot-password" element={
            <PublicLayout>
              <ForgotPassword />
            </PublicLayout>
          } />
          <Route path="/services" element={
            <PublicLayout>
              <Services />
            </PublicLayout>
          } />
          <Route path="/about" element={
            <PublicLayout>
              <About />
            </PublicLayout>
          } />
          <Route path="/contact" element={
            <PublicLayout>
              <Contact />
            </PublicLayout>
          } />
          
          {/* Protected Routes - NO headers, just the dashboard content */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            </ProtectedRoute>
          } />
          
          {/* Role-Based Routes - NO headers */}
          <Route path="/user-management" element={
            <RoleBasedRoute allowedRoles={['superuser']}>
              <ProtectedLayout>
                <UserManagement />
              </ProtectedLayout>
            </RoleBasedRoute>
          } />
          
          <Route path="/child-registration" element={
            <RoleBasedRoute allowedRoles={['superuser', 'nurse', 'staff']}>
              <ProtectedLayout>
                <ChildRegistration />
              </ProtectedLayout>
            </RoleBasedRoute>
          } />
          
          <Route path="/medical-examination" element={
            <RoleBasedRoute allowedRoles={['superuser', 'doctor']}>
              <ProtectedLayout>
                <MedicalExamination />
              </ProtectedLayout>
            </RoleBasedRoute>
          } />
          
          <Route path="/laboratory" element={
            <RoleBasedRoute allowedRoles={['superuser', 'lab_technician']}>
              <ProtectedLayout>
                <Laboratory />
              </ProtectedLayout>
            </RoleBasedRoute>
          } />
          
          <Route path="/pharmacy" element={
            <RoleBasedRoute allowedRoles={['superuser', 'pharmacist']}>
              <ProtectedLayout>
                <Pharmacy />
              </ProtectedLayout>
            </RoleBasedRoute>
          } />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;