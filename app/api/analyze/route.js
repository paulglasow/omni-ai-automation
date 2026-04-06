import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase/server.js';
import { route } from '../../../lib/providers/router.js';

export const maxDuration = 60;

/**
 * POST /api/analyze — analyze an uploaded file with AI
 */
export async function POST(request) {
  try {
    const { fileId, prompt, model = 'claude' } = await request.json();

    if (!fileId && !prompt) {
      return NextResponse.json({ error: 'Provide a fileId or prompt' }, { status: 400 });
    }

    let fileContent = null;
    let fileName = null;

    // If fileId provided, fetch the file's extracted text
    if (fileId) {
      const db = getSupabaseAdmin();
      if (!db) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

      const { data: file, error } = await db
        .from('files')
        .select('name, extracted_text, type')
        .eq('id', fileId)
        .single();

      if (error || !file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      if (!file.extracted_text) {
        return NextResponse.json({
          error: `Cannot analyze this file type (${file.type}). Only text-based files can be analyzed currently. PDF analysis coming soon.`
        }, { status: 400 });
      }

      fileContent = file.extracted_text;
      fileName = file.name;
    }

    // Build analysis prompt
    const analysisPrompt = fileContent
      ? `Analyze this file "${fileName}":\n\n${fileContent.slice(0, 30000)}\n\n${prompt || 'Provide a structured analysis with key findings, risks or concerns, recommendations, and questions that need answers.'}`
      : prompt;

    const messages = [{ role: 'user', content: analysisPrompt }];
    const result = await route(messages, model);

    // Save analysis to Supabase if possible
    const db = getSupabaseAdmin();
    if (db && fileId) {
      await db.from('analyses').insert({
        file_id: fileId,
        prompt: prompt || 'Full analysis',
        results: result,
      }).catch(() => {}); // best-effort
    }

    return NextResponse.json({
      analysis: result.content,
      model: result.model,
      routedTo: result.routedTo,
      usage: result.usage,
    });
  } catch (err) {
    console.error('[analyze] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
