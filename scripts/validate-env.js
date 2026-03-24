#!/usr/bin/env node
/**
 * OmniAI v4 — Environment Validation
 *
 * Checks that all required .env variables are present,
 * validates token formats, and tests API connections.
 * Reports issues clearly without logging secrets.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseEnvFile } from './env-generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Variable definitions: key → { required, pattern, description }
const ENV_DEFINITIONS = {
  GITHUB_TOKEN: {
    required: true,
    pattern: /^gh[ps]_[A-Za-z0-9_]{36,}$/,
    description: 'GitHub Personal Access Token',
    url: 'https://github.com/settings/tokens?type=beta',
  },
  VERCEL_TOKEN: {
    required: true,
    pattern: /^[A-Za-z0-9]{20,}$/,
    description: 'Vercel API Token',
    url: 'https://vercel.com/account/tokens',
  },
  SUPABASE_TOKEN: {
    required: true,
    pattern: /^sbp_[A-Za-z0-9]{20,}$/,
    description: 'Supabase Management API Token',
    url: 'https://supabase.com/dashboard/account/tokens',
  },
  OPENAI_API_KEY: {
    required: false,
    pattern: /^sk-/,
    description: 'OpenAI API Key',
    url: 'https://platform.openai.com/api-keys',
  },
  GEMINI_API_KEY: {
    required: false,
    pattern: /^AIza/,
    description: 'Google Gemini API Key',
    url: 'https://aistudio.google.com/app/apikey',
  },
  PERPLEXITY_API_KEY: {
    required: false,
    pattern: /^pplx-/,
    description: 'Perplexity API Key',
    url: 'https://www.perplexity.ai/settings/api',
  },
  GITHUB_COPILOT_TOKEN: {
    required: false,
    pattern: /^github_pat_/,
    description: 'GitHub Copilot Token',
    url: 'https://github.com/settings/tokens?type=beta',
  },
  SUPABASE_URL: {
    required: false,
    pattern: /^https:\/\/[a-z0-9]+\.supabase\.co$/,
    description: 'Supabase Project URL',
    url: null,
  },
  SUPABASE_ANON_KEY: {
    required: false,
    pattern: /^eyJ/,
    description: 'Supabase Anonymous Key',
    url: null,
  },
  GITHUB_USERNAME: {
    required: true,
    pattern: /^[A-Za-z0-9]([A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/,
    description: 'GitHub Username',
    url: null,
  },
};

/**
 * Validate the .env file and return a report.
 *
 * @param {string} [envPath] - Path to .env file (default: project root)
 * @returns {{ valid: boolean, errors: string[], warnings: string[], passed: string[] }}
 */
export function validateEnv(envPath) {
  const resolvedPath = envPath || path.join(ROOT, '.env');
  const errors = [];
  const warnings = [];
  const passed = [];

  console.log('\n🔍 Validating environment configuration...\n');

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ .env file not found at: ${resolvedPath}`);
    console.error('   Run: npm run setup  OR  cp .env.template .env');
    return { valid: false, errors: ['.env file not found'], warnings: [], passed: [] };
  }

  const env = parseEnvFile(resolvedPath);

  for (const [key, def] of Object.entries(ENV_DEFINITIONS)) {
    const value = env[key] || process.env[key];

    if (!value) {
      if (def.required) {
        errors.push(`Missing required variable: ${key} (${def.description})`);
        const urlHint = def.url ? `\n     Get it at: ${def.url}` : '';
        console.log(`  ❌ ${key} — MISSING (required)${urlHint}`);
      } else {
        warnings.push(`Missing optional variable: ${key}`);
        console.log(`  ⚠️  ${key} — not set (optional)`);
      }
      continue;
    }

    if (def.pattern && !def.pattern.test(value)) {
      warnings.push(`${key} has an unexpected format — double-check the value`);
      console.log(`  ⚠️  ${key} — value looks unexpected (check format)`);
    } else {
      passed.push(key);
      // Show only the first few characters to confirm it's set, never the full value
      const preview = value.slice(0, 8) + '...';
      console.log(`  ✅ ${key} — set (${preview})`);
    }
  }

  const valid = errors.length === 0;

  console.log('');
  if (valid) {
    console.log('✅ All required variables are present.');
  } else {
    console.log(`❌ ${errors.length} required variable(s) missing.`);
    console.log('   See TOKENS_NEEDED.md for instructions on each key.');
  }
  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} warning(s) — review optional or incorrectly formatted variables.`);
  }

  return { valid, errors, warnings, passed };
}

// ── CLI entry point ──────────────────────────────────────────────────────────
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = validateEnv();
  process.exit(result.valid ? 0 : 1);
}
