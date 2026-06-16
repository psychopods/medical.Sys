import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './ReportsAdmin.css';
import { executeQuery, executeRun } from '../../services/db.js';

import { API_ENDPOINTS, API_BASE_URL } from '../../config/endpoints.js';
const API_TIMEOUT = 10000;

const ReportsAdmin = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('list');
  
  // Data states
  const [annualReports, setAnnualReports] = useState([]);
  const [quarterlyReports, setQuarterlyReports] = useState([]);
  const [successStories, setSuccessStories] = useState([]);
  const [impactMetrics, setImpactMetrics] = useState([]);
  
  // View states
  const [viewingAnnual, setViewingAnnual] = useState(null);
  const [viewingQuarterly, setViewingQuarterly] = useState(null);
  const [viewingStory, setViewingStory] = useState(null);
  const [viewingMetric, setViewingMetric] = useState(null);
  
  // Form states
  const [editingAnnual, setEditingAnnual] = useState(null);
  const [editingQuarterly, setEditingQuarterly] = useState(null);
  const [editingStory, setEditingStory] = useState(null);
  const [editingMetric, setEditingMetric] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // Form data
  const [annualFormData, setAnnualFormData] = useState({
    id: '',
    year: '',
    title: '',
    description: '',
    fileSize: '',
    pageCount: '',
    downloadUrl: ''
  });
  
  const [quarterlyFormData, setQuarterlyFormData] = useState({
    id: '',
    quarter: '',
    title: '',
    period: '',
    description: '',
    fileSize: '',
    downloadUrl: ''
  });
  
  const [storyFormData, setStoryFormData] = useState({
    id: '',
    title: '',
    description: '',
    impact: '',
    date: '',
    category: 'healthcare'
  });
  
  const [metricFormData, setMetricFormData] = useState({
    id: '',
    label: '',
    q1Value: '',
    q2Value: '',
    q3Value: '',
    q4Value: '',
    color: '#0066cc',
    year: new Date().getFullYear().toString()
  });

  const navigate = useNavigate();

  // Icon components
  const IconEdit = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 3L21 7L7 21H3V17L17 3Z"/>
    </svg>
  );

  const IconDelete = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7H20" strokeWidth="2"/>
      <path d="M10 11V17" strokeWidth="2"/>
      <path d="M14 11V17" strokeWidth="2"/>
      <path d="M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" strokeWidth="2"/>
      <path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" strokeWidth="2"/>
    </svg>
  );

  const IconView = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const IconAdd = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5V19" strokeWidth="2"/>
      <path d="M5 12H19" strokeWidth="2"/>
    </svg>
  );

  const IconBack = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18L9 12L15 6" strokeWidth="2"/>
    </svg>
  );

  const IconDownload = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  const showToastMessage = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Fetch with timeout and auth
  const fetchWithTimeout = async (url, options = {}, timeout = API_TIMEOUT) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // Fetch Annual Reports
  const fetchAnnualReports = async () => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.reportsAnnual);
      const data = await response.json();
      
      if (response.ok) {
        let mappedReports = [];
        if (data.success && data.reports) {
          mappedReports = data.reports.map(report => ({
            id: report.id,
            year: report.year,
            title: report.title,
            description: report.description,
            file_size: report.fileSize || report.file_size || '',
            page_count: report.pageCount || report.page_count || 0,
            download_url: report.downloadUrl || report.download_url || ''
          }));
        } else if (Array.isArray(data)) {
          mappedReports = data.map(report => ({
            id: report.id,
            year: report.year,
            title: report.title,
            description: report.description,
            file_size: report.fileSize || report.file_size || '',
            page_count: report.pageCount || report.page_count || 0,
            download_url: report.downloadUrl || report.download_url || ''
          }));
        }
        
        if (mappedReports.length > 0) {
          setAnnualReports(mappedReports);
          // Cache in SQLite
          for (const report of mappedReports) {
            await executeRun(
              `INSERT OR REPLACE INTO reports_annual (id, year, title, description, file_size, page_count, download_url)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [report.id || crypto.randomUUID(), report.year, report.title, report.description, report.file_size, report.page_count, report.download_url]
            );
          }
        } else {
          setAnnualReports([]);
        }
      } else {
        console.error('Failed to fetch annual reports:', data.message);
        throw new Error(data.message || 'Failed response');
      }
    } catch (error) {
      console.warn('Error fetching annual reports, reading from SQLite:', error);
      try {
        const localReports = await executeQuery('SELECT * FROM reports_annual ORDER BY year DESC');
        setAnnualReports(localReports);
      } catch (dbError) {
        console.error('SQLite query failed for annual reports:', dbError);
        setAnnualReports([]);
      }
    }
  };

  // Fetch Quarterly Reports
  const fetchQuarterlyReports = async () => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.reportsQuarterly);
      const data = await response.json();
      
      if (response.ok) {
        let mappedReports = [];
        if (data.success && data.reports) {
          mappedReports = data.reports.map(report => ({
            id: report.id,
            quarter: report.quarter,
            title: report.title,
            period: report.period,
            description: report.description,
            file_size: report.fileSize || report.file_size || '',
            download_url: report.downloadUrl || report.download_url || ''
          }));
        } else if (Array.isArray(data)) {
          mappedReports = data.map(report => ({
            id: report.id,
            quarter: report.quarter,
            title: report.title,
            period: report.period,
            description: report.description,
            file_size: report.fileSize || report.file_size || '',
            download_url: report.downloadUrl || report.download_url || ''
          }));
        }
        
        if (mappedReports.length > 0) {
          setQuarterlyReports(mappedReports);
          // Cache in SQLite
          for (const report of mappedReports) {
            await executeRun(
              `INSERT OR REPLACE INTO reports_quarterly (id, quarter, title, period, description, file_size, download_url)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [report.id || crypto.randomUUID(), report.quarter, report.title, report.period, report.description, report.file_size, report.download_url]
            );
          }
        } else {
          setQuarterlyReports([]);
        }
      } else {
        console.error('Failed to fetch quarterly reports:', data.message);
        throw new Error(data.message || 'Failed response');
      }
    } catch (error) {
      console.warn('Error fetching quarterly reports, reading from SQLite:', error);
      try {
        const localReports = await executeQuery('SELECT * FROM reports_quarterly ORDER BY quarter DESC');
        setQuarterlyReports(localReports);
      } catch (dbError) {
        console.error('SQLite query failed for quarterly reports:', dbError);
        setQuarterlyReports([]);
      }
    }
  };

  // Fetch Success Stories
  const fetchSuccessStories = async () => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.reportsSuccessStories);
      const data = await response.json();
      
      if (response.ok) {
        let mappedStories = [];
        if (data.success && data.stories) {
          mappedStories = data.stories;
        } else if (Array.isArray(data)) {
          mappedStories = data;
        }
        
        if (mappedStories.length > 0) {
          setSuccessStories(mappedStories);
          // Cache in SQLite
          for (const story of mappedStories) {
            await executeRun(
              `INSERT OR REPLACE INTO reports_success_stories (id, title, description, impact, date, category)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [story.id, story.title, story.description, story.impact, story.date, story.category]
            );
          }
        } else {
          setSuccessStories([]);
        }
      } else {
        console.error('Failed to fetch success stories:', data.message);
        throw new Error(data.message || 'Failed response');
      }
    } catch (error) {
      console.warn('Error fetching success stories, reading from SQLite:', error);
      try {
        const localStories = await executeQuery('SELECT * FROM reports_success_stories ORDER BY date DESC');
        setSuccessStories(localStories);
      } catch (dbError) {
        console.error('SQLite query failed for success stories:', dbError);
        setSuccessStories([]);
      }
    }
  };

  // Fetch Impact Metrics
  const fetchImpactMetrics = async () => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.reportsMetrics);
      const data = await response.json();
      
      if (response.ok) {
        let mappedMetrics = [];
        if (data.success && data.metrics) {
          mappedMetrics = data.metrics;
        } else if (Array.isArray(data)) {
          mappedMetrics = data;
        }
        
        if (mappedMetrics.length > 0) {
          setImpactMetrics(mappedMetrics);
          // Cache in SQLite
          for (const metric of mappedMetrics) {
            const q1Val = metric.q1Value !== undefined ? metric.q1Value : (metric.q1_value || 0);
            const q2Val = metric.q2Value !== undefined ? metric.q2Value : (metric.q2_value || 0);
            const q3Val = metric.q3Value !== undefined ? metric.q3Value : (metric.q3_value || 0);
            const q4Val = metric.q4Value !== undefined ? metric.q4Value : (metric.q4_value || 0);
            const colorVal = metric.color || '#0066cc';
            const yearVal = metric.year || new Date().getFullYear();
            
            await executeRun(
              `INSERT OR REPLACE INTO reports_impact_metrics (id, label, q1_value, q2_value, q3_value, q4_value, color, year)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [metric.id, metric.label, q1Val, q2Val, q3Val, q4Val, colorVal, yearVal]
            );
          }
        } else {
          setImpactMetrics([]);
        }
      } else {
        console.error('Failed to fetch impact metrics:', data.message);
        throw new Error(data.message || 'Failed response');
      }
    } catch (error) {
      console.warn('Error fetching impact metrics, reading from SQLite:', error);
      try {
        const localMetrics = await executeQuery('SELECT * FROM reports_impact_metrics ORDER BY label ASC');
        const mappedLocalMetrics = localMetrics.map(metric => ({
          id: metric.id,
          label: metric.label,
          q1Value: metric.q1_value,
          q2Value: metric.q2_value,
          q3Value: metric.q3_value,
          q4Value: metric.q4_value,
          color: metric.color,
          year: metric.year
        }));
        setImpactMetrics(mappedLocalMetrics);
      } catch (dbError) {
        console.error('SQLite query failed for impact metrics:', dbError);
        setImpactMetrics([]);
      }
    }
  };

  // Create Annual Report
  const createAnnualReport = async () => {
    const reportId = crypto.randomUUID();
    const payload = {
      id: reportId,
      year: parseInt(annualFormData.year),
      title: annualFormData.title,
      description: annualFormData.description,
      fileSize: annualFormData.fileSize,
      pageCount: parseInt(annualFormData.pageCount),
      downloadUrl: annualFormData.downloadUrl
    };
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.reportsAnnual, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMessage('Annual report created successfully');
      } else {
        throw new Error(data.message || 'Failed to create report online');
      }
    } catch (error) {
      console.warn('Error creating annual report online, saving locally:', error);
      showToastMessage('Saved to local storage (Offline)', 'warning');
    } finally {
      // Mirror to SQLite
      try {
        await executeRun(
          `INSERT OR REPLACE INTO reports_annual (id, year, title, description, file_size, page_count, download_url)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [payload.id, payload.year, payload.title, payload.description, payload.fileSize, payload.pageCount, payload.downloadUrl]
        );
      } catch (dbErr) {
        console.error('Failed to mirror to SQLite:', dbErr);
      }
      fetchAnnualReports();
      setActivePage('annual');
      resetAnnualForm();
    }
  };

  // Update Annual Report
  const updateAnnualReport = async () => {
    const payload = {
      year: parseInt(annualFormData.year),
      title: annualFormData.title,
      description: annualFormData.description,
      fileSize: annualFormData.fileSize,
      pageCount: parseInt(annualFormData.pageCount),
      downloadUrl: annualFormData.downloadUrl
    };
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.reportsAnnualId(editingAnnual.id), {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMessage('Annual report updated successfully');
      } else {
        throw new Error(data.message || 'Failed to update report online');
      }
    } catch (error) {
      console.warn('Error updating annual report online, saving locally:', error);
      showToastMessage('Updated in local storage (Offline)', 'warning');
    } finally {
      // Mirror to SQLite
      try {
        await executeRun(
          `INSERT OR REPLACE INTO reports_annual (id, year, title, description, file_size, page_count, download_url)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [editingAnnual.id, payload.year, payload.title, payload.description, payload.fileSize, payload.pageCount, payload.downloadUrl]
        );
      } catch (dbErr) {
        console.error('Failed to mirror to SQLite:', dbErr);
      }
      fetchAnnualReports();
      setActivePage('annual');
      setEditingAnnual(null);
      resetAnnualForm();
    }
  };

  // Delete Annual Report
  const deleteAnnualReport = async (id, year) => {
    if (!window.confirm(`Delete annual report for ${year}?`)) return;
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.reportsAnnualId(id), {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMessage('Annual report deleted successfully');
      } else {
        throw new Error(data.message || 'Failed to delete report online');
      }
    } catch (error) {
      console.warn('Error deleting annual report online, removing locally:', error);
      showToastMessage('Deleted from local storage (Offline)', 'warning');
    } finally {
      // Mirror to SQLite
      try {
        await executeRun('DELETE FROM reports_annual WHERE id = ?', [id]);
      } catch (dbErr) {
        console.error('Failed to delete in SQLite:', dbErr);
      }
      fetchAnnualReports();
    }
  };

  // Create Quarterly Report
  const createQuarterlyReport = async () => {
    const reportId = crypto.randomUUID();
    const payload = {
      id: reportId,
      quarter: quarterlyFormData.quarter,
      title: quarterlyFormData.title,
      period: quarterlyFormData.period,
      description: quarterlyFormData.description,
      fileSize: quarterlyFormData.fileSize,
      downloadUrl: quarterlyFormData.downloadUrl
    };
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.reportsQuarterly, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMessage('Quarterly report created successfully');
      } else {
        throw new Error(data.message || 'Failed to create report online');
      }
    } catch (error) {
      console.warn('Error creating quarterly report online, saving locally:', error);
      showToastMessage('Saved to local storage (Offline)', 'warning');
    } finally {
      // Mirror to SQLite
      try {
        await executeRun(
          `INSERT OR REPLACE INTO reports_quarterly (id, quarter, title, period, description, file_size, download_url)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [payload.id, payload.quarter, payload.title, payload.period, payload.description, payload.fileSize, payload.downloadUrl]
        );
      } catch (dbErr) {
        console.error('Failed to mirror to SQLite:', dbErr);
      }
      fetchQuarterlyReports();
      setActivePage('quarterly');
      resetQuarterlyForm();
    }
  };

  // Update Quarterly Report
  const updateQuarterlyReport = async () => {
    const payload = {
      quarter: quarterlyFormData.quarter,
      title: quarterlyFormData.title,
      period: quarterlyFormData.period,
      description: quarterlyFormData.description,
      fileSize: quarterlyFormData.fileSize,
      downloadUrl: quarterlyFormData.downloadUrl
    };
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.reportsQuarterlyId(editingQuarterly.id), {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMessage('Quarterly report updated successfully');
      } else {
        throw new Error(data.message || 'Failed to update report online');
      }
    } catch (error) {
      console.warn('Error updating quarterly report online, saving locally:', error);
      showToastMessage('Updated in local storage (Offline)', 'warning');
    } finally {
      // Mirror to SQLite
      try {
        await executeRun(
          `INSERT OR REPLACE INTO reports_quarterly (id, quarter, title, period, description, file_size, download_url)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [editingQuarterly.id, payload.quarter, payload.title, payload.period, payload.description, payload.fileSize, payload.downloadUrl]
        );
      } catch (dbErr) {
        console.error('Failed to mirror to SQLite:', dbErr);
      }
      fetchQuarterlyReports();
      setActivePage('quarterly');
      setEditingQuarterly(null);
      resetQuarterlyForm();
    }
  };

  // Delete Quarterly Report
  const deleteQuarterlyReport = async (id, quarter) => {
    if (!window.confirm(`Delete ${quarter} report?`)) return;
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.reportsQuarterlyId(id), {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMessage('Quarterly report deleted successfully');
      } else {
        throw new Error(data.message || 'Failed to delete report online');
      }
    } catch (error) {
      console.warn('Error deleting quarterly report online, removing locally:', error);
      showToastMessage('Deleted from local storage (Offline)', 'warning');
    } finally {
      // Mirror to SQLite
      try {
        await executeRun('DELETE FROM reports_quarterly WHERE id = ?', [id]);
      } catch (dbErr) {
        console.error('Failed to delete in SQLite:', dbErr);
      }
      fetchQuarterlyReports();
    }
  };

  // Create Success Story
  const createSuccessStory = async () => {
    const storyId = crypto.randomUUID();
    const payload = {
      id: storyId,
      title: storyFormData.title,
      description: storyFormData.description,
      impact: storyFormData.impact,
      date: storyFormData.date,
      category: storyFormData.category
    };
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.reportsSuccessStories, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMessage('Success story created successfully');
      } else {
        throw new Error(data.message || 'Failed to create story online');
      }
    } catch (error) {
      console.warn('Error creating success story online, saving locally:', error);
      showToastMessage('Saved to local storage (Offline)', 'warning');
    } finally {
      // Mirror to SQLite
      try {
        await executeRun(
          `INSERT OR REPLACE INTO reports_success_stories (id, title, description, impact, date, category)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [payload.id, payload.title, payload.description, payload.impact, payload.date, payload.category]
        );
      } catch (dbErr) {
        console.error('Failed to mirror to SQLite:', dbErr);
      }
      fetchSuccessStories();
      setActivePage('stories');
      resetStoryForm();
    }
  };

  // Update Success Story
  const updateSuccessStory = async () => {
    const payload = {
      title: storyFormData.title,
      description: storyFormData.description,
      impact: storyFormData.impact,
      date: storyFormData.date,
      category: storyFormData.category
    };
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.reportsSuccessStoriesId(editingStory.id), {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMessage('Success story updated successfully');
      } else {
        throw new Error(data.message || 'Failed to update story online');
      }
    } catch (error) {
      console.warn('Error updating success story online, saving locally:', error);
      showToastMessage('Updated in local storage (Offline)', 'warning');
    } finally {
      // Mirror to SQLite
      try {
        await executeRun(
          `INSERT OR REPLACE INTO reports_success_stories (id, title, description, impact, date, category)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [editingStory.id, payload.title, payload.description, payload.impact, payload.date, payload.category]
        );
      } catch (dbErr) {
        console.error('Failed to mirror to SQLite:', dbErr);
      }
      fetchSuccessStories();
      setActivePage('stories');
      setEditingStory(null);
      resetStoryForm();
    }
  };

  // Delete Success Story
  const deleteSuccessStory = async (id, title) => {
    if (!window.confirm(`Delete story "${title}"?`)) return;
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.reportsSuccessStoriesId(id), {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMessage('Success story deleted successfully');
      } else {
        throw new Error(data.message || 'Failed to delete story online');
      }
    } catch (error) {
      console.warn('Error deleting success story online, removing locally:', error);
      showToastMessage('Deleted from local storage (Offline)', 'warning');
    } finally {
      // Mirror to SQLite
      try {
        await executeRun('DELETE FROM reports_success_stories WHERE id = ?', [id]);
      } catch (dbErr) {
        console.error('Failed to delete in SQLite:', dbErr);
      }
      fetchSuccessStories();
    }
  };

  // Create Impact Metric
  const createImpactMetric = async () => {
    const metricId = crypto.randomUUID();
    const payload = {
      id: metricId,
      label: metricFormData.label,
      q1Value: parseInt(metricFormData.q1Value),
      q2Value: parseInt(metricFormData.q2Value),
      q3Value: parseInt(metricFormData.q3Value),
      q4Value: parseInt(metricFormData.q4Value),
      color: metricFormData.color,
      year: parseInt(metricFormData.year)
    };
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.reportsMetrics, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMessage('Impact metric created successfully');
      } else {
        throw new Error(data.message || 'Failed to create metric online');
      }
    } catch (error) {
      console.warn('Error creating impact metric online, saving locally:', error);
      showToastMessage('Saved to local storage (Offline)', 'warning');
    } finally {
      // Mirror to SQLite
      try {
        await executeRun(
          `INSERT OR REPLACE INTO reports_impact_metrics (id, label, q1_value, q2_value, q3_value, q4_value, color, year)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [payload.id, payload.label, payload.q1Value, payload.q2Value, payload.q3Value, payload.q4Value, payload.color, payload.year]
        );
      } catch (dbErr) {
        console.error('Failed to mirror to SQLite:', dbErr);
      }
      fetchImpactMetrics();
      setActivePage('metrics');
      resetMetricForm();
    }
  };

  // Update Impact Metric
  const updateImpactMetric = async () => {
    const payload = {
      label: metricFormData.label,
      q1Value: parseInt(metricFormData.q1Value),
      q2Value: parseInt(metricFormData.q2Value),
      q3Value: parseInt(metricFormData.q3Value),
      q4Value: parseInt(metricFormData.q4Value),
      color: metricFormData.color,
      year: parseInt(metricFormData.year)
    };
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.reportsMetricsId(editingMetric.id), {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMessage('Impact metric updated successfully');
      } else {
        throw new Error(data.message || 'Failed to update metric online');
      }
    } catch (error) {
      console.warn('Error updating impact metric online, saving locally:', error);
      showToastMessage('Updated in local storage (Offline)', 'warning');
    } finally {
      // Mirror to SQLite
      try {
        await executeRun(
          `INSERT OR REPLACE INTO reports_impact_metrics (id, label, q1_value, q2_value, q3_value, q4_value, color, year)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [editingMetric.id, payload.label, payload.q1Value, payload.q2Value, payload.q3Value, payload.q4Value, payload.color, payload.year]
        );
      } catch (dbErr) {
        console.error('Failed to mirror to SQLite:', dbErr);
      }
      fetchImpactMetrics();
      setActivePage('metrics');
      setEditingMetric(null);
      resetMetricForm();
    }
  };

  // Delete Impact Metric
  const deleteImpactMetric = async (id, label) => {
    if (!window.confirm(`Delete metric "${label}"?`)) return;
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.reportsMetricsId(id), {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToastMessage('Impact metric deleted successfully');
      } else {
        throw new Error(data.message || 'Failed to delete metric online');
      }
    } catch (error) {
      console.warn('Error deleting impact metric online, removing locally:', error);
      showToastMessage('Deleted from local storage (Offline)', 'warning');
    } finally {
      // Mirror to SQLite
      try {
        await executeRun('DELETE FROM reports_impact_metrics WHERE id = ?', [id]);
      } catch (dbErr) {
        console.error('Failed to delete in SQLite:', dbErr);
      }
      fetchImpactMetrics();
    }
  };

  // Reset forms
  const resetAnnualForm = () => {
    setEditingAnnual(null);
    setAnnualFormData({
      id: '',
      year: '',
      title: '',
      description: '',
      fileSize: '',
      pageCount: '',
      downloadUrl: ''
    });
  };

  const resetQuarterlyForm = () => {
    setEditingQuarterly(null);
    setQuarterlyFormData({
      id: '',
      quarter: '',
      title: '',
      period: '',
      description: '',
      fileSize: '',
      downloadUrl: ''
    });
  };

  const resetStoryForm = () => {
    setEditingStory(null);
    setStoryFormData({
      id: '',
      title: '',
      description: '',
      impact: '',
      date: new Date().toISOString().split('T')[0],
      category: 'healthcare'
    });
  };

  const resetMetricForm = () => {
    setEditingMetric(null);
    setMetricFormData({
      id: '',
      label: '',
      q1Value: '',
      q2Value: '',
      q3Value: '',
      q4Value: '',
      color: '#0066cc',
      year: new Date().getFullYear().toString()
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
    
    const loadData = async () => {
      await Promise.all([
        fetchAnnualReports(),
        fetchQuarterlyReports(),
        fetchSuccessStories(),
        fetchImpactMetrics()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, [navigate]);

  // ============================================
  // VIEW PAGES
  // ============================================

  // View Annual Report Page
  const renderAnnualReportView = () => (
    <div className="ra-page">
      <div className="ra-header">
        <button className="ra-back-btn" onClick={() => setActivePage('annual')}>
          <IconBack /> Back to Annual Reports
        </button>
        <div className="ra-header-title">
          <h2>Annual Report Details</h2>
        </div>
      </div>

      {viewingAnnual && (
        <div className="ra-view-container">
          <div className="ra-view-section">
            <div className="ra-view-info-grid">
              <div className="ra-view-info-item">
                <label>Year:</label>
                <span className="ra-year-badge">{viewingAnnual.year}</span>
              </div>
              <div className="ra-view-info-item">
                <label>Title:</label>
                <span>{viewingAnnual.title}</span>
              </div>
              <div className="ra-view-info-item">
                <label>File Size:</label>
                <span>{viewingAnnual.file_size || 'N/A'}</span>
              </div>
              <div className="ra-view-info-item">
                <label>Page Count:</label>
                <span>{viewingAnnual.page_count || 'N/A'} pages</span>
              </div>
              <div className="ra-view-info-item full-width">
                <label>Description:</label>
                <p>{viewingAnnual.description}</p>
              </div>
              {viewingAnnual.download_url && (
                <div className="ra-view-info-item full-width">
                  <label>Download Link:</label>
                  <a href={viewingAnnual.download_url} target="_blank" rel="noopener noreferrer" className="ra-download-link">
                    <IconDownload /> Download Report
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="ra-view-actions">
            <button 
              className="ra-btn ra-btn-primary" 
              onClick={() => {
                setEditingAnnual(viewingAnnual);
                setAnnualFormData({
                  id: viewingAnnual.id,
                  year: viewingAnnual.year,
                  title: viewingAnnual.title,
                  description: viewingAnnual.description,
                  fileSize: viewingAnnual.file_size || '',
                  pageCount: viewingAnnual.page_count || '',
                  downloadUrl: viewingAnnual.download_url || ''
                });
                setActivePage('edit_annual');
              }}
            >
              Edit Report
            </button>
            <button 
              className="ra-btn ra-btn-secondary" 
              onClick={() => setActivePage('annual')}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // View Quarterly Report Page
  const renderQuarterlyReportView = () => (
    <div className="ra-page">
      <div className="ra-header">
        <button className="ra-back-btn" onClick={() => setActivePage('quarterly')}>
          <IconBack /> Back to Quarterly Reports
        </button>
        <div className="ra-header-title">
          <h2>Quarterly Report Details</h2>
        </div>
      </div>

      {viewingQuarterly && (
        <div className="ra-view-container">
          <div className="ra-view-section">
            <div className="ra-view-info-grid">
              <div className="ra-view-info-item">
                <label>Quarter:</label>
                <span className="ra-quarter-badge">{viewingQuarterly.quarter}</span>
              </div>
              <div className="ra-view-info-item">
                <label>Period:</label>
                <span>{viewingQuarterly.period}</span>
              </div>
              <div className="ra-view-info-item">
                <label>Title:</label>
                <span>{viewingQuarterly.title}</span>
              </div>
              <div className="ra-view-info-item">
                <label>File Size:</label>
                <span>{viewingQuarterly.file_size || 'N/A'}</span>
              </div>
              <div className="ra-view-info-item full-width">
                <label>Description:</label>
                <p>{viewingQuarterly.description}</p>
              </div>
              {viewingQuarterly.download_url && (
                <div className="ra-view-info-item full-width">
                  <label>Download Link:</label>
                  <a href={viewingQuarterly.download_url} target="_blank" rel="noopener noreferrer" className="ra-download-link">
                    <IconDownload /> Download Report
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="ra-view-actions">
            <button 
              className="ra-btn ra-btn-primary" 
              onClick={() => {
                setEditingQuarterly(viewingQuarterly);
                setQuarterlyFormData({
                  id: viewingQuarterly.id,
                  quarter: viewingQuarterly.quarter,
                  title: viewingQuarterly.title,
                  period: viewingQuarterly.period,
                  description: viewingQuarterly.description,
                  fileSize: viewingQuarterly.file_size || '',
                  downloadUrl: viewingQuarterly.download_url || ''
                });
                setActivePage('edit_quarterly');
              }}
            >
              Edit Report
            </button>
            <button 
              className="ra-btn ra-btn-secondary" 
              onClick={() => setActivePage('quarterly')}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // View Success Story Page
  const renderSuccessStoryView = () => (
    <div className="ra-page">
      <div className="ra-header">
        <button className="ra-back-btn" onClick={() => setActivePage('stories')}>
          <IconBack /> Back to Success Stories
        </button>
        <div className="ra-header-title">
          <h2>Success Story Details</h2>
        </div>
      </div>

      {viewingStory && (
        <div className="ra-view-container">
          <div className="ra-view-section">
            <div className="ra-view-info-grid">
              <div className="ra-view-info-item">
                <label>Title:</label>
                <span className="ra-story-title">{viewingStory.title}</span>
              </div>
              <div className="ra-view-info-item">
                <label>Category:</label>
                <span className="ra-category-tag">{viewingStory.category}</span>
              </div>
              <div className="ra-view-info-item">
                <label>Date:</label>
                <span>{viewingStory.date}</span>
              </div>
              <div className="ra-view-info-item full-width">
                <label>Description:</label>
                <p>{viewingStory.description}</p>
              </div>
              <div className="ra-view-info-item full-width">
                <label>Impact:</label>
                <div className="ra-impact-box">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>{viewingStory.impact}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ra-view-actions">
            <button 
              className="ra-btn ra-btn-primary" 
              onClick={() => {
                setEditingStory(viewingStory);
                setStoryFormData({
                  id: viewingStory.id,
                  title: viewingStory.title,
                  description: viewingStory.description,
                  impact: viewingStory.impact,
                  date: viewingStory.date,
                  category: viewingStory.category
                });
                setActivePage('edit_story');
              }}
            >
              Edit Story
            </button>
            <button 
              className="ra-btn ra-btn-secondary" 
              onClick={() => setActivePage('stories')}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // View Impact Metric Page
  const renderImpactMetricView = () => (
    <div className="ra-page">
      <div className="ra-header">
        <button className="ra-back-btn" onClick={() => setActivePage('metrics')}>
          <IconBack /> Back to Impact Metrics
        </button>
        <div className="ra-header-title">
          <h2>Impact Metric Details</h2>
        </div>
      </div>

      {viewingMetric && (
        <div className="ra-view-container">
          <div className="ra-view-section">
            <div className="ra-view-info-grid">
              <div className="ra-view-info-item">
                <label>Label:</label>
                <span>{viewingMetric.label}</span>
              </div>
              <div className="ra-view-info-item">
                <label>Year:</label>
                <span>{viewingMetric.year}</span>
              </div>
              <div className="ra-view-info-item">
                <label>Color:</label>
                <span className="ra-color-preview">
                  <span style={{ backgroundColor: viewingMetric.color }}></span>
                  {viewingMetric.color}
                </span>
              </div>
            </div>
          </div>

          <div className="ra-view-section">
            <h3>Quarterly Values</h3>
            <div className="ra-quarters-grid">
              <div className="ra-quarter-card">
                <div className="ra-quarter-label">Q1</div>
                <div className="ra-quarter-value">{viewingMetric.q1Value}</div>
              </div>
              <div className="ra-quarter-card">
                <div className="ra-quarter-label">Q2</div>
                <div className="ra-quarter-value">{viewingMetric.q2Value}</div>
              </div>
              <div className="ra-quarter-card">
                <div className="ra-quarter-label">Q3</div>
                <div className="ra-quarter-value">{viewingMetric.q3Value}</div>
              </div>
              <div className="ra-quarter-card">
                <div className="ra-quarter-label">Q4</div>
                <div className="ra-quarter-value">{viewingMetric.q4Value}</div>
              </div>
            </div>
            
            <div className="ra-total-value">
              <label>Total Yearly Value:</label>
              <span>{(viewingMetric.q1Value + viewingMetric.q2Value + viewingMetric.q3Value + viewingMetric.q4Value).toLocaleString()}</span>
            </div>
          </div>

          <div className="ra-view-actions">
            <button 
              className="ra-btn ra-btn-primary" 
              onClick={() => {
                setEditingMetric(viewingMetric);
                setMetricFormData({
                  id: viewingMetric.id,
                  label: viewingMetric.label,
                  q1Value: viewingMetric.q1Value,
                  q2Value: viewingMetric.q2Value,
                  q3Value: viewingMetric.q3Value,
                  q4Value: viewingMetric.q4Value,
                  color: viewingMetric.color,
                  year: viewingMetric.year
                });
                setActivePage('edit_metric');
              }}
            >
              Edit Metric
            </button>
            <button 
              className="ra-btn ra-btn-secondary" 
              onClick={() => setActivePage('metrics')}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Render Dashboard
  const renderDashboard = () => (
    <div className="ra-page">
      <div className="ra-dashboard-header">
        <h1>Reports Management</h1>
        <p>Manage annual reports, quarterly reports, success stories, and impact metrics</p>
      </div>
      
      <div className="ra-dashboard-links">
        <div className="ra-dash-link" onClick={() => { fetchAnnualReports(); setActivePage('annual'); }}>
          <div className="ra-dash-link-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M8 2V6" strokeWidth="2"/>
              <path d="M16 2V6" strokeWidth="2"/>
              <path d="M3 10H21" strokeWidth="2"/>
            </svg>
          </div>
          <div className="ra-dash-link-info">
            <h3>Annual Reports</h3>
            <p>{annualReports.length} reports</p>
          </div>
        </div>
        
        <div className="ra-dash-link" onClick={() => { fetchQuarterlyReports(); setActivePage('quarterly'); }}>
          <div className="ra-dash-link-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M8 2V6" strokeWidth="2"/>
              <path d="M16 2V6" strokeWidth="2"/>
              <path d="M3 10H21" strokeWidth="2"/>
              <path d="M8 14H16" strokeWidth="2"/>
              <path d="M8 18H12" strokeWidth="2"/>
            </svg>
          </div>
          <div className="ra-dash-link-info">
            <h3>Quarterly Reports</h3>
            <p>{quarterlyReports.length} reports</p>
          </div>
        </div>
        
        <div className="ra-dash-link" onClick={() => { fetchSuccessStories(); setActivePage('stories'); }}>
          <div className="ra-dash-link-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L15 9H22L16 14L19 21L12 17L5 21L8 14L2 9H9L12 2Z"/>
            </svg>
          </div>
          <div className="ra-dash-link-info">
            <h3>Success Stories</h3>
            <p>{successStories.length} stories</p>
          </div>
        </div>
        
        <div className="ra-dash-link" onClick={() => { fetchImpactMetrics(); setActivePage('metrics'); }}>
          <div className="ra-dash-link-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 12H18L15 21L9 3L6 12H3" strokeWidth="2"/>
            </svg>
          </div>
          <div className="ra-dash-link-info">
            <h3>Impact Metrics</h3>
            <p>{impactMetrics.length} metrics</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Annual Reports List with View Button
  const renderAnnualReports = () => (
    <div className="ra-page">
      <div className="ra-header">
        <button className="ra-back-btn" onClick={() => setActivePage('list')}>
          <IconBack /> Back
        </button>
        <div className="ra-header-title">
          <h2>Annual Reports</h2>
          <button className="ra-add-btn" onClick={() => { resetAnnualForm(); setActivePage('add_annual'); }}>
            <IconAdd /> Add Report
          </button>
        </div>
      </div>
      
      <div className="ra-table-wrapper">
        <table className="ra-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Title</th>
              <th>Description</th>
              <th>Size</th>
              <th>Pages</th>
              <th width="140">Actions</th>
            </tr>
          </thead>
          <tbody>
            {annualReports.map((report) => (
              <tr key={report.id}>
                <td><strong>{report.year}</strong></td>
                <td>{report.title}</td>
                <td className="ra-desc-cell">{report.description}</td>
                <td>{report.file_size || '-'}</td>
                <td>{report.page_count || '-'}</td>
                <td>
                  <div className="ra-action-buttons">
                    <button className="ra-action-btn ra-view" onClick={() => {
                      setViewingAnnual(report);
                      setActivePage('view_annual');
                    }}>
                      <IconView /> View
                    </button>
                    <button className="ra-action-btn ra-edit" onClick={() => {
                      setEditingAnnual(report);
                      setAnnualFormData({
                        id: report.id,
                        year: report.year,
                        title: report.title,
                        description: report.description,
                        fileSize: report.file_size || '',
                        pageCount: report.page_count || '',
                        downloadUrl: report.download_url || ''
                      });
                      setActivePage('edit_annual');
                    }}>
                      <IconEdit /> Edit
                    </button>
                    <button className="ra-action-btn ra-delete" onClick={() => deleteAnnualReport(report.id, report.year)}>
                      <IconDelete /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {annualReports.length === 0 && (
              <tr><td colSpan="6" className="ra-empty">No annual reports found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Quarterly Reports List with View Button
  const renderQuarterlyReports = () => (
    <div className="ra-page">
      <div className="ra-header">
        <button className="ra-back-btn" onClick={() => setActivePage('list')}>
          <IconBack /> Back 
        </button>
        <div className="ra-header-title">
          <h2>Quarterly Reports</h2>
          <button className="ra-add-btn" onClick={() => { resetQuarterlyForm(); setActivePage('add_quarterly'); }}>
            <IconAdd /> Add Report
          </button>
        </div>
      </div>
      
      <div className="ra-table-wrapper">
        <table className="ra-table">
          <thead>
            <tr>
              <th>Quarter</th>
              <th>Title</th>
              <th>Period</th>
              <th>Description</th>
              <th>Size</th>
              <th width="140">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quarterlyReports.map((report) => (
              <tr key={report.id}>
                <td><strong>{report.quarter}</strong></td>
                <td>{report.title}</td>
                <td>{report.period}</td>
                <td className="ra-desc-cell">{report.description}</td>
                <td>{report.file_size || '-'}</td>
                <td>
                  <div className="ra-action-buttons">
                    <button className="ra-action-btn ra-view" onClick={() => {
                      setViewingQuarterly(report);
                      setActivePage('view_quarterly');
                    }}>
                      <IconView /> View
                    </button>
                    <button className="ra-action-btn ra-edit" onClick={() => {
                      setEditingQuarterly(report);
                      setQuarterlyFormData({
                        id: report.id,
                        quarter: report.quarter,
                        title: report.title,
                        period: report.period,
                        description: report.description,
                        fileSize: report.file_size || '',
                        downloadUrl: report.download_url || ''
                      });
                      setActivePage('edit_quarterly');
                    }}>
                      <IconEdit /> Edit
                    </button>
                    <button className="ra-action-btn ra-delete" onClick={() => deleteQuarterlyReport(report.id, report.quarter)}>
                      <IconDelete /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {quarterlyReports.length === 0 && (
              <tr><td colSpan="6" className="ra-empty">No quarterly reports found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Success Stories List with View Button
  const renderSuccessStories = () => (
    <div className="ra-page">
      <div className="ra-header">
        <button className="ra-back-btn" onClick={() => setActivePage('list')}>
          <IconBack /> Back
        </button>
        <div className="ra-header-title">
          <h2>Success Stories</h2>
          <button className="ra-add-btn" onClick={() => { resetStoryForm(); setActivePage('add_story'); }}>
            <IconAdd /> Add Story
          </button>
        </div>
      </div>
      
      <div className="ra-table-wrapper">
        <table className="ra-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Impact</th>
              <th>Category</th>
              <th>Date</th>
              <th width="140">Actions</th>
            </tr>
          </thead>
          <tbody>
            {successStories.map((story) => (
              <tr key={story.id}>
                <td><strong>{story.title}</strong></td>
                <td className="ra-desc-cell">{story.description}</td>
                <td>{story.impact}</td>
                <td><span className="ra-category-tag">{story.category}</span></td>
                <td>{story.date}</td>
                <td>
                  <div className="ra-action-buttons">
                    <button className="ra-action-btn ra-view" onClick={() => {
                      setViewingStory(story);
                      setActivePage('view_story');
                    }}>
                      <IconView /> View
                    </button>
                    <button className="ra-action-btn ra-edit" onClick={() => {
                      setEditingStory(story);
                      setStoryFormData({
                        id: story.id,
                        title: story.title,
                        description: story.description,
                        impact: story.impact,
                        date: story.date,
                        category: story.category
                      });
                      setActivePage('edit_story');
                    }}>
                      <IconEdit /> Edit
                    </button>
                    <button className="ra-action-btn ra-delete" onClick={() => deleteSuccessStory(story.id, story.title)}>
                      <IconDelete /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {successStories.length === 0 && (
              <tr><td colSpan="6" className="ra-empty">No success stories found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Impact Metrics List with View Button
  const renderImpactMetrics = () => (
    <div className="ra-page">
      <div className="ra-header">
        <button className="ra-back-btn" onClick={() => setActivePage('list')}>
          <IconBack /> Back
        </button>
        <div className="ra-header-title">
          <h2>Impact Metrics</h2>
          <button className="ra-add-btn" onClick={() => { resetMetricForm(); setActivePage('add_metric'); }}>
            <IconAdd /> Add Metric
          </button>
        </div>
      </div>
      
      <div className="ra-table-wrapper">
        <table className="ra-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Year</th>
              <th>Q1</th>
              <th>Q2</th>
              <th>Q3</th>
              <th>Q4</th>
              <th>Color</th>
              <th width="140">Actions</th>
            </tr>
          </thead>
          <tbody>
            {impactMetrics.map((metric) => (
              <tr key={metric.id}>
                <td><strong>{metric.label}</strong></td>
                <td>{metric.year}</td>
                <td>{metric.q1Value}</td>
                <td>{metric.q2Value}</td>
                <td>{metric.q3Value}</td>
                <td>{metric.q4Value}</td>
                <td><span className="ra-color-preview">
                  <span style={{ backgroundColor: metric.color }}></span>
                </span></td>
                <td>
                  <div className="ra-action-buttons">
                    <button className="ra-action-btn ra-view" onClick={() => {
                      setViewingMetric(metric);
                      setActivePage('view_metric');
                    }}>
                      <IconView /> View
                    </button>
                    <button className="ra-action-btn ra-edit" onClick={() => {
                      setEditingMetric(metric);
                      setMetricFormData({
                        id: metric.id,
                        label: metric.label,
                        q1Value: metric.q1Value,
                        q2Value: metric.q2Value,
                        q3Value: metric.q3Value,
                        q4Value: metric.q4Value,
                        color: metric.color,
                        year: metric.year
                      });
                      setActivePage('edit_metric');
                    }}>
                      <IconEdit /> Edit
                    </button>
                    <button className="ra-action-btn ra-delete" onClick={() => deleteImpactMetric(metric.id, metric.label)}>
                      <IconDelete /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {impactMetrics.length === 0 && (
              <tr><td colSpan="8" className="ra-empty">No impact metrics found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Annual Report Form
  const renderAnnualForm = () => (
    <div className="ra-page-full">
      <div className="ra-header">
        <button className="ra-back-btn" onClick={() => { setActivePage('annual'); resetAnnualForm(); }}>
          <IconBack /> Back to Annual Reports
        </button>
        <h2>{editingAnnual ? 'Edit Annual Report' : 'Add Annual Report'}</h2>
      </div>
      
      <div className="ra-form-full">
        <form onSubmit={(e) => { e.preventDefault(); editingAnnual ? updateAnnualReport() : createAnnualReport(); }} className="ra-form">
          <div className="ra-form-row">
            <div className="ra-form-group">
              <label>Year *</label>
              <input type="number" value={annualFormData.year} onChange={(e) => setAnnualFormData({...annualFormData, year: e.target.value})} required placeholder="2024" />
            </div>
            
            <div className="ra-form-group">
              <label>File Size *</label>
              <input type="text" value={annualFormData.fileSize} onChange={(e) => setAnnualFormData({...annualFormData, fileSize: e.target.value})} required placeholder="e.g., 2.4 MB" />
            </div>
            
            <div className="ra-form-group">
              <label>Page Count *</label>
              <input type="number" value={annualFormData.pageCount} onChange={(e) => setAnnualFormData({...annualFormData, pageCount: e.target.value})} required placeholder="24" />
            </div>
          </div>
          
          <div className="ra-form-row">
            <div className="ra-form-group">
              <label>Title *</label>
              <input type="text" value={annualFormData.title} onChange={(e) => setAnnualFormData({...annualFormData, title: e.target.value})} required />
            </div>
          </div>
          
          <div className="ra-form-row">
            <div className="ra-form-group">
              <label>Description *</label>
              <textarea value={annualFormData.description} onChange={(e) => setAnnualFormData({...annualFormData, description: e.target.value})} required rows="3" />
            </div>
          </div>
          
          <div className="ra-form-row">
            <div className="ra-form-group">
              <label>Download URL *</label>
              <input type="url" value={annualFormData.downloadUrl} onChange={(e) => setAnnualFormData({...annualFormData, downloadUrl: e.target.value})} required placeholder="https://..." />
            </div>
          </div>
          
          <div className="ra-buttons">
            <button type="button" className="ra-btn ra-btn-secondary" onClick={() => { setActivePage('annual'); resetAnnualForm(); }}>Cancel</button>
            <button type="submit" className="ra-btn ra-btn-primary">{editingAnnual ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );

  // Render Quarterly Report Form
  const renderQuarterlyForm = () => (
    <div className="ra-page-full">
      <div className="ra-header">
        <button className="ra-back-btn" onClick={() => { setActivePage('quarterly'); resetQuarterlyForm(); }}>
          <IconBack /> Back to Quarterly Reports
        </button>
        <h2>{editingQuarterly ? 'Edit Quarterly Report' : 'Add Quarterly Report'}</h2>
      </div>
      
      <div className="ra-form-full">
        <form onSubmit={(e) => { e.preventDefault(); editingQuarterly ? updateQuarterlyReport() : createQuarterlyReport(); }} className="ra-form">
          <div className="ra-form-row">
            <div className="ra-form-group">
              <label>Quarter *</label>
              <input type="text" value={quarterlyFormData.quarter} onChange={(e) => setQuarterlyFormData({...quarterlyFormData, quarter: e.target.value})} required placeholder="e.g., Q1 2024" />
            </div>
            
            <div className="ra-form-group">
              <label>Period *</label>
              <input type="text" value={quarterlyFormData.period} onChange={(e) => setQuarterlyFormData({...quarterlyFormData, period: e.target.value})} required placeholder="e.g., January - March 2024" />
            </div>
            
            <div className="ra-form-group">
              <label>File Size *</label>
              <input type="text" value={quarterlyFormData.fileSize} onChange={(e) => setQuarterlyFormData({...quarterlyFormData, fileSize: e.target.value})} required placeholder="e.g., 1.2 MB" />
            </div>
          </div>
          
          <div className="ra-form-row">
            <div className="ra-form-group">
              <label>Title *</label>
              <input type="text" value={quarterlyFormData.title} onChange={(e) => setQuarterlyFormData({...quarterlyFormData, title: e.target.value})} required />
            </div>
          </div>
          
          <div className="ra-form-row">
            <div className="ra-form-group">
              <label>Description *</label>
              <textarea value={quarterlyFormData.description} onChange={(e) => setQuarterlyFormData({...quarterlyFormData, description: e.target.value})} required rows="3" />
            </div>
          </div>
          
          <div className="ra-form-row">
            <div className="ra-form-group">
              <label>Download URL *</label>
              <input type="url" value={quarterlyFormData.downloadUrl} onChange={(e) => setQuarterlyFormData({...quarterlyFormData, downloadUrl: e.target.value})} required placeholder="https://..." />
            </div>
          </div>
          
          <div className="ra-buttons">
            <button type="button" className="ra-btn ra-btn-secondary" onClick={() => { setActivePage('quarterly'); resetQuarterlyForm(); }}>Cancel</button>
            <button type="submit" className="ra-btn ra-btn-primary">{editingQuarterly ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );

  // Render Success Story Form
  const renderStoryForm = () => (
    <div className="ra-page-full">
      <div className="ra-header">
        <button className="ra-back-btn" onClick={() => { setActivePage('stories'); resetStoryForm(); }}>
          <IconBack /> Back to Stories
        </button>
        <h2>{editingStory ? 'Edit Success Story' : 'Add Success Story'}</h2>
      </div>
      
      <div className="ra-form-full">
        <form onSubmit={(e) => { e.preventDefault(); editingStory ? updateSuccessStory() : createSuccessStory(); }} className="ra-form">
          <div className="ra-form-row">
            <div className="ra-form-group">
              <label>Title *</label>
              <input type="text" value={storyFormData.title} onChange={(e) => setStoryFormData({...storyFormData, title: e.target.value})} required />
            </div>
            
            <div className="ra-form-group">
              <label>Category *</label>
              <select value={storyFormData.category} onChange={(e) => setStoryFormData({...storyFormData, category: e.target.value})} required>
                <option value="education">Education</option>
                <option value="healthcare">Healthcare</option>
                <option value="social">Social</option>
                <option value="nutrition">Nutrition</option>
              </select>
            </div>
            
            <div className="ra-form-group">
              <label>Date *</label>
              <input type="date" value={storyFormData.date} onChange={(e) => setStoryFormData({...storyFormData, date: e.target.value})} required />
            </div>
          </div>
          
          <div className="ra-form-row">
            <div className="ra-form-group">
              <label>Description *</label>
              <textarea value={storyFormData.description} onChange={(e) => setStoryFormData({...storyFormData, description: e.target.value})} required rows="3" />
            </div>
          </div>
          
          <div className="ra-form-row">
            <div className="ra-form-group">
              <label>Impact *</label>
              <textarea value={storyFormData.impact} onChange={(e) => setStoryFormData({...storyFormData, impact: e.target.value})} required rows="2" placeholder="e.g., Reintegrated into school, Received medical care, etc." />
            </div>
          </div>
          
          <div className="ra-buttons">
            <button type="button" className="ra-btn ra-btn-secondary" onClick={() => { setActivePage('stories'); resetStoryForm(); }}>Cancel</button>
            <button type="submit" className="ra-btn ra-btn-primary">{editingStory ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );

  // Render Impact Metric Form
  const renderMetricForm = () => (
    <div className="ra-page-full">
      <div className="ra-header">
        <button className="ra-back-btn" onClick={() => { setActivePage('metrics'); resetMetricForm(); }}>
          <IconBack /> Back to Metrics
        </button>
        <h2>{editingMetric ? 'Edit Impact Metric' : 'Add Impact Metric'}</h2>
      </div>
      
      <div className="ra-form-full">
        <form onSubmit={(e) => { e.preventDefault(); editingMetric ? updateImpactMetric() : createImpactMetric(); }} className="ra-form">
          <div className="ra-form-row">
            <div className="ra-form-group">
              <label>Label *</label>
              <input type="text" value={metricFormData.label} onChange={(e) => setMetricFormData({...metricFormData, label: e.target.value})} required placeholder="e.g., Children Served" />
            </div>
            
            <div className="ra-form-group">
              <label>Year *</label>
              <input type="number" value={metricFormData.year} onChange={(e) => setMetricFormData({...metricFormData, year: e.target.value})} required />
            </div>
            
            <div className="ra-form-group">
              <label>Color *</label>
              <input type="color" value={metricFormData.color} onChange={(e) => setMetricFormData({...metricFormData, color: e.target.value})} required />
            </div>
          </div>
          
          <div className="ra-form-row">
            <div className="ra-form-group">
              <label>Q1 Value *</label>
              <input type="number" value={metricFormData.q1Value} onChange={(e) => setMetricFormData({...metricFormData, q1Value: e.target.value})} required />
            </div>
            
            <div className="ra-form-group">
              <label>Q2 Value *</label>
              <input type="number" value={metricFormData.q2Value} onChange={(e) => setMetricFormData({...metricFormData, q2Value: e.target.value})} required />
            </div>
            
            <div className="ra-form-group">
              <label>Q3 Value *</label>
              <input type="number" value={metricFormData.q3Value} onChange={(e) => setMetricFormData({...metricFormData, q3Value: e.target.value})} required />
            </div>
            
            <div className="ra-form-group">
              <label>Q4 Value *</label>
              <input type="number" value={metricFormData.q4Value} onChange={(e) => setMetricFormData({...metricFormData, q4Value: e.target.value})} required />
            </div>
          </div>
          
          <div className="ra-buttons">
            <button type="button" className="ra-btn ra-btn-secondary" onClick={() => { setActivePage('metrics'); resetMetricForm(); }}>Cancel</button>
            <button type="submit" className="ra-btn ra-btn-primary">{editingMetric ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="ra-loading">
        <div className="ra-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="reports-admin">
        {toast.show && (
          <div className={`ra-toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
          </div>
        )}

        {activePage === 'list' && renderDashboard()}
        {activePage === 'annual' && renderAnnualReports()}
        {activePage === 'view_annual' && renderAnnualReportView()}
        {activePage === 'add_annual' && renderAnnualForm()}
        {activePage === 'edit_annual' && renderAnnualForm()}
        {activePage === 'quarterly' && renderQuarterlyReports()}
        {activePage === 'view_quarterly' && renderQuarterlyReportView()}
        {activePage === 'add_quarterly' && renderQuarterlyForm()}
        {activePage === 'edit_quarterly' && renderQuarterlyForm()}
        {activePage === 'stories' && renderSuccessStories()}
        {activePage === 'view_story' && renderSuccessStoryView()}
        {activePage === 'add_story' && renderStoryForm()}
        {activePage === 'edit_story' && renderStoryForm()}
        {activePage === 'metrics' && renderImpactMetrics()}
        {activePage === 'view_metric' && renderImpactMetricView()}
        {activePage === 'add_metric' && renderMetricForm()}
        {activePage === 'edit_metric' && renderMetricForm()}
      </div>
    </Layout>
  );
};

export default ReportsAdmin;