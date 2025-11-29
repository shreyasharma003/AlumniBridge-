/**
 * =============================================
 * SIGNUP PAGE JAVASCRIPT - AlumniBridge
 * Handles user registration with degree and batch fetching
 * =============================================
 */

/**
 * Initialize signup page
 */
async function initSignupPage() {
  // Create alert container
  createAlertContainer();

  // Note: Removed auth redirect to allow users to sign up even if logged in
  // They may want to create a new account or sign up with a different email

  // Populate dropdowns
  await populateDropdowns();

  // Setup event listeners
  setupSignupFormEvents();
  setupFieldValidation();
}

/**
 * Populate dropdowns with data from backend
 */
async function populateDropdowns() {
  try {
    // Populate batch year dropdown (current year down to 10 years ago)
    const currentYear = new Date().getFullYear();
    const batchYearSelect = document.getElementById("batchYear");

    if (batchYearSelect) {
      for (let year = currentYear; year >= currentYear - 10; year--) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        batchYearSelect.appendChild(option);
      }
    }

    // Fetch and populate degrees from backend
    console.log("Fetching degrees from /api/degrees...");
    const degrees = await getAllDegrees();
    console.log("Degrees fetched:", degrees);

    const degreeSelect = document.getElementById("degreeName");
    if (degreeSelect && degrees && Array.isArray(degrees)) {
      // Deduplicate degrees by name using Set
      const uniqueDegreeNames = [...new Set(degrees.map(d => d.name))];
      console.log("Unique degrees:", uniqueDegreeNames);
      
      uniqueDegreeNames.forEach((degreeName) => {
        const option = document.createElement("option");
        option.value = degreeName;
        option.textContent = degreeName;
        degreeSelect.appendChild(option);
      });
      console.log("Degrees populated successfully (deduplicated)");
    } else {
      console.warn("No degrees returned or invalid response");
    }
  } catch (error) {
    console.error("Error populating dropdowns:", error);
    showError("Failed to load degrees. Please try again.");
  }
}

/**
 * Setup signup form event listeners
 */
function setupSignupFormEvents() {
  const signupForm = document.getElementById("signupForm");

  if (signupForm) {
    signupForm.addEventListener("submit", handleSignupSubmit);
  }
}

/**
 * Setup real-time field validation
 */
function setupFieldValidation() {
  const emailField = document.getElementById("email");
  const passwordField = document.getElementById("password");
  const confirmPasswordField = document.getElementById("confirmPassword");

  if (emailField) {
    emailField.addEventListener("blur", () => {
      const email = emailField.value.trim();
      const errorEl = document.getElementById("emailError");

      if (email && !isValidEmail(email)) {
        errorEl.textContent = "Please enter a valid email address";
      } else {
        errorEl.textContent = "";
      }
    });
  }

  if (passwordField) {
    passwordField.addEventListener("input", () => {
      const password = passwordField.value;
      const errorEl = document.getElementById("passwordError");
      const confirmEl = document.getElementById("confirmPassword");

      if (password && password.length < 6) {
        errorEl.textContent = "Password must be at least 6 characters";
      } else {
        errorEl.textContent = "";
      }

      // Check confirm password match if both have values
      if (confirmEl.value && password !== confirmEl.value) {
        document.getElementById("confirmPasswordError").textContent =
          "Passwords do not match";
      } else {
        document.getElementById("confirmPasswordError").textContent = "";
      }
    });
  }

  if (confirmPasswordField) {
    confirmPasswordField.addEventListener("input", () => {
      const password = passwordField.value;
      const confirmPassword = confirmPasswordField.value;
      const errorEl = document.getElementById("confirmPasswordError");

      if (confirmPassword && password !== confirmPassword) {
        errorEl.textContent = "Passwords do not match";
      } else {
        errorEl.textContent = "";
      }
    });
  }
}

/**
 * Validate signup form
 */
function validateSignupForm(
  name,
  email,
  password,
  confirmPassword,
  role,
  institute,
  batchYear,
  degreeName
) {
  // Clear previous errors
  clearSignupErrors();

  // Validate name
  if (!name) {
    document.getElementById("nameError").textContent = "Name is required";
    return false;
  }

  // Validate email
  if (!email) {
    document.getElementById("emailError").textContent = "Email is required";
    return false;
  }
  if (!isValidEmail(email)) {
    document.getElementById("emailError").textContent =
      "Please enter a valid email";
    return false;
  }

  // Validate password
  if (!password) {
    document.getElementById("passwordError").textContent =
      "Password is required";
    return false;
  }
  if (password.length < 6) {
    document.getElementById("passwordError").textContent =
      "Password must be at least 6 characters";
    return false;
  }

  // Validate confirm password
  if (!confirmPassword) {
    document.getElementById("confirmPasswordError").textContent =
      "Please confirm your password";
    return false;
  }
  if (password !== confirmPassword) {
    document.getElementById("confirmPasswordError").textContent =
      "Passwords do not match";
    return false;
  }

  // Validate role
  if (!role) {
    document.getElementById("roleError").textContent = "Please select a role";
    return false;
  }

  // Validate institute
  if (!institute) {
    document.getElementById("instituteError").textContent =
      "Please select an institute";
    return false;
  }

  // Validate batch year
  if (batchYear === null || isNaN(batchYear)) {
    document.getElementById("batchYearError").textContent =
      "Please select a batch year";
    return false;
  }

  // Validate degree
  if (!degreeName) {
    document.getElementById("degreeError").textContent =
      "Please select a degree";
    return false;
  }

  return true;
}

/**
 * Handle signup form submission
 */
async function handleSignupSubmit(e) {
  e.preventDefault();

  // Clear previous errors
  clearSignupErrors();

  // Get form values
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document
    .getElementById("confirmPassword")
    .value.trim();
  const role = document.getElementById("role").value.trim();
  const institute = document.getElementById("institute").value.trim();
  const batchYearValue = document.getElementById("batchYear").value.trim();
  const batchYear = batchYearValue ? parseInt(batchYearValue) : null;
  const degreeName = document.getElementById("degreeName").value.trim();
  const bio = document.getElementById("bio").value.trim();
  const linkedinUrl = document.getElementById("linkedinUrl").value.trim();

  // Validate form
  if (
    !validateSignupForm(
      name,
      email,
      password,
      confirmPassword,
      role,
      institute,
      batchYear,
      degreeName
    )
  ) {
    return;
  }

  // Show loading state
  const submitBtn = document.getElementById("signupBtn");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<div class="loader"></div>';

  try {
    // Prepare registration data
    const registrationData = {
      name,
      email,
      password,
      role,
      institute,
      batchYear,
      degreeName,
      bio: bio || null,
      linkedinUrl: linkedinUrl || null,
    };

    console.log("Sending registration data:", registrationData);

    // Call registration API
    const response = await authRegister(registrationData);

    console.log("Registration response:", response);

    // Show success message
    showSuccess("Account created successfully! Redirecting to login...");

    // Redirect to login page after a delay
    setTimeout(() => {
      window.location.href = "../pages/login.html";
    }, 2000);
  } catch (error) {
    console.error("Registration error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Show error message
    const errorMsg = document.getElementById("signupError");
    let displayError =
      error.message || "Registration failed. Please try again.";

    // Try to parse error details if available
    if (error.message && error.message.includes("Email already in use")) {
      displayError =
        "This email is already registered. Please use a different email.";
    } else if (error.message && error.message.includes("validation")) {
      displayError = "Please check all required fields are filled correctly.";
    }

    if (errorMsg) {
      errorMsg.textContent = displayError;
    }
    showError(displayError);
  } finally {
    // Restore button state
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/**
 * Clear all signup errors
 */
function clearSignupErrors() {
  const errorElements = document.querySelectorAll(".form-error");
  errorElements.forEach((el) => {
    el.textContent = "";
  });
}

/**
 * Create alert container for notifications
 */
function createAlertContainer() {
  if (!document.getElementById("alertContainer")) {
    const container = document.createElement("div");
    container.id = "alertContainer";
    container.style.cssText =
      "position: fixed; top: 20px; right: 20px; z-index: 999; max-width: 400px;";
    document.body.appendChild(container);
  }
}

/**
 * Initialize on page load
 */
document.addEventListener("DOMContentLoaded", initSignupPage);
