/**
 * =============================================
 * EVENTS PAGE - STUDENT/ALUMNI VIEW JAVASCRIPT
 * AlumniBridge - Production Ready
 * =============================================
 */

// Configuration
const API_BASE = "http://localhost:8080/api";

// State
let allEvents = [];
let myRegistrations = new Set();
let currentTab = "all"; // "all", "upcoming", "registered"
let searchQuery = "";
let currentUserId = null;

// DOM Elements
const eventsGrid = document.getElementById("eventsGrid");
const searchInput = document.getElementById("searchInput");
const alertContainer = document.getElementById("alertContainer");
const tabBtns = document.querySelectorAll(".tab-btn");

// ==================== INITIALIZATION ====================

document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    currentUserId = localStorage.getItem("userId");
    initializeApp();
});

function checkAuth() {
    const token = localStorage.getItem("token");
    
    if (!token) {
        showAlert("Please login to view events", "error");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
        return false;
    }
    return true;
}

async function initializeApp() {
    setupEventListeners();
    await loadMyRegistrations();
    await loadEvents();
}

function setupEventListeners() {
    // Tab buttons
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentTab = btn.dataset.tab;
            renderEvents();
        });
    });
    
    // Search input
    searchInput.addEventListener("input", debounce(() => {
        searchQuery = searchInput.value.toLowerCase();
        renderEvents();
    }, 300));
    
    // Modal close handlers
    document.getElementById("eventModal").addEventListener("click", (e) => {
        if (e.target.classList.contains("modal-overlay")) {
            closeModal();
        }
    });
    
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeModal();
        }
    });
}

// ==================== API CALLS ====================

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

async function loadEvents() {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/events/active`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        allEvents = await response.json();
        console.log("✅ Loaded events:", allEvents.length);
        
        updateTabCounts();
        renderEvents();
    } catch (error) {
        console.error("❌ Failed to load events:", error);
        showAlert("Failed to load events. Please try again.", "error");
        showEmptyState("Unable to load events", "Please check your connection and try again.");
    }
}

async function loadMyRegistrations() {
    try {
        const response = await fetch(`${API_BASE}/events/my-registrations`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        myRegistrations = new Set(data.registeredEventIds || []);
        console.log("✅ Loaded registrations:", myRegistrations.size);
    } catch (error) {
        console.error("❌ Failed to load registrations:", error);
        // Non-fatal error, continue with empty set
    }
}

async function registerForEvent(eventId) {
    try {
        const response = await fetch(`${API_BASE}/events/register/${eventId}`, {
            method: "POST",
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }
        
        console.log("✅ Registered for event:", eventId);
        myRegistrations.add(eventId);
        
        // Update UI
        updateEventCard(eventId, true);
        updateTabCounts();
        showAlert("Successfully registered for the event!", "success");
        
        // Update modal if open
        updateModalRegistration(eventId, true);
        
        return true;
    } catch (error) {
        console.error("❌ Failed to register:", error);
        showAlert(error.message || "Failed to register for event", "error");
        return false;
    }
}

async function unregisterFromEvent(eventId) {
    try {
        const response = await fetch(`${API_BASE}/events/unregister/${eventId}`, {
            method: "POST",
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `HTTP ${response.status}`);
        }
        
        console.log("✅ Unregistered from event:", eventId);
        myRegistrations.delete(eventId);
        
        // Update UI
        updateEventCard(eventId, false);
        updateTabCounts();
        showAlert("Successfully unregistered from the event", "success");
        
        // Update modal if open
        updateModalRegistration(eventId, false);
        
        // If on "registered" tab, re-render
        if (currentTab === "registered") {
            renderEvents();
        }
        
        return true;
    } catch (error) {
        console.error("❌ Failed to unregister:", error);
        showAlert(error.message || "Failed to unregister from event", "error");
        return false;
    }
}

// ==================== RENDERING ====================

function renderEvents() {
    const filteredEvents = filterEvents(allEvents);
    
    if (filteredEvents.length === 0) {
        if (currentTab === "registered") {
            showEmptyState("No registered events", "You haven't registered for any events yet. Browse upcoming events to find something interesting!");
        } else if (searchQuery) {
            showEmptyState("No events found", "Try adjusting your search terms.");
        } else {
            showEmptyState("No upcoming events", "Check back later for new events!");
        }
        return;
    }
    
    eventsGrid.innerHTML = filteredEvents.map(event => renderEventCard(event)).join("");
}

function renderEventCard(event) {
    const isRegistered = myRegistrations.has(event.id);
    const eventDate = new Date(event.eventDate || event.startAt);
    const day = eventDate.getDate();
    const month = eventDate.toLocaleString("default", { month: "short" });
    const status = getEventStatus(event);
    const registrationPercent = event.capacity ? Math.min(100, ((event.registrationCount || 0) / event.capacity) * 100) : 0;
    
    return `
        <div class="event-card" data-event-id="${event.id}">
            <div class="event-card-image">
                ${event.image 
                    ? `<img src="${event.image}" alt="${escapeHtml(event.title)}">`
                    : `<div class="event-card-image-placeholder">📅</div>`
                }
                <div class="event-date-badge">
                    <div class="day">${day}</div>
                    <div class="month">${month}</div>
                </div>
                <span class="event-status-badge status-${status.class}">${status.text}</span>
            </div>
            <div class="event-card-body">
                <h3 class="event-card-title">${escapeHtml(event.title)}</h3>
                <p class="event-card-description">${escapeHtml(event.description || "No description available")}</p>
                <div class="event-card-meta">
                    <div class="event-meta-item">
                        <span class="icon">📍</span>
                        <span class="value">${escapeHtml(event.location || "TBA")}</span>
                    </div>
                    <div class="event-meta-item">
                        <span class="icon">⏰</span>
                        <span class="value">${formatTime(event.eventTime || event.startAt)}</span>
                    </div>
                    ${event.organizer ? `
                        <div class="event-meta-item">
                            <span class="icon">👤</span>
                            <span class="value">${escapeHtml(event.organizer)}</span>
                        </div>
                    ` : ""}
                </div>
                <div class="registration-progress">
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${registrationPercent}%"></div>
                    </div>
                    <div class="progress-text">
                        <span>${event.registrationCount || 0} registered</span>
                        <span>${event.capacity || "∞"} spots</span>
                    </div>
                </div>
            </div>
            <div class="event-card-footer">
                <button class="btn btn-details" onclick="openEventModal(${event.id})">
                    View Details
                </button>
                ${renderRegistrationButton(event, isRegistered)}
            </div>
        </div>
    `;
}

function renderRegistrationButton(event, isRegistered) {
    const status = getEventStatus(event);
    const isFull = event.capacity && (event.registrationCount || 0) >= event.capacity;
    
    if (status.class === "ended") {
        return `<button class="btn btn-secondary" disabled>Event Ended</button>`;
    }
    
    if (isRegistered) {
        return `
            <button class="btn btn-registered" id="reg-btn-${event.id}">
                ✓ Registered
            </button>
        `;
    }
    
    if (isFull) {
        return `<button class="btn btn-secondary" disabled>Event Full</button>`;
    }
    
    return `
        <button class="btn btn-register" id="reg-btn-${event.id}" onclick="handleRegister(${event.id})">
            Register Now
        </button>
    `;
}

function updateEventCard(eventId, isRegistered) {
    const btn = document.getElementById(`reg-btn-${eventId}`);
    if (!btn) return;
    
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;
    
    // Update registration count in state
    if (isRegistered) {
        event.registrationCount = (event.registrationCount || 0) + 1;
    } else {
        event.registrationCount = Math.max(0, (event.registrationCount || 1) - 1);
    }
    
    // Update button
    if (isRegistered) {
        btn.className = "btn btn-registered";
        btn.innerHTML = "✓ Registered";
        btn.onclick = null;
    } else {
        btn.className = "btn btn-register";
        btn.innerHTML = "Register Now";
        btn.onclick = () => handleRegister(eventId);
    }
    
    // Update progress bar
    const card = document.querySelector(`[data-event-id="${eventId}"]`);
    if (card) {
        const progressBar = card.querySelector(".progress-bar");
        const progressText = card.querySelector(".progress-text span:first-child");
        
        if (progressBar && event.capacity) {
            const percent = Math.min(100, ((event.registrationCount || 0) / event.capacity) * 100);
            progressBar.style.width = `${percent}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${event.registrationCount || 0} registered`;
        }
    }
}

function filterEvents(events) {
    return events.filter(event => {
        // Tab filter
        let matchesTab = true;
        if (currentTab === "upcoming") {
            const eventDate = new Date(event.eventDate || event.startAt);
            matchesTab = eventDate >= new Date();
        } else if (currentTab === "registered") {
            matchesTab = myRegistrations.has(event.id);
        }
        
        // Search filter
        const matchesSearch = !searchQuery || 
            event.title?.toLowerCase().includes(searchQuery) ||
            event.location?.toLowerCase().includes(searchQuery) ||
            event.description?.toLowerCase().includes(searchQuery);
        
        return matchesTab && matchesSearch;
    });
}

function updateTabCounts() {
    const now = new Date();
    
    const allCount = allEvents.length;
    const upcomingCount = allEvents.filter(e => {
        const eventDate = new Date(e.eventDate || e.startAt);
        return eventDate >= now;
    }).length;
    const registeredCount = myRegistrations.size;
    
    document.querySelector('[data-tab="all"] .tab-badge').textContent = allCount;
    document.querySelector('[data-tab="upcoming"] .tab-badge').textContent = upcomingCount;
    document.querySelector('[data-tab="registered"] .tab-badge').textContent = registeredCount;
}

function showLoading() {
    eventsGrid.innerHTML = `
        <div class="loading" style="grid-column: 1 / -1;">
            <div class="loading-spinner"></div>
            <p>Loading events...</p>
        </div>
    `;
}

function showEmptyState(title, message) {
    eventsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
            <div class="empty-state-icon">📅</div>
            <h3>${title}</h3>
            <p>${message}</p>
        </div>
    `;
}

// ==================== EVENT MODAL ====================

function openEventModal(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const isRegistered = myRegistrations.has(event.id);
    const eventDate = new Date(event.eventDate || event.startAt);
    const status = getEventStatus(event);
    const isFull = event.capacity && (event.registrationCount || 0) >= event.capacity;
    
    const modal = document.getElementById("eventModal");
    const modalContent = document.getElementById("modalContent");
    
    modalContent.innerHTML = `
        <div class="modal-header">
            ${event.image 
                ? `<img src="${event.image}" alt="" class="modal-image">`
                : `<div class="modal-image-placeholder">📅</div>`
            }
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <h2 class="modal-title">${escapeHtml(event.title)}</h2>
            <div class="modal-meta">
                <div class="modal-meta-item">
                    <span class="icon">📅</span>
                    <div>
                        <div class="label">Date</div>
                        <div class="value">${formatDate(event.eventDate || event.startAt)}</div>
                    </div>
                </div>
                <div class="modal-meta-item">
                    <span class="icon">⏰</span>
                    <div>
                        <div class="label">Time</div>
                        <div class="value">${formatTime(event.eventTime || event.startAt)}</div>
                    </div>
                </div>
                <div class="modal-meta-item">
                    <span class="icon">📍</span>
                    <div>
                        <div class="label">Location</div>
                        <div class="value">${escapeHtml(event.location || "TBA")}</div>
                    </div>
                </div>
                <div class="modal-meta-item">
                    <span class="icon">👥</span>
                    <div>
                        <div class="label">Capacity</div>
                        <div class="value">${event.registrationCount || 0} / ${event.capacity || "∞"}</div>
                    </div>
                </div>
                ${event.organizer ? `
                    <div class="modal-meta-item">
                        <span class="icon">👤</span>
                        <div>
                            <div class="label">Organizer</div>
                            <div class="value">${escapeHtml(event.organizer)}</div>
                        </div>
                    </div>
                ` : ""}
            </div>
            <div class="modal-description">
                <h4>About this Event</h4>
                <p>${escapeHtml(event.description || "No description available")}</p>
            </div>
        </div>
        <div class="modal-footer" id="modalFooter" data-event-id="${event.id}">
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
            ${renderModalButton(event, isRegistered, status, isFull)}
        </div>
    `;
    
    modal.classList.add("active");
}

function renderModalButton(event, isRegistered, status, isFull) {
    if (status.class === "ended") {
        return `<button class="btn btn-secondary" disabled>Event Ended</button>`;
    }
    
    if (isRegistered) {
        return `
            <button class="btn btn-danger" id="modal-reg-btn" onclick="handleUnregister(${event.id})">
                Cancel Registration
            </button>
        `;
    }
    
    if (isFull) {
        return `<button class="btn btn-secondary" disabled>Event Full</button>`;
    }
    
    return `
        <button class="btn btn-register" id="modal-reg-btn" onclick="handleRegister(${event.id})">
            Register Now
        </button>
    `;
}

function updateModalRegistration(eventId, isRegistered) {
    const modalFooter = document.getElementById("modalFooter");
    if (!modalFooter || modalFooter.dataset.eventId != eventId) return;
    
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const status = getEventStatus(event);
    const isFull = event.capacity && (event.registrationCount || 0) >= event.capacity;
    
    const btn = document.getElementById("modal-reg-btn");
    if (btn) {
        btn.outerHTML = renderModalButton(event, isRegistered, status, isFull);
    }
}

function closeModal() {
    document.getElementById("eventModal").classList.remove("active");
}

// ==================== EVENT HANDLERS ====================

async function handleRegister(eventId) {
    const btn = document.getElementById(`reg-btn-${eventId}`);
    const modalBtn = document.getElementById("modal-reg-btn");
    
    // Disable buttons
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "Registering...";
    }
    if (modalBtn) {
        modalBtn.disabled = true;
        modalBtn.innerHTML = "Registering...";
    }
    
    const success = await registerForEvent(eventId);
    
    // Re-enable if failed
    if (!success) {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = "Register Now";
        }
        if (modalBtn) {
            modalBtn.disabled = false;
            modalBtn.innerHTML = "Register Now";
        }
    }
}

async function handleUnregister(eventId) {
    if (!confirm("Are you sure you want to cancel your registration?")) {
        return;
    }
    
    const modalBtn = document.getElementById("modal-reg-btn");
    
    if (modalBtn) {
        modalBtn.disabled = true;
        modalBtn.innerHTML = "Cancelling...";
    }
    
    const success = await unregisterFromEvent(eventId);
    
    if (!success && modalBtn) {
        modalBtn.disabled = false;
        modalBtn.innerHTML = "Cancel Registration";
    }
}

// ==================== UTILITIES ====================

function getEventStatus(event) {
    const now = new Date();
    const eventDate = new Date(event.eventDate || event.startAt);
    
    // Set end of day for comparison
    const eventEndOfDay = new Date(eventDate);
    eventEndOfDay.setHours(23, 59, 59, 999);
    
    if (eventEndOfDay < now) {
        return { text: "Ended", class: "ended" };
    }
    
    // Check if event is today
    const isToday = eventDate.toDateString() === now.toDateString();
    if (isToday) {
        return { text: "Today", class: "ongoing" };
    }
    
    return { text: "Upcoming", class: "upcoming" };
}

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
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function formatTime(timeStr) {
    if (!timeStr) return "N/A";
    
    // Handle time string (HH:mm)
    if (typeof timeStr === "string" && timeStr.includes(":") && !timeStr.includes("T")) {
        const [hours, minutes] = timeStr.split(":");
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    }
    
    // Handle ISO datetime string
    const date = new Date(timeStr);
    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
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
    const userRole = localStorage.getItem("userRole");
    if (userRole === "STUDENT") {
        window.location.href = "student-dashboard.html";
    } else if (userRole === "ALUMNI") {
        window.location.href = "alumni-dashboard.html";
    } else if (userRole === "ADMIN") {
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
