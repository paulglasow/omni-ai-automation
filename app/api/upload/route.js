import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase/server.js';

export const maxDuration = 30;

const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'text/csv',
  'text/markdown',
  'image/png',
  'image/jpeg',
  'image/gif',
  'application/json',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_SIZE = 25 * 1024 * 1024; // 25MB

/**
 * POST /api/upload — upload a file to Supabase Storage
 */
export async function POST(request) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Supabase not configured. Add Supabase keys to .env.local' }, { status: 503 });

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const workspaceId = formData.get('workspaceId') || null;

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(js|ts|py|md|txt|csv|json)$/i)) {
      return NextResponse.json({
        error: `File type not allowed: ${file.type}. Supported: PDF, text, images, Word, Excel, code files.`
      }, { status: 400 });
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 25MB.' }, { status: 400 });
    }

    // Upload to Supabase Storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const storagePath = `uploads/${Date.now()}-${file.name}`;

    const { error: uploadError } = await db.storage
      .from('uploads')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[upload] Storage error:', uploadError);
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // Extract text from files
    let extractedText = null;
    if (file.type === 'application/pdf') {
      // PDF extraction
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
        if (extractedText.length > 50000) {
          extractedText = extractedText.slice(0, 50000) + '\n\n[...truncated at 50,000 characters]';
        }
      } catch (err) {
        console.error('[upload] PDF parse error:', err);
        // Non-fatal — file still uploads, just can't extract text
      }
    } else if (file.type.startsWith('text/') || file.name.match(/\.(js|ts|py|md|txt|csv|json)$/i)) {
      extractedText = new TextDecoder().decode(buffer);
      if (extractedText.length > 50000) {
        extractedText = extractedText.slice(0, 50000) + '\n\n[...truncated at 50,000 characters]';
      }
    }

    // Save file record to database
    const { data: fileRecord, error: dbError } = await db
      .from('files')
      .insert({
        name: file.name,
        type: file.type,
        size: file.size,
        storage_path: storagePath,
        extracted_text: extractedText,
        workspace_id: workspaceId,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[upload] DB error:', dbError);
      return NextResponse.json({ error: `Failed to save file record: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      file: {
        id: fileRecord.id,
        name: fileRecord.name,
        type: fileRecord.type,
        size: fileRecord.size,
        hasText: !!extractedText,
        createdAt: fileRecord.created_at,
      },
    });
  } catch (err) {
    console.error('[upload] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
