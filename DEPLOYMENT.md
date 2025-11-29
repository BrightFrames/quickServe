# Deployment Guide

## Vercel Frontend Setup

1. Go to https://vercel.com/dashboard
2. Select your `quick-serve` project
3. Go to **Settings** → **Environment Variables**
4. Add the following environment variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://quickserve-51ek.onrender.com`
   - **Environments**: Select all (Production, Preview, Development)
5. Click **Save**
6. Go to **Deployments** tab and click **Redeploy** on the latest deployment

## Render Backend Setup

1. Go to https://dashboard.render.com
2. Select your `quickserve-51ek` service
3. Go to **Environment** tab
4. Make sure these environment variables are set:
   - `ALLOWED_ORIGINS`: `http://localhost:8080,http://localhost:8081,https://quick-serve-ten.vercel.app`
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string
   - `JWT_SECRET`: Your JWT secret key
   - `PORT`: `3000`
5. Click **Save Changes**
6. Render will automatically redeploy

## Current URLs

- **Frontend (Vercel)**: https://quick-serve-ten.vercel.app
- **Backend (Render)**: https://quickserve-51ek.onrender.com

## Testing

After deployment, test by:
1. Visit https://quick-serve-ten.vercel.app
2. Try to login/signup
3. Check browser console for any CORS errors
4. If CORS errors persist, check Render logs to verify ALLOWED_ORIGINS includes Vercel URL
