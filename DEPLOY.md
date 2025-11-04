# Deployment Guide

This guide walks you through deploying Marginelle to Cloudflare using GitHub Actions.

## Architecture Overview

Your app uses a modern local-first architecture:

- **Frontend**: React app deployed to **Cloudflare Pages**
- **Sync Server**: Cloudflare Worker with **Durable Objects** (WebSocket connections)
- **Database**: **D1** (SQLite) for persisting events across devices
- **CI/CD**: **GitHub Actions** with manual deployment triggers

## Prerequisites

Before deploying, you'll need:

1. A Cloudflare account (free tier works)
2. Your domain already added to Cloudflare
3. GitHub repository with this code
4. About 15 minutes

---

## Step 1: Get Your Cloudflare Credentials

### 1.1 Get Your Account ID

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click on any website in your account
3. Scroll down the Overview page
4. Copy your **Account ID** from the right sidebar (under "API")

**Save this** - you'll need it in multiple places.

### 1.2 Create an API Token

1. Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Click **Use template** next to "Edit Cloudflare Workers"
4. **Modify the template**:
   - Account Resources: Include your account
   - Zone Resources: Include all zones (or specific domain)
5. Add these additional permissions:
   - **Account > Cloudflare Pages > Edit**
   - **Account > D1 > Edit**
6. Click **Continue to summary** → **Create Token**
7. **Copy the token** (you can't see it again!)

**Save this token securely** - you'll add it to GitHub next.

---

## Step 2: Configure GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these two secrets:

| Name | Value |
|------|-------|
| `CLOUDFLARE_API_TOKEN` | The API token you created in Step 1.2 |
| `CLOUDFLARE_ACCOUNT_ID` | Your account ID from Step 1.1 |

---

## Step 3: Update wrangler.toml

1. Open `apps/web/wrangler.toml`
2. Find the commented `account_id` line (around line 8)
3. Uncomment it and add your account ID:

```toml
account_id = "your-account-id-here"
```

4. Commit and push this change:

```bash
git add apps/web/wrangler.toml
git commit -m "Add Cloudflare account ID"
git push
```

---

## Step 4: Verify D1 Database

Your wrangler.toml references a D1 database with ID `1c9b5dae-f1fa-49d8-83fa-7bd5b39c4121`.

### Check if it exists:

```bash
cd apps/web
pnpm wrangler d1 list
```

### If it doesn't exist, create it:

```bash
pnpm wrangler d1 create livestore-sync-cf-demo
```

Then update the `database_id` in `wrangler.toml` with the new ID.

---

## Step 5: Deploy the Worker (Sync Server)

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Deploy Cloudflare Worker** workflow
4. Click **Run workflow** → **Run workflow**
5. Wait for the deployment to complete (~30-60 seconds)

### Get your Worker URL:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **Workers & Pages**
3. Click **websocket-server**
4. Copy the URL (looks like `https://websocket-server.your-subdomain.workers.dev`)

**Save this URL** - you need it for the frontend deployment.

---

## Step 6: Create Cloudflare Pages Project

### Option A: Using Cloudflare Dashboard (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **Workers & Pages**
3. Click **Create application** → **Pages** → **Connect to Git**
4. Select your GitHub repository: `marginelle`
5. Configure build settings:
   - **Project name**: `marginelle`
   - **Production branch**: `main`
   - **Build command**: `pnpm install && pnpm --filter web build`
   - **Build output directory**: `apps/web/dist`
   - **Root directory**: `/` (leave empty for monorepo root)
6. Click **Save and Deploy** (this first build will fail - that's okay!)

### Option B: Using GitHub Actions

The workflow is already set up. Just run it after setting the environment variable below.

---

## Step 7: Configure Pages Environment Variables

1. In Cloudflare Dashboard, go to **Workers & Pages** → **marginelle**
2. Click **Settings** → **Environment variables**
3. Under **Production**, click **Add variable**:

| Variable Name | Value |
|--------------|-------|
| `VITE_LIVESTORE_SYNC_URL` | Your Worker URL from Step 5 |

Example: `https://websocket-server.abc123.workers.dev`

4. Click **Save**

---

## Step 8: Deploy the Frontend

### Option A: GitHub Actions (Recommended)

1. Go to GitHub **Actions** tab
2. Select **Deploy Cloudflare Pages** workflow
3. Click **Run workflow** → **Run workflow**
4. Wait for deployment (~1-2 minutes)

### Option B: Cloudflare Dashboard

Just click **Retry deployment** on the initial build that failed.

---

## Step 9: Connect Your Custom Domain

1. In Cloudflare Dashboard, go to **Workers & Pages** → **marginelle**
2. Click **Custom domains** → **Set up a custom domain**
3. Enter your domain (e.g., `yourdomain.com` or `app.yourdomain.com`)
4. Click **Continue**
5. Cloudflare will automatically:
   - Create the necessary DNS records
   - Provision an SSL certificate
   - Configure routing

**DNS propagation** usually takes 1-5 minutes.

### (Optional) Add custom domain to Worker

If you want your Worker on a custom domain too (e.g., `api.yourdomain.com`):

1. Go to **Workers & Pages** → **websocket-server**
2. Click **Settings** → **Domains & Routes**
3. Click **Add** → Enter `api.yourdomain.com`
4. Update `VITE_LIVESTORE_SYNC_URL` to `https://api.yourdomain.com`
5. Redeploy frontend

---

## Step 10: Verify Deployment

1. Visit your Pages URL: `https://marginelle.pages.dev`
   - Or your custom domain if configured
2. Open browser DevTools → **Network** tab
3. Create a book or note
4. Check for WebSocket connection to your Worker
5. Verify data syncs by opening the app in another tab

### Troubleshooting

**"Failed to connect to sync server"**
- Check that `VITE_LIVESTORE_SYNC_URL` is set correctly in Pages
- Verify Worker is deployed and accessible
- Check browser console for CORS errors

**"D1 database not found"**
- Run `pnpm wrangler d1 list` to verify database exists
- Check `database_id` in wrangler.toml matches

**Build fails in GitHub Actions**
- Check that both secrets are set correctly
- Verify `account_id` is uncommented in wrangler.toml
- Look at the GitHub Actions logs for specific errors

---

## Production Checklist

Before going live with real users:

- [ ] Enable authentication in Worker (uncomment `validatePayload` in `src/cf-worker/index.ts`)
- [ ] Set `ADMIN_SECRET` in Worker environment variables (Cloudflare Dashboard)
- [ ] Update CORS settings if needed
- [ ] Configure custom domain
- [ ] Test sync across multiple devices/browsers
- [ ] Set up monitoring (Cloudflare Analytics)
- [ ] Review Cloudflare limits for your usage tier

---

## Updating Your Deployment

### To deploy changes:

1. Push code to `main` branch
2. Go to GitHub **Actions**
3. Manually trigger the relevant workflow:
   - **Deploy Cloudflare Worker** - for Worker changes
   - **Deploy Cloudflare Pages** - for frontend changes

### Quick deploy from command line:

```bash
# Deploy Worker
cd apps/web
pnpm wrangler deploy

# Deploy Pages (need to set up wrangler pages project first)
pnpm wrangler pages deploy dist --project-name=marginelle
```

---

## Cost Estimate

Based on Cloudflare's free tier (as of 2024):

| Service | Free Tier | Cost After Limit |
|---------|-----------|------------------|
| Pages | 500 builds/month, unlimited requests | $0 for most usage |
| Workers | 100k requests/day | $5/month for 10M requests |
| D1 | 5GB storage, 5M reads/day | $0.50/GB, $0.001/1k reads |
| Durable Objects | 1M requests/month | $0.15/M requests |

**Expected cost for moderate usage: $0-5/month**

---

## Support & Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [LiveStore Documentation](https://livestore.dev)
- [Troubleshooting Guide](https://developers.cloudflare.com/workers/observability/)

---

## Next Steps

After deployment:

1. Set up monitoring in Cloudflare Dashboard
2. Configure email notifications for deployment failures
3. Consider enabling preview deployments for PRs
4. Review security headers and CSP policies
5. Set up analytics to track usage

Happy deploying! 🚀
