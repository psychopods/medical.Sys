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
  isSavingChild // Add loading prop
}) => {
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
              value={childFormData.fullName}
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
              value={childFormData.gender}
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
              value={childFormData.primaryLocationId}
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