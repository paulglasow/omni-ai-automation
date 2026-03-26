/**
 * api/usage.js
 *
 * Cost aggregation and analytics endpoints.
 *
 * Routes:
 *   GET  /api/usage/:workspaceId/summary  — per-model cost breakdown (filterable by date range)
 *   POST /api/usage/:workspaceId/alerts   — set a budget alert threshold
 *   GET  /api/usage/personal              — personal usage summary (no workspace)
 */

import { getSupabaseAdmin, extractJwt } from '../lib/supabase/server.js';
import { createClient } from '@supabase/supabase-js';

async function resolveUser(authHeader) {
  const jwt = extractJwt(authHeader);
  const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false },
    }
  );
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');
  return user;
}

async function assertWorkspaceAccess(db, workspaceId, userId) {
  const { data } = await db
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();

  if (!data) {
    // Check if owner
    const { data: ws } = await db
      .from('workspaces')
      .select('owner_id')
      .eq('id', workspaceId)
      .single();
    if (!ws || ws.owner_id !== userId) throw new Error('Forbidden');
  }
  return data?.role ?? 'admin';
}

// ---------------------------------------------------------------------------
// GET /api/usage/:workspaceId/summary
// ---------------------------------------------------------------------------

async function getWorkspaceSummary(workspaceId, userId, { from, to } = {}) {
  const db = getSupabaseAdmin();
  await assertWorkspaceAccess(db, workspaceId, userId);

  // Aggregate per model in the database to avoid fetching all rows
  let query = db
    .from('usage_logs')
    .select('model, routed_to, input_tokens, output_tokens, cost_usd')
    .eq('workspace_id', workspaceId);

  if (from) query = query.gte('created_at', from);
  if (to)   query = query.lte('created_at', to);

  const { data, error } = await query;
  if (error) throw error;

  return buildSummary(data ?? []);
}

// ---------------------------------------------------------------------------
// GET /api/usage/personal
// ---------------------------------------------------------------------------

async function getPersonalSummary(userId, { from, to } = {}) {
  const db = getSupabaseAdmin();

  let query = db
    .from('usage_logs')
    .select('model, routed_to, input_tokens, output_tokens, cost_usd, created_at')
    .eq('user_id', userId)
    .is('workspace_id', null);

  if (from) query = query.gte('created_at', from);
  if (to)   query = query.lte('created_at', to);

  const { data, error } = await query;
  if (error) throw error;

  return buildSummary(data ?? []);
}

function buildSummary(rows) {
  const byModel = {};
  let totalCost = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalRequests = rows.length;

  for (const row of rows) {
    const key = row.routed_to ?? row.model ?? 'unknown';
    if (!byModel[key]) {
      byModel[key] = { requests: 0, inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0 };
    }
    byModel[key].requests += 1;
    byModel[key].inputTokens += row.input_tokens ?? 0;
    byModel[key].outputTokens += row.output_tokens ?? 0;
    byModel[key].estimatedCostUsd += Number(row.cost_usd ?? 0);

    totalCost += Number(row.cost_usd ?? 0);
    totalInputTokens += row.input_tokens ?? 0;
    totalOutputTokens += row.output_tokens ?? 0;
  }

  // Round cost values
  for (const key of Object.keys(byModel)) {
    byModel[key].estimatedCostUsd = Number(byModel[key].estimatedCostUsd.toFixed(8));
  }

  return {
    totalRequests,
    totalInputTokens,
    totalOutputTokens,
    totalEstimatedCostUsd: Number(totalCost.toFixed(8)),
    byModel,
  };
}

// ---------------------------------------------------------------------------
// POST /api/usage/:workspaceId/alerts
// ---------------------------------------------------------------------------

async function setAlert(workspaceId, userId, { thresholdUsd, notifyEmail }) {
  if (!thresholdUsd || Number(thresholdUsd) <= 0) {
    throw new Error('thresholdUsd must be a positive number');
  }
  const db = getSupabaseAdmin();
  await assertWorkspaceAccess(db, workspaceId, userId);

  const { data, error } = await db
    .from('budget_alerts')
    .upsert({
      workspace_id: workspaceId,
      user_id: userId,
      threshold_usd: Number(thresholdUsd),
      notify_email: notifyEmail ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  let user;
  try {
    user = await resolveUser(req.headers.authorization);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { method, query, body } = req;
  const { workspaceId, action } = query ?? {};
  const { from, to } = req.query ?? {};

  try {
    // GET /api/usage/personal
    if (method === 'GET' && workspaceId === 'personal') {
      const summary = await getPersonalSummary(user.id, { from, to });
      return res.status(200).json(summary);
    }

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId required' });
    }

    // GET /api/usage/:workspaceId/summary
    if (method === 'GET' && action === 'summary') {
      const summary = await getWorkspaceSummary(workspaceId, user.id, { from, to });
      return res.status(200).json(summary);
    }

    // POST /api/usage/:workspaceId/alerts
    if (method === 'POST' && action === 'alerts') {
      const alert = await setAlert(workspaceId, user.id, body ?? {});
      return res.status(201).json(alert);
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    const status = err.message === 'Forbidden' ? 403
      : err.message === 'Unauthorized' ? 401
      : 500;
    return res.status(status).json({ error: err.message });
  }
}
