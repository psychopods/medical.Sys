import { useState, useEffect, useRef } from "react";
import "./Gallery.css";
import { executeQuery, executeRun } from "../services/db.js";

import { API_ENDPOINTS, API_BASE_URL } from '../config/endpoints.js';
const API_TIMEOUT = 10000; // 10 seconds timeout

const Gallery = () => {
  const [filter, setFilter] = useState("all");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [galleryItems, setGalleryItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const abortControllerRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Fetch with timeout
  const fetchWithTimeout = async (url, options = {}, timeout = API_TIMEOUT) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await fetchWithTimeout(
        API_ENDPOINTS.galleryCategories,
      );
      const data = await response.json();

      let categoriesList = [];
      if (response.ok && data.success) {
        categoriesList = data.categories || [];
      } else if (response.ok && Array.isArray(data)) {
        categoriesList = data;
      }

      if (categoriesList.length > 0) {
        const categoriesData = categoriesList.map((cat) => ({
          id: cat.categoryKey,
          name: cat.categoryName,
          icon: cat.categoryIcon,
        }));
        setCategories([
          { id: "all", name: "All", icon: "all" },
          ...categoriesData,
        ]);

        // Cache in SQLite
        for (const cat of categoriesList) {
          if (cat.categoryKey) {
            await executeRun(
              "INSERT OR REPLACE INTO gallery_categories (category_key, category_name, category_icon) VALUES (?, ?, ?)",
              [cat.categoryKey, cat.categoryName, cat.categoryIcon || ''],
            );
          }
        }
      } else {
        console.error("Failed to load categories:", data.message);
        setCategories([{ id: "all", name: "All", icon: "all" }]);
      }
    } catch (error) {
      console.warn("API: Failed to fetch categories online, using local cache.", error);
      try {
        const localCats = await executeQuery("SELECT * FROM gallery_categories");
        if (localCats.length > 0) {
          const mapped = localCats.map(cat => ({
            id: cat.category_key,
            name: cat.category_name,
            icon: cat.category_icon
          }));
          setCategories([
            { id: "all", name: "All", icon: "all" },
            ...mapped
          ]);
          return;
        }
      } catch (dbError) {
        console.error("Local database query failed:", dbError);
      }
      setCategories([{ id: "all", name: "All", icon: "all" }]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch gallery items from API
  const fetchGalleryItems = async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const url =
        filter === "all"
          ? API_ENDPOINTS.galleryItems
          : `${API_ENDPOINTS.galleryItems}?category=${filter}`;

      const response = await fetchWithTimeout(url, {
        signal: controller.signal,
      });
      const data = await response.json();

      let items = [];
      let rawItems = [];

      if (response.ok && data.success) {
        rawItems = data.items || [];
      } else if (response.ok && Array.isArray(data)) {
        rawItems = data;
      }

      if (rawItems.length > 0) {
        items = rawItems.map((item) => ({
          id: item.id,
          type: item.mediaType,
          category: item.categoryKey,
          title: item.title,
          description: item.description,
          image: item.imageUrl,
          thumbnail: item.thumbnailUrl,
          video_url: item.videoUrl,
          date: item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "Date not available",
          created_at: item.createdAt,
        }));

        // Cache in SQLite
        for (const item of rawItems) {
          await executeRun(
            `INSERT OR REPLACE INTO gallery_items (id, media_type, category_key, title, description, image_url, thumbnail_url, video_url, created_at, last_modified_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              item.id,
              item.mediaType,
              item.categoryKey,
              item.title,
              item.description,
              item.imageUrl || null,
              item.thumbnailUrl || null,
              item.videoUrl || null,
              item.createdAt || new Date().toISOString(),
              item.lastModifiedAt || new Date().toISOString()
            ]
          );
        }
      }

      setGalleryItems(items);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.warn("API: Failed to fetch gallery items, trying local SQLite fallback...", error);
        try {
          const sql = filter === "all" 
            ? "SELECT * FROM gallery_items ORDER BY created_at DESC" 
            : "SELECT * FROM gallery_items WHERE category_key = ? ORDER BY created_at DESC";
          const params = filter === "all" ? [] : [filter];
          
          const localItems = await executeQuery(sql, params);
          const mapped = localItems.map(item => ({
            id: item.id,
            type: item.media_type,
            category: item.category_key,
            title: item.title,
            description: item.description,
            image: item.image_url,
            thumbnail: item.thumbnail_url,
            video_url: item.video_url,
            date: item.created_at
              ? new Date(item.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Date not available",
            created_at: item.created_at
          }));
          setGalleryItems(mapped);
          return;
        } catch (dbError) {
          console.error("Local database query for gallery items failed:", dbError);
        }
        setGalleryItems([]);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    fetchCategories();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch items when filter changes
  useEffect(() => {
    if (!loadingCategories) {
      fetchGalleryItems();
    }
  }, [filter, loadingCategories]);

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case "all":
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3"
              y="3"
              width="7"
              height="7"
              rx="1"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect
              x="14"
              y="3"
              width="7"
              height="7"
              rx="1"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect
              x="3"
              y="14"
              width="7"
              height="7"
              rx="1"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect
              x="14"
              y="14"
              width="7"
              height="7"
              rx="1"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        );
      case "outreach":
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M18 12C18 8.69 15.31 6 12 6"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        );
      case "medical":
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 8V16M8 12H16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        );
      case "healthcare":
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 12H4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M12 4V20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        );
      case "campaign":
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22 2L11 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 2L15 22L11 13L2 9L22 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "team":
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        );
      case "impact":
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L15 9H22L16 14L19 21L12 17L5 21L8 14L2 9H9L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      default:
        return (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        );
    }
  };

  const filteredItems =
    filter === "all"
      ? galleryItems
      : galleryItems.filter((item) => item.category === filter);

  const openMediaModal = (item) => {
    setSelectedMedia(item);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setSelectedMedia(null);
    document.body.style.overflow = "auto";
  };

  // Extract video ID from various video URL formats
  const getVideoId = (url) => {
    if (!url) return null;
    
    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) return youtubeMatch[1];
    
    // Vimeo
    const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) return vimeoMatch[1];
    
    // If it's already an embed URL or direct URL
    if (url.includes('embed') || url.includes('player')) {
      return url;
    }
    
    return null;
  };

  // Get video embed URL
  const getVideoEmbedUrl = (url) => {
    if (!url) return null;
    
    // YouTube
    const youtubeId = getVideoId(url);
    if (youtubeId && url.includes('youtube') || url.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
    }
    
    // Vimeo
    if (youtubeId && url.includes('vimeo')) {
      return `https://player.vimeo.com/video/${youtubeId}?autoplay=1`;
    }
    
    // If it's already an embed URL
    if (url.includes('embed') || url.includes('player')) {
      return url;
    }
    
    return url;
  };

  // Show loading immediately
  if (loadingCategories && categories.length === 0) {
    return (
      <div className="gallery-page">
        <div className="gallery-hero">
          <div className="gallery-hero-content">
            <h1>Our Gallery</h1>
            <p>Capturing moments of care, compassion, and community impact</p>
          </div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-page">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-content">
            <span>{toast.message}</span>
          </div>
          <button
            className="toast-close"
            onClick={() => setToast({ show: false, message: "", type: "" })}
          >
            ×
          </button>
        </div>
      )}

      {/* Hero Section */}
      <div className="gallery-hero">
        <div className="gallery-hero-content">
          <h1>Our Gallery</h1>
          <p>Capturing moments of care, compassion, and community impact</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="gallery-filter-section">
        <div className="filter-wrapper">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`filter-btn ${filter === cat.id ? "active" : ""}`}
              onClick={() => setFilter(cat.id)}
            >
              <span className="filter-icon">{getCategoryIcon(cat.icon)}</span>
              <span className="filter-name">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="gallery-section">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading items...</p>
          </div>
        ) : (
          <>
            <div className="gallery-grid">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`gallery-item ${item.type}`}
                  onClick={() => openMediaModal(item)}
                >
                  <div className="gallery-item-inner">
                    {item.type === "image" ? (
                      <div className="gallery-image">
                        <img src={item.image} alt={item.title} />
                        <div className="gallery-overlay">
                          <div className="overlay-content">
                            <svg
                              width="40"
                              height="40"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="white"
                                strokeWidth="2"
                              />
                              <path
                                d="M12 8V12L15 15"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                            <span>View Photo</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="gallery-video">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.title} />
                        ) : (
                          <div className="video-placeholder">
                            <svg
                              width="60"
                              height="60"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <rect
                                x="2"
                                y="4"
                                width="20"
                                height="16"
                                rx="2"
                                stroke="white"
                                strokeWidth="2"
                              />
                              <polygon points="10,8 16,12 10,16" fill="white" />
                            </svg>
                          </div>
                        )}
                        <div className="video-play-btn">
                          <svg
                            width="50"
                            height="50"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="white"
                              strokeWidth="2"
                            />
                            <polygon points="10,8 16,12 10,16" fill="white" />
                          </svg>
                        </div>
                        <div className="gallery-overlay">
                          <div className="overlay-content">
                            <svg
                              width="40"
                              height="40"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <polygon points="10,8 16,12 10,16" fill="white" />
                            </svg>
                            <span>Play Video</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="gallery-info">
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <span className="gallery-date">{item.date}</span>
                      <span className="gallery-category">{item.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="no-results">
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#0066cc"
                    strokeWidth="2"
                  />
                  <line
                    x1="12"
                    y1="8"
                    x2="12"
                    y2="12"
                    stroke="#0066cc"
                    strokeWidth="2"
                  />
                  <circle cx="12" cy="16" r="1" fill="#0066cc" />
                </svg>
                <h3>No items found</h3>
                <p>Try selecting a different category</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal - Clean Simple Design */}
      {selectedMedia && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal}>
              ×
            </button>

            <div className="modal-body">
              {selectedMedia.type === "image" ? (
                <div className="modal-media">
                  <img 
                    src={selectedMedia.image} 
                    alt={selectedMedia.title}
                    className="modal-media-content"
                  />
                </div>
              ) : (
                <div className="modal-media video-modal">
                  {selectedMedia.video_url ? (
                    <div className="video-wrapper">
                      <iframe
                        src={getVideoEmbedUrl(selectedMedia.video_url)}
                        title={selectedMedia.title}
                        className="modal-video-content"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="modal-video-placeholder">
                      <svg
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="2"
                          y="4"
                          width="20"
                          height="16"
                          rx="2"
                          stroke="#0066cc"
                          strokeWidth="2"
                        />
                        <polygon points="10,8 16,12 10,16" fill="#0066cc" />
                      </svg>
                      <p>Video URL not available</p>
                    </div>
                  )}
                </div>
              )}

              <div className="modal-info">
                <h2 className="modal-title">{selectedMedia.title}</h2>
                <p className="modal-description">{selectedMedia.description}</p>
                <div className="modal-meta">
                  <span className="modal-date">{selectedMedia.date}</span>
                  <span className="modal-category-tag">
                    {selectedMedia.category}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;