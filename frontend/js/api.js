/**
 * =============================================
 * API UTILITY MODULE - AlumniBridge Frontend
 * Centralized fetch wrapper with JWT handling
 * =============================================
 */

// Backend API Base URL
const API_BASE_URL = "http://localhost:8080/api";

/**
 * Get JWT token from localStorage
 * @returns {string|null} JWT token or null if not found
 */
function getAuthToken() {
  return localStorage.getItem("token");
}

/**
 * Set JWT token in localStorage
 * @param {string} token - JWT token from backend
 */
function setAuthToken(token) {
  localStorage.setItem("token", token);
}

/**
 * Remove JWT token from localStorage (logout)
 */
function removeAuthToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("userRole");
}

/**
 * Get user ID from localStorage
 * @returns {string|null} User ID or null
 */
function getUserId() {
  return localStorage.getItem("userId");
}

/**
 * Get user role from localStorage
 * @returns {string|null} User role (STUDENT, ALUMNI, ADMIN) or null
 */
function getUserRole() {
  return localStorage.getItem("userRole");
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
function isAuthenticated() {
  return !!getAuthToken();
}

/**
 * Centralized fetch wrapper with JWT token handling
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} options - Fetch options
 * @returns {Promise<any>} Response JSON data
 * @throws {Error} API error or validation error
 */
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Default headers
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add JWT token if authenticated
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Merge options
  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Handle non-2xx responses
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      let errorData = {};

      try {
        errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Response wasn't JSON, use default message
      }

      console.error(`API Error Response [${endpoint}]:`, {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
        message: errorMessage,
      });

      // Handle 401 Unauthorized - redirect to login
      if (response.status === 401) {
        removeAuthToken();
        window.location.href = "../pages/login.html";
      }

      throw new Error(errorMessage);
    }

    // Parse and return response
    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * AUTH ENDPOINTS
 */

// Register user
async function authRegister(data) {
  return apiCall("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Login user
async function authLogin(email, password) {
  return apiCall("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/**
 * USER ENDPOINTS
 */

// Get current logged-in user details
async function getUserMe() {
  return apiCall("/users/me", { method: "GET" });
}

// Get user profile by ID
async function getUserProfile(userId) {
  return apiCall(`/users/${userId}`, { method: "GET" });
}

// Update user profile
async function updateUserProfile(userId, data) {
  return apiCall(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Search users with filters
async function searchUsers(
  query = "",
  degree = "",
  institute = "",
  batchYear = null
) {
  const params = new URLSearchParams();
  if (query) params.append("q", query);
  if (degree) params.append("degree", degree);
  if (institute) params.append("institute", institute);
  if (batchYear) params.append("batchYear", batchYear);

  const endpoint = `/users/search?${params.toString()}`;
  return apiCall(endpoint, { method: "GET" });
}

// Send connection request
async function sendConnectionRequest(receiverId) {
  return apiCall(`/users/connect/${receiverId}`, { method: "POST" });
}

// Get connection requests
async function getConnectionRequests() {
  return apiCall("/users/requests", { method: "GET" });
}

// Accept connection request
async function acceptConnectionRequest(requestId) {
  return apiCall(`/users/requests/${requestId}/accept`, { method: "POST" });
}

// Reject connection request
async function rejectConnectionRequest(requestId) {
  return apiCall(`/users/requests/${requestId}/reject`, { method: "POST" });
}

/**
 * EVENT ENDPOINTS
 */

// Get all events
async function getAllEvents() {
  return apiCall("/events/", { method: "GET" });
}

// Create event (Alumni only)
async function createEvent(data) {
  const userId = getUserId();
  return apiCall(`/events/?creatorId=${userId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Register for event (Student only)
async function registerForEvent(eventId) {
  const userId = getUserId();
  return apiCall(`/events/${eventId}/register?userId=${userId}`, {
    method: "POST",
  });
}

/**
 * BATCH ENDPOINTS
 */

// Get all batches
async function getAllBatches() {
  return apiCall("/batches", { method: "GET" });
}

// Get all users in a batch
async function getUsersByBatch(batchYear) {
  return apiCall(`/batches/${batchYear}/users`, { method: "GET" });
}

/**
 * DEGREE ENDPOINTS
 */

// Get all degrees
async function getAllDegrees() {
  return apiCall("/degrees", { method: "GET" });
}

/**
 * CHAT ENDPOINTS
 */

// Get chat history with another user
async function getChatHistory(userId) {
  return apiCall(`/chat/history/${userId}`, { method: "GET" });
}

// Get all conversations
async function getConversations() {
  return apiCall("/chat/conversations", { method: "GET" });
}

/**
 * CONNECTION ENDPOINTS
 */

// Send connection request
async function sendConnectionRequest(receiverId) {
  return apiCall(`/users/connect/${receiverId}`, { method: "POST" });
}

// Get pending connection requests (received)
async function getPendingConnectionRequests() {
  return apiCall("/users/connection-requests", { method: "GET" });
}

// Get sent connection requests
async function getSentConnectionRequests() {
  return apiCall("/users/sent-requests", { method: "GET" });
}

// Get active connections
async function getActiveConnections() {
  return apiCall("/users/connections", { method: "GET" });
}

// Get connection status with specific user
async function getConnectionStatus(userId) {
  return apiCall(`/users/connection-status/${userId}`, { method: "GET" });
}

// Accept connection request
async function acceptConnectionRequest(requestId) {
  return apiCall(`/users/connection/${requestId}/respond?accept=true`, {
    method: "POST",
  });
}

// Reject connection request
async function rejectConnectionRequest(requestId) {
  return apiCall(`/users/connection/${requestId}/respond?accept=false`, {
    method: "POST",
  });
}

// Remove/Disconnect connection
async function disconnectUser(userId) {
  return apiCall(`/users/disconnect/${userId}`, { method: "POST" });
}

/**
 * HELPER FUNCTIONS
 */

/**
 * Show error message to user
 * @param {string} message - Error message
 * @param {number} duration - Display duration in ms (default: 4000)
 */
function showError(message, duration = 4000) {
  const alertContainer = document.getElementById("alertContainer");
  if (!alertContainer) {
    console.error("Alert container not found");
    return;
  }

  const alertDiv = document.createElement("div");
  alertDiv.className = "alert alert-danger fade-in";
  alertDiv.innerHTML = `
        <strong>Error:</strong> ${message}
        <button class="close-alert" onclick="this.parentElement.remove()" style="margin-left: auto;">×</button>
    `;

  alertContainer.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.remove();
  }, duration);
}

/**
 * Show success message to user
 * @param {string} message - Success message
 * @param {number} duration - Display duration in ms (default: 3000)
 */
function showSuccess(message, duration = 3000) {
  const alertContainer = document.getElementById("alertContainer");
  if (!alertContainer) {
    console.error("Alert container not found");
    return;
  }

  const alertDiv = document.createElement("div");
  alertDiv.className = "alert alert-success fade-in";
  alertDiv.innerHTML = `
        <strong>Success:</strong> ${message}
        <button class="close-alert" onclick="this.parentElement.remove()" style="margin-left: auto;">×</button>
    `;

  alertContainer.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.remove();
  }, duration);
}

/**
 * Show loading spinner
 * @returns {HTMLElement} Loader element (store reference to remove later)
 */
function showLoader() {
  const alertContainer = document.getElementById("alertContainer");
  if (!alertContainer) return null;

  const loaderDiv = document.createElement("div");
  loaderDiv.className = "alert alert-info";
  loaderDiv.innerHTML = `
        <div class="text-loader">
            <div class="loader"></div>
            <span>Loading...</span>
        </div>
    `;

  alertContainer.appendChild(loaderDiv);
  return loaderDiv;
}

/**
 * Redirect to page based on role
 * @param {string} role - User role (STUDENT, ALUMNI, ADMIN)
 */
function redirectByRole(role) {
  if (role === "STUDENT") {
    window.location.href = "student-dashboard.html";
  } else if (role === "ALUMNI") {
    window.location.href = "alumni-dashboard.html";
  } else if (role === "ADMIN") {
    window.location.href = "admin-dashboard.html";
  }
}

/**
 * Format date/time for display
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date (e.g., "Nov 27, 2025 at 3:45 PM")
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean}
 */
function isValidPassword(password) {
  return password && password.length >= 6;
}

/**
 * Export functions for use in other scripts
 */
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    apiCall,
    authRegister,
    authLogin,
    getUserMe,
    getUserProfile,
    updateUserProfile,
    searchUsers,
    sendConnectionRequest,
    getPendingConnectionRequests,
    getSentConnectionRequests,
    getActiveConnections,
    getConnectionStatus,
    getConnectionRequests,
    acceptConnectionRequest,
    rejectConnectionRequest,
    disconnectUser,
    getAllEvents,
    createEvent,
    registerForEvent,
    getAllBatches,
    getUsersByBatch,
    getAllDegrees,
    getChatHistory,
    getConversations,
    getAuthToken,
    setAuthToken,
    removeAuthToken,
    getUserId,
    getUserRole,
    isAuthenticated,
    showError,
    showSuccess,
    showLoader,
    redirectByRole,
    formatDate,
    isValidEmail,
    isValidPassword,
  };
}
