/**
 * =============================================
 * NAVBAR COMPONENT - AlumniBridge Frontend
 * Reusable navbar for all authenticated pages
 * =============================================
 */

/**
 * Render the navbar
 * @param {string} activePage - The active menu item (e.g., 'home', 'profile', 'events')
 */
function renderNavbar(activePage = "") {
  const navbar = document.createElement("nav");
  navbar.className = "navbar";

  const isAlumni = getUserRole() === "ALUMNI";
  const isAdmin = getUserRole() === "ADMIN";

  navbar.innerHTML = `
        <div class="navbar-container">
            <!-- Brand/Logo -->
            <div class="navbar-brand">
                <a href="/frontend/index.html">AlumniBridge</a>
            </div>

            <!-- Mobile Toggle Button -->
            <button class="navbar-toggle" id="navbarToggle">☰</button>

            <!-- Navigation Menu -->
            <ul class="navbar-menu" id="navbarMenu">
                <li><a href="/frontend/pages/student-dashboard.html" class="${
                  activePage === "home" ? "active" : ""
                }">Home</a></li>
                <li><a href="#about" class="${
                  activePage === "about" ? "active" : ""
                }">About</a></li>
                <li><a href="/frontend/pages/network.html" class="${
                  activePage === "network" ? "active" : ""
                }">Network</a></li>
                <li><a href="/frontend/pages/batches.html" class="${
                  activePage === "batches" ? "active" : ""
                }">Batches</a></li>
                <li><a href="/frontend/pages/events.html" class="${
                  activePage === "events" ? "active" : ""
                }">Events</a></li>
                <li><a href="/frontend/pages/chat.html" class="${
                  activePage === "chat" ? "active" : ""
                }">Chat</a></li>
            </ul>

            <!-- Right Side: User Menu -->
            <div class="navbar-right">
                <div class="navbar-user">
                    <div class="navbar-user-dropdown">
                        <div class="navbar-user-avatar" id="userAvatarBtn" title="User Menu">
                            👤
                        </div>
                        <div class="dropdown-menu" id="userDropdown">
                            <a href="/frontend/pages/profile.html">My Profile</a>
                            <a href="/frontend/pages/connections.html">My Connections</a>
                            <div class="dropdown-divider"></div>
                            ${
                              isAlumni
                                ? '<a href="/frontend/pages/my-events.html">My Events</a><div class="dropdown-divider"></div>'
                                : ""
                            }
                            ${
                              isAdmin
                                ? '<a href="/frontend/pages/admin-dashboard.html">Admin Panel</a><div class="dropdown-divider"></div>'
                                : ""
                            }
                            <button onclick="handleLogout()">Logout</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Prepend navbar to body
  document.body.insertBefore(navbar, document.body.firstChild);

  // Setup event listeners
  setupNavbarEventListeners();
}

/**
 * Setup navbar event listeners
 */
function setupNavbarEventListeners() {
  // Mobile menu toggle
  const toggle = document.getElementById("navbarToggle");
  const menu = document.getElementById("navbarMenu");

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("active");
    });

    // Close menu when clicking on a link
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("active");
      });
    });
  }

  // User dropdown menu
  const userAvatar = document.getElementById("userAvatarBtn");
  const userDropdown = document.getElementById("userDropdown");

  if (userAvatar && userDropdown) {
    userAvatar.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("active");
    });

    // Close dropdown when clicking elsewhere
    document.addEventListener("click", (e) => {
      if (!userAvatar.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove("active");
      }
    });

    // Close dropdown when clicking on a menu item
    userDropdown.querySelectorAll("a, button").forEach((item) => {
      item.addEventListener("click", () => {
        userDropdown.classList.remove("active");
      });
    });
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    removeAuthToken();
    showSuccess("Logged out successfully. Redirecting...");
    setTimeout(() => {
      window.location.href = "/frontend/pages/login.html";
    }, 1500);
  }
}

/**
 * Render footer component
 */
function renderFooter() {
  const footer = document.createElement("footer");
  footer.innerHTML = `
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>AlumniBridge</h4>
                    <p>Connecting students and alumni of our institution, fostering lifelong relationships and professional networks.</p>
                </div>
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <a href="/frontend/index.html">Home</a>
                    <a href="/frontend/pages/events.html">Events</a>
                    <a href="/frontend/pages/batches.html">Batches</a>
                    <a href="/frontend/pages/chat.html">Chat</a>
                </div>
                <div class="footer-section">
                    <h4>Legal</h4>
                    <a href="#privacy">Privacy Policy</a>
                    <a href="#terms">Terms of Service</a>
                    <a href="#contact">Contact Us</a>
                </div>
                <div class="footer-section">
                    <h4>Connect</h4>
                    <a href="https://linkedin.com" target="_blank">LinkedIn</a>
                    <a href="https://facebook.com" target="_blank">Facebook</a>
                    <a href="https://twitter.com" target="_blank">Twitter</a>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 AlumniBridge. All rights reserved.</p>
            </div>
        </div>
    `;

  document.body.appendChild(footer);
}

/**
 * Create alert container if it doesn't exist
 * This is used by api.js to show notifications
 */
function createAlertContainer() {
  if (!document.getElementById("alertContainer")) {
    const container = document.createElement("div");
    container.id = "alertContainer";
    container.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 999;
            max-width: 400px;
        `;
    document.body.appendChild(container);
  }
}

/**
 * Initialize page (call on all authenticated pages)
 * @param {string} activePage - The active menu item
 * @param {boolean} showNav - Whether to show navbar (default: true)
 * @param {boolean} showFooter - Whether to show footer (default: true)
 */
function initializePage(activePage = "", showNav = true, showFooter = true) {
  // Check authentication
  if (!isAuthenticated()) {
    window.location.href = "/frontend/pages/login.html";
    return;
  }

  // Create alert container
  createAlertContainer();

  // Render navbar
  if (showNav) {
    renderNavbar(activePage);
  }

  // Render footer
  if (showFooter) {
    renderFooter();
  }

  // Add some responsive adjustments
  if (window.innerWidth < 768) {
    document.body.style.overflow = "auto";
  }
}

/**
 * Check if page is in an iframe (for modal pages)
 * @returns {boolean}
 */
function isInIframe() {
  return window.self !== window.top;
}

/**
 * Update user avatar with user initials
 * @param {string} name - User's full name
 */
function updateUserAvatar(name) {
  const avatar = document.getElementById("userAvatarBtn");
  if (avatar && name) {
    const initials = name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
    avatar.textContent = initials;
  }
}

/**
 * Set active navbar link
 * @param {string} pageName - Page identifier
 */
function setActiveNavLink(pageName) {
  document.querySelectorAll(".navbar-menu a").forEach((link) => {
    link.classList.remove("active");
  });

  const activeLink = document.querySelector(
    `.navbar-menu a[data-page="${pageName}"]`
  );
  if (activeLink) {
    activeLink.classList.add("active");
  }
}
