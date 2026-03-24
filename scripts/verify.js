#!/usr/bin/env node
/**
 * OmniAI v4 — Post-Install Verification Script
 * Checks that all components are installed and configured correctly.
 */

'use strict';

require('dotenv').config();
const fs   = require('fs');
const path = require('path');

const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

let passed = 0;
let warned  = 0;
let failed  = 0;

function check(label, fn) {
  try {
    const result = fn();
    if (result === true) {
      console.log(`  ${GREEN}✓${RESET} ${label}`);
      passed++;
    } else if (result === 'warn') {
      console.log(`  ${YELLOW}⚠${RESET}  ${label}`);
      warned++;
    } else {
      console.log(`  ${RED}✗${RESET} ${label}`);
      failed++;
    }
  } catch (err) {
    console.log(`  ${RED}✗${RESET} ${label} — ${err.message}`);
    failed++;
  }
}

function envKey(name, requiredPrefix) {
  const val = process.env[name];
  if (!val) return false;
  if (requiredPrefix && !val.startsWith(requiredPrefix)) return 'warn';
  if (val.length < 10) return 'warn';
  return true;
}

function fileExists(relPath) {
  return fs.existsSync(path.join(__dirname, '..', relPath));
}

console.log(`\n${BOLD}OmniAI v4 — System Verification${RESET}\n`);

// File structure
console.log(`${BOLD}Project Files:${RESET}`);
check('IMPLEMENTATION_GUIDE.md exists',   () => fileExists('IMPLEMENTATION_GUIDE.md') || false);
check('install.sh exists',                () => fileExists('install.sh') || false);
check('README.md updated',                () => {
  const content = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
  return content.includes('OmniAI v4') ? true : false;
});
check('.env exists',                      () => fileExists('.env') ? true : 'warn');
check('templates/.env.template exists',   () => fileExists('templates/.env.template') || false);
check('templates/omni-v4.jsx exists',     () => fileExists('templates/omni-v4.jsx') || false);
check('templates/supabase-schema.sql exists', () => fileExists('templates/supabase-schema.sql') || false);
check('templates/electron-main.js exists', () => fileExists('templates/electron-main.js') || false);
check('config/setup-ai-keys.js exists',   () => fileExists('config/setup-ai-keys.js') || false);
check('config/setup-github.js exists',    () => fileExists('config/setup-github.js') || false);
check('config/setup-vercel.js exists',    () => fileExists('config/setup-vercel.js') || false);
check('config/setup-supabase.js exists',  () => fileExists('config/setup-supabase.js') || false);
check('config/setup-siri.js exists',      () => fileExists('config/setup-siri.js') || false);
check('guides/financial-setup.md exists', () => fileExists('guides/financial-setup.md') || false);
check('guides/work-integration.md exists',() => fileExists('guides/work-integration.md') || false);
check('guides/hobby-automation.md exists',() => fileExists('guides/hobby-automation.md') || false);
check('guides/collaborator-guide.md exists', () => fileExists('guides/collaborator-guide.md') || false);
check('node_modules installed',           () => fileExists('node_modules') ? true : 'warn');

// Environment variables
console.log(`\n${BOLD}API Keys:${RESET}`);
check('OPENAI_API_KEY set',      () => envKey('OPENAI_API_KEY', 'sk-'));
check('ANTHROPIC_API_KEY set',   () => envKey('ANTHROPIC_API_KEY', 'sk-ant-'));
check('GEMINI_API_KEY set',      () => envKey('GEMINI_API_KEY', 'AIzaSy'));
check('PERPLEXITY_API_KEY set',  () => envKey('PERPLEXITY_API_KEY', 'pplx-'));
check('GITHUB_TOKEN set',        () => envKey('GITHUB_TOKEN', 'ghp_') || envKey('GITHUB_TOKEN', 'github_pat_'));

console.log(`\n${BOLD}Optional Integrations:${RESET}`);
check('SUPABASE_URL set',              () => process.env.SUPABASE_URL ? true : 'warn');
check('SUPABASE_ANON_KEY set',         () => process.env.SUPABASE_ANON_KEY ? true : 'warn');
check('VERCEL_TOKEN set',              () => process.env.VERCEL_TOKEN ? true : 'warn');
check('EMPOWER_CLIENT_ID set',         () => process.env.EMPOWER_CLIENT_ID ? true : 'warn');
check('MONARCH_TOKEN set',             () => process.env.MONARCH_TOKEN ? true : 'warn');

// Summary
console.log(`\n${'─'.repeat(50)}`);
console.log(`${BOLD}Results:${RESET}`);
console.log(`  ${GREEN}✓${RESET} Passed:  ${passed}`);
console.log(`  ${YELLOW}⚠${RESET}  Warned:  ${warned} (optional or fixable)`);
console.log(`  ${RED}✗${RESET} Failed:  ${failed}`);

if (failed === 0) {
  console.log(`\n${GREEN}${BOLD}✓ All required checks passed! OmniAI v4 is ready.${RESET}`);
} else {
  console.log(`\n${YELLOW}${BOLD}Some checks failed. Run ./install.sh to fix them.${RESET}`);
  console.log(`See IMPLEMENTATION_GUIDE.md → Section 14 for help.\n`);
  process.exit(1);
}

console.log('');
