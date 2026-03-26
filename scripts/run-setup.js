#!/usr/bin/env node
/**
 * OmniAI v4 — Setup Orchestrator
 *
 * This is the main entry point for `npm run setup`.
 * It prompts for tokens, then runs all automation in sequence.
 */

import readlineSync from 'readline-sync';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ── Helpers ────────────────────────────────────────────────────────────────

function header(text) {
  const line = '═'.repeat(60);
  console.log(`\n${line}`);
  console.log(`  ${text}`);
  console.log(`${line}`);
}

function step(num, total, text) {
  console.log(`\n[${num}/${total}] ${text}`);
}

/**
 * Prompt the user for input. Uses readline-sync so secret inputs are hidden
 * and backspace/edit keys work correctly.
 *
 * @param {string} question - Prompt text
 * @param {boolean} secret  - Hide input (for passwords/tokens)
 * @returns {string}
 */
function prompt(question, secret = false) {
  if (secret) {
    return readlineSync.question(question, { hideEchoBack: true });
  }
  return readlineSync.question(question);
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  header('OmniAI v4 — Automated Setup');

  console.log(`
Welcome! This wizard will set up your OmniAI v4 environment in about 5 minutes.

What gets automated:
  ✅  GitHub repository (omni-ai)
  ✅  Vercel deployment (live URL)
  ✅  Supabase database
  ✅  .env file generation

What you do after (40 min):
  📝  Add AI API keys (OpenAI, Gemini, Perplexity)
  📧  Email and calendar setup
  💰  Financial account linking
  📱  Siri shortcuts

See SETUP_CHECKLIST.md and MANUAL_STEPS.md for the full guide.
`);

  // ── Step 1: Load existing .env ────────────────────────────────────────────
  step(1, 6, 'Loading existing configuration...');
  const { parseEnvFile } = await import('./env-generator.js');
  const envPath = path.join(ROOT, '.env');
  const existingEnv = fs.existsSync(envPath) ? parseEnvFile(envPath) : {};

  // ── Step 2: Collect tokens ────────────────────────────────────────────────
  step(2, 6, 'Collecting API tokens (values are hidden as you type)');
  console.log(`
You'll need 3 tokens. Get them here:
  GitHub  → https://github.com/settings/tokens?type=beta  (scope: repo, workflow)
  Vercel  → https://vercel.com/account/tokens
  Supabase → https://supabase.com/dashboard/account/tokens

Press Enter to keep an existing value.
`);

  const githubToken =
    prompt('  GitHub Token (ghp_...): ', true) || existingEnv.GITHUB_TOKEN || '';
  const githubUsername =
    prompt('  GitHub Username: ') || existingEnv.GITHUB_USERNAME || '';
  const vercelToken =
    prompt('  Vercel Token: ', true) || existingEnv.VERCEL_TOKEN || '';
  const supabaseToken =
    prompt('  Supabase Token: ', true) || existingEnv.SUPABASE_TOKEN || '';

  if (!githubToken || !githubUsername || !vercelToken || !supabaseToken) {
    console.error('\n❌ All three tokens and your GitHub username are required.');
    console.error('   See TOKENS_NEEDED.md for instructions on generating each one.\n');
    process.exit(1);
  }

  // ── Step 3: GitHub setup ──────────────────────────────────────────────────
  step(3, 6, 'Setting up GitHub repository...');
  let githubResult = { repoUrl: '', cloneUrl: '', success: false };
  try {
    const { setupGitHubRepo } = await import('./github-setup.js');
    githubResult = await setupGitHubRepo({
      githubToken,
      username: githubUsername,
      secrets: {
        VERCEL_TOKEN: vercelToken,
        SUPABASE_TOKEN: supabaseToken,
      },
    });
  } catch (err) {
    console.error(`  ❌ GitHub setup failed: ${err.message}`);
    console.error('  The rest of setup will continue — fix GitHub manually if needed.');
  }

  // ── Step 4: Supabase setup ────────────────────────────────────────────────
  step(4, 6, 'Initializing Supabase database...');
  let supabaseResult = { projectUrl: '', anonKey: '', serviceRoleKey: '', success: false };
  try {
    const { initSupabase } = await import('./supabase-init.js');
    supabaseResult = await initSupabase({ supabaseToken });
  } catch (err) {
    console.error(`  ❌ Supabase setup failed: ${err.message}`);
    console.error('  You can set up Supabase manually at https://supabase.com/dashboard');
  }

  // ── Step 5: Vercel deployment ─────────────────────────────────────────────
  step(5, 6, 'Deploying to Vercel...');
  let vercelResult = { deployUrl: '', projectId: '', success: false };
  try {
    const { deployToVercel } = await import('./vercel-deploy.js');
    vercelResult = await deployToVercel({
      vercelToken,
      githubUsername,
      envVars: {
        SUPABASE_URL: supabaseResult.projectUrl,
        SUPABASE_ANON_KEY: supabaseResult.anonKey,
      },
    });
  } catch (err) {
    console.error(`  ❌ Vercel deployment failed: ${err.message}`);
    console.error('  You can deploy manually — see DEPLOYMENT_GUIDE.md');
  }

  // ── Step 6: Generate .env ─────────────────────────────────────────────────
  step(6, 6, 'Generating .env file...');
  const { generateEnvFile } = await import('./env-generator.js');
  generateEnvFile({
    GITHUB_TOKEN: githubToken,
    GITHUB_USERNAME: githubUsername,
    GITHUB_REPO_NAME: 'omni-ai',
    VERCEL_TOKEN: vercelToken,
    VERCEL_PROJECT_ID: vercelResult.projectId || '',
    SUPABASE_TOKEN: supabaseToken,
    SUPABASE_URL: supabaseResult.projectUrl || '',
    SUPABASE_ANON_KEY: supabaseResult.anonKey || '',
    SUPABASE_SERVICE_ROLE_KEY: supabaseResult.serviceRoleKey || '',
  });

  // ── Final Summary ─────────────────────────────────────────────────────────
  header('Setup Complete! Here\'s what happened:');

  console.log(`
✅ GitHub Repository:    ${githubResult.repoUrl || 'check manually'}
✅ Vercel Live URL:      ${vercelResult.deployUrl || 'check vercel.com/dashboard'}
✅ Supabase Project:     ${supabaseResult.projectUrl || 'check supabase.com/dashboard'}
✅ .env file:            ${path.join(ROOT, '.env')}

── Next Steps (40 minutes) ───────────────────────────────────────
1. Add AI keys to your .env file:
     OPENAI_API_KEY    → https://platform.openai.com/api-keys
     GEMINI_API_KEY    → https://aistudio.google.com/app/apikey
     PERPLEXITY_API_KEY → https://www.perplexity.ai/settings/api

2. Follow SETUP_CHECKLIST.md for the remaining manual steps.

3. Verify everything with:  npm run verify

── Resources ─────────────────────────────────────────────────────
  TOKENS_NEEDED.md    — How to generate every API key
  SETUP_CHECKLIST.md  — Full phase-by-phase checklist
  DEPLOYMENT_GUIDE.md — CI/CD configuration
  MANUAL_STEPS.md     — Non-automated setup (email, finance, Siri)
`);
}

main().catch((err) => {
  console.error('\n❌ Setup failed unexpectedly:', err.message);
  console.error(err.stack);
  process.exit(1);
});