import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import './GalleryAdmin.css';

const API_BASE_URL = 'http://localhost:9865';
const API_TIMEOUT = 10000;

const GalleryAdmin = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [galleryItems, setGalleryItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activePage, setActivePage] = useState('list');
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [formData, setFormData] = useState({
    id: '',
    mediaType: 'image',
    categoryKey: '',
    title: '',
    description: '',
    imageUrl: '',
    thumbnailUrl: '',
    videoUrl: ''
  });
  const [categoryFormData, setCategoryFormData] = useState({
    categoryKey: '',
    categoryName: '',
    categoryIcon: 'outreach'
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

  const IconImage = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="20" rx="2"/>
      <circle cx="8.5" cy="8.5" r="2.5"/>
      <path d="M21 15L16 10L5 21"/>
    </svg>
  );

  const IconVideo = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <polygon points="10,8 16,12 10,16" fill="currentColor"/>
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

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/gallery/categories`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        const mappedCategories = data.categories.map(cat => ({
          category_key: cat.categoryKey,
          category_name: cat.categoryName,
          category_icon: cat.categoryIcon
        }));
        setCategories(mappedCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch all gallery items
  const fetchGalleryItems = async () => {
    setLoading(true);
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/gallery/items`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        const mappedItems = data.items.map(item => ({
          id: item.id,
          media_type: item.mediaType,
          category_key: item.categoryKey,
          title: item.title,
          description: item.description,
          image_url: item.imageUrl,
          thumbnail_url: item.thumbnailUrl,
          video_url: item.videoUrl,
          created_at: item.createdAt
        }));
        setGalleryItems(mappedItems);
      }
    } catch (error) {
      console.error('Error fetching gallery items:', error);
      showToastMessage('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Create new gallery item
  const createGalleryItem = async (itemData) => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/gallery/items`, {
        method: 'POST',
        body: JSON.stringify(itemData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToastMessage('Gallery item created successfully');
        fetchGalleryItems();
        setActivePage('items');
        return true;
      } else {
        showToastMessage(data.message || 'Failed to create item', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error creating item:', error);
      showToastMessage('Network error', 'error');
      return false;
    }
  };

  // Update gallery item
  const updateGalleryItem = async (id, itemData) => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/gallery/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(itemData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToastMessage('Gallery item updated successfully');
        fetchGalleryItems();
        setActivePage('items');
        return true;
      } else {
        showToastMessage(data.message || 'Failed to update item', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error updating item:', error);
      showToastMessage('Network error', 'error');
      return false;
    }
  };

  // Delete gallery item
  const deleteGalleryItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/gallery/items/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToastMessage('Gallery item deleted successfully');
        fetchGalleryItems();
      } else {
        showToastMessage(data.message || 'Failed to delete item', 'error');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      showToastMessage('Network error', 'error');
    }
  };

  // Create category
  const createCategory = async () => {
    if (!categoryFormData.categoryKey || !categoryFormData.categoryName) {
      showToastMessage('Please fill in all required fields', 'error');
      return;
    }
    
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/gallery/categories`, {
        method: 'POST',
        body: JSON.stringify({
          categoryKey: categoryFormData.categoryKey.toLowerCase().replace(/\s/g, '_'),
          categoryName: categoryFormData.categoryName,
          categoryIcon: categoryFormData.categoryIcon
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToastMessage('Category created successfully');
        fetchCategories();
        setActivePage('categories');
        resetCategoryForm();
      } else {
        showToastMessage(data.message || 'Failed to create category', 'error');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      showToastMessage('Network error', 'error');
    }
  };

  // Update category
  const updateCategory = async () => {
    if (!categoryFormData.categoryName) {
      showToastMessage('Category name is required', 'error');
      return;
    }
    
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/gallery/categories/${editingCategory.category_key}`, {
        method: 'PUT',
        body: JSON.stringify({
          categoryName: categoryFormData.categoryName,
          categoryIcon: categoryFormData.categoryIcon
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToastMessage('Category updated successfully');
        fetchCategories();
        setActivePage('categories');
        setEditingCategory(null);
        resetCategoryForm();
      } else {
        showToastMessage(data.message || 'Failed to update category', 'error');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      showToastMessage('Network error', 'error');
    }
  };

  // Delete category
  const deleteCategory = async (categoryKey) => {
    if (!window.confirm(`Delete category "${categoryKey}"? This will fail if category has items.`)) {
      return;
    }
    
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/gallery/categories/${categoryKey}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showToastMessage('Category deleted successfully');
        fetchCategories();
        fetchGalleryItems();
      } else {
        showToastMessage(data.message || 'Failed to delete category', 'error');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showToastMessage('Network error', 'error');
    }
  };

  // Handle form submit for gallery item
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.categoryKey) {
      showToastMessage('Please fill in all required fields', 'error');
      return;
    }
    
    if (formData.mediaType === 'image' && !formData.imageUrl) {
      showToastMessage('Image URL is required for images', 'error');
      return;
    }
    
    if (formData.mediaType === 'video' && !formData.videoUrl) {
      showToastMessage('Video URL is required for videos', 'error');
      return;
    }
    
    const itemData = {
      id: editingItem ? editingItem.id : crypto.randomUUID(),
      mediaType: formData.mediaType,
      categoryKey: formData.categoryKey,
      title: formData.title,
      description: formData.description,
      imageUrl: formData.mediaType === 'image' ? formData.imageUrl : null,
      thumbnailUrl: formData.thumbnailUrl || null,
      videoUrl: formData.mediaType === 'video' ? formData.videoUrl : null
    };
    
    if (editingItem) {
      await updateGalleryItem(editingItem.id, itemData);
    } else {
      await createGalleryItem(itemData);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      id: '',
      mediaType: 'image',
      categoryKey: '',
      title: '',
      description: '',
      imageUrl: '',
      thumbnailUrl: '',
      videoUrl: ''
    });
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryFormData({
      categoryKey: '',
      categoryName: '',
      categoryIcon: 'outreach'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  // Get category name by key
  const getCategoryName = (categoryKey) => {
    const category = categories.find(cat => cat.category_key === categoryKey);
    return category ? category.category_name : categoryKey;
  };

  // Get item count for category
  const getItemCountForCategory = (categoryKey) => {
    return galleryItems.filter(item => item.category_key === categoryKey).length;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
    
    fetchCategories();
    fetchGalleryItems();
  }, [navigate]);

  // ============================================
  // CATEGORY VIEW PAGE
  // ============================================
  const renderCategoryViewPage = () => (
    <div className="ga-page">
      <div className="ga-header">
        <button className="ga-back-btn" onClick={() => setActivePage('categories')}>
          <IconBack /> Back to Categories
        </button>
        <div className="ga-header-title">
          <h2>Category Details</h2>
        </div>
      </div>

      {viewingCategory && (
        <div className="ga-view-container">
          <div className="ga-view-section">
            <div className="ga-view-info-grid">
              <div className="ga-view-info-item">
                <label>Category Key:</label>
                <span>{viewingCategory.category_key}</span>
              </div>
              <div className="ga-view-info-item">
                <label>Category Name:</label>
                <span>{viewingCategory.category_name}</span>
              </div>
              <div className="ga-view-info-item">
                <label>Icon:</label>
                <span>{viewingCategory.category_icon}</span>
              </div>
              <div className="ga-view-info-item">
                <label>Total Items:</label>
                <span>{getItemCountForCategory(viewingCategory.category_key)} items</span>
              </div>
            </div>
          </div>

          <div className="ga-view-section">
            <h3>Items in this Category</h3>
            {loading ? (
              <div className="ga-loading">Loading items...</div>
            ) : (
              <div className="ga-items-in-category">
                {galleryItems.filter(item => item.category_key === viewingCategory.category_key).length === 0 ? (
                  <p className="ga-empty-message">No items found in this category.</p>
                ) : (
                  <div className="ga-items-grid">
                    {galleryItems.filter(item => item.category_key === viewingCategory.category_key).map(item => (
                      <div key={item.id} className="ga-item-card" onClick={() => {
                        setViewingItem(item);
                        setActivePage('view_item');
                      }}>
                        {item.media_type === 'image' && item.image_url && (
                          <img src={item.image_url} alt={item.title} />
                        )}
                        {item.media_type === 'video' && (
                          <div className="ga-video-thumb">
                            <IconVideo />
                            <span>Video</span>
                          </div>
                        )}
                        <div className="ga-item-card-info">
                          <h4>{item.title}</h4>
                          <p>{item.description.substring(0, 60)}...</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="ga-view-actions">
            <button 
              className="ga-btn ga-btn-primary" 
              onClick={() => {
                setEditingCategory(viewingCategory);
                setCategoryFormData({
                  categoryKey: viewingCategory.category_key,
                  categoryName: viewingCategory.category_name,
                  categoryIcon: viewingCategory.category_icon
                });
                setActivePage('edit_category');
              }}
            >
              Edit Category
            </button>
            <button 
              className="ga-btn ga-btn-secondary" 
              onClick={() => setActivePage('categories')}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ============================================
  // GALLERY ITEM VIEW PAGE
  // ============================================
  const renderGalleryItemViewPage = () => (
    <div className="ga-page">
      <div className="ga-header">
        <button className="ga-back-btn" onClick={() => setActivePage('items')}>
          <IconBack /> Back to Gallery Items
        </button>
        <div className="ga-header-title">
          <h2>Gallery Item Details</h2>
        </div>
      </div>

      {viewingItem && (
        <div className="ga-view-container">
          <div className="ga-view-section">
            <div className="ga-view-media">
              {viewingItem.media_type === 'image' && viewingItem.image_url && (
                <img src={viewingItem.image_url} alt={viewingItem.title} className="ga-view-image" />
              )}
              {viewingItem.media_type === 'video' && viewingItem.video_url && (
                <div className="ga-view-video">
                  <iframe
                    src={viewingItem.video_url}
                    title={viewingItem.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
            </div>
          </div>

          <div className="ga-view-section">
            <div className="ga-view-info-grid">
              <div className="ga-view-info-item">
                <label>Title:</label>
                <span>{viewingItem.title}</span>
              </div>
              <div className="ga-view-info-item">
                <label>Media Type:</label>
                <span className="ga-media-badge">
                  {viewingItem.media_type === 'image' ? <IconImage /> : <IconVideo />}
                  {viewingItem.media_type}
                </span>
              </div>
              <div className="ga-view-info-item">
                <label>Category:</label>
                <span className="ga-category-tag">{getCategoryName(viewingItem.category_key)}</span>
              </div>
              <div className="ga-view-info-item">
                <label>Created Date:</label>
                <span>{viewingItem.created_at ? new Date(viewingItem.created_at).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="ga-view-info-item full-width">
                <label>Description:</label>
                <p>{viewingItem.description}</p>
              </div>
              {viewingItem.thumbnail_url && (
                <div className="ga-view-info-item">
                  <label>Thumbnail:</label>
                  <img src={viewingItem.thumbnail_url} alt="Thumbnail" className="ga-view-thumbnail" />
                </div>
              )}
              {viewingItem.media_type === 'image' && viewingItem.image_url && (
                <div className="ga-view-info-item">
                  <label>Image URL:</label>
                  <a href={viewingItem.image_url} target="_blank" rel="noopener noreferrer">{viewingItem.image_url}</a>
                </div>
              )}
              {viewingItem.media_type === 'video' && viewingItem.video_url && (
                <div className="ga-view-info-item">
                  <label>Video URL:</label>
                  <a href={viewingItem.video_url} target="_blank" rel="noopener noreferrer">{viewingItem.video_url}</a>
                </div>
              )}
            </div>
          </div>

          <div className="ga-view-actions">
            <button 
              className="ga-btn ga-btn-primary" 
              onClick={() => {
                setEditingItem(viewingItem);
                setFormData({
                  id: viewingItem.id,
                  mediaType: viewingItem.media_type,
                  categoryKey: viewingItem.category_key,
                  title: viewingItem.title,
                  description: viewingItem.description,
                  imageUrl: viewingItem.image_url || '',
                  thumbnailUrl: viewingItem.thumbnail_url || '',
                  videoUrl: viewingItem.video_url || ''
                });
                setActivePage('edit_item');
              }}
            >
              Edit Item
            </button>
            <button 
              className="ga-btn ga-btn-secondary" 
              onClick={() => setActivePage('items')}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ============================================
  // RENDER CATEGORIES LIST WITH VIEW BUTTON
  // ============================================
  const renderCategoriesList = () => (
    <div className="ga-page">
      <div className="ga-header">
        <button className="ga-back-btn" onClick={() => setActivePage('list')}>
          <IconBack /> Back
        </button>
        <div className="ga-header-title">
          <h2>Categories</h2>
          <button className="ga-add-btn" onClick={() => {
            resetCategoryForm();
            setActivePage('add_category');
          }}>
            <IconAdd /> Add Category
          </button>
        </div>
      </div>
      
      <div className="ga-table-wrapper">
        <table className="ga-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Key</th>
              <th>Icon</th>
              <th>Items</th>
              <th width="140">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category, index) => (
              <tr key={category.category_key}>
                <td>{index + 1}</td>
                <td><strong>{category.category_name}</strong></td>
                <td>{category.category_key}</td>
                <td>{category.category_icon}</td>
                <td>{getItemCountForCategory(category.category_key)}</td>
                <td>
                  <div className="ga-action-buttons">
                    <button className="ga-action-btn ga-view" onClick={() => {
                      setViewingCategory(category);
                      setActivePage('view_category');
                    }}>
                      <IconView /> View
                    </button>
                    <button className="ga-action-btn ga-edit" onClick={() => {
                      setEditingCategory(category);
                      setCategoryFormData({
                        categoryKey: category.category_key,
                        categoryName: category.category_name,
                        categoryIcon: category.category_icon
                      });
                      setActivePage('edit_category');
                    }}>
                      <IconEdit /> Edit
                    </button>
                    <button className="ga-action-btn ga-delete" onClick={() => deleteCategory(category.category_key)}>
                      <IconDelete /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan="6" className="ga-empty">No categories found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ============================================
  // RENDER GALLERY ITEMS LIST WITH VIEW BUTTON
  // ============================================
  const renderGalleryItemsList = () => (
    <div className="ga-page">
      <div className="ga-header">
        <button className="ga-back-btn" onClick={() => setActivePage('list')}>
          <IconBack /> Back
        </button>
        <div className="ga-header-title">
          <h2>Gallery Items</h2>
          <button className="ga-add-btn" onClick={() => {
            resetForm();
            setActivePage('add_item');
          }}>
            <IconAdd /> Add Item
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="ga-loading">Loading...</div>
      ) : (
        <div className="ga-table-wrapper">
          <table className="ga-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Description</th>
                <th>Category</th>
                <th>Created</th>
                <th width="160">Actions</th>
              </tr>
            </thead>
            <tbody>
              {galleryItems.map((item) => (
                <tr key={item.id}>
                  <td className="ga-type-cell">
                    {item.media_type === 'image' ? <IconImage /> : <IconVideo />}
                    <span>{item.media_type}</span>
                   </td>
                  <td className="ga-title-cell">
                    <strong>{item.title}</strong>
                    {item.media_type === 'image' && item.image_url && (
                      <div className="ga-thumb-preview">
                        <img src={item.image_url} alt={item.title} />
                      </div>
                    )}
                   </td>
                  <td className="ga-desc-cell">{item.description}</td>
                  <td><span className="ga-category-tag">{getCategoryName(item.category_key)}</span></td>
                  <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <div className="ga-action-buttons">
                      <button className="ga-action-btn ga-view" onClick={() => {
                        setViewingItem(item);
                        setActivePage('view_item');
                      }}>
                        <IconView /> View
                      </button>
                      <button className="ga-action-btn ga-edit" onClick={() => {
                        setEditingItem(item);
                        setFormData({
                          id: item.id,
                          mediaType: item.media_type,
                          categoryKey: item.category_key,
                          title: item.title,
                          description: item.description,
                          imageUrl: item.image_url || '',
                          thumbnailUrl: item.thumbnail_url || '',
                          videoUrl: item.video_url || ''
                        });
                        setActivePage('edit_item');
                      }}>
                        <IconEdit /> Edit
                      </button>
                      <button className="ga-action-btn ga-delete" onClick={() => deleteGalleryItem(item.id)}>
                        <IconDelete /> Delete
                      </button>
                    </div>
                   </td>
                 </tr>
              ))}
              {galleryItems.length === 0 && (
                <tr>
                  <td colSpan="6" className="ga-empty">No gallery items found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Render Category Form Page (Full Width)
  const renderCategoryForm = () => (
    <div className="ga-page-full">
      <div className="ga-header">
        <button className="ga-back-btn" onClick={() => {
          setActivePage('categories');
          resetCategoryForm();
        }}>
          <IconBack /> Back to Categories
        </button>
        <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
      </div>
      
      <div className="ga-form-full">
        <form onSubmit={(e) => { e.preventDefault(); editingCategory ? updateCategory() : createCategory(); }} className="ga-form">
          <div className="ga-form-row">
            <div className="ga-form-group">
              <label>Category Key</label>
              <input
                type="text"
                value={categoryFormData.categoryKey}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, categoryKey: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                required
                placeholder="e.g., outreach, medical"
                disabled={editingCategory}
              />
              {!editingCategory && <small>Unique identifier (lowercase, underscores for spaces)</small>}
            </div>
            
            <div className="ga-form-group">
              <label>Category Name</label>
              <input
                type="text"
                value={categoryFormData.categoryName}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, categoryName: e.target.value })}
                required
                placeholder="Display name"
              />
            </div>
            
            <div className="ga-form-group">
              <label>Category Icon</label>
              <select
                value={categoryFormData.categoryIcon}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, categoryIcon: e.target.value })}
              >
                <option value="outreach">outreach</option>
                <option value="medical">medical</option>
                <option value="healthcare">healthcare</option>
                <option value="campaign">campaign</option>
                <option value="team">team</option>
                <option value="impact">impact</option>
              </select>
            </div>
          </div>
          
          <div className="ga-buttons">
            <button type="button" className="ga-btn ga-btn-secondary" onClick={() => {
              setActivePage('categories');
              resetCategoryForm();
            }}>
              Cancel
            </button>
            <button type="submit" className="ga-btn ga-btn-primary">
              {editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Render Gallery Item Form Page (Full Width)
  const renderGalleryItemForm = () => (
    <div className="ga-page-full">
      <div className="ga-header">
        <button className="ga-back-btn" onClick={() => {
          setActivePage('items');
          resetForm();
        }}>
          <IconBack /> Back to Gallery Items
        </button>
        <h2>{editingItem ? 'Edit Gallery Item' : 'Add New Gallery Item'}</h2>
      </div>
      
      <div className="ga-form-full">
        <form onSubmit={handleSubmit} className="ga-form">
          <div className="ga-form-row">
            <div className="ga-form-group">
              <label>Media Type</label>
              <select
                value={formData.mediaType}
                onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                required
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
            
            <div className="ga-form-group">
              <label>Category</label>
              <select
                value={formData.categoryKey}
                onChange={(e) => setFormData({ ...formData, categoryKey: e.target.value })}
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.category_key} value={cat.category_key}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="ga-form-row">
            <div className="ga-form-group">
              <label>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Enter title"
              />
            </div>
          </div>
          
          <div className="ga-form-row">
            <div className="ga-form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows="4"
                placeholder="Enter description"
              />
            </div>
          </div>
          
          {formData.mediaType === 'image' && (
            <>
              <div className="ga-form-row">
                <div className="ga-form-group">
                  <label>Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    required
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div className="ga-form-group">
                  <label>Thumbnail URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                </div>
              </div>
              
              {formData.imageUrl && (
                <div className="ga-form-row">
                  <div className="ga-preview">
                    <label>Preview:</label>
                    <img src={formData.imageUrl} alt="Preview" />
                  </div>
                </div>
              )}
            </>
          )}
          
          {formData.mediaType === 'video' && (
            <>
              <div className="ga-form-row">
                <div className="ga-form-group">
                  <label>Video URL</label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    required
                    placeholder="https://www.youtube.com/embed/VIDEO_ID"
                  />
                  <small>Use embed URL from YouTube or Vimeo</small>
                </div>
                
                <div className="ga-form-group">
                  <label>Thumbnail URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                </div>
              </div>
            </>
          )}
          
          <div className="ga-buttons">
            <button type="button" className="ga-btn ga-btn-secondary" onClick={() => {
              setActivePage('items');
              resetForm();
            }}>
              Cancel
            </button>
            <button type="submit" className="ga-btn ga-btn-primary">
              {editingItem ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Render Dashboard List Page
  const renderDashboardList = () => (
    <div className="ga-page">
      <div className="ga-dashboard-header">
        <h1>Gallery Management</h1>
        <p>Manage your gallery categories and media items</p>
      </div>
      
      <div className="ga-dashboard-links">
        <div className="ga-dash-link" onClick={() => { fetchCategories(); setActivePage('categories'); }}>
          <div className="ga-dash-link-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="8" height="8" rx="1"/>
              <rect x="13" y="3" width="8" height="8" rx="1"/>
              <rect x="3" y="13" width="8" height="8" rx="1"/>
              <rect x="13" y="13" width="8" height="8" rx="1"/>
            </svg>
          </div>
          <div className="ga-dash-link-info">
            <h3>Categories</h3>
            <p>{categories.length} total categories</p>
          </div>
        </div>
        
        <div className="ga-dash-link" onClick={() => { fetchGalleryItems(); setActivePage('items'); }}>
          <div className="ga-dash-link-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="2"/>
              <circle cx="8.5" cy="8.5" r="2.5"/>
              <path d="M21 15L16 10L5 21"/>
            </svg>
          </div>
          <div className="ga-dash-link-info">
            <h3>Gallery Items</h3>
            <p>{galleryItems.length} total items</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (!user) return null;

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="gallery-admin">
        {toast.show && (
          <div className={`ga-toast ${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ show: false, message: '', type: '' })}>×</button>
          </div>
        )}

        {activePage === 'list' && renderDashboardList()}
        {activePage === 'categories' && renderCategoriesList()}
        {activePage === 'add_category' && renderCategoryForm()}
        {activePage === 'edit_category' && renderCategoryForm()}
        {activePage === 'view_category' && renderCategoryViewPage()}
        {activePage === 'items' && renderGalleryItemsList()}
        {activePage === 'add_item' && renderGalleryItemForm()}
        {activePage === 'edit_item' && renderGalleryItemForm()}
        {activePage === 'view_item' && renderGalleryItemViewPage()}
      </div>
    </Layout>
  );
};

export default GalleryAdmin;