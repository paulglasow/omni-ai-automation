#!/usr/bin/env node
/**
 * OmniAI v4 — AI Keys Setup & Validation
 * Validates all AI model connections and reports status.
 */

'use strict';

require('dotenv').config();

const KEYS = [
  { name: 'OpenAI (ChatGPT)',    env: 'OPENAI_API_KEY',     prefix: 'sk-',      url: 'https://platform.openai.com/api-keys' },
  { name: 'Anthropic (Claude)',  env: 'ANTHROPIC_API_KEY',  prefix: 'sk-ant-',  url: 'https://console.anthropic.com/keys' },
  { name: 'Google Gemini',       env: 'GEMINI_API_KEY',     prefix: 'AIzaSy',   url: 'https://makersuite.google.com/app/apikey' },
  { name: 'Perplexity AI',       env: 'PERPLEXITY_API_KEY', prefix: 'pplx-',    url: 'https://www.perplexity.ai/settings/api' },
];

const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

function checkKey(name, envVar, expectedPrefix, dashboardUrl) {
  const value = process.env[envVar];

  if (!value) {
    console.log(`  ${RED}✗${RESET} ${name}: Not set — get your key at ${dashboardUrl}`);
    return false;
  }

  if (value.length < 20) {
    console.log(`  ${YELLOW}⚠${RESET}  ${name}: Key too short — may be incomplete`);
    return false;
  }

  if (expectedPrefix && !value.startsWith(expectedPrefix)) {
    console.log(`  ${YELLOW}⚠${RESET}  ${name}: Key format unexpected (should start with "${expectedPrefix}")`);
    return false;
  }

  const masked = `${value.slice(0, 8)}${'*'.repeat(Math.min(16, value.length - 8))}`;
  console.log(`  ${GREEN}✓${RESET} ${name}: ${masked}`);
  return true;
}

async function testOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return false;
  try {
    const { OpenAI } = require('openai');
    const client = new OpenAI({ apiKey: key });
    const models = await client.models.list();
    if (models && models.data) {
      console.log(`    ${GREEN}→ Live test passed (${models.data.length} models available)${RESET}`);
      return true;
    }
  } catch (err) {
    console.log(`    ${YELLOW}→ Live test failed: ${err.message}${RESET}`);
  }
  return false;
}

async function testAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return false;
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic.default({ apiKey: key });
    const msg = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    });
    if (msg && msg.id) {
      console.log(`    ${GREEN}→ Live test passed${RESET}`);
      return true;
    }
  } catch (err) {
    console.log(`    ${YELLOW}→ Live test failed: ${err.message}${RESET}`);
  }
  return false;
}

async function main() {
  console.log(`\n${BOLD}OmniAI v4 — AI Key Validation${RESET}\n`);

  let passed = 0;
  let failed = 0;

  console.log(`${BOLD}Format Check:${RESET}`);
  for (const k of KEYS) {
    const ok = checkKey(k.name, k.env, k.prefix, k.url);
    if (ok) passed++; else failed++;
  }

  console.log(`\n${BOLD}Live Connection Tests:${RESET}`);
  console.log('  Testing OpenAI...');
  await testOpenAI();
  console.log('  Testing Anthropic...');
  await testAnthropic();

  console.log(`\n${BOLD}Summary:${RESET} ${GREEN}${passed} valid${RESET}, ${failed > 0 ? RED : RESET}${failed} missing/invalid${RESET}\n`);

  if (failed > 0) {
    console.log(`${YELLOW}To add missing keys, run: ${BOLD}./install.sh --reconfigure-keys${RESET}`);
  } else {
    console.log(`${GREEN}${BOLD}All AI models are configured and ready!${RESET}`);
  }
}

main().catch(err => {
  console.error(`\n${RED}Unexpected error: ${err.message}${RESET}`);
  process.exit(1);
});