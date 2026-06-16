import React from 'react';

const RenderVerifyPage = ({
  fingerprintExists,
  existingChild,
  existingChildImages,
  isVerifying,
  handleVerifyFingerprintScan,
  handleLoadExistingRecord,
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
            <h3>✓ Fingerprint Found!</h3>
            <p>Patient already registered in the system.</p>
            <div className="child-reg-child-details-card">
              <div className="child-reg-child-header"><h4>{existingChild.fullName}</h4><span className="child-reg-child-id">ID: {existingChild.customSerialId}</span></div>
              <div className="child-reg-verify-images">
                <h5>Patient Photos</h5>
                {(existingChildImages?.image1 || existingChildImages?.image2 || existingChildImages?.image3) ? (
                  <div className="child-reg-verify-images-grid">
                    {existingChildImages.image1 && <div className="child-reg-verify-image"><img src={existingChildImages.image1} alt="Child photo 1" /></div>}
                    {existingChildImages.image2 && <div className="child-reg-verify-image"><img src={existingChildImages.image2} alt="Child photo 2" /></div>}
                    {existingChildImages.image3 && <div className="child-reg-verify-image"><img src={existingChildImages.image3} alt="Child photo 3" /></div>}
                  </div>
                ) : (<div className="child-reg-no-images-message"><p>No photos available for this patient</p></div>)}
              </div>
              <div className="child-reg-info-grid">
                <div className="child-reg-info-item"><label>Full Name:</label><span>{existingChild.fullName}</span></div>
                <div className="child-reg-info-item"><label>Estimated Birth Year:</label><span>{existingChild.estimatedBirthYear}</span></div>
                <div className="child-reg-info-item"><label>Age:</label><span>{existingChild.age}</span></div>
                <div className="child-reg-info-item"><label>Gender:</label><span>{existingChild.gender}</span></div>
                <div className="child-reg-info-item"><label>Location:</label><span>{existingChild.locationName}</span></div>
                <div className="child-reg-info-item"><label>Registration Date:</label><span>{existingChild.createdAt ? existingChild.createdAt.split('T')[0] : 'N/A'}</span></div>
                <div className="child-reg-info-item"><label>Last Visit:</label><span>{existingChild.lastVisit}</span></div>
                <div className="child-reg-info-item"><label>Medical History:</label><span>{existingChild.medicalHistory || 'None'}</span></div>
                <div className="child-reg-info-item"><label>Registered By:</label><span>{existingChild.registeredBy || 'N/A'}</span></div>
              </div>
              <div className="child-reg-fingerprint-status"><span className="child-reg-status-badge child-reg-status-pending">Pending</span></div>
            </div>
            <div className="child-reg-form-actions">
              <button className="child-reg-btn-primary" onClick={handleLoadExistingRecord}>Add Records</button>
              <button className="child-reg-btn-secondary" onClick={() => { setFingerprintExists(null); setExistingChild(null); setExistingChildImages(null); goBack(); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {fingerprintExists === false && (
        <div className="child-reg-verification-result">
          <div className="child-reg-info-message">
            <h3>ℹ Fingerprint Not Found</h3>
            <p>This fingerprint does not match any existing record.</p>
            <p>Would you like to register this child as a new patient?</p>
            <div className="child-reg-form-actions">
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