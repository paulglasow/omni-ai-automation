# OmniAI v4 — Deployment Guide

This guide covers how CI/CD is configured, how to set GitHub Secrets,
and how to troubleshoot failed deployments.

---

## Overview

Every push to the `main` branch automatically:
1. Installs dependencies
2. Builds the React app
3. Deploys to Vercel (production URL)
4. Posts the deployment URL to the commit

Pull requests get a **preview deployment** with a unique URL, with the URL
commented on the PR automatically.

---

## Step 1: Set GitHub Repository Secrets

> This is handled automatically by `npm run setup`. Only follow these steps
> if you need to add or update secrets manually.

1. Go to your **omni-ai** repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** and add each one:

| Secret Name | Where to find it |
|-------------|-----------------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel dashboard → Settings → General → Team ID |
| `VERCEL_PROJECT_ID` | Vercel project → Settings → General → Project ID |
| `SUPABASE_URL` | Supabase dashboard → Project → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase dashboard → Project → Settings → API |
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `GEMINI_API_KEY` | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| `PERPLEXITY_API_KEY` | [perplexity.ai/settings/api](https://perplexity.ai/settings/api) |

---

## Step 2: Find Your Vercel IDs

You need two IDs from Vercel to make the GitHub Action work:

### VERCEL_ORG_ID
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Settings** (top navigation)
3. Copy the **Team ID** (format: `team_ABC...`)

> If you're on a personal account (not a team), use your personal account ID:
> Click your avatar → Settings → Copy the **ID** at the top.

### VERCEL_PROJECT_ID
1. Go to your `omni-ai` project in Vercel
2. Click **Settings** → **General**
3. Copy the **Project ID** (format: `prj_ABC...`)

---

## Step 3: Connect GitHub to Vercel

1. In your Vercel project, click **Settings** → **Git**
2. Click **"Connect Git Repository"**
3. Select **GitHub** and authorize Vercel
4. Choose the `omni-ai` repository
5. Set **Production Branch** to `main`
6. Click **Save**

---

## Step 4: Verify Automated Deploys

After pushing any change to `main`:

1. Go to your repository → **Actions** tab
2. You should see a workflow run called **"Deploy to Vercel"**
3. Click on it to see the steps
4. If it shows ✅ green, your deployment is live

You can also check [vercel.com/dashboard](https://vercel.com/dashboard) → your project → **Deployments** tab.

---

## Workflow File Reference

The workflow is at `.github/workflows/deploy.yml`. Key settings:

```yaml
on:
  push:
    branches: [main]        # Deploy on every push to main
  pull_request:
    branches: [main]        # Preview deploy on every PR
```

To deploy on a different branch, change `main` to your branch name.

---

## Troubleshooting CI/CD Failures

### "VERCEL_TOKEN not found"
→ Add `VERCEL_TOKEN` to GitHub repository secrets (Settings → Secrets → Actions)

### "Project not found"
→ Verify `VERCEL_PROJECT_ID` matches the project in your Vercel dashboard

### "Build failed: Cannot find module"
→ Run `npm install` locally and ensure `package.json` is committed

### "Build failed: react-scripts not found"
→ Move `react-scripts` from devDependencies to dependencies in `package.json`

### "Deployment succeeded but site shows 404"
→ Check `vercel.json` — ensure `outputDirectory` is set to `build`

### Workflow not triggering
→ Check that the branch name in `deploy.yml` matches your actual branch (`main` vs `master`)

### "Resource not accessible by integration"
→ Your GitHub token doesn't have `workflow` scope — regenerate with that permission

---

## Local Build Test

Before pushing, test the build locally:

```bash
npm run build
# Should create a /build directory with no errors
```

If the local build passes but CI fails, check:
1. Environment variables are set in GitHub Secrets
2. Node.js version in CI matches local (should both be 18)
3. No OS-specific dependencies (use cross-platform packages)

---

## Preview Deployments

Every pull request gets a unique preview URL, automatically commented on the PR.

This lets you test changes before merging to production. The preview URL format:
```
https://omni-ai-git-your-branch-name-yourname.vercel.app
```

Preview deployments are automatically deleted when the PR is closed.

---

## Rolling Back a Deployment

If a deployment causes issues:

1. Go to Vercel → your project → **Deployments**
2. Find the last working deployment
3. Click the **"..."** menu → **"Promote to Production"**

This instantly reverts your live site to the previous version.
