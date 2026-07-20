import React from 'react';

const RenderYoungPatientsList = ({
  youngPatients,
  searchYoung,
  setSearchYoung,
  fingerprintData,
  handleViewChild,
  handleEditChild,
  handleEnrollFingerprint,
  handleDeleteChild,
  calculateAgeFromYear,
  getLocationName,
  getStaffNameById,
  goBack,
  handleVerifyFingerprintClick,
  handleAddRegistrationClick,
  handlePrintClick,
  isLoading, // Add loading prop
  isDeleting, // Add loading prop
  deletingChildId // Add loading prop
}) => {
  const filteredYoungPatients = Array.isArray(youngPatients) ? youngPatients.filter(child =>
    child.fullName?.toLowerCase().includes(searchYoung.toLowerCase()) ||
    child.customSerialId?.toLowerCase().includes(searchYoung.toLowerCase())
  ) : [];

  return (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button className="child-reg-back-btn" onClick={goBack} disabled={isLoading || isDeleting}>← Back</button>
        <div className="child-reg-header-actions">
          <h1 className="child-reg-page-title">Young Patients</h1>
          <div className="child-reg-header-button-group">
            <button 
              className="child-reg-verify-btn-header" 
              onClick={handleVerifyFingerprintClick}
              disabled={isLoading || isDeleting}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/>
                <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"/>
              </svg>
              Verify Fingerprint
            </button>
            <button 
              className="child-reg-add-registration-btn" 
              onClick={handleAddRegistrationClick}
              disabled={isLoading || isDeleting}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Registration
            </button>
            <button 
              className="child-reg-print-btn-page" 
              onClick={() => handlePrintClick('young')}
              disabled={isLoading || isDeleting}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V3H18V9" />
                <path d="M6 21H18C19.1 21 20 20.1 20 19V13C20 11.9 19.1 11 18 11H6C4.9 11 4 11.9 4 13V19C4 20.1 4.9 21 6 21Z" />
                <path d="M18 15H6" />
              </svg>
              Print Report
            </button>
          </div>
        </div>
        <p className="child-reg-page-subtitle">
          Total Young Patients (Under 18 years): <strong>{youngPatients.length}</strong>
        </p>
      </div>
      
      <div className="child-reg-search-bar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input 
          type="text" 
          placeholder="Search young patients by name or ID..." 
          value={searchYoung} 
          onChange={(e) => setSearchYoung(e.target.value)} 
          disabled={isLoading || isDeleting}
        />
      </div>
      
      <div className="child-reg-data-table-container">
        <table className="child-reg-data-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>ID</th>
              <th>Patient Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Location</th>
              <th>Registration Date</th>
              <th>Fingerprints</th>
              <th>Registered By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredYoungPatients.map((child, index) => {
              const childFingerprints = fingerprintData.filter(fp =>
                (fp.childId || fp.child_id) === child.id ||
                fp.customSerialId === child.customSerialId
              );
              const fingerCount = childFingerprints.length;
              const isDeletingThis = isDeleting && deletingChildId === child.id;
              
              return (
                <tr key={child.id}>
                  <td style={{ textAlign: 'center' }}>{index + 1}</td>
                  <td>{child.customSerialId}</td>
                  <td>{child.fullName}</td>
                  <td>{calculateAgeFromYear(child.estimatedBirthYear)}</td>
                  <td>{child.gender}</td>
                  <td>{getLocationName(child.primaryLocationId)}</td>
                  <td>{child.createdAt ? child.createdAt.split('T')[0] : 'N/A'}</td>
                  <td>
                    <span className={`child-reg-status-badge ${fingerCount > 0 ? 'child-reg-status-completed' : 'child-reg-status-pending'}`}>
                      {fingerCount > 0 ? `${fingerCount}/10` : '0/10'}
                    </span>
                  </td>
                  <td>{child.registeredByName || getStaffNameById(child.createdByStaffId) || 'N/A'}</td>
                  <td>
                    <div className="child-reg-action-buttons">
                      <button 
                        className="child-reg-action-icon-btn child-reg-view-btn" 
                        onClick={() => handleViewChild(child)}
                        title="View Details"
                        disabled={isLoading || isDeleting}
                      >
                        {isLoading && !isDeleting ? (
                          <span className="child-reg-spinner-small"></span>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                      <button 
                        className="child-reg-action-icon-btn child-reg-edit-btn" 
                        onClick={() => handleEditChild(child)}
                        title="Edit Patient"
                        disabled={isLoading || isDeleting}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 3L21 7L7 21H3V17L17 3Z" />
                        </svg>
                      </button>
                      <button 
                        className="child-reg-action-icon-btn child-reg-fingerprint-btn" 
                        onClick={() => handleEnrollFingerprint(child)}
                        title="Manage Fingerprints"
                        disabled={isLoading || isDeleting}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                          <path d="M12 6v6l4 2" />
                        </svg>
                      </button>
                      <button 
                        className="child-reg-action-icon-btn child-reg-delete-btn" 
                        onClick={() => handleDeleteChild(child)}
                        title="Delete Patient"
                        disabled={isDeleting}
                      >
                        {isDeletingThis ? (
                          <span className="child-reg-spinner-small"></span>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 7H20" strokeWidth="2" />
                            <path d="M10 11V17" strokeWidth="2" />
                            <path d="M14 11V17" strokeWidth="2" />
                            <path d="M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" strokeWidth="2" />
                            <path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" strokeWidth="2" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredYoungPatients.length === 0 && (
          <div className="child-reg-no-data">
            <p>No young patients found. Click "Add Registration" to register a new patient.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RenderYoungPatientsList;
