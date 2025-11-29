/**
 * =============================================
 * CONNECTIONS PAGE - AlumniBridge
 * Complete connection management functionality
 * =============================================
 */

const API_BASE = "http://localhost:8080/api/users";

// =============================================
// STATE
// =============================================
const state = {
  currentUserId: null,
  allUsers: [],
  sentRequests: [],
  receivedRequests: [],
  connections: [],
  filteredUsers: [],
  activeTab: "all-users",
};

// =============================================
// DOM SELECTORS
// =============================================
const selectors = {
  alertContainer: document.getElementById("alertContainer"),
  tabBtns: document.querySelectorAll(".tab-btn"),
  tabPanels: document.querySelectorAll(".tab-panel"),
  allUsersGrid: document.getElementById("allUsersGrid"),
  sentRequestsGrid: document.getElementById("sentRequestsGrid"),
  receivedRequestsGrid: document.getElementById("receivedRequestsGrid"),
  connectionsGrid: document.getElementById("connectionsGrid"),
  searchAllUsers: document.getElementById("searchAllUsers"),
  allUsersCount: document.getElementById("allUsersCount"),
  sentCount: document.getElementById("sentCount"),
  receivedCount: document.getElementById("receivedCount"),
  connectionsCount: document.getElementById("connectionsCount"),
};

// =============================================
// AUTH
// =============================================
function getToken() {
  return localStorage.getItem("token");
}

function checkAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

// =============================================
// API HELPER
// =============================================
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (response.status === 401) {
    window.location.href = "login.html";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Request failed");
  }

  if (response.status === 204) return null;
  
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// =============================================
// ALERTS
// =============================================
function showAlert(message, type = "info") {
  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button class="alert-close" onclick="this.parentElement.remove()">×</button>
  `;
  selectors.alertContainer.appendChild(alert);

  // Auto-remove after 5 seconds
  setTimeout(() => alert.remove(), 5000);
}

// =============================================
// UTILITY FUNCTIONS
// =============================================
function escapeHtml(text) {
  if (!text) return "";
  return text
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.split(" ");
  return parts
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

function renderLoading(container) {
  container.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
}

function renderEmpty(container, icon, title, message) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

// =============================================
// DATA FETCHING
// =============================================
async function fetchCurrentUser() {
  try {
    const user = await apiRequest("/me");
    state.currentUserId = user.id;
    localStorage.setItem("userId", user.id);
    return user;
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    return null;
  }
}

async function fetchAllUsers() {
  try {
    const users = await apiRequest("/search");
    state.allUsers = Array.isArray(users) ? users : [];
    state.filteredUsers = [...state.allUsers];
    return state.allUsers;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    state.allUsers = [];
    state.filteredUsers = [];
    return [];
  }
}

async function fetchSentRequests() {
  try {
    const requests = await apiRequest("/sent-requests");
    state.sentRequests = Array.isArray(requests) ? requests : [];
    return state.sentRequests;
  } catch (error) {
    console.error("Failed to fetch sent requests:", error);
    state.sentRequests = [];
    return [];
  }
}

async function fetchReceivedRequests() {
  try {
    const requests = await apiRequest("/connection-requests");
    state.receivedRequests = Array.isArray(requests) ? requests : [];
    return state.receivedRequests;
  } catch (error) {
    console.error("Failed to fetch received requests:", error);
    state.receivedRequests = [];
    return [];
  }
}

async function fetchConnections() {
  try {
    const connections = await apiRequest("/connections");
    state.connections = Array.isArray(connections) ? connections : [];
    return state.connections;
  } catch (error) {
    console.error("Failed to fetch connections:", error);
    state.connections = [];
    return [];
  }
}

// =============================================
// CONNECTION ACTIONS
// =============================================
async function sendRequest(receiverId) {
  const btn = document.querySelector(`[data-action="connect"][data-user-id="${receiverId}"]`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = "Sending...";
  }

  try {
    await apiRequest(`/connect/${receiverId}`, { method: "POST" });
    showAlert("Connection request sent!", "success");
    
    // Update UI immediately
    updateButtonState(receiverId, "pending");
    
    // Refresh data
    await Promise.all([fetchSentRequests(), fetchAllUsers()]);
    updateCounts();
    
  } catch (error) {
    showAlert(error.message || "Failed to send request", "error");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "Connect";
      btn.className = "btn btn-connect";
    }
  }
}

async function cancelRequest(requestId, userId) {
  const btn = document.querySelector(`[data-action="cancel"][data-request-id="${requestId}"]`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = "Cancelling...";
  }

  try {
    // Use disconnect endpoint to cancel pending request
    await apiRequest(`/disconnect/${userId}`, { method: "POST" });
    showAlert("Request cancelled", "info");
    
    // Refresh data
    await Promise.all([fetchSentRequests(), fetchAllUsers()]);
    renderSentRequests();
    renderAllUsers();
    updateCounts();
    
  } catch (error) {
    showAlert(error.message || "Failed to cancel request", "error");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "Cancel Request";
    }
  }
}

async function acceptRequest(requestId) {
  const btn = document.querySelector(`[data-action="accept"][data-request-id="${requestId}"]`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = "Accepting...";
  }

  try {
    await apiRequest(`/connection/${requestId}/respond?accept=true`, { method: "POST" });
    showAlert("Connection accepted!", "success");
    
    // Refresh all data
    await Promise.all([
      fetchReceivedRequests(),
      fetchConnections(),
      fetchAllUsers()
    ]);
    renderReceivedRequests();
    renderConnections();
    renderAllUsers();
    updateCounts();
    
  } catch (error) {
    showAlert(error.message || "Failed to accept request", "error");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "Accept";
    }
  }
}

async function rejectRequest(requestId) {
  const btn = document.querySelector(`[data-action="reject"][data-request-id="${requestId}"]`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = "Rejecting...";
  }

  try {
    await apiRequest(`/connection/${requestId}/respond?accept=false`, { method: "POST" });
    showAlert("Request rejected", "info");
    
    // Refresh data
    await Promise.all([fetchReceivedRequests(), fetchAllUsers()]);
    renderReceivedRequests();
    renderAllUsers();
    updateCounts();
    
  } catch (error) {
    showAlert(error.message || "Failed to reject request", "error");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "Reject";
    }
  }
}

async function disconnectUser(userId) {
  if (!confirm("Are you sure you want to remove this connection?")) return;

  const btn = document.querySelector(`[data-action="disconnect"][data-user-id="${userId}"]`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = "Removing...";
  }

  try {
    await apiRequest(`/disconnect/${userId}`, { method: "POST" });
    showAlert("Connection removed", "info");
    
    // Refresh data
    await Promise.all([fetchConnections(), fetchAllUsers()]);
    renderConnections();
    renderAllUsers();
    updateCounts();
    
  } catch (error) {
    showAlert(error.message || "Failed to remove connection", "error");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = "Remove";
    }
  }
}

// =============================================
// UI UPDATE FUNCTIONS
// =============================================
function updateButtonState(userId, newState) {
  const btn = document.querySelector(`[data-user-id="${userId}"]`);
  if (!btn) return;

  switch (newState) {
    case "connect":
      btn.className = "btn btn-connect";
      btn.innerHTML = "Connect";
      btn.disabled = false;
      btn.dataset.action = "connect";
      break;
    case "pending":
      btn.className = "btn btn-pending";
      btn.innerHTML = "⏳ Pending";
      btn.disabled = true;
      btn.dataset.action = "";
      break;
    case "connected":
      btn.className = "btn btn-connected";
      btn.innerHTML = "✓ Connected";
      btn.disabled = true;
      btn.dataset.action = "";
      break;
    case "received":
      btn.className = "btn btn-pending";
      btn.innerHTML = "📩 Respond";
      btn.disabled = true;
      btn.dataset.action = "";
      break;
  }
}

function updateCounts() {
  // Filter out current user from all users count
  const usersExcludingSelf = state.allUsers.filter(u => u.id !== state.currentUserId);
  selectors.allUsersCount.textContent = usersExcludingSelf.length;
  selectors.sentCount.textContent = state.sentRequests.length;
  selectors.receivedCount.textContent = state.receivedRequests.length;
  selectors.connectionsCount.textContent = state.connections.length;
}

// =============================================
// GET USER CONNECTION STATUS
// =============================================
function getUserConnectionStatus(userId) {
  // Check if connected
  const isConnected = state.connections.some(c => c.id === userId);
  if (isConnected) return "connected";

  // Check if request sent
  const sentRequest = state.sentRequests.find(r => r.id === userId || r.receiverId === userId);
  if (sentRequest) return "pending";

  // Check if request received
  const receivedRequest = state.receivedRequests.find(r => r.id === userId || r.senderId === userId);
  if (receivedRequest) return "received";

  return "none";
}

// =============================================
// RENDER FUNCTIONS
// =============================================
function renderAllUsers() {
  const container = selectors.allUsersGrid;
  
  // Filter out current user and apply search
  const users = state.filteredUsers.filter(u => u.id !== state.currentUserId);

  if (users.length === 0) {
    renderEmpty(container, "👥", "No users found", "Try adjusting your search filters");
    return;
  }

  container.innerHTML = users.map(user => {
    const status = getUserConnectionStatus(user.id);
    const initials = getInitials(user.name || user.firstName);
    const name = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;

    let actionButton = "";
    switch (status) {
      case "connected":
        actionButton = `
          <button class="btn btn-connected" disabled>✓ Connected</button>
          <a href="chat.html?userId=${user.id}" class="btn btn-message">Message</a>
        `;
        break;
      case "pending":
        actionButton = `<button class="btn btn-pending" disabled>⏳ Pending</button>`;
        break;
      case "received":
        actionButton = `<button class="btn btn-pending" disabled>📩 Check Received</button>`;
        break;
      default:
        actionButton = `
          <button class="btn btn-connect" data-action="connect" data-user-id="${user.id}">
            Connect
          </button>
        `;
    }

    return `
      <article class="user-card">
        <div class="user-card-header">
          <div class="user-avatar">${initials}</div>
          <div class="user-info">
            <div class="user-name">${escapeHtml(name)}</div>
            <div class="user-email">${escapeHtml(user.email || "")}</div>
            <div class="user-meta">
              ${user.role ? `<span class="meta-tag role">${escapeHtml(user.role)}</span>` : ""}
              ${user.degree ? `<span class="meta-tag degree">${escapeHtml(user.degree)}</span>` : ""}
              ${user.batchYear ? `<span class="meta-tag batch">${escapeHtml(user.batchYear)}</span>` : ""}
            </div>
          </div>
        </div>
        <div class="user-actions">
          ${actionButton}
        </div>
      </article>
    `;
  }).join("");
}

function renderSentRequests() {
  const container = selectors.sentRequestsGrid;

  if (state.sentRequests.length === 0) {
    renderEmpty(container, "📤", "No sent requests", "When you send connection requests, they'll appear here");
    return;
  }

  container.innerHTML = state.sentRequests.map(request => {
    // Handle different response structures
    const user = request.receiver || request;
    const requestId = request.requestId || request.id;
    const userId = user.id || request.receiverId;
    const name = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
    const initials = getInitials(name);
    const status = request.status || "PENDING";

    return `
      <article class="user-card">
        <div class="user-card-header">
          <div class="user-avatar">${initials}</div>
          <div class="user-info">
            <div class="user-name">
              ${escapeHtml(name)}
              <span class="status-badge status-${status.toLowerCase()}">${status}</span>
            </div>
            <div class="user-email">${escapeHtml(user.email || "")}</div>
            <div class="user-meta">
              ${user.role ? `<span class="meta-tag role">${escapeHtml(user.role)}</span>` : ""}
              ${user.degree ? `<span class="meta-tag degree">${escapeHtml(user.degree)}</span>` : ""}
            </div>
          </div>
        </div>
        ${request.createdAt ? `
          <div class="request-info">
            <span class="request-date">Sent on ${formatDate(request.createdAt)}</span>
          </div>
        ` : ""}
        <div class="user-actions">
          ${status === "PENDING" ? `
            <button class="btn btn-cancel" data-action="cancel" data-request-id="${requestId}" data-user-id="${userId}">
              Cancel Request
            </button>
          ` : status === "ACCEPTED" ? `
            <a href="chat.html?userId=${userId}" class="btn btn-message">Message</a>
          ` : ""}
        </div>
      </article>
    `;
  }).join("");
}

function renderReceivedRequests() {
  const container = selectors.receivedRequestsGrid;

  if (state.receivedRequests.length === 0) {
    renderEmpty(container, "📥", "No received requests", "Connection requests from others will appear here");
    return;
  }

  container.innerHTML = state.receivedRequests.map(request => {
    // Handle different response structures
    const user = request.sender || request;
    const requestId = request.requestId || request.id;
    const name = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
    const initials = getInitials(name);

    return `
      <article class="user-card">
        <div class="user-card-header">
          <div class="user-avatar">${initials}</div>
          <div class="user-info">
            <div class="user-name">
              ${escapeHtml(name)}
              <span class="status-badge status-received">Pending</span>
            </div>
            <div class="user-email">${escapeHtml(user.email || "")}</div>
            <div class="user-meta">
              ${user.role ? `<span class="meta-tag role">${escapeHtml(user.role)}</span>` : ""}
              ${user.degree ? `<span class="meta-tag degree">${escapeHtml(user.degree)}</span>` : ""}
            </div>
          </div>
        </div>
        ${request.createdAt ? `
          <div class="request-info">
            <span class="request-date">Received on ${formatDate(request.createdAt)}</span>
          </div>
        ` : ""}
        <div class="user-actions">
          <button class="btn btn-accept" data-action="accept" data-request-id="${requestId}">
            Accept
          </button>
          <button class="btn btn-reject" data-action="reject" data-request-id="${requestId}">
            Reject
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function renderConnections() {
  const container = selectors.connectionsGrid;

  if (state.connections.length === 0) {
    renderEmpty(container, "🤝", "No connections yet", "Start connecting with alumni and students!");
    return;
  }

  container.innerHTML = state.connections.map(user => {
    const name = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
    const initials = getInitials(name);

    return `
      <article class="user-card">
        <div class="user-card-header">
          <div class="user-avatar">${initials}</div>
          <div class="user-info">
            <div class="user-name">
              ${escapeHtml(name)}
              <span class="status-badge status-connected">Connected</span>
            </div>
            <div class="user-email">${escapeHtml(user.email || "")}</div>
            <div class="user-meta">
              ${user.role ? `<span class="meta-tag role">${escapeHtml(user.role)}</span>` : ""}
              ${user.degree ? `<span class="meta-tag degree">${escapeHtml(user.degree)}</span>` : ""}
            </div>
          </div>
        </div>
        <div class="user-actions">
          <a href="chat.html?userId=${user.id}" class="btn btn-message">Message</a>
          <button class="btn btn-disconnect" data-action="disconnect" data-user-id="${user.id}">
            Remove
          </button>
        </div>
      </article>
    `;
  }).join("");
}

// =============================================
// TAB HANDLING
// =============================================
function switchTab(tabId) {
  state.activeTab = tabId;

  // Update tab buttons
  selectors.tabBtns.forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive);
  });

  // Update tab panels
  selectors.tabPanels.forEach(panel => {
    panel.classList.toggle("active", panel.id === tabId);
  });
}

// =============================================
// SEARCH HANDLING
// =============================================
function filterAllUsers(searchTerm) {
  const term = searchTerm.toLowerCase().trim();
  
  if (!term) {
    state.filteredUsers = [...state.allUsers];
  } else {
    state.filteredUsers = state.allUsers.filter(user => {
      const name = (user.name || `${user.firstName || ""} ${user.lastName || ""}`).toLowerCase();
      const email = (user.email || "").toLowerCase();
      const degree = (user.degree || "").toLowerCase();
      const role = (user.role || "").toLowerCase();
      
      return name.includes(term) || email.includes(term) || degree.includes(term) || role.includes(term);
    });
  }
  
  renderAllUsers();
}

// =============================================
// EVENT LISTENERS
// =============================================
function attachEventListeners() {
  // Tab clicks
  selectors.tabBtns.forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Search input
  selectors.searchAllUsers?.addEventListener(
    "input",
    debounce((e) => filterAllUsers(e.target.value), 300)
  );

  // Global click delegation for action buttons
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const userId = btn.dataset.userId;
    const requestId = btn.dataset.requestId;

    switch (action) {
      case "connect":
        sendRequest(userId);
        break;
      case "cancel":
        cancelRequest(requestId, userId);
        break;
      case "accept":
        acceptRequest(requestId);
        break;
      case "reject":
        rejectRequest(requestId);
        break;
      case "disconnect":
        disconnectUser(userId);
        break;
    }
  });
}

// =============================================
// INITIALIZATION
// =============================================
async function init() {
  if (!checkAuth()) return;

  // Show loading in all grids
  renderLoading(selectors.allUsersGrid);
  renderLoading(selectors.sentRequestsGrid);
  renderLoading(selectors.receivedRequestsGrid);
  renderLoading(selectors.connectionsGrid);

  // Fetch current user first
  await fetchCurrentUser();

  // Fetch all data in parallel
  await Promise.all([
    fetchAllUsers(),
    fetchSentRequests(),
    fetchReceivedRequests(),
    fetchConnections()
  ]);

  // Render all sections
  renderAllUsers();
  renderSentRequests();
  renderReceivedRequests();
  renderConnections();
  updateCounts();

  // Attach event listeners
  attachEventListeners();
}

function goBack() {
  const role = localStorage.getItem("userRole");
  if (role === "STUDENT") {
    window.location.href = "student-dashboard.html";
  } else if (role === "ALUMNI") {
    window.location.href = "alumni-dashboard.html";
  } else if (role === "ADMIN") {
    window.location.href = "admin-dashboard.html";
  } else {
    window.location.href = "../index.html";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
  window.location.href = "login.html";
}

// Start the app
window.addEventListener("DOMContentLoaded", init);
