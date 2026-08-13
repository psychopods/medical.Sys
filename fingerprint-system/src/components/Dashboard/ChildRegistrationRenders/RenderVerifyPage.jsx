import React from 'react';

const RenderVerifyPage = ({
  fingerprintExists,
  existingChild,
  existingChildImages,
  isVerifying,
  handleVerifyFingerprintScan,
  handleLoadExistingRecord,
  handleEditChild,
  handleViewExistingHistory,
  goBack,
  navigateToPage,
  getLocationName,
  calculateAgeFromYear,
  setFingerprintExists,
  setExistingChild,
  setExistingChildImages
}) => {
  return (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button className="child-reg-back-btn" onClick={goBack}>← Back</button>
        <h1 className="child-reg-page-title">Verify Fingerprint</h1>
        <p className="child-reg-page-subtitle">Verify existing patient records using fingerprint</p>
      </div>

      {!fingerprintExists && !isVerifying && (
        <div className="child-reg-verify-fingerprint-area">
          <div className="child-reg-fingerprint-area">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="1.5">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/>
              <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"/>
            </svg>
            <p>Place finger on the scanner to verify</p>
            <button className="child-reg-btn-primary" onClick={handleVerifyFingerprintScan}>Verify Fingerprint</button>
          </div>
          <button className="child-reg-btn-secondary" onClick={goBack}>Cancel</button>
        </div>
      )}

      {isVerifying && (<div className="child-reg-verifying-state"><div className="child-reg-spinner"></div><p>Verifying fingerprint...</p></div>)}

      {fingerprintExists === true && existingChild && existingChild.fullName && (
        <div className="child-reg-verification-result">
          <div className="child-reg-success-message">
            <div className="child-reg-profile-banner">
              <div className="child-reg-verified-badge">✓ Fingerprint Verified & Active</div>
              <h3>Street Medicine Outreach Patient Profile</h3>
            </div>
            
            <div className="child-reg-child-details-card">
              <div className="child-reg-child-header">
                <h4>{existingChild.fullName}</h4>
                <span className="child-reg-child-id">Reg No: {existingChild.customSerialId}</span>
              </div>
              
              <div className="child-reg-verify-images">
                <h5>Patient Photographs</h5>
                {(existingChildImages?.image1 || existingChildImages?.image2 || existingChildImages?.image3 || existingChild.image1) ? (
                  <div className="child-reg-verify-images-grid">
                    {(existingChildImages?.image1 || existingChild.image1) && (
                      <div className="child-reg-verify-image">
                        <img src={existingChildImages?.image1 || existingChild.image1} alt="Patient photo 1" />
                      </div>
                    )}
                    {(existingChildImages?.image2 || existingChild.image2) && (
                      <div className="child-reg-verify-image">
                        <img src={existingChildImages?.image2 || existingChild.image2} alt="Patient photo 2" />
                      </div>
                    )}
                    {(existingChildImages?.image3 || existingChild.image3) && (
                      <div className="child-reg-verify-image">
                        <img src={existingChildImages?.image3 || existingChild.image3} alt="Patient photo 3" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="child-reg-no-images-message">
                    <p className="warning-text">⚠️ No photos uploaded for this patient.</p>
                    <p className="subtext">Authorized users can add photos by clicking "Upload/Change Photo" below.</p>
                  </div>
                )}
              </div>
              
              <div className="child-reg-info-grid">
                <div className="child-reg-info-item">
                  <label>Registration Number:</label>
                  <span>{existingChild.customSerialId}</span>
                </div>
                <div className="child-reg-info-item">
                  <label>Child's Name:</label>
                  <span>{existingChild.fullName}</span>
                </div>
                <div className="child-reg-info-item">
                  <label>Age / Estimated Birth Year:</label>
                  <span>
                    {existingChild.age ? `${existingChild.age} years` : `${new Date().getFullYear() - (parseInt(existingChild.estimatedBirthYear) || new Date().getFullYear())} years`}{' '}
                    ({existingChild.estimatedBirthYear || 'N/A'})
                  </span>
                </div>
                <div className="child-reg-info-item">
                  <label>Gender:</label>
                  <span>{existingChild.gender}</span>
                </div>
                <div className="child-reg-info-item">
                  <label>Current Location:</label>
                  <span>{existingChild.locationName || 'N/A'}</span>
                </div>
                <div className="child-reg-info-item">
                  <label>Registration Date:</label>
                  <span>
                    {existingChild.createdAt 
                      ? new Date(existingChild.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
                      : 'N/A'}
                  </span>
                </div>
                <div className="child-reg-info-item">
                  <label>Project Program:</label>
                  <span className="project-highlight-text">Street Medicine Project</span>
                </div>
                <div className="child-reg-info-item">
                  <label>Biometrics Match Status:</label>
                  <span className="match-status-badge">Biometric Template Matched</span>
                </div>
              </div>
            </div>
            
            <div className="child-reg-form-actions child-reg-profile-actions">
              <button className="child-reg-btn-primary" onClick={handleLoadExistingRecord}>
                Add Medical Records
              </button>
              <button className="child-reg-btn-secondary" onClick={() => handleEditChild(existingChild)}>
                Edit Profile
              </button>
              <button className="child-reg-btn-secondary" onClick={() => handleEditChild(existingChild)}>
                Upload/Change Photo
              </button>
              <button className="child-reg-btn-secondary" onClick={handleViewExistingHistory}>
                View History
              </button>
              <button 
                className="child-reg-btn-secondary close-btn" 
                onClick={() => { setFingerprintExists(null); setExistingChild(null); setExistingChildImages(null); goBack(); }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {fingerprintExists === false && (
        <div className="child-reg-verification-result">
          <div className="child-reg-info-message child-reg-mismatch-card">
            <span className="mismatch-icon">⚠️</span>
            <h3>Fingerprint Match Not Found</h3>
            <p className="mismatch-bold">This fingerprint does not match any registered patients in the database.</p>
            
            <div className="mismatch-guidance">
              <h4>Suggested Next Steps:</h4>
              <ul>
                <li>Ensure the patient's finger is clean and dry.</li>
                <li>Verify the finger is correctly aligned flat on the scanner lens.</li>
                <li>Clean the scanner lens with a dry cloth and try matching again.</li>
                <li>If the child is visiting the outreach clinic for the first time, click <strong>Register New Patient</strong> to create a new profile.</li>
              </ul>
            </div>
            
            <div className="child-reg-form-actions">
              <button className="child-reg-btn-primary" onClick={handleVerifyFingerprintScan}>Try Scanning Again</button>
              <button className="child-reg-btn-primary" onClick={() => { setFingerprintExists(null); navigateToPage('register'); }}>Register New Patient</button>
              <button className="child-reg-btn-secondary" onClick={() => { setFingerprintExists(null); goBack(); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenderVerifyPage;