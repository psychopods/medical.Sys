import React, { useState } from 'react';
import './VolunteerSupport.css';
import { submitVolunteerApplication } from '../services/api.js';

const API_BASE_URL = 'http://localhost:9865';

const VolunteerSupport = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    volunteerType: '',
    message: ''
  });
  
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
    volunteerType: '',
    message: ''
  });
  
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    volunteerType: false,
    message: false
  });
  
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const volunteerTypes = [
    { value: 'medical', label: 'Medical Professional' },
    { value: 'outreach', label: 'Outreach Volunteer' },
    { value: 'education', label: 'Health Educator' },
    { value: 'admin', label: 'Administrative Support' },
    { value: 'fundraising', label: 'Fundraising' },
    { value: 'other', label: 'Other' }
  ];

  const supportOptions = [
    {
      icon: 'donate',
      title: 'Make a Donation',
      description: 'Your financial support helps us provide medical care, food, clothing, and education to vulnerable children.',
      buttonText: 'Donate Now',
      link: '/donate'
    },
    {
      icon: 'volunteer',
      title: 'Become a Volunteer',
      description: 'Join our team of dedicated volunteers and make a direct impact in the lives of street children.',
      buttonText: 'Join Us',
      link: '#volunteer-form'
    },
    {
      icon: 'partner',
      title: 'Partner With Us',
      description: 'Collaborate with us as an organization to expand our reach and create sustainable change.',
      buttonText: 'Become a Partner',
      link: '/contact'
    },
    {
      icon: 'supplies',
      title: 'Donate Supplies',
      description: 'Provide medical supplies, food, clothing, shoes, and educational materials for children in need.',
      buttonText: 'Donate Supplies',
      link: '/contact'
    }
  ];

  const getIcon = (iconName) => {
    switch(iconName) {
      case 'donate':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="#0066cc" strokeWidth="2"/>
            <path d="M12 6V12L16 14" stroke="#0066cc" strokeWidth="2"/>
            <circle cx="12" cy="12" r="3" stroke="#0066cc" strokeWidth="2"/>
          </svg>
        );
      case 'volunteer':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="#0066cc" strokeWidth="2"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#0066cc" strokeWidth="2"/>
            <path d="M17 3.5L18.5 2L20 3.5L18.5 5L17 3.5Z" fill="#0066cc" stroke="#0066cc" strokeWidth="1"/>
            <path d="M21 7.5L22.5 6L24 7.5L22.5 9L21 7.5Z" fill="#0066cc" stroke="#0066cc" strokeWidth="1"/>
          </svg>
        );
      case 'partner':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 21V19C17 16.8 15.2 15 13 15H5C2.8 15 1 16.8 1 19V21" stroke="#0066cc" strokeWidth="2"/>
            <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#0066cc" strokeWidth="2"/>
            <path d="M23 21V19C22.9 17.2 21.5 15.6 19.7 15.3" stroke="#0066cc" strokeWidth="2"/>
            <path d="M16 3.3C17.8 3.7 19.1 5.3 19.1 7.2C19.1 9.1 17.8 10.7 16 11.1" stroke="#0066cc" strokeWidth="2"/>
          </svg>
        );
      case 'supplies':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#0066cc" strokeWidth="2"/>
            <path d="M2 17L12 22L22 17" stroke="#0066cc" strokeWidth="2"/>
            <path d="M2 12L12 17L22 12" stroke="#0066cc" strokeWidth="2"/>
            <path d="M12 12V22" stroke="#0066cc" strokeWidth="2"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const validateName = (value) => {
    if (!value.trim()) return 'Name is required';
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    return '';
  };

  const validateEmail = (value) => {
    if (!value.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) return 'Please enter a valid email address';
    return '';
  };

  const validatePhone = (value) => {
    if (!value.trim()) return 'Phone number is required';
    const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
    if (!phoneRegex.test(value.trim())) return 'Please enter a valid phone number';
    return '';
  };

  const validateVolunteerType = (value) => {
    if (!value) return 'Please select a volunteer type';
    return '';
  };

  const validateMessage = (value) => {
    if (!value.trim()) return 'Message is required';
    if (value.trim().length < 10) return 'Message must be at least 10 characters';
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    let error = '';
    switch (name) {
      case 'name': error = validateName(value); break;
      case 'email': error = validateEmail(value); break;
      case 'phone': error = validatePhone(value); break;
      case 'volunteerType': error = validateVolunteerType(value); break;
      case 'message': error = validateMessage(value); break;
      default: break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    let error = '';
    switch (name) {
      case 'name': error = validateName(value); break;
      case 'email': error = validateEmail(value); break;
      case 'phone': error = validatePhone(value); break;
      case 'volunteerType': error = validateVolunteerType(value); break;
      case 'message': error = validateMessage(value); break;
      default: break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      volunteerType: validateVolunteerType(formData.volunteerType),
      message: validateMessage(formData.message)
    };
    setErrors(newErrors);
    setTouched({
      name: true, email: true, phone: true, volunteerType: true, message: true
    });
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix the errors before submitting', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const submitData = {
        full_name: formData.name,
        email_address: formData.email,
        phone_number: formData.phone,
        volunteer_type: formData.volunteerType,
        message: formData.message
      };
      
      const data = await submitVolunteerApplication(submitData);
      
      if (data.success) {
        showToast(data.queued ? 'Application queued offline. It will be sent when connection is restored.' : 'Thank you for your interest! We will contact you soon.', 'success');
        
        setFormData({
          name: '', email: '', phone: '', volunteerType: '', message: ''
        });
        setTouched({
          name: false, email: false, phone: false, volunteerType: false, message: false
        });
        setErrors({
          name: '', email: '', phone: '', volunteerType: '', message: ''
        });
      } else {
        showToast(data.message || 'Failed to submit application. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error submitting volunteer application:', error);
      showToast('Network error. Please check your connection.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToVolunteerForm = () => {
    const formElement = document.getElementById('volunteer-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="volunteer-page">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-content">
            <span>{toast.message}</span>
          </div>
          <button className="toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
        </div>
      )}

      {/* Hero Section */}
      <div className="volunteer-hero">
        <div className="volunteer-hero-content">
          <h1>Support Our Mission</h1>
          <p>Join us in making a difference in the lives of vulnerable children</p>
        </div>
      </div>

      {/* Ways to Support Section - Placed BEFORE Become a Volunteer */}
      <div className="support-options-section">
        <div className="container">
          <h2 className="support-title">Ways to Support</h2>
          <div className="support-options-grid">
            {supportOptions.map((option, index) => (
              <div className="support-card" key={index}>
                <div className="support-icon">{getIcon(option.icon)}</div>
                <h3>{option.title}</h3>
                <p>{option.description}</p>
                {option.icon === 'volunteer' ? (
                  <button onClick={scrollToVolunteerForm} className="support-btn">{option.buttonText}</button>
                ) : (
                  <a href={option.link} className="support-btn">{option.buttonText}</a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Volunteer Form Section - Placed AFTER Ways to Support */}
      <div id="volunteer-form" className="volunteer-form-section">
        <div className="container">
          <div className="volunteer-form-wrapper">
            <div className="volunteer-form-left">
              <h2>Become a Volunteer</h2>
              <p>Fill out the form below to join our team of dedicated volunteers. We'll get back to you within 2-3 business days.</p>
              <div className="volunteer-info">
                <div className="info-item">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="#0066cc" strokeWidth="2"/>
                    <path d="M12 6V12L16 14" stroke="#0066cc" strokeWidth="2"/>
                  </svg>
                  <div>
                    <h4>Flexible Hours</h4>
                    <p>Volunteer on your own schedule</p>
                  </div>
                </div>
                <div className="info-item">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15 9H22L16 14L19 21L12 17L5 21L8 14L2 9H9L12 2Z" stroke="#0066cc" strokeWidth="2"/>
                  </svg>
                  <div>
                    <h4>Make an Impact</h4>
                    <p>Directly help children in need</p>
                  </div>
                </div>
                <div className="info-item">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="#0066cc" strokeWidth="2"/>
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#0066cc" strokeWidth="2"/>
                  </svg>
                  <div>
                    <h4>Join a Community</h4>
                    <p>Connect with like-minded people</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="volunteer-form-right">
              <div className="volunteer-form-card">
                <form onSubmit={handleSubmit} className="volunteer-form" noValidate>
                  <div className="form-group">
                    <label>Full Name <span className="required">*</span></label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={touched.name && errors.name ? 'error' : ''}
                    />
                    {touched.name && errors.name && <div className="error-message">{errors.name}</div>}
                  </div>

                  <div className="form-group">
                    <label>Email Address <span className="required">*</span></label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={touched.email && errors.email ? 'error' : ''}
                    />
                    {touched.email && errors.email && <div className="error-message">{errors.email}</div>}
                  </div>

                  <div className="form-group">
                    <label>Phone Number <span className="required">*</span></label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={touched.phone && errors.phone ? 'error' : ''}
                    />
                    {touched.phone && errors.phone && <div className="error-message">{errors.phone}</div>}
                  </div>

                  <div className="form-group">
                    <label>Volunteer Type <span className="required">*</span></label>
                    <select
                      name="volunteerType"
                      value={formData.volunteerType}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={touched.volunteerType && errors.volunteerType ? 'error' : ''}
                    >
                      <option value="">Select volunteer type</option>
                      {volunteerTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    {touched.volunteerType && errors.volunteerType && <div className="error-message">{errors.volunteerType}</div>}
                  </div>

                  <div className="form-group">
                    <label>Message / Why do you want to volunteer? <span className="required">*</span></label>
                    <textarea
                      name="message"
                      rows="4"
                      placeholder="Tell us why you're interested in volunteering..."
                      value={formData.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={touched.message && errors.message ? 'error' : ''}
                    ></textarea>
                    {touched.message && errors.message && <div className="error-message">{errors.message}</div>}
                    <div className="char-counter">{formData.message.length}/500 characters</div>
                  </div>

                  <button type="submit" className="submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerSupport;