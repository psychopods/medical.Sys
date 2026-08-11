import React, { useState } from "react";
import "./SocialServices.css";

const SocialServices = ({ 
  socialServicesData, 
  setSocialServicesData, 
  educationOptions,
  saveSocialServices,
  showToast
}) => {
  // State for custom education input
  const [customEducation, setCustomEducation] = useState("");

  // Handle Clothing Changes
  const handleClothingChange = (field, value) => {
    setSocialServicesData({
      ...socialServicesData,
      clothing: {
        ...socialServicesData.clothing,
        [field]: value
      }
    });
  };

  // Handle Education Toggle
  const handleEducationToggle = (education) => {
    const educationList = socialServicesData.education || [];
    if (educationList.includes(education)) {
      setSocialServicesData({
        ...socialServicesData,
        education: educationList.filter((e) => e !== education),
      });
    } else {
      setSocialServicesData({
        ...socialServicesData,
        education: [...educationList, education],
      });
    }
  };

  // Handle Add Custom Education
  const handleAddCustomEducation = () => {
    if (!customEducation.trim()) {
      showToast("Please enter an education topic", "error");
      return;
    }
    
    const educationList = socialServicesData.education || [];
    if (educationList.includes(customEducation.trim())) {
      showToast("This education topic is already in the list", "warning");
      setCustomEducation("");
      return;
    }
    
    setSocialServicesData({
      ...socialServicesData,
      education: [...educationList, customEducation.trim()],
    });
    setCustomEducation("");
    showToast("Custom education topic added successfully!", "success");
  };

  // Handle Remove Custom Education
  const handleRemoveCustomEducation = (education) => {
    setSocialServicesData({
      ...socialServicesData,
      education: (socialServicesData.education || []).filter(
        (e) => e !== education
      ),
    });
    showToast(`Removed: ${education}`, "info");
  };

  return (
    <div className="mr-social-services-form">
      <h3>Social Services</h3>
      
      {/* Clothing Section */}
      <div className="mr-section">
        <h4 className="mr-section-title">Clothing & Shoes</h4>
        <div className="mr-form-row">
          <div className="mr-form-group">
            <label>Clothes (# of items)</label>
            <input
              type="number"
              min="0"
              value={socialServicesData.clothing.clothes || ""}
              onChange={(e) => handleClothingChange('clothes', e.target.value)}
              placeholder="e.g., 2"
            />
          </div>
          <div className="mr-form-group">
            <label>Shoes (# of pairs)</label>
            <input
              type="number"
              min="0"
              value={socialServicesData.clothing.shoes || ""}
              onChange={(e) => handleClothingChange('shoes', e.target.value)}
              placeholder="e.g., 1"
            />
          </div>
        </div>
        <div className="mr-form-row">
          <div className="mr-form-group">
            <label>Clothing Notes</label>
            <textarea
              value={socialServicesData.clothing.notes || ""}
              onChange={(e) => handleClothingChange('notes', e.target.value)}
              rows="3"
              placeholder="Additional clothing notes (sizes, types, colors, etc.)"
              className="mr-textarea"
            />
          </div>
        </div>
      </div>

      {/* Education Section */}
      <div className="mr-section">
        <h4 className="mr-section-title">Education Provided</h4>
        <div className="mr-checkbox-grid">
          {educationOptions.map((education) => (
            <label key={education} className="mr-checkbox-label">
              <input
                type="checkbox"
                checked={(socialServicesData.education || []).includes(education)}
                onChange={() => handleEducationToggle(education)}
              />
              <span>{education}</span>
            </label>
          ))}
        </div>
        
        {/* Custom Education List */}
        {(socialServicesData.education || []).filter(
          (edu) => !educationOptions.includes(edu)
        ).length > 0 && (
          <div className="mr-custom-list">
            <label className="mr-custom-list-label">Custom Education Topics:</label>
            <div className="mr-custom-tags">
              {(socialServicesData.education || [])
                .filter((edu) => !educationOptions.includes(edu))
                .map((edu) => (
                  <span key={edu} className="mr-custom-tag">
                    {edu}
                    <button
                      type="button"
                      className="mr-custom-tag-remove"
                      onClick={() => handleRemoveCustomEducation(edu)}
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Custom Education Input with Add Button */}
        <div className="mr-form-row">
          <div className="mr-form-group mr-custom-input-group">
            <label>Custom Education Topic</label>
            <div className="mr-custom-input-wrapper">
              <input
                type="text"
                placeholder="Enter custom education topic"
                value={customEducation}
                onChange={(e) => setCustomEducation(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustomEducation();
                  }
                }}
              />
              <button
                type="button"
                className="mr-btn mr-btn-add"
                onClick={handleAddCustomEducation}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Food & Refreshment Section */}
      <div className="mr-section">
        <h4 className="mr-section-title">Food & Refreshment</h4>
        <div className="mr-form-row">
          <div className="mr-form-group">
            <label>Food/Refreshment Provided</label>
            <input
              type="text"
              value={socialServicesData.foodRefreshment || ""}
              onChange={(e) =>
                setSocialServicesData({
                  ...socialServicesData,
                  foodRefreshment: e.target.value,
                })
              }
              placeholder="e.g., Meal, Snacks, Water, Juice"
            />
          </div>
        </div>
        <div className="mr-form-row">
          <div className="mr-form-group">
            <label>Quantity/Details</label>
            <input
              type="text"
              value={socialServicesData.foodDetails || ""}
              onChange={(e) =>
                setSocialServicesData({
                  ...socialServicesData,
                  foodDetails: e.target.value,
                })
              }
              placeholder="e.g., 2 meals, 5 bottles of water"
            />
          </div>
        </div>
      </div>

      {/* Other Services Section */}
      <div className="mr-section">
        <h4 className="mr-section-title">Other Services</h4>
        <div className="mr-form-row">
          <div className="mr-form-group">
            <label>Additional Services Provided</label>
            <textarea
              value={socialServicesData.otherServices || ""}
              onChange={(e) =>
                setSocialServicesData({
                  ...socialServicesData,
                  otherServices: e.target.value,
                })
              }
              rows="3"
              placeholder="Describe any other services provided (e.g., counseling, referrals, transportation, etc.)"
              className="mr-textarea"
            />
          </div>
        </div>
      </div>

      {/* Date Section */}
      <div className="mr-form-row">
        <div className="mr-form-group">
          <label>Date of Service</label>
          <input
            type="date"
            value={socialServicesData.date}
            onChange={(e) =>
              setSocialServicesData({
                ...socialServicesData,
                date: e.target.value,
              })
            }
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="mr-form-actions">
        <button
          className="mr-btn mr-btn-primary"
          onClick={saveSocialServices}
        >
          Save Social Services
        </button>
      </div>
    </div>
  );
};

export default SocialServices;