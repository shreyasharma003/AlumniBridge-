/**
 * =============================================
 * CHAT PAGE - AlumniBridge
 * Real-time messaging with WebSocket/STOMP
 * =============================================
 */

const API_BASE = "http://localhost:8080/api";
const WS_URL = "http://localhost:8080/ws";

// =============================================
// STATE
// =============================================
const state = {
  currentUserId: null,
  currentUserName: null,
  selectedChat: null, // { userId, userName, isOnline, pictureUrl }
  connections: [],
  filteredConnections: [],
  messages: [],
  stompClient: null,
  connected: false,
  heartbeatInterval: null,
  pollingInterval: null,
};

// =============================================
// DOM SELECTORS
// =============================================
const selectors = {
  connectionsList: document.getElementById("connectionsList"),
  sidebarSearch: document.getElementById("sidebarSearch"),
  emptyState: document.getElementById("emptyState"),
  chatWindow: document.getElementById("chatWindow"),
  chatAvatar: document.getElementById("chatAvatar"),
  chatUserName: document.getElementById("chatUserName"),
  chatUserStatus: document.getElementById("chatUserStatus"),
  messagesArea: document.getElementById("messagesArea"),
  messageInput: document.getElementById("messageInput"),
  sendBtn: document.getElementById("sendBtn"),
  viewProfileBtn: document.getElementById("viewProfileBtn"),
  newChatBtn: document.getElementById("newChatBtn"),
  newChatModal: document.getElementById("newChatModal"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  modalSearch: document.getElementById("modalSearch"),
  modalConnectionsList: document.getElementById("modalConnectionsList"),
};

// =============================================
// AUTH & TOKEN
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
  return response.json();
}

// =============================================
// WEBSOCKET CONNECTION
// =============================================
function connectWebSocket() {
  if (state.stompClient && state.connected) return;

  const socket = new SockJS(WS_URL);
  state.stompClient = Stomp.over(socket);
  
  // Disable debug logging in production
  state.stompClient.debug = null;

  state.stompClient.connect(
    {},
    () => {
      state.connected = true;
      console.log("WebSocket connected");

      // Subscribe to personal message queue
      if (state.currentUserId) {
        state.stompClient.subscribe(
          `/queue/messages/${state.currentUserId}`,
          onMessageReceived
        );
      }
    },
    (error) => {
      state.connected = false;
      console.error("WebSocket connection error:", error);
      // Reconnect after 5 seconds
      setTimeout(connectWebSocket, 5000);
    }
  );
}

function onMessageReceived(payload) {
  try {
    const message = JSON.parse(payload.body);
    
    // If message is for current conversation, add to view
    if (
      state.selectedChat &&
      (message.senderId === state.selectedChat.userId ||
        message.receiverId === state.selectedChat.userId)
    ) {
      appendMessage({
        id: message.id || Date.now(),
        senderId: message.senderId,
        content: message.content,
        timestamp: message.timestamp || new Date().toISOString(),
      });
      scrollToBottom();
    }

    // Refresh connections list to update last message
    loadConnections();
  } catch (e) {
    console.error("Error parsing message:", e);
  }
}

function sendViaWebSocket(recipientId, content) {
  if (!state.stompClient || !state.connected) {
    console.warn("WebSocket not connected, using REST API");
    return false;
  }

  state.stompClient.send(
    "/app/chat.send",
    {},
    JSON.stringify({
      senderId: state.currentUserId,
      receiverId: recipientId,
      content: content,
      isEventLink: false,
      eventId: null,
    })
  );

  return true;
}

// =============================================
// LOAD DATA
// =============================================
async function loadCurrentUser() {
  try {
    const user = await apiRequest("/users/me");
    state.currentUserId = user.id;
    state.currentUserName = user.name || user.firstName || user.email;
    localStorage.setItem("userId", user.id);
  } catch (error) {
    console.error("Failed to load current user:", error);
  }
}

async function loadConnections() {
  try {
    const connections = await apiRequest("/chat/connections");
    state.connections = Array.isArray(connections) ? connections : [];
    state.filteredConnections = [...state.connections];
    renderConnections();
  } catch (error) {
    console.error("Failed to load connections:", error);
    selectors.connectionsList.innerHTML = `
      <div class="no-results">
        <h3>Unable to load connections</h3>
        <p>Please try again later</p>
      </div>
    `;
  }
}

async function loadMessages(userId) {
  try {
    const messages = await apiRequest(`/messages/${userId}`);
    state.messages = Array.isArray(messages) ? messages : [];
    renderMessages();
    scrollToBottom();
  } catch (error) {
    console.error("Failed to load messages:", error);
    selectors.messagesArea.innerHTML = `
      <div class="no-results">
        <p>Unable to load messages</p>
      </div>
    `;
  }
}

// =============================================
// RENDER FUNCTIONS
// =============================================
function renderConnections() {
  const list = state.filteredConnections;

  if (list.length === 0) {
    selectors.connectionsList.innerHTML = `
      <div class="no-results">
        <h3>No connections yet</h3>
        <p>Connect with alumni and students to start chatting</p>
      </div>
    `;
    return;
  }

  selectors.connectionsList.innerHTML = list
    .map((conn) => {
      const isActive = state.selectedChat?.userId === conn.id;
      const initials = getInitials(conn.name);
      const lastMsg = conn.lastMessage ? escapeHtml(conn.lastMessage) : "No messages yet";
      const timeAgo = conn.lastMessageAt ? formatTimeAgo(conn.lastMessageAt) : "";

      return `
        <div class="connection-item ${isActive ? "active" : ""}" data-user-id="${conn.id}">
          <div class="connection-avatar">
            <div class="avatar">
              ${conn.pictureUrl ? `<img src="${conn.pictureUrl}" alt="${escapeHtml(conn.name)}">` : initials}
            </div>
            <span class="online-dot ${conn.isOnline ? "online" : ""}"></span>
          </div>
          <div class="connection-info">
            <div class="connection-name">${escapeHtml(conn.name)}</div>
            <div class="connection-preview">${lastMsg}</div>
          </div>
          ${timeAgo ? `<div class="connection-time">${timeAgo}</div>` : ""}
        </div>
      `;
    })
    .join("");
}

function renderMessages() {
  const messages = state.messages;

  if (messages.length === 0) {
    selectors.messagesArea.innerHTML = `
      <div class="no-results" style="height:100%;display:flex;flex-direction:column;justify-content:center;">
        <p>No messages yet</p>
        <p style="font-size:0.9rem;margin-top:8px;">Say hello! 👋</p>
      </div>
    `;
    return;
  }

  let html = "";
  let lastDate = null;

  messages.forEach((msg) => {
    const msgDate = new Date(msg.timestamp).toDateString();

    // Add date separator
    if (msgDate !== lastDate) {
      html += `<div class="date-separator"><span>${formatDateLabel(msg.timestamp)}</span></div>`;
      lastDate = msgDate;
    }

    const isSent = msg.senderId == state.currentUserId;
    const time = formatTime(msg.timestamp);

    html += `
      <div class="message ${isSent ? "sent" : "received"}">
        <div class="message-bubble">
          <div class="message-content">${escapeHtml(msg.content)}</div>
          <div class="message-time">${time}</div>
        </div>
      </div>
    `;
  });

  // Add typing indicator placeholder
  html += `
    <div class="typing-indicator" id="typingIndicator">
      <span></span><span></span><span></span>
    </div>
  `;

  selectors.messagesArea.innerHTML = html;
}

function appendMessage(msg) {
  // Remove typing indicator temporarily
  const typingEl = document.getElementById("typingIndicator");
  if (typingEl) typingEl.remove();

  const isSent = msg.senderId == state.currentUserId;
  const time = formatTime(msg.timestamp);

  const messageHtml = `
    <div class="message ${isSent ? "sent" : "received"}">
      <div class="message-bubble">
        <div class="message-content">${escapeHtml(msg.content)}</div>
        <div class="message-time">${time}</div>
      </div>
    </div>
  `;

  selectors.messagesArea.insertAdjacentHTML("beforeend", messageHtml);

  // Re-add typing indicator
  selectors.messagesArea.insertAdjacentHTML(
    "beforeend",
    `<div class="typing-indicator" id="typingIndicator"><span></span><span></span><span></span></div>`
  );
}

function renderModalConnections() {
  const searchTerm = selectors.modalSearch?.value.toLowerCase() || "";
  const filtered = state.connections.filter((c) =>
    c.name.toLowerCase().includes(searchTerm)
  );

  if (filtered.length === 0) {
    selectors.modalConnectionsList.innerHTML = `
      <div class="no-results">
        <p>No connections found</p>
      </div>
    `;
    return;
  }

  selectors.modalConnectionsList.innerHTML = filtered
    .map((conn) => {
      const initials = getInitials(conn.name);
      return `
        <div class="connection-item" data-user-id="${conn.id}" data-modal="true">
          <div class="connection-avatar">
            <div class="avatar">
              ${conn.pictureUrl ? `<img src="${conn.pictureUrl}" alt="${escapeHtml(conn.name)}">` : initials}
            </div>
            <span class="online-dot ${conn.isOnline ? "online" : ""}"></span>
          </div>
          <div class="connection-info">
            <div class="connection-name">${escapeHtml(conn.name)}</div>
            ${conn.headline ? `<div class="connection-preview">${escapeHtml(conn.headline)}</div>` : ""}
          </div>
        </div>
      `;
    })
    .join("");
}

// =============================================
// CHAT ACTIONS
// =============================================
function selectChat(userId) {
  const conn = state.connections.find((c) => c.id === userId);
  if (!conn) return;

  state.selectedChat = {
    userId: conn.id,
    userName: conn.name,
    isOnline: conn.isOnline,
    pictureUrl: conn.pictureUrl,
  };

  // Update UI
  selectors.emptyState.style.display = "none";
  selectors.chatWindow.classList.remove("hidden");

  // Update header
  selectors.chatUserName.textContent = conn.name;
  selectors.chatAvatar.innerHTML = conn.pictureUrl
    ? `<img src="${conn.pictureUrl}" alt="${escapeHtml(conn.name)}">`
    : getInitials(conn.name);

  updateOnlineStatus(conn.isOnline);

  // Highlight in sidebar
  renderConnections();

  // Load messages
  loadMessages(userId);

  // Focus input
  selectors.messageInput?.focus();

  // Close modal if open
  hideModal();
}

function updateOnlineStatus(isOnline) {
  selectors.chatUserStatus.textContent = isOnline ? "Online" : "Offline";
  selectors.chatUserStatus.className = `status-text ${isOnline ? "online" : ""}`;
}

async function sendMessage() {
  const content = selectors.messageInput.value.trim();
  if (!content || !state.selectedChat) return;

  const recipientId = state.selectedChat.userId;

  // Clear input immediately
  selectors.messageInput.value = "";

  // Optimistically add message to UI
  const tempMsg = {
    id: `temp-${Date.now()}`,
    senderId: state.currentUserId,
    content: content,
    timestamp: new Date().toISOString(),
  };
  appendMessage(tempMsg);
  scrollToBottom();

  // Try WebSocket first, fall back to REST
  const sentViaWS = sendViaWebSocket(recipientId, content);

  if (!sentViaWS) {
    try {
      await apiRequest("/messages", {
        method: "POST",
        body: JSON.stringify({
          recipientId: recipientId,
          content: content,
        }),
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    }
  }

  // Refresh connections to update last message
  setTimeout(loadConnections, 500);
}

function scrollToBottom() {
  if (selectors.messagesArea) {
    selectors.messagesArea.scrollTop = selectors.messagesArea.scrollHeight;
  }
}

// =============================================
// MODAL
// =============================================
function showModal() {
  selectors.newChatModal?.classList.remove("hidden");
  renderModalConnections();
  selectors.modalSearch?.focus();
}

function hideModal() {
  selectors.newChatModal?.classList.add("hidden");
  if (selectors.modalSearch) selectors.modalSearch.value = "";
}

// =============================================
// HEARTBEAT & POLLING
// =============================================
function startHeartbeat() {
  // Send heartbeat every 2 minutes
  const sendHeartbeat = async () => {
    try {
      await apiRequest("/users/heartbeat", { method: "POST" });
    } catch (error) {
      console.error("Heartbeat failed:", error);
    }
  };

  sendHeartbeat();
  state.heartbeatInterval = setInterval(sendHeartbeat, 120000);
}

function startPolling() {
  // Poll for new messages every 5 seconds (fallback for WebSocket)
  state.pollingInterval = setInterval(async () => {
    if (state.selectedChat) {
      await loadMessages(state.selectedChat.userId);
    }
    await loadConnections();
  }, 5000);
}

function stopPolling() {
  if (state.pollingInterval) {
    clearInterval(state.pollingInterval);
    state.pollingInterval = null;
  }
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

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return "";
  const now = new Date();
  const date = new Date(timestamp);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatDateLabel(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// =============================================
// EVENT LISTENERS
// =============================================
function attachEventListeners() {
  // Sidebar search
  selectors.sidebarSearch?.addEventListener(
    "input",
    debounce((e) => {
      const term = e.target.value.toLowerCase();
      state.filteredConnections = state.connections.filter((c) =>
        c.name.toLowerCase().includes(term)
      );
      renderConnections();
    }, 300)
  );

  // Connection click (sidebar)
  selectors.connectionsList?.addEventListener("click", (e) => {
    const item = e.target.closest(".connection-item");
    if (item) {
      const userId = parseInt(item.dataset.userId, 10);
      selectChat(userId);
    }
  });

  // Send button
  selectors.sendBtn?.addEventListener("click", sendMessage);

  // Enter key to send
  selectors.messageInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // View profile button
  selectors.viewProfileBtn?.addEventListener("click", () => {
    if (state.selectedChat) {
      window.location.href = `profile.html?id=${state.selectedChat.userId}`;
    }
  });

  // New chat button
  selectors.newChatBtn?.addEventListener("click", showModal);

  // Close modal
  selectors.closeModalBtn?.addEventListener("click", hideModal);
  
  // Close modal on backdrop click
  selectors.newChatModal?.querySelector(".modal-backdrop")?.addEventListener("click", hideModal);

  // Modal search
  selectors.modalSearch?.addEventListener(
    "input",
    debounce(() => renderModalConnections(), 300)
  );

  // Modal connection click
  selectors.modalConnectionsList?.addEventListener("click", (e) => {
    const item = e.target.closest(".connection-item");
    if (item) {
      const userId = parseInt(item.dataset.userId, 10);
      selectChat(userId);
    }
  });

  // Check for direct chat link
  const urlParams = new URLSearchParams(window.location.search);
  const targetUserId = urlParams.get("userId");
  if (targetUserId) {
    setTimeout(() => selectChat(parseInt(targetUserId, 10)), 500);
  }
}

// =============================================
// INITIALIZATION
// =============================================
async function init() {
  if (!checkAuth()) return;

  // Show loading
  selectors.connectionsList.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;

  // Load current user first
  await loadCurrentUser();

  // Connect WebSocket
  connectWebSocket();

  // Load connections
  await loadConnections();

  // Start heartbeat
  startHeartbeat();

  // Start polling as fallback
  startPolling();

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

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (state.stompClient) {
    state.stompClient.disconnect();
  }
  if (state.heartbeatInterval) {
    clearInterval(state.heartbeatInterval);
  }
  stopPolling();
});
