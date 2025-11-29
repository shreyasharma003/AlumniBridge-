/**
 * =============================================
 * MANAGE EVENTS - ADMIN DASHBOARD JAVASCRIPT
 * AlumniBridge - Production Ready
 * =============================================
 */

// Configuration
const API_BASE = "http://localhost:8080/api";

// State
let allEvents = [];
let editingEventId = null;
let currentFilter = "all";
let searchQuery = "";

// DOM Elements
const eventForm = document.getElementById("eventForm");
const eventsTableBody = document.getElementById("eventsTableBody");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const formTitle = document.getElementById("formTitle");
const alertContainer = document.getElementById("alertContainer");
const imageInput = document.getElementById("eventImage");
const imagePreview = document.getElementById("imagePreview");

// Statistics elements
const statTotalEvents = document.getElementById("statTotalEvents");
const statActiveEvents = document.getElementById("statActiveEvents");
const statTotalRegistrations = document.getElementById("statTotalRegistrations");
const statUpcomingEvents = document.getElementById("statUpcomingEvents");

// ==================== INITIALIZATION ====================

document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    loadEvents();
    setupEventListeners();
});

function checkAuth() {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    
    console.log("🔐 Auth Check:");
    console.log("  Token:", token ? `Present (${token.length} chars)` : "MISSING");
    console.log("  Role:", role || "MISSING");
    console.log("  UserId:", userId || "MISSING");
    
    if (!token) {
        showAlert("Please login to access this page", "error");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
        return;
    }
    
    // Allow both ADMIN and ALUMNI to manage events
    if (role !== "ADMIN" && role !== "ALUMNI") {
        showAlert("Access denied. Admin or Alumni privileges required.", "error");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
        return;
    }
}

function setupEventListeners() {
    // Form submission
    eventForm.addEventListener("submit", handleFormSubmit);
    
    // Search input
    searchInput.addEventListener("input", debounce(() => {
        searchQuery = searchInput.value.toLowerCase();
        renderEventsTable();
    }, 300));
    
    // Filter select
    filterSelect.addEventListener("change", () => {
        currentFilter = filterSelect.value;
        renderEventsTable();
    });
    
    // Image upload preview
    imageInput.addEventListener("change", handleImageUpload);
    
    // Close modal on background click
    document.getElementById("editModal").addEventListener("click", (e) => {
        if (e.target.classList.contains("modal-overlay")) {
            closeEditModal();
        }
    });
    
    // Close modal on ESC key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeEditModal();
        }
    });
}

// ==================== API CALLS ====================

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    console.log("🔑 Getting auth headers, token:", token ? `Present (${token.length} chars)` : "MISSING");
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

async function loadEvents() {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/events/`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        allEvents = await response.json();
        console.log("✅ Loaded events:", allEvents.length);
        
        updateStatistics();
        renderEventsTable();
    } catch (error) {
        console.error("❌ Failed to load events:", error);
        showAlert("Failed to load events. Please try again.", "error");
        showEmptyState();
    }
}

async function createEvent(eventData) {
    try {
        console.log("📤 Sending event data:", eventData);
        console.log("🔑 Token:", localStorage.getItem("token") ? "Present" : "MISSING");
        
        const response = await fetch(`${API_BASE}/events/`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(eventData)
        });
        
        console.log("📊 Response status:", response.status);
        
        const responseText = await response.text();
        console.log("📋 Response body:", responseText);
        
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            responseData = { message: responseText };
        }
        
        if (!response.ok) {
            throw new Error(responseData.message || responseData.error || `HTTP ${response.status}`);
        }
        
        console.log("✅ Event created:", responseData.id);
        
        showAlert("Event created successfully!", "success");
        resetForm();
        loadEvents();
        
        return responseData;
    } catch (error) {
        console.error("❌ Failed to create event:", error);
        showAlert("Failed to create event: " + error.message, "error");
        throw error;
    }
}

async function updateEvent(eventId, eventData) {
    try {
        const response = await fetch(`${API_BASE}/events/${eventId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(eventData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        const updatedEvent = await response.json();
        console.log("✅ Event updated:", eventId);
        
        showAlert("Event updated successfully!", "success");
        closeEditModal();
        loadEvents();
        
        return updatedEvent;
    } catch (error) {
        console.error("❌ Failed to update event:", error);
        showAlert("Failed to update event: " + error.message, "error");
        throw error;
    }
}

async function deleteEvent(eventId) {
    try {
        const response = await fetch(`${API_BASE}/events/${eventId}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        console.log("✅ Event deleted:", eventId);
        showAlert("Event deleted successfully!", "success");
        loadEvents();
    } catch (error) {
        console.error("❌ Failed to delete event:", error);
        showAlert("Failed to delete event: " + error.message, "error");
    }
}

// ==================== FORM HANDLING ====================

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const eventData = {
        title: document.getElementById("eventTitle").value.trim(),
        description: document.getElementById("eventDescription").value.trim(),
        eventDate: document.getElementById("eventDate").value,
        eventTime: document.getElementById("eventTime").value,
        location: document.getElementById("eventLocation").value.trim(),
        organizer: document.getElementById("eventOrganizer").value.trim() || null,
        capacity: parseInt(document.getElementById("eventCapacity").value) || 100,
        isActive: document.getElementById("eventActive").checked,
        image: imagePreview.src && imagePreview.classList.contains("active") ? imagePreview.src : null
    };
    
    // Validation
    if (!eventData.title || !eventData.eventDate || !eventData.eventTime || !eventData.location) {
        showAlert("Please fill in all required fields", "error");
        return;
    }
    
    // Disable submit button
    const submitBtn = eventForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner" style="width:16px;height:16px;border-width:2px;margin:0;"></span> Saving...';
    
    try {
        await createEvent(eventData);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '📅 Create Event';
    }
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
        showAlert("Please select a valid image file", "error");
        return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showAlert("Image size should be less than 2MB", "error");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        imagePreview.src = event.target.result;
        imagePreview.classList.add("active");
    };
    reader.readAsDataURL(file);
}

function resetForm() {
    eventForm.reset();
    editingEventId = null;
    formTitle.textContent = "Create New Event";
    imagePreview.src = "";
    imagePreview.classList.remove("active");
    document.getElementById("eventActive").checked = true;
}

// ==================== EVENTS TABLE ====================

function renderEventsTable() {
    const filteredEvents = filterEvents(allEvents);
    
    if (filteredEvents.length === 0) {
        showEmptyState();
        return;
    }
    
    eventsTableBody.innerHTML = filteredEvents.map(event => {
        const dateStr = formatDate(event.eventDate || event.startAt);
        const timeStr = event.eventTime || formatTime(event.startAt);
        const isActive = event.isActive !== false;
        const registrations = event.registrationCount || 0;
        
        return `
            <tr>
                <td>
                    <div class="event-title-cell">
                        ${event.image 
                            ? `<img src="${event.image}" alt="" class="event-image-thumb">`
                            : `<div class="event-image-placeholder">📅</div>`
                        }
                        <div class="event-title-text">
                            ${escapeHtml(event.title)}
                            <small>${escapeHtml(event.location || 'No location')}</small>
                        </div>
                    </div>
                </td>
                <td>${dateStr}</td>
                <td>${timeStr}</td>
                <td>
                    <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">
                        ${isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <span class="registration-badge">
                        👥 ${registrations}/${event.capacity || 100}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-icon" onclick="openEditModal(${event.id})" title="Edit">
                            ✏️
                        </button>
                        <button class="btn btn-danger btn-icon" onclick="confirmDelete(${event.id}, '${escapeHtml(event.title)}')" title="Delete">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function filterEvents(events) {
    return events.filter(event => {
        // Search filter
        const matchesSearch = !searchQuery || 
            event.title?.toLowerCase().includes(searchQuery) ||
            event.location?.toLowerCase().includes(searchQuery) ||
            event.description?.toLowerCase().includes(searchQuery);
        
        // Status filter
        let matchesFilter = true;
        if (currentFilter === "active") {
            matchesFilter = event.isActive !== false;
        } else if (currentFilter === "inactive") {
            matchesFilter = event.isActive === false;
        } else if (currentFilter === "upcoming") {
            const eventDate = new Date(event.eventDate || event.startAt);
            matchesFilter = eventDate >= new Date();
        } else if (currentFilter === "past") {
            const eventDate = new Date(event.eventDate || event.startAt);
            matchesFilter = eventDate < new Date();
        }
        
        return matchesSearch && matchesFilter;
    });
}

function showLoading() {
    eventsTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="loading">
                <div class="loading-spinner"></div>
                <p>Loading events...</p>
            </td>
        </tr>
    `;
}

function showEmptyState() {
    eventsTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="empty-state">
                <div class="empty-state-icon">📅</div>
                <h3>No events found</h3>
                <p>Create your first event using the form on the left.</p>
            </td>
        </tr>
    `;
}

// ==================== EDIT MODAL ====================

function openEditModal(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;
    
    editingEventId = eventId;
    
    // Populate modal form
    document.getElementById("editEventTitle").value = event.title || "";
    document.getElementById("editEventDescription").value = event.description || "";
    document.getElementById("editEventDate").value = event.eventDate || (event.startAt ? event.startAt.split("T")[0] : "");
    document.getElementById("editEventTime").value = event.eventTime || (event.startAt ? event.startAt.split("T")[1]?.substring(0, 5) : "");
    document.getElementById("editEventLocation").value = event.location || "";
    document.getElementById("editEventOrganizer").value = event.organizer || "";
    document.getElementById("editEventCapacity").value = event.capacity || 100;
    document.getElementById("editEventActive").checked = event.isActive !== false;
    
    // Image preview
    const editImagePreview = document.getElementById("editImagePreview");
    if (event.image) {
        editImagePreview.src = event.image;
        editImagePreview.classList.add("active");
    } else {
        editImagePreview.src = "";
        editImagePreview.classList.remove("active");
    }
    
    // Show modal
    document.getElementById("editModal").classList.add("active");
}

function closeEditModal() {
    document.getElementById("editModal").classList.remove("active");
    editingEventId = null;
}

async function saveEditedEvent() {
    if (!editingEventId) return;
    
    const editImagePreview = document.getElementById("editImagePreview");
    
    const eventData = {
        title: document.getElementById("editEventTitle").value.trim(),
        description: document.getElementById("editEventDescription").value.trim(),
        eventDate: document.getElementById("editEventDate").value,
        eventTime: document.getElementById("editEventTime").value,
        location: document.getElementById("editEventLocation").value.trim(),
        organizer: document.getElementById("editEventOrganizer").value.trim() || null,
        capacity: parseInt(document.getElementById("editEventCapacity").value) || 100,
        isActive: document.getElementById("editEventActive").checked,
        image: editImagePreview.src && editImagePreview.classList.contains("active") ? editImagePreview.src : null
    };
    
    // Validation
    if (!eventData.title || !eventData.eventDate || !eventData.eventTime || !eventData.location) {
        showAlert("Please fill in all required fields", "error");
        return;
    }
    
    const saveBtn = document.querySelector("#editModal .btn-success");
    saveBtn.disabled = true;
    saveBtn.innerHTML = "Saving...";
    
    try {
        await updateEvent(editingEventId, eventData);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = "💾 Save Changes";
    }
}

function handleEditImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
        showAlert("Please select a valid image file", "error");
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
        showAlert("Image size should be less than 2MB", "error");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const editImagePreview = document.getElementById("editImagePreview");
        editImagePreview.src = event.target.result;
        editImagePreview.classList.add("active");
    };
    reader.readAsDataURL(file);
}

// ==================== DELETE ====================

function confirmDelete(eventId, eventTitle) {
    if (confirm(`Are you sure you want to delete "${eventTitle}"?\n\nThis action cannot be undone.`)) {
        deleteEvent(eventId);
    }
}

// ==================== STATISTICS ====================

function updateStatistics() {
    const now = new Date();
    
    const totalEvents = allEvents.length;
    const activeEvents = allEvents.filter(e => e.isActive !== false).length;
    const totalRegistrations = allEvents.reduce((sum, e) => sum + (e.registrationCount || 0), 0);
    const upcomingEvents = allEvents.filter(e => {
        const eventDate = new Date(e.eventDate || e.startAt);
        return eventDate >= now && e.isActive !== false;
    }).length;
    
    animateCounter(statTotalEvents, totalEvents);
    animateCounter(statActiveEvents, activeEvents);
    animateCounter(statTotalRegistrations, totalRegistrations);
    animateCounter(statUpcomingEvents, upcomingEvents);
}

function animateCounter(element, target) {
    const duration = 500;
    const start = parseInt(element.textContent) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current);
        }
    }, 16);
}

// ==================== UTILITIES ====================

function showAlert(message, type = "info") {
    const alert = document.createElement("div");
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <span>${type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"}</span>
        <span>${message}</span>
    `;
    
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.style.opacity = "0";
        alert.style.transform = "translateY(-10px)";
        setTimeout(() => alert.remove(), 300);
    }, 4000);
}

function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function formatTime(dateTimeStr) {
    if (!dateTimeStr) return "N/A";
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function goBack() {
    const role = localStorage.getItem("userRole");
    if (role === "ADMIN") {
        window.location.href = "admin-dashboard.html";
    } else if (role === "ALUMNI") {
        window.location.href = "alumni-dashboard.html";
    } else {
        window.location.href = "login.html";
    }
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    window.location.href = "login.html";
}
