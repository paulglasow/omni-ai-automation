import { NextResponse } from 'next/server';
import { route } from '../../../lib/providers/router.js';

export const maxDuration = 30;

const WEALTH_SYSTEM = `You are a personal finance and wealth strategy advisor.
Analyze financial data and provide:
1) Net worth summary and trend
2) Asset allocation review vs recommended targets
3) Specific repositioning opportunities
4) Prioritized action items
5) Risk assessment
6) Cash flow insights

Be specific and data-driven. Always end with:
DISCLAIMER: This is educational analysis only. Consult a qualified financial advisor before making investment decisions.`;

export async function POST(request) {
  try {
    const { empowerData, monarchData, question } = await request.json();

    if (!empowerData && !monarchData && !question) {
      return NextResponse.json({ error: 'Provide financial data or a question' }, { status: 400 });
    }

    let prompt = '';
    if (empowerData) prompt += `Empower (Personal Capital) Data:\n${empowerData}\n\n`;
    if (monarchData) prompt += `Monarch Money Data:\n${monarchData}\n\n`;
    if (question) prompt += `Specific Question: ${question}\n`;

    const messages = [
      { role: 'system', content: WEALTH_SYSTEM },
      { role: 'user', content: prompt },
    ];

    const result = await route(messages, 'claude');

    return NextResponse.json({
      analysis: result.content,
      model: result.model,
      usage: result.usage,
      disclaimer: 'This is educational analysis only. Consult a qualified financial advisor before making investment decisions.',
    });
  } catch (err) {
    // If Claude isn't available, try assist mode
    try {
      const { empowerData, monarchData, question } = await request.json();
      let prompt = '';
      if (empowerData) prompt += `Empower Data:\n${empowerData}\n\n`;
      if (monarchData) prompt += `Monarch Data:\n${monarchData}\n\n`;
      if (question) prompt += `Question: ${question}`;

      const messages = [
        { role: 'system', content: WEALTH_SYSTEM },
        { role: 'user', content: prompt },
      ];
      const result = await route(messages, 'assist');
      return NextResponse.json({ analysis: result.content, model: result.model, usage: result.usage, disclaimer: 'Educational analysis only.' });
    } catch (err2) {
      return NextResponse.json({ error: err2.message }, { status: 500 });
    }
  }
}
