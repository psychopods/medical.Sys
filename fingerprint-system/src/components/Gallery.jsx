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

      if (response.ok && data.success) {
        // Map the API response correctly
        const categoriesData = data.categories.map((cat) => ({
          id: cat.categoryKey,
          name: cat.categoryName,
          icon: cat.categoryIcon,
        }));
        setCategories([
          { id: "all", name: "All", icon: "all" },
          ...categoriesData,
        ]);
      } else if (response.ok && Array.isArray(data)) {
        // Fallback if API returns array directly
        const categoriesData = data.map((cat) => ({
          id: cat.categoryKey,
          name: cat.categoryName,
          icon: cat.categoryIcon,
        }));
        setCategories([
          { id: "all", name: "All", icon: "all" },
          ...categoriesData,
        ]);

        // Cache in SQLite
        for (const cat of data.categories) {
          await executeRun(
            "INSERT OR REPLACE INTO gallery_categories (category_key, category_name, category_icon) VALUES (?, ?, ?)",
            [cat.category_key, cat.category_name, cat.category_icon],
          );
        }
      } else {
        console.error("Failed to load categories:", data.message);
        // Set default categories to avoid empty state
        setCategories([{ id: "all", name: "All", icon: "all" }]);
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.error("Request timeout for categories");
        showToast("Request timeout. Please check your connection.", "error");
      } else {
        console.error("Error fetching categories:", error);
        showToast("Failed to connect to server", "error");
      }
      // Set default category so UI doesn't break
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
          : `${API_BASE_URL}/api/gallery/items?category=${filter}`;

      const response = await fetchWithTimeout(url, {
        signal: controller.signal,
      });
      const data = await response.json();

      let items = [];

      if (response.ok && data.success) {
        // Map the API response correctly (camelCase from API)
        items = data.items.map((item) => ({
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
      } else if (response.ok && Array.isArray(data)) {
        // Fallback if API returns array directly
        items = data.map((item) => ({
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
      } else {
        if (data.message !== "AbortError") {
          console.error("Failed to load gallery items:", data.message);
        }
        items = [];
      }

      setGalleryItems(items);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error fetching gallery items:", error);
        if (error.name === "AbortError") {
          console.log("Request was cancelled");
        } else {
          showToast("Network error. Please check your connection.", "error");
        }
      }
      setGalleryItems([]);
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

      {/* Modal for Image/Video Preview */}
      {selectedMedia && (
        <div className="gallery-modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>

            {selectedMedia.type === "image" ? (
              <div className="modal-image">
                <img src={selectedMedia.image} alt={selectedMedia.title} />
              </div>
            ) : (
              <div className="modal-video">
                {selectedMedia.video_url ? (
                  <iframe
                    src={selectedMedia.video_url}
                    title={selectedMedia.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="video-placeholder-large">
                    <svg
                      width="80"
                      height="80"
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
              <h2>{selectedMedia.title}</h2>
              <p>{selectedMedia.description}</p>
              <div className="modal-meta">
                <span className="modal-date">{selectedMedia.date}</span>
                <span className="modal-category">
                  Category: {selectedMedia.category}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
