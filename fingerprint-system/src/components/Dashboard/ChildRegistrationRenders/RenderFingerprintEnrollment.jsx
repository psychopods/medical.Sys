import React from 'react';

// SVG Icons
const FingerprintIcon = ({ width = 24, height = 24, color = "#667eea" }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/>
    <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"/>
    <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14"/>
    <path d="M18 12C18 8.69 15.31 6 12 6"/>
  </svg>
);

const CheckIcon = ({ width = 16, height = 16, color = "#28a745" }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3">
    <path d="M20 6L9 17L4 12" />
  </svg>
);

const RemoveIcon = ({ width = 14, height = 14, color = "#dc3545" }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const FingerIcon = ({ width = 24, height = 24, color = "#666" }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/>
    <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"/>
    <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14"/>
  </svg>
);

const InfoIcon = ({ width = 80, height = 80, color = "#667eea" }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const SuccessIcon = ({ width = 80, height = 80 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2">
    <path d="M20 6L9 17L4 12" />
  </svg>
);

const RenderFingerprintEnrollment = ({
  enrollingChild,
  isCapturing,
  selectedFinger,
  fingerCaptures,
  fingerQuality,
  capturedFingers,
  fingerNames,
  handleCancelEnrollment,
  handleSelectFinger,
  handleCaptureFingerprint,
  handleRemoveFingerprint,
  handleSkipFingerprints,
  handleSaveFingerprints
}) => {
  const totalCaptured = capturedFingers.length;
  const isComplete = totalCaptured >= 10;

  return (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button className="child-reg-back-btn" onClick={handleCancelEnrollment}>← Back</button>
        <div className="child-reg-header-actions">
          <h1 className="child-reg-page-title">Enroll Fingerprints</h1>
          <span className="child-reg-enrollment-progress">
            {totalCaptured}/10 fingers captured
            {isComplete && ' Complete!'}
          </span>
        </div>
        <p className="child-reg-page-subtitle">
          Enrolling fingerprints for: <strong>{enrollingChild?.fullName}</strong> (ID: {enrollingChild?.customSerialId})
        </p>
        <p className="child-reg-enrollment-hint">* All fingers are optional. Capture as many as you need.</p>
      </div>

      <div className="child-reg-enrollment-container">
        {/* Finger Selection Grid */}
        <div className="child-reg-finger-grid">
          <h3>Select a finger to capture</h3>
          <div className="child-reg-finger-grid-buttons">
            {Array.from({ length: 10 }, (_, i) => {
              const fingerIndex = i + 1;
              const isCaptured = fingerCaptures[fingerIndex];
              const quality = fingerQuality[fingerIndex];
              const fingerInfo = fingerNames[fingerIndex];
              
              return (
                <button
                  key={fingerIndex}
                  className={`child-reg-finger-btn ${selectedFinger === fingerIndex ? 'selected' : ''} ${isCaptured ? 'captured' : ''}`}
                  onClick={() => handleSelectFinger(fingerIndex)}
                  title={`${fingerInfo.name}${isCaptured ? ` (Quality: ${quality}%)` : ''}`}
                >
                  <div className="child-reg-finger-icon">
                    {isCaptured ? (
                      <CheckIcon width={24} height={24} color="#28a745" />
                    ) : (
                      <FingerIcon width={24} height={24} color={selectedFinger === fingerIndex ? "#667eea" : "#666"} />
                    )}
                  </div>
                  <div className="child-reg-finger-label">
                    <span className="child-reg-finger-hand">{fingerInfo.hand}</span>
                    <span className="child-reg-finger-name">{fingerInfo.finger}</span>
                  </div>
                  {isCaptured && (
                    <div className="child-reg-finger-quality" style={{ 
                      color: quality >= 80 ? '#28a745' : quality >= 60 ? '#ffc107' : '#dc3545' 
                    }}>
                      {quality}%
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scanner Area */}
        <div className="child-reg-fingerprint-scanner">
          <div className="child-reg-scanner-area">
            {selectedFinger && !fingerCaptures[selectedFinger] ? (
              <>
                <div className="child-reg-scanner-instructions">
                  <FingerprintIcon width={80} height={80} color="#667eea" />
                  <p>Selected: <strong>{fingerNames[selectedFinger].name}</strong></p>
                  <p className="child-reg-scanner-hint">Place finger on the scanner and click Capture</p>
                </div>
                {isCapturing && (
                  <div className="child-reg-scanning-animation">
                    <div className="child-reg-scan-line"></div>
                    <p>Scanning fingerprint...</p>
                  </div>
                )}
                <button 
                  className="child-reg-btn-primary" 
                  onClick={handleCaptureFingerprint}
                  disabled={isCapturing}
                >
                  {isCapturing ? 'Capturing...' : `Capture ${fingerNames[selectedFinger].name}`}
                </button>
              </>
            ) : selectedFinger && fingerCaptures[selectedFinger] ? (
              <div className="child-reg-capture-success">
                <SuccessIcon width={80} height={80} />
                <h3>Fingerprint Captured!</h3>
                <p><strong>{fingerNames[selectedFinger].name}</strong></p>
                <p>Quality Score: <strong>{fingerQuality[selectedFinger]}%</strong></p>
                <div className="child-reg-quality-bar">
                  <div 
                    className={`child-reg-quality-fill ${fingerQuality[selectedFinger] >= 80 ? 'excellent' : fingerQuality[selectedFinger] >= 60 ? 'good' : 'poor'}`}
                    style={{ width: `${fingerQuality[selectedFinger]}%` }}
                  ></div>
                </div>
                <div className="child-reg-enrollment-actions">
                  <button className="child-reg-btn-danger" onClick={() => handleRemoveFingerprint(selectedFinger)}>
                    <RemoveIcon width={14} height={14} color="white" /> Remove
                  </button>
                  <button className="child-reg-btn-secondary" onClick={() => handleSelectFinger(null)}>
                    Select Another Finger
                  </button>
                </div>
              </div>
            ) : (
              <div className="child-reg-scanner-instructions">
                <InfoIcon width={80} height={80} color="#667eea" />
                <p>Please select a finger from the grid above</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary of Captured Fingers */}
        <div className="child-reg-enrollment-summary">
          <h3>Captured Fingers ({totalCaptured}/10)</h3>
          {totalCaptured > 0 ? (
            <div className="child-reg-captured-list">
              {capturedFingers.sort((a, b) => a - b).map(fingerIndex => (
                <div key={fingerIndex} className="child-reg-captured-item">
                  <span className="child-reg-captured-name">{fingerNames[fingerIndex].name}</span>
                  <span className="child-reg-captured-quality" style={{
                    color: fingerQuality[fingerIndex] >= 80 ? '#28a745' : 
                           fingerQuality[fingerIndex] >= 60 ? '#ffc107' : '#dc3545'
                  }}>
                    {fingerQuality[fingerIndex]}%
                  </span>
                  <button 
                    className="child-reg-captured-remove"
                    onClick={() => handleRemoveFingerprint(fingerIndex)}
                    title="Remove this fingerprint"
                  >
                    <RemoveIcon width={12} height={12} color="#dc3545" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="child-reg-no-captures">No fingerprints captured yet. Select a finger above to begin.</p>
          )}
          
          <div className="child-reg-enrollment-summary-actions">
            <button className="child-reg-btn-secondary" onClick={handleSkipFingerprints}>
              Skip (Continue without fingerprints)
            </button>
            <button 
              className="child-reg-btn-primary" 
              onClick={handleSaveFingerprints}
              disabled={totalCaptured === 0}
            >
              {totalCaptured === 0 ? 'No fingerprints to save' : `Save ${totalCaptured} Fingerprint(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenderFingerprintEnrollment;