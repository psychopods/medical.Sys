import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './UserManagement.css';

// API base URL
import { API_ENDPOINTS, API_BASE_URL } from '../../config/endpoints.js';
import { executeQuery, executeRun } from '../../services/db.js';

const UserManagement = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [activePage, setActivePage] = useState('list');
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [viewingRole, setViewingRole] = useState(null);
  const [viewingPermission, setViewingPermission] = useState(null);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [resettingUser, setResettingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingPermission, setEditingPermission] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState([]);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [generatedUsername, setGeneratedUsername] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [permissionFormData, setPermissionFormData] = useState({
    slug: '',
    description: '',
    categoryId: ''
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: ''
  });
  const [stats, setStats] = useState({
    total_users: 0,
    active_roles: 0,
    online_now: 0,
    total_permissions: 0,
    total_categories: 0
  });
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    roleId: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({
    username: '',
    email: '',
    password: '',
    roleId: '',
    firstName: '',
    lastName: ''
  });
  const [permissionFormErrors, setPermissionFormErrors] = useState({
    slug: '',
    categoryId: ''
  });
  const [categoryFormErrors, setCategoryFormErrors] = useState({
    name: ''
  });

  // ===== LOADING STATES =====
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isDeletingRole, setIsDeletingRole] = useState(false);
  const [isAddingPermission, setIsAddingPermission] = useState(false);
  const [isUpdatingPermission, setIsUpdatingPermission] = useState(false);
  const [isDeletingPermission, setIsDeletingPermission] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [isManagingPermissions, setIsManagingPermissions] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // ===== AUTO-REFRESH STATE =====
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const refreshIntervalRef = useRef(null);
  const isRefreshingRef = useRef(false);

  // ===== ONLINE USERS STATE =====
  const [onlineUsersList, setOnlineUsersList] = useState([]);
  const [loadingOnlineUsers, setLoadingOnlineUsers] = useState(false);

  const navigate = useNavigate();

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // ===== BACKGROUND REFRESH FUNCTION =====
  const refreshAllData = async (showSpinner = false) => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    
    if (showSpinner) {
      setRefreshing(true);
    }
    
    try {
      await Promise.all([
        fetchCategories(),
        fetchAllPermissions(),
        fetchRoles(),
        fetchUsers(),
        fetchOnlineUsers()
      ]);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Background refresh error:', error);
    } finally {
      isRefreshingRef.current = false;
      if (showSpinner) {
        setRefreshing(false);
      }
    }
  };

  // ===== MANUAL REFRESH WITH SPINNER =====
  const handleManualRefresh = async () => {
    await refreshAllData(true);
  };

  // ===== START BACKGROUND REFRESH =====
  const startBackgroundRefresh = () => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // Set up background refresh every 30 seconds
    refreshIntervalRef.current = setInterval(() => {
      // Only refresh on list, users, roles, permissions, categories pages
      if (['list', 'users', 'roles', 'permissions', 'categories'].includes(activePage)) {
        refreshAllData(false);
      }
    }, 30000);
  };

  // ===== STOP BACKGROUND REFRESH =====
  const stopBackgroundRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  // API Calls - Categories
  const [permissionCategories, setPermissionCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.permissionCategories, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setPermissionCategories(data);
        setStats(prev => ({ ...prev, total_categories: data.length }));
        
        // Cache in SQLite
        for (const cat of data) {
          await executeRun(
            "INSERT OR REPLACE INTO permission_categories (id, name, description) VALUES (?, ?, ?)",
            [cat.id, cat.name, cat.description || '']
          );
        }
        return data;
      }
    } catch (error) {
      console.warn('API: Failed to fetch categories, trying local SQLite fallback...', error);
      try {
        const localCats = await executeQuery("SELECT * FROM permission_categories");
        setPermissionCategories(localCats);
        setStats(prev => ({ ...prev, total_categories: localCats.length }));
        return localCats;
      } catch (dbError) {
        console.error('Local SQLite category query failed:', dbError);
      }
    }
    return [];
  };

  const addCategory = async (categoryData) => {
    try {
      const response = await fetch(API_ENDPOINTS.permissionCategories, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: categoryData.name,
          description: categoryData.description || ''
        })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
    return null;
  };

  const updateCategory = async (id, categoryData) => {
    try {
      const response = await fetch(API_ENDPOINTS.permissionCategory(id), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: categoryData.name,
          description: categoryData.description || ''
        })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
    return null;
  };

  const deleteCategory = async (id) => {
    try {
      const response = await fetch(API_ENDPOINTS.permissionCategory(id), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting category:', error);
    }
    return false;
  };

  // API Calls - Permissions
  const [availablePermissions, setAvailablePermissions] = useState([]);

  const fetchAllPermissions = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.permissions, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setAvailablePermissions(data);
        setPermissions(data);
        setStats(prev => ({ ...prev, total_permissions: data.length }));
        
        // Cache in SQLite
        for (const perm of data) {
          await executeRun(
            "INSERT OR REPLACE INTO permissions (id, slug, description, category_id) VALUES (?, ?, ?, ?)",
            [perm.id, perm.slug, perm.description || '', perm.categoryId || perm.category_id || null]
          );
        }
        return data;
      }
    } catch (error) {
      console.warn('API: Failed to fetch permissions, trying local SQLite fallback...', error);
      try {
        const localPerms = await executeQuery("SELECT * FROM permissions");
        const mapped = localPerms.map(p => ({
          id: p.id,
          slug: p.slug,
          description: p.description,
          categoryId: p.category_id
        }));
        setAvailablePermissions(mapped);
        setPermissions(mapped);
        setStats(prev => ({ ...prev, total_permissions: mapped.length }));
        return mapped;
      } catch (dbError) {
        console.error('Local SQLite permissions query failed:', dbError);
      }
    }
    return [];
  };

  const addPermission = async (permissionData) => {
    try {
      const response = await fetch(API_ENDPOINTS.permissions, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: crypto.randomUUID(),
          slug: permissionData.slug,
          description: permissionData.description || '',
          categoryId: permissionData.categoryId ? parseInt(permissionData.categoryId) : null
        })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error adding permission:', error);
    }
    return null;
  };

  const updatePermission = async (id, permissionData) => {
    try {
      const response = await fetch(API_ENDPOINTS.permission(id), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          slug: permissionData.slug,
          description: permissionData.description || '',
          categoryId: permissionData.categoryId ? parseInt(permissionData.categoryId) : null
        })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error updating permission:', error);
    }
    return null;
  };

  const deletePermission = async (id) => {
    try {
      const response = await fetch(API_ENDPOINTS.permission(id), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting permission:', error);
    }
    return false;
  };

  // API Calls - Roles
  const fetchRoles = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.roles, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
        setStats(prev => ({ ...prev, active_roles: data.length }));
        
        // Cache in SQLite
        for (const role of data) {
          await executeRun(
            "INSERT OR REPLACE INTO roles (id, name, description, version, is_dirty, sync_status) VALUES (?, ?, ?, ?, 0, 'synced')",
            [role.id, role.name, role.description || '', role.version || 1]
          );
        }
        return data;
      }
    } catch (error) {
      console.warn('API: Failed to fetch roles, trying local SQLite fallback...', error);
      try {
        const localRoles = await executeQuery("SELECT * FROM roles");
        const mapped = localRoles.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          version: r.version
        }));
        setRoles(mapped);
        setStats(prev => ({ ...prev, active_roles: mapped.length }));
        return mapped;
      } catch (dbError) {
        console.error('Local SQLite roles query failed:', dbError);
      }
    }
    return [];
  };

  const addRole = async (roleData) => {
    try {
      const response = await fetch(API_ENDPOINTS.roles, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: crypto.randomUUID(),
          name: roleData.name,
          description: roleData.description || ''
        })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error adding role:', error);
    }
    return null;
  };

  const updateRole = async (id, roleData) => {
    try {
      const response = await fetch(API_ENDPOINTS.role(id), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: roleData.name,
          description: roleData.description || ''
        })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
    return null;
  };

  const deleteRole = async (id) => {
    try {
      const response = await fetch(API_ENDPOINTS.role(id), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting role:', error);
    }
    return false;
  };

  // API Calls - Users
  const fetchUsers = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.users, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setStats(prev => ({ ...prev, total_users: data.length }));
        
        // Cache in SQLite
        for (const u of data) {
          await executeRun(
            `INSERT OR REPLACE INTO staff_users (id, username, email, password_hash, role_id, first_name, last_name, phone_number, version, is_dirty, sync_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'synced')`,
            [
              u.id, 
              u.username, 
              u.email, 
              u.passwordHash || u.password_hash || '', 
              u.roleId || u.role_id || '', 
              u.firstName || u.first_name || '', 
              u.lastName || u.last_name || '', 
              u.phoneNumber || u.phone_number || '',
              u.version || 1
            ]
          );
        }
        return data;
      }
    } catch (error) {
      console.warn('API: Failed to fetch users, trying local SQLite fallback...', error);
      try {
        const localUsers = await executeQuery("SELECT * FROM staff_users");
        const mapped = localUsers.map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          roleId: u.role_id,
          firstName: u.first_name,
          lastName: u.last_name,
          phoneNumber: u.phone_number,
          version: u.version
        }));
        setUsers(mapped);
        setStats(prev => ({ ...prev, total_users: mapped.length }));
        return mapped;
      } catch (dbError) {
        console.error('Local SQLite users query failed:', dbError);
      }
    }
    return [];
  };

  const addUser = async (userData) => {
    try {
      const response = await fetch(API_ENDPOINTS.users, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: crypto.randomUUID(),
          username: userData.username,
          email: userData.email,
          password: userData.password,
          roleId: userData.roleId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone || ''
        })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
    return null;
  };

  const updateUser = async (id, userData) => {
    try {
      const response = await fetch(API_ENDPOINTS.user(id), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          roleId: userData.roleId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone || ''
        })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
    return null;
  };

  const resetUserPassword = async (id, newPassword) => {
    try {
      const response = await fetch(API_ENDPOINTS.resetPassword(id), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          password: newPassword
        })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    }
    return null;
  };

  const deleteUser = async (id) => {
    try {
      const response = await fetch(API_ENDPOINTS.user(id), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting user:', error);
    }
    return false;
  };

  // API Calls - Role Permissions
  const fetchRolePermissions = async (roleId) => {
    try {
      const response = await fetch(API_ENDPOINTS.rolePermissions(roleId), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedRolePermissions(data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching role permissions:', error);
    }
    return [];
  };

  const assignPermission = async (roleId, permissionId) => {
    try {
      const response = await fetch(API_ENDPOINTS.rolePermissions(roleId), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ permissionId: permissionId })
      });
      return response.ok;
    } catch (error) {
      console.error('Error assigning permission:', error);
    }
    return false;
  };

  const removePermission = async (roleId, permissionId) => {
    try {
      const response = await fetch(API_ENDPOINTS.rolePermission(roleId, permissionId), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Error removing permission:', error);
    }
    return false;
  };

  const generateUsername = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await fetch(API_ENDPOINTS.generateUsername(currentYear), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setGeneratedUsername(data.username);
        setFormData(prev => ({ ...prev, username: data.username }));
        return data.username;
      }
    } catch (error) {
      console.error('Error generating username:', error);
    }
    return null;
  };

  const generateTemporaryPassword = () => {
    const length = 10;
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    const special = '!@#$%&*';
    
    let password = '';
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += special.charAt(Math.floor(Math.random() * special.length));
    
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    setGeneratedPassword(password);
    setFormData(prev => ({ ...prev, password }));
    return password;
  };

  const sendEmailNotification = async (email, username, password, firstName, lastName) => {
    try {
      const response = await fetch(API_ENDPOINTS.sendCredentials, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          toEmail: email,
          username: username,
          temporaryPassword: password,
          firstName: firstName,
          lastName: lastName,
          loginUrl: window.location.origin
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Error sending email:', error);
    }
    return false;
  };

  // Initialize data on mount
  useEffect(() => {
    const initData = async () => {
      await refreshAllData(true);
    };
    initData();

    // Start background refresh
    startBackgroundRefresh();

    return () => {
      stopBackgroundRefresh();
    };
  }, []);

  // Restart refresh when active page changes
  useEffect(() => {
    stopBackgroundRefresh();
    startBackgroundRefresh();
  }, [activePage]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    if (activePage === 'add_user') {
      generateUsername();
      generateTemporaryPassword();
    }
  }, [activePage]);

  // ===== FETCH ONLINE USERS =====
  const fetchOnlineUsers = async () => {
    try {
      // First, get the count of online users
      const countResponse = await fetch(API_ENDPOINTS.onlineCount, {
        headers: getAuthHeaders()
      });
      
      let count = 0;
      if (countResponse.ok) {
        const data = await countResponse.json();
        count = data.activeOnlineCount || data.count || 0;
        setStats(prev => ({ ...prev, online_now: count }));
      }

      // If there are online users, fetch the full user list and filter active ones
      if (count > 0) {
        const usersResponse = await fetch(API_ENDPOINTS.users, {
          headers: getAuthHeaders()
        });
        
        if (usersResponse.ok) {
          const allUsers = await usersResponse.json();
          
          // Filter users who have been active in the last 5 minutes
          const now = Date.now();
          const fiveMinutesAgo = now - (5 * 60 * 1000);
          
          const onlineUsers = allUsers.filter(user => {
            if (!user.lastActive) return false;
            const lastActive = new Date(user.lastActive).getTime();
            return lastActive > fiveMinutesAgo;
          });
          
          setOnlineUsersList(onlineUsers);
          // Update count if API count doesn't match filtered count
          if (onlineUsers.length !== count) {
            setStats(prev => ({ ...prev, online_now: onlineUsers.length }));
          }
        } else {
          // If users endpoint fails, try to get sessions
          try {
            const sessionsResponse = await fetch(API_ENDPOINTS.sessions, {
              headers: getAuthHeaders()
            });
            
            if (sessionsResponse.ok) {
              const sessionsData = await sessionsResponse.json();
              const sessions = sessionsData.sessions || sessionsData.data || [];
              
              // Extract unique users from sessions
              const userMap = new Map();
              sessions.forEach(session => {
                if (session.staffUserId && !userMap.has(session.staffUserId)) {
                  userMap.set(session.staffUserId, {
                    id: session.staffUserId,
                    username: session.username || session.staffUserId,
                    firstName: session.firstName || '',
                    lastName: session.lastName || '',
                    email: session.email || '',
                    roleName: session.role || session.roleName || 'User',
                    lastActive: session.lastActive || session.createdAt || new Date().toISOString()
                  });
                }
              });
              
              setOnlineUsersList(Array.from(userMap.values()));
            } else {
              // If all fails, try to get online count only
              setOnlineUsersList([]);
            }
          } catch (sessionError) {
            console.warn('Failed to fetch sessions:', sessionError);
            setOnlineUsersList([]);
          }
        }
      } else {
        setOnlineUsersList([]);
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
      // On error, try to get at least the current user online
      try {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser && currentUser.id) {
          setOnlineUsersList([{
            id: currentUser.id,
            username: currentUser.username || 'admin',
            firstName: currentUser.firstName || 'System',
            lastName: currentUser.lastName || 'Admin',
            email: currentUser.email || '',
            roleName: currentUser.role || 'Super Admin',
            lastActive: new Date().toISOString()
          }]);
          setStats(prev => ({ ...prev, online_now: 1 }));
        }
      } catch (e) {
        setOnlineUsersList([]);
      }
    }
  };

  // Function to handle clicking on Online Now card
  const handleShowOnlineUsers = async () => {
    setLoadingOnlineUsers(true);
    setActivePage('online_users');
    await fetchOnlineUsers();
    setLoadingOnlineUsers(false);
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  // Format last refreshed time
  const getLastRefreshedText = () => {
    if (!lastRefreshed) return 'Never refreshed';
    const date = new Date(lastRefreshed);
    return `Data updated: ${date.toLocaleTimeString()}`;
  };

  // Category CRUD Operations
  const handleAddCategory = async () => {
    if (!categoryFormData.name.trim()) {
      setCategoryFormErrors({ name: 'Category name is required' });
      return;
    }
    
    setIsAddingCategory(true);
    try {
      const result = await addCategory({
        name: categoryFormData.name.trim(),
        description: categoryFormData.description || ''
      });
      
      if (result) {
        await fetchCategories();
        setActivePage('categories');
        resetCategoryForm();
        showToast('Category added successfully!', 'success');
      } else {
        showToast('Failed to add category', 'error');
      }
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!categoryFormData.name.trim()) {
      setCategoryFormErrors({ name: 'Category name is required' });
      return;
    }
    
    setIsUpdatingCategory(true);
    try {
      const result = await updateCategory(editingCategory.id, {
        name: categoryFormData.name.trim(),
        description: categoryFormData.description || ''
      });
      
      if (result) {
        await fetchCategories();
        setActivePage('categories');
        setEditingCategory(null);
        resetCategoryForm();
        showToast('Category updated successfully!', 'success');
      } else {
        showToast('Failed to update category', 'error');
      }
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete category "${categoryName}"?`)) return;
    
    setDeletingId(categoryId);
    setIsDeletingCategory(true);
    try {
      const success = await deleteCategory(categoryId);
      if (success) {
        await fetchCategories();
        showToast('Category deleted successfully!', 'success');
      } else {
        showToast('Failed to delete category', 'error');
      }
    } finally {
      setIsDeletingCategory(false);
      setDeletingId(null);
    }
  };

  const resetCategoryForm = () => {
    setCategoryFormData({ name: '', description: '' });
    setCategoryFormErrors({ name: '' });
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || ''
    });
    setActivePage('edit_category');
  };

  // Permission CRUD Operations
  const validatePermissionForm = () => {
    let isValid = true;
    const errors = { slug: '', categoryId: '' };

    if (!permissionFormData.slug.trim()) {
      errors.slug = 'Permission slug is required';
      isValid = false;
    } else if (!/^[a-z]+:[a-z_]+$/.test(permissionFormData.slug)) {
      errors.slug = 'Use format: domain:action (e.g., children:create)';
      isValid = false;
    }
    if (!permissionFormData.categoryId) {
      errors.categoryId = 'Category is required';
      isValid = false;
    }

    setPermissionFormErrors(errors);
    return isValid;
  };

  const handleAddPermission = async () => {
    if (!validatePermissionForm()) return;

    setIsAddingPermission(true);
    try {
      const result = await addPermission({
        slug: permissionFormData.slug.toLowerCase(),
        description: permissionFormData.description || '',
        categoryId: permissionFormData.categoryId
      });

      if (result) {
        await fetchAllPermissions();
        setActivePage('permissions');
        resetPermissionForm();
        showToast('Permission added successfully!', 'success');
      } else {
        showToast('Failed to add permission', 'error');
      }
    } finally {
      setIsAddingPermission(false);
    }
  };

  const handleUpdatePermission = async () => {
    if (!validatePermissionForm()) return;

    setIsUpdatingPermission(true);
    try {
      const result = await updatePermission(editingPermission.id, {
        slug: permissionFormData.slug.toLowerCase(),
        description: permissionFormData.description || '',
        categoryId: permissionFormData.categoryId
      });

      if (result) {
        await fetchAllPermissions();
        setActivePage('permissions');
        setEditingPermission(null);
        resetPermissionForm();
        showToast('Permission updated successfully!', 'success');
      } else {
        showToast('Failed to update permission', 'error');
      }
    } finally {
      setIsUpdatingPermission(false);
    }
  };

  const handleDeletePermission = async (permissionId, permissionSlug) => {
    if (!window.confirm(`Are you sure you want to delete permission "${permissionSlug}"?`)) return;
    
    setDeletingId(permissionId);
    setIsDeletingPermission(true);
    try {
      const success = await deletePermission(permissionId);
      if (success) {
        await fetchAllPermissions();
        showToast('Permission deleted successfully!', 'success');
      } else {
        showToast('Failed to delete permission', 'error');
      }
    } finally {
      setIsDeletingPermission(false);
      setDeletingId(null);
    }
  };

  const resetPermissionForm = () => {
    setPermissionFormData({
      slug: '',
      description: '',
      categoryId: ''
    });
    setPermissionFormErrors({ slug: '', categoryId: '' });
  };

  // Role CRUD Operations
  const validateRoleForm = () => {
    if (!roleFormData.name.trim()) {
      showToast('Role name is required', 'error');
      return false;
    }
    return true;
  };

  const handleAddRole = async () => {
    if (!validateRoleForm()) return;
    
    setIsAddingRole(true);
    try {
      const result = await addRole({
        name: roleFormData.name,
        description: roleFormData.description || ''
      });
      
      if (result) {
        await fetchRoles();
        setActivePage('roles');
        resetRoleForm();
        showToast('Role added successfully!', 'success');
      } else {
        showToast('Failed to add role', 'error');
      }
    } finally {
      setIsAddingRole(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!validateRoleForm()) return;
    
    setIsUpdatingRole(true);
    try {
      const result = await updateRole(editingRole.id, {
        name: roleFormData.name,
        description: roleFormData.description || ''
      });
      
      if (result) {
        await fetchRoles();
        setActivePage('roles');
        setEditingRole(null);
        resetRoleForm();
        showToast('Role updated successfully!', 'success');
      } else {
        showToast('Failed to update role', 'error');
      }
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleDeleteRole = async (roleId, roleName) => {
    if (!window.confirm(`Are you sure you want to delete role "${roleName}"?`)) return;
    
    setDeletingId(roleId);
    setIsDeletingRole(true);
    try {
      const success = await deleteRole(roleId);
      if (success) {
        await fetchRoles();
        showToast('Role deleted successfully!', 'success');
      } else {
        showToast('Failed to delete role', 'error');
      }
    } finally {
      setIsDeletingRole(false);
      setDeletingId(null);
    }
  };

  const resetRoleForm = () => {
    setRoleFormData({ name: '', description: '' });
  };

  // User CRUD Operations
  const validateUserForm = () => {
    let isValid = true;
    const errors = {
      username: '',
      email: '',
      password: '',
      roleId: '',
      firstName: '',
      lastName: ''
    };

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
      isValid = false;
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }
    if (!editingUser && !formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    }
    if (!formData.roleId) {
      errors.roleId = 'Role is required';
      isValid = false;
    }
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
      isValid = false;
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleAddUser = async () => {
    if (!validateUserForm()) return;
    
    setIsAddingUser(true);
    try {
      const result = await addUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        roleId: formData.roleId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      });
      
      if (result) {
        await sendEmailNotification(
          formData.email,
          formData.username,
          formData.password,
          formData.firstName,
          formData.lastName
        );
        
        await fetchUsers();
        setActivePage('users');
        resetForm();
        showToast('User added successfully! Credentials sent to email.', 'success');
      } else {
        showToast('Failed to add user', 'error');
      }
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!validateUserForm()) return;
    
    setIsUpdatingUser(true);
    try {
      const result = await updateUser(editingUser.id, {
        username: formData.username,
        email: formData.email,
        roleId: formData.roleId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      });
      
      if (result) {
        await fetchUsers();
        setActivePage('users');
        setEditingUser(null);
        resetForm();
        showToast('User updated successfully!', 'success');
      } else {
        showToast('Failed to update user', 'error');
      }
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleResetPasswordClick = (userItem) => {
    setResettingUser(userItem);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setActivePage('reset_password');
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      showToast('Please enter a new password', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsResettingPassword(true);
    try {
      const result = await resetUserPassword(resettingUser.id, newPassword);
      
      if (result) {
        await sendEmailNotification(
          resettingUser.email,
          resettingUser.username,
          newPassword,
          resettingUser.firstName,
          resettingUser.lastName
        );
        showToast(`Password reset successfully for ${resettingUser.username}. New credentials sent to email.`, 'success');
        setActivePage('users');
        setResettingUser(null);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast('Failed to reset password', 'error');
      }
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}?`)) return;
    
    setDeletingId(userId);
    setIsDeletingUser(true);
    try {
      const success = await deleteUser(userId);
      if (success) {
        await fetchUsers();
        showToast('User deleted successfully!', 'success');
      } else {
        showToast('Failed to delete user', 'error');
      }
    } finally {
      setIsDeletingUser(false);
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      username: generatedUsername,
      email: '',
      password: '',
      roleId: '',
      firstName: '',
      lastName: '',
      phone: ''
    });
    setFormErrors({
      username: '',
      email: '',
      password: '',
      roleId: '',
      firstName: '',
      lastName: ''
    });
    setGeneratedPassword('');
    setShowPassword(false);
  };

  // Role Permissions Management
  const togglePermission = async (permissionId) => {
    if (!selectedRoleForPermissions) return;
    
    const isCurrentlyAssigned = selectedRolePermissions.includes(permissionId);
    
    setIsManagingPermissions(true);
    try {
      let success;
      if (isCurrentlyAssigned) {
        success = await removePermission(selectedRoleForPermissions.id, permissionId);
      } else {
        success = await assignPermission(selectedRoleForPermissions.id, permissionId);
      }
      
      if (success) {
        if (isCurrentlyAssigned) {
          setSelectedRolePermissions(prev => prev.filter(id => id !== permissionId));
          showToast('Permission removed from role', 'success');
        } else {
          setSelectedRolePermissions(prev => [...prev, permissionId]);
          showToast('Permission assigned to role', 'success');
        }
      } else {
        showToast('Failed to update permission', 'error');
      }
    } finally {
      setIsManagingPermissions(false);
    }
  };

  const handleManagePermissions = async (role) => {
    setSelectedRoleForPermissions(role);
    await fetchRolePermissions(role.id);
    setActivePage('manage_permissions');
  };

  const handleEditUser = (userItem) => {
    setEditingUser(userItem);
    setFormData({
      username: userItem.username,
      email: userItem.email,
      password: '',
      roleId: userItem.roleId || '',
      firstName: userItem.firstName || '',
      lastName: userItem.lastName || '',
      phone: userItem.phone || ''
    });
    setActivePage('edit_user');
  };

  const handleViewUser = (userItem) => {
    setViewingUser(userItem);
    setActivePage('view_user');
  };

  const handleViewRole = (role) => {
    setViewingRole(role);
    setActivePage('view_role');
  };

  const handleViewPermission = (permission) => {
    setViewingPermission(permission);
    setActivePage('view_permission');
  };

  const handleViewCategory = (category) => {
    setViewingCategory(category);
    setActivePage('view_category');
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      description: role.description || ''
    });
    setActivePage('edit_role');
  };

  const handleEditPermission = (permission) => {
    setEditingPermission(permission);
    setPermissionFormData({
      slug: permission.slug,
      description: permission.description || '',
      categoryId: permission.categoryId || ''
    });
    setActivePage('edit_permission');
  };

  const getPermissionsByCategory = () => {
    const grouped = {};
    availablePermissions.forEach(perm => {
      const category = permissionCategories.find(c => c.id === perm.categoryId);
      const categoryName = category ? category.name : 'Uncategorized';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(perm);
    });
    return grouped;
  };

  const ToastNotification = () => {
    if (!toast.show) return null;
    return (
      <div className={`um-toast-notification ${toast.type}`}>
        <div className="um-toast-content">
          {toast.type === 'success' && <span>✓</span>}
          {toast.type === 'error' && <span>✗</span>}
          {toast.type === 'info' && <span>ℹ</span>}
          <span>{toast.message}</span>
        </div>
        <button className="um-toast-close" onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
      </div>
    );
  };

  // Render Quick Action Buttons Component
  const QuickActionButtons = () => (
    <div className="um-quick-actions-bar">
      <button 
        className={`um-quick-action-btn ${activePage === 'users' ? 'active' : ''}`}
        onClick={() => setActivePage('users')}
        disabled={isLoading}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21"/>
          <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"/>
        </svg>
        Manage Users
      </button>
      <button 
        className={`um-quick-action-btn ${activePage === 'roles' ? 'active' : ''}`}
        onClick={() => setActivePage('roles')}
        disabled={isLoading}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/>
          <path d="M12 6V12L16 14"/>
        </svg>
        Manage Roles
      </button>
      <button 
        className={`um-quick-action-btn ${activePage === 'permissions' ? 'active' : ''}`}
        onClick={() => setActivePage('permissions')}
        disabled={isLoading}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
          <path d="M12 6v6l4 2"/>
        </svg>
        Define Permissions
      </button>
      <button 
        className={`um-quick-action-btn ${activePage === 'categories' ? 'active' : ''}`}
        onClick={() => setActivePage('categories')}
        disabled={isLoading}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4L20 4"/>
          <path d="M4 8L20 8"/>
          <path d="M4 12L14 12"/>
          <rect x="2" y="2" width="20" height="20" rx="2"/>
        </svg>
        Manage Categories
      </button>
    </div>
  );

  // Render Online Users Page
  const renderOnlineUsersPage = () => (
    <div className="um-page-content">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => setActivePage('list')} disabled={loadingOnlineUsers}>
          ← Back to Dashboard
        </button>
        <QuickActionButtons />
        <div className="um-header-actions">
          <h1>Online Users</h1>
          <button 
            className="um-refresh-btn" 
            onClick={handleShowOnlineUsers} 
            disabled={loadingOnlineUsers}
          >
            {loadingOnlineUsers ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>
      
      <div className="um-online-users-stats">
        <div className="um-online-stats-card">
          <div className="um-online-stats-icon" style={{ background: '#e3f2fd', color: '#1565c0' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="4" fill="currentColor"/>
            </svg>
          </div>
          <div className="um-online-stats-info">
            <h2>{onlineUsersList.length}</h2>
            <p>Users Currently Online</p>
          </div>
        </div>
        
        <div className="um-online-stats-card">
          <div className="um-online-stats-icon" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21"/>
              <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"/>
            </svg>
          </div>
          <div className="um-online-stats-info">
            <h2>{stats.total_users}</h2>
            <p>Total Registered Users</p>
          </div>
        </div>
      </div>

      {loadingOnlineUsers ? (
        <div className="um-online-loading">
          <div className="um-spinner"></div>
          <p>Loading online users...</p>
        </div>
      ) : (
        <div className="um-online-users-table-container">
          {onlineUsersList.length === 0 ? (
            <div className="um-no-online-users">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.3"/>
              </svg>
              <h3>No Users Online</h3>
              <p>There are currently no users active on the system.</p>
            </div>
          ) : (
            <table className="um-data-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Last Active</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {onlineUsersList.map((onlineUser, index) => {
                  // Handle different property naming conventions
                  const username = onlineUser.username || onlineUser.user_name || 'User';
                  const firstName = onlineUser.firstName || onlineUser.first_name || '';
                  const lastName = onlineUser.lastName || onlineUser.last_name || '';
                  const email = onlineUser.email || '';
                  const role = onlineUser.roleName || onlineUser.role || onlineUser.role_name || 'User';
                  const lastActive = onlineUser.lastActive || onlineUser.last_active || onlineUser.updatedAt || new Date().toISOString();
                  
                  return (
                    <tr key={onlineUser.id || index}>
                      <td style={{ textAlign: 'center' }}>{index + 1}</td>
                      <td>
                        <div className="um-online-user-username">
                          <span className="um-online-indicator"></span>
                          {username}
                        </div>
                      </td>
                      <td>{firstName} {lastName}</td>
                      <td>{email}</td>
                      <td>
                        <span className="um-role-badge">{role}</span>
                      </td>
                      <td>
                        {new Date(lastActive).toLocaleString()}
                      </td>
                      <td>
                        <span className="um-status-badge um-status-online">
                          <span className="um-online-dot"></span> Online
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );

  // Render User View Page
  const renderUserViewPage = () => (
    <div className="um-page-content-full">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => setActivePage('users')} disabled={isLoading}>← Back to Users</button>
        <h1>User Details</h1>
      </div>
      
      <div className="um-view-container">
        <div className="um-view-section">
          <h3>Personal Information</h3>
          <div className="um-view-grid">
            <div className="um-view-item">
              <label>Full Name:</label>
              <span>{viewingUser?.firstName} {viewingUser?.lastName}</span>
            </div>
            <div className="um-view-item">
              <label>Username:</label>
              <span>{viewingUser?.username}</span>
            </div>
            <div className="um-view-item">
              <label>Email:</label>
              <span>{viewingUser?.email}</span>
            </div>
            <div className="um-view-item">
              <label>Phone Number:</label>
              <span>{viewingUser?.phone || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="um-view-section">
          <h3>Account Information</h3>
          <div className="um-view-grid">
            <div className="um-view-item">
              <label>Role:</label>
              <span className="um-role-badge">{viewingUser?.roleName || viewingUser?.role}</span>
            </div>
            <div className="um-view-item">
              <label>Status:</label>
              <span className={`um-status-badge ${viewingUser?.securityStatus === 'ACTIVE' ? 'um-status-active' : 'um-status-inactive'}`}>
                {viewingUser?.securityStatus || 'ACTIVE'}
              </span>
            </div>
            <div className="um-view-item">
              <label>Last Active:</label>
              <span>{viewingUser?.lastActive ? new Date(viewingUser.lastActive).toLocaleString() : 'Never'}</span>
            </div>
            <div className="um-view-item">
              <label>Registration Date:</label>
              <span>{viewingUser?.createdAt ? new Date(viewingUser.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="um-view-item">
              <label>Version:</label>
              <span>{viewingUser?.version || 1}</span>
            </div>
          </div>
        </div>

        <div className="um-view-actions">
          <button className="um-btn-secondary" onClick={() => setActivePage('users')} disabled={isLoading}>Close</button>
          <button className="um-btn-primary" onClick={() => {
            handleEditUser(viewingUser);
          }} disabled={isLoading}>Edit User</button>
        </div>
      </div>
    </div>
  );

  // Render Role View Page
  const renderRoleViewPage = () => (
    <div className="um-page-content-full">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => setActivePage('roles')} disabled={isLoading}>← Back to Roles</button>
        <h1>Role Details</h1>
      </div>
      
      <div className="um-view-container">
        <div className="um-view-section">
          <h3>Role Information</h3>
          <div className="um-view-grid">
            <div className="um-view-item">
              <label>Role Name:</label>
              <span><strong>{viewingRole?.name}</strong></span>
            </div>
            <div className="um-view-item">
              <label>Description:</label>
              <span>{viewingRole?.description || 'No description provided'}</span>
            </div>
            <div className="um-view-item">
              <label>Version:</label>
              <span>{viewingRole?.version || 1}</span>
            </div>
            <div className="um-view-item">
              <label>Last Modified:</label>
              <span>{viewingRole?.lastModifiedAt ? new Date(viewingRole.lastModifiedAt).toLocaleString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="um-view-section">
          <h3>Assigned Permissions</h3>
          <div className="um-permissions-list-view">
            {availablePermissions.filter(p => viewingRole?.permissions?.includes(p.id)).length > 0 ? (
              <div className="um-permissions-tags">
                {availablePermissions.filter(p => viewingRole?.permissions?.includes(p.id)).map(perm => (
                  <span key={perm.id} className="um-permission-tag">{perm.slug}</span>
                ))}
              </div>
            ) : (
              <p className="um-no-data">No permissions assigned to this role.</p>
            )}
          </div>
        </div>

        <div className="um-view-actions">
          <button className="um-btn-secondary" onClick={() => setActivePage('roles')} disabled={isLoading}>Close</button>
          <button className="um-btn-primary" onClick={() => {
            handleEditRole(viewingRole);
          }} disabled={isLoading}>Edit Role</button>
        </div>
      </div>
    </div>
  );

  // Render Permission View Page
  const renderPermissionViewPage = () => {
    const category = permissionCategories.find(c => c.id === viewingPermission?.categoryId);
    return (
      <div className="um-page-content-full">
        <div className="um-page-header">
          <button className="um-back-btn" onClick={() => setActivePage('permissions')} disabled={isLoading}>← Back to Permissions</button>
          <h1>Permission Details</h1>
        </div>
        
        <div className="um-view-container">
          <div className="um-view-section">
            <h3>Permission Information</h3>
            <div className="um-view-grid">
              <div className="um-view-item">
                <label>Permission Slug:</label>
                <span><code className="um-code-tag">{viewingPermission?.slug}</code></span>
              </div>
              <div className="um-view-item">
                <label>Description:</label>
                <span>{viewingPermission?.description || 'No description provided'}</span>
              </div>
              <div className="um-view-item">
                <label>Category:</label>
                <span className="um-category-tag">{category?.name || 'Uncategorized'}</span>
              </div>
              <div className="um-view-item">
                <label>Created At:</label>
                <span>{viewingPermission?.createdAt ? new Date(viewingPermission.createdAt).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="um-view-item">
                <label>Last Modified:</label>
                <span>{viewingPermission?.lastModifiedAt ? new Date(viewingPermission.lastModifiedAt).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="um-view-actions">
            <button className="um-btn-secondary" onClick={() => setActivePage('permissions')} disabled={isLoading}>Close</button>
            <button className="um-btn-primary" onClick={() => {
              handleEditPermission(viewingPermission);
            }} disabled={isLoading}>Edit Permission</button>
          </div>
        </div>
      </div>
    );
  };

  // Render Category View Page
  const renderCategoryViewPage = () => (
    <div className="um-page-content-full">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => setActivePage('categories')} disabled={isLoading}>← Back to Categories</button>
        <h1>Category Details</h1>
      </div>
      
      <div className="um-view-container">
        <div className="um-view-section">
          <h3>Category Information</h3>
          <div className="um-view-grid">
            <div className="um-view-item">
              <label>Category Name:</label>
              <span><strong>{viewingCategory?.name}</strong></span>
            </div>
            <div className="um-view-item">
              <label>Description:</label>
              <span>{viewingCategory?.description || 'No description provided'}</span>
            </div>
            <div className="um-view-item">
              <label>Created At:</label>
              <span>{viewingCategory?.createdAt ? new Date(viewingCategory.createdAt).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="um-view-item">
              <label>Last Updated:</label>
              <span>{viewingCategory?.updatedAt ? new Date(viewingCategory.updatedAt).toLocaleString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="um-view-section">
          <h3>Permissions in this Category</h3>
          <div className="um-permissions-list-view">
            {availablePermissions.filter(p => p.categoryId === viewingCategory?.id).length > 0 ? (
              <div className="um-permissions-tags">
                {availablePermissions.filter(p => p.categoryId === viewingCategory?.id).map(perm => (
                  <span key={perm.id} className="um-permission-tag">{perm.slug}</span>
                ))}
              </div>
            ) : (
              <p className="um-no-data">No permissions in this category.</p>
            )}
          </div>
        </div>

        <div className="um-view-actions">
          <button className="um-btn-secondary" onClick={() => setActivePage('categories')} disabled={isLoading}>Close</button>
          <button className="um-btn-primary" onClick={() => {
            handleEditCategory(viewingCategory);
          }} disabled={isLoading}>Edit Category</button>
        </div>
      </div>
    </div>
  );

  // Render Users List Page with Quick Actions
  const renderUsersList = () => (
    <div className="um-page-content">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => setActivePage('list')} disabled={isLoading}>← Back to Dashboard</button>
        <QuickActionButtons />
        <div className="um-header-actions">
          <h1>System Users</h1>
          <button className="um-add-btn" onClick={() => setActivePage('add_user')} disabled={isLoading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21"/>
              <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"/>
              <path d="M22 22L20 20"/>
            </svg>
            Add New User
          </button>
        </div>
      </div>
      <div className="um-recent-table">
        <table className="um-data-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Last Active</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((userItem, index) => (
              <tr key={userItem.id}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td>{userItem.username}</td>
                <td>{userItem.firstName} {userItem.lastName}</td>
                <td>{userItem.email}</td>
                <td>{userItem.roleName}</td>
                <td>{userItem.lastActive ? new Date(userItem.lastActive).toLocaleString() : 'N/A'}</td>
                <td><span className="um-status-badge um-status-active">{userItem.securityStatus || 'ACTIVE'}</span></td>
                <td>
                  <div className="um-action-buttons-group">
                    <button className="um-action-btn um-view-btn" onClick={() => handleViewUser(userItem)} title="View Details" disabled={isLoading}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button className="um-action-btn um-edit-btn" onClick={() => handleEditUser(userItem)} title="Edit User" disabled={isLoading}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3L21 7L7 21H3V17L17 3Z"/>
                      </svg>
                    </button>
                    <button className="um-action-btn um-reset-password-btn" onClick={() => handleResetPasswordClick(userItem)} title="Reset Password" disabled={isLoading}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 2L15 8" strokeWidth="2"/>
                        <path d="M21 2L15 8" strokeWidth="2" transform="translate(0, 14)"/>
                        <path d="M12 22C7 22 3 18 3 13" strokeWidth="2"/>
                        <path d="M12 2C7 2 3 6 3 11" strokeWidth="2"/>
                        <circle cx="18" cy="5" r="2" fill="currentColor"/>
                        <circle cx="18" cy="19" r="2" fill="currentColor"/>
                      </svg>
                    </button>
                    <button className="um-action-btn um-delete-btn" onClick={() => handleDeleteUser(userItem.id, userItem.username)} title="Delete User" disabled={isDeletingUser && deletingId === userItem.id}>
                      {isDeletingUser && deletingId === userItem.id ? (
                        <span className="um-spinner-small"></span>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 7H20" strokeWidth="2"/>
                          <path d="M10 11V17" strokeWidth="2"/>
                          <path d="M14 11V17" strokeWidth="2"/>
                          <path d="M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" strokeWidth="2"/>
                          <path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" strokeWidth="2"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Roles List Page with Quick Actions
  const renderRolesList = () => (
    <div className="um-page-content">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => setActivePage('list')} disabled={isLoading}>← Back to Dashboard</button>
        <QuickActionButtons />
        <div className="um-header-actions">
          <h1>System Roles</h1>
          <div className="um-header-buttons">
            <button className="um-add-btn" onClick={() => setActivePage('add_role')} disabled={isLoading}>Add New Role</button>
          </div>
        </div>
      </div>
      <div className="um-roles-table-container">
        <table className="um-data-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Role Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role, index) => (
              <tr key={role.id}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td><strong>{role.name}</strong></td>
                <td>{role.description}</td>
                <td>
                  <div className="um-action-buttons-group">
                    <button className="um-action-btn um-view-btn" onClick={() => handleViewRole(role)} title="View Details" disabled={isLoading}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button className="um-action-btn um-permission-btn" onClick={() => handleManagePermissions(role)} title="Manage Permissions" disabled={isLoading}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                    </button>
                    <button className="um-action-btn um-edit-btn" onClick={() => handleEditRole(role)} disabled={isLoading}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3L21 7L7 21H3V17L17 3Z"/>
                      </svg>
                    </button>
                    <button className="um-action-btn um-delete-btn" onClick={() => handleDeleteRole(role.id, role.name)} disabled={isDeletingRole && deletingId === role.id}>
                      {isDeletingRole && deletingId === role.id ? (
                        <span className="um-spinner-small"></span>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 7H20" strokeWidth="2"/>
                          <path d="M10 11V17" strokeWidth="2"/>
                          <path d="M14 11V17" strokeWidth="2"/>
                          <path d="M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" strokeWidth="2"/>
                          <path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" strokeWidth="2"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Permissions List Page with Quick Actions
  const renderPermissionsList = () => (
    <div className="um-page-content">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => setActivePage('list')} disabled={isLoading}>← Back to Dashboard</button>
        <QuickActionButtons />
        <div className="um-header-actions">
          <h1>System Permissions</h1>
          <button className="um-add-btn" onClick={() => { setEditingPermission(null); resetPermissionForm(); setActivePage('add_permission'); }} disabled={isLoading}>
            Define New Permission
          </button>
        </div>
      </div>
      <div className="um-permissions-table-container">
        <table className="um-data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Permission Slug</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {availablePermissions.map((permission) => {
              const category = permissionCategories.find(c => c.id === permission.categoryId);
              return (
                <tr key={permission.id}>
                  <td>{category ? category.name : 'Uncategorized'}</td>
                  <td><code className="um-code-tag">{permission.slug}</code></td>
                  <td>{permission.description}</td>
                  <td>
                    <div className="um-action-buttons-group">
                      <button className="um-action-btn um-view-btn" onClick={() => handleViewPermission(permission)} title="View Details" disabled={isLoading}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className="um-action-btn um-edit-btn" onClick={() => handleEditPermission(permission)} disabled={isLoading}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 3L21 7L7 21H3V17L17 3Z"/>
                        </svg>
                      </button>
                      <button className="um-action-btn um-delete-btn" onClick={() => handleDeletePermission(permission.id, permission.slug)} disabled={isDeletingPermission && deletingId === permission.id}>
                        {isDeletingPermission && deletingId === permission.id ? (
                          <span className="um-spinner-small"></span>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 7H20" strokeWidth="2"/>
                            <path d="M10 11V17" strokeWidth="2"/>
                            <path d="M14 11V17" strokeWidth="2"/>
                            <path d="M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" strokeWidth="2"/>
                            <path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" strokeWidth="2"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Categories List Page with Quick Actions
  const renderCategoriesList = () => (
    <div className="um-page-content">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => setActivePage('list')} disabled={isLoading}>← Back to Dashboard</button>
        <QuickActionButtons />
        <div className="um-header-actions">
          <h1>Permission Categories</h1>
          <button className="um-add-btn" onClick={() => { setEditingCategory(null); resetCategoryForm(); setActivePage('add_category'); }} disabled={isLoading}>
            Add New Category
          </button>
        </div>
      </div>
      <div className="um-categories-table-container">
        <table className="um-data-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Category Name</th>
              <th>Description</th>
              <th>Created At</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {permissionCategories.map((category, index) => (
              <tr key={category.id}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td><strong>{category.name}</strong></td>
                <td>{category.description || '—'}</td>
                <td>{category.createdAt ? new Date(category.createdAt).toLocaleString() : 'N/A'}</td>
                <td>{category.updatedAt ? new Date(category.updatedAt).toLocaleString() : 'N/A'}</td>
                <td>
                  <div className="um-action-buttons-group">
                    <button className="um-action-btn um-view-btn" onClick={() => handleViewCategory(category)} title="View Details" disabled={isLoading}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button className="um-action-btn um-edit-btn" onClick={() => handleEditCategory(category)} disabled={isLoading}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3L21 7L7 21H3V17L17 3Z"/>
                      </svg>
                    </button>
                    <button className="um-action-btn um-delete-btn" onClick={() => handleDeleteCategory(category.id, category.name)} disabled={isDeletingCategory && deletingId === category.id}>
                      {isDeletingCategory && deletingId === category.id ? (
                        <span className="um-spinner-small"></span>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 7H20" strokeWidth="2"/>
                          <path d="M10 11V17" strokeWidth="2"/>
                          <path d="M14 11V17" strokeWidth="2"/>
                          <path d="M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" strokeWidth="2"/>
                          <path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" strokeWidth="2"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {permissionCategories.length === 0 && (
          <div className="um-no-data">
            <p>No permission categories found. Click "Add New Category" to create one.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Reset Password Page
  const renderResetPasswordPage = () => (
    <div className="um-page-content-full">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => { setActivePage('users'); setResettingUser(null); setNewPassword(''); setConfirmPassword(''); }} disabled={isResettingPassword}>← Back to Users</button>
        <h1>Reset User Password</h1>
        <p>Reset password for user account. New credentials will be sent via email.</p>
      </div>
      
      <div className="um-form-container-full">
        <div className="um-user-info-section">
          <div className="um-user-info-row">
            <div className="um-user-info-label">User:</div>
            <div className="um-user-info-value">{resettingUser?.firstName} {resettingUser?.lastName}</div>
          </div>
          <div className="um-user-info-row">
            <div className="um-user-info-label">Username:</div>
            <div className="um-user-info-value">{resettingUser?.username}</div>
          </div>
          <div className="um-user-info-row">
            <div className="um-user-info-label">Email:</div>
            <div className="um-user-info-value">{resettingUser?.email}</div>
          </div>
          <div className="um-user-info-row">
            <div className="um-user-info-label">Role:</div>
            <div className="um-user-info-value">{resettingUser?.roleName}</div>
          </div>
        </div>

        <div className="um-form-section">
          <div className="um-form-grid-full">
            <div className="um-form-group">
              <label>New Password *</label>
              <div className="um-password-wrapper">
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Enter new password (min 6 characters)"
                  disabled={isResettingPassword}
                />
                <button type="button" className="um-password-toggle" onClick={() => setShowNewPassword(!showNewPassword)} disabled={isResettingPassword}>
                  {showNewPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <span className="um-helper-text">Password must be at least 6 characters long</span>
            </div>

            <div className="um-form-group">
              <label>Confirm Password *</label>
              <div className="um-password-wrapper">
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Confirm new password"
                  disabled={isResettingPassword}
                />
              </div>
            </div>

            <div className="um-password-requirements">
              <div className="um-requirements-title">Password Requirements:</div>
              <div className="um-requirements-grid">
                <div className={`um-requirement-item ${newPassword.length >= 6 ? 'um-valid' : ''}`}>
                  <span className="um-req-icon">{newPassword.length >= 6 ? '✓' : '○'}</span>
                  <span>At least 6 characters</span>
                </div>
                <div className={`um-requirement-item ${/[A-Z]/.test(newPassword) ? 'um-valid' : ''}`}>
                  <span className="um-req-icon">{/[A-Z]/.test(newPassword) ? '✓' : '○'}</span>
                  <span>Uppercase letter (A-Z)</span>
                </div>
                <div className={`um-requirement-item ${/[a-z]/.test(newPassword) ? 'um-valid' : ''}`}>
                  <span className="um-req-icon">{/[a-z]/.test(newPassword) ? '✓' : '○'}</span>
                  <span>Lowercase letter (a-z)</span>
                </div>
                <div className={`um-requirement-item ${/[0-9]/.test(newPassword) ? 'um-valid' : ''}`}>
                  <span className="um-req-icon">{/[0-9]/.test(newPassword) ? '✓' : '○'}</span>
                  <span>Number (0-9)</span>
                </div>
                <div className={`um-requirement-item ${/[!@#$%&*]/.test(newPassword) ? 'um-valid' : ''}`}>
                  <span className="um-req-icon">{/[!@#$%&*]/.test(newPassword) ? '✓' : '○'}</span>
                  <span>Special character (!@#$%&*)</span>
                </div>
                <div className={`um-requirement-item ${newPassword === confirmPassword && newPassword !== '' ? 'um-valid' : ''}`}>
                  <span className="um-req-icon">{newPassword === confirmPassword && newPassword !== '' ? '✓' : '○'}</span>
                  <span>Passwords match</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="um-form-actions">
          <button className="um-btn-secondary" onClick={() => { setActivePage('users'); setResettingUser(null); setNewPassword(''); setConfirmPassword(''); }} disabled={isResettingPassword}>
            Cancel
          </button>
          <button className="um-btn-primary" onClick={handleResetPassword} disabled={isResettingPassword}>
            {isResettingPassword ? (
              <>
                <span className="um-spinner-small"></span>
                Resetting...
              </>
            ) : (
              'Reset Password & Send Email'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Render Add/Edit User Page
  const renderUserForm = () => (
    <div className="um-page-content-full">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => { setActivePage('users'); setEditingUser(null); resetForm(); }} disabled={isAddingUser || isUpdatingUser}>← Back to Users</button>
        <h1>{editingUser ? 'Edit User' : 'Add New User'}</h1>
        <p>{editingUser ? 'Update user information' : 'Create a new system user account. Credentials will be sent via email.'}</p>
      </div>
      <div className="um-form-container-full">
        <div className="um-form-grid-full">
          <div className="um-form-group">
            <label>Username (Auto-generated) *</label>
            <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} readOnly={!editingUser} style={!editingUser ? { background: '#f0f0f0' } : {}} disabled={isAddingUser || isUpdatingUser} />
            {!editingUser && <span className="um-helper-text">Username automatically generated in format: ST-YYYY-XXXX</span>}
          </div>
          <div className="um-form-group">
            <label>Email *</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={isAddingUser || isUpdatingUser} />
          </div>
          <div className="um-form-group">
            <label>First Name *</label>
            <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} disabled={isAddingUser || isUpdatingUser} />
          </div>
          <div className="um-form-group">
            <label>Last Name *</label>
            <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} disabled={isAddingUser || isUpdatingUser} />
          </div>
          <div className="um-form-group">
            <label>Phone Number</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} disabled={isAddingUser || isUpdatingUser} />
          </div>
          {!editingUser && (
            <div className="um-form-group">
              <label>Temporary Password *</label>
              <div className="um-password-wrapper">
                <input type={showPassword ? "text" : "password"} value={formData.password} readOnly style={{ background: '#f0f0f0' }} disabled={isAddingUser || isUpdatingUser} />
                <button type="button" className="um-password-toggle" onClick={() => setShowPassword(!showPassword)} disabled={isAddingUser || isUpdatingUser}>{showPassword ? 'Hide' : 'Show'}</button>
              </div>
            </div>
          )}
          <div className="um-form-group">
            <label>Role *</label>
            <select value={formData.roleId} onChange={(e) => setFormData({...formData, roleId: e.target.value})} disabled={isAddingUser || isUpdatingUser}>
              <option value="">Select Role</option>
              {roles.map(role => (<option key={role.id} value={role.id}>{role.name}</option>))}
            </select>
          </div>
        </div>
        <div className="um-form-actions">
          <button className="um-btn-secondary" onClick={() => { setActivePage('users'); setEditingUser(null); resetForm(); }} disabled={isAddingUser || isUpdatingUser}>Cancel</button>
          <button className="um-btn-primary" onClick={editingUser ? handleUpdateUser : handleAddUser} disabled={isAddingUser || isUpdatingUser}>
            {isAddingUser || isUpdatingUser ? (
              <>
                <span className="um-spinner-small"></span>
                {editingUser ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              editingUser ? 'Update User' : 'Add User'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Render Add/Edit Role Page
  const renderRoleForm = () => (
    <div className="um-page-content-full">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => { setActivePage('roles'); setEditingRole(null); resetRoleForm(); }} disabled={isAddingRole || isUpdatingRole}>← Back to Roles</button>
        <h1>{editingRole ? 'Edit Role' : 'Add New Role'}</h1>
      </div>
      <div className="um-form-container-full">
        <div className="um-form-section">
          <div className="um-form-grid-full">
            <div className="um-form-group">
              <label>Role Name *</label>
              <input type="text" value={roleFormData.name} onChange={(e) => setRoleFormData({...roleFormData, name: e.target.value})} disabled={isAddingRole || isUpdatingRole} />
            </div>
            <div className="um-form-group">
              <label>Description</label>
              <textarea rows="3" value={roleFormData.description} onChange={(e) => setRoleFormData({...roleFormData, description: e.target.value})} disabled={isAddingRole || isUpdatingRole} />
            </div>
          </div>
        </div>
        <div className="um-form-actions">
          <button className="um-btn-secondary" onClick={() => { setActivePage('roles'); setEditingRole(null); resetRoleForm(); }} disabled={isAddingRole || isUpdatingRole}>Cancel</button>
          <button className="um-btn-primary" onClick={editingRole ? handleUpdateRole : handleAddRole} disabled={isAddingRole || isUpdatingRole}>
            {isAddingRole || isUpdatingRole ? (
              <>
                <span className="um-spinner-small"></span>
                {editingRole ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              editingRole ? 'Update Role' : 'Create Role'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Render Add/Edit Permission Page
  const renderPermissionForm = () => (
    <div className="um-page-content-full">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => { setActivePage('permissions'); setEditingPermission(null); resetPermissionForm(); }} disabled={isAddingPermission || isUpdatingPermission}>← Back to Permissions</button>
        <h1>{editingPermission ? 'Edit Permission' : 'Define New Permission'}</h1>
      </div>
      <div className="um-form-container-full">
        <div className="um-form-section">
          <div className="um-form-grid-full">
            <div className="um-form-group">
              <label>Permission Slug (domain:action) *</label>
              <input type="text" value={permissionFormData.slug} onChange={(e) => setPermissionFormData({...permissionFormData, slug: e.target.value})} placeholder="e.g., children:create, children:read" disabled={isAddingPermission || isUpdatingPermission} />
              <span className="um-helper-text">Format: domain:action (e.g., children:create, admin:read)</span>
            </div>
            <div className="um-form-group">
              <label>Category *</label>
              <select value={permissionFormData.categoryId} onChange={(e) => setPermissionFormData({...permissionFormData, categoryId: e.target.value})} disabled={isAddingPermission || isUpdatingPermission}>
                <option value="">Select Category</option>
                {permissionCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
              </select>
            </div>
            <div className="um-form-group">
              <label>Description</label>
              <textarea rows="4" value={permissionFormData.description} onChange={(e) => setPermissionFormData({...permissionFormData, description: e.target.value})} disabled={isAddingPermission || isUpdatingPermission} />
            </div>
          </div>
        </div>
        <div className="um-form-actions">
          <button className="um-btn-secondary" onClick={() => { setActivePage('permissions'); setEditingPermission(null); resetPermissionForm(); }} disabled={isAddingPermission || isUpdatingPermission}>Cancel</button>
          <button className="um-btn-primary" onClick={editingPermission ? handleUpdatePermission : handleAddPermission} disabled={isAddingPermission || isUpdatingPermission}>
            {isAddingPermission || isUpdatingPermission ? (
              <>
                <span className="um-spinner-small"></span>
                {editingPermission ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              editingPermission ? 'Update Permission' : 'Create Permission'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Render Add/Edit Category Page
  const renderCategoryForm = () => (
    <div className="um-page-content-full">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => { setActivePage('categories'); setEditingCategory(null); resetCategoryForm(); }} disabled={isAddingCategory || isUpdatingCategory}>← Back to Categories</button>
        <h1>{editingCategory ? 'Edit Category' : 'Add New Category'}</h1>
      </div>
      <div className="um-form-container-full">
        <div className="um-form-section">
          <div className="um-form-grid-full">
            <div className="um-form-group">
              <label>Category Name *</label>
              <input type="text" value={categoryFormData.name} onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})} disabled={isAddingCategory || isUpdatingCategory} />
            </div>
            <div className="um-form-group">
              <label>Description</label>
              <textarea rows="4" value={categoryFormData.description} onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})} disabled={isAddingCategory || isUpdatingCategory} />
            </div>
          </div>
        </div>
        <div className="um-form-actions">
          <button className="um-btn-secondary" onClick={() => { setActivePage('categories'); setEditingCategory(null); resetCategoryForm(); }} disabled={isAddingCategory || isUpdatingCategory}>Cancel</button>
          <button className="um-btn-primary" onClick={editingCategory ? handleUpdateCategory : handleAddCategory} disabled={isAddingCategory || isUpdatingCategory}>
            {isAddingCategory || isUpdatingCategory ? (
              <>
                <span className="um-spinner-small"></span>
                {editingCategory ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              editingCategory ? 'Update Category' : 'Create Category'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Render Manage Permissions Page
  const renderManagePermissions = () => {
    const groupedPermissions = getPermissionsByCategory();
    const flattenedPermissions = [];
    Object.keys(groupedPermissions).forEach(category => {
      groupedPermissions[category].forEach(permission => {
        flattenedPermissions.push({ ...permission, category });
      });
    });

    return (
      <div className="um-page-content-full">
        <div className="um-page-header">
          <button className="um-back-btn" onClick={() => { setActivePage('roles'); setSelectedRoleForPermissions(null); setSelectedRolePermissions([]); }} disabled={isManagingPermissions}>← Back to Roles</button>
          <h1>Manage Permissions</h1>
          <p>Assign permissions to role: <strong>{selectedRoleForPermissions?.name}</strong></p>
        </div>
        <div className="um-permissions-manage-container">
          <div className="um-permissions-summary-bar">
            <div className="um-permissions-summary-info">
              <span className="um-permissions-count-badge">{selectedRolePermissions.length} permissions assigned</span>
              <span className="um-permissions-total-badge">out of {availablePermissions.length} total</span>
            </div>
            <p className="um-permissions-note">Check the boxes below to grant or revoke permissions for this role.</p>
          </div>
          <div className="um-permissions-manage-table-container">
            <table className="um-permissions-manage-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>
                    <input 
                      type="checkbox" 
                      className="um-check-all-checkbox" 
                      checked={selectedRolePermissions.length === availablePermissions.length && availablePermissions.length > 0} 
                      onChange={(e) => { 
                        if (e.target.checked) { 
                          setSelectedRolePermissions(availablePermissions.map(p => p.id)); 
                          showToast('All permissions assigned to role', 'success'); 
                        } else { 
                          setSelectedRolePermissions([]); 
                          showToast('All permissions removed from role', 'success'); 
                        } 
                      }} 
                      disabled={isManagingPermissions}
                    />
                  </th>
                  <th>Permission Slug</th>
                  <th>Category</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {flattenedPermissions.map((permission) => (
                  <tr key={permission.id}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        className="um-permission-checkbox-input" 
                        checked={selectedRolePermissions.includes(permission.id)} 
                        onChange={() => togglePermission(permission.id)} 
                        disabled={isManagingPermissions}
                      />
                    </td>
                    <td className="um-permission-name-cell">
                      <code className="um-permission-code">{permission.slug}</code>
                    </td>
                    <td>
                      <span className="um-permission-category-tag">{permission.category}</span>
                    </td>
                    <td className="um-permission-description-cell">{permission.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="um-form-actions">
            <button className="um-btn-secondary" onClick={() => { setActivePage('roles'); setSelectedRoleForPermissions(null); setSelectedRolePermissions([]); }} disabled={isManagingPermissions}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="um-dashboard-loading">
        <div className="um-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <Layout user={user} onLogout={handleLogout}>
      <ToastNotification />
      <div className="um-user-management-container">
        {/* Refresh Indicator */}
        <div className="um-refresh-section">
          <div className="um-refresh-indicator">
            {refreshing ? (
              <span className="um-refreshing">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="um-spinning">
                  <path d="M12 2v4M12 22v-4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M22 12h-4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Refreshing...
              </span>
            ) : lastRefreshed ? (
              <span className="um-last-refreshed">
                {getLastRefreshedText()}
              </span>
            ) : null}
          </div>
          <button 
            className="um-refresh-btn" 
            onClick={handleManualRefresh} 
            disabled={refreshing || isLoading}
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

        {activePage === 'list' && (
          <>
            <div className="um-page-header">
              <h1>User Management</h1>
              <p>Manage system users, roles, and permissions</p>
            </div>
            <div className="um-stats-grid">
              {/* Total Users Card - Clickable */}
              <div 
                className="um-stat-card" 
                onClick={() => !isLoading && setActivePage('users')} 
                style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}
              >
                <div className="um-stat-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21V19C17 16.8 15.2 15 13 15H5C2.8 15 1 16.8 1 19V21"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21V19C22.9 16.8 21.1 15 19 15"/>
                    <path d="M16 3.13C17.2 3.72 18 5.01 18 6.5C18 7.99 17.2 9.28 16 9.87"/>
                  </svg>
                </div>
                <div className="um-stat-info">
                  <h3>{stats.total_users}</h3>
                  <p>Total Users</p>
                </div>
              </div>

              {/* Active Roles Card - Clickable */}
              <div 
                className="um-stat-card" 
                onClick={() => !isLoading && setActivePage('roles')} 
                style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}
              >
                <div className="um-stat-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/>
                    <path d="M12 6V12L16 14"/>
                  </svg>
                </div>
                <div className="um-stat-info">
                  <h3>{stats.active_roles}</h3>
                  <p>Active Roles</p>
                </div>
              </div>

              {/* Online Now Card - Clickable */}
              <div 
                className="um-stat-card" 
                onClick={handleShowOnlineUsers}
                style={{ cursor: loadingOnlineUsers ? 'not-allowed' : 'pointer', opacity: loadingOnlineUsers ? 0.6 : 1 }}
              >
                <div className="um-stat-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="4" fill="currentColor"/>
                  </svg>
                </div>
                <div className="um-stat-info">
                  <h3>{stats.online_now}</h3>
                  <p>Online Now</p>
                </div>
              </div>

              {/* Total Permissions Card - Clickable */}
              <div 
                className="um-stat-card" 
                onClick={() => !isLoading && setActivePage('permissions')} 
                style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}
              >
                <div className="um-stat-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <div className="um-stat-info">
                  <h3>{stats.total_permissions}</h3>
                  <p>Total Permissions</p>
                </div>
              </div>

              {/* Total Categories Card - Clickable */}
              <div 
                className="um-stat-card" 
                onClick={() => !isLoading && setActivePage('categories')} 
                style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}
              >
                <div className="um-stat-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4L20 4"/>
                    <path d="M4 8L20 8"/>
                    <path d="M4 12L14 12"/>
                    <rect x="2" y="2" width="20" height="20" rx="2"/>
                  </svg>
                </div>
                <div className="um-stat-info">
                  <h3>{stats.total_categories}</h3>
                  <p>Total Categories</p>
                </div>
              </div>
            </div>

            <div className="um-section-title">Quick Actions</div>
            <div className="um-actions-grid">
              {/* Manage Users Card - Clickable */}
              <div 
                className="um-action-card" 
                onClick={() => !isLoading && setActivePage('users')}
                style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}
              >
                <div className="um-action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21"/>
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"/>
                  </svg>
                </div>
                <div className="um-action-info">
                  <h4>Manage Users</h4>
                  <p>View, add, edit, or delete system users</p>
                </div>
              </div>

              {/* Manage Roles Card - Clickable */}
              <div 
                className="um-action-card" 
                onClick={() => !isLoading && setActivePage('roles')}
                style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}
              >
                <div className="um-action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/>
                    <path d="M12 6V12L16 14"/>
                  </svg>
                </div>
                <div className="um-action-info">
                  <h4>Manage Roles</h4>
                  <p>Configure roles and permissions</p>
                </div>
              </div>

              {/* Define Permissions Card - Clickable */}
              <div 
                className="um-action-card" 
                onClick={() => !isLoading && setActivePage('permissions')}
                style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}
              >
                <div className="um-action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <div className="um-action-info">
                  <h4>Define Permissions</h4>
                  <p>Create, edit, or delete system permissions</p>
                </div>
              </div>

              {/* Manage Categories Card - Clickable */}
              <div 
                className="um-action-card" 
                onClick={() => !isLoading && setActivePage('categories')}
                style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}
              >
                <div className="um-action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4L20 4"/>
                    <path d="M4 8L20 8"/>
                    <path d="M4 12L14 12"/>
                    <rect x="2" y="2" width="20" height="20" rx="2"/>
                  </svg>
                </div>
                <div className="um-action-info">
                  <h4>Manage Categories</h4>
                  <p>Create, edit, or delete permission categories</p>
                </div>
              </div>
            </div>
          </>
        )}

        {activePage === 'online_users' && renderOnlineUsersPage()}
        {activePage === 'users' && renderUsersList()}
        {activePage === 'add_user' && renderUserForm()}
        {activePage === 'edit_user' && renderUserForm()}
        {activePage === 'view_user' && renderUserViewPage()}
        {activePage === 'reset_password' && renderResetPasswordPage()}
        {activePage === 'roles' && renderRolesList()}
        {activePage === 'add_role' && renderRoleForm()}
        {activePage === 'edit_role' && renderRoleForm()}
        {activePage === 'view_role' && renderRoleViewPage()}
        {activePage === 'permissions' && renderPermissionsList()}
        {activePage === 'add_permission' && renderPermissionForm()}
        {activePage === 'edit_permission' && renderPermissionForm()}
        {activePage === 'view_permission' && renderPermissionViewPage()}
        {activePage === 'categories' && renderCategoriesList()}
        {activePage === 'add_category' && renderCategoryForm()}
        {activePage === 'edit_category' && renderCategoryForm()}
        {activePage === 'view_category' && renderCategoryViewPage()}
        {activePage === 'manage_permissions' && renderManagePermissions()}
      </div>
    </Layout>
  );
};

export default UserManagement;