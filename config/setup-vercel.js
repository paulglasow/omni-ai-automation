#!/usr/bin/env node
/**
 * OmniAI v4 — Vercel Setup
 * Deploys the OmniAI interface to Vercel and stores the live URL.
 */

'use strict';

require('dotenv').config();

const https  = require('https');
const fs     = require('fs');
const path   = require('path');

const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

function vercelRequest(method, apiPath, token, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;

    const options = {
      hostname: 'api.vercel.com',
      path: apiPath,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let resp = '';
      res.on('data', (chunk) => { resp += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resp) });
        } catch {
          resolve({ status: res.statusCode, body: resp });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Vercel request timed out'));
    });

    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log(`\n${BOLD}OmniAI v4 — Vercel Setup${RESET}\n`);

  const token = process.env.VERCEL_TOKEN;

  if (!token) {
    console.log(`  ${RED}✗${RESET} VERCEL_TOKEN is not set`);
    console.log(`  Get a token at: https://vercel.com/account/tokens`);
    console.log(`  Then run: ./install.sh --update-token VERCEL\n`);
    process.exit(1);
  }

  console.log('  Validating Vercel token...');

  try {
    // Validate token
    const { status, body } = await vercelRequest('GET', '/v2/user', token);

    if (status === 200 && body.user) {
      console.log(`  ${GREEN}✓${RESET} Authenticated as: ${BOLD}${body.user.username || body.user.email}${RESET}`);
    } else if (status === 401 || status === 403) {
      console.log(`  ${RED}✗${RESET} Vercel token is invalid or expired (HTTP ${status})`);
      console.log(`  Generate a new token at: https://vercel.com/account/tokens`);
      process.exit(1);
    } else {
      console.log(`  ${YELLOW}⚠${RESET}  Unexpected Vercel response (HTTP ${status})`);
    }

    // List existing projects
    const projectsRes = await vercelRequest('GET', '/v9/projects?limit=5', token);
    if (projectsRes.status === 200 && projectsRes.body.projects) {
      const projects = projectsRes.body.projects;
      const existing = projects.find(p => p.name === 'omni-ai-v4');
      if (existing) {
        const url = `https://${existing.name}.vercel.app`;
        console.log(`  ${GREEN}✓${RESET} Project already exists: ${BOLD}${url}${RESET}`);
        fs.writeFileSync('.deploy-url', url);
        console.log(`\n  ${GREEN}${BOLD}Vercel is configured!${RESET}\n`);
        return;
      }
    }

    // Create project via Vercel API
    console.log('  Creating Vercel project...');
    const createRes = await vercelRequest('POST', '/v9/projects', token, {
      name: 'omni-ai-v4',
      framework: 'nextjs',
      environmentVariables: buildEnvVars(),
    });

    if (createRes.status === 200 || createRes.status === 201) {
      const url = `https://omni-ai-v4.vercel.app`;
      console.log(`  ${GREEN}✓${RESET} Project created: ${BOLD}${url}${RESET}`);
      fs.writeFileSync('.deploy-url', url);
      console.log(`\n  ${GREEN}${BOLD}Vercel project is ready!${RESET}`);
      console.log(`  To deploy your code, push to GitHub and connect the repo in:`);
      console.log(`  https://vercel.com/new\n`);
    } else if (createRes.status === 409) {
      console.log(`  ${YELLOW}⚠${RESET}  Project name already taken — using existing project`);
      const url = `https://omni-ai-v4.vercel.app`;
      fs.writeFileSync('.deploy-url', url);
    } else {
      console.log(`  ${YELLOW}⚠${RESET}  Could not create project (HTTP ${createRes.status})`);
      console.log(`  Create it manually at: https://vercel.com/new`);
    }

  } catch (err) {
    console.log(`  ${RED}✗${RESET} Connection failed: ${err.message}`);
    console.log(`  Check your internet connection and try again.`);
    process.exit(1);
  }
}

function buildEnvVars() {
  const vars = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY',
                 'PERPLEXITY_API_KEY', 'GITHUB_TOKEN', 'SUPABASE_URL',
                 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
                 'EMPOWER_CLIENT_ID', 'EMPOWER_CLIENT_SECRET', 'MONARCH_TOKEN'];

  return vars
    .filter(v => process.env[v])
    .map(v => ({
      key: v,
      value: process.env[v],
      type: 'encrypted',
      target: ['production', 'preview'],
    }));
}

main().catch(err => {
  console.error(`\n${RED}Unexpected error: ${err.message}${RESET}`);
  process.exit(1);
});