import React from "react";
import "./ServiceDelivery.css";

const ServiceDelivery = ({ serviceDelivery }) => {
  // Find max value for medication bars
  const maxMedCount = Math.max(...Object.values(serviceDelivery.medicationsGiven));

  return (
    <div className="mr-service-delivery">
      {/* Service Delivery Summary Section */}
      <div className="mr-section-block">
        <div className="mr-section-header">
          <h3>Service Delivery Summary</h3>
          <span className="mr-section-badge">Overview</span>
        </div>
        <div className="mr-metric-grid">
          <div className="mr-metric-item">
            <span className="mr-metric-label">Total Kids Seen</span>
            <div className="mr-metric-bar-container">
              <div 
                className="mr-metric-bar mr-metric-bar-blue"
                style={{ width: `${Math.min((serviceDelivery.totalKidsSeen / 1000) * 100, 100)}%` }}
              >
                <span className="mr-metric-value">
                  {serviceDelivery.totalKidsSeen}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-metric-item">
            <span className="mr-metric-label">Total Services Provided</span>
            <div className="mr-metric-bar-container">
              <div 
                className="mr-metric-bar mr-metric-bar-green"
                style={{ width: `${Math.min((serviceDelivery.totalServicesProvided / 2000) * 100, 100)}%` }}
              >
                <span className="mr-metric-value">
                  {serviceDelivery.totalServicesProvided}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-metric-item">
            <span className="mr-metric-label">Average BMI (All Kids)</span>
            <div className="mr-metric-bar-container">
              <div 
                className="mr-metric-bar mr-metric-bar-purple"
                style={{ width: `${Math.min((serviceDelivery.averageBMI / 25) * 100, 100)}%` }}
              >
                <span className="mr-metric-value">
                  {serviceDelivery.averageBMI.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Material Support Provided Section */}
      <div className="mr-section-block">
        <div className="mr-section-header">
          <h3>Material Support Provided</h3>
          <span className="mr-section-badge mr-badge-material">Support</span>
        </div>
        <div className="mr-metric-grid">
          <div className="mr-metric-item">
            <span className="mr-metric-label">Total Clothes Given</span>
            <div className="mr-metric-bar-container">
              <div 
                className="mr-metric-bar mr-metric-bar-orange"
                style={{ width: `${Math.min((serviceDelivery.totalClothesGiven / 100) * 100, 100)}%` }}
              >
                <span className="mr-metric-value">
                  {serviceDelivery.totalClothesGiven}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-metric-item">
            <span className="mr-metric-label">Total Shoes Given</span>
            <div className="mr-metric-bar-container">
              <div 
                className="mr-metric-bar mr-metric-bar-teal"
                style={{ width: `${Math.min((serviceDelivery.totalShoesGiven / 500) * 100, 100)}%` }}
              >
                <span className="mr-metric-value">
                  {serviceDelivery.totalShoesGiven}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-metric-item">
            <span className="mr-metric-label">Total Food Provided</span>
            <div className="mr-metric-bar-container">
              <div 
                className="mr-metric-bar mr-metric-bar-yellow"
                style={{ width: `${Math.min((serviceDelivery.totalFoodProvided / 300) * 100, 100)}%` }}
              >
                <span className="mr-metric-value">
                  {serviceDelivery.totalFoodProvided}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-metric-item">
            <span className="mr-metric-label">Total Education Sessions</span>
            <div className="mr-metric-bar-container">
              <div 
                className="mr-metric-bar mr-metric-bar-pink"
                style={{ width: `${Math.min((serviceDelivery.totalEducationSessions / 50) * 100, 100)}%` }}
              >
                <span className="mr-metric-value">
                  {serviceDelivery.totalEducationSessions}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-metric-item">
            <span className="mr-metric-label">Total Tests Done</span>
            <div className="mr-metric-bar-container">
              <div 
                className="mr-metric-bar mr-metric-bar-indigo"
                style={{ width: `${Math.min((serviceDelivery.totalTestsDone / 500) * 100, 100)}%` }}
              >
                <span className="mr-metric-value">
                  {serviceDelivery.totalTestsDone}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Medications Given Section */}
      <div className="mr-section-block">
        <div className="mr-section-header">
          <h3>Medications Given</h3>
          <span className="mr-section-badge mr-badge-medication">Top 6</span>
        </div>
        <div className="mr-medication-list">
          {Object.entries(serviceDelivery.medicationsGiven).map(
            ([med, count]) => {
              const percentage = maxMedCount > 0 ? (count / maxMedCount) * 100 : 0;
              return (
                <div key={med} className="mr-med-item">
                  <span className="mr-med-name">{med}</span>
                  <div className="mr-med-bar-container">
                    <div
                      className="mr-med-bar"
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    >
                      <span className="mr-med-count-inner">{count}</span>
                    </div>
                    <span className="mr-med-count">{count}</span>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceDelivery;