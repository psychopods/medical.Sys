import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './UserManagement.css';

// API base URL
const API_BASE_URL = 'http://localhost:9865';

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

  const navigate = useNavigate();

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // API Calls - Categories
  const [permissionCategories, setPermissionCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/permission_categories`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setPermissionCategories(data);
        setStats(prev => ({ ...prev, total_categories: data.length }));
        return data;
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
    return [];
  };

  const addCategory = async (categoryData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/permission_categories`, {
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
      const response = await fetch(`${API_BASE_URL}/api/permission_categories/${id}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/permission_categories/${id}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/permissions`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setAvailablePermissions(data);
        setPermissions(data);
        setStats(prev => ({ ...prev, total_permissions: data.length }));
        return data;
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
    return [];
  };

  const addPermission = async (permissionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/permissions`, {
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
      const response = await fetch(`${API_BASE_URL}/api/permissions/${id}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/permissions/${id}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/roles`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
        setStats(prev => ({ ...prev, active_roles: data.length }));
        return data;
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
    return [];
  };

  const addRole = async (roleData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/roles`, {
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
      const response = await fetch(`${API_BASE_URL}/api/roles/${id}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/roles/${id}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setStats(prev => ({ ...prev, total_users: data.length }));
        return data;
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    return [];
  };

  const addUser = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${id}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${id}/reset-password`, {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${id}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/roles/${roleId}/permissions`, {
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
      const response = await fetch(`${API_BASE_URL}/api/roles/${roleId}/permissions`, {
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
      const response = await fetch(`${API_BASE_URL}/api/roles/${roleId}/permissions/${permissionId}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/users/generate_username?year=${currentYear}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/send_credentials`, {
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
      await Promise.all([
        fetchCategories(),
        fetchAllPermissions(),
        fetchRoles(),
        fetchUsers(),
        fetchOnlineUsers()
      ]);
    };
    initData();
  }, []);

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

  const fetchOnlineUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/online_users`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({ ...prev, online_now: data.count || data.length || 0 }));
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
    }
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

  // Category CRUD Operations
  const handleAddCategory = async () => {
    if (!categoryFormData.name.trim()) {
      setCategoryFormErrors({ name: 'Category name is required' });
      return;
    }
    
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
  };

  const handleUpdateCategory = async () => {
    if (!categoryFormData.name.trim()) {
      setCategoryFormErrors({ name: 'Category name is required' });
      return;
    }
    
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
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (window.confirm(`Are you sure you want to delete category "${categoryName}"?`)) {
      const success = await deleteCategory(categoryId);
      if (success) {
        await fetchCategories();
        showToast('Category deleted successfully!', 'success');
      } else {
        showToast('Failed to delete category', 'error');
      }
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
  };

  const handleUpdatePermission = async () => {
    if (!validatePermissionForm()) return;

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
  };

  const handleDeletePermission = async (permissionId, permissionSlug) => {
    if (window.confirm(`Are you sure you want to delete permission "${permissionSlug}"?`)) {
      const success = await deletePermission(permissionId);
      if (success) {
        await fetchAllPermissions();
        showToast('Permission deleted successfully!', 'success');
      } else {
        showToast('Failed to delete permission', 'error');
      }
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
  };

  const handleUpdateRole = async () => {
    if (!validateRoleForm()) return;
    
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
  };

  const handleDeleteRole = async (roleId, roleName) => {
    if (window.confirm(`Are you sure you want to delete role "${roleName}"?`)) {
      const success = await deleteRole(roleId);
      if (success) {
        await fetchRoles();
        showToast('Role deleted successfully!', 'success');
      } else {
        showToast('Failed to delete role', 'error');
      }
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
  };

  const handleUpdateUser = async () => {
    if (!validateUserForm()) return;
    
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
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete ${userName}?`)) {
      const success = await deleteUser(userId);
      if (success) {
        await fetchUsers();
        showToast('User deleted successfully!', 'success');
      } else {
        showToast('Failed to delete user', 'error');
      }
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

  // Render Users List Page with Reset Password button
  const renderUsersList = () => (
    <div className="um-page-content">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => setActivePage('list')}>← Back to Dashboard</button>
        <div className="um-header-actions">
          <h1>System Users</h1>
          <button className="um-add-btn" onClick={() => setActivePage('add_user')}>
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
                    <button className="um-action-btn um-edit-btn" onClick={() => handleEditUser(userItem)} title="Edit User">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3L21 7L7 21H3V17L17 3Z"/>
                      </svg>
                    </button>
                    <button className="um-action-btn um-reset-password-btn" onClick={() => handleResetPasswordClick(userItem)} title="Reset Password">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 2L15 8" strokeWidth="2"/>
                        <path d="M21 2L15 8" strokeWidth="2" transform="translate(0, 14)"/>
                        <path d="M12 22C7 22 3 18 3 13" strokeWidth="2"/>
                        <path d="M12 2C7 2 3 6 3 11" strokeWidth="2"/>
                        <circle cx="18" cy="5" r="2" fill="currentColor"/>
                        <circle cx="18" cy="19" r="2" fill="currentColor"/>
                      </svg>
                    </button>
                    <button className="um-action-btn um-delete-btn" onClick={() => handleDeleteUser(userItem.id, userItem.username)} title="Delete User">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7H20" strokeWidth="2"/>
                        <path d="M10 11V17" strokeWidth="2"/>
                        <path d="M14 11V17" strokeWidth="2"/>
                        <path d="M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" strokeWidth="2"/>
                        <path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" strokeWidth="2"/>
                      </svg>
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

  // Reset Password Page - Designed like Add New User (no cards, no shadows, full width)
  const renderResetPasswordPage = () => (
    <div className="um-page-content-full">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => { setActivePage('users'); setResettingUser(null); setNewPassword(''); setConfirmPassword(''); }}>← Back to Users</button>
        <h1>Reset User Password</h1>
        <p>Reset password for user account. New credentials will be sent via email.</p>
      </div>
      
      <div className="um-form-container-full">
        {/* User Information Section - Simple info display */}
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

        {/* Password Form */}
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
                />
                <button type="button" className="um-password-toggle" onClick={() => setShowNewPassword(!showNewPassword)}>
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
                />
              </div>
            </div>

            {/* Password Requirements Checklist */}
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
          <button className="um-btn-secondary" onClick={() => { setActivePage('users'); setResettingUser(null); setNewPassword(''); setConfirmPassword(''); }}>
            Cancel
          </button>
          <button className="um-btn-primary" onClick={handleResetPassword}>
            Reset Password & Send Email
          </button>
        </div>
      </div>
    </div>
  );

  // Render Add/Edit User Page
  const renderUserForm = () => (
    <div className="um-page-content-full">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => { setActivePage('users'); setEditingUser(null); resetForm(); }}>← Back to Users</button>
        <h1>{editingUser ? 'Edit User' : 'Add New User'}</h1>
        <p>{editingUser ? 'Update user information' : 'Create a new system user account. Credentials will be sent via email.'}</p>
      </div>
      <div className="um-form-container-full">
        <div className="um-form-grid-full">
          <div className="um-form-group">
            <label>Username (Auto-generated) *</label>
            <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} readOnly={!editingUser} style={!editingUser ? { background: '#f0f0f0' } : {}} />
            {!editingUser && <span className="um-helper-text">Username automatically generated in format: ST-YYYY-XXXX</span>}
          </div>
          <div className="um-form-group"><label>Email *</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
          <div className="um-form-group"><label>First Name *</label><input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} /></div>
          <div className="um-form-group"><label>Last Name *</label><input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} /></div>
          <div className="um-form-group"><label>Phone Number</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
          {!editingUser && (
            <div className="um-form-group">
              <label>Temporary Password *</label>
              <div className="um-password-wrapper">
                <input type={showPassword ? "text" : "password"} value={formData.password} readOnly style={{ background: '#f0f0f0' }} />
                <button type="button" className="um-password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>
              </div>
            </div>
          )}
          <div className="um-form-group">
            <label>Role *</label>
            <select value={formData.roleId} onChange={(e) => setFormData({...formData, roleId: e.target.value})}>
              <option value="">Select Role</option>
              {roles.map(role => (<option key={role.id} value={role.id}>{role.name}</option>))}
            </select>
          </div>
        </div>
        <div className="um-form-actions">
          <button className="um-btn-secondary" onClick={() => { setActivePage('users'); setEditingUser(null); resetForm(); }}>Cancel</button>
          <button className="um-btn-primary" onClick={editingUser ? handleUpdateUser : handleAddUser}>{editingUser ? 'Update User' : 'Add User'}</button>
        </div>
      </div>
    </div>
  );

  // Render Roles List Page
  const renderRolesList = () => (
    <div className="um-page-content">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => setActivePage('list')}>← Back to Dashboard</button>
        <div className="um-header-actions">
          <h1>System Roles</h1>
          <div className="um-header-buttons">
            <button className="um-add-btn" onClick={() => setActivePage('add_role')}>Add New Role</button>
          </div>
        </div>
      </div>
      <div className="um-roles-table-container">
        <table className="um-data-table">
          <thead><tr><th>S/N</th><th>Role Name</th><th>Description</th><th>Actions</th></tr></thead>
          <tbody>
            {roles.map((role, index) => (
              <tr key={role.id}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td><strong>{role.name}</strong></td>
                <td>{role.description}</td>
                <td>
                  <button className="um-action-btn um-permission-btn" onClick={() => handleManagePermissions(role)} title="Manage Permissions">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg>
                  </button>
                  <button className="um-action-btn um-edit-btn" onClick={() => handleEditRole(role)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3L21 7L7 21H3V17L17 3Z"/></svg>
                  </button>
                  <button className="um-action-btn um-delete-btn" onClick={() => handleDeleteRole(role.id, role.name)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7H20" strokeWidth="2"/><path d="M10 11V17" strokeWidth="2"/><path d="M14 11V17" strokeWidth="2"/><path d="M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" strokeWidth="2"/><path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" strokeWidth="2"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Add/Edit Role Page
  const renderRoleForm = () => (
    <div className="um-page-content-full">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => { setActivePage('roles'); setEditingRole(null); resetRoleForm(); }}>← Back to Roles</button>
        <h1>{editingRole ? 'Edit Role' : 'Add New Role'}</h1>
      </div>
      <div className="um-form-container-full">
        <div className="um-form-section">
          <div className="um-form-grid-full">
            <div className="um-form-group"><label>Role Name *</label><input type="text" value={roleFormData.name} onChange={(e) => setRoleFormData({...roleFormData, name: e.target.value})} /></div>
            <div className="um-form-group"><label>Description</label><textarea rows="3" value={roleFormData.description} onChange={(e) => setRoleFormData({...roleFormData, description: e.target.value})} /></div>
          </div>
        </div>
        <div className="um-form-actions">
          <button className="um-btn-secondary" onClick={() => { setActivePage('roles'); setEditingRole(null); resetRoleForm(); }}>Cancel</button>
          <button className="um-btn-primary" onClick={editingRole ? handleUpdateRole : handleAddRole}>{editingRole ? 'Update Role' : 'Create Role'}</button>
        </div>
      </div>
    </div>
  );

  // Render Permissions List Page
  const renderPermissionsList = () => (
    <div className="um-page-content">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => setActivePage('list')}>← Back to Dashboard</button>
        <div className="um-header-actions">
          <h1>System Permissions</h1>
          <button className="um-add-btn" onClick={() => { setEditingPermission(null); resetPermissionForm(); setActivePage('add_permission'); }}>Define New Permission</button>
        </div>
      </div>
      <div className="um-permissions-table-container">
        <table className="um-data-table">
          <thead><tr><th>Category</th><th>Permission Slug</th><th>Description</th><th>Actions</th></tr></thead>
          <tbody>
            {availablePermissions.map((permission) => {
              const category = permissionCategories.find(c => c.id === permission.categoryId);
              return (
                <tr key={permission.id}>
                  <td>{category ? category.name : 'Uncategorized'}</td>
                  <td><code className="um-code-tag">{permission.slug}</code></td>
                  <td>{permission.description}</td>
                  <td>
                    <button className="um-action-btn um-edit-btn" onClick={() => handleEditPermission(permission)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3L21 7L7 21H3V17L17 3Z"/></svg>
                    </button>
                    <button className="um-action-btn um-delete-btn" onClick={() => handleDeletePermission(permission.id, permission.slug)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7H20" strokeWidth="2"/><path d="M10 11V17" strokeWidth="2"/><path d="M14 11V17" strokeWidth="2"/><path d="M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" strokeWidth="2"/><path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" strokeWidth="2"/></svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Add/Edit Permission Page
  const renderPermissionForm = () => (
    <div className="um-page-content-full">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => { setActivePage('permissions'); setEditingPermission(null); resetPermissionForm(); }}>← Back to Permissions</button>
        <h1>{editingPermission ? 'Edit Permission' : 'Define New Permission'}</h1>
      </div>
      <div className="um-form-container-full">
        <div className="um-form-section">
          <div className="um-form-grid-full">
            <div className="um-form-group"><label>Permission Slug (domain:action) *</label><input type="text" value={permissionFormData.slug} onChange={(e) => setPermissionFormData({...permissionFormData, slug: e.target.value})} placeholder="e.g., children:create, children:read" /><span className="um-helper-text">Format: domain:action (e.g., children:create, admin:read)</span></div>
            <div className="um-form-group"><label>Category *</label><select value={permissionFormData.categoryId} onChange={(e) => setPermissionFormData({...permissionFormData, categoryId: e.target.value})}><option value="">Select Category</option>{permissionCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}</select></div>
            <div className="um-form-group"><label>Description</label><textarea rows="4" value={permissionFormData.description} onChange={(e) => setPermissionFormData({...permissionFormData, description: e.target.value})} /></div>
          </div>
        </div>
        <div className="um-form-actions">
          <button className="um-btn-secondary" onClick={() => { setActivePage('permissions'); setEditingPermission(null); resetPermissionForm(); }}>Cancel</button>
          <button className="um-btn-primary" onClick={editingPermission ? handleUpdatePermission : handleAddPermission}>{editingPermission ? 'Update Permission' : 'Create Permission'}</button>
        </div>
      </div>
    </div>
  );

  // Render Categories List Page
  const renderCategoriesList = () => (
    <div className="um-page-content">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => setActivePage('list')}>← Back to Dashboard</button>
        <div className="um-header-actions">
          <h1>Permission Categories</h1>
          <button className="um-add-btn" onClick={() => { setEditingCategory(null); resetCategoryForm(); setActivePage('add_category'); }}>Add New Category</button>
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
                  <button className="um-action-btn um-edit-btn" onClick={() => handleEditCategory(category)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3L21 7L7 21H3V17L17 3Z"/></svg>
                  </button>
                  <button className="um-action-btn um-delete-btn" onClick={() => handleDeleteCategory(category.id, category.name)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7H20" strokeWidth="2"/><path d="M10 11V17" strokeWidth="2"/><path d="M14 11V17" strokeWidth="2"/><path d="M5 7L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 7" strokeWidth="2"/><path d="M9 7V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V7" strokeWidth="2"/></svg>
                  </button>
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

  // Render Add/Edit Category Page
  const renderCategoryForm = () => (
    <div className="um-page-content-full">
      <div className="um-page-header">
        <button className="um-back-btn" onClick={() => { setActivePage('categories'); setEditingCategory(null); resetCategoryForm(); }}>← Back to Categories</button>
        <h1>{editingCategory ? 'Edit Category' : 'Add New Category'}</h1>
      </div>
      <div className="um-form-container-full">
        <div className="um-form-section">
          <div className="um-form-grid-full">
            <div className="um-form-group"><label>Category Name *</label><input type="text" value={categoryFormData.name} onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})} /></div>
            <div className="um-form-group"><label>Description</label><textarea rows="4" value={categoryFormData.description} onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})} /></div>
          </div>
        </div>
        <div className="um-form-actions">
          <button className="um-btn-secondary" onClick={() => { setActivePage('categories'); setEditingCategory(null); resetCategoryForm(); }}>Cancel</button>
          <button className="um-btn-primary" onClick={editingCategory ? handleUpdateCategory : handleAddCategory}>{editingCategory ? 'Update Category' : 'Create Category'}</button>
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
          <button className="um-back-btn" onClick={() => { setActivePage('roles'); setSelectedRoleForPermissions(null); setSelectedRolePermissions([]); }}>← Back to Roles</button>
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
            <button className="um-btn-secondary" onClick={() => { setActivePage('roles'); setSelectedRoleForPermissions(null); setSelectedRolePermissions([]); }}>Close</button>
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
        {activePage === 'list' && (
          <>
            <div className="um-page-header">
              <h1>User Management</h1>
              <p>Manage system users, roles, and permissions</p>
            </div>
            <div className="um-stats-grid">
              <div className="um-stat-card"><div className="um-stat-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21V19C17 16.8 15.2 15 13 15H5C2.8 15 1 16.8 1 19V21"/><circle cx="9" cy="7" r="4"/><path d="M23 21V19C22.9 16.8 21.1 15 19 15"/><path d="M16 3.13C17.2 3.72 18 5.01 18 6.5C18 7.99 17.2 9.28 16 9.87"/></svg></div><div className="um-stat-info"><h3>{stats.total_users}</h3><p>Total Users</p></div></div>
              <div className="um-stat-card"><div className="um-stat-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/><path d="M12 6V12L16 14"/></svg></div><div className="um-stat-info"><h3>{stats.active_roles}</h3><p>Active Roles</p></div></div>
              <div className="um-stat-card"><div className="um-stat-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg></div><div className="um-stat-info"><h3>{stats.online_now}</h3><p>Online Now</p></div></div>
              <div className="um-stat-card"><div className="um-stat-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/><path d="M12 6v6l4 2"/></svg></div><div className="um-stat-info"><h3>{stats.total_permissions}</h3><p>Total Permissions</p></div></div>
              <div className="um-stat-card"><div className="um-stat-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4L20 4"/><path d="M4 8L20 8"/><path d="M4 12L14 12"/><rect x="2" y="2" width="20" height="20" rx="2"/></svg></div><div className="um-stat-info"><h3>{stats.total_categories}</h3><p>Total Categories</p></div></div>
            </div>
            <div className="um-section-title">Quick Actions</div>
            <div className="um-actions-grid">
              <div className="um-action-card" onClick={() => setActivePage('users')}><div className="um-action-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21"/><path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"/></svg></div><div className="um-action-info"><h4>Manage Users</h4><p>View, add, edit, or delete system users</p></div></div>
              <div className="um-action-card" onClick={() => setActivePage('roles')}><div className="um-action-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"/><path d="M12 6V12L16 14"/></svg></div><div className="um-action-info"><h4>Manage Roles</h4><p>Configure roles and permissions</p></div></div>
              <div className="um-action-card" onClick={() => setActivePage('permissions')}><div className="um-action-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg></div><div className="um-action-info"><h4>Define Permissions</h4><p>Create, edit, or delete system permissions</p></div></div>
              <div className="um-action-card" onClick={() => setActivePage('categories')}><div className="um-action-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4L20 4"/><path d="M4 8L20 8"/><path d="M4 12L14 12"/><rect x="2" y="2" width="20" height="20" rx="2"/></svg></div><div className="um-action-info"><h4>Manage Categories</h4><p>Create, edit, or delete permission categories</p></div></div>
            </div>
          </>
        )}

        {activePage === 'users' && renderUsersList()}
        {activePage === 'add_user' && renderUserForm()}
        {activePage === 'edit_user' && renderUserForm()}
        {activePage === 'reset_password' && renderResetPasswordPage()}
        {activePage === 'roles' && renderRolesList()}
        {activePage === 'add_role' && renderRoleForm()}
        {activePage === 'edit_role' && renderRoleForm()}
        {activePage === 'permissions' && renderPermissionsList()}
        {activePage === 'add_permission' && renderPermissionForm()}
        {activePage === 'edit_permission' && renderPermissionForm()}
        {activePage === 'categories' && renderCategoriesList()}
        {activePage === 'add_category' && renderCategoryForm()}
        {activePage === 'edit_category' && renderCategoryForm()}
        {activePage === 'manage_permissions' && renderManagePermissions()}
      </div>
    </Layout>
  );
};

export default UserManagement;