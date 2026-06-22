import React, { useState, useEffect, useRef } from 'react';

const RenderListPage = ({
  user,
  childrenData,
  todayData,
  fingerprintData,
  youngPatients,
  olderPatients,
  offlineMode,
  isSyncing,
  isLoading,
  refreshing,
  lastRefreshed,
  handleManualRefresh,
  handleStatClick,
  handleActionClick,
  handleAddRegistrationClick,
  handleVerifyFingerprintClick,
  handleSyncOfflineData,
  navigateToPage,
  getUserDisplayName,
  syncStatus,
  lastSyncTime,
  pendingSyncCount
}) => {
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const syncTimerRef = useRef(null);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  // ===== AUTO-SYNC EVERY 5 SECONDS =====
  useEffect(() => {
    if (autoSyncEnabled && !offlineMode) {
      // Clear any existing timer
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }

      // Start sync timer - runs every 5 seconds
      syncTimerRef.current = setInterval(() => {
        // Don't sync if already syncing, loading, auto-syncing, or refreshing
        if (!isSyncing && !isLoading && !isAutoSyncing && !refreshing) {
          setIsAutoSyncing(true);
          // Silent sync - no toast messages
          handleSyncOfflineData(true);
          setTimeout(() => {
            setIsAutoSyncing(false);
          }, 1000);
        }
      }, 5000); // 5 seconds

      return () => {
        if (syncTimerRef.current) {
          clearInterval(syncTimerRef.current);
        }
      };
    }
  }, [autoSyncEnabled, offlineMode, isSyncing, isLoading, refreshing]);

  // ===== TOGGLE AUTO-SYNC =====
  const toggleAutoSync = () => {
    setAutoSyncEnabled(prev => !prev);
  };

  // ===== MANUAL SYNC =====
  const handleManualSync = () => {
    if (!isSyncing && !isLoading && !refreshing) {
      handleSyncOfflineData(false); // Show toast for manual sync
    }
  };

  // ===== GET STATUS DISPLAY =====
  const getStatusDisplay = () => {
    // Check if auto-refresh is happening
    if (refreshing) {
      return (
        <span className="child-reg-sync-status-text refreshing">
          <span className="child-reg-sync-dot-small refreshing"></span>
          Refreshing data...
        </span>
      );
    }
    // Check if auto-sync is happening
    if (isSyncing || isAutoSyncing) {
      return (
        <span className="child-reg-sync-status-text syncing">
          <span className="child-reg-sync-dot-small"></span>
          Syncing...
        </span>
      );
    }
    // Check if there are pending items to sync
    if (pendingSyncCount > 0) {
      return (
        <span className="child-reg-sync-status-text pending">
          <span className="child-reg-sync-dot-small warning"></span>
          {pendingSyncCount} pending
        </span>
      );
    }
    // All good - everything is synced
    return (
      <span className="child-reg-sync-status-text active">
        <span className="child-reg-sync-dot-small"></span>
        All synced
      </span>
    );
  };

  // ===== FORMAT LAST REFRESHED TIME =====
  const getLastRefreshedText = () => {
    if (!lastRefreshed) return null;
    const date = new Date(lastRefreshed);
    return `Data updated: ${date.toLocaleTimeString()}`;
  };

  // ===== FORMAT LAST SYNC TIME =====
  const getLastSyncText = () => {
    if (!lastSyncTime) return null;
    const date = new Date(lastSyncTime);
    return `Last sync: ${date.toLocaleTimeString()}`;
  };

  // ===== GET AUTO-SYNC LABEL =====
  const getAutoSyncLabel = () => {
    return autoSyncEnabled ? 'Auto' : 'Paused';
  };

  return (
    <div className="child-reg-page-content">
      <div className="child-reg-page-header">
        <div className="child-reg-header-left">
          <h1 className="child-reg-page-title">Patient Registration</h1>
          <p className="child-reg-page-subtitle">Register new Patient and capture fingerprint data</p>
        </div>
        <div className="child-reg-header-right">
          {/* Refresh Button with Indicator */}
          <div className="child-reg-refresh-section">
            <div className="child-reg-refresh-indicator">
              {refreshing ? (
                <span className="child-reg-refreshing">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="child-reg-spinning">
                    <path d="M12 2v4M12 22v-4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M22 12h-4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Refreshing...
                </span>
              ) : lastRefreshed ? (
                <span className="child-reg-last-refreshed">
                  {getLastRefreshedText()}
                </span>
              ) : null}
            </div>
            <button 
              className="child-reg-refresh-btn" 
              onClick={handleManualRefresh} 
              disabled={refreshing || isLoading || isSyncing}
              title="Refresh data"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6"/>
                <path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
                <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
              </svg>
              Refresh
            </button>
          </div>
          {user && (
            <div className="child-reg-user-info">
              <span>Logged in as: <strong>{getUserDisplayName(user)}</strong> ({user.role || 'Staff'})</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="child-reg-stats-grid">
        <div className="child-reg-stat-card" onClick={() => !isLoading && handleStatClick('childrenList', 'All Children')} style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}>
          <div className="child-reg-stat-info-wrapper">
            <div className="child-reg-stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4"/>
                <path d="M5.5 20V19C5.5 16.8 7.3 15 9.5 15H14.5C16.7 15 18.5 16.8 18.5 19V20"/>
              </svg>
            </div>
            <div className="child-reg-stat-info">
              <h3>{Array.isArray(childrenData) ? childrenData.length : 0}</h3>
              <p>Total Patients</p>
            </div>
          </div>
        </div>
        <div className="child-reg-stat-card" onClick={() => !isLoading && handleStatClick('todayList', 'Today\'s Registrations')} style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}>
          <div className="child-reg-stat-info-wrapper">
            <div className="child-reg-stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"/>
                <path d="M14 2V8H20"/>
              </svg>
            </div>
            <div className="child-reg-stat-info">
              <h3>{Array.isArray(todayData) ? todayData.length : 0}</h3>
              <p>Registered Today</p>
            </div>
          </div>
        </div>
        <div className="child-reg-stat-card" onClick={() => !isLoading && handleStatClick('fingerprintsList', 'Fingerprints Captured')} style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}>
          <div className="child-reg-stat-info-wrapper">
            <div className="child-reg-stat-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/>
                <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"/>
              </svg>
            </div>
            <div className="child-reg-stat-info">
              <h3>{Array.isArray(fingerprintData) ? fingerprintData.length : 0}</h3>
              <p>Fingerprints Captured</p>
            </div>
          </div>
        </div>
      </div>

      <div className="child-reg-section-title">Patients by Age Group</div>
      <div className="child-reg-age-categories-grid">
        <div className="child-reg-age-category-card young-card" onClick={() => !isLoading && handleStatClick('youngPatients', 'Young Patients')} style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}>
          <div className="child-reg-category-icon young-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4"/>
              <path d="M5.5 20V19C5.5 16.8 7.3 15 9.5 15H14.5C16.7 15 18.5 16.8 18.5 19V20"/>
            </svg>
          </div>
          <div className="child-reg-category-info">
            <h3>{youngPatients.length}</h3>
            <p>Young Patients</p>
            <small>Age &lt; 18 years</small>
          </div>
        </div>
        
        <div className="child-reg-age-category-card older-card" onClick={() => !isLoading && handleStatClick('olderPatients', 'Older Patients')} style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}>
          <div className="child-reg-category-icon older-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
              <path d="M17 3.5a4 4 0 0 1 0 7"/>
            </svg>
          </div>
          <div className="child-reg-category-info">
            <h3>{olderPatients.length}</h3>
            <p>Older Patients</p>
            <small>Age ≥ 18 years</small>
          </div>
        </div>
      </div>

      {/* Sync Status with Auto-Sync Every 5 Seconds */}
      <div className="child-reg-sync-status-mini">
        <div className="child-reg-sync-status-left">
          {getStatusDisplay()}
          {lastSyncTime && (
            <span className="child-reg-sync-time">
              {getLastSyncText()}
            </span>
          )}
          {lastRefreshed && (
            <span className="child-reg-sync-time child-reg-refresh-time">
              • {getLastRefreshedText()}
            </span>
          )}
        </div>
        <div className="child-reg-sync-status-right">
          <button 
            className="child-reg-sync-toggle-mini"
            onClick={toggleAutoSync}
            title={autoSyncEnabled ? 'Auto-sync is ON (every 5s) - Click to pause' : 'Auto-sync is OFF - Click to resume'}
          >
            <span className={`child-reg-sync-toggle-dot ${autoSyncEnabled ? 'on' : 'off'}`}></span>
            <span className="child-reg-sync-toggle-label">
              {getAutoSyncLabel()}
            </span>
          </button>
          <button 
            className="child-reg-sync-now-mini"
            onClick={handleManualSync}
            disabled={isSyncing || isLoading || refreshing}
            title="Sync now"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6"/>
              <path d="M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
              <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
            </svg>
          </button>
        </div>
      </div>

      {offlineMode && (
        <div className="child-reg-offline-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#856404" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <circle cx="12" cy="16" r="1" fill="#856404"/>
          </svg>
          Offline Mode - Auto-sync paused. Data will sync when back online.
        </div>
      )}

      <div className="child-reg-section-title">Quick Actions</div>
      <div className="child-reg-actions-grid">
        <div className="child-reg-action-card" onClick={() => { if (!isLoading) { handleActionClick('Register New Child'); navigateToPage('register'); } }} style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}>
          <div className="child-reg-action-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4"/>
              <path d="M5.5 20V19C5.5 16.8 7.3 15 9.5 15H14.5C16.7 15 18.5 16.8 18.5 19V20"/>
            </svg>
          </div>
          <div className="child-reg-action-info">
            <h4>Register New Patient</h4>
            <p>Capture patient information and details</p>
          </div>
        </div>
        <div className="child-reg-action-card" onClick={() => { if (!isLoading) { handleActionClick('Verify Fingerprint'); handleVerifyFingerprintClick(); } }} style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}>
          <div className="child-reg-action-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/>
              <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"/>
            </svg>
          </div>
          <div className="child-reg-action-info">
            <h4>Verify Fingerprint</h4>
            <p>Verify existing fingerprint records</p>
          </div>
        </div>
        <div className="child-reg-action-card" onClick={() => { if (!isLoading) { handleActionClick('Manage Locations'); navigateToPage('locations'); } }} style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}>
          <div className="child-reg-action-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
          </div>
          <div className="child-reg-action-info">
            <h4>Manage Locations</h4>
            <p>Add, edit, or delete locations</p>
          </div>
        </div>
        <div className="child-reg-action-card" onClick={handleManualSync} style={{ cursor: (isLoading || isSyncing || refreshing) ? 'not-allowed' : 'pointer', opacity: (isLoading || isSyncing || refreshing) ? 0.6 : 1 }}>
          <div className="child-reg-action-icon">
            {isSyncing || isAutoSyncing ? (
              <div className="child-reg-sync-spinner"></div>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 12H22"/>
                <path d="M12 2V22"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
            )}
          </div>
          <div className="child-reg-action-info">
            <h4>{isSyncing || isAutoSyncing ? 'Syncing...' : 'Sync Offline Data'}</h4>
            <p>
              {isSyncing || isAutoSyncing 
                ? 'Please wait while syncing...' 
                : `${pendingSyncCount > 0 ? `${pendingSyncCount} items pending` : 'All data synced'}`
              }
            </p>
          </div>
        </div>
      </div>

      <div className="child-reg-section-title">Registration Workflow</div>
      <div className="child-reg-workflow-steps">
        <div className="child-reg-workflow-step">
          <div className="child-reg-step-number">1</div>
          <div className="child-reg-step-content">
            <h4>Register Patient</h4>
            <p>Enter patient information & optional photos</p>
          </div>
        </div>
        <div className="child-reg-workflow-arrow">→</div>
        <div className="child-reg-workflow-step">
          <div className="child-reg-step-number">2</div>
          <div className="child-reg-step-content">
            <h4>Enroll Fingerprints</h4>
            <p>Capture optional fingerprints</p>
          </div>
        </div>
        <div className="child-reg-workflow-arrow">→</div>
        <div className="child-reg-workflow-step">
          <div className="child-reg-step-number">3</div>
          <div className="child-reg-step-content">
            <h4>Verify</h4>
            <p>Check for duplicates</p>
          </div>
        </div>
        <div className="child-reg-workflow-arrow">→</div>
        <div className="child-reg-workflow-step">
          <div className="child-reg-step-number">4</div>
          <div className="child-reg-step-content">
            <h4>Save</h4>
            <p>{offlineMode ? 'Save to Offline DB' : 'Save to Online DB'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenderListPage;