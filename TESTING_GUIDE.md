# Testing Guide

## Prerequisites

Before testing, ensure:
1. ✅ Backend environment variables are set (`DATABASE_URL`, JWT secrets)
2. ✅ Backend is running: `npm run dev:backend`
3. ✅ Frontend is running: `npm run dev`
4. ✅ Both connected: Frontend on port 3000, Backend on port 4000
5. ✅ Database is accessible and migrations run

Check by visiting: `http://localhost:4000/api/v1/health`

---

## Test Suite 1: Account Creation & Error Handling

### Test 1.1: Successful Signup
**Goal**: Verify normal signup flow works without errors

**Steps**:
1. Navigate to `http://localhost:3000/signup`
2. Fill form:
   - Firstname: "John"
   - Lastname: "Doe"
   - Email: "john@example.com"
   - Password: "SecurePass123"
   - Confirm Password: "SecurePass123"
3. Click "Continue"

**Expected**:
- Success toast appears: "Account created successfully!"
- Redirects to `/dashboard`
- User can see dashboard content
- No error dialog appears

**Result**: ✅ / ❌

---

### Test 1.2: Duplicate Email Error
**Goal**: Verify custom error dialog shows for duplicate email

**Setup**: Use email from Test 1.1

**Steps**:
1. Navigate to `http://localhost:3000/signup`
2. Fill form with SAME email from Test 1.1
3. Complete signup
4. Wait for response

**Expected**:
- Custom error dialog appears with:
  - Title: "Email Already Registered"
  - Message: "This email is already registered. Please sign in instead."
  - Type indicator (red/warning style)
  - "Go to Login" button
  - "Dismiss" button
- No toast appears
- No browser alert
- No Next.js error overlay

**Action Test**: Click "Go to Login" button → redirects to `/login`

**Result**: ✅ / ❌

---

### Test 1.3: Invalid Email Format (Client-Side)
**Goal**: Verify form validation doesn't show dialog

**Steps**:
1. Navigate to `http://localhost:3000/signup`
2. Fill form with invalid email: "notanemail"
3. Try to submit
4. Observe what happens

**Expected**:
- Form validation error appears inline under email field
- Error text: "Invalid email address"
- Button stays enabled (red outline only)
- NO custom error dialog appears
- NO server request made

**Result**: ✅ / ❌

---

### Test 1.4: Short Password (Client-Side)
**Goal**: Verify password validation works

**Steps**:
1. Navigate to `http://localhost:3000/signup`
2. Enter password: "short"
3. Observe form state

**Expected**:
- Inline error under password: "Password must be at least 8 characters"
- Submit button disabled
- NO error dialog

**Result**: ✅ / ❌

---

### Test 1.5: Password Mismatch
**Goal**: Verify confirm password validation

**Steps**:
1. Navigate to `http://localhost:3000/signup`
2. Password: "Correct12345"
3. Confirm: "Wrong1234"
4. Try to submit

**Expected**:
- Error under confirm password: "Passwords do not match"
- Button disabled
- NO error dialog

**Result**: ✅ / ❌

---

### Test 1.6: Database Connection Error
**Goal**: Simulate DB failure to test error handling

**Steps**:
1. Temporarily disconnect database or set invalid `DATABASE_URL`
2. Restart backend
3. Try to signup with valid data

**Expected**:
- Custom error dialog appears
- Message: "Database connection failed. Please try again." or similar
- NO Prisma error visible
- NO stack trace
- Clean error message

**Clean up**: Restore database connection, restart backend

**Result**: ✅ / ❌

---

### Test 1.7: Login with Invalid Credentials
**Goal**: Test login error handling

**Steps**:
1. Navigate to `http://localhost:3000/login`
2. Email: "john@example.com" (from Test 1.1)
3. Password: "WrongPassword123"
4. Click "Sign In"

**Expected**:
- Custom error dialog appears
- Title: "Login Failed" or "Invalid Credentials"
- Message: "Invalid email or password"
- Type: warning/error (red styling)
- Can dismiss or retry

**Result**: ✅ / ❌

---

### Test 1.8: Login Success
**Goal**: Verify login works and doesn't show errors

**Steps**:
1. Navigate to `http://localhost:3000/login`
2. Email: "john@example.com"
3. Password: "SecurePass123"
4. Click "Sign In"

**Expected**:
- Success toast: "Logged in successfully!"
- Redirects to `/dashboard`
- NO error dialog
- Can access dashboard features

**Result**: ✅ / ❌

---

## Test Suite 2: First-Time User Onboarding

### Test 2.1: Onboarding Starts for New User
**Goal**: Verify walkthrough appears for first-time users

**Setup**: Complete Test 1.1 (new user signup)

**Steps**:
1. After signup, redirected to dashboard
2. Wait 1 second for onboarding to initialize
3. Observe screen

**Expected**:
- Walkthrough overlay appears with:
  - Dark overlay covering page
  - White tooltip box
  - Title: "Welcome to Resume Forge"
  - Description about walkthrough
  - "Skip" and "Next" buttons
  - Progress indicator (1 / 6)
- Background content is still visible (not blocked)
- Dashboard is still usable

**Result**: ✅ / ❌

---

### Test 2.2: Step 2 - Upload Resume
**Goal**: Test spotlight effect on upload section

**Steps**:
1. From Test 2.1, click "Next" button
2. Observe what's highlighted

**Expected**:
- Overlay updates with new step
- Title: "Upload Your Resume"
- Description: "Start by uploading your resume..."
- Yellow spotlight/border appears around the Resumes card
- Card has 4px yellow border glow
- Clicking highlighted card advances step
- Progress shows (2 / 6)

**Result**: ✅ / ❌

---

### Test 2.3: Step 3 - Analyze
**Goal**: Test spotlight on analyze button

**Steps**:
1. Click "Next" from Step 2
2. Observe

**Expected**:
- Spotlight moves to Analyze card
- Title: "Analyze Your Resume"
- Yellow border highlights Analyze card
- Progress: (3 / 6)

**Result**: ✅ / ❌

---

### Test 2.4: Step 4 - History
**Goal**: Test spotlight on history

**Steps**:
1. Click "Next" from Step 3
2. Observe

**Expected**:
- Spotlight on Progress/History card
- Title: "View Your History"
- Progress: (4 / 6)

**Result**: ✅ / ❌

---

### Test 2.5: Step 5 - Job Descriptions
**Goal**: Test spotlight on sidebar link

**Steps**:
1. Click "Next" from Step 4
2. Observe

**Expected**:
- Spotlight moves to sidebar "Jobs" link
- Title: "Manage Job Descriptions"
- Progress: (5 / 6)

**Result**: ✅ / ❌

---

### Test 2.6: Step 6 - Completion
**Goal**: Test final step

**Steps**:
1. Click "Next" from Step 5
2. Observe button text change

**Expected**:
- Final welcome message
- Title: "You're all set!"
- Button text changes from "Next" to "Done"
- Progress: (6 / 6)

**Result**: ✅ / ❌

---

### Test 2.7: Complete Walkthrough
**Goal**: Finish walkthrough by clicking Done

**Steps**:
1. From Test 2.6, click "Done" button
2. Observe page

**Expected**:
- Walkthrough closes completely
- Overlay disappears
- Dashboard fully accessible
- Walkthrough doesn't reappear on page refresh
- Backend saved completion state

**Result**: ✅ / ❌

---

### Test 2.8: Skip Walkthrough
**Goal**: Test skip functionality

**Setup**: Sign up as new user (use different email than Test 1.1)

**Steps**:
1. After signup, walkthrough appears (Test 2.1)
2. Click "Skip" button
3. Refresh page

**Expected**:
- Walkthrough closes immediately
- Clicking "Skip" dismisses at any step
- After refresh:
  - Walkthrough does NOT reappear
  - Backend marked as skipped

**Result**: ✅ / ❌

---

### Test 2.9: Close Button (X)
**Goal**: Test close icon dismissal

**Setup**: Sign up as new user

**Steps**:
1. Walkthrough appears
2. Click X button (top-right of tooltip)
3. Observe

**Expected**:
- Walkthrough closes
- Behavior same as "Skip"

**Result**: ✅ / ❌

---

### Test 2.10: Keyboard Escape
**Goal**: Test Escape key to close

**Setup**: Sign up as new user

**Steps**:
1. Walkthrough appears
2. Press Escape key
3. Observe

**Expected**:
- Walkthrough closes (OR no action - depends on implementation)
- Page remains functional

**Result**: ✅ / ❌

---

### Test 2.11: Walkthrough Doesn't Appear for Returning User
**Goal**: Verify second login doesn't trigger walkthrough

**Setup**: From Test 2.7 (user completed onboarding)

**Steps**:
1. Logout if possible (or close app)
2. Login with same account
3. Navigate to dashboard
4. Wait 2 seconds

**Expected**:
- NO walkthrough appears
- Dashboard shows normally
- isOnboarding: false in backend

**Result**: ✅ / ❌

---

### Test 2.12: Onboarding doesn't block functionality
**Goal**: Verify user can still use dashboard while walkthrough is open

**Setup**: Sign up as new user with walkthrough on Step 2

**Steps**:
1. Walkthrough shows Step 2 (Upload)
2. Try to click on other elements (History button, sidebar, etc.)
3. Try to scroll

**Expected**:
- Spotlight prevents interaction with highlighted element
- Other elements still clickable (except highlighted one)
- Page scrolls normally
- Tooltip is always visible and on-screen

**Result**: ✅ / ❌

---

## Test Suite 3: Error Handling Integration

### Test 3.1: Plan Limit Error
**Goal**: Test plan limit error handling

**Setup**: Simulate a "plan limit reached" error

**Steps**:
1. Login to account with exhausted analyses
2. Try to run an analysis
3. Backend returns: `HttpError(403, "Analysis limit reached...")`
4. Observe response

**Expected**:
- Custom error dialog:
  - Title: "Analysis Limit Reached"
  - Type: warning (yellow/orange)
  - Message: "You have reached your monthly analysis limit."
  - Description: "Upgrade to Pro or Enterprise for higher limits."
  - Buttons: "Upgrade Plan", "Dismiss"
- Clicking "Upgrade Plan" → `/settings?tab=plan`
- Clicking "Dismiss" → closes dialog

**Note**: May need to manually trigger this error or set analytics limit to 0

**Result**: ✅ / ❌

---

### Test 3.2: Session Expired Error
**Goal**: Test session expiration

**Steps**:
1. Login
2. Manually delete `localStorage.getItem('accessToken')` in console
3. Try to fetch protected resource
4. Browser console: `> localStorage.clear()`
5. Refresh page
6. Try to access dashboard

**Expected**:
- If tRPC call fails with UNAUTHORIZED:
  - Error dialog: "Session Expired"
  - Message: "Your session has expired. Please sign in again."
  - Button: "Sign In"
- Clicking button → `/login`

**Result**: ✅ / ❌

---

### Test 3.3: Generic Error Dialog
**Goal**: Test unknown/generic errors

**Steps**:
1. Simulate network error: Browser DevTools → Network → offline
2. Try any action (e.g., upload, analyze)
3. Observe error handling

**Expected**:
- Custom error dialog:
  - Title: "Something went wrong"
  - Friendly message (not raw error)
  - No stack trace
  - Has "Dismiss" or retry option
- NO browser `window.alert()`
- NO Next.js error overlay

**Result**: ✅ / ❌

---

## Test Suite 4: Regression Tests

### Test 4.1: No Console Errors
**Goal**: Verify no JavaScript errors in console

**Steps**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Perform actions from all previous tests
4. Check for red error messages

**Expected**:
- No red error messages
- Warnings are OK
- Info/debug logs are OK

**Result**: ✅ / ❌

---

### Test 4.2: Resume Upload Still Works
**Goal**: Verify resume upload not broken by changes

**Steps**:
1. Login
2. Navigate to `/resumes`
3. Upload a PDF or Word file
4. Observe success

**Expected**:
- File uploads successfully
- Resume appears in list
- Can view resume details
- Error dialog doesn't appear

**Result**: ✅ / ❌

---

### Test 4.3: Analysis Workflow
**Goal**: Verify analysis flow unchanged

**Steps**:
1. Login with account that has uploaded resumes
2. Navigate to `/analyze`
3. Select a resume
4. Enter job description
5. Click "Analyze"
6. Wait for results

**Expected**:
- Analysis completes normally
- Results show with score
- No unexpected error dialogs
- Can generate variations or export

**Result**: ✅ / ❌

---

### Test 4.4: History/Progress Page
**Goal**: Verify history features

**Steps**:
1. Login
2. Navigate to `/history`
3. Check past analyses display

**Expected**:
- List shows all past analyses
- Can click on items
- Score displays correctly
- Dates correct

**Result**: ✅ / ❌

---

### Test 4.5: Settings/Profile Page
**Goal**: Verify settings not broken

**Steps**:
1. Login
2. Navigate to `/settings`
3. Try to change profile info

**Expected**:
- Form displays
- Changes save properly
- No error dialogs for expected operations

**Result**: ✅ / ❌

---

### Test 4.6: Dark Mode Still Works
**Goal**: Verify theming unchanged

**Steps**:
1. Check if dark/light mode toggle exists
2. Toggle between modes
3. Check all error dialogs
4. Check walkthrough in both modes

**Expected**:
- Dark mode works correctly
- Light mode works correctly
- Error dialogs visible in both modes
- Walkthrough visible in both modes
- Colors contrast properly

**Result**: ✅ / ❌

---

## Summary Results

| Test | Status | Notes |
|------|--------|-------|
| 1.1 Successful Signup | ✅/❌ | |
| 1.2 Duplicate Email Error | ✅/❌ | |
| 1.3 Invalid Email (client) | ✅/❌ | |
| 1.4 Short Password | ✅/❌ | |
| 1.5 Password Mismatch | ✅/❌ | |
| 1.6 DB Connection Error | ✅/❌ | |
| 1.7 Invalid Login | ✅/❌ | |
| 1.8 Valid Login | ✅/❌ | |
| 2.1 Walkthrough Starts | ✅/❌ | |
| 2.2 Step 2 Spotlight | ✅/❌ | |
| 2.3 Step 3 Spotlight | ✅/❌ | |
| 2.4 Step 4 Spotlight | ✅/❌ | |
| 2.5 Step 5 Spotlight | ✅/❌ | |
| 2.6 Step 6 Completion | ✅/❌ | |
| 2.7 Complete Walkthrough | ✅/❌ | |
| 2.8 Skip Walkthrough | ✅/❌ | |
| 2.9 Close Button | ✅/❌ | |
| 2.10 Keyboard Escape | ✅/❌ | |
| 2.11 No Walkthrough Return | ✅/❌ | |
| 2.12 Doesn't Block Use | ✅/❌ | |
| 3.1 Plan Limit Error | ✅/❌ | |
| 3.2 Session Expired | ✅/❌ | |
| 3.3 Generic Error | ✅/❌ | |
| 4.1 No Console Errors | ✅/❌ | |
| 4.2 Resume Upload | ✅/❌ | |
| 4.3 Analysis Workflow | ✅/❌ | |
| 4.4 History Page | ✅/❌ | |
| 4.5 Settings Page | ✅/❌ | |
| 4.6 Dark Mode | ✅/❌ | |

**Overall Status**: ____ / 30 ✅

---

## Debugging Tips

### Error Dialog Not Appearing
1. Check browser console for errors
2. Verify ErrorProvider is in `app/providers.tsx`
3. Check `useErrorHandler()` is called correctly
4. Verify mutation has `onError` handler

### Onboarding Not Starting
1. Check user.isNew = true in database
2. Verify OnboardingProvider in `app/providers.tsx`
3. Check tRPC query succeeds: `trpc.onboarding.getStatus`
4. Look for JavaScript errors in console

### Spotlight Not Showing
1. Verify `data-onboarding="..."` attribute on element
2. Check element is visible (not display: none)
3. Verify element exists in DOM before walkthrough starts
4. Check z-index of overlay (should be z-40, tooltip z-50)

### Backend Errors
1. Check DATABASE_URL is valid
2. Verify backend port is 4000
3. Check logs: `npm run dev:backend`
4. Test health: `curl http://localhost:4000/api/v1/health`

---

## Notes

- Tests marked with ✅ should pass, ❌ should fail
- Timing: Some operations take 1-2 seconds, wait before asserting
- Browser DevTools Network tab helps debug API calls
- Check Redux/Zustand dev tools if available for state inspection
