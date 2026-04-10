/**
 * src/promptTemplates.js
 *
 * Prompt template system with built-in defaults and user-created presets.
 * Stored in localStorage.
 */

const STORAGE_KEY = 'omni_prompt_templates';

const BUILT_IN_TEMPLATES = [
  {
    id: 'financial-analysis',
    name: 'Financial Analysis',
    prompt: 'Analyze the following financial data. Provide key metrics, trends, risks, and actionable recommendations.',
    model: 'qa',
    builtIn: true,
  },
  {
    id: 'code-review',
    name: 'Code Review',
    prompt: 'Review this code for bugs, security issues, performance problems, and best practice violations. Suggest improvements.',
    model: 'qa',
    builtIn: true,
  },
  {
    id: 'research-summary',
    name: 'Research Summary',
    prompt: 'Research the following topic and provide a comprehensive summary with key findings, current state, and future outlook.',
    model: 'qa',
    builtIn: true,
  },
  {
    id: 'document-analysis',
    name: 'Document Analysis',
    prompt: 'Analyze the attached document(s). Summarize key points, identify important details, and highlight anything that needs attention.',
    model: 'qa',
    builtIn: true,
  },
  {
    id: 'compare-options',
    name: 'Compare Options',
    prompt: 'Compare the following options. Create a structured pros/cons analysis and provide a clear recommendation with rationale.',
    model: 'qa',
    builtIn: true,
  },
];

function loadCustom() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustom(templates) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {}
}

/**
 * Get all templates (built-in + custom).
 */
export function getAllTemplates() {
  return [...BUILT_IN_TEMPLATES, ...loadCustom()];
}

/**
 * Save a new custom template.
 */
export function saveTemplate(name, prompt, model) {
  const custom = loadCustom();
  custom.push({
    id: `custom-${Date.now()}`,
    name,
    prompt,
    model: model || 'qa',
    builtIn: false,
    createdAt: new Date().toISOString(),
  });
  saveCustom(custom);
}

/**
 * Delete a custom template (can't delete built-ins).
 */
export function deleteTemplate(id) {
  const custom = loadCustom().filter((t) => t.id !== id);
  saveCustom(custom);
}
