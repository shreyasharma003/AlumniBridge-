📋 ALUMNIBRIDGE FRONTEND - VERIFICATION & TESTING GUIDE
═════════════════════════════════════════════════════════════════════════════

🔍 VERIFY WHAT WAS GENERATED
═════════════════════════════════════════════════════════════════════════════

Run this in PowerShell to verify all files were created:

```powershell
# Navigate to frontend folder
cd d:\All_about_codes\alumni__bridge\frontend

# Check folder structure
Get-ChildItem -Recurse -Name | Select-Object -First 50

# Count files
@(Get-ChildItem -Recurse -File).Count

# Verify key files exist
Test-Path "index.html"
Test-Path "pages/login.html"
Test-Path "pages/signup.html"
Test-Path "css/styles.css"
Test-Path "css/shared.css"
Test-Path "css/landing.css"
Test-Path "css/auth.css"
Test-Path "js/api.js"
Test-Path "js/navbar.js"
Test-Path "js/landing.js"
Test-Path "js/login.js"
Test-Path "js/signup.js"
Test-Path "README.md"
```

═════════════════════════════════════════════════════════════════════════════

✅ TESTING FLOW (Step-by-Step)
═════════════════════════════════════════════════════════════════════════════

STEP 1: Start Backend
────────────────────────────────────────────────────────────────────────────

1. Open terminal
2. Navigate to backend folder:
   cd d:\All_about_codes\alumni\_\_bridge\backend
3. Build and run:
   mvn clean install
   mvn spring-boot:run
4. Verify backend is running:
   - Open http://localhost:8080/api/batches in browser
   - Should return JSON array of batches (may be empty if no data)
   - If you see JSON, backend is working ✅

STEP 2: Start Frontend Server
────────────────────────────────────────────────────────────────────────────
Option A: Python (Recommended)
cd d:\All_about_codes\alumni\_\_bridge\frontend
python -m http.server 8000

Output should show:
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...

Option B: Node.js
cd d:\All_about_codes\alumni\_\_bridge\frontend
npx http-server -p 8000

Option C: VS Code Live Server

1.  Open folder in VS Code
2.  Right-click index.html
3.  Select "Open with Live Server"
4.  Browser opens automatically

STEP 3: Test Landing Page
────────────────────────────────────────────────────────────────────────────

1. Open browser: http://localhost:8000/
2. Verify you see:
   ☐ AlumniBridge logo in navbar
   ☐ Landing page hero section
   ☐ About section with 3 cards
   ☐ Features section with 6 cards
   ☐ Upcoming events section (should load events from API)
   ☐ Call-to-action section
   ☐ Footer with links

3. Check browser console (F12):
   ☐ No red errors
   ☐ Events loaded successfully message

4. Test interactions:
   ☐ Click "Get Started" button → Should go to signup page
   ☐ Click "Learn More" button → Should scroll to About section
   ☐ Click "Sign Up" in navbar → Should go to signup page
   ☐ Click "Login" in navbar → Should go to login page

STEP 4: Test Signup Page
────────────────────────────────────────────────────────────────────────────

1. Click "Sign Up" button on landing page
2. Verify signup form loads with all fields:
   ☐ Name field (text input)
   ☐ Email field
   ☐ Password field
   ☐ Confirm Password field
   ☐ Role dropdown (Student/Alumni)
   ☐ Institute dropdown
   ☐ Batch Year dropdown (auto-populated)
   ☐ Degree dropdown (loaded from backend)
   ☐ Bio textarea
   ☐ LinkedIn URL field
   ☐ Submit button

3. Test form validation:
   ☐ Leave Name blank, blur field → Error message
   ☐ Enter invalid email → Error message
   ☐ Enter password < 6 chars → Error message
   ☐ Enter different confirm password → Error message
   ☐ Don't select role → Error message
   ☐ Don't select institute → Error message
   ☐ Don't select batch → Error message
   ☐ Don't select degree → Error message

4. Fill form correctly:
   Name: John Doe
   Email: john@example.com
   Password: password123
   Confirm: password123
   Role: STUDENT
   Institute: IPS Academy
   Batch: 2023
   Degree: B.Tech
   Bio: (leave empty)
   LinkedIn: (leave empty)

5. Click "Create Account":
   ☐ Button should show loading spinner
   ☐ Should call backend /api/auth/register
   ☐ Success message appears
   ☐ Redirected to login page

6. Check browser console:
   ☐ API call logged
   ☐ No errors

STEP 5: Test Login Page
────────────────────────────────────────────────────────────────────────────

1. On login page, enter credentials from signup:
   Email: john@example.com
   Password: password123

2. Click "Sign In":
   ☐ Button shows loading spinner
   ☐ Should call backend /api/auth/login
   ☐ Success message
   ☐ Redirected to student-dashboard.html (or error if dashboard not created)

3. Check browser console:
   ☐ API call logged
   ☐ Token stored message
   ☐ No errors

4. Test error handling:
   Go back to login, enter wrong password:
   Email: john@example.com
   Password: wrongpassword

   ☐ Click "Sign In"
   ☐ Error message displays
   ☐ Stays on login page
   ☐ No token stored

5. Test admin login:
   ☐ Click "Admin Login" button
   ☐ Modal opens with Admin ID and Password fields
   ☐ Try invalid credentials → Error message
   ☐ Enter: ID = "admin123", Password = "adminpass123"
   ☐ Click login → Should redirect to admin-dashboard.html

STEP 6: Verify localStorage
────────────────────────────────────────────────────────────────────────────

1. Login successfully
2. Press F12 to open DevTools
3. Go to Application tab
4. Expand "Local Storage"
5. Click on http://localhost:8000
6. Verify you see:
   ☐ token (JWT token value)
   ☐ userId (numeric ID)
   ☐ userRole (STUDENT, ALUMNI, or ADMIN)
   ☐ userEmail (user's email)

STEP 7: Test Logout
────────────────────────────────────────────────────────────────────────────
Note: Only works after dashboards are created

1. From dashboard, click user avatar (top-right)
2. Click "Logout"
3. Verify:
   ☐ Confirmation dialog appears
   ☐ localStorage is cleared (no token)
   ☐ Redirected to login page
   ☐ Cannot access dashboard (redirected to login)

STEP 8: Check API Integration
────────────────────────────────────────────────────────────────────────────

1. Open DevTools → Network tab
2. Reload page
3. Look for API calls to localhost:8080/api:
   ☐ GET /api/batches (from signup page to load degrees)
   ☐ GET /api/events (from landing page to load events)
   ☐ POST /api/auth/register (from signup)
   ☐ POST /api/auth/login (from login)

4. Check response status:
   ☐ 200 = Success
   ☐ 400 = Bad request (form validation)
   ☐ 401 = Unauthorized (invalid credentials)
   ☐ 500 = Server error (backend issue)

STEP 9: Responsive Design Testing
────────────────────────────────────────────────────────────────────────────

1. Press F12 (DevTools)
2. Click mobile icon (top-left)
3. Select "iPhone 12" or similar
4. Verify all pages render correctly:
   ☐ Landing page looks good
   ☐ Signup form stacks vertically
   ☐ Login form is centered
   ☐ No horizontal scrolling
   ☐ Buttons are clickable (min 48x48px)
   ☐ Text is readable (not too small)

5. Test tablet view:
   ☐ iPad dimensions (768x1024)
   ☐ Grid layouts show 2-3 columns
   ☐ Navbar works properly

STEP 10: Error Handling Tests
────────────────────────────────────────────────────────────────────────────

1. Stop backend server (to simulate API down):
   ☐ Try to load landing page → Should show error
   ☐ Error message displays in alert box
   ☐ Page doesn't crash

2. Restart backend

3. Test network error:
   ☐ Open DevTools → Network tab
   ☐ Set to "Offline"
   ☐ Try to submit signup form
   ☐ Should show error message
   ☐ Go back to "Online"

═════════════════════════════════════════════════════════════════════════════

🎯 COMMON ISSUES & FIXES
═════════════════════════════════════════════════════════════════════════════

Issue: "Cannot GET /"
Fix: Make sure frontend server is running, access http://localhost:8000/

Issue: "API request failed"
Fix:

1. Check backend is running on :8080
2. Verify CORS is enabled in backend
3. Check API endpoints match your backend routes

Issue: "Events carousel is empty"
Fix:

1. Check backend /api/events returns data
2. Check browser console for errors
3. Verify JWT token if endpoint requires auth

Issue: "Signup fails"
Fix:

1. Check all fields are filled
2. Verify email format is correct
3. Check backend database accepts the data
4. Check browser console for error details

Issue: "Login with valid credentials fails"
Fix:

1. Verify user was created during signup
2. Check email is exact match (case-sensitive)
3. Check password is correct
4. Verify backend is returning JWT token

Issue: "Page layout is broken"
Fix:

1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Check CSS files are loading (DevTools → Network)

Issue: "Mobile layout doesn't work"
Fix:

1. Check viewport meta tag is in HTML
2. Verify CSS media queries are correct
3. Test in real mobile device (not just DevTools)

═════════════════════════════════════════════════════════════════════════════

✅ TESTING CHECKLIST
═════════════════════════════════════════════════════════════════════════════

Landing Page:
□ Page loads without errors
□ Hero section displays
□ Events load from API
□ All links work
□ Responsive on mobile

Signup Page:
□ Form loads with all fields
□ Validation works for each field
□ Password match validation works
□ Dropdowns populated
□ Form submission works
□ Redirects to login on success
□ Error handling works

Login Page:
□ Form loads
□ Valid credentials login
□ Invalid credentials show error
□ Admin login modal works
□ Token stored in localStorage
□ Role-based redirect works
□ Logout clears token

API Integration:
□ /api/auth/register works
□ /api/auth/login works
□ /api/events works
□ /api/batches works
□ 401 errors redirect to login
□ Network errors handled gracefully

UI/UX:
□ Color scheme is consistent
□ Buttons are clickable
□ Forms are usable
□ Error messages are clear
□ Success messages appear
□ Navbar looks professional
□ Spacing is consistent

Responsive:
□ Mobile (480px) looks good
□ Tablet (768px) looks good
□ Desktop (1200px+) looks good
□ No horizontal scrolling
□ Touch targets are large enough
□ Text is readable

Performance:
□ Page loads quickly
□ No console errors
□ No memory leaks
□ Smooth animations
□ Responsive to user input

═════════════════════════════════════════════════════════════════════════════

📝 MANUAL TESTING SCENARIOS
═════════════════════════════════════════════════════════════════════════════

Scenario 1: New User Journey

1. Open landing page
2. Explore features
3. Click "Get Started"
4. Fill signup form
5. Submit
6. Should see success message
7. Should be on login page

Scenario 2: Login User

1. Go to login page
2. Enter credentials
3. Click login
4. Should redirect to dashboard

Scenario 3: Admin Access

1. Go to login page
2. Click "Admin Login"
3. Enter admin credentials
4. Should redirect to admin panel

Scenario 4: Form Validation

1. Try to submit empty form
2. Should show errors
3. Try to submit with invalid email
4. Should show error
5. Try to submit with mismatched passwords
6. Should show error

Scenario 5: Error Recovery

1. Enter wrong login credentials
2. See error message
3. Correct credentials
4. Should login successfully

═════════════════════════════════════════════════════════════════════════════

🎉 YOU'RE ALL SET!

Once all tests pass, your frontend is ready for:
✅ Dashboard creation
✅ Feature implementation
✅ Production deployment

═════════════════════════════════════════════════════════════════════════════
