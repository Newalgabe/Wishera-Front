# 🔴 CRITICAL: Fix Vercel Environment Variables

## The Problem
The error `http://localhost:5219/api/auth/login` is happening because Vercel has an environment variable set to localhost.

## ✅ Solution: Check and Fix Vercel Environment Variables

### Step 1: Go to Vercel Dashboard
1. Go to https://vercel.com
2. Sign in to your account
3. Select your project: **wishera-front** (or wishera)

### Step 2: Check Environment Variables
1. Click on your project
2. Go to **Settings** → **Environment Variables**
3. Look for these variables and **DELETE** or **UPDATE** them:

   **DELETE these if they contain localhost:**
   - `NEXT_PUBLIC_AUTH_API_URL`
   - `NEXT_PUBLIC_USER_API_URL`
   - `NEXT_PUBLIC_GIFT_API_URL`
   - `NEXT_PUBLIC_CHAT_API_URL`
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_CHAT_SERVICE_URL`
   - `NEXT_PUBLIC_CHAT_HUB_URL`

### Step 3: Set Correct Values (if needed)
If you want to set them explicitly, use these HTTPS URLs:

```
NEXT_PUBLIC_AUTH_API_URL=https://wishera-auth-service.onrender.com/api
NEXT_PUBLIC_USER_API_URL=https://wishera-user-service.onrender.com/api
NEXT_PUBLIC_GIFT_API_URL=https://wishera-gift-service.onrender.com/api
NEXT_PUBLIC_CHAT_API_URL=https://wishera-chat-service.onrender.com/api
NEXT_PUBLIC_API_URL=https://wishera-app.onrender.com/api
```

**OR** just **DELETE them all** - the code will use the correct defaults!

### Step 4: Redeploy
1. After deleting/updating environment variables
2. Go to **Deployments** tab
3. Click the **⋯** menu on the latest deployment
4. Click **Redeploy**
5. Wait for deployment to complete

### Step 5: Clear Browser Cache
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Or clear browser cache completely

## 🔍 How to Verify

After redeploying, check the browser console. You should see:
```
🔍 LOGIN DEBUG: {
  envVar: undefined,  // or https://wishera-auth-service.onrender.com/api
  computedUrl: "https://wishera-auth-service.onrender.com/api",
  isProduction: true,
  hostname: "wishera.vercel.app",
  protocol: "https:"
}
```

If you see `envVar: "http://localhost:5219"`, that's the problem! Delete that environment variable.

## ⚠️ Important Notes

1. **Environment variables override code defaults** - If Vercel has `NEXT_PUBLIC_AUTH_API_URL=http://localhost:5219`, that will be used even with our fixes!

2. **The code now has multiple safety layers:**
   - Runtime getter functions
   - Axios interceptor
   - Final safety check in login function
   - But if the environment variable is set, it will still try to use it first

3. **Best practice:** Delete all `NEXT_PUBLIC_*` environment variables in Vercel and let the code use its defaults (which are the Render URLs).

## 🚨 If Still Not Working

If after fixing environment variables it still doesn't work:

1. Check the browser console for the debug log
2. Share the console output - it will show what URL is being used
3. The code will now throw an error if localhost is detected, which is better than silently failing

