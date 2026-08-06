import React from 'react';

const RenderChildEditPage = ({
  editingChild,
  childFormData,
  childFormErrors,
  locations,
  handleChildFormChange,
  handleChildAgeChange,
  handleSaveChild,
  goBack,
  isSavingChild,
  // Picture props
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
  handleFileUpload,
  handleRemovePhoto,
  startCamera,
  capturePhoto,
  stopCamera,
  switchCamera,
  cameraError,
  isCameraStarting,
  cameraFacingMode1,
  cameraFacingMode2,
  cameraFacingMode3
}) => {
  // Get camera facing mode for a specific camera
  const getCameraMode = (num) => {
    if (num === 1) return cameraFacingMode1 || 'user';
    if (num === 2) return cameraFacingMode2 || 'user';
    return cameraFacingMode3 || 'user';
  };

  // Helper function to render camera preview with switch button
  const renderCameraPreview = (num, showCam, videoRef, canvasRef) => {
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
          <div className="child-reg-camera-controls">
            <button 
              className="child-reg-btn-capture" 
              onClick={() => capturePhoto(num)} 
              title="Capture Photo"
              disabled={isSavingChild || isCameraStarting}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button 
              className="child-reg-btn-switch-camera" 
              onClick={() => switchCamera(num)} 
              title="Switch Camera"
              disabled={isSavingChild || isCameraStarting}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9" />
              </svg>
            </button>
            <button 
              className="child-reg-btn-cancel" 
              onClick={() => stopCamera(num)} 
              title="Cancel"
              disabled={isSavingChild}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
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
          disabled={isSavingChild} 
        />
        <button 
          className="child-reg-btn-upload" 
          onClick={() => fileRef.current?.click()} 
          title="Upload Photo"
          disabled={isSavingChild}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </button>
        <button 
          className="child-reg-btn-camera" 
          onClick={() => startCamera(num)} 
          title="Take Photo"
          disabled={isSavingChild || isCameraStarting}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>
        {preview && (
          <button 
            className="child-reg-btn-remove" 
            onClick={() => handleRemovePhoto(num)} 
            title="Remove Photo" 
            disabled={isSavingChild}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
              <path d="M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13"/>
              <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>
            </svg>
          </button>
        )}
        {cameraError && (
          <div className="child-reg-camera-error">
            <span>⚠️ {cameraError}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button className="child-reg-back-btn" onClick={goBack} disabled={isSavingChild}>← Back</button>
        <div className="child-reg-header-actions">
          <h1 className="child-reg-page-title">Edit Patient</h1>
        </div>
        <p>Editing: <strong>{editingChild?.fullName}</strong> (ID: {editingChild?.customSerialId})</p>
      </div>

      <div className="child-reg-edit-container">
        <div className="child-reg-form-grid">
          <div className="child-reg-form-group">
            <label>Patient's Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={childFormData.fullName || ""}
              onChange={handleChildFormChange}
              placeholder="Enter child's full name"
              className={childFormErrors.fullName ? 'error-input' : ''}
              disabled={isSavingChild}
            />
            {childFormErrors.fullName && <span className="error-message">{childFormErrors.fullName}</span>}
          </div>
          <div className="child-reg-form-group child-reg-age-year-group">
            <label>Age & Birth Year *</label>
            <div className="child-reg-age-year-row">
              <div className="child-reg-input-with-label">
                <input
                  type="number"
                  name="estimatedAge"
                  value={childFormData.estimatedBirthYear ? (new Date().getFullYear() - parseInt(childFormData.estimatedBirthYear, 10)) : ''}
                  onChange={handleChildAgeChange}
                  placeholder="Age"
                  min="0"
                  max="120"
                  className={childFormErrors.estimatedBirthYear ? 'error-input' : ''}
                  disabled={isSavingChild}
                />
                <span className="child-reg-input-sublabel">Estimated Age (Years)</span>
              </div>
              <div className="child-reg-age-year-divider">or</div>
              <div className="child-reg-input-with-label">
                <select
                  name="estimatedBirthYear"
                  value={childFormData.estimatedBirthYear || ""}
                  onChange={handleChildFormChange}
                  className={childFormErrors.estimatedBirthYear ? 'error-input' : ''}
                  disabled={isSavingChild}
                >
                  <option value="">Select Year</option>
                  {Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <span className="child-reg-input-sublabel">Birth Year *</span>
              </div>
            </div>
            {childFormErrors.estimatedBirthYear && <span className="error-message">{childFormErrors.estimatedBirthYear}</span>}
          </div>
          <div className="child-reg-form-group">
            <label>Gender *</label>
            <select
              name="gender"
              value={childFormData.gender || ""}
              onChange={handleChildFormChange}
              className={childFormErrors.gender ? 'error-input' : ''}
              disabled={isSavingChild}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            {childFormErrors.gender && <span className="error-message">{childFormErrors.gender}</span>}
          </div>
          <div className="child-reg-form-group">
            <label>Primary Location *</label>
            <select
              name="primaryLocationId"
              value={childFormData.primaryLocationId || ""}
              onChange={handleChildFormChange}
              className={childFormErrors.primaryLocationId ? 'error-input' : ''}
              disabled={isSavingChild}
            >
              <option value="">Select Location</option>
              {Array.isArray(locations) && locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            {childFormErrors.primaryLocationId && <span className="error-message">{childFormErrors.primaryLocationId}</span>}
          </div>
        </div>

        {/* PICTURES SECTION */}
        <div className="child-reg-pictures-section">
          <h3>Patient Pictures (Optional - 3 photos)</h3>
          <p className="child-reg-optional-note">* Pictures are optional. You can upload or take new photos.</p>
          <div className="child-reg-pictures-grid">
            {[1, 2, 3].map(num => {
              const preview = num === 1 ? preview1 : num === 2 ? preview2 : preview3;
              const showCam = num === 1 ? showCamera1 : num === 2 ? showCamera2 : showCamera3;
              const videoR = num === 1 ? videoRef1 : num === 2 ? videoRef2 : videoRef3;
              const canvasR = num === 1 ? canvasRef1 : num === 2 ? canvasRef2 : canvasRef3;
              const fileR = num === 1 ? fileInputRef1 : num === 2 ? fileInputRef2 : fileInputRef3;
              
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
                  
                  {/* Camera preview */}
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
            disabled={isSavingChild}
          >
            Cancel
          </button>
          <button 
            className="child-reg-btn-primary" 
            onClick={handleSaveChild}
            disabled={isSavingChild}
          >
            {isSavingChild ? (
              <>
                <span className="child-reg-spinner-small"></span>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenderChildEditPage;