#!/usr/bin/env node
/**
 * OmniAI v4 — GitHub Repository Setup
 *
 * Creates the omni-ai repository on GitHub, uploads source files,
 * and configures repository secrets for CI/CD.
 *
 * Returns: { repoUrl, cloneUrl, success }
 */

import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Create the omni-ai repository and configure it for deployment.
 *
 * @param {object} config
 * @param {string} config.githubToken  - Personal Access Token with repo + workflow scopes
 * @param {string} config.username     - GitHub username
 * @param {string} config.repoName     - Repository name (default: 'omni-ai')
 * @param {object} config.secrets      - Key/value pairs to store as repo secrets
 * @returns {Promise<{repoUrl: string, cloneUrl: string, success: boolean}>}
 */
export async function setupGitHubRepo({
  githubToken,
  username,
  repoName = 'omni-ai',
  secrets = {},
}) {
  const octokit = new Octokit({ auth: githubToken });

  console.log(`\n📦 Setting up GitHub repository: ${username}/${repoName}`);

  // ── 1. Create the repository ──────────────────────────────────────────────
  let repo;
  try {
    const { data } = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      description: 'OmniAI v4 — AI-powered personal assistant',
      private: false,
      auto_init: true,
    });
    repo = data;
    console.log(`  ✅ Repository created: ${data.html_url}`);
  } catch (err) {
    if (err.status === 422) {
      // Repository already exists — fetch it instead
      const { data } = await octokit.repos.get({ owner: username, repo: repoName });
      repo = data;
      console.log(`  ℹ️  Repository already exists: ${data.html_url}`);
    } else {
      throw new Error(`Failed to create repository: ${err.message}`);
    }
  }

  // ── 2. Upload source files (if they exist locally) ────────────────────────
  const filesToUpload = [
    { localPath: path.join(__dirname, '..', 'src', 'omni-v4.jsx'), remotePath: 'src/omni-v4.jsx' },
    { localPath: path.join(__dirname, '..', 'electron-main.js'), remotePath: 'electron-main.js' },
    { localPath: path.join(__dirname, '..', 'supabase-schema.sql'), remotePath: 'supabase-schema.sql' },
  ];

  for (const { localPath, remotePath } of filesToUpload) {
    if (fs.existsSync(localPath)) {
      try {
        const content = fs.readFileSync(localPath);
        const contentBase64 = content.toString('base64');

        // Check if file already exists in repo
        let sha;
        try {
          const { data } = await octokit.repos.getContent({
            owner: username,
            repo: repoName,
            path: remotePath,
          });
          sha = data.sha;
        } catch {
          // File doesn't exist yet — that's fine
        }

        await octokit.repos.createOrUpdateFileContents({
          owner: username,
          repo: repoName,
          path: remotePath,
          message: `Add ${remotePath}`,
          content: contentBase64,
          ...(sha ? { sha } : {}),
        });
        console.log(`  ✅ Uploaded: ${remotePath}`);
      } catch (err) {
        console.warn(`  ⚠️  Could not upload ${remotePath}: ${err.message}`);
      }
    } else {
      console.log(`  ℹ️  Skipped (not found locally): ${remotePath}`);
    }
  }

  // ── 3. Store repository secrets for CI/CD ────────────────────────────────
  if (Object.keys(secrets).length > 0) {
    console.log('  🔐 Configuring repository secrets...');

    // Get the repository public key for secret encryption
    const { data: publicKeyData } = await octokit.actions.getRepoPublicKey({
      owner: username,
      repo: repoName,
    });

    for (const [secretName, secretValue] of Object.entries(secrets)) {
      if (!secretValue) {
        console.log(`  ⏭️  Skipped empty secret: ${secretName}`);
        continue;
      }

      try {
        // Encrypt the secret using libsodium (via sodium-native or tweetnacl)
        const encryptedValue = await encryptSecret(publicKeyData.key, secretValue);

        await octokit.actions.createOrUpdateRepoSecret({
          owner: username,
          repo: repoName,
          secret_name: secretName,
          encrypted_value: encryptedValue,
          key_id: publicKeyData.key_id,
        });
        console.log(`  ✅ Secret configured: ${secretName}`);
      } catch (err) {
        console.warn(`  ⚠️  Could not set secret ${secretName}: ${err.message}`);
      }
    }
  }

  return {
    repoUrl: repo.html_url,
    cloneUrl: repo.clone_url,
    success: true,
  };
}

/**
 * Encrypt a secret value using the repository's public key.
 * Uses libsodium-wrappers for proper sealed box encryption compatible with GitHub.
 *
 * @param {string} publicKey - Base64-encoded public key
 * @param {string} secretValue - Plain text secret
 * @returns {Promise<string>} Base64-encoded encrypted value
 */
async function encryptSecret(publicKey, secretValue) {
  try {
    // Use libsodium-wrappers for correct GitHub secret encryption
    const sodium = await import('libsodium-wrappers');
    await sodium.default.ready;

    const publicKeyBytes = sodium.default.from_base64(publicKey, sodium.default.base64_variants.ORIGINAL);
    const secretBytes = Buffer.from(secretValue, 'utf-8');
    const encryptedBytes = sodium.default.crypto_box_seal(secretBytes, publicKeyBytes);

    return Buffer.from(encryptedBytes).toString('base64');
  } catch {
    // libsodium not available — warn and fall back
    // Note: GitHub requires proper encryption for real use
    console.warn('  ⚠️  libsodium-wrappers not available — secret encryption skipped');
    console.warn('       Install it with: npm install libsodium-wrappers');
    return Buffer.from(secretValue).toString('base64');
  }
}

// ── CLI entry point ──────────────────────────────────────────────────────────
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;

  if (!token || !username) {
    console.error('Error: GITHUB_TOKEN and GITHUB_USERNAME must be set in your .env file.');
    process.exit(1);
  }

  setupGitHubRepo({
    githubToken: token,
    username,
    secrets: {
      VERCEL_TOKEN: process.env.VERCEL_TOKEN,
      VERCEL_ORG_ID: process.env.VERCEL_ORG_ID,
      VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
    },
  })
    .then((result) => {
      console.log('\n✅ GitHub setup complete!');
      console.log(`   Repo URL:  ${result.repoUrl}`);
      console.log(`   Clone URL: ${result.cloneUrl}`);
    })
    .catch((err) => {
      console.error('\n❌ GitHub setup failed:', err.message);
      process.exit(1);
    });
}