// /home/labdoo/medical.Sys/fingerprint-system/src/components/Dashboard/menuItems.js

export const menuItems = [
  { 
    path: '/dashboard', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ), 
    label: 'Dashboard', 
    roles: ['superuser', 'nurse', 'doctor', 'lab_technician', 'pharmacist', 'staff'] 
  },
  { 
    path: '/user-management', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 21V19C17 16.8 15.2 15 13 15H5C2.8 15 1 16.8 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M23 21V19C22.9 16.8 21.1 15 19 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 3.13C17.2 3.72 18 5.01 18 6.5C18 7.99 17.2 9.28 16 9.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ), 
    label: 'User Management', 
    roles: ['superuser'] 
  },
  { 
    path: '/child-registration', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5.5 20V19C5.5 16.8 7.3 15 9.5 15H14.5C16.7 15 18.5 16.8 18.5 19V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ), 
    label: 'Child Registration', 
    roles: ['superuser', 'nurse', 'staff'] 
  },
  // { 
  //   path: '/medical-examination', 
  //   icon: (
  //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  //       <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  //     </svg>
  //   ), 
  //   label: 'Medical Examination', 
  //   roles: ['superuser', 'doctor'] 
  // },
  // { 
  //   path: '/laboratory', 
  //   icon: (
  //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  //       <path d="M8 3H16L18 9L12 21L6 9L8 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  //       <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  //       <path d="M8 9H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  //     </svg>
  //   ), 
  //   label: 'Laboratory', 
  //   roles: ['superuser', 'lab_technician'] 
  // },
  // { 
  //   path: '/pharmacy', 
  //   icon: (
  //     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  //       <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  //       <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  //       <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  //     </svg>
  //   ), 
  //   label: 'Pharmacy', 
  //   roles: ['superuser', 'pharmacist'] 
  // },
  { 
    path: '/gallery-admin', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="8.5" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ), 
    label: 'Gallery Manager', 
    roles: ['superuser', 'admin'] 
  },
  { 
    path: '/reports-admin', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 12H18L15 21L9 3L6 12H3" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 2L15 9H22L16 14L19 21L12 17L5 21L8 14L2 9H9L12 2Z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ), 
    label: 'Reports Manager', 
    roles: ['superuser', 'admin'] 
  },
  { 
    path: '/volunteer-admin', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M17 3.5L18.5 2L20 3.5L18.5 5L17 3.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1"/>
      </svg>
    ), 
    label: 'Volunteer Manager', 
    roles: ['superuser', 'admin'] 
  },
  { 
    path: '/contact-admin', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ), 
    label: 'Contact Manager', 
    roles: ['superuser', 'admin'] 
  },
  { 
    path: '/notifications-admin', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ), 
    label: 'Notifications Manager', 
    roles: ['superuser', 'admin'] 
  },
];

// Page titles mapping
export const pageTitles = {
  '/dashboard': 'Dashboard Overview',
  '/user-management': 'User Management',
  '/child-registration': 'Child Registration',
  '/medical-examination': 'Medical Examination',
  '/laboratory': 'Laboratory',
  '/pharmacy': 'Pharmacy',
  '/medical-records': 'Medical Records',
  '/gallery-admin': 'Gallery Manager',
  '/reports-admin': 'Reports Manager',
  '/volunteer-admin': 'Volunteer Manager',
  '/contact-admin': 'Contact Manager',
  '/notifications-admin': 'Notifications Manager',
};

// Helper function to get page title
export const getPageTitle = (path) => {
  return pageTitles[path] || 'Dashboard';
};