import React from 'react';

const RenderFingerprintsList = ({
  fingerprintData,
  searchFingerprints,
  setSearchFingerprints,
  handleViewChild,
  childrenData,
  showToast,
  goBack,
  handleVerifyFingerprintClick,
  handleAddRegistrationClick,
  handlePrintClick,
  getStaffNameById
}) => {
  const filteredFingerprintData = Array.isArray(fingerprintData) ? fingerprintData.filter(fp =>
    fp.childName?.toLowerCase().includes(searchFingerprints.toLowerCase()) ||
    fp.customSerialId?.toLowerCase().includes(searchFingerprints.toLowerCase())
  ) : [];

  return (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button className="child-reg-back-btn" onClick={goBack}>← Back</button>
        <div className="child-reg-header-actions">
          <h1 className="child-reg-page-title">Fingerprints Captured</h1>
          <div className="child-reg-header-button-group">
            <button className="child-reg-verify-btn-header" onClick={handleVerifyFingerprintClick}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/>
                <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"/>
              </svg>
              Verify Fingerprint
            </button>
            <button className="child-reg-add-registration-btn" onClick={handleAddRegistrationClick}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Registration
            </button>
            <button className="child-reg-print-btn-page" onClick={() => handlePrintClick('fingerprints')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V3H18V9" />
                <path d="M6 21H18C19.1 21 20 20.1 20 19V13C20 11.9 19.1 11 18 11H6C4.9 11 4 11.9 4 13V19C4 20.1 4.9 21 6 21Z" />
                <path d="M18 15H6" />
              </svg>
              Print Report
            </button>
          </div>
        </div>
        <p className="child-reg-page-subtitle">Total fingerprints captured: {Array.isArray(fingerprintData) ? fingerprintData.length : 0}</p>
      </div>
      
      <div className="child-reg-search-bar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input 
          type="text" 
          placeholder="Search by name or ID..." 
          value={searchFingerprints} 
          onChange={(e) => setSearchFingerprints(e.target.value)} 
        />
      </div>
      
      <div className="child-reg-data-table-container">
        <table className="child-reg-data-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Child ID</th>
              <th>Child Name</th>
              <th>Finger</th>
              <th>Capture Date & Time</th>
              <th>Quality</th>
              <th>Captured By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFingerprintData.map((fp, index) => {
              let formattedDate = 'N/A';
              if (fp.capturedAt) {
                const date = new Date(fp.capturedAt);
                formattedDate = date.toLocaleString();
              }
              
              const quality = fp.qualityScore || 0;
              
              let qualityClass = 'child-reg-quality-good';
              if (quality >= 80) qualityClass = 'child-reg-quality-excellent';
              else if (quality >= 60) qualityClass = 'child-reg-quality-good';
              else if (quality >= 40) qualityClass = 'child-reg-quality-fair';
              else qualityClass = 'child-reg-quality-poor';
              
              const capturedByName = fp.capturedByName || getStaffNameById(fp.capturedBy) || 'N/A';
              const childDisplayId = fp.customSerialId || fp.childId || 'N/A';
              const fingerName = fp.fingerName || `Finger ${fp.fingerIndex}`;
              
              return (
                <tr key={index}>
                  <td style={{ textAlign: 'center' }}>{index + 1}</td>
                  <td>{childDisplayId}</td>
                  <td>{fp.childName || 'N/A'}</td>
                  <td>{fingerName}</td>
                  <td>{formattedDate}</td>
                  <td>
                    <span className={`child-reg-quality-badge ${qualityClass}`}>
                      {quality ? `${quality}%` : 'Good'}
                    </span>
                  </td>
                  <td>{capturedByName}</td>
                  <td>
                    <div className="child-reg-action-buttons">
                      <button 
                        className="child-reg-action-icon-btn child-reg-view-btn" 
                        onClick={() => {
                          const childRecord = childrenData.find(c => c.id === fp.childId || c.customSerialId === fp.customSerialId);
                          if (childRecord) {
                            handleViewChild(childRecord);
                          } else {
                            showToast('Child record not found', 'error');
                          }
                        }}
                        title="View Child Details"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredFingerprintData.length === 0 && (
          <div className="child-reg-no-data">
            <p>No fingerprints captured yet. Click "Add Registration" to register a new child.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RenderFingerprintsList;