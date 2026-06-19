import React from 'react';

const RenderLocationsManagement = ({
  locations,
  searchLocations,
  setSearchLocations,
  showLocationForm,
  locationFormData,
  locationFormErrors,
  editingLocation,
  handleLocationFormChange,
  resetLocationForm,
  handleSaveLocation,
  handleEditLocation,
  handleDeleteLocation,
  goBack,
  setShowLocationForm,
  isAddingLocation // Add loading prop
}) => {
  const filteredLocations = Array.isArray(locations) ? locations.filter(location =>
    location.name?.toLowerCase().includes(searchLocations.toLowerCase())
  ) : [];

  // Handle Add New Location click
  const handleAddNewLocation = () => {
    resetLocationForm();
    setShowLocationForm(true);
  };

  return (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <button className="child-reg-back-btn" onClick={goBack}>← Back</button>
        <div className="child-reg-header-actions">
          <h1 className="child-reg-page-title">Manage Locations</h1>
          <button 
            className="child-reg-add-btn" 
            onClick={handleAddNewLocation}
            disabled={isAddingLocation}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add New Location
          </button>
        </div>
        <p className="child-reg-page-subtitle">Total locations: {Array.isArray(locations) ? locations.length : 0}</p>
      </div>
      
      {showLocationForm && (
        <div className="child-reg-location-form-container">
          <h3>{editingLocation ? 'Edit Location' : 'Add New Location'}</h3>
          <div className="child-reg-form-grid">
            <div className="child-reg-form-group">
              <label>Location Name *</label>
              <input
                type="text"
                name="name"
                value={locationFormData.name}
                onChange={handleLocationFormChange}
                placeholder="e.g., Arusha, Dar es Salaam - Ilala, Mwanza"
                className={locationFormErrors.name ? 'error-input' : ''}
                disabled={isAddingLocation}
              />
              {locationFormErrors.name && <span className="error-message">{locationFormErrors.name}</span>}
            </div>
            <div className="child-reg-form-group">
              <label>Description (Optional)</label>
              <textarea
                name="description"
                value={locationFormData.description}
                onChange={handleLocationFormChange}
                placeholder="Additional information about this location"
                rows="3"
                disabled={isAddingLocation}
              />
            </div>
          </div>
          <div className="child-reg-form-actions">
            <button 
              className="child-reg-btn-secondary" 
              onClick={() => {
                resetLocationForm();
                setShowLocationForm(false);
              }}
              disabled={isAddingLocation}
            >
              Cancel
            </button>
            <button 
              className="child-reg-btn-primary" 
              onClick={handleSaveLocation}
              disabled={isAddingLocation}
            >
              {isAddingLocation ? (
                <>
                  <span className="child-reg-spinner-small"></span>
                  {editingLocation ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editingLocation ? 'Update Location' : 'Add Location'
              )}
            </button>
          </div>
        </div>
      )}
      
      <div className="child-reg-search-bar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input 
          type="text" 
          placeholder="Search by location name..." 
          value={searchLocations} 
          onChange={(e) => setSearchLocations(e.target.value)} 
          disabled={isAddingLocation}
        />
      </div>
      
      <div className="child-reg-data-table-container">
        <table className="child-reg-data-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Location Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLocations.map((location, index) => (
              <tr key={location.id}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td><strong>{location.name}</strong></td>
                <td>{location.description || '—'}</td>
                <td>
                  <button 
                    className="child-reg-action-btn child-reg-edit-btn" 
                    onClick={() => handleEditLocation(location)}
                    title="Edit Location"
                    disabled={isAddingLocation}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3L21 7L7 21H3V17L17 3Z" />
                    </svg>
                  </button>
                  <button 
                    className="child-reg-action-btn child-reg-delete-btn" 
                    onClick={() => handleDeleteLocation(location)}
                    title="Delete Location"
                    disabled={isAddingLocation}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 7H20" strokeWidth="2" />
                      <path d="M10 11V17" strokeWidth="2" />
                      <path d="M14 11V17" strokeWidth="2" />
                      <path d="M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" strokeWidth="2" />
                      <path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" strokeWidth="2" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLocations.length === 0 && (
          <div className="child-reg-no-data">
            <p>No locations found. Click "Add New Location" to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RenderLocationsManagement;