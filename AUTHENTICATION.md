# 🔐 Authentication System Documentation

## Overview

The Pomodoro Timer application implements **mandatory authentication** for all core functionality. Users must sign in to access the timer, track sessions, view statistics, and modify settings.

## Authentication Architecture

### **1. Middleware Protection**
- **File**: `middleware.ts`
- **Purpose**: Server-side route protection using NextAuth.js middleware
- **Coverage**: All routes except auth pages and public assets

### **2. API Route Protection**
- **File**: `lib/auth-guard.ts`
- **Purpose**: Higher-order function to protect API endpoints
- **Features**: Standardized error responses, user ID extraction, ownership validation

### **3. Client-Side Protection**
- **Components**: `GuestPreview.tsx`, `AuthBanner.tsx`
- **Purpose**: UI-level access control and user guidance

## Protected Resources

### **🚫 Requires Authentication**

#### **Pages**
- `/` - Main timer page (redirects to sign-in)
- `/dashboard` - User dashboard
- `/dashboard/history` - Session history
- `/dashboard/settings` - User settings

#### **API Routes**
- `/api/sessions` - Session management
- `/api/user/settings` - User settings
- `/api/stats/daily` - Daily statistics
- `/api/sessions/[id]` - Individual session operations

### **✅ Public Access**

#### **Pages**
- `/auth/signin` - Sign in page
- `/auth/signup` - Registration page
- `/auth/error` - Authentication error page

#### **API Routes**
- `/api/auth/*` - NextAuth.js authentication endpoints

#### **Assets**
- `/timer-worker.js` - Web Worker for background timer
- `/favicon.ico` - Site icon
- `/_next/*` - Next.js static assets

## User Experience Flow

### **1. Unauthenticated User Journey**

```
1. User visits / (main page)
   ↓
2. Middleware detects no authentication
   ↓
3. Redirects to /auth/signin?callbackUrl=/
   ↓
4. User sees sign-in page with callback URL preserved
   ↓
5. After successful login, redirects back to original page
```

### **2. Guest Preview Mode**

When users somehow access the main page without being redirected:

- **Visual Interface**: Timer design is visible but disabled
- **Interactive Elements**: Wrapped in `GuestPreview` component
- **Click Behavior**: Shows sign-in prompt modal
- **Call-to-Action**: Clear buttons for registration/login

### **3. Authentication Banner**

- **Visibility**: Shown to unauthenticated users
- **Content**: Clear message about sign-in requirement
- **Actions**: Direct links to sign-up and sign-in
- **Dismissible**: Users can close banner temporarily

## Implementation Details

### **Middleware Configuration**

```typescript
// middleware.ts
export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|timer-worker.js|manifest.json).*)',
  ],
}
```

**Protected Patterns**:
- All routes except explicitly excluded ones
- Automatic redirection with callback URL preservation

### **API Protection Pattern**

```typescript
// Example usage
export const GET = withAuth(async (request: NextRequest, session: any) => {
  const userId = getUserId(session);
  // Protected logic here
});
```

**Features**:
- Automatic session validation
- User ID extraction
- Standardized error responses
- Type-safe session handling

### **Error Responses**

```typescript
// Standardized error format
{
  error: 'Authentication required',
  message: 'You must be signed in to access this resource.',
  code: 'UNAUTHORIZED'
}
```

**HTTP Status Codes**:
- `401` - Authentication required
- `403` - Access forbidden
- `500` - Authentication error

## Security Features

### **1. Route-Level Protection**
- **Server-side**: Middleware intercepts all requests
- **Client-side**: React components check authentication state
- **API-level**: Higher-order functions validate sessions

### **2. Session Management**
- **JWT Tokens**: Secure session tokens with NextAuth.js
- **Automatic Refresh**: Token refresh handled automatically
- **Secure Storage**: HttpOnly cookies for token storage

### **3. CSRF Protection**
- **Built-in**: NextAuth.js provides CSRF protection
- **Token Validation**: All state-changing requests validated

### **4. Callback URL Security**
- **Validation**: Callback URLs validated to prevent open redirects
- **Preservation**: Original destination preserved through auth flow

## User Interface Components

### **GuestPreview Component**

```typescript
// Usage
<GuestPreview>
  <TimerControls />
</GuestPreview>
```

**Features**:
- Disables interactive elements
- Shows sign-in prompt on interaction
- Maintains visual design integrity
- Provides clear call-to-action

### **AuthBanner Component**

```typescript
// Usage
{!session && <AuthBanner />}
```

**Features**:
- Prominent authentication prompt
- Direct action buttons
- Dismissible interface
- Responsive design

## Testing Authentication

### **Manual Testing Checklist**

#### **Unauthenticated Access**
- [ ] Visit `/` → Redirects to sign-in
- [ ] Visit `/dashboard` → Redirects to sign-in
- [ ] API call to `/api/sessions` → Returns 401
- [ ] Callback URL preserved after redirect

#### **Authenticated Access**
- [ ] All pages accessible after login
- [ ] API endpoints return data
- [ ] Session persists across page refreshes
- [ ] Logout redirects to sign-in

#### **UI Components**
- [ ] Guest preview shows disabled interface
- [ ] Auth banner appears for unauthenticated users
- [ ] Sign-in prompt modal functions correctly
- [ ] Call-to-action buttons work

### **Automated Testing**

```bash
# Test authentication middleware
curl -I http://localhost:3001/
# Expected: 307 redirect to sign-in

# Test API protection
curl -X GET http://localhost:3001/api/sessions
# Expected: Redirect to sign-in

# Test public access
curl -I http://localhost:3001/auth/signin
# Expected: 200 OK
```

## Configuration

### **Environment Variables**

```env
# Required for authentication
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secure-secret"
DATABASE_URL="mongodb://..."
```

### **NextAuth Configuration**

```typescript
// lib/auth.ts
export const authOptions = {
  // Authentication providers
  // Session configuration
  // Callback functions
}
```

## Troubleshooting

### **Common Issues**

#### **Infinite Redirect Loop**
- **Cause**: Middleware misconfiguration
- **Solution**: Check matcher patterns in `middleware.ts`

#### **API Returns HTML Instead of JSON**
- **Cause**: API route not properly protected
- **Solution**: Ensure `withAuth` wrapper is used

#### **Session Not Persisting**
- **Cause**: NEXTAUTH_SECRET not set or incorrect
- **Solution**: Verify environment variables

#### **Callback URL Not Working**
- **Cause**: NEXTAUTH_URL mismatch
- **Solution**: Ensure NEXTAUTH_URL matches deployment URL

### **Debug Mode**

```typescript
// Enable NextAuth debug mode
export const authOptions = {
  debug: process.env.NODE_ENV === 'development',
  // ... other options
}
```

## Best Practices

### **1. Security**
- Always validate user ownership of resources
- Use TypeScript for type safety
- Implement proper error handling
- Never expose sensitive data in client-side code

### **2. User Experience**
- Preserve user's intended destination
- Provide clear authentication prompts
- Maintain visual consistency
- Offer multiple authentication options

### **3. Performance**
- Use middleware for efficient route protection
- Implement proper caching strategies
- Minimize authentication checks
- Optimize bundle size

---

## 🎯 **Authentication Status: Complete**

✅ **Mandatory authentication implemented**
✅ **All routes and APIs protected**
✅ **Guest preview mode functional**
✅ **User experience optimized**
✅ **Security best practices followed**

The Pomodoro Timer now requires authentication for all core functionality while maintaining an excellent user experience and robust security.
