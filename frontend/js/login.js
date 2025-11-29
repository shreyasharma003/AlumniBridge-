/**
 * =============================================
 * LOGIN PAGE JAVASCRIPT - AlumniBridge
 * Handles user authentication and admin login
 * =============================================
 */

// Hardcoded Admin Credentials (in production, this should be validated server-side)
const ADMIN_CREDENTIALS = {
  id: "testadmin@gmail.com",
  password: "admin123",
};

/**
 * Initialize login page
 */
function initLoginPage() {
  // Create alert container
  createAlertContainer();

  // Note: Removed auth redirect to allow users to log in even if logged in
  // They may want to log in with a different account

  // Setup event listeners
  setupLoginFormEvents();
  setupAdminModalEvents();
}

/**
 * Setup login form event listeners
 */
function setupLoginFormEvents() {
  const loginForm = document.getElementById("loginForm");
  const adminLoginBtn = document.getElementById("adminLoginBtn");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
  }

  if (adminLoginBtn) {
    adminLoginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openAdminLoginModal();
    });
  }
}

/**
 * Setup admin modal event listeners
 */
function setupAdminModalEvents() {
  const adminModal = document.getElementById("adminLoginModal");
  const closeBtn = document.getElementById("closeAdminModal");
  const adminForm = document.getElementById("adminLoginForm");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      adminModal.classList.remove("active");
    });
  }

  // Close modal when clicking outside
  if (adminModal) {
    adminModal.addEventListener("click", (e) => {
      if (e.target === adminModal) {
        adminModal.classList.remove("active");
      }
    });
  }

  if (adminForm) {
    adminForm.addEventListener("submit", handleAdminLoginSubmit);
  }
}

/**
 * Open admin login modal
 */
function openAdminLoginModal() {
  const modal = document.getElementById("adminLoginModal");
  if (modal) {
    modal.classList.add("active");
    // Focus on admin ID field
    setTimeout(() => {
      document.getElementById("adminId").focus();
    }, 200);
  }
}

/**
 * Handle user login form submission
 * @param {Event} e - Form submit event
 */
async function handleLoginSubmit(e) {
  e.preventDefault();

  // Clear previous errors
  clearLoginErrors();

  // Get form values
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  // Validate inputs
  if (!validateLoginForm(email, password)) {
    return;
  }

  // Show loading state
  const submitBtn = document.getElementById("loginBtn");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<div class="loader"></div>';

  try {
    // Call login API
    const response = await authLogin(email, password);

    // Store user data
    setAuthToken(response.token);
    localStorage.setItem("userId", response.userId);
    localStorage.setItem("userRole", response.role);
    localStorage.setItem("userEmail", email);

    // Show success message
    showSuccess("Login successful! Redirecting...");

    // Redirect based on role after a short delay
    setTimeout(() => {
      redirectByRole(response.role);
    }, 1000);
  } catch (error) {
    // Show error message
    const errorMsg = document.getElementById("loginError");
    if (errorMsg) {
      errorMsg.textContent =
        error.message || "Invalid credentials. Please try again.";
    }
    showError(error.message || "Login failed. Please check your credentials.");
  } finally {
    // Restore button state
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/**
 * Handle admin login form submission
 * @param {Event} e - Form submit event
 */
async function handleAdminLoginSubmit(e) {
  e.preventDefault();

  // Clear previous errors
  document.getElementById("adminIdError").textContent = "";
  document.getElementById("adminPasswordError").textContent = "";
  document.getElementById("adminLoginError").textContent = "";

  const adminId = document.getElementById("adminId").value.trim();
  const adminPassword = document.getElementById("adminPassword").value.trim();

  // Validate inputs
  if (!adminId) {
    document.getElementById("adminIdError").textContent =
      "Admin ID is required";
    return;
  }
  if (!adminPassword) {
    document.getElementById("adminPasswordError").textContent =
      "Password is required";
    return;
  }

  // Show loading state
  const submitBtn = document.querySelector('#adminLoginForm button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Logging in...";

  try {
    // Call backend API for admin login using authLogin from api.js
    const response = await authLogin("testadmin@gmail.com", adminPassword);

    if (response.error) {
      document.getElementById("adminLoginError").textContent = response.error;
      showError(response.error);
      return;
    }

    // Store auth data
    setAuthToken(response.token);
    localStorage.setItem("userId", response.userId);
    localStorage.setItem("userRole", response.role);
    localStorage.setItem("userEmail", "testadmin@gmail.com");

    showSuccess("Admin login successful! Redirecting...");

    setTimeout(() => {
      window.location.href = "admin-dashboard.html";
    }, 1000);
  } catch (error) {
    console.error("Admin login error:", error);
    document.getElementById("adminLoginError").textContent = "Login failed. Please try again.";
    showError("Login failed. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/**
 * Validate login form
 * @param {string} email - Email input
 * @param {string} password - Password input
 * @returns {boolean} True if valid, false otherwise
 */
function validateLoginForm(email, password) {
  let isValid = true;

  // Validate email
  if (!email) {
    document.getElementById("emailError").textContent = "Email is required";
    isValid = false;
  } else if (!isValidEmail(email)) {
    document.getElementById("emailError").textContent =
      "Please enter a valid email";
    isValid = false;
  }

  // Validate password
  if (!password) {
    document.getElementById("passwordError").textContent =
      "Password is required";
    isValid = false;
  } else if (password.length < 6) {
    document.getElementById("passwordError").textContent =
      "Password must be at least 6 characters";
    isValid = false;
  }

  return isValid;
}

/**
 * Clear all login error messages
 */
function clearLoginErrors() {
  document.getElementById("emailError").textContent = "";
  document.getElementById("passwordError").textContent = "";
  document.getElementById("loginError").textContent = "";
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
document.addEventListener("DOMContentLoaded", initLoginPage);

// Handle Enter key on inputs
document.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const loginForm = document.getElementById("loginForm");
    const adminForm = document.getElementById("adminLoginForm");

    // Check if admin modal is open
    const adminModal = document.getElementById("adminLoginModal");
    if (adminModal && adminModal.classList.contains("active") && adminForm) {
      adminForm.dispatchEvent(new Event("submit"));
    } else if (loginForm) {
      loginForm.dispatchEvent(new Event("submit"));
    }
  }
});
