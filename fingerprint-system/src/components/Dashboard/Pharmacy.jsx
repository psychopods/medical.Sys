import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './Pharmacy.css';

const Pharmacy = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseData, setExpenseData] = useState({
    medicineName: '',
    quantity: '',
    cost: '',
    supplier: '',
    date: new Date().toISOString().split('T')[0]
  });
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

  const handleReviewPrescriptions = () => {
    alert('Viewing all prescriptions');
  };

  const handleDispenseMedicine = () => {
    if (selectedPrescription) {
      alert(`Dispensing medicine for ${selectedPrescription.patient}`);
    } else {
      alert('Please select a prescription first');
    }
  };

  const handleUpdateInventory = () => {
    setShowExpenseForm(!showExpenseForm);
  };

  const handleExpenseChange = (e) => {
    setExpenseData({
      ...expenseData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitExpense = () => {
    if (expenseData.medicineName && expenseData.quantity && expenseData.cost) {
      alert(`Expense recorded for ${expenseData.medicineName}`);
      setShowExpenseForm(false);
      setExpenseData({
        medicineName: '',
        quantity: '',
        cost: '',
        supplier: '',
        date: new Date().toISOString().split('T')[0]
      });
    } else {
      alert('Please fill all required fields');
    }
  };

  const prescriptions = [];

  const lowStockItems = [];

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
      <div className="pharmacy-container">
        <div className="page-header">
          <h1>Pharmacy</h1>
          <p>Manage prescriptions, inventory and expenses</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>0</h3>
              <p>Pending Prescriptions</p>
              <span className="trend">No pending prescriptions</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>0</h3>
              <p>Dispensed Today</p>
              <span className="trend">No medicines dispensed</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>0</h3>
              <p>Low Stock Alerts</p>
              <span className="trend">Stock levels normal</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section-title">Quick Actions</div>
        <div className="actions-grid">
          <div className="action-card" onClick={handleReviewPrescriptions}>
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="action-info">
              <h4>Review Prescriptions</h4>
              <p>View pending prescriptions</p>
            </div>
          </div>
          <div className="action-card" onClick={handleDispenseMedicine}>
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="action-info">
              <h4>Dispense Medicine</h4>
              <p>Dispense medication to patients</p>
            </div>
          </div>
          <div className="action-card" onClick={handleUpdateInventory}>
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="action-info">
              <h4>Update Inventory</h4>
              <p>Manage medicine stock</p>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="section-title">Low Stock Alerts</div>
        <div className="alerts-container">
          {lowStockItems.length > 0 ? (
            lowStockItems.map((item, index) => (
              <div key={index} className={`alert-card ${item.status}`}>
                <div className="alert-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="16" r="1" fill="currentColor"/>
                  </svg>
                </div>
                <div className="alert-info">
                  <h4>{item.name}</h4>
                  <p>Current Stock: {item.currentStock} units</p>
                  <p>Reorder Level: {item.reorderLevel} units</p>
                </div>
                <button className="reorder-btn">Reorder Now</button>
              </div>
            ))
          ) : (
            <div className="alert-card normal" style={{ width: '100%', gridColumn: '1 / -1' }}>
              <div className="alert-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="alert-info">
                <h4>All Items in Stock</h4>
                <p>No low stock alerts at this time.</p>
              </div>
            </div>
          )}
        </div>

        {/* Expense Form */}
        {showExpenseForm && (
          <div className="expense-form-card">
            <h3>Record Medicine Expense</h3>
            <div className="expense-form-grid">
              <div className="form-group">
                <label>Medicine Name *</label>
                <input
                  type="text"
                  name="medicineName"
                  value={expenseData.medicineName}
                  onChange={handleExpenseChange}
                  placeholder="Enter medicine name"
                />
              </div>
              <div className="form-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={expenseData.quantity}
                  onChange={handleExpenseChange}
                  placeholder="Enter quantity"
                />
              </div>
              <div className="form-group">
                <label>Cost (TSh) *</label>
                <input
                  type="number"
                  name="cost"
                  value={expenseData.cost}
                  onChange={handleExpenseChange}
                  placeholder="Enter total cost"
                />
              </div>
              <div className="form-group">
                <label>Supplier</label>
                <input
                  type="text"
                  name="supplier"
                  value={expenseData.supplier}
                  onChange={handleExpenseChange}
                  placeholder="Enter supplier name"
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={expenseData.date}
                  onChange={handleExpenseChange}
                />
              </div>
            </div>
            <div className="form-actions">
              <button className="submit-expense-btn" onClick={handleSubmitExpense}>
                Save Expense
              </button>
              <button className="cancel-expense-btn" onClick={() => setShowExpenseForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Prescriptions Table */}
        <div className="section-title">Pending Prescriptions</div>
        <div className="recent-table">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Medicine</th>
                <th>Quantity</th>
                <th>Dosage</th>
                <th>Date</th>
                <th>Stock Status</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.length > 0 ? (
                prescriptions.map((prescription) => (
                  <tr 
                    key={prescription.id} 
                    className={selectedPrescription?.id === prescription.id ? 'selected-row' : ''}
                    onClick={() => setSelectedPrescription(prescription)}
                  >
                    <td>{prescription.patient}</td>
                    <td>{prescription.medicine}</td>
                    <td>{prescription.quantity}</td>
                    <td>{prescription.dosage}</td>
                    <td>{prescription.date}</td>
                    <td>
                      <span className={`stock-badge stock-${prescription.stock.toLowerCase()}`}>
                        {prescription.stock}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${prescription.status}`}>
                        {prescription.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="action-btn dispense-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPrescription(prescription);
                          alert(`Dispensing ${prescription.medicine} to ${prescription.patient}`);
                        }}
                      >
                        Dispense
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                    No pending prescriptions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Pharmacy;