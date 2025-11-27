# AlumniBridge Frontend - Complete Setup Guide

## 📋 Project Overview

AlumniBridge is a professional, responsive frontend for connecting students and alumni. Built with **pure HTML5, CSS3, and Vanilla JavaScript** – no frameworks!

### 🎨 Design Features

- **Bluish Professional Theme**: Soft blues (#f0f4ff), deep blues (#1d4ed8)
- **Modern Minimalist UI**: Clean cards, rounded corners, proper spacing
- **Fully Responsive**: Mobile-first design for all screen sizes
- **Production-Ready**: Optimized, commented, and well-structured code

---

## 📁 Folder Structure

```
/frontend
  ├── index.html                    # Landing page
  ├── /pages
  │   ├── login.html                # User login
  │   ├── signup.html               # User registration
  │   ├── student-dashboard.html    # Student dashboard (TO CREATE)
  │   ├── alumni-dashboard.html     # Alumni dashboard (TO CREATE)
  │   ├── admin-dashboard.html      # Admin panel (TO CREATE)
  │   ├── profile.html              # User profile (TO CREATE)
  │   ├── events.html               # Events listing (TO CREATE)
  │   ├── batches.html              # Batch browsing (TO CREATE)
  │   ├── chat.html                 # Chat interface (TO CREATE)
  │   └── my-events.html            # Alumni: manage events (TO CREATE)
  ├── /css
  │   ├── styles.css                # Global styles & theme
  │   ├── shared.css                # Components: navbar, cards, modals
  │   ├── landing.css               # Landing page specific
  │   └── auth.css                  # Login & signup styles
  ├── /js
  │   ├── api.js                    # API wrapper & utilities
  │   ├── navbar.js                 # Navbar component logic
  │   ├── landing.js                # Landing page logic
  │   ├── login.js                  # Login form handling
  │   ├── signup.js                 # Signup form handling
  │   └── [more files to create]
  └── /images                       # Static images
```

---

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local backend running at `http://localhost:8080`
- Java Spring Boot backend with configured CORS

### Backend Configuration (IMPORTANT)

Ensure your backend has CORS configured to allow frontend requests:

```java
// In your WebSocketConfig or SecurityConfig
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:*", "file:///*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

### Running the Frontend

1. **Navigate to frontend directory**:

   ```bash
   cd frontend
   ```

2. **Start a local web server** (choose one):

   **Option A: Python 3**

   ```bash
   python -m http.server 8000
   ```

   **Option B: Python 2**

   ```bash
   python -m SimpleHTTPServer 8000
   ```

   **Option C: Node.js (http-server)**

   ```bash
   npm install -g http-server
   http-server -p 8000
   ```

   **Option D: VS Code Live Server Extension**

   - Install "Live Server" extension
   - Right-click `index.html` → "Open with Live Server"

3. **Access the application**:
   ```
   http://localhost:8000/
   ```

---

## 🔑 Generated Pages

### ✅ **Already Created**

#### 1. **Landing Page** (`index.html`)

- Hero section with call-to-action
- About AlumniBridge
- Key features (6 features highlighted)
- Upcoming events carousel (auto-loads from backend)
- CTA section
- Responsive footer
- **Files**: `index.html`, `css/landing.css`, `js/landing.js`

#### 2. **Login Page** (`pages/login.html`)

- Email & password authentication
- JWT token storage in localStorage
- Role-based redirect (Student/Alumni/Admin)
- Admin login modal
- Real-time form validation
- **Files**: `pages/login.html`, `css/auth.css`, `js/login.js`

#### 3. **Signup Page** (`pages/signup.html`)

- Complete registration form
- Form fields:
  - Name, Email, Password, Confirm Password
  - Role dropdown (Student/Alumni)
  - Institute dropdown
  - Batch year dropdown (dynamic: current year - 10)
  - Degree dropdown (loaded from backend batches)
  - Bio & LinkedIn URL (optional)
- Real-time validation
- Direct API call to `/api/auth/register`
- **Files**: `pages/signup.html`, `js/signup.js`

#### 4. **Global Styles & Utilities**

- CSS Variables for colors, spacing, shadows
- Responsive grid system (row-1, row-2, row-3)
- Utility classes (flex, text-center, mt-md, etc.)
- Component styles (buttons, forms, cards, alerts)
- Animation keyframes (fadeIn, slideIn, float)
- **Files**: `css/styles.css`, `css/shared.css`

#### 5. **API Integration Module** (`js/api.js`)

- Centralized fetch wrapper
- JWT token management
- All API endpoints mapped:
  - Auth: register, login
  - Users: getProfile, updateProfile, search, connect
  - Events: getAll, create, register
  - Batches: getAll
  - Chat: getHistory, getConversations
- Error handling with automatic logout on 401
- Helper functions: showError, showSuccess, showLoader
- **Features**:
  - Automatic JWT injection in headers
  - Consistent error handling
  - Loading indicators
  - User role/ID management

#### 6. **Navbar Component** (`js/navbar.js`)

- Reusable navbar for all authenticated pages
- Mobile responsive hamburger menu
- User dropdown with profile & logout
- Active link highlighting
- Footer component
- Page initialization helper

---

## 📋 API Endpoints Documentation

### Authentication

```javascript
// Login
POST / api / auth / login;
Body: {
  email, password;
}
Response: {
  token, userId, role;
}

// Register
POST / api / auth / register;
Body: {
  name,
    email,
    password,
    role,
    institute,
    batchYear,
    degreeName,
    linkedinUrl,
    bio;
}
Response: {
  token, userId, role;
}
```

### Users

```javascript
// Get current user
GET /api/users/me
Headers: { Authorization: "Bearer TOKEN" }

// Get user profile by ID
GET /api/users/{userId}

// Update user profile
PUT /api/users/{userId}
Body: { name, email, bio, linkedinUrl, ... }

// Search users
GET /api/users/search?q=query&degree=CS&institute=IPS&batchYear=2020

// Send connection request
POST /api/users/connect/{receiverId}
```

### Events

```javascript
// Get all events
GET /api/events/

// Create event (Alumni only)
POST /api/events/?creatorId={userId}
Body: { title, description, startAt, endAt, location }

// Register for event (Student only)
POST /api/events/{eventId}/register?userId={userId}
```

### Batches

```javascript
// Get all batches
GET / api / batches;

// Get users in batch
GET / api / batches / { batchYear } / users;
```

---

## 🎯 TO CREATE - Next Pages

### 1. **Student Dashboard** (`pages/student-dashboard.html`)

Features:

- Home feed with connections
- Search users with filters
- My connections list
- Batch filtering
- Events discovery & registration
- Real-time chat
- Profile management

### 2. **Alumni Dashboard** (`pages/alumni-dashboard.html`)

Features:

- All student features +
- Post new events
- Manage posted events
- View registration counts
- Analytics dashboard

### 3. **Admin Dashboard** (`pages/admin-dashboard.html`)

Features:

- Statistics dashboard
- User management
- Event management
- Registration tracking
- System overview

### 4. **Events Page** (`pages/events.html`)

- Grid of all events
- Event filtering
- Event details modal
- Register/unregister
- Share to chat

### 5. **User Profile** (`pages/profile.html`)

- View/edit user info
- Profile picture
- Social links
- Connection stats

### 6. **Batches Page** (`pages/batches.html`)

- Batch list with user counts
- Click batch → see all users
- User card components

### 7. **Chat Interface** (`pages/chat.html`)

- WebSocket integration
- Conversation list
- Message bubbles
- WhatsApp-style UI
- Share events in chat

---

## 🔐 Authentication Flow

1. **Login**:

   ```
   User enters credentials → API call → Backend validates → Returns JWT token
   → Store token in localStorage → Redirect to dashboard
   ```

2. **Protected Routes**:

   ```
   Check localStorage.token → If present, allow access
   → If missing, redirect to login
   ```

3. **Token in Requests**:

   ```
   Every API call automatically adds:
   Headers: { Authorization: "Bearer " + localStorage.token }
   ```

4. **Logout**:
   ```
   Clear localStorage → Redirect to login
   ```

---

## 🎨 Color Palette

```css
--primary-dark: #1d4ed8      /* Deep blue */
--primary-medium: #2563eb    /* Medium blue */
--primary-light: #3b82f6     /* Light blue */
--secondary-dark: #153eaa    /* Darker blue */

--bg-light: #f0f4ff          /* Very light blue bg */
--bg-white: #ffffff          /* Pure white */
--border-color: #d0d7e6      /* Blue-ish border */

--text-dark: #111827         /* Dark text */
--text-medium: #374151       /* Medium text */
--text-light: #6b7280        /* Light text */
```

---

## ✨ Key JavaScript Functions

### API Calls

```javascript
authLogin(email, password);
authRegister(data);
getUserMe();
getUserProfile(userId);
updateUserProfile(userId, data);
searchUsers(query, degree, institute, batchYear);
sendConnectionRequest(receiverId);
getAllEvents();
createEvent(data);
registerForEvent(eventId);
getAllBatches();
```

### Utilities

```javascript
isAuthenticated(); // Check if logged in
getAuthToken(); // Get JWT token
setAuthToken(token); // Store JWT token
removeAuthToken(); // Clear token (logout)
getUserId(); // Get current user ID
getUserRole(); // Get role (STUDENT/ALUMNI/ADMIN)
redirectByRole(role); // Redirect based on role
showError(message, duration); // Show error alert
showSuccess(message, duration); // Show success alert
showLoader(); // Show loading spinner
isValidEmail(email); // Validate email
isValidPassword(password); // Validate password
```

### Page Initialization

```javascript
initializePage(activePage, showNav, showFooter);
renderNavbar(activePage);
renderFooter();
createAlertContainer();
```

---

## 📱 Responsive Breakpoints

```css
/* Desktop: 1200px+ */
Desktop-first design

/* Tablet: 768px - 1199px */
@media (max-width: 768px)

/* Mobile: 480px - 767px */
@media (max-width: 480px)

/* Small Mobile: < 480px */
@media (max-width: 480px)
```

---

## 🐛 Troubleshooting

### Issue: "API request failed"

**Solution**: Ensure backend is running on `localhost:8080` with CORS enabled

### Issue: "Token not found"

**Solution**: Login again - token may have expired or been cleared

### Issue: "Cannot GET /api/..."

**Solution**: Check backend endpoint is correct, verify backend is running

### Issue: "CORS error"

**Solution**: Verify backend CORS configuration allows `http://localhost:8000`

### Issue: Styles not loading

**Solution**: Check CSS file paths are correct (relative paths work from /pages)

---

## 🚀 Production Deployment

### Environment Variables (Update before deployment)

```javascript
// In js/api.js, change:
const API_BASE_URL = "http://localhost:8080/api";
// To:
const API_BASE_URL = "https://yourdomain.com/api";
```

### Admin Credentials (Update for security)

```javascript
// In js/login.js, change:
const ADMIN_CREDENTIALS = {
  id: "admin123",
  password: "adminpass123",
};
// To your secure credentials
```

### Deployment Steps

1. Build backend and deploy to server
2. Update `API_BASE_URL` with production URL
3. Update admin credentials
4. Deploy frontend files to web server
5. Ensure CORS is configured for production domain
6. Test all authentication flows

---

## 📞 Support & Next Steps

1. **Review generated pages** - Landing, Login, Signup are production-ready
2. **Create remaining dashboards** - Follow same pattern as auth pages
3. **Test authentication flow** - Login, register, and role-based redirect
4. **Configure backend CORS** - Ensure frontend can call API
5. **Deploy to production** - Update environment variables

---

## 📝 Notes

- All JavaScript uses modern ES6+ features
- Comments explain functionality throughout code
- Form validation is client-side and server-side
- API wrapper handles all error cases
- Responsive design works on all devices
- Dark mode can be added via CSS variables
- WebSocket integration ready for chat feature

---

**Created**: November 2025  
**Frontend Type**: Pure HTML5, CSS3, Vanilla JavaScript  
**Theme**: Professional Bluish  
**Framework**: None (Vanilla)
