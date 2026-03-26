# Collaborative Workspaces

OmniAI v4 supports shared workspaces where teams can collaborate on AI-assisted research, share conversation history, and track costs collectively.

---

## Overview

A **workspace** is a named container for:
- Shared conversations and AI responses
- Collective cost tracking (aggregate spend per team)
- Role-based access control (RBAC) for members

---

## Creating a Workspace

```http
POST /api/workspaces
Authorization: Bearer <supabase_jwt>
Content-Type: application/json

{
  "name": "GIS Research Team",
  "isPublic": false
}
```

Response:

```json
{
  "id": "a1b2c3d4-...",
  "name": "GIS Research Team",
  "owner_id": "user-uuid",
  "is_public": false,
  "created_at": "2024-01-15T10:00:00Z"
}
```

The creator is automatically added as an **admin** member.

---

## Listing Your Workspaces

```http
GET /api/workspaces
Authorization: Bearer <supabase_jwt>
```

Returns all workspaces where you are a member (owner or invited).

---

## Inviting Members

Workspace admins and owners can invite others by email:

```http
POST /api/workspaces/:id/invite
Authorization: Bearer <supabase_jwt>
Content-Type: application/json

{
  "email": "colleague@example.com",
  "role": "editor"
}
```

This returns a signed invite token (valid for 24 hours):

```json
{
  "token": "eyJhbGciOi...",
  "expiresIn": "24h",
  "message": "Invite sent to colleague@example.com"
}
```

Share the token with your colleague. They accept it via:

```http
POST /api/workspaces?action=accept-invite
Authorization: Bearer <their_supabase_jwt>
Content-Type: application/json

{
  "token": "eyJhbGciOi..."
}
```

---

## Roles (RBAC)

| Role | List conversations | Send chat | Invite members | Delete workspace |
|---|---|---|---|---|
| **viewer** | ✅ | ❌ | ❌ | ❌ |
| **editor** | ✅ | ✅ | ❌ | ❌ |
| **admin** | ✅ | ✅ | ✅ | ❌ |
| **owner** | ✅ | ✅ | ✅ | ✅ |

> **Note**: "owner" is not a stored role in `workspace_members`. Ownership is tracked via `workspaces.owner_id`. The table's `role` column only accepts `viewer`, `editor`, or `admin`. Owner-level permissions are enforced in the API layer by comparing `workspaces.owner_id` with the requesting user's ID.

---

## Sending Workspace-Aware Chat Requests

Include the `workspaceId` field in your chat request to track usage against the workspace:

```http
POST /api/chat
Authorization: Bearer <supabase_jwt>
Content-Type: application/json

{
  "messages": [{ "role": "user", "content": "Summarise the zoning report" }],
  "model": "assist",
  "workspaceId": "a1b2c3d4-..."
}
```

The cost for this request will be logged to `usage_logs` with `workspace_id = a1b2c3d4-...`.

---

## Workspace Cost Summary

Retrieve aggregated costs across all models for a workspace:

```http
GET /api/usage/:workspaceId/summary?from=2024-01-01&to=2024-01-31
Authorization: Bearer <supabase_jwt>
```

Only members can query workspace usage. The response breaks costs down by AI provider.

---

## Removing Members

Admins and owners can remove a member:

```http
DELETE /api/workspaces/:id/members
Authorization: Bearer <supabase_jwt>
Content-Type: application/json

{
  "targetUserId": "user-uuid-to-remove"
}
```

Members can also remove themselves (self-leave). The workspace owner cannot be removed.

---

## Deleting a Workspace

Only the owner can delete a workspace. This is irreversible and removes all members, invites, and conversation records:

```http
DELETE /api/workspaces/:id
Authorization: Bearer <supabase_jwt>
```

---

## Row-Level Security

All workspace data is protected by Supabase RLS policies:

- Users can only **read** workspaces they own or belong to
- Users can only **insert** conversations into workspaces they're a member of
- Workspace invites are visible only to admins and the owner
- Usage logs are visible to workspace members and the user who made the request

The service-role key (used server-side only, never exposed to clients) can bypass RLS for administrative operations like cost aggregation.

---

## Real-Time Sync

Supabase Realtime is enabled for the `conversations` and `usage_logs` tables. Connected clients (web, iOS, macOS) automatically receive live updates when:

- A new conversation is added to the workspace
- A cost entry is logged for a new request

See `guides/ios-macos-setup.md` for how native apps subscribe to real-time events.
