#!/usr/bin/env node
/**
 * OmniAI v4 — Supabase Database Initialization
 *
 * Creates a Supabase project, waits for it to be ready,
 * applies the database schema, and returns the project credentials.
 *
 * Returns: { projectUrl, anonKey, serviceRoleKey, success }
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUPABASE_API = 'https://api.supabase.com';

/**
 * Create a Supabase project and run the database schema.
 *
 * @param {object} config
 * @param {string} config.supabaseToken  - Supabase management API token
 * @param {string} config.projectName    - Project name (default: 'omni-ai')
 * @param {string} config.orgId          - Supabase organization ID
 * @param {string} config.region         - AWS region (default: 'us-east-1')
 * @param {string} [config.schemaPath]   - Path to .sql schema file
 * @returns {Promise<{projectUrl: string, anonKey: string, serviceRoleKey: string, success: boolean}>}
 */
export async function initSupabase({
  supabaseToken,
  projectName = 'omni-ai',
  orgId,
  region = 'us-east-1',
  schemaPath,
}) {
  const headers = {
    Authorization: `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json',
  };

  console.log(`\n🗄️  Setting up Supabase project: ${projectName}`);

  // ── 1. Get organization ID if not provided ────────────────────────────────
  if (!orgId) {
    const orgsRes = await fetch(`${SUPABASE_API}/v1/organizations`, { headers });
    if (!orgsRes.ok) {
      throw new Error(`Could not fetch organizations: ${orgsRes.statusText}`);
    }
    const orgs = await orgsRes.json();
    if (!orgs.length) {
      throw new Error('No Supabase organizations found. Please create one at https://supabase.com/dashboard');
    }
    orgId = orgs[0].id;
    console.log(`  ℹ️  Using organization: ${orgs[0].name} (${orgId})`);
  }

  // ── 2. Create the project ─────────────────────────────────────────────────
  let project;
  const dbPassword = generatePassword();

  try {
    const res = await fetch(`${SUPABASE_API}/v1/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: projectName,
        organization_id: orgId,
        region,
        plan: 'free',
        db_pass: dbPassword,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      // Check if project already exists
      if (body.message?.includes('already exists') || res.status === 422) {
        console.log('  ℹ️  Project may already exist — searching for it...');
        project = await findExistingProject(projectName, orgId, headers);
      } else {
        throw new Error(`Supabase API error (${res.status}): ${body.message || JSON.stringify(body)}`);
      }
    } else {
      project = await res.json();
      console.log(`  ✅ Project created: ${project.id}`);
    }
  } catch (err) {
    if (err.message.includes('already exists')) {
      project = await findExistingProject(projectName, orgId, headers);
    } else {
      throw err;
    }
  }

  // ── 3. Wait for project to be ready ───────────────────────────────────────
  console.log('  ⏳ Waiting for database to initialize (this takes 1-2 minutes)...');
  await waitForProject(project.id, headers);

  // ── 4. Retrieve API keys ──────────────────────────────────────────────────
  const keysRes = await fetch(`${SUPABASE_API}/v1/projects/${project.id}/api-keys`, { headers });
  if (!keysRes.ok) {
    throw new Error(`Could not retrieve API keys: ${keysRes.statusText}`);
  }
  const keys = await keysRes.json();

  const anonKey = keys.find((k) => k.name === 'anon')?.api_key || '';
  const serviceRoleKey = keys.find((k) => k.name === 'service_role')?.api_key || '';
  const projectUrl = `https://${project.id}.supabase.co`;

  console.log(`  ✅ Project URL: ${projectUrl}`);

  // ── 5. Apply schema ────────────────────────────────────────────────────────
  const resolvedSchemaPath =
    schemaPath || path.join(__dirname, '..', 'supabase-schema.sql');

  if (fs.existsSync(resolvedSchemaPath)) {
    console.log('  📋 Applying database schema...');
    const sql = fs.readFileSync(resolvedSchemaPath, 'utf-8');

    try {
      const sqlRes = await fetch(`${SUPABASE_API}/v1/projects/${project.id}/database/query`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: sql }),
      });

      if (sqlRes.ok) {
        console.log('  ✅ Schema applied successfully');
      } else {
        const body = await sqlRes.json();
        console.warn(`  ⚠️  Schema may not have applied cleanly: ${body.message || sqlRes.statusText}`);
        console.log('  ℹ️  You can apply the schema manually via the Supabase SQL Editor.');
      }
    } catch (err) {
      console.warn(`  ⚠️  Could not apply schema automatically: ${err.message}`);
      console.log('  ℹ️  Apply supabase-schema.sql manually at:');
      console.log(`       ${projectUrl}/project/${project.id}/sql`);
    }
  } else {
    console.log('  ℹ️  No schema file found — skipping schema application.');
    console.log('       Add supabase-schema.sql to the root to auto-apply it.');
  }

  return {
    projectUrl,
    anonKey,
    serviceRoleKey,
    projectId: project.id,
    success: true,
  };
}

/**
 * Poll Supabase API until the project status is ACTIVE_HEALTHY.
 *
 * @param {string} projectId - Supabase project ID
 * @param {object} headers   - Authorization headers
 * @param {number} [timeout=300000] - Timeout in ms
 */
async function waitForProject(projectId, headers, timeout = 300_000) {
  const start = Date.now();
  const interval = 10_000;

  while (Date.now() - start < timeout) {
    await new Promise((r) => setTimeout(r, interval));

    try {
      const res = await fetch(`${SUPABASE_API}/v1/projects/${projectId}`, { headers });
      const data = await res.json();

      if (data.status === 'ACTIVE_HEALTHY') {
        console.log('  ✅ Database is ready!');
        return;
      }

      process.stdout.write('.');
    } catch {
      // Ignore transient errors
    }
  }

  console.log('\n  ⚠️  Project initialization timed out — it may still be starting up.');
}

/**
 * Find an existing project by name within an organization.
 *
 * @param {string} name   - Project name
 * @param {string} orgId  - Organization ID
 * @param {object} headers
 * @returns {Promise<object>} Project object
 */
async function findExistingProject(name, orgId, headers) {
  const res = await fetch(`${SUPABASE_API}/v1/projects?organization_id=${orgId}`, { headers });
  const projects = await res.json();
  const project = projects.find((p) => p.name === name);
  if (!project) {
    throw new Error(`Project "${name}" not found. Please create it manually at https://supabase.com/dashboard`);
  }
  console.log(`  ℹ️  Found existing project: ${project.id}`);
  return project;
}

/**
 * Generate a cryptographically secure random database password.
 *
 * @returns {string} Random 24-character password
 */
function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const bytes = randomBytes(24);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

// ── CLI entry point ──────────────────────────────────────────────────────────
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const supabaseToken = process.env.SUPABASE_TOKEN;

  if (!supabaseToken) {
    console.error('Error: SUPABASE_TOKEN must be set in your .env file.');
    process.exit(1);
  }

  initSupabase({ supabaseToken })
    .then((result) => {
      console.log('\n✅ Supabase setup complete!');
      console.log(`   Project URL:      ${result.projectUrl}`);
      console.log(`   Anon Key:         ${result.anonKey.slice(0, 20)}...`);
    })
    .catch((err) => {
      console.error('\n❌ Supabase setup failed:', err.message);
      process.exit(1);
    });
}