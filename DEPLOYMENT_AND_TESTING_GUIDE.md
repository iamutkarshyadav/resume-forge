# Deployment and Testing Guide

## Pre-Deployment Verification

### 1. Code Review Checklist

- ✅ **backend/src/app.ts**: 
  - [ ] `populateUserFromJWT` middleware created
  - [ ] Applied to tRPC routes (NOT `jwtAuth`)
  - [ ] `jwtAuth` still applied to REST endpoints only
  
- ✅ **backend/src/middleware/error.middleware.ts**:
  - [ ] Added safety checks for status codes
  - [ ] Comments explain REST-only handling
  - [ ] Always returns valid JSON

- ✅ **frontend/providers/onboarding-provider.tsx**:
  - [ ] `checkAuthComplete` state added
  - [ ] Retry logic filters UNAUTHORIZED/FORBIDDEN
  - [ ] Errors are logged but not thrown

- ✅ **frontend/app/layout.tsx**:
  - [ ] Global ErrorBoundary still in place
  - [ ] No changes needed (verified)

## Deployment Steps

### Step 1: Build Backend
```bash
cd backend
npm run build
```

**Verify**:
- No TypeScript errors
- dist/index.js exists
- No warnings about unused imports

### Step 2: Build Frontend
```bash
cd frontend
npm run build
```

**Verify**:
- No TypeScript errors
- .next directory exists
- No build warnings

### Step 3: Deploy
Deploy to your production environment as usual (Netlify, Vercel, Docker, etc.)

## Testing Guide

### Manual Testing (Local Dev)

#### Test 1: First-Time User - Login Works
1. Clear localStorage (Dev Tools → Application → Clear all)
2. Navigate to http://localhost:3000/login
3. **Expected**: Login page loads without error
4. **Verify**: No 401 errors in console
5. Enter valid credentials and login
6. **Expected**: Redirects to dashboard, token saved to localStorage

**Success Criteria**:
- ✅ No white screen error
- ✅ Login form renders
- ✅ Login succeeds and saves token
- ✅ Dashboard loads after login

#### Test 2: Onboarding Graceful Failure
1. With token in localStorage, navigate to http://localhost:3000/dashboard
2. Open DevTools → Network tab
3. Look for `onboarding.getStatus` call
4. **Expected**: Call succeeds OR fails gracefully
5. **Verify**: No "Unable to transform response" error
6. **Verify**: No white error screen even if call fails
7. Dashboard should load regardless

**Success Criteria**:
- ✅ No transport-level errors
- ✅ Onboarding walkthrough either shows or is silently skipped
- ✅ App doesn't crash
- ✅ Error logged to console (if it fails)

#### Test 3: Stale Token Handling
1. Set invalid token in localStorage: `localStorage.setItem('accessToken', 'invalid.token.here')`
2. Refresh page
3. **Expected**: App loads normally (doesn't crash)
4. Open DevTools → Console
5. **Verify**: Warning logged about JWT verification failure
6. Try to access protected feature (like resume analysis)
7. **Expected**: Gets proper error dialog, not white screen
8. Click "Sign In" in error dialog
9. **Expected**: Redirects to login

**Success Criteria**:
- ✅ Invalid token doesn't crash app
- ✅ Error handling for protected routes works
- ✅ User can recover by logging in again

#### Test 4: Protected Routes Still Enforce Auth
1. Clear localStorage completely
2. Try to access http://localhost:3000/dashboard (protected)
3. **Expected**: Redirected to login page (handled by frontend router)
4. Open DevTools → Network
5. Make a request to `/api/v1/trpc/user.getProfile` with no auth header
6. **Expected**: 200 response with tRPC error:
   ```json
   {
     "result": {
       "data": null,
       "error": {
         "code": "UNAUTHORIZED",
         "message": "Authentication required"
       }
     }
   }
   ```
7. **Verify**: Response is valid JSON (not malformed)
8. **Verify**: Response follows tRPC format

**Success Criteria**:
- ✅ Protected routes require auth
- ✅ Responses are valid tRPC format
- ✅ Error codes are correct (UNAUTHORIZED, not 401)

#### Test 5: Auth Endpoints Work Without Token
1. Open DevTools → Network
2. In Console, call:
   ```javascript
   const response = await fetch('/api/v1/trpc/auth.signup', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       '0': {
         firstname: 'Test',
         lastname: 'User',
         email: 'test@example.com',
         password: 'TestPass123'
       }
     })
   });
   const data = await response.json();
   console.log(data);
   ```
3. **Expected**: 200 response with successful auth result or valid error
4. **Verify**: No 401 from HTTP layer (would be plain text)
5. **Verify**: Response is valid JSON with tRPC format

**Success Criteria**:
- ✅ Public auth endpoints accept requests without token
- ✅ Responses are valid tRPC format
- ✅ No HTTP 401 from middleware

#### Test 6: Database Error Handling
(Skip if you don't want to bring down database)

1. Temporarily disable database connection
2. Try to login
3. **Expected**: Gets proper error response
4. **Verify**: Response is valid tRPC format (not 500 plain text)
5. **Verify**: Error code is INTERNAL_SERVER_ERROR

**Success Criteria**:
- ✅ Even with database down, responses are valid tRPC format
- ✅ Errors are serializable

### Automated Testing (if applicable)

If you have tests, verify they pass:

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Monitoring in Production

### Key Metrics to Watch

1. **tRPC Error Rate**: Should remain stable
   ```
   Track: /api/v1/trpc errors per hour
   Alert if: Increases >20% from baseline
   ```

2. **OnboardingProvider Errors**: Should see some 401s (expected)
   ```
   Track: Console warnings "[OnboardingProvider]"
   Alert if: Errors are not UNAUTHORIZED (indicates new issues)
   ```

3. **Global ErrorBoundary Activations**: Should be rare
   ```
   Track: Full-screen error page activations
   Alert if: Increases (indicates real bugs, not domain errors)
   ```

4. **Login Success Rate**: Should remain >99%
   ```
   Track: auth.login success rate
   Alert if: Drops below 95%
   ```

5. **HTTP Status Codes**:
   ```
   Track: 401, 403, 500 response rates
   Alert if: Unusual patterns
   ```

### Log Patterns to Monitor

**Good** (expected logs):
```
[OnboardingProvider] Status fetch failed [UNAUTHORIZED]: Authentication required
populateUserFromJWT middleware error: JWT verification failed: jwt expired
```

**Bad** (investigate if seen):
```
TRPCClientError: Unable to transform response from server
Uncaught error in ErrorBoundary (domain errors)
Unexpected error type at [proc]: [something that's not a proper error]
```

## Rollback Plan

If issues occur:

1. **Immediate Rollback**:
   ```bash
   git revert <commit-hash>
   redeploy
   ```

2. **What Gets Restored**:
   - Old `app.ts` with `jwtAuth` on tRPC routes
   - Old error middleware
   - Old OnboardingProvider

3. **Side Effects**:
   - App will crash again on auth errors in onboarding
   - This is the original broken state, but allows investigation

4. **Investigation After Rollback**:
   - Check error logs for specific failures
   - Verify database connectivity
   - Check tRPC server logs for unexpected errors
   - Reach out to maintainers with specific error patterns

## Performance Impact

Expected performance changes:

**Positive**:
- OnboardingProvider retry logic is smarter (fewer retries on 401)
- populateUserFromJWT is slightly faster than jwtAuth (less db calls)

**Neutral**:
- Error middleware complexity is same
- tRPC serialization cost is same

**No negative impact expected**

## Security Impact

**No security regression**:
- Auth enforcement unchanged
- Invalid tokens still rejected (at tRPC level)
- Protected routes still protected
- No new endpoints exposed

**Improved**:
- Better error observability (helps detect attacks)
- Clearer separation of auth boundaries

## Documentation Updates

After deployment, consider updating:

1. **README.md**:
   - Note that auth is handled at tRPC level, not HTTP level
   
2. **CONTRIBUTING.md**:
   - Document that new procedures should be explicit about public vs protected
   - Explain error handling pattern

3. **ERROR_CODES.md** (if you have one):
   - Ensure UNAUTHORIZED, FORBIDDEN, etc. are documented

4. **DEPLOYMENT.md**:
   - Add note about tRPC error contract integrity
   - Add troubleshooting section for "Unable to transform response" errors

## Checklist Before Declaring Success

- [ ] Tests pass locally
- [ ] No new console warnings/errors
- [ ] Login works without auth token
- [ ] Onboarding doesn't crash app
- [ ] Protected routes enforce auth
- [ ] Error responses are valid tRPC format
- [ ] Database errors don't break contract
- [ ] Global ErrorBoundary still catches real errors
- [ ] Performance is acceptable
- [ ] Logs are clean and helpful
- [ ] Production monitoring shows normal patterns
- [ ] User reported issues are resolved

## Support Escalation

If issues occur that you can't resolve:

1. **Gather Information**:
   - Exact error message from console
   - Network tab HAR file
   - Server logs
   - Browser/version info

2. **Check**:
   - Is it a transport error or domain error?
   - Are responses valid JSON?
   - Are error codes present?
   - Are tokens being sent correctly?

3. **Contact**:
   - Include CRITICAL_FIX_SUMMARY.md context
   - Include specific error logs
   - Include what changed before the issue started
