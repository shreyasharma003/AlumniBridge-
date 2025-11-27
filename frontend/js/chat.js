/**
 * =============================================
 * CHAT PAGE - AlumniBridge
 * Real-time messaging with connections
 * =============================================
 */

// State
let currentUserId = null;
let currentConversation = null;
let conversations = [];
let connections = [];
let messagePollingInterval = null;
let statusPollingInterval = null;

/**
 * Initialize chat page
 */
async function initChatPage() {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    currentUserId = localStorage.getItem('userId');

    // Check for userId in URL params (direct chat link)
    const urlParams = new URLSearchParams(window.location.search);
    const targetUserId = urlParams.get('userId');

    // Load conversations and connections
    await Promise.all([
        loadConversations(),
        loadConnections()
    ]);

    // If direct chat link, open that conversation
    if (targetUserId) {
        const userId = parseInt(targetUserId);
        const conv = conversations.find(c => c.userId === userId);
        if (conv) {
            selectConversation(conv);
        } else {
            // Start new conversation with this user
            const conn = connections.find(c => c.id === userId);
            if (conn) {
                selectConversation({
                    userId: conn.id,
                    userName: conn.name,
                    isOnline: conn.isOnline,
                    pictureUrl: conn.pictureUrl,
                    role: conn.role
                });
            }
        }
    }

    // Start heartbeat and polling
    startHeartbeat();
    startStatusPolling();

    // Setup keyboard shortcut
    document.getElementById('messageInput')?.addEventListener('keypress', handleKeyPress);
}

/**
 * Load conversations from server
 */
async function loadConversations() {
    const container = document.getElementById('conversationsList');
    
    try {
        const data = await apiCall('/messages', { method: 'GET' });
        conversations = data || [];
        renderConversations();
    } catch (error) {
        console.error('Error loading conversations:', error);
        container.innerHTML = '<div class="no-conversations">Failed to load conversations</div>';
    }
}

/**
 * Load connections for new chat
 */
async function loadConnections() {
    try {
        const data = await apiCall('/chat/connections', { method: 'GET' });
        connections = data || [];
    } catch (error) {
        console.error('Error loading connections:', error);
        connections = [];
    }
}

/**
 * Render conversations list
 */
function renderConversations() {
    const container = document.getElementById('conversationsList');
    const searchTerm = document.getElementById('searchConversations')?.value.toLowerCase() || '';

    let filtered = conversations;
    if (searchTerm) {
        filtered = conversations.filter(c => 
            c.userName.toLowerCase().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="no-conversations">
                <p>No conversations yet</p>
                <p><a href="connections.html">Find connections</a> to start chatting</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(conv => {
        const initials = getInitials(conv.userName);
        const isActive = currentConversation?.userId === conv.userId;
        const timeAgo = conv.lastMessageAt ? formatTime(conv.lastMessageAt) : '';

        return `
            <div class="conversation-item ${isActive ? 'active' : ''}" 
                 onclick="selectConversation(${JSON.stringify(conv).replace(/"/g, '&quot;')})">
                <div class="conversation-avatar">
                    ${conv.pictureUrl ? `<img src="${conv.pictureUrl}" alt="${conv.userName}">` : initials}
                    <span class="online-indicator ${conv.isOnline ? 'online' : 'offline'}"></span>
                </div>
                <div class="conversation-info">
                    <div class="conversation-name">${conv.userName}</div>
                    <div class="conversation-preview">${conv.lastMessage || 'No messages yet'}</div>
                </div>
                ${timeAgo ? `<div class="conversation-time">${timeAgo}</div>` : ''}
            </div>
        `;
    }).join('');
}

/**
 * Filter conversations on search
 */
function filterConversations() {
    renderConversations();
}

/**
 * Select a conversation
 */
function selectConversation(conv) {
    // Handle both object and string (from onclick)
    if (typeof conv === 'string') {
        conv = JSON.parse(conv);
    }

    currentConversation = conv;
    
    // Update UI
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('chatWindow').style.display = 'flex';
    
    // Update header
    document.getElementById('chatUserName').textContent = conv.userName;
    document.getElementById('chatAvatar').innerHTML = conv.pictureUrl 
        ? `<img src="${conv.pictureUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
        : getInitials(conv.userName);
    
    updateOnlineStatus(conv.isOnline);
    
    // Highlight in sidebar
    renderConversations();
    
    // Load messages
    loadMessages(conv.userId);
    
    // Start message polling
    startMessagePolling(conv.userId);

    // Focus input
    document.getElementById('messageInput')?.focus();
}

/**
 * Update online status display
 */
function updateOnlineStatus(isOnline) {
    const statusContainer = document.getElementById('chatUserStatus');
    const dotClass = isOnline ? 'online' : 'offline';
    const statusText = isOnline ? 'Online' : 'Offline';
    
    statusContainer.innerHTML = `
        <span class="status-dot ${dotClass}"></span>
        <span class="status-text ${dotClass}">${statusText}</span>
    `;
}

/**
 * Load messages for a conversation
 */
async function loadMessages(userId) {
    const container = document.getElementById('messagesArea');
    
    try {
        const messages = await apiCall(`/messages/${userId}`, { method: 'GET' });
        renderMessages(messages || []);
    } catch (error) {
        console.error('Error loading messages:', error);
        container.innerHTML = '<div class="loading">Failed to load messages</div>';
    }
}

/**
 * Render messages
 */
function renderMessages(messages) {
    const container = document.getElementById('messagesArea');
    
    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;color:#6b7280;padding:40px;">
                <p>No messages yet. Say hello! 👋</p>
            </div>
        `;
        return;
    }

    let html = '';
    let lastDate = null;

    messages.forEach(msg => {
        const msgDate = new Date(msg.timestamp).toDateString();
        
        // Add date separator if new day
        if (msgDate !== lastDate) {
            html += `<div class="date-separator"><span>${formatDateLabel(msg.timestamp)}</span></div>`;
            lastDate = msgDate;
        }

        const isSent = msg.senderId == currentUserId;
        const time = formatMessageTime(msg.timestamp);

        html += `
            <div class="message ${isSent ? 'sent' : 'received'}">
                <div class="message-bubble">
                    <div class="message-content">${escapeHtml(msg.content)}</div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

/**
 * Send a message
 */
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();

    if (!content || !currentConversation) return;

    input.value = '';

    try {
        await apiCall('/messages', {
            method: 'POST',
            body: JSON.stringify({
                recipientId: currentConversation.userId,
                content: content
            })
        });

        // Reload messages
        loadMessages(currentConversation.userId);
        
        // Update conversation list
        loadConversations();
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message');
        input.value = content; // Restore message
    }
}

/**
 * Handle enter key press
 */
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

/**
 * Show new chat modal
 */
function showNewChatModal() {
    document.getElementById('newChatModal').style.display = 'flex';
    renderNewChatList();
}

/**
 * Hide new chat modal
 */
function hideNewChatModal() {
    document.getElementById('newChatModal').style.display = 'none';
}

/**
 * Render new chat connections list
 */
function renderNewChatList() {
    const container = document.getElementById('newChatList');
    const searchTerm = document.getElementById('searchConnections')?.value.toLowerCase() || '';

    let filtered = connections;
    if (searchTerm) {
        filtered = connections.filter(c => 
            c.name.toLowerCase().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="no-conversations">
                <p>No connections found</p>
                <p><a href="connections.html">Find people to connect with</a></p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(conn => {
        const initials = getInitials(conn.name);
        return `
            <div class="connection-item" onclick="startNewChat(${conn.id}, '${conn.name}', ${conn.isOnline || false})">
                <div class="conversation-avatar">
                    ${conn.pictureUrl ? `<img src="${conn.pictureUrl}" alt="${conn.name}">` : initials}
                    <span class="online-indicator ${conn.isOnline ? 'online' : 'offline'}"></span>
                </div>
                <div class="conversation-info">
                    <div class="conversation-name">
                        ${conn.name}
                        <span class="role-badge ${conn.role?.toLowerCase()}">${conn.role}</span>
                    </div>
                    ${conn.headline ? `<div class="conversation-preview">${conn.headline}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Filter new chat list
 */
function filterNewChatList() {
    renderNewChatList();
}

/**
 * Start a new chat
 */
function startNewChat(userId, userName, isOnline) {
    hideNewChatModal();
    selectConversation({
        userId: userId,
        userName: userName,
        isOnline: isOnline
    });
}

/**
 * View profile of current chat partner
 */
function viewProfile() {
    if (currentConversation) {
        window.location.href = `profile.html?id=${currentConversation.userId}`;
    }
}

/**
 * Start heartbeat to update online status
 */
function startHeartbeat() {
    // Send heartbeat every 2 minutes
    const sendHeartbeat = async () => {
        try {
            await apiCall('/users/heartbeat', { method: 'POST' });
        } catch (error) {
            console.error('Heartbeat failed:', error);
        }
    };

    sendHeartbeat(); // Initial
    setInterval(sendHeartbeat, 120000); // Every 2 minutes
}

/**
 * Start polling for status updates
 */
function startStatusPolling() {
    // Update statuses every 30 seconds
    statusPollingInterval = setInterval(async () => {
        if (conversations.length > 0) {
            const userIds = conversations.map(c => c.userId);
            try {
                const statuses = await apiCall('/users/status/bulk', {
                    method: 'POST',
                    body: JSON.stringify(userIds)
                });
                
                // Update conversation statuses
                statuses.forEach(s => {
                    const conv = conversations.find(c => c.userId === s.userId);
                    if (conv) conv.isOnline = s.isOnline;
                });
                
                renderConversations();
                
                // Update current chat header
                if (currentConversation) {
                    const status = statuses.find(s => s.userId === currentConversation.userId);
                    if (status) {
                        updateOnlineStatus(status.isOnline);
                    }
                }
            } catch (error) {
                console.error('Status polling failed:', error);
            }
        }
    }, 30000);
}

/**
 * Start polling for new messages
 */
function startMessagePolling(userId) {
    // Clear existing interval
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
    }

    // Poll every 5 seconds
    messagePollingInterval = setInterval(() => {
        if (currentConversation?.userId === userId) {
            loadMessages(userId);
        }
    }, 5000);
}

/**
 * Get initials from name
 */
function getInitials(name) {
    if (!name) return '?';
    return name.split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

/**
 * Format time for conversation list
 */
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

/**
 * Format message time
 */
function formatMessageTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format date label for message groups
 */
function formatDateLabel(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Cleanup on page leave
window.addEventListener('beforeunload', () => {
    if (messagePollingInterval) clearInterval(messagePollingInterval);
    if (statusPollingInterval) clearInterval(statusPollingInterval);
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', initChatPage);
