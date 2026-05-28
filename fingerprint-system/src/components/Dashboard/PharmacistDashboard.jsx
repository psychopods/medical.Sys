import React from 'react';
import './Dashboard.css';

const PharmacistDashboard = ({ user, onLogout }) => {
  const stats = [
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '15', 
      label: 'Pending Prescriptions' 
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '42', 
      label: 'Dispensed Today' 
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="16" r="1" fill="currentColor"/>
        </svg>
      ), 
      value: '6', 
      label: 'Low Stock Alerts' 
    },
    { 
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      value: '$1,234', 
      label: 'Today\'s Expenses' 
    },
  ];

  const quickActions = [
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'Review Prescriptions', 
      desc: 'View pending prescriptions', 
      action: () => alert('Prescriptions List') 
    },
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'Dispense Medicine', 
      desc: 'Dispense medication', 
      action: () => alert('Dispense Form') 
    },
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 3L3 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="5" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'Update Inventory', 
      desc: 'Manage medicine stock', 
      action: () => alert('Inventory Management') 
    },
    { 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ), 
      title: 'Record Expenses', 
      desc: 'Log medicine costs', 
      action: () => alert('Expense Form') 
    },
  ];

  const prescriptions = [
    { patient: 'John Doe', medicine: 'Amoxicillin', quantity: '2', status: 'pending', stock: 'Available' },
    { patient: 'Jane Smith', medicine: 'Paracetamol', quantity: '1', status: 'inprogress', stock: 'Low' },
    { patient: 'Mike Johnson', medicine: 'Vitamin C', quantity: '3', status: 'pending', stock: 'Available' },
  ];

  return (
    <div className="dashboard-content-wrapper">
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div className="stat-card" key={index}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title">Quick Actions</div>
      <div className="actions-grid">
        {quickActions.map((action, index) => (
          <div className="action-card" key={index} onClick={action.action}>
            <div className="action-icon">{action.icon}</div>
            <div className="action-info">
              <h4>{action.title}</h4>
              <p>{action.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title">Pending Prescriptions</div>
      <div className="recent-table">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Medicine</th>
              <th>Quantity</th>
              <th>Stock Status</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map((prescription, index) => (
              <tr key={index}>
                <td>{prescription.patient}</td>
                <td>{prescription.medicine}</td>
                <td>{prescription.quantity}</td>
                <td>
                  <span className={`stock-badge stock-${prescription.stock === 'Low' ? 'low' : 'available'}`}>
                    {prescription.stock}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${prescription.status}`}>
                    {prescription.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PharmacistDashboard;