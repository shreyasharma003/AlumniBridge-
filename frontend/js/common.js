/**
 * =============================================
 * COMMON UTILITIES - AlumniBridge
 * Shared functions across all pages
 * =============================================
 */

// API Base URL
const COMMON_API_BASE = "http://localhost:8080/api";

/**
 * Logout function - clears all auth data and redirects to login
 */
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    window.location.href = "login.html";
}

/**
 * Navigate back to the appropriate dashboard based on user role
 */
function goBackToDashboard() {
    const role = localStorage.getItem("userRole");
    switch (role) {
        case "ADMIN":
            window.location.href = "admin-dashboard.html";
            break;
        case "ALUMNI":
            window.location.href = "alumni-dashboard.html";
            break;
        case "STUDENT":
            window.location.href = "student-dashboard.html";
            break;
        default:
            window.location.href = "login.html";
    }
}

/**
 * Get user's display name from localStorage or fetch from API
 * @returns {Promise<string>} User's name
 */
async function getUserDisplayName() {
    // First try localStorage
    let userName = localStorage.getItem("userName");
    if (userName) {
        return userName;
    }
    
    // If not in localStorage, fetch from API
    try {
        const token = localStorage.getItem("token");
        if (!token) return "User";
        
        const response = await fetch(`${COMMON_API_BASE}/users/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            userName = userData.name || userData.email || "User";
            // Store for future use
            localStorage.setItem("userName", userName);
            return userName;
        }
    } catch (error) {
        console.error("Error fetching user name:", error);
    }
    
    // Fallback to email
    return localStorage.getItem("userEmail") || "User";
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
function isUserAuthenticated() {
    return !!localStorage.getItem("token");
}

/**
 * Get current user role
 * @returns {string|null}
 */
function getCurrentUserRole() {
    return localStorage.getItem("userRole");
}

/**
 * Redirect to login if not authenticated
 */
function requireAuth() {
    if (!isUserAuthenticated()) {
        window.location.href = "login.html";
        return false;
    }
    return true;
}

/**
 * Create and inject the common header with logout button
 * @param {string} pageTitle - The title to display
 * @param {boolean} showBackButton - Whether to show back button
 */
async function initCommonHeader(pageTitle, showBackButton = false) {
    const userName = await getUserDisplayName();
    const headerElement = document.querySelector(".header h1, .header h2, .page-title");
    
    if (headerElement && pageTitle) {
        headerElement.textContent = pageTitle;
    }
    
    // Update welcome text if it exists
    const welcomeElement = document.getElementById("welcomeText");
    if (welcomeElement) {
        welcomeElement.textContent = `Welcome, ${userName}`;
    }
}
