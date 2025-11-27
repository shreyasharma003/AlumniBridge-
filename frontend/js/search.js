/**
 * =============================================
 * SEARCH PAGE - AlumniBridge
 * Find and connect with alumni and students
 * =============================================
 */

// Store current user and all results
let currentUser = null;
let allResults = [];
let connectionStatuses = {};

/**
 * Initialize search page
 */
async function initSearchPage() {
  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return;
  }

  // Load current user
  try {
    currentUser = await getCurrentUser();
  } catch (error) {
    console.error("Error loading user:", error);
  }

  // Populate filter dropdowns
  await populateFilters();

  // Setup enter key search
  document.getElementById("searchQuery").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  });

  // Load all users initially
  performSearch();
}

/**
 * Populate filter dropdowns
 */
async function populateFilters() {
  // Populate degrees
  try {
    const degrees = await getAllDegrees();
    const degreeSelect = document.getElementById("filterDegree");
    degrees.forEach((degree) => {
      const option = document.createElement("option");
      option.value = degree.name;
      option.textContent = degree.name;
      degreeSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading degrees:", error);
  }

  // Populate batch years
  const batchSelect = document.getElementById("filterBatch");
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= currentYear - 15; year--) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    batchSelect.appendChild(option);
  }
}

/**
 * Perform search with current filters
 */
async function performSearch() {
  const resultsContainer = document.getElementById("searchResults");
  resultsContainer.innerHTML = '<p class="loading">Searching...</p>';

  const query = document.getElementById("searchQuery").value.trim();
  const degree = document.getElementById("filterDegree").value;
  const institute = document.getElementById("filterInstitute").value;
  const batch = document.getElementById("filterBatch").value;

  try {
    // Build query params
    const params = new URLSearchParams();
    if (query) params.append("q", query);
    if (degree) params.append("degree", degree);
    if (institute) params.append("institute", institute);
    if (batch) params.append("batchYear", batch);

    const response = await apiCall(`/users/search?${params.toString()}`, {
      method: "GET",
    });

    // Filter out current user
    allResults = response.filter((user) => user.id !== currentUser?.id);

    // Load connection statuses for all results
    await loadConnectionStatuses(allResults);

    // Apply local role filter
    filterResults();
  } catch (error) {
    console.error("Search error:", error);
    resultsContainer.innerHTML =
      '<p class="error">Search failed. Please try again.</p>';
  }
}

/**
 * Load connection statuses for all users
 */
async function loadConnectionStatuses(users) {
  connectionStatuses = {};

  // Load statuses in parallel (with batching to avoid too many requests)
  const batchSize = 10;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (user) => {
        try {
          const status = await getConnectionStatus(user.id);
          connectionStatuses[user.id] = status;
        } catch (error) {
          console.error(`Error getting status for user ${user.id}:`, error);
          connectionStatuses[user.id] = { status: "NONE", canConnect: true };
        }
      })
    );
  }
}

/**
 * Filter results by role (local filter)
 */
function filterResults() {
  const roleFilter = document.getElementById("filterRole").value;

  let filtered = allResults;
  if (roleFilter) {
    filtered = allResults.filter((user) => user.role === roleFilter);
  }

  displayResults(filtered);
}

/**
 * Display search results
 */
function displayResults(users) {
  const resultsContainer = document.getElementById("searchResults");
  document.getElementById("resultsCount").textContent = `(${users.length})`;

  if (!users || users.length === 0) {
    resultsContainer.innerHTML = `
            <div class="empty-state">
                <div class="icon">🔍</div>
                <h3>No results found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
    return;
  }

  resultsContainer.innerHTML = users
    .map((user) => createUserCard(user))
    .join("");
}

/**
 * Create a user card with connection status
 */
function createUserCard(user) {
  const initials = getInitials(user.name);
  const avatarHtml = user.pictureUrl
    ? `<img src="${user.pictureUrl}" alt="${user.name}">`
    : initials;

  const status = connectionStatuses[user.id] || {
    status: "NONE",
    canConnect: true,
  };
  const statusBadge = getStatusBadge(status);
  const actionButtons = getActionButtons(user.id, status);

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
            ${statusBadge}
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
                ${
                  user.location
                    ? `<p><span class="icon">📍</span> ${user.location}</p>`
                    : ""
                }
            </div>
            <div class="user-actions">
                ${actionButtons}
            </div>
        </div>
    `;
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
  switch (status.status) {
    case "ACCEPTED":
      return '<span class="connection-status status-connected">✓ Connected</span>';
    case "PENDING":
      if (status.isSender) {
        return '<span class="connection-status status-sent">📤 Request Sent</span>';
      } else {
        return '<span class="connection-status status-pending">📥 Wants to Connect</span>';
      }
    default:
      return "";
  }
}

/**
 * Get action buttons based on connection status
 */
function getActionButtons(userId, status) {
  let buttons = `<button class="btn btn-outline" onclick="viewProfile(${userId})">View Profile</button>`;

  switch (status.status) {
    case "NONE":
    case "REJECTED":
      buttons += `<button class="btn btn-primary" onclick="connect(${userId})">Connect</button>`;
      break;
    case "PENDING":
      if (status.isSender) {
        buttons += `<button class="btn btn-secondary" onclick="cancelRequest(${status.requestId}, ${userId})">Cancel Request</button>`;
      } else {
        buttons += `<button class="btn btn-success" onclick="acceptRequest(${status.requestId}, ${userId})">Accept</button>`;
        buttons += `<button class="btn btn-secondary" onclick="rejectRequest(${status.requestId}, ${userId})">Ignore</button>`;
      }
      break;
    case "ACCEPTED":
      buttons += `<button class="btn btn-secondary" onclick="startChat(${userId})">Message</button>`;
      break;
  }

  return buttons;
}

/**
 * Send connection request
 */
async function connect(userId) {
  try {
    await sendConnectionRequest(userId);
    showAlert("Connection request sent!", "success");

    // Update status locally
    connectionStatuses[userId] = {
      status: "PENDING",
      isSender: true,
      canConnect: false,
    };
    filterResults();
  } catch (error) {
    console.error("Error sending connection:", error);
    showAlert(error.message || "Failed to send request", "error");
  }
}

/**
 * Accept connection request
 */
async function acceptRequest(requestId, userId) {
  try {
    await acceptConnectionRequest(requestId);
    showAlert("Connection accepted!", "success");

    // Update status locally
    connectionStatuses[userId] = { status: "ACCEPTED", isConnected: true };
    filterResults();
  } catch (error) {
    console.error("Error accepting request:", error);
    showAlert("Failed to accept request", "error");
  }
}

/**
 * Reject/Ignore connection request
 */
async function rejectRequest(requestId, userId) {
  try {
    await rejectConnectionRequest(requestId);
    showAlert("Request ignored", "success");

    // Update status locally
    connectionStatuses[userId] = { status: "NONE", canConnect: true };
    filterResults();
  } catch (error) {
    console.error("Error rejecting request:", error);
    showAlert("Failed to ignore request", "error");
  }
}

/**
 * Cancel sent connection request
 */
async function cancelRequest(requestId, userId) {
  try {
    await rejectConnectionRequest(requestId);
    showAlert("Request cancelled", "success");

    // Update status locally
    connectionStatuses[userId] = { status: "NONE", canConnect: true };
    filterResults();
  } catch (error) {
    console.error("Error cancelling request:", error);
    showAlert("Failed to cancel request", "error");
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
document.addEventListener("DOMContentLoaded", initSearchPage);
