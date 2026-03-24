#!/usr/bin/env node
/**
 * OmniAI v4 — GitHub Setup
 * Validates the GitHub token and configures repository access.
 */

'use strict';

require('dotenv').config();

const https = require('https');

const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

function githubRequest(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'OmniAI-v4-Setup',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.end();
  });
}

async function main() {
  console.log(`\n${BOLD}OmniAI v4 — GitHub Setup${RESET}\n`);

  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.log(`  ${RED}✗${RESET} GITHUB_TOKEN is not set`);
    console.log(`  Get a token at: https://github.com/settings/tokens`);
    console.log(`  Required scopes: repo, read:user, user:email\n`);
    process.exit(1);
  }

  if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
    console.log(`  ${YELLOW}⚠${RESET}  Token format looks unusual (expected ghp_ or github_pat_ prefix)`);
  }

  console.log('  Validating GitHub token...');

  try {
    // Validate token by fetching authenticated user
    const { status, body } = await githubRequest('/user', token);

    if (status === 200 && body.login) {
      console.log(`  ${GREEN}✓${RESET} Authenticated as: ${BOLD}${body.login}${RESET}`);
      console.log(`  ${GREEN}✓${RESET} Account type: ${body.type}`);
      if (body.name) {
        console.log(`  ${GREEN}✓${RESET} Display name: ${body.name}`);
      }

      // Check repositories
      const reposRes = await githubRequest('/user/repos?per_page=5&sort=updated', token);
      if (reposRes.status === 200 && Array.isArray(reposRes.body)) {
        console.log(`  ${GREEN}✓${RESET} Repository access confirmed (${reposRes.body.length} recent repos visible)`);
        if (reposRes.body.length > 0) {
          console.log(`  ${BOLD}Recent repositories:${RESET}`);
          reposRes.body.slice(0, 3).forEach(repo => {
            console.log(`    - ${repo.full_name}`);
          });
        }
      }

      console.log(`\n  ${GREEN}${BOLD}GitHub integration is ready!${RESET}\n`);
    } else if (status === 401) {
      console.log(`  ${RED}✗${RESET} Token is invalid or expired`);
      console.log(`  Generate a new token at: https://github.com/settings/tokens`);
      console.log(`  Then run: ./install.sh --update-token GITHUB`);
      process.exit(1);
    } else {
      console.log(`  ${YELLOW}⚠${RESET}  Unexpected response (HTTP ${status})`);
      console.log(`  ${JSON.stringify(body, null, 2)}`);
      process.exit(1);
    }
  } catch (err) {
    console.log(`  ${RED}✗${RESET} Connection failed: ${err.message}`);
    console.log(`  Check your internet connection and try again.`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`\n${RED}Unexpected error: ${err.message}${RESET}`);
  process.exit(1);
});
