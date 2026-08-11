import React from "react";
import "./ProgramSummary.css";

const ProgramSummary = ({ programSummary }) => {
  // Calculate total for BMI distribution
  const totalBMI = Object.values(programSummary.bmiDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="mr-program-summary">
      {/* Program Overview Section */}
      <div className="mr-section-block">
        <div className="mr-section-header">
          <h3>Program Overview</h3>
          <span className="mr-section-badge">Summary</span>
        </div>
        <div className="mr-overview-list">
          <div className="mr-overview-item">
            <span className="mr-overview-label">Total Visits Recorded</span>
            <div className="mr-overview-bar-container">
              <div 
                className="mr-overview-bar mr-overview-bar-blue"
                style={{ width: `${Math.min((programSummary.totalVisitsRecorded / 2000) * 100, 100)}%` }}
              >
                <span className="mr-overview-value">
                  {programSummary.totalVisitsRecorded.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-overview-item">
            <span className="mr-overview-label">Average Visits per Child</span>
            <div className="mr-overview-bar-container">
              <div 
                className="mr-overview-bar mr-overview-bar-green"
                style={{ width: `${Math.min((programSummary.averageVisitsPerChild / 5) * 100, 100)}%` }}
              >
                <span className="mr-overview-value">
                  {programSummary.averageVisitsPerChild}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-overview-item">
            <span className="mr-overview-label">Most Common Services</span>
            <div className="mr-overview-bar-container">
              <div 
                className="mr-overview-bar mr-overview-bar-purple"
                style={{ width: `${Math.min((programSummary.mostCommonServices.length / 50) * 100, 100)}%` }}
              >
                <span className="mr-overview-value">
                  {programSummary.mostCommonServices}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-overview-item">
            <span className="mr-overview-label">Top Medications Given</span>
            <div className="mr-overview-bar-container">
              <div 
                className="mr-overview-bar mr-overview-bar-orange"
                style={{ width: `${Math.min((programSummary.topMedications.length / 50) * 100, 100)}%` }}
              >
                <span className="mr-overview-value">
                  {programSummary.topMedications}
                </span>
              </div>
            </div>
          </div>
          <div className="mr-overview-item">
            <span className="mr-overview-label">Hospitalizations</span>
            <div className="mr-overview-bar-container">
              <div 
                className="mr-overview-bar mr-overview-bar-red"
                style={{ width: `${Math.min((programSummary.hospitalizations / 10) * 100, 100)}%` }}
              >
                <span className="mr-overview-value">
                  {programSummary.hospitalizations}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BMI Distribution Section */}
      <div className="mr-section-block">
        <div className="mr-section-header">
          <h3>BMI Distribution</h3>
          <span className="mr-section-badge mr-badge-bmi">Health Status</span>
        </div>
        <div className="mr-bmi-distribution">
          {Object.entries(programSummary.bmiDistribution).map(
            ([status, count]) => {
              const percentage = totalBMI > 0 ? (count / totalBMI) * 100 : 0;
              const barClass = `mr-bmi-bar mr-bmi-bar-${status.toLowerCase().replace(/\s/g, "-")}`;
              
              return (
                <div key={status} className="mr-bmi-bar-item">
                  <div className="mr-bmi-bar-label">
                    <span className="mr-bmi-status-dot"></span>
                    {status}
                  </div>
                  <div className="mr-bmi-bar-container">
                    <div
                      className={barClass}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    >
                      <span className="mr-bmi-bar-percentage">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <span className="mr-bmi-bar-count">{count}</span>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Common Health Issues Section */}
      <div className="mr-section-block">
        <div className="mr-section-header">
          <h3>Common Health Issues</h3>
          <span className="mr-section-badge mr-badge-health">Top Issues</span>
        </div>
        <div className="mr-two-columns">
          <div className="mr-health-column">
            <h4>Common Symptoms</h4>
            <ul className="mr-bullet-list">
              {programSummary.commonSymptoms.map((symptom, i) => (
                <li key={i}>
                  <span className="mr-bullet-dot"></span>
                  {symptom}
                </li>
              ))}
            </ul>
          </div>
          <div className="mr-health-column">
            <h4>Common Diagnoses</h4>
            <ul className="mr-bullet-list">
              {programSummary.commonDiagnoses.map((diagnosis, i) => (
                <li key={i}>
                  <span className="mr-bullet-dot"></span>
                  {diagnosis}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramSummary;