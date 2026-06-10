import React, { useState, useEffect, useRef } from 'react';
import './ReportsImpact.css';
import { executeQuery, executeRun } from '../services/db.js';

const API_BASE_URL = 'http://localhost:9865';
const API_TIMEOUT = 10000;

const ReportsImpact = () => {
  const [activeTab, setActiveTab] = useState('impact');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingStories, setLoadingStories] = useState(true);
  
  const [barChartData, setBarChartData] = useState({
    title: 'Quarterly Performance',
    labels: [],
    datasets: []
  });
  
  const [yearlyReports, setYearlyReports] = useState([]);
  const [quarterlyReports, setQuarterlyReports] = useState([]);
  const [successStories, setSuccessStories] = useState([]);
  
  const abortControllerRef = useRef(null);

  const currentYear = new Date().getFullYear();

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const fetchWithTimeout = async (url, options = {}, timeout = API_TIMEOUT) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  const fetchImpactData = async () => {
    setLoading(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/reports/impact-data`);
      const data = await response.json();
      
      if (response.ok && data.success && data.datasets && data.datasets.length > 0) {
        const datasets = data.datasets.map(ds => ({
          label: ds.label,
          values: ds.values,
          color: ds.color
        }));
        
        setBarChartData({
          title: `${data.title} ${currentYear}`,
          labels: data.labels || [],
          datasets: datasets
        });

        // Cache in SQLite
        for (const ds of data.datasets) {
          await executeRun(
            `INSERT OR REPLACE INTO reports_impact_metrics (id, label, q1_value, q2_value, q3_value, q4_value, color, year)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [crypto.randomUUID(), ds.label, ds.values[0] || 0, ds.values[1] || 0, ds.values[2] || 0, ds.values[3] || 0, ds.color, currentYear]
          );
        }
      } else {
        throw new Error(data.message || 'Failed to fetch impact data');
      }
    } catch (error) {
      console.warn('API: Failed to fetch impact data, checking SQLite cache...', error);
      try {
        const localMetrics = await executeQuery('SELECT * FROM reports_impact_metrics WHERE year = ?', [currentYear]);
        if (localMetrics.length > 0) {
          const datasets = localMetrics.map(row => ({
            label: row.label,
            values: [row.q1_value, row.q2_value, row.q3_value, row.q4_value],
            color: row.color
          }));
          setBarChartData({
            title: `Quarterly Performance ${currentYear}`,
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: datasets
          });
          return;
        }
      } catch (dbError) {
        console.error('SQLite query failed:', dbError);
      }
      setBarChartData({
        title: `Quarterly Performance ${currentYear}`,
        labels: [],
        datasets: []
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnualReports = async () => {
    setLoadingReports(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/reports/annual`);
      const data = await response.json();
      
      if (response.ok && data.success && data.reports && data.reports.length > 0) {
        const reports = data.reports.map(report => ({
          year: report.year,
          title: report.title,
          description: report.description,
          size: report.file_size,
          pages: report.page_count,
          download_url: report.download_url
        }));
        setYearlyReports(reports);

        // Cache in SQLite
        for (const report of data.reports) {
          await executeRun(
            `INSERT OR REPLACE INTO reports_annual (id, year, title, description, file_size, page_count, download_url)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [report.id || crypto.randomUUID(), report.year, report.title, report.description, report.file_size, report.page_count, report.download_url]
          );
        }
      } else {
        throw new Error(data.message || 'Failed to fetch annual reports');
      }
    } catch (error) {
      console.warn('API: Failed to fetch annual reports, checking SQLite cache...', error);
      try {
        const localReports = await executeQuery('SELECT * FROM reports_annual ORDER BY year DESC');
        if (localReports.length > 0) {
          const reports = localReports.map(report => ({
            year: report.year,
            title: report.title,
            description: report.description,
            size: report.file_size,
            pages: report.page_count,
            download_url: report.download_url
          }));
          setYearlyReports(reports);
          return;
        }
      } catch (dbError) {
        console.error('SQLite query failed:', dbError);
      }
      setYearlyReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchQuarterlyReports = async () => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/reports/quarterly`);
      const data = await response.json();
      
      if (response.ok && data.success && data.reports && data.reports.length > 0) {
        const reports = data.reports.map(report => ({
          quarter: report.quarter,
          title: report.title,
          period: report.period,
          description: report.description,
          size: report.file_size,
          download_url: report.download_url
        }));
        setQuarterlyReports(reports);

        // Cache in SQLite
        for (const report of data.reports) {
          await executeRun(
            `INSERT OR REPLACE INTO reports_quarterly (id, quarter, title, period, description, file_size, download_url)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [report.id || crypto.randomUUID(), report.quarter, report.title, report.period, report.description, report.file_size, report.download_url]
          );
        }
      } else {
        throw new Error(data.message || 'Failed to fetch quarterly reports');
      }
    } catch (error) {
      console.warn('API: Failed to fetch quarterly reports, checking SQLite cache...', error);
      try {
        const localReports = await executeQuery('SELECT * FROM reports_quarterly ORDER BY quarter DESC');
        if (localReports.length > 0) {
          const reports = localReports.map(report => ({
            quarter: report.quarter,
            title: report.title,
            period: report.period,
            description: report.description,
            size: report.file_size,
            download_url: report.download_url
          }));
          setQuarterlyReports(reports);
        }
      } catch (dbError) {
        console.error('SQLite query failed:', dbError);
      }
    }
  };

  const fetchSuccessStories = async () => {
    setLoadingStories(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/reports/success-stories`);
      const data = await response.json();
      
      if (response.ok && data.success && data.stories && data.stories.length > 0) {
        const stories = data.stories.map(story => ({
          id: story.id,
          title: story.title,
          description: story.description,
          impact: story.impact,
          date: story.date,
          category: story.category
        }));
        setSuccessStories(stories);

        // Cache in SQLite
        for (const story of data.stories) {
          await executeRun(
            `INSERT OR REPLACE INTO reports_success_stories (id, title, description, impact, date, category)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [story.id, story.title, story.description, story.impact, story.date, story.category]
          );
        }
      } else {
        throw new Error(data.message || 'Failed to fetch success stories');
      }
    } catch (error) {
      console.warn('API: Failed to fetch success stories, checking SQLite cache...', error);
      try {
        const localStories = await executeQuery('SELECT * FROM reports_success_stories ORDER BY id DESC');
        if (localStories.length > 0) {
          const stories = localStories.map(story => ({
            id: story.id,
            title: story.title,
            description: story.description,
            impact: story.impact,
            date: story.date,
            category: story.category
          }));
          setSuccessStories(stories);
          return;
        }
      } catch (dbError) {
        console.error('SQLite query failed:', dbError);
      }
      setSuccessStories([]);
    } finally {
      setLoadingStories(false);
    }
  };

  useEffect(() => {
    fetchImpactData();
    fetchAnnualReports();
    fetchQuarterlyReports();
    fetchSuccessStories();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const allValues = barChartData.datasets.flatMap(d => d.values);
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 2000;
  const yAxisMax = Math.ceil(maxValue / 200) * 200;
  const yAxisSteps = [yAxisMax, yAxisMax * 0.75, yAxisMax * 0.5, yAxisMax * 0.25, 0];

  const getBarHeight = (value) => {
    return (value / yAxisMax) * 100;
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'education':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 6V4M12 6C10 6 8 7 8 9C8 11 10 12 12 12C14 12 16 11 16 9C16 7 14 6 12 6Z" stroke="#0066cc" strokeWidth="1.5"/>
            <path d="M4 16C4 14 6 12 9 12H15C18 12 20 14 20 16V20H4V16Z" stroke="#0066cc" strokeWidth="1.5"/>
          </svg>
        );
      case 'healthcare':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8V16M8 12H16" stroke="#0066cc" strokeWidth="1.5"/>
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#0066cc" strokeWidth="1.5"/>
          </svg>
        );
      case 'social':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="#0066cc" strokeWidth="1.5"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#0066cc" strokeWidth="1.5"/>
          </svg>
        );
      case 'nutrition':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15 9H22L16 14L19 21L12 17L5 21L8 14L2 9H9L12 2Z" stroke="#0066cc" strokeWidth="1.5"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const handleDownload = (report) => {
    window.open(report.download_url, '_blank');
    showToast(`Downloading ${report.title}...`, 'success');
  };

  // No Data Component
  const NoDataMessage = ({ message, icon }) => (
    <div className="no-data-container">
      <div className="no-data-icon">
        {icon || (
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#0066cc" strokeWidth="2"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="#0066cc" strokeWidth="2"/>
            <circle cx="12" cy="16" r="1" fill="#0066cc"/>
          </svg>
        )}
      </div>
      <h3>No Data Available</h3>
      <p>{message || "Information will be updated soon."}</p>
    </div>
  );

  if (loading && barChartData.labels.length === 0) {
    return (
      <div className="reports-page">
        <div className="reports-hero">
          <div className="reports-hero-content">
            <h1>Reports & Impact</h1>
            <p>Transparency, accountability, and measurable change in our communities</p>
          </div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-content">
            <span>{toast.message}</span>
          </div>
          <button className="toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
        </div>
      )}

      <div className="reports-hero">
        <div className="reports-hero-content">
          <h1>Reports & Impact</h1>
          <p>Transparency, accountability, and measurable change in our communities</p>
        </div>
      </div>

      {/* Bar Chart Section - Show only if data exists */}
      {barChartData.labels.length > 0 && barChartData.datasets.length > 0 ? (
        <div className="impact-stats-section">
          <div className="container">
            <h2 className="section-title">{barChartData.title}</h2>
            <div className="bar-chart-container">
              <div className="bar-y-axis">
                {yAxisSteps.map((step, i) => (
                  <div key={i} className="bar-y-label">
                    {Math.round(step).toLocaleString()}
                  </div>
                ))}
              </div>
              
              <div className="bar-chart-area">
                <div className="bar-grid-lines">
                  {yAxisSteps.map((_, i) => (
                    <div key={i} className="bar-grid-line"></div>
                  ))}
                </div>
                
                <div className="bars-container">
                  {barChartData.labels.map((label, labelIndex) => (
                    <div key={labelIndex} className="bar-group">
                      {barChartData.datasets.map((dataset, datasetIndex) => (
                        <div
                          key={datasetIndex}
                          className="bar"
                          style={{
                            height: `${getBarHeight(dataset.values[labelIndex])}%`,
                            backgroundColor: dataset.color,
                            width: `${90 / barChartData.datasets.length}%`
                          }}
                        >
                          <span className="bar-value">{dataset.values[labelIndex]}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                
                <div className="bar-x-axis">
                  {barChartData.labels.map((label, i) => (
                    <div key={i} className="bar-x-label">
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bar-legend">
              {barChartData.datasets.map((dataset, idx) => (
                <div key={idx} className="bar-legend-item">
                  <span className="bar-legend-color" style={{ backgroundColor: dataset.color }}></span>
                  <span className="bar-legend-label">{dataset.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : !loading && (
        <div className="impact-stats-section">
          <div className="container">
            <NoDataMessage message="Impact data will be available soon." />
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="reports-tabs-section">
        <div className="container">
          <div className="tabs-wrapper">
            <button 
              className={`tab-btn ${activeTab === 'impact' ? 'active' : ''}`}
              onClick={() => setActiveTab('impact')}
            >
              Success Stories
            </button>
            <button 
              className={`tab-btn ${activeTab === 'annual' ? 'active' : ''}`}
              onClick={() => setActiveTab('annual')}
            >
              Annual Reports
            </button>
            <button 
              className={`tab-btn ${activeTab === 'quarterly' ? 'active' : ''}`}
              onClick={() => setActiveTab('quarterly')}
            >
              Quarterly Reports
            </button>
          </div>
        </div>
      </div>

      {/* Success Stories Tab */}
      {activeTab === 'impact' && (
        <div className="success-stories-section">
          <div className="container">
            {loadingStories ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading stories...</p>
              </div>
            ) : successStories.length > 0 ? (
              <div className="stories-grid">
                {successStories.map((story) => (
                  <div className="story-card" key={story.id}>
                    <div className="story-category">
                      {getCategoryIcon(story.category)}
                      <span>{story.category.charAt(0).toUpperCase() + story.category.slice(1)}</span>
                    </div>
                    <h3>{story.title}</h3>
                    <p>{story.description}</p>
                    <div className="story-impact">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="#28a745" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span>{story.impact}</span>
                    </div>
                    <div className="story-date">{story.date}</div>
                  </div>
                ))}
              </div>
            ) : (
              <NoDataMessage message="No success stories available at the moment." />
            )}
          </div>
        </div>
      )}

      {/* Annual Reports Tab */}
      {activeTab === 'annual' && (
        <div className="reports-list-section">
          <div className="container">
            {loadingReports ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading reports...</p>
              </div>
            ) : yearlyReports.length > 0 ? (
              <div className="reports-grid">
                {yearlyReports.map((report) => (
                  <div className="report-card" key={report.year}>
                    <div className="report-year">{report.year}</div>
                    <h3>{report.title}</h3>
                    <p>{report.description}</p>
                    <div className="report-meta">
                      <span className="report-size">{report.size}</span>
                      <span className="report-pages">{report.pages} pages</span>
                    </div>
                    <button 
                      className="download-btn"
                      onClick={() => handleDownload(report)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Download PDF
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <NoDataMessage message="No annual reports available at this time." />
            )}
          </div>
        </div>
      )}

      {/* Quarterly Reports Tab */}
      {activeTab === 'quarterly' && (
        <div className="reports-list-section">
          <div className="container">
            {loadingReports ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading reports...</p>
              </div>
            ) : quarterlyReports.length > 0 ? (
              <div className="reports-grid">
                {quarterlyReports.map((report, index) => (
                  <div className="report-card" key={index}>
                    <div className="report-quarter">{report.quarter}</div>
                    <h3>{report.title}</h3>
                    <p>{report.description}</p>
                    <div className="report-meta">
                      <span className="report-size">{report.size}</span>
                    </div>
                    <button 
                      className="download-btn"
                      onClick={() => handleDownload(report)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Download PDF
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <NoDataMessage message="No quarterly reports available at this time." />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsImpact;