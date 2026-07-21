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

const SuccessIcon = ({ width = 80, height = 80 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2">
    <path d="M20 6L9 17L4 12" />
  </svg>
);

const CameraIcon = ({ width = 20, height = 20 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const UploadIcon = ({ width = 20, height = 20 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const RemovePhotoIcon = ({ width = 20, height = 20 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 7h16"/>
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
    <path d="M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13"/>
    <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>
  </svg>
);

const CaptureIcon = ({ width = 20, height = 20 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const CancelIcon = ({ width = 20, height = 20 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SwitchCameraIcon = ({ width = 20, height = 20 }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9" />
  </svg>
);

const WarningIcon = ({ width = 16, height = 16, color = "#dc3545" }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
  </svg>
);

const InfoIcon = ({ width = 16, height = 16, color = "#856404" }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

const LockIcon = ({ width = 14, height = 14, color = "#666" }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CameraStatusOnIcon = ({ width = 14, height = 14, color = "#28a745" }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const CameraStatusOffIcon = ({ width = 14, height = 14, color = "#dc3545" }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

const CheckCircleIcon = ({ width = 14, height = 14, color = "#28a745" }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const CrossIcon = ({ width = 14, height = 14, color = "#dc3545" }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SpinnerIcon = ({ width = 20, height = 20, color = "#667eea" }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M4.93 4.93l2.83 2.83" />
    <path d="M16.24 16.24l2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="M4.93 19.07l2.83-2.83" />
    <path d="M16.24 7.76l2.83-2.83" />
  </svg>
);

const RenderRegistrationPage = ({
  registrationStep,
  formData,
  formErrors,
  generatedId,
  locations,
  preview1,
  preview2,
  preview3,
  showCamera1,
  showCamera2,
  showCamera3,
  videoRef1,
  videoRef2,
  videoRef3,
  canvasRef1,
  canvasRef2,
  canvasRef3,
  fileInputRef1,
  fileInputRef2,
  fileInputRef3,
  fingerNames,
  selectedFinger,
  fingerCaptures,
  fingerQuality,
  fingerImages,
  capturedFingers,
  isCapturing,
  isSavingFingerprints,
  handleSelectFinger,
  handleCaptureFingerprint,
  handleRemoveFingerprint,
  handleSkipFingerprints,
  handleSaveFingerprints,
  handleFormChangeWithValidation,
  handleAgeChange,
  handleFileUpload,
  handleRemovePhoto,
  startCamera,
  capturePhoto,
  stopCamera,
  switchCamera,
  validateForm,
  showToast,
  goBack,
  setRegistrationStep,
  handleCompleteRegistration,
  isSubmitting,
  isAddingChild,
  user,
  cameraError,
  isCameraStarting,
  cameraFacingMode1,
  cameraFacingMode2,
  cameraFacingMode3
}) => {
  const totalCaptured = capturedFingers.length;
  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'superuser' || user?.role === 'admin';

  // Get camera facing mode for a specific camera
  const getCameraMode = (num) => {
    if (num === 1) return cameraFacingMode1 || 'user';
    if (num === 2) return cameraFacingMode2 || 'user';
    return cameraFacingMode3 || 'user';
  };

  // Helper function to render camera preview with switch button
  const renderCameraPreview = (num, showCam, videoRef, canvasRef) => {
    const facingMode = getCameraMode(num);
    const isFrontCamera = facingMode === 'user';
    
    return (
      <div className="child-reg-camera-preview" style={{ display: showCam ? 'block' : 'none' }}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          className="child-reg-camera-video" 
          style={{ 
            width: '100%', 
            maxWidth: '300px', 
            borderRadius: '8px', 
            background: '#000',
            display: 'block'
          }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {showCam && (
          <>
            <div className="child-reg-camera-controls">
              <button 
                className="child-reg-btn-capture" 
                onClick={() => capturePhoto(num)} 
                title="Capture Photo"
                disabled={isSubmitting || isAddingChild || isCameraStarting}
              >
                <CaptureIcon />
              </button>
              <button 
                className="child-reg-btn-switch-camera" 
                onClick={() => switchCamera(num)} 
                title={isFrontCamera ? "Switch to Back Camera" : "Switch to Front Camera"}
                disabled={isSubmitting || isAddingChild || isCameraStarting}
              >
                <SwitchCameraIcon />
              </button>
              <button 
                className="child-reg-btn-cancel" 
                onClick={() => stopCamera(num)} 
                title="Cancel"
                disabled={isSubmitting || isAddingChild}
              >
                <CancelIcon />
              </button>
            </div>
          </>
        )}
        {isCameraStarting && showCam && (
          <div className="child-reg-camera-loading">
            <span className="child-reg-spinner-small"></span>
            <p>Starting camera...</p>
          </div>
        )}
      </div>
    );
  };

  // Helper function to render upload options
  const renderUploadOptions = (num, preview, fileRef) => {
    return (
      <div className="child-reg-upload-options">
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => handleFileUpload(num, e.target.files[0])} 
          style={{ display: 'none' }} 
          ref={fileRef} 
          disabled={isSubmitting || isAddingChild} 
        />
        <button 
          className="child-reg-btn-upload" 
          onClick={() => fileRef.current?.click()} 
          title="Upload Photo"
          disabled={isSubmitting || isAddingChild}
        >
          <UploadIcon />
        </button>
        <button 
          className="child-reg-btn-camera" 
          onClick={() => startCamera(num)} 
          title="Take Photo"
          disabled={isSubmitting || isAddingChild || isCameraStarting}
        >
          <CameraIcon />
        </button>
        {preview && (
          <button 
            className="child-reg-btn-remove" 
            onClick={() => {
              if (typeof handleRemovePhoto === 'function') {
                handleRemovePhoto(num);
              }
            }} 
            title="Remove Photo" 
            disabled={isSubmitting || isAddingChild}
          >
            <RemovePhotoIcon />
          </button>
        )}
        {cameraError && (
          <div className="child-reg-camera-error">
            <WarningIcon width={16} height={16} color="#dc3545" />
            <span>{cameraError}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button 
          className="child-reg-back-btn" 
          onClick={goBack} 
          disabled={isSubmitting || isCapturing || isSavingFingerprints || isAddingChild}
        >
          ← Back
        </button>
        <h1 className="child-reg-page-title">Register New Patient</h1>
        <p className="child-reg-page-subtitle">Enter patient information and capture fingerprint</p>
        {generatedId && (
          <div className="child-reg-generated-id">
            <strong>Registration ID:</strong> {generatedId}
          </div>
        )}
      </div>

      {registrationStep === 1 && (
        <div className="child-reg-registration-form-container">
          <h3 className="child-reg-form-step-title">
            Step 1: Patient Information <span style={{ color: 'red' }}>*Required fields</span>
          </h3>
          <div className="child-reg-form-grid">
            <div className="child-reg-form-group">
              <label>Patient's Full Name *</label>
              <input 
                type="text" 
                name="fullName" 
                value={formData.fullName} 
                onChange={handleFormChangeWithValidation} 
                placeholder="Enter patient's name" 
                required 
                className={formErrors.fullName ? 'error-input' : ''}
                disabled={isSubmitting || isAddingChild}
              />
              {formErrors.fullName && <span className="error-message">{formErrors.fullName}</span>}
            </div>
            <div className="child-reg-form-group child-reg-age-year-group">
              <label>Age & Birth Year *</label>
              <div className="child-reg-age-year-row">
                <div className="child-reg-input-with-label">
                  <input 
                    type="number" 
                    name="estimatedAge"
                    value={formData.estimatedBirthYear ? (new Date().getFullYear() - parseInt(formData.estimatedBirthYear, 10)) : ''} 
                    onChange={handleAgeChange} 
                    placeholder="Age"
                    min="0"
                    max="120"
                    className={formErrors.estimatedBirthYear ? 'error-input' : ''}
                    disabled={isSubmitting || isAddingChild}
                  />
                  <span className="child-reg-input-sublabel">Estimated Age (Years)</span>
                </div>
                <div className="child-reg-age-year-divider">or</div>
                <div className="child-reg-input-with-label">
                  <select 
                    name="estimatedBirthYear" 
                    value={formData.estimatedBirthYear || ""} 
                    onChange={handleFormChangeWithValidation} 
                    required 
                    className={formErrors.estimatedBirthYear ? 'error-input' : ''}
                    disabled={isSubmitting || isAddingChild}
                  >
                    <option value="">Select Year</option>
                    {Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <span className="child-reg-input-sublabel">Birth Year *</span>
                </div>
              </div>
              {formErrors.estimatedBirthYear && <span className="error-message">{formErrors.estimatedBirthYear}</span>}
            </div>
            <div className="child-reg-form-group">
              <label>Gender *</label>
              <select 
                name="gender" 
                value={formData.gender} 
                onChange={handleFormChangeWithValidation} 
                required 
                className={formErrors.gender ? 'error-input' : ''}
                disabled={isSubmitting || isAddingChild}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {formErrors.gender && <span className="error-message">{formErrors.gender}</span>}
            </div>
            <div className="child-reg-form-group">
              <label>Primary Location *</label>
              <select 
                name="primaryLocationId" 
                value={formData.primaryLocationId} 
                onChange={handleFormChangeWithValidation} 
                required 
                className={formErrors.primaryLocationId ? 'error-input' : ''}
                disabled={isSubmitting || isAddingChild}
              >
                <option value="">Select Location</option>
                {Array.isArray(locations) && locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              {formErrors.primaryLocationId && <span className="error-message">{formErrors.primaryLocationId}</span>}
            </div>
          </div>

          <div className="child-reg-pictures-section">
            <h3>Patient Pictures (Optional - 3 photos)</h3>
            <p className="child-reg-optional-note">* Pictures are optional. You can skip or add later.</p>
            <div className="child-reg-pictures-grid">
              {[1, 2, 3].map(num => {
                const preview = num === 1 ? preview1 : num === 2 ? preview2 : preview3;
                const showCam = num === 1 ? showCamera1 : num === 2 ? showCamera2 : showCamera3;
                const videoR = num === 1 ? videoRef1 : num === 2 ? videoRef2 : videoRef3;
                const canvasR = num === 1 ? canvasRef1 : num === 2 ? canvasRef2 : canvasRef3;
                const fileR = num === 1 ? fileInputRef1 : num === 2 ? fileInputRef2 : fileInputRef3;
                const facingMode = getCameraMode(num);
                
                return (
                  <div key={num} className="child-reg-picture-upload">
                    <div className="child-reg-picture-preview">
                      {preview ? (
                        <img src={preview} alt={`Patient ${num}`} className="child-reg-preview-image" />
                      ) : (
                        <div className="child-reg-picture-placeholder">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="2" y="2" width="20" height="20" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="2.5"/>
                            <path d="M21 15L16 10L5 21"/>
                          </svg>
                          <span>Photo {num}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Debug info - shows camera state with SVG icons */}
                    <div className="child-reg-camera-status-debug">
                      <span>Camera {num}: </span>
                      {showCam ? (
                        <CameraStatusOnIcon width={14} height={14} color="#28a745" />
                      ) : (
                        <CameraStatusOffIcon width={14} height={14} color="#dc3545" />
                      )}
                      <span> </span>
                      {videoR.current && videoR.current.srcObject ? (
                        <CheckCircleIcon width={14} height={14} color="#28a745" />
                      ) : (
                        <CrossIcon width={14} height={14} color="#dc3545" />
                      )}
                      {isCameraStarting && <SpinnerIcon width={14} height={14} color="#667eea" />}
                    </div>
                    
                    {/* Always render the video element, control visibility with CSS */}
                    {renderCameraPreview(num, showCam, videoR, canvasR)}
                    
                    {/* Upload options - only show when camera is off */}
                    {!showCam && renderUploadOptions(num, preview, fileR)}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="child-reg-form-actions">
            <button 
              className="child-reg-btn-secondary" 
              onClick={goBack} 
              disabled={isSubmitting || isAddingChild}
            >
              Cancel
            </button>
            <button 
              className="child-reg-btn-primary" 
              onClick={() => {
                if (validateForm()) {
                  setRegistrationStep(2);
                } else {
                  showToast('Please fill in all required fields', 'error');
                }
              }}
              disabled={isSubmitting || isAddingChild}
            >
              {isSubmitting || isAddingChild ? (
                <>
                  <span className="child-reg-spinner-small"></span>
                  Loading...
                </>
              ) : (
                'Next: Enroll Fingerprints'
              )}
            </button>
          </div>
        </div>
      )}

      {registrationStep === 2 && (
        <div className="child-reg-fingerprint-section-full">
          <h3 className="child-reg-form-step-title">
            Step 2: Enroll Fingerprints 
            <span style={{ color: '#6c757d', fontSize: '14px' }}>(Optional - Capture any number of fingers)</span>
            {!isSuperAdmin && (
              <span style={{ color: '#dc3545', fontSize: '13px', marginLeft: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <WarningIcon width={14} height={14} color="#dc3545" />
                Fingerprints required for non-admin users
              </span>
            )}
          </h3>
          
          <div className="child-reg-enrollment-container">
            <div className="child-reg-finger-grid">
              <h4>Select a finger to capture</h4>
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
                      disabled={isCapturing || isSavingFingerprints || isAddingChild}
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
              <div className="child-reg-enrollment-progress-bar">
                <span className="child-reg-progress-text">
                  {totalCaptured} / 10 fingers captured
                </span>
                <div className="child-reg-progress-track">
                  <div 
                    className="child-reg-progress-fill" 
                    style={{ width: `${(totalCaptured / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

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
                      disabled={isCapturing || isSavingFingerprints || isAddingChild}
                    >
                      {isCapturing ? (
                        <>
                          <span className="child-reg-spinner-small"></span>
                          Capturing...
                        </>
                      ) : (
                        `Capture ${fingerNames[selectedFinger].name}`
                      )}
                    </button>
                  </>
                ) : selectedFinger && fingerCaptures[selectedFinger] ? (
                  <div className="child-reg-capture-success">
                    {fingerImages?.[selectedFinger] ? (
                      <div className="child-reg-fingerprint-preview">
                        <img
                          src={fingerImages[selectedFinger]}
                          alt={`${fingerNames[selectedFinger].name} fingerprint scan`}
                        />
                      </div>
                    ) : (
                      <SuccessIcon width={80} height={80} />
                    )}
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
                      <button 
                        className="child-reg-btn-danger" 
                        onClick={() => handleRemoveFingerprint(selectedFinger)}
                        disabled={isSavingFingerprints || isAddingChild}
                      >
                        <RemoveIcon width={14} height={14} color="white" /> Remove
                      </button>
                      <button 
                        className="child-reg-btn-secondary" 
                        onClick={() => handleSelectFinger(null)}
                        disabled={isSavingFingerprints || isAddingChild}
                      >
                        Select Another Finger
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="child-reg-scanner-instructions">
                    <FingerprintIcon width={80} height={80} color="#667eea" />
                    <p>Select a finger from the grid above to begin</p>
                    <p className="child-reg-scanner-hint">Capture any number of fingers (0-10)</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="child-reg-enrollment-summary">
            <div className="child-reg-enrollment-summary-header">
              <h4>Captured Fingers ({totalCaptured}/10)</h4>
              {totalCaptured > 0 && (
                <span className="child-reg-captured-count-badge">
                  {totalCaptured} finger{totalCaptured !== 1 ? 's' : ''} captured
                </span>
              )}
            </div>
            {totalCaptured > 0 ? (
              <div className="child-reg-captured-list">
                {capturedFingers.sort((a, b) => a - b).map(fingerIndex => (
                  <div key={fingerIndex} className="child-reg-captured-item">
                    {fingerImages?.[fingerIndex] && (
                      <img
                        className="child-reg-captured-thumb"
                        src={fingerImages[fingerIndex]}
                        alt={`${fingerNames[fingerIndex].name} scan`}
                      />
                    )}
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
                      disabled={isSavingFingerprints || isAddingChild}
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
              <div className="child-reg-enrollment-buttons">
                {isSuperAdmin ? (
                  <button 
                    className="child-reg-btn-secondary" 
                    onClick={handleSkipFingerprints}
                    disabled={isSavingFingerprints || isAddingChild}
                    title="Super Admin: You can skip fingerprint capture"
                  >
                    Skip (Continue without fingerprints)
                  </button>
                ) : (
                  <button 
                    className="child-reg-btn-secondary" 
                    disabled={true}
                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                    title="Only Super Admins can skip fingerprint capture. Please capture at least one fingerprint."
                  >
                    <LockIcon width={14} height={14} color="#666" />
                    Skip (Restricted)
                  </button>
                )}
                
                <button 
                  className="child-reg-btn-primary" 
                  onClick={handleSaveFingerprints}
                  disabled={totalCaptured === 0 || isSavingFingerprints || isAddingChild}
                >
                  {isSavingFingerprints ? (
                    <>
                      <span className="child-reg-spinner-small"></span>
                      Saving...
                    </>
                  ) : (
                    `Save ${totalCaptured} Fingerprint(s) & Complete`
                  )}
                </button>
              </div>
              
              {!isSuperAdmin && totalCaptured === 0 && (
                <p className="child-reg-skip-restriction-info">
                  <InfoIcon width={16} height={16} color="#856404" />
                  <span>Only Super Administrators can skip fingerprint enrollment. Please capture at least one fingerprint to continue.</span>
                </p>
              )}
              
              <button 
                className="child-reg-btn-text" 
                onClick={() => setRegistrationStep(1)}
                disabled={isSavingFingerprints || isAddingChild}
              >
                ← Back to Patient Info
              </button>
            </div>
          </div>
        </div>
      )}

      {registrationStep === 3 && (
        <div className="child-reg-success-message">
          <SuccessIcon width={80} height={80} />
          <h3>Patient Registration Complete!</h3>
          <p>Registration ID: <strong>{generatedId}</strong></p>
          <p>Patient <strong>{formData.fullName}</strong> has been successfully registered.</p>
          {totalCaptured > 0 && (
            <p>{totalCaptured} fingerprint{totalCaptured !== 1 ? 's' : ''} enrolled successfully</p>
          )}
          {totalCaptured === 0 && isSuperAdmin && (
            <p style={{ color: '#856404', background: '#fff3cd', padding: '8px 12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <InfoIcon width={16} height={16} color="#856404" />
              Registered without fingerprints (Super Admin override)
            </p>
          )}
          <div className="child-reg-form-actions">
            <button 
              className="child-reg-btn-primary" 
              onClick={handleCompleteRegistration}
              disabled={isAddingChild}
            >
              {isAddingChild ? (
                <>
                  <span className="child-reg-spinner-small"></span>
                  Completing...
                </>
              ) : (
                'Go to Dashboard'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenderRegistrationPage;
