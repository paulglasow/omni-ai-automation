#!/usr/bin/env node
/**
 * OmniAI v4 — AI Keys Setup & Validation
 * Validates all AI model connections and reports status.
 *
 * Required keys: OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY
 * Optional key:  PERPLEXITY_API_KEY (enables real-time research features)
 */

'use strict';

require('dotenv').config();

const KEYS = [
  {
    name:     'OpenAI (ChatGPT)',
    env:      'OPENAI_API_KEY',
    prefix:   'sk-',
    url:      'https://platform.openai.com/api-keys',
    optional: false,
  },
  {
    name:     'Anthropic (Claude)',
    env:      'ANTHROPIC_API_KEY',
    prefix:   'sk-ant-',
    url:      'https://console.anthropic.com/keys',
    optional: false,
  },
  {
    name:     'Google Gemini',
    env:      'GEMINI_API_KEY',
    prefix:   'AIzaSy',
    url:      'https://makersuite.google.com/app/apikey',
    optional: false,
  },
  {
    name:     'Perplexity AI',
    env:      'PERPLEXITY_API_KEY',
    prefix:   'pplx-',
    url:      'https://www.perplexity.ai/settings/api',
    optional: true,
  },
];

const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

function checkKey(name, envVar, expectedPrefix, dashboardUrl, optional) {
  const value = process.env[envVar];
  const label = optional ? `${name} ${YELLOW}(optional)${RESET}` : name;

  if (!value) {
    if (optional) {
      console.log(`  ${YELLOW}⚠${RESET}  ${label}: Not set — ${dashboardUrl}`);
    } else {
      console.log(`  ${RED}✗${RESET} ${label}: Not set — get your key at ${dashboardUrl}`);
    }
    return false;
  }

  if (value.length < 20) {
    console.log(`  ${YELLOW}⚠${RESET}  ${label}: Key too short — may be incomplete`);
    return false;
  }

  if (expectedPrefix && !value.startsWith(expectedPrefix)) {
    console.log(`  ${YELLOW}⚠${RESET}  ${label}: Key format unexpected (should start with "${expectedPrefix}")`);
    return false;
  }

  const masked = `${value.slice(0, 8)}${'*'.repeat(Math.min(16, value.length - 8))}`;
  console.log(`  ${GREEN}✓${RESET} ${label}: ${masked}`);
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

async function testGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return false;
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Hi');
    if (result && result.response) {
      console.log(`    ${GREEN}→ Live test passed${RESET}`);
      return true;
    }
  } catch (err) {
    console.log(`    ${YELLOW}→ Live test failed: ${err.message}${RESET}`);
  }
  return false;
}

async function testPerplexity() {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return false;
  try {
    const { OpenAI } = require('openai');
    // Perplexity uses an OpenAI-compatible endpoint — no extra package needed.
    const client = new OpenAI({
      apiKey:  key,
      baseURL: 'https://api.perplexity.ai',
    });
    const response = await client.chat.completions.create({
      model:      'sonar-pro',
      messages:   [{ role: 'user', content: 'Hi' }],
      max_tokens: 5,
    });
    if (response && response.choices) {
      console.log(`    ${GREEN}→ Live test passed (sonar-pro model, web-search-augmented)${RESET}`);
      return true;
    }
  } catch (err) {
    console.log(`    ${YELLOW}→ Live test failed: ${err.message}${RESET}`);
  }
  return false;
}

async function main() {
  console.log(`\n${BOLD}OmniAI v4 — AI Key Validation${RESET}\n`);

  let requiredPassed = 0;
  let requiredFailed = 0;
  let optionalMissing = [];

  console.log(`${BOLD}Format Check:${RESET}`);
  for (const k of KEYS) {
    const ok = checkKey(k.name, k.env, k.prefix, k.url, k.optional);
    if (k.optional) {
      if (!ok) optionalMissing.push(k.name);
    } else {
      if (ok) requiredPassed++; else requiredFailed++;
    }
  }

  console.log(`\n${BOLD}Live Connection Tests:${RESET}`);
  console.log('  Testing OpenAI...');
  await testOpenAI();
  console.log('  Testing Anthropic...');
  await testAnthropic();
  console.log('  Testing Google Gemini...');
  await testGemini();
  console.log('  Testing Perplexity AI (optional)...');
  await testPerplexity();

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n${BOLD}Summary:${RESET}`);
  console.log(
    `  Required keys: ${GREEN}${requiredPassed} valid${RESET}` +
    (requiredFailed > 0 ? `, ${RED}${requiredFailed} missing/invalid${RESET}` : '')
  );

  if (optionalMissing.length > 0) {
    console.log(
      `  ${YELLOW}⚠  Perplexity AI key missing: real-time research features will be` +
      ` disabled, but core OmniAI will still work.${RESET}`
    );
    console.log(`     Get your key (free tier available): https://www.perplexity.ai/settings/api`);
  }

  console.log('');

  if (requiredFailed > 0) {
    console.log(`${YELLOW}To add missing keys, run: ${BOLD}./install.sh --reconfigure-keys${RESET}`);
  } else if (optionalMissing.length > 0) {
    console.log(
      `${GREEN}${BOLD}Core OmniAI is ready!${RESET} ` +
      `${YELLOW}Add PERPLEXITY_API_KEY to unlock real-time research (Assist → Perplexity).${RESET}`
    );
  } else {
    console.log(`${GREEN}${BOLD}All AI models are configured and ready!${RESET}`);
  }
}

main().catch(err => {
  console.error(`\n${RED}Unexpected error: ${err.message}${RESET}`);
  process.exit(1);
});
