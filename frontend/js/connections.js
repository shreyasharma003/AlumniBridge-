/**
 * =============================================
 * CONNECTIONS PAGE - AlumniBridge
 * Handles connection requests and network management
 * =============================================
 */

// Current user data
let currentUser = null;

/**
 * Initialize connections page
 */
async function initConnectionsPage() {
  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return;
  }

  // Setup tab switching
  setupTabs();

  // Load current user
  try {
    currentUser = await getCurrentUser();
  } catch (error) {
    console.error("Error loading user:", error);
  }

  // Load all data
  await loadAllData();
}

/**
 * Setup tab switching functionality
 */
function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active from all tabs
      tabButtons.forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".tab-panel")
        .forEach((p) => p.classList.remove("active"));

      // Activate clicked tab
      btn.classList.add("active");
      const tabId = btn.dataset.tab;
      document.getElementById(tabId).classList.add("active");
    });
  });
}

/**
 * Load all connection data
 */
async function loadAllData() {
  await Promise.all([
    loadConnections(),
    loadReceivedRequests(),
    loadSentRequests(),
  ]);
}

/**
 * Load active connections
 */
async function loadConnections() {
  const container = document.getElementById("connectionsList");

  try {
    const connections = await getActiveConnections();

    document.getElementById("connectionsCount").textContent =
      connections.length;

    if (!connections || connections.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">👥</div>
                    <h3>No connections yet</h3>
                    <p>Start building your network by <a href="search.html">searching for people</a></p>
                </div>
            `;
      return;
    }

    container.innerHTML = connections
      .map((user) => createConnectionCard(user))
      .join("");
  } catch (error) {
    console.error("Error loading connections:", error);
    container.innerHTML = '<p class="error">Failed to load connections</p>';
  }
}

/**
 * Load received connection requests
 */
async function loadReceivedRequests() {
  const container = document.getElementById("receivedList");

  try {
    const requests = await getPendingConnectionRequests();

    document.getElementById("receivedCount").textContent = requests.length;

    if (!requests || requests.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📭</div>
                    <h3>No pending requests</h3>
                    <p>You don't have any connection requests waiting</p>
                </div>
            `;
      return;
    }

    container.innerHTML = requests
      .map((req) => createReceivedRequestCard(req))
      .join("");
  } catch (error) {
    console.error("Error loading received requests:", error);
    container.innerHTML = '<p class="error">Failed to load requests</p>';
  }
}

/**
 * Load sent connection requests
 */
async function loadSentRequests() {
  const container = document.getElementById("sentList");

  try {
    const requests = await getSentConnectionRequests();

    document.getElementById("sentCount").textContent = requests.length;

    if (!requests || requests.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📤</div>
                    <h3>No sent requests</h3>
                    <p>You haven't sent any connection requests</p>
                </div>
            `;
      return;
    }

    container.innerHTML = requests
      .map((req) => createSentRequestCard(req))
      .join("");
  } catch (error) {
    console.error("Error loading sent requests:", error);
    container.innerHTML = '<p class="error">Failed to load sent requests</p>';
  }
}

/**
 * Create a connection card (for active connections)
 */
function createConnectionCard(user) {
  const initials = getInitials(user.name);
  const avatarHtml = user.pictureUrl
    ? `<img src="${user.pictureUrl}" alt="${user.name}">`
    : initials;

  return `
        <div class="user-card" data-user-id="${user.id}">
            <div class="user-header">
                <div class="user-avatar">${avatarHtml}</div>
                <div class="user-info">
                    <h3>${user.name}</h3>
                    <span class="role ${user.role?.toLowerCase()}">${
    user.role
  }</span>
                </div>
            </div>
            <span class="connection-status status-connected">✓ Connected</span>
            <div class="user-details">
                ${
                  user.headline
                    ? `<p><span class="icon">💼</span> ${user.headline}</p>`
                    : ""
                }
                ${
                  user.institute
                    ? `<p><span class="icon">🏫</span> ${user.institute}</p>`
                    : ""
                }
                ${
                  user.degreeName
                    ? `<p><span class="icon">🎓</span> ${user.degreeName}${
                        user.batchYear ? ` (${user.batchYear})` : ""
                      }</p>`
                    : ""
                }
            </div>
            <div class="user-actions">
                <button class="btn btn-primary" onclick="viewProfile(${
                  user.id
                })">View Profile</button>
                <button class="btn btn-secondary" onclick="startChat(${
                  user.id
                })">Message</button>
                <button class="btn btn-danger" onclick="removeConnection(${
                  user.id
                }, '${user.name}')">Disconnect</button>
            </div>
        </div>
    `;
}

/**
 * Create a received request card
 */
function createReceivedRequestCard(request) {
  const user = request.sender;
  const initials = getInitials(user.name);
  const avatarHtml = user.pictureUrl
    ? `<img src="${user.pictureUrl}" alt="${user.name}">`
    : initials;

  const timeAgo = request.createdAt ? formatTimeAgo(request.createdAt) : "";

  return `
        <div class="user-card" data-request-id="${request.id}">
            <div class="user-header">
                <div class="user-avatar">${avatarHtml}</div>
                <div class="user-info">
                    <h3>${user.name}</h3>
                    <span class="role ${user.role?.toLowerCase()}">${
    user.role
  }</span>
                </div>
            </div>
            <span class="connection-status status-pending">⏳ Wants to connect</span>
            ${timeAgo ? `<p class="request-info">Sent ${timeAgo}</p>` : ""}
            <div class="user-details">
                ${
                  user.headline
                    ? `<p><span class="icon">💼</span> ${user.headline}</p>`
                    : ""
                }
                ${
                  user.institute
                    ? `<p><span class="icon">🏫</span> ${user.institute}</p>`
                    : ""
                }
                ${
                  user.degreeName
                    ? `<p><span class="icon">🎓</span> ${user.degreeName}${
                        user.batchYear ? ` (${user.batchYear})` : ""
                      }</p>`
                    : ""
                }
            </div>
            <div class="user-actions">
                <button class="btn btn-success" onclick="acceptRequest(${
                  request.id
                })">Accept</button>
                <button class="btn btn-danger" onclick="rejectRequest(${
                  request.id
                })">Reject</button>
                <button class="btn btn-outline" onclick="viewProfile(${
                  user.id
                })">View Profile</button>
            </div>
        </div>
    `;
}

/**
 * Create a sent request card
 */
function createSentRequestCard(request) {
  const user = request.sender; // In sent requests, sender contains receiver info
  const initials = getInitials(user.name);
  const avatarHtml = user.pictureUrl
    ? `<img src="${user.pictureUrl}" alt="${user.name}">`
    : initials;

  const timeAgo = request.createdAt ? formatTimeAgo(request.createdAt) : "";

  return `
        <div class="user-card" data-request-id="${request.id}">
            <div class="user-header">
                <div class="user-avatar">${avatarHtml}</div>
                <div class="user-info">
                    <h3>${user.name}</h3>
                    <span class="role ${user.role?.toLowerCase()}">${
    user.role
  }</span>
                </div>
            </div>
            <span class="connection-status status-sent">📤 Request sent</span>
            ${timeAgo ? `<p class="request-info">Sent ${timeAgo}</p>` : ""}
            <div class="user-details">
                ${
                  user.headline
                    ? `<p><span class="icon">💼</span> ${user.headline}</p>`
                    : ""
                }
                ${
                  user.institute
                    ? `<p><span class="icon">🏫</span> ${user.institute}</p>`
                    : ""
                }
                ${
                  user.degreeName
                    ? `<p><span class="icon">🎓</span> ${user.degreeName}${
                        user.batchYear ? ` (${user.batchYear})` : ""
                      }</p>`
                    : ""
                }
            </div>
            <div class="user-actions">
                <button class="btn btn-outline" onclick="viewProfile(${
                  user.id
                })">View Profile</button>
                <button class="btn btn-secondary" onclick="cancelRequest(${
                  request.id
                })">Cancel Request</button>
            </div>
        </div>
    `;
}

/**
 * Accept a connection request
 */
async function acceptRequest(requestId) {
  try {
    await acceptConnectionRequest(requestId);
    showAlert("Connection accepted!", "success");
    await loadAllData();
  } catch (error) {
    console.error("Error accepting request:", error);
    showAlert("Failed to accept request", "error");
  }
}

/**
 * Reject a connection request
 */
async function rejectRequest(requestId) {
  try {
    await rejectConnectionRequest(requestId);
    showAlert("Request rejected", "success");
    await loadAllData();
  } catch (error) {
    console.error("Error rejecting request:", error);
    showAlert("Failed to reject request", "error");
  }
}

/**
 * Cancel a sent connection request
 */
async function cancelRequest(requestId) {
  try {
    await rejectConnectionRequest(requestId);
    showAlert("Request cancelled", "success");
    await loadAllData();
  } catch (error) {
    console.error("Error cancelling request:", error);
    showAlert("Failed to cancel request", "error");
  }
}

/**
 * Remove/Disconnect a connection
 */
async function removeConnection(userId, userName) {
  if (!confirm(`Are you sure you want to disconnect from ${userName}?`)) {
    return;
  }

  try {
    await disconnectUser(userId);
    showAlert("Connection removed", "success");
    await loadAllData();
  } catch (error) {
    console.error("Error removing connection:", error);
    showAlert("Failed to remove connection", "error");
  }
}

/**
 * View user profile
 */
function viewProfile(userId) {
  window.location.href = `profile.html?id=${userId}`;
}

/**
 * Start chat with user
 */
function startChat(userId) {
  window.location.href = `chat.html?userId=${userId}`;
}

/**
 * Logout function
 */
function logout() {
  removeAuthToken();
  window.location.href = "login.html";
}

/**
 * Get initials from name
 */
function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Format time ago
 */
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}

/**
 * Show alert message
 */
function showAlert(message, type = "success") {
  const container = document.getElementById("alertContainer");
  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `
        ${message}
        <button onclick="this.parentElement.remove()">×</button>
    `;
  container.appendChild(alert);

  // Auto-remove after 4 seconds
  setTimeout(() => alert.remove(), 4000);
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", initConnectionsPage);
