/**
 * =============================================
 * LANDING PAGE JAVASCRIPT - AlumniBridge
 * Handles event loading and display
 * =============================================
 */

/**
 * Load and display upcoming events on landing page
 */
async function loadUpcomingEvents() {
  try {
    const container = document.getElementById("eventsContainer");
    if (!container) return;

    // Fetch all events from backend
    const events = await getAllEvents();

    // Clear loading placeholder
    container.innerHTML = "";

    if (!events || events.length === 0) {
      container.innerHTML = `
                <div class="loading-placeholder">
                    <p>No upcoming events at this moment.</p>
                </div>
            `;
      return;
    }

    // Sort events by date (ascending) and get latest upcoming events
    const now = new Date();
    const upcomingEvents = events
      .filter((event) => {
        // Check if event date is in the future
        const eventDate = new Date(
          `${event.eventDate}T${event.eventTime || "00:00"}`
        );
        return eventDate >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.eventDate}T${a.eventTime || "00:00"}`);
        const dateB = new Date(`${b.eventDate}T${b.eventTime || "00:00"}`);
        return dateA - dateB;
      });

    // Display first 2-3 events (or all if less than 3)
    const displayedEvents = upcomingEvents.slice(0, 3);

    if (displayedEvents.length === 0) {
      container.innerHTML = `
                <div class="loading-placeholder">
                    <p>No upcoming events at this moment.</p>
                </div>
            `;
      return;
    }

    displayedEvents.forEach((event) => {
      const eventCard = createEventCard(event);
      container.appendChild(eventCard);
    });
  } catch (error) {
    console.error("Error loading events:", error);
    const container = document.getElementById("eventsContainer");
    if (container) {
      container.innerHTML = `
                <div class="loading-placeholder">
                    <p>Unable to load events. Please try again later.</p>
                </div>
            `;
    }
  }
}

/**
 * Create event card element
 * @param {object} event - Event object from backend
 * @returns {HTMLElement} Event card element
 */
function createEventCard(event) {
  const card = document.createElement("div");
  card.className = "event-card-landing fade-in";

  // Format dates - handle both new format (eventDate + eventTime) and legacy format (startAt/endAt)
  let formattedDate = "";
  let formattedTime = "";

  if (event.eventDate && event.eventTime) {
    // New format: eventDate (YYYY-MM-DD) and eventTime (HH:mm)
    const dateObj = new Date(event.eventDate);
    formattedDate = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    formattedTime = event.eventTime; // Already in HH:mm format
  } else if (event.startAt) {
    // Legacy format: startAt is a full datetime
    const startDate = new Date(event.startAt);
    formattedDate = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    formattedTime = startDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  card.innerHTML = `
        <div class="event-card-header">
            <div class="event-card-date">${formattedDate} at ${formattedTime}</div>
            <h3 class="event-card-title">${escapeHtml(event.title)}</h3>
        </div>
        <div class="event-card-body">
            <p class="event-card-description">${escapeHtml(
              event.description || ""
            )}</p>
            <div class="event-card-meta">
                <span class="event-location">${escapeHtml(
                  event.location || "Location TBD"
                )}</span>
                <span class="event-capacity">Capacity: ${
                  event.capacity || "N/A"
                }</span>
            </div>
        </div>
    `;

  return card;
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

/**
 * Initialize landing page
 */
function initLandingPage() {
  // Load upcoming events
  loadUpcomingEvents();

  // Add smooth scroll behavior
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Create alert container
  createAlertContainer();
}

/**
 * Create alert container for notifications
 */
function createAlertContainer() {
  if (!document.getElementById("alertContainer")) {
    const container = document.createElement("div");
    container.id = "alertContainer";
    container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999;
            max-width: 400px;
        `;
    document.body.appendChild(container);
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initLandingPage);

// Reload events every 30 seconds
setInterval(loadUpcomingEvents, 30000);
