#!/usr/bin/env node
/**
 * OmniAI v4 — Post-Setup Verification
 *
 * Confirms that each automated setup step completed successfully:
 * - GitHub repository exists and is accessible
 * - Vercel deployment is live
 * - Supabase project is running
 * - API keys are valid (format check only — no charges incurred)
 *
 * Reports issues with troubleshooting hints.
 */

import { fileURLToPath } from 'url';
import { parseEnvFile } from './env-generator.js';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

/**
 * Run all verification checks and print a status report.
 *
 * @returns {Promise<{ allPassed: boolean, results: object[] }>}
 */
export async function verifySetup() {
  const envPath = path.join(ROOT, '.env');
  const env = fs.existsSync(envPath) ? parseEnvFile(envPath) : {};

  // Merge process.env so variables set in CI also work
  const config = { ...env, ...process.env };

  const results = [];

  console.log('\n🔎 Verifying OmniAI v4 setup...\n');

  // ── 1. GitHub repository ──────────────────────────────────────────────────
  results.push(await checkGitHub(config));

  // ── 2. Vercel deployment ──────────────────────────────────────────────────
  results.push(await checkVercel(config));

  // ── 3. Supabase project ───────────────────────────────────────────────────
  results.push(await checkSupabase(config));

  // ── 4. API key format checks ──────────────────────────────────────────────
  results.push(checkApiKeyFormat('OPENAI_API_KEY', config.OPENAI_API_KEY, /^sk-/));
  results.push(checkApiKeyFormat('GEMINI_API_KEY', config.GEMINI_API_KEY, /^AIza/));
  results.push(checkApiKeyFormat('PERPLEXITY_API_KEY', config.PERPLEXITY_API_KEY, /^pplx-/));

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  const passed = results.filter((r) => r.status === 'pass');
  const failed = results.filter((r) => r.status === 'fail');
  const skipped = results.filter((r) => r.status === 'skip');

  console.log(`\n✅ Passed:  ${passed.length}`);
  console.log(`❌ Failed:  ${failed.length}`);
  console.log(`⏭️  Skipped: ${skipped.length}\n`);

  if (failed.length > 0) {
    console.log('Troubleshooting tips:');
    for (const f of failed) {
      console.log(`  • ${f.name}: ${f.hint}`);
    }
    console.log('\nSee DEPLOYMENT_GUIDE.md for detailed troubleshooting steps.\n');
  } else {
    console.log('🎉 Everything looks good! Your OmniAI v4 setup is complete.\n');
  }

  return { allPassed: failed.length === 0, results };
}

// ── Check helpers ─────────────────────────────────────────────────────────────

async function checkGitHub(config) {
  const name = 'GitHub Repository';
  const token = config.GITHUB_TOKEN;
  const username = config.GITHUB_USERNAME;
  const repo = config.GITHUB_REPO_NAME || 'omni-ai';

  if (!token || !username) {
    return skip(name, 'GITHUB_TOKEN or GITHUB_USERNAME not set');
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${username}/${repo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`  ✅ GitHub: ${data.html_url}`);
      return pass(name);
    }

    const msg = `HTTP ${res.status} — repo "${username}/${repo}" not found`;
    console.log(`  ❌ GitHub: ${msg}`);
    return fail(name, msg, 'Run: npm run setup  or create the repo manually at github.com/new');
  } catch (err) {
    return fail(name, err.message, 'Check your internet connection and GITHUB_TOKEN');
  }
}

async function checkVercel(config) {
  const name = 'Vercel Deployment';
  const token = config.VERCEL_TOKEN;
  const projectName = 'omni-ai';

  if (!token) {
    return skip(name, 'VERCEL_TOKEN not set');
  }

  try {
    const res = await fetch(`https://api.vercel.com/v9/projects/${projectName}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`  ✅ Vercel: https://${projectName}.vercel.app (project: ${data.id})`);
      return pass(name);
    }

    if (res.status === 404) {
      console.log('  ⚠️  Vercel: project not yet created');
      return fail(name, 'Project not found', 'Run: npm run setup  to create and deploy the project');
    }

    return fail(name, `HTTP ${res.status}`, 'Check VERCEL_TOKEN is valid at vercel.com/account/tokens');
  } catch (err) {
    return fail(name, err.message, 'Check your internet connection and VERCEL_TOKEN');
  }
}

async function checkSupabase(config) {
  const name = 'Supabase Connection';
  const url = config.SUPABASE_URL;
  const anonKey = config.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return skip(name, 'SUPABASE_URL or SUPABASE_ANON_KEY not set — run npm run setup first');
  }

  try {
    // Use a lightweight health-check endpoint
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });

    if (res.ok) {
      console.log(`  ✅ Supabase: ${url}`);
      return pass(name);
    }

    console.log(`  ⚠️  Supabase responded with HTTP ${res.status}`);
    return fail(name, `HTTP ${res.status}`, 'Check SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
  } catch (err) {
    return fail(name, err.message, 'Supabase may still be initializing — wait a few minutes and retry');
  }
}

function checkApiKeyFormat(name, value, pattern) {
  if (!value) {
    console.log(`  ⏭️  ${name}: not set (optional)`);
    return skip(name, 'not set — add it later in .env for AI features');
  }

  if (pattern.test(value)) {
    console.log(`  ✅ ${name}: format OK`);
    return pass(name);
  }

  console.log(`  ⚠️  ${name}: format looks unexpected`);
  return fail(name, 'unexpected format', `Check the key at its provider dashboard. See TOKENS_NEEDED.md`);
}

// ── Result builders ───────────────────────────────────────────────────────────
const pass = (name) => ({ name, status: 'pass' });
const fail = (name, reason, hint) => ({ name, status: 'fail', reason, hint });
const skip = (name, reason) => ({ name, status: 'skip', reason });

// ── CLI entry point ──────────────────────────────────────────────────────────
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  verifySetup()
    .then(({ allPassed }) => process.exit(allPassed ? 0 : 1))
    .catch((err) => {
      console.error('Verification error:', err.message);
      process.exit(1);
    });
}
