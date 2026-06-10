import React, { useState } from 'react';
import './Contact.css';
import { submitContactForm } from '../services/api.js';

const API_BASE_URL = 'http://localhost:9865';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    subject: false,
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

  // Validation functions
  const validateName = (value) => {
    if (!value.trim()) {
      return 'Name is required';
    }
    if (value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (value.trim().length > 50) {
      return 'Name must be less than 50 characters';
    }
    if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
      return 'Name can only contain letters and spaces';
    }
    return '';
  };

  const validateEmail = (value) => {
    if (!value.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validateSubject = (value) => {
    if (!value.trim()) {
      return 'Subject is required';
    }
    if (value.trim().length < 3) {
      return 'Subject must be at least 3 characters';
    }
    if (value.trim().length > 100) {
      return 'Subject must be less than 100 characters';
    }
    return '';
  };

  const validateMessage = (value) => {
    if (!value.trim()) {
      return 'Message is required';
    }
    if (value.trim().length < 10) {
      return 'Message must be at least 10 characters';
    }
    if (value.trim().length > 500) {
      return 'Message must be less than 500 characters';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    let error = '';
    switch (name) {
      case 'name':
        error = validateName(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'subject':
        error = validateSubject(value);
        break;
      case 'message':
        error = validateMessage(value);
        break;
      default:
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    let error = '';
    switch (name) {
      case 'name':
        error = validateName(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'subject':
        error = validateSubject(value);
        break;
      case 'message':
        error = validateMessage(value);
        break;
      default:
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      subject: validateSubject(formData.subject),
      message: validateMessage(formData.message)
    };
    
    setErrors(newErrors);
    
    setTouched({
      name: true,
      email: true,
      subject: true,
      message: true
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
      // Prepare data with snake_case for backend
      const submitData = {
        full_name: formData.name,
        email_address: formData.email,
        message_subject: formData.subject,
        message_content: formData.message
      };
      
      const data = await submitContactForm(submitData);
      
      if (data.success) {
        showToast(data.queued ? 'Message queued offline. It will be sent when connection is restored.' : 'Message sent successfully! We\'ll contact you soon.', 'success');
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
        setTouched({
          name: false,
          email: false,
          subject: false,
          message: false
        });
        setErrors({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        showToast(data.message || 'Failed to send message. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      showToast('Network error. Please check your connection.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Office Address',
      details: ['Nyasaka, Mwanza – Tanzania']
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7294C21.7209 20.9845 21.5573 21.2136 21.352 21.4019C21.1467 21.5901 20.9044 21.7335 20.6407 21.8227C20.377 21.9119 20.0975 21.945 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.17 18.85C8.77339 17.3147 6.72533 15.2666 5.19 12.87C3.49911 10.2412 2.44847 7.27147 2.12 4.18C2.09508 3.90353 2.12791 3.62496 2.21673 3.36212C2.30555 3.09928 2.44838 2.85766 2.63595 2.65273C2.82353 2.4478 3.05183 2.2843 3.30629 2.17243C3.56075 2.06056 3.8358 2.00295 4.114 2.003H7.114C7.59512 1.99831 8.06584 2.14076 8.46248 2.41041C8.85911 2.68005 9.15998 3.06252 9.322 3.51C9.58123 4.24178 9.76598 4.99767 9.874 5.767C9.94477 6.26118 9.89305 6.76492 9.72364 7.2335C9.55424 7.70209 9.27246 8.12003 8.905 8.447L8.015 9.272C9.42636 11.6562 11.3869 13.6186 13.77 15.032L14.596 14.142C14.9225 13.7749 15.3401 13.4935 15.8083 13.3243C16.2766 13.1551 16.7799 13.1034 17.274 13.174C18.0467 13.2825 18.806 13.4689 19.541 13.73C19.992 13.8927 20.3771 14.1962 20.6479 14.5967C20.9186 14.9972 21.0604 15.4723 21.053 15.957L21 16.92Z" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Phone',
      details: ['+255 7688 668 490', '+255 759 095 943']
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 6L12 13L2 6" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Email',
      details: ['info@tanzaniaruralhealth.or.tz']
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 6V12L16 14" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Business Hours',
      details: ['Mon-Fri: 9:00 AM - 6:00 PM', 'Sat: 9:00 AM - 2:00 PM']
    }
  ];

  return (
    <div className="contact-page">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-content">
            {toast.type === 'success' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
          <button className="toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Hero Section */}
      <div className="contact-hero">
        <div className="contact-hero-content">
          <h1>Contact Us</h1>
          <p>TRHM - Reach out to support our mission for rural health</p>
        </div>
      </div>

      {/* Contact Info Section */}
      <div className="contact-info-section">
        <div className="container">
          <div className="contact-info-grid">
            {contactInfo.map((info, index) => (
              <div className="contact-info-item" key={index}>
                <div className="contact-info-icon">
                  {info.icon}
                </div>
                <h3>{info.title}</h3>
                {info.details.map((detail, i) => (
                  <p key={i}>{detail}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="contact-form-section">
        <div className="container">
          <div className="contact-form-wrapper">
            <div className="contact-form-left">
              <h2>Send us a Message</h2>
              <p>Have questions about our programs or want to support our cause? Fill out the form and our team will get back to you.</p>
              <div className="contact-features">
                <div className="contact-feature">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Quick Response Time</span>
                </div>
                <div className="contact-feature">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 16V12" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8H12.01" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Compassionate Support</span>
                </div>
                <div className="contact-feature">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#0066cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Dedicated Team</span>
                </div>
              </div>
            </div>
            <div className="contact-form-right">
              <div className="contact-form-card">
                <form onSubmit={handleSubmit} className="contact-form" noValidate>
                  <div className="form-group">
                    <label htmlFor="name">
                      Your Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={touched.name && errors.name ? 'error' : ''}
                    />
                    {touched.name && errors.name && (
                      <div className="error-message">{errors.name}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">
                      Email Address <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={touched.email && errors.email ? 'error' : ''}
                    />
                    {touched.email && errors.email && (
                      <div className="error-message">{errors.email}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">
                      Subject <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      placeholder="Enter subject"
                      value={formData.subject}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={touched.subject && errors.subject ? 'error' : ''}
                    />
                    {touched.subject && errors.subject && (
                      <div className="error-message">{errors.subject}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">
                      Message <span className="required">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows="5"
                      placeholder="Enter your message here..."
                      value={formData.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={touched.message && errors.message ? 'error' : ''}
                    ></textarea>
                    {touched.message && errors.message && (
                      <div className="error-message">{errors.message}</div>
                    )}
                    <div className="char-counter">
                      {formData.message.length}/500 characters
                    </div>
                  </div>

                  <button type="submit" className="submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 2C14.6522 2 17.1957 3.05357 19.0711 4.92893" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </>
                    )}
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

export default Contact;