/**
 * src/conversations.js
 *
 * Local conversation persistence using localStorage.
 * Stores conversation history with metadata for sidebar listing.
 */

const STORAGE_KEY = 'omni_conversations';
const MAX_CONVERSATIONS = 50;

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(conversations) {
  try {
    // Keep only the most recent conversations
    const trimmed = conversations.slice(0, MAX_CONVERSATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full or unavailable
  }
}

/**
 * Generate a short title from the first user message.
 */
function generateTitle(messages) {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return 'New conversation';
  const text = firstUser.content;
  if (text.length <= 50) return text;
  return text.slice(0, 47) + '...';
}

/**
 * Save or update a conversation.
 * @param {string|null} id - Existing conversation ID, or null for new
 * @param {Array} messages - Full message array
 * @param {string} model - Current model selection
 * @returns {string} conversation ID
 */
export function saveConversation(id, messages, model) {
  const all = loadAll();

  if (id) {
    // Update existing
    const idx = all.findIndex((c) => c.id === id);
    if (idx !== -1) {
      all[idx].messages = messages;
      all[idx].model = model;
      all[idx].title = generateTitle(messages);
      all[idx].updatedAt = new Date().toISOString();
      all[idx].messageCount = messages.length;
      // Move to top
      const updated = all.splice(idx, 1)[0];
      all.unshift(updated);
      saveAll(all);
      return id;
    }
  }

  // Create new conversation
  const newId = crypto.randomUUID();
  const conversation = {
    id: newId,
    title: generateTitle(messages),
    model,
    messages,
    messageCount: messages.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  all.unshift(conversation);
  saveAll(all);
  return newId;
}

/**
 * Get a conversation by ID.
 */
export function getConversation(id) {
  return loadAll().find((c) => c.id === id) || null;
}

/**
 * List all conversations (metadata only, no messages).
 */
export function listConversations() {
  return loadAll().map(({ id, title, model, messageCount, createdAt, updatedAt }) => ({
    id, title, model, messageCount, createdAt, updatedAt,
  }));
}

/**
 * Delete a conversation.
 */
export function deleteConversation(id) {
  const all = loadAll().filter((c) => c.id !== id);
  saveAll(all);
}
