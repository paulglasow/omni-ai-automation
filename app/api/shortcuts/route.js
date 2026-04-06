import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase/server.js';
import { route } from '../../../lib/providers/router.js';

export const maxDuration = 60; // Requires Vercel Pro for >10s

/**
 * POST /api/shortcuts — Universal endpoint for Apple Shortcuts
 *
 * Accepts: { action, data }
 * Actions:
 *   - morning_brief: Get a prioritized daily briefing
 *   - quick_task: Add a task quickly
 *   - process_email: Summarize an email and extract actions
 *   - ask_ai: Quick AI question
 *   - end_of_day: Get end-of-day review
 *   - meeting_prep: Prepare for a meeting
 */
export async function POST(request) {
  try {
    const { action, data } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 });
    }

    switch (action) {
      case 'morning_brief':
        return handleMorningBrief(data);
      case 'quick_task':
        return handleQuickTask(data);
      case 'process_email':
        return handleProcessEmail(data);
      case 'ask_ai':
        return handleAskAI(data);
      case 'end_of_day':
        return handleEndOfDay(data);
      case 'meeting_prep':
        return handleMeetingPrep(data);
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error('[shortcuts] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function handleMorningBrief(data) {
  const db = getSupabaseAdmin();

  // Gather today's data
  const today = new Date().toISOString().split('T')[0];
  let tasks = [];
  let meetings = [];

  if (db) {
    const [taskResult, meetingResult] = await Promise.all([
      db.from('tasks').select('*').eq('done', false).order('created_at', { ascending: false }).limit(20),
      db.from('meetings').select('id, title, created_at').order('created_at', { ascending: false }).limit(5),
    ]);
    tasks = taskResult.data || [];
    meetings = meetingResult.data || [];
  }

  // Include calendar/email data if provided by the shortcut
  const calendarEvents = data?.calendar || 'No calendar data provided';
  const emailSummary = data?.emails || 'No email data provided';

  const prompt = `You are my personal AI assistant. Create my morning briefing.

TODAY'S DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

MY PENDING TASKS (${tasks.length}):
${tasks.length > 0 ? tasks.map((t) => `- [${t.priority}] ${t.text}${t.due_date ? ` (due: ${t.due_date})` : ''}`).join('\n') : 'No pending tasks'}

TODAY'S CALENDAR:
${calendarEvents}

RECENT EMAILS:
${emailSummary}

RECENT MEETINGS: ${meetings.length > 0 ? meetings.map((m) => m.title).join(', ') : 'None'}

Please provide:
1. 🌅 Good morning greeting with today's date
2. 📋 Top 3 priorities for today (based on tasks, meetings, emails)
3. 📅 Suggested time-blocked schedule (deep work mornings, meetings midday, admin afternoon)
4. ⚠️ Anything urgent or overdue
5. 💡 One productivity tip for the day

Keep it concise and actionable. Use bullet points.`;

  const result = await route([{ role: 'user', content: prompt }], 'assist');

  return NextResponse.json({
    briefing: result.content,
    taskCount: tasks.length,
    model: result.routedTo || result.model,
  });
}

async function handleQuickTask(data) {
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const text = data?.text || data?.task;
  if (!text?.trim()) return NextResponse.json({ error: 'Task text required' }, { status: 400 });

  // Use AI to determine priority if not specified
  let priority = data?.priority || 'medium';
  if (!data?.priority) {
    try {
      const result = await route([{
        role: 'user',
        content: `Classify this task's priority as "high", "medium", or "low". Reply with ONLY the priority word, nothing else.\n\nTask: ${text}`
      }], 'assist');
      const parsed = result.content.trim().toLowerCase();
      if (['high', 'medium', 'low'].includes(parsed)) priority = parsed;
    } catch {} // Fall back to medium
  }

  const { data: task, error } = await db
    .from('tasks')
    .insert({ text: text.trim(), priority })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    message: `Task added: "${text}" (${priority} priority)`,
    task,
  });
}

async function handleProcessEmail(data) {
  const emailContent = data?.email || data?.text;
  if (!emailContent?.trim()) return NextResponse.json({ error: 'Email content required' }, { status: 400 });

  const prompt = `Analyze this email and provide:
1. 📧 One-line summary
2. 🎯 Action items (what I need to do)
3. ⏰ Urgency (high/medium/low)
4. 📝 Suggested reply (if a reply is needed, draft a brief one)

EMAIL:
${emailContent}`;

  const result = await route([{ role: 'user', content: prompt }], 'assist');

  return NextResponse.json({
    analysis: result.content,
    model: result.routedTo || result.model,
  });
}

async function handleAskAI(data) {
  const question = data?.question || data?.text;
  if (!question?.trim()) return NextResponse.json({ error: 'Question required' }, { status: 400 });

  const model = data?.model || 'assist';
  const result = await route([{ role: 'user', content: question }], model);

  return NextResponse.json({
    answer: result.content,
    model: result.routedTo || result.model,
  });
}

async function handleEndOfDay(data) {
  const db = getSupabaseAdmin();

  let tasks = [];
  let completedToday = [];

  if (db) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingResult, completedResult] = await Promise.all([
      db.from('tasks').select('*').eq('done', false).order('created_at', { ascending: false }),
      db.from('tasks').select('*').eq('done', true).gte('created_at', today.toISOString()).limit(20),
    ]);
    tasks = pendingResult.data || [];
    completedToday = completedResult.data || [];
  }

  const prompt = `End of day review.

COMPLETED TODAY (${completedToday.length}):
${completedToday.length > 0 ? completedToday.map((t) => `✓ ${t.text}`).join('\n') : 'Nothing marked as complete today'}

STILL PENDING (${tasks.length}):
${tasks.length > 0 ? tasks.map((t) => `- [${t.priority}] ${t.text}`).join('\n') : 'All clear!'}

${data?.notes ? `MY NOTES: ${data.notes}` : ''}

Please provide:
1. 🏆 What I accomplished today
2. 📋 What carries to tomorrow (top 3 priorities)
3. 🔄 Any tasks I should delegate or drop
4. 💡 One reflection or suggestion for tomorrow`;

  const result = await route([{ role: 'user', content: prompt }], 'assist');

  return NextResponse.json({
    review: result.content,
    completedCount: completedToday.length,
    pendingCount: tasks.length,
  });
}

async function handleMeetingPrep(data) {
  const meetingInfo = data?.meeting || data?.text;
  if (!meetingInfo?.trim()) return NextResponse.json({ error: 'Meeting info required' }, { status: 400 });

  const prompt = `Prepare me for this meeting:

${meetingInfo}

Please provide:
1. 🎯 Meeting objectives (what should be accomplished)
2. 📋 Key talking points
3. ❓ Questions I should ask
4. 📝 Notes template to fill during the meeting
5. ✅ Pre-meeting checklist`;

  const result = await route([{ role: 'user', content: prompt }], 'assist');

  return NextResponse.json({
    prep: result.content,
    model: result.routedTo || result.model,
  });
}
