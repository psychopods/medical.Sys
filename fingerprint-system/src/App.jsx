import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppInitializer from './components/AppInitializer';
import TopHeader from './components/TopHeader';
import BottomHeader from './components/BottomHeader';
import HeroSection from './components/HeroSection';
import MessageBar from './components/MessageBar';
import Footer from './components/Footer';
import Login from './components/Login';
import Services from './components/Services';
import About from './components/About';
import Contact from './components/Contact';
import Partners from './components/Partners';
import Mission from './components/Mission';
import Staff from './components/Staff';
import Gallery from './components/Gallery';
import VolunteerSupport from './components/VolunteerSupport';
import ReportsImpact from './components/ReportsImpact';
import StreetMedicine from './components/StreetMedicine';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard/Dashboard';
import UserManagement from './components/Dashboard/UserManagement';
import ChildRegistration from './components/Dashboard/ChildRegistration';
import MedicalExamination from './components/Dashboard/MedicalExamination';
import Laboratory from './components/Dashboard/Laboratory';
import Pharmacy from './components/Dashboard/Pharmacy';
import GalleryAdmin from './components/Dashboard/GalleryAdmin';
import ReportsAdmin from './components/Dashboard/ReportsAdmin';
import VolunteerAdmin from './components/Dashboard/VolunteerAdmin';
import ContactAdmin from './components/Dashboard/ContactAdmin';
import MedicalRecords from './components/Dashboard/MedicalRecords';
import UserProfile from './components/Dashboard/UserProfile';
import NotificationsAdmin from './components/Dashboard/NotificationsAdmin';
import { ProtectedRoute, RoleBasedRoute } from './components/ProtectedRoute';
import './App.css';

// Layout for public pages (with headers and footer)
const PublicLayout = ({ children }) => {
  return (
    <>
      <TopHeader />
      <BottomHeader />
      <MessageBar />
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
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    // Hide loading screen and show the app
    setIsLoading(false);
  };

  // Show loading screen while isLoading is true
  if (isLoading) {
    return <AppInitializer onLoadingComplete={handleLoadingComplete} />;
  }

  // Show the actual app after loading is complete
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Redirect root to home after loading */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          
          {/* Public Routes with headers and footer */}
          <Route path="/home" element={
            <PublicLayout>
              <HeroSection />
              <Mission />
              <Staff />
              <Partners />
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
          <Route path="/partners" element={
            <PublicLayout>
              <Partners />
            </PublicLayout>
          } />
          <Route path="/mission" element={
            <PublicLayout>
              <Mission />
            </PublicLayout>
          } />
          <Route path="/gallery" element={
            <PublicLayout>
              <Gallery />
            </PublicLayout>
          } />
          <Route path="/support" element={
            <PublicLayout>
              <VolunteerSupport />
            </PublicLayout>
          } />
          <Route path="/reports" element={
            <PublicLayout>
              <ReportsImpact />
            </PublicLayout>
          } />
          <Route path="/street-medicine" element={
            <PublicLayout>
              <StreetMedicine />
            </PublicLayout>
          } />
          <Route path="/staff" element={
            <PublicLayout>
              <Staff />
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
          
          {/* User Profile Route - Accessible to all authenticated users */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProtectedLayout>
                <UserProfile />
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
          
          {/* Gallery Admin Route */}
          <Route path="/gallery-admin" element={
            <RoleBasedRoute allowedRoles={['superuser', 'admin']}>
              <ProtectedLayout>
                <GalleryAdmin />
              </ProtectedLayout>
            </RoleBasedRoute>
          } />
          
          {/* Reports Admin Route */}
          <Route path="/reports-admin" element={
            <RoleBasedRoute allowedRoles={['superuser', 'admin']}>
              <ProtectedLayout>
                <ReportsAdmin />
              </ProtectedLayout>
            </RoleBasedRoute>
          } />
          
          {/* Volunteer Admin Route */}
          <Route path="/volunteer-admin" element={
            <RoleBasedRoute allowedRoles={['superuser', 'admin']}>
              <ProtectedLayout>
                <VolunteerAdmin />
              </ProtectedLayout>
            </RoleBasedRoute>
          } />
          
          {/* Contact Admin Route */}
          <Route path="/contact-admin" element={
            <RoleBasedRoute allowedRoles={['superuser', 'admin']}>
              <ProtectedLayout>
                <ContactAdmin />
              </ProtectedLayout>
            </RoleBasedRoute>
          } />
          
          {/* Medical Records Route */}
          <Route path="/medical-records" element={
            <RoleBasedRoute allowedRoles={['superuser', 'admin', 'doctor', 'nurse']}>
              <ProtectedLayout>
                <MedicalRecords />
              </ProtectedLayout>
            </RoleBasedRoute>
          } />
          
          {/* Notifications Admin Route */}
          <Route path="/notifications-admin" element={
            <RoleBasedRoute allowedRoles={['superuser', 'admin']}>
              <ProtectedLayout>
                <NotificationsAdmin />
              </ProtectedLayout>
            </RoleBasedRoute>
          } />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;