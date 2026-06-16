// Centralized API Endpoints Configuration

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://trhm-api.mitzkits.co.tz';

const buildUrl = (envVar, fallbackPath) => {
  const path = import.meta.env[envVar] || fallbackPath;
  return `${API_BASE_URL}${path}`;
};

export const API_ENDPOINTS = {
  // Auth
  login: buildUrl('VITE_API_PATH_LOGIN', '/api/auth/login'),
  users: buildUrl('VITE_API_PATH_USERS', '/api/auth/users'),
  user: (id) => `${buildUrl('VITE_API_PATH_USERS', '/api/auth/users')}/${id}`,
  resetPassword: (id) => `${buildUrl('VITE_API_PATH_USERS', '/api/auth/users')}/${id}/reset-password`,
  generateUsername: (year) => `${buildUrl('VITE_API_PATH_GENERATE_USERNAME', '/api/auth/users/generate_username')}?year=${year}`,
  sendCredentials: buildUrl('VITE_API_PATH_SEND_CREDENTIALS', '/api/auth/send_credentials'),
  onlineCount: buildUrl('VITE_API_PATH_ONLINE_COUNT', '/api/auth/online-count'),
  onlineUsers: buildUrl('VITE_API_PATH_ONLINE_USERS', '/api/auth/online_users'),
  forgotPassword: buildUrl('VITE_API_PATH_FORGOT_PASSWORD', '/api/auth/forgot-password'),
  verifyOtp: buildUrl('VITE_API_PATH_VERIFY_OTP', '/api/auth/verify-otp'),
  resendOtp: buildUrl('VITE_API_PATH_RESEND_OTP', '/api/auth/resend-otp'),
  generalResetPassword: buildUrl('VITE_API_PATH_RESET_PASSWORD', '/api/auth/reset-password'),
  
  // Locations
  locations: buildUrl('VITE_API_PATH_LOCATIONS', '/api/locations'),
  location: (id) => `${buildUrl('VITE_API_PATH_LOCATIONS', '/api/locations')}/${id}`,

  // Children
  children: buildUrl('VITE_API_PATH_CHILDREN', '/api/children'),
  childrenByDate: (date) => `${buildUrl('VITE_API_PATH_CHILDREN', '/api/children')}?registrationDate=${date}`,
  child: (id) => `${buildUrl('VITE_API_PATH_CHILDREN', '/api/children')}/${id}`,

  // Medical Records & Vitals
  medicalRecords: (childId) => `${buildUrl('VITE_API_PATH_CHILDREN', '/api/children')}/${childId}/medical-records`,
  vitals: (childId) => `${buildUrl('VITE_API_PATH_CHILDREN', '/api/children')}/${childId}/vitals`,
  nutritionalHistory: (childId) => `${buildUrl('VITE_API_PATH_CHILDREN', '/api/children')}/${childId}/nutritional-history`,
  medications: (childId) => `${buildUrl('VITE_API_PATH_CHILDREN', '/api/children')}/${childId}/medications`,
  tests: (childId) => `${buildUrl('VITE_API_PATH_CHILDREN', '/api/children')}/${childId}/tests`,
  testsHistory: (childId) => `${buildUrl('VITE_API_PATH_CHILDREN', '/api/children')}/${childId}/tests-history`,
  services: (childId) => `${buildUrl('VITE_API_PATH_CHILDREN', '/api/children')}/${childId}/services`,
  symptoms: (childId) => `${buildUrl('VITE_API_PATH_CHILDREN', '/api/children')}/${childId}/symptoms`,
  clothing: (childId) => `${buildUrl('VITE_API_PATH_CHILDREN', '/api/children')}/${childId}/clothing`,
  educationHistory: (childId) => `${buildUrl('VITE_API_PATH_CHILDREN', '/api/children')}/${childId}/education-history`,
  baseline: (childId) => `${buildUrl('VITE_API_PATH_CHILDREN', '/api/children')}/${childId}/baseline`,
  medicalServices: (childId) => `${buildUrl('VITE_API_PATH_CHILDREN', '/api/children')}/${childId}/medical-services`,
  socialServices: (childId) => `${buildUrl('VITE_API_PATH_CHILDREN', '/api/children')}/${childId}/social-services`,
  education: (childId) => `${buildUrl('VITE_API_PATH_CHILDREN', '/api/children')}/${childId}/education`,

  // Biometrics
  biometricsEnroll: buildUrl('VITE_API_PATH_BIOMETRICS_ENROLL', '/api/biometrics/enroll'),
  biometricsChild: (childId) => `${buildUrl('VITE_API_PATH_BIOMETRICS_CHILD', '/api/biometrics/child')}/${childId}`,

  // Contact
  contactSubmit: buildUrl('VITE_API_PATH_CONTACT_SUBMIT', '/api/contact/submit'),
  contactSubmissions: buildUrl('VITE_API_PATH_CONTACT_SUBMISSIONS', '/api/contact/submissions'),
  contactSubmission: (id) => `${buildUrl('VITE_API_PATH_CONTACT_SUBMISSIONS', '/api/contact/submissions')}/${id}`,

  // Volunteer
  volunteerSubmit: buildUrl('VITE_API_PATH_VOLUNTEER_SUBMIT', '/api/volunteer/submit'),
  volunteerSubmissions: buildUrl('VITE_API_PATH_VOLUNTEER_SUBMISSIONS', '/api/volunteer/submissions'),
  volunteerSubmission: (id) => `${buildUrl('VITE_API_PATH_VOLUNTEER_SUBMISSIONS', '/api/volunteer/submissions')}/${id}`,

  // Gallery
  galleryCategories: buildUrl('VITE_API_PATH_GALLERY_CATEGORIES', '/api/gallery/categories'),
  galleryCategory: (key) => `${buildUrl('VITE_API_PATH_GALLERY_CATEGORIES', '/api/gallery/categories')}/${key}`,
  galleryItems: buildUrl('VITE_API_PATH_GALLERY_ITEMS', '/api/gallery/items'),
  galleryItem: (id) => `${buildUrl('VITE_API_PATH_GALLERY_ITEMS', '/api/gallery/items')}/${id}`,

  // Reports
  reportsAnnual: buildUrl('VITE_API_PATH_REPORTS_ANNUAL', '/api/reports/annual'),
  reportsAnnualId: (id) => `${buildUrl('VITE_API_PATH_REPORTS_ANNUAL', '/api/reports/annual')}/${id}`,
  reportsQuarterly: buildUrl('VITE_API_PATH_REPORTS_QUARTERLY', '/api/reports/quarterly'),
  reportsQuarterlyId: (id) => `${buildUrl('VITE_API_PATH_REPORTS_QUARTERLY', '/api/reports/quarterly')}/${id}`,
  reportsSuccessStories: buildUrl('VITE_API_PATH_REPORTS_SUCCESS_STORIES', '/api/reports/success-stories'),
  reportsSuccessStoriesId: (id) => `${buildUrl('VITE_API_PATH_REPORTS_SUCCESS_STORIES', '/api/reports/success-stories')}/${id}`,
  reportsMetrics: buildUrl('VITE_API_PATH_REPORTS_METRICS', '/api/reports/metrics'),
  reportsMetricsId: (id) => `${buildUrl('VITE_API_PATH_REPORTS_METRICS', '/api/reports/metrics')}/${id}`,
  reportsImpactData: buildUrl('VITE_API_PATH_REPORTS_IMPACT_DATA', '/api/reports/impact-data'),

  // Permissions & Roles
  permissionCategories: buildUrl('VITE_API_PATH_PERMISSION_CATEGORIES', '/api/permission_categories'),
  permissionCategory: (id) => `${buildUrl('VITE_API_PATH_PERMISSION_CATEGORIES', '/api/permission_categories')}/${id}`,
  permissions: buildUrl('VITE_API_PATH_PERMISSIONS', '/api/permissions'),
  permission: (id) => `${buildUrl('VITE_API_PATH_PERMISSIONS', '/api/permissions')}/${id}`,
  roles: buildUrl('VITE_API_PATH_ROLES', '/api/roles'),
  role: (id) => `${buildUrl('VITE_API_PATH_ROLES', '/api/roles')}/${id}`,
  rolePermissions: (roleId) => `${buildUrl('VITE_API_PATH_ROLES', '/api/roles')}/${roleId}/permissions`,
  rolePermission: (roleId, permId) => `${buildUrl('VITE_API_PATH_ROLES', '/api/roles')}/${roleId}/permissions/${permId}`,
};
