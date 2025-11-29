/**
 * =============================================
 * NETWORK PAGE - AlumniBridge
 * Dynamic Network Management with Backend Integration
 * =============================================
 */

const API_BASE = "http://localhost:8080/api/users";
const SEARCH_DEBOUNCE_MS = 400;

// =============================================
// STATE MANAGEMENT
// =============================================
const state = {
  currentUserId: null,
  allUsers: [],
  connections: [],        // Users we are connected with (ACCEPTED)
  receivedRequests: [],   // Connection requests we received (PENDING)
  sentRequests: [],       // Connection requests we sent (PENDING)
  filteredAllUsers: [],
  connectionStatusMap: new Map(), // userId -> { status, requestId, isSender }
  loading: {
    all: true,
    received: true,
    sent: true,
  },
  activeTab: "tab-all",
  searchTerm: "",
  sortBy: "name",
};

// =============================================
// DOM SELECTORS
// =============================================
const selectors = {
  alert: document.getElementById("networkAlert"),
  search: document.getElementById("networkSearchInput"),
  sortSelect: document.getElementById("sortSelect"),
  tabs: Array.from(document.querySelectorAll(".tab-btn")),
  panels: Array.from(document.querySelectorAll(".tab-panel")),
  receivedBadge: document.getElementById("receivedBadge"),
  sentBadge: document.getElementById("sentBadge"),
  receivedCount: document.getElementById("receivedCount"),
  sentCount: document.getElementById("sentCount"),
  containers: {
    all: document.getElementById("allUsersContainer"),
    received: document.getElementById("receivedContainer"),
    sent: document.getElementById("sentContainer"),
  },
};

// =============================================
// AUTH & TOKEN
// =============================================
function getToken() {
  const token = window.localStorage.getItem("token");
  if (!token) {
    showAlert("You need to be signed in to manage connections.", "error");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
    throw new Error("Missing auth token");
  }
  return token;
}

function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

// =============================================
// API REQUEST HELPER
// =============================================
async function apiRequest(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    let message = "Something went wrong";
    try {
      const data = await response.json();
      message = data?.message || data?.error || message;
    } catch (err) {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return await response.json();
}

// =============================================
// ALERT FUNCTIONS
// =============================================
function showAlert(message, intent = "info") {
  if (!selectors.alert) return;
  selectors.alert.textContent = message;
  selectors.alert.className = `alert alert-${intent}`;
  
  // Auto-hide success alerts
  if (intent === "success") {
    setTimeout(hideAlert, 3000);
  }
}

function hideAlert() {
  if (!selectors.alert) return;
  selectors.alert.className = "alert hidden";
  selectors.alert.textContent = "";
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

function formatName(user) {
  if (user.name) return user.name;
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : user.email || "Unknown";
}

function acronymFromName(name) {
  const matches = name.match(/\b\w/g) || [];
  return matches.join("").toUpperCase().slice(0, 2) || "AB";
}

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => fn(...args), delay);
  };
}

// =============================================
// RENDER FUNCTIONS
// =============================================
function renderLoading(container) {
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
  `;
}

function renderEmpty(container, title, message) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">📭</div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function updateBadges() {
  // Update received badge
  const receivedCount = state.receivedRequests.length;
  if (selectors.receivedBadge) {
    selectors.receivedBadge.textContent = receivedCount;
    selectors.receivedBadge.classList.toggle("hidden", receivedCount === 0);
  }
  if (selectors.receivedCount) {
    selectors.receivedCount.textContent = `${receivedCount} pending`;
  }

  // Update sent badge
  const sentCount = state.sentRequests.length;
  if (selectors.sentBadge) {
    selectors.sentBadge.textContent = sentCount;
    selectors.sentBadge.classList.toggle("hidden", sentCount === 0);
  }
  if (selectors.sentCount) {
    selectors.sentCount.textContent = `${sentCount} pending`;
  }
}

// =============================================
// USER CARD TEMPLATES
// =============================================
function getUserConnectionStatus(userId) {
  return state.connectionStatusMap.get(userId) || { status: "NONE" };
}

function getActionButton(user, mode) {
  const userId = user.id;
  
  if (mode === "received") {
    // For received requests - show Accept/Reject
    const request = state.receivedRequests.find(r => r.sender?.id === userId);
    const requestId = request?.id;
    return `
      <button class="action-btn action-primary" data-action="accept" data-id="${requestId}" data-user-id="${userId}">
        ✓ Accept
      </button>
      <button class="action-btn action-secondary" data-action="reject" data-id="${requestId}" data-user-id="${userId}">
        ✕ Reject
      </button>
    `;
  }
  
  if (mode === "sent") {
    // For sent requests - show Cancel
    const request = state.sentRequests.find(r => r.receiver?.id === userId);
    const requestId = request?.id;
    return `
      <button class="action-btn action-danger" data-action="cancel" data-id="${requestId}" data-user-id="${userId}">
        Cancel Request
      </button>
      <span class="status-badge status-pending">⏳ Pending</span>
    `;
  }
  
  // For "all" mode - check connection status
  const status = getUserConnectionStatus(userId);
  
  if (status.status === "ACCEPTED") {
    return `
      <button class="action-btn action-connected" disabled>
        ✓ Connected
      </button>
    `;
  }
  
  if (status.status === "PENDING") {
    if (status.isSender) {
      // We sent the request - show Pending
      return `
        <button class="action-btn action-pending" disabled>
          ⏳ Pending
        </button>
      `;
    } else {
      // We received the request - show Respond
      return `
        <button class="action-btn action-respond" data-action="go-received" data-id="${userId}">
          📬 Respond
        </button>
      `;
    }
  }
  
  // No connection - show Connect button
  return `
    <button class="action-btn action-primary" data-action="send" data-id="${userId}">
      + Connect
    </button>
  `;
}

function personCardTemplate(person, mode) {
  const name = escapeHtml(formatName(person));
  const email = escapeHtml(person.email || "");
  const role = escapeHtml(person.role || "Member");
  const institute = person.institute ? escapeHtml(person.institute) : null;
  const degree = person.degreeName ? escapeHtml(person.degreeName) : null;
  const batchYear = person.batchYear ? escapeHtml(person.batchYear) : null;
  const skills = person.skills ? person.skills.split(",").map(s => s.trim()).filter(Boolean).slice(0, 4) : [];
  const pictureUrl = person.pictureUrl;

  const metaItems = [];
  if (degree) metaItems.push(`<span class="meta-item" title="Degree">🎓 ${degree}</span>`);
  if (batchYear) metaItems.push(`<span class="meta-item" title="Batch Year">📅 Batch ${batchYear}</span>`);
  if (institute) metaItems.push(`<span class="meta-item" title="Institute">🏛️ ${institute}</span>`);

  const avatarContent = pictureUrl 
    ? `<img src="${escapeHtml(pictureUrl)}" alt="${name}" onerror="this.outerHTML='${acronymFromName(name)}'">`
    : acronymFromName(name);

  return `
    <article class="person-card" data-id="${person.id}">
      <div class="person-top">
        <div class="avatar">${avatarContent}</div>
        <div class="person-info">
          <h3>${name}</h3>
          <p class="person-email">${email}</p>
          <span class="person-role badge-${role.toLowerCase()}">${role}</span>
        </div>
      </div>
      ${metaItems.length ? `<div class="person-meta">${metaItems.join("")}</div>` : ""}
      ${skills.length ? `<div class="tag-list">${skills.map(skill => `<span class="tag">${escapeHtml(skill)}</span>`).join("")}</div>` : ""}
      <div class="person-actions">
        ${getActionButton(person, mode)}
      </div>
    </article>
  `;
}

function renderAllUsers() {
  const container = selectors.containers.all;
  const list = state.filteredAllUsers;
  
  if (!Array.isArray(list) || list.length === 0) {
    renderEmpty(container, "No users found", "Try adjusting your filters or search criteria.");
    return;
  }
  
  container.innerHTML = list.map(user => personCardTemplate(user, "all")).join("");
}

function renderReceivedRequests() {
  const container = selectors.containers.received;
  const list = state.receivedRequests;
  
  if (!Array.isArray(list) || list.length === 0) {
    renderEmpty(container, "No pending requests", "You don't have any pending connection requests.");
    return;
  }
  
  // Extract sender info from each request
  container.innerHTML = list.map(request => {
    const sender = request.sender;
    return personCardTemplate(sender, "received");
  }).join("");
}

function renderSentRequests() {
  const container = selectors.containers.sent;
  const list = state.sentRequests;
  
  if (!Array.isArray(list) || list.length === 0) {
    renderEmpty(container, "No sent requests", "You haven't sent any connection requests yet. Start connecting with others!");
    return;
  }
  
  // Extract receiver info from each request
  container.innerHTML = list.map(request => {
    const receiver = request.receiver;
    return personCardTemplate(receiver, "sent");
  }).join("");
}

// =============================================
// SORTING FUNCTIONS
// =============================================
function sortUsers(users, sortBy) {
  const sorted = [...users];
  
  switch (sortBy) {
    case "name":
      sorted.sort((a, b) => formatName(a).localeCompare(formatName(b)));
      break;
    case "name-desc":
      sorted.sort((a, b) => formatName(b).localeCompare(formatName(a)));
      break;
    case "batch":
      sorted.sort((a, b) => (b.batchYear || 0) - (a.batchYear || 0));
      break;
    case "batch-asc":
      sorted.sort((a, b) => (a.batchYear || 9999) - (b.batchYear || 9999));
      break;
    case "degree":
      sorted.sort((a, b) => (a.degreeName || "").localeCompare(b.degreeName || ""));
      break;
    case "role":
      sorted.sort((a, b) => (a.role || "").localeCompare(b.role || ""));
      break;
    default:
      break;
  }
  
  return sorted;
}

// =============================================
// FILTER FUNCTIONS
// =============================================
function buildConnectionStatusMap() {
  state.connectionStatusMap.clear();
  
  // Add connected users
  state.connections.forEach(user => {
    state.connectionStatusMap.set(user.id, { status: "ACCEPTED" });
  });
  
  // Add received requests (we are the receiver)
  state.receivedRequests.forEach(request => {
    const senderId = request.sender?.id;
    if (senderId) {
      state.connectionStatusMap.set(senderId, {
        status: "PENDING",
        requestId: request.id,
        isSender: false
      });
    }
  });
  
  // Add sent requests (we are the sender)
  state.sentRequests.forEach(request => {
    const receiverId = request.receiver?.id;
    if (receiverId) {
      state.connectionStatusMap.set(receiverId, {
        status: "PENDING",
        requestId: request.id,
        isSender: true
      });
    }
  });
}

function filterUsers() {
  const term = state.searchTerm.trim().toLowerCase();
  
  // Exclude current user
  let list = state.allUsers.filter(user => user.id !== state.currentUserId);
  
  // Apply search filter
  if (term) {
    list = list.filter(user => {
      const haystack = [
        user.name,
        user.email,
        user.institute,
        user.degreeName,
        user.role,
        user.skills,
        user.batchYear?.toString(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      
      return haystack.includes(term);
    });
  }
  
  // Apply sorting
  list = sortUsers(list, state.sortBy);
  
  state.filteredAllUsers = list;
}

// =============================================
// DATA FETCHING FUNCTIONS
// =============================================
async function fetchCurrentUser() {
  try {
    const user = await apiRequest(`${API_BASE}/me`);
    state.currentUserId = user?.id || null;
    return user;
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    throw error;
  }
}

async function fetchAllUsers() {
  try {
    const users = await apiRequest(`${API_BASE}/search`);
    state.allUsers = Array.isArray(users) ? users : [];
    return state.allUsers;
  } catch (error) {
    console.error("Failed to fetch all users:", error);
    state.allUsers = [];
    throw error;
  }
}

async function fetchConnections() {
  try {
    const connections = await apiRequest(`${API_BASE}/connections`);
    state.connections = Array.isArray(connections) ? connections : [];
    return state.connections;
  } catch (error) {
    console.error("Failed to fetch connections:", error);
    state.connections = [];
    throw error;
  }
}

async function fetchReceivedRequests() {
  try {
    const requests = await apiRequest(`${API_BASE}/connection-requests`);
    state.receivedRequests = Array.isArray(requests) ? requests : [];
    return state.receivedRequests;
  } catch (error) {
    console.error("Failed to fetch received requests:", error);
    state.receivedRequests = [];
    throw error;
  }
}

async function fetchSentRequests() {
  try {
    const requests = await apiRequest(`${API_BASE}/sent-requests`);
    state.sentRequests = Array.isArray(requests) ? requests : [];
    return state.sentRequests;
  } catch (error) {
    console.error("Failed to fetch sent requests:", error);
    state.sentRequests = [];
    throw error;
  }
}

async function fetchAllData() {
  try {
    // Fetch current user first
    await fetchCurrentUser();
    
    // Fetch all data in parallel
    await Promise.all([
      fetchAllUsers(),
      fetchConnections(),
      fetchReceivedRequests(),
      fetchSentRequests(),
    ]);
    
    // Build connection status map
    buildConnectionStatusMap();
    
    // Filter and sort users
    filterUsers();
    
    // Render all sections
    renderAllUsers();
    renderReceivedRequests();
    renderSentRequests();
    
    // Update badges
    updateBadges();
    
    hideAlert();
  } catch (error) {
    showAlert(error.message || "Failed to load network data.", "error");
  }
}

// =============================================
// ACTION FUNCTIONS
// =============================================
async function sendRequest(receiverId) {
  try {
    setButtonLoading(receiverId, true);
    await apiRequest(`${API_BASE}/connect/${receiverId}`, { method: "POST" });
    showAlert("Connection request sent!", "success");
    
    // Refresh data
    await fetchAllData();
  } catch (error) {
    showAlert(error.message || "Failed to send connection request.", "error");
    setButtonLoading(receiverId, false);
  }
}

async function cancelRequest(requestId, userId) {
  try {
    setButtonLoading(userId, true);
    // Use disconnect endpoint to cancel the request
    await apiRequest(`${API_BASE}/disconnect/${userId}`, { method: "POST" });
    showAlert("Connection request cancelled.", "success");
    
    // Refresh data
    await fetchAllData();
  } catch (error) {
    showAlert(error.message || "Failed to cancel request.", "error");
    setButtonLoading(userId, false);
  }
}

async function acceptRequest(requestId, senderId) {
  try {
    setButtonLoading(senderId, true);
    await apiRequest(`${API_BASE}/connection/${requestId}/respond?accept=true`, { method: "POST" });
    showAlert("Connection accepted!", "success");
    
    // Refresh data
    await fetchAllData();
  } catch (error) {
    showAlert(error.message || "Failed to accept request.", "error");
    setButtonLoading(senderId, false);
  }
}

async function rejectRequest(requestId, senderId) {
  try {
    setButtonLoading(senderId, true);
    await apiRequest(`${API_BASE}/connection/${requestId}/respond?accept=false`, { method: "POST" });
    showAlert("Connection request rejected.", "success");
    
    // Refresh data
    await fetchAllData();
  } catch (error) {
    showAlert(error.message || "Failed to reject request.", "error");
    setButtonLoading(senderId, false);
  }
}

function setButtonLoading(userId, isLoading) {
  const buttons = document.querySelectorAll(`.action-btn[data-id="${userId}"], .action-btn[data-user-id="${userId}"]`);
  buttons.forEach(button => {
    button.disabled = isLoading;
    button.classList.toggle("action-disabled", isLoading);
    if (isLoading) {
      button.dataset.originalText = button.textContent;
      button.textContent = "Loading...";
    } else if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
    }
  });
}

// =============================================
// TAB HANDLING
// =============================================
function handleTabChange(event) {
  const button = event.currentTarget;
  const target = button.dataset.tab;
  if (!target || target === state.activeTab) return;

  state.activeTab = target;

  selectors.tabs.forEach(tab => {
    const isActive = tab.dataset.tab === target;
    tab.classList.toggle("active", isActive);
  });

  selectors.panels.forEach(panel => {
    const isActive = panel.id === target;
    panel.classList.toggle("active", isActive);
    panel.setAttribute("aria-hidden", String(!isActive));
  });
}

function goToReceivedTab() {
  const receivedTab = selectors.tabs.find(tab => tab.dataset.tab === "tab-received");
  if (receivedTab) {
    receivedTab.click();
  }
}

// =============================================
// EVENT HANDLERS
// =============================================
function handleActionClick(event) {
  const target = event.target.closest(".action-btn");
  if (!target) return;

  const { action, id } = target.dataset;
  const userId = target.dataset.userId || id;
  
  if (!action) return;

  switch (action) {
    case "send":
      sendRequest(id);
      break;
    case "cancel":
      cancelRequest(id, userId);
      break;
    case "accept":
      acceptRequest(id, userId);
      break;
    case "reject":
      rejectRequest(id, userId);
      break;
    case "go-received":
      goToReceivedTab();
      break;
    default:
      break;
  }
}

function handleSearch(event) {
  state.searchTerm = event.target.value;
  filterUsers();
  renderAllUsers();
  hideAlert();
}

function handleSort(event) {
  state.sortBy = event.target.value;
  filterUsers();
  renderAllUsers();
}

// =============================================
// EVENT LISTENERS
// =============================================
function attachEvents() {
  // Tab buttons
  selectors.tabs.forEach(button => {
    button.addEventListener("click", handleTabChange);
  });

  // Search input
  if (selectors.search) {
    selectors.search.addEventListener("input", debounce(handleSearch, SEARCH_DEBOUNCE_MS));
  }

  // Sort select
  if (selectors.sortSelect) {
    selectors.sortSelect.addEventListener("change", handleSort);
  }

  // Action button clicks (delegated)
  document.addEventListener("click", handleActionClick);
}

// =============================================
// INITIALIZATION
// =============================================
function initialiseLoadingState() {
  Object.values(selectors.containers).forEach(container => {
    if (container) {
      renderLoading(container);
    }
  });
}

function init() {
  if (!checkAuth()) return;
  
  initialiseLoadingState();
  attachEvents();
  
  fetchAllData().finally(() => {
    Object.keys(state.loading).forEach(key => {
      state.loading[key] = false;
    });
  });
}

// =============================================
// NAVIGATION FUNCTIONS
// =============================================
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
