#!/usr/bin/env node
/**
 * OmniAI v4 — Vercel Deployment
 *
 * Creates a Vercel project, connects your GitHub repository,
 * sets environment variables, and triggers the initial deployment.
 *
 * Returns: { deployUrl, projectId, success }
 */

import { fileURLToPath } from 'url';

const VERCEL_API = 'https://api.vercel.com';

/**
 * Create a Vercel project and deploy it from a GitHub repository.
 *
 * @param {object} config
 * @param {string} config.vercelToken    - Vercel API token
 * @param {string} config.projectName    - Project name (e.g. 'omni-ai')
 * @param {string} config.githubUsername - GitHub username
 * @param {string} config.githubRepo     - GitHub repository name
 * @param {object} config.envVars        - Environment variables to set on the project
 * @returns {Promise<{deployUrl: string, projectId: string, success: boolean}>}
 */
export async function deployToVercel({
  vercelToken,
  projectName = 'omni-ai',
  githubUsername,
  githubRepo = 'omni-ai',
  envVars = {},
}) {
  const headers = {
    Authorization: `Bearer ${vercelToken}`,
    'Content-Type': 'application/json',
  };

  console.log(`\n🚀 Setting up Vercel project: ${projectName}`);

  // ── 1. Create or get the project ─────────────────────────────────────────
  let project;
  try {
    const res = await fetch(`${VERCEL_API}/v9/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: projectName,
        framework: 'create-react-app',
        gitRepository: {
          type: 'github',
          repo: `${githubUsername}/${githubRepo}`,
        },
        buildCommand: 'npm run build',
        outputDirectory: 'build',
        installCommand: 'npm ci',
      }),
    });

    if (!res.ok && res.status !== 409) {
      const body = await res.json();
      throw new Error(`Vercel API error (${res.status}): ${body.error?.message || JSON.stringify(body)}`);
    }

    if (res.status === 409) {
      // Project already exists — fetch it
      console.log('  ℹ️  Project already exists — fetching details...');
      const listRes = await fetch(`${VERCEL_API}/v9/projects/${projectName}`, { headers });
      project = await listRes.json();
    } else {
      project = await res.json();
    }

    console.log(`  ✅ Project ready: ${project.id}`);
  } catch (err) {
    throw new Error(`Failed to create Vercel project: ${err.message}`);
  }

  // ── 2. Set environment variables ─────────────────────────────────────────
  const envEntries = Object.entries(envVars).filter(([, v]) => v);
  if (envEntries.length > 0) {
    console.log('  🔧 Setting environment variables...');
    for (const [key, value] of envEntries) {
      try {
        const res = await fetch(`${VERCEL_API}/v9/projects/${project.id}/env`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            key,
            value,
            type: 'encrypted',
            target: ['production', 'preview', 'development'],
          }),
        });

        if (res.ok || res.status === 409) {
          console.log(`  ✅ Env var set: ${key}`);
        } else {
          const body = await res.json();
          console.warn(`  ⚠️  Could not set ${key}: ${body.error?.message}`);
        }
      } catch (err) {
        console.warn(`  ⚠️  Error setting ${key}: ${err.message}`);
      }
    }
  }

  // ── 3. Trigger initial deployment ─────────────────────────────────────────
  console.log('  🏗️  Triggering deployment...');
  let deployUrl = `https://${projectName}.vercel.app`;

  try {
    const deployRes = await fetch(`${VERCEL_API}/v13/deployments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: projectName,
        project: project.id,
        target: 'production',
        gitSource: {
          type: 'github',
          repoId: project.link?.repoId,
          ref: 'main',
        },
      }),
    });

    if (deployRes.ok) {
      const deployment = await deployRes.json();
      deployUrl = `https://${deployment.url}`;
      console.log(`  ✅ Deployment triggered: ${deployUrl}`);

      // ── 4. Wait for deployment completion ──────────────────────────────
      console.log('  \u23f3 Waiting for deployment to complete (this may take up to 5 minutes)...');
      await waitForDeployment(deployment.id, headers);
    } else {
      console.log('  ℹ️  Deployment will be triggered automatically when code is pushed to main.');
    }
  } catch (err) {
    console.warn(`  ⚠️  Could not trigger deployment: ${err.message}`);
    console.log('  ℹ️  Deployment will be triggered when you push code to your GitHub repository.');
  }

  return {
    deployUrl,
    projectId: project.id,
    success: true,
  };
}

/**
 * Poll Vercel API until deployment is READY or ERROR.
 *
 * @param {string} deploymentId - Vercel deployment ID
 * @param {object} headers      - Authorization headers
 * @param {number} [timeout=300000] - Timeout in ms (default 5 minutes)
 */
async function waitForDeployment(deploymentId, headers, timeout = 300_000) {
  const start = Date.now();
  const interval = 5_000; // poll every 5 seconds

  while (Date.now() - start < timeout) {
    await new Promise((r) => setTimeout(r, interval));

    try {
      const res = await fetch(`${VERCEL_API}/v13/deployments/${deploymentId}`, { headers });
      const data = await res.json();

      if (data.readyState === 'READY') {
        console.log(`  ✅ Deployment ready: https://${data.url}`);
        return;
      }
      if (data.readyState === 'ERROR') {
        throw new Error(`Deployment failed with state: ${data.readyState}`);
      }

      process.stdout.write('.');
    } catch (err) {
      // Ignore transient errors and keep polling
    }
  }

  console.log('\n  ⚠️  Deployment timed out — check https://vercel.com/dashboard for status.');
}

// ── CLI entry point ──────────────────────────────────────────────────────────
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const vercelToken = process.env.VERCEL_TOKEN;
  const githubUsername = process.env.GITHUB_USERNAME;

  if (!vercelToken || !githubUsername) {
    console.error('Error: VERCEL_TOKEN and GITHUB_USERNAME must be set in your .env file.');
    process.exit(1);
  }

  deployToVercel({
    vercelToken,
    githubUsername,
    envVars: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    },
  })
    .then((result) => {
      console.log('\n✅ Vercel deployment complete!');
      console.log(`   Live URL:   ${result.deployUrl}`);
      console.log(`   Project ID: ${result.projectId}`);
    })
    .catch((err) => {
      console.error('\n❌ Vercel deployment failed:', err.message);
      process.exit(1);
    });
}
