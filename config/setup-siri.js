#!/usr/bin/env node
/**
 * OmniAI v4 — Siri Shortcuts Setup Guide
 * Generates the Apple Shortcuts configuration for voice-activated OmniAI access.
 * Requires Apple Shortcuts app (Mac/iOS) and OmniAI to be deployed.
 */

'use strict';

require('dotenv').config();
const fs   = require('fs');
const path = require('path');

const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE   = '\x1b[34m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

// Shortcut configurations to generate
const SHORTCUTS = [
  {
    name: 'Ask OmniAI',
    trigger: 'Hey Siri, Ask OmniAI',
    description: 'Ask any question to all 4 AI models at once',
    steps: [
      'Ask for Input: "What would you like to ask OmniAI?"',
      'Get Contents of URL: [Your OmniAI URL]/api/ask',
      '  Method: POST',
      '  Body: { "query": [Input], "mode": "auto" }',
      'Show Result in notification',
    ],
  },
  {
    name: 'OmniAI Financial Summary',
    trigger: 'Hey Siri, Financial Summary',
    description: 'Get a quick financial overview from Empower and Monarch',
    steps: [
      'Get Contents of URL: [Your OmniAI URL]/api/financial/summary',
      '  Method: GET',
      '  Authorization: Bearer [Your API Key]',
      'Show Result: Display the financial summary',
    ],
  },
  {
    name: 'OmniAI Code Review',
    trigger: 'Hey Siri, Code Review',
    description: 'Paste code and get an instant review',
    steps: [
      'Get Clipboard',
      'Ask for Input: "What should I check in this code?"',
      'Get Contents of URL: [Your OmniAI URL]/api/code-review',
      '  Method: POST',
      '  Body: { "code": [Clipboard], "focus": [Input] }',
      'Copy to Clipboard: [Result]',
      'Show Notification: "Code review copied to clipboard!"',
    ],
  },
  {
    name: 'OmniAI Research',
    trigger: 'Hey Siri, Research',
    description: 'Get Perplexity-powered research on any topic',
    steps: [
      'Ask for Input: "What would you like to research?"',
      'Get Contents of URL: [Your OmniAI URL]/api/research',
      '  Method: POST',
      '  Body: { "topic": [Input], "model": "perplexity" }',
      'Show Result',
    ],
  },
];

async function main() {
  console.log(`\n${BOLD}OmniAI v4 — Siri Shortcuts Setup${RESET}\n`);

  const deployUrl = process.env.DEPLOY_URL
    || (fs.existsSync('.deploy-url') ? fs.readFileSync('.deploy-url', 'utf8').trim() : null)
    || 'https://your-omni-ai-url.vercel.app';

  console.log(`  ${GREEN}✓${RESET} OmniAI URL: ${deployUrl}`);
  console.log(`\n  ${BOLD}Generating Siri Shortcut configurations...${RESET}\n`);

  // Generate shortcut instruction files
  const outputDir = path.join(__dirname, '..', 'guides', 'siri-shortcuts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const shortcut of SHORTCUTS) {
    const content = generateShortcutGuide(shortcut, deployUrl);
    const filename = `${shortcut.name.replace(/\s+/g, '-').toLowerCase()}.md`;
    fs.writeFileSync(path.join(outputDir, filename), content);
    console.log(`  ${GREEN}✓${RESET} Created: guides/siri-shortcuts/${filename}`);
  }

  // Generate the master shortcuts guide
  const masterGuide = generateMasterGuide(deployUrl);
  fs.writeFileSync(path.join(__dirname, '..', 'guides', 'siri-shortcuts', 'README.md'), masterGuide);
  console.log(`  ${GREEN}✓${RESET} Created: guides/siri-shortcuts/README.md`);

  console.log(`\n  ${BOLD}${BLUE}── How to Create These Shortcuts ──────────────────────${RESET}`);
  console.log('');
  console.log('  On Mac:');
  console.log('    1. Open the Shortcuts app (Launchpad → Shortcuts)');
  console.log('    2. Click the + button to create a new shortcut');
  console.log('    3. Follow the steps in each guide file above');
  console.log('');
  console.log('  On iPhone/iPad:');
  console.log('    1. Open the Shortcuts app');
  console.log('    2. Tap + to create a new shortcut');
  console.log('    3. Follow the steps in each guide file');
  console.log('    4. Tap the shortcut settings (···) → Add to Siri');
  console.log('    5. Record your trigger phrase (e.g., "Ask OmniAI")');
  console.log('');
  console.log(`  ${GREEN}${BOLD}Siri Shortcuts configuration complete!${RESET}\n`);
}

function generateShortcutGuide(shortcut, deployUrl) {
  return `# Siri Shortcut: ${shortcut.name}

**Voice Trigger:** "${shortcut.trigger}"

**What it does:** ${shortcut.description}

## Steps to Create

Open the Shortcuts app and create a new shortcut with these actions:

${shortcut.steps.map((step, i) => `${i + 1}. ${step.replace(/\[Your OmniAI URL\]/g, deployUrl)}`).join('\n')}

## Testing

After creating the shortcut:
1. Say "${shortcut.trigger}" to Siri
2. You should get a response within a few seconds
3. If it doesn't work, check that your OmniAI URL (${deployUrl}) is accessible

## Troubleshooting

- **"I can't find that shortcut"**: Make sure you added it to Siri in the shortcut settings
- **No response**: Check your internet connection and that OmniAI is running
- **Error message**: Verify your OmniAI API key is configured correctly
`;
}

function generateMasterGuide(deployUrl) {
  return `# Siri Shortcuts for OmniAI v4

Talk to your AI assistant hands-free using Siri.

## Available Shortcuts

| Voice Trigger | What it does |
|---|---|
${SHORTCUTS.map(s => `| "${s.trigger}" | ${s.description} |`).join('\n')}

## Quick Setup

1. Open the Shortcuts app on Mac or iPhone
2. Create each shortcut using the guide files in this folder
3. Add each shortcut to Siri with a voice trigger
4. Test by saying the trigger phrase

## Your OmniAI URL

\`\`\`
${deployUrl}
\`\`\`

Use this URL when configuring each shortcut's URL actions.

## Tips

- Keep trigger phrases short and memorable
- You can customize the trigger phrases to anything you prefer
- Shortcuts work on all Apple devices signed into the same iCloud account
- For best results, use a quiet environment when activating Siri
`;
}

main().catch(err => {
  console.error(`\nUnexpected error: ${err.message}`);
  process.exit(1);
});
