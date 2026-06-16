import React from 'react';

const RenderChildViewPage = ({
  viewingChild,
  fingerprintData,
  calculateAgeFromYear,
  getLocationName,
  getStaffNameById,
  handleEditChild,
  goBack,
  isLoading // Add loading prop
}) => {
  const childFingerprints = fingerprintData.filter(fp => 
    fp.childId === viewingChild?.id || fp.customSerialId === viewingChild?.customSerialId
  );
  const fingerCount = childFingerprints.length;

  return (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button className="child-reg-back-btn" onClick={goBack} disabled={isLoading}>← Back</button>
        <div className="child-reg-header-actions">
          <h1 className="child-reg-page-title">Patient Details</h1>
        </div>
      </div>

      <div className="child-reg-view-container">
        <div className="child-reg-view-images-section">
          <h3>Patient Photos</h3>
          <div className="child-reg-view-images-grid">
            {viewingChild?.image1 && (
              <div className="child-reg-view-image-card">
                <img src={viewingChild.image1} alt="Child photo 1" />
                <span>Photo 1</span>
              </div>
            )}
            {viewingChild?.image2 && (
              <div className="child-reg-view-image-card">
                <img src={viewingChild.image2} alt="Child photo 2" />
                <span>Photo 2</span>
              </div>
            )}
            {viewingChild?.image3 && (
              <div className="child-reg-view-image-card">
                <img src={viewingChild.image3} alt="Child photo 3" />
                <span>Photo 3</span>
              </div>
            )}
            {!viewingChild?.image1 && !viewingChild?.image2 && !viewingChild?.image3 && (
              <div className="child-reg-no-images-message">
                <p>No photos available for this patient</p>
              </div>
            )}
          </div>
        </div>

        <div className="child-reg-view-info-section">
          <div className="child-reg-info-grid">
            <div className="child-reg-info-item">
              <label>ID:</label>
              <span>{viewingChild?.customSerialId || 'N/A'}</span>
            </div>
            <div className="child-reg-info-item">
              <label>Full Name:</label>
              <span>{viewingChild?.fullName || 'N/A'}</span>
            </div>
            <div className="child-reg-info-item">
              <label>Estimated Birth Year:</label>
              <span>{viewingChild?.estimatedBirthYear || 'N/A'}</span>
            </div>
            <div className="child-reg-info-item">
              <label>Age:</label>
              <span>{calculateAgeFromYear(viewingChild?.estimatedBirthYear)}</span>
            </div>
            <div className="child-reg-info-item">
              <label>Gender:</label>
              <span>{viewingChild?.gender || 'N/A'}</span>
            </div>
            <div className="child-reg-info-item">
              <label>Location:</label>
              <span>{getLocationName(viewingChild?.primaryLocationId)}</span>
            </div>
            <div className="child-reg-info-item">
              <label>Registration Date:</label>
              <span>{viewingChild?.createdAt ? viewingChild.createdAt.split('T')[0] : 'N/A'}</span>
            </div>
            <div className="child-reg-info-item">
              <label>Fingerprints Captured:</label>
              <span>{`${fingerCount}/10`}</span>
            </div>
            <div className="child-reg-info-item">
              <label>Registered By:</label>
              <span>{viewingChild?.registeredByName || getStaffNameById(viewingChild?.createdByStaffId) || 'N/A'}</span>
            </div>
            <div className="child-reg-info-item">
              <label>Version:</label>
              <span>{viewingChild?.version || 1}</span>
            </div>
          </div>
        </div>

        <div className="child-reg-view-actions">
          <button 
            className="child-reg-btn-primary" 
            onClick={() => {
              handleEditChild(viewingChild);
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="child-reg-spinner-small"></span>
                Loading...
              </>
            ) : (
              'Edit Patient'
            )}
          </button>
          <button 
            className="child-reg-btn-secondary" 
            onClick={goBack}
            disabled={isLoading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenderChildViewPage;