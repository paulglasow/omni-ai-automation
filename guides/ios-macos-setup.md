# iOS & macOS Setup Guide

This guide explains how to build native iOS and macOS clients that connect to the OmniAI v4 backend, including authentication, real-time sync, and cost tracking.

---

## Architecture Overview

```
┌─ OmniAI Backend (Node.js / Vercel) ───────────────────────┐
│  POST /api/chat         — multi-model AI routing          │
│  GET  /api/workspaces   — list/manage workspaces          │
│  GET  /api/usage/*      — cost aggregation & analytics    │
│  POST /api/auth/device  — device JWT (iOS/macOS auth)     │
└───────────────────────────────────────────────────────────┘
         ▲                      ▲
         │ HTTPS + JWT          │ WebSocket (Supabase Realtime)
         │                      │
   ┌─────┴──────────────────────┴──────┐
   │  iOS App (SwiftUI)                │
   │  macOS App (SwiftUI + AppKit)     │
   └───────────────────────────────────┘
         │
         ▼
   ┌─ Supabase ─────────────────────────────────────────────┐
   │  Auth (email + password)                               │
   │  PostgreSQL (workspaces, usage_logs, conversations)    │
   │  Realtime (live updates)                               │
   └────────────────────────────────────────────────────────┘
```

---

## Device Authentication

Native apps authenticate using email and password. The server returns a long-lived JWT (30 days) that should be stored securely in the iOS Keychain or macOS Keychain.

### Sign In

```http
POST /api/auth/device
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secret",
  "deviceId": "optional-device-uuid"
}
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "30d",
  "user": { "id": "uuid", "email": "user@example.com" },
  "workspaceId": "default-workspace-uuid"
}
```

Store the `token` in the Keychain:

```swift
import Security

func saveToken(_ token: String) {
    let data = Data(token.utf8)
    let query: [CFString: Any] = [
        kSecClass: kSecClassGenericPassword,
        kSecAttrAccount: "omni_device_token",
        kSecValueData: data,
    ]
    SecItemDelete(query as CFDictionary)
    SecItemAdd(query as CFDictionary, nil)
}
```

### Refresh

```http
POST /api/auth/device?action=refresh
Authorization: Bearer <current_token>
```

Call refresh when the token is within 7 days of expiry.

### Logout

```http
POST /api/auth/device?action=logout
Authorization: Bearer <token>
```

Delete the locally stored token from the Keychain.

> **Security note**: Device JWTs are stateless. Calling the logout endpoint instructs the client to delete its local token, but the JWT itself remains cryptographically valid until its 30-day expiry. For immediate revocation (e.g., after a device is lost), you would need a server-side denylist — this is a planned future feature. In the meantime, rotating `DEVICE_JWT_SECRET` invalidates all outstanding device tokens instantly.

---

## Making AI Chat Requests

```swift
func sendMessage(_ text: String, workspaceId: String?) async throws -> ChatResponse {
    let token = loadToken() // from Keychain
    var request = URLRequest(url: URL(string: "https://your-app.vercel.app/api/chat")!)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    if let token { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }

    let body: [String: Any] = [
        "messages": [["role": "user", "content": text]],
        "model": "assist",
        "workspaceId": workspaceId as Any,
    ]
    request.httpBody = try JSONSerialization.data(withJSONObject: body)

    let (data, _) = try await URLSession.shared.data(for: request)
    return try JSONDecoder().decode(ChatResponse.self, from: data)
}

struct ChatResponse: Decodable {
    let content: String
    let model: String
    let routedTo: String?
    let usage: UsageSummary?
}

struct UsageSummary: Decodable {
    let total: TotalUsage?
    struct TotalUsage: Decodable {
        let estimatedCostUsd: Double
    }
}
```

---

## Real-Time Conversation Sync (Supabase Realtime)

Add the [Supabase Swift SDK](https://github.com/supabase-community/supabase-swift) to your project:

```swift
// Package.swift
.package(url: "https://github.com/supabase-community/supabase-swift.git", from: "2.0.0")
```

Subscribe to workspace conversations:

```swift
import Supabase

let supabase = SupabaseClient(
    supabaseURL: URL(string: "https://your-project.supabase.co")!,
    supabaseKey: "your-anon-key"
)

// Set the user's JWT so RLS policies apply
await supabase.auth.setSession(accessToken: deviceToken, refreshToken: "")

// Subscribe to new conversations in the workspace
let channel = supabase.realtime.channel("workspace-\(workspaceId)")
channel.on(.insert, table: "conversations") { payload in
    // payload.newRecord contains the new conversation row
    print("New conversation:", payload.newRecord)
}
await channel.subscribe()
```

---

## Displaying Cost in the UI

Use the `estimatedCostUsd` from the response to display cost information:

```swift
struct MessageView: View {
    let response: ChatResponse

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(response.content)
            if let cost = response.usage?.total?.estimatedCostUsd, cost > 0 {
                Text("💰 $\(String(format: "%.4f", cost))")
                    .font(.caption)
                    .foregroundColor(.green)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.green.opacity(0.1))
                    .cornerRadius(8)
            }
        }
    }
}
```

---

## Workspace Management

```swift
// List workspaces
func listWorkspaces() async throws -> [Workspace] {
    let token = loadToken()
    var request = URLRequest(url: URL(string: "\(baseURL)/api/workspaces")!)
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    let (data, _) = try await URLSession.shared.data(for: request)
    let response = try JSONDecoder().decode(WorkspaceListResponse.self, from: data)
    return response.workspaces
}

// Create workspace
func createWorkspace(name: String) async throws -> Workspace {
    let token = loadToken()
    var request = URLRequest(url: URL(string: "\(baseURL)/api/workspaces")!)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    request.httpBody = try JSONSerialization.data(withJSONObject: ["name": name])
    let (data, _) = try await URLSession.shared.data(for: request)
    return try JSONDecoder().decode(Workspace.self, from: data)
}
```

---

## Security Recommendations for Native Apps

1. **Keychain storage**: Always store the device JWT in the Keychain, never in `UserDefaults` or plain files.
2. **Certificate pinning**: Pin the TLS certificate for your Vercel domain to prevent MitM attacks.
3. **Biometric auth**: Gate Keychain access with Face ID / Touch ID using `kSecAccessControlBiometryAny`.
4. **Token refresh**: Implement background refresh when the app foregrounds if the token is near expiry.
5. **Logout on revocation**: Handle 401 responses by clearing the local token and prompting re-authentication.

---

## macOS-Specific Features

On macOS you can additionally:

- **Share extension**: Accept text from other apps via the Share menu, send to OmniAI
- **Menu bar app**: Quick access to OmniAI without opening the full app window
- **Spotlight integration**: Surface past conversations via `CoreSpotlight`
- **Shortcuts integration**: Automate OmniAI queries with Apple Shortcuts

---

## Environment Setup

Configure these environment variables on your Vercel deployment:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...   # public, safe to expose
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...  # private, server-side only
DEVICE_JWT_SECRET=your-random-secret-min-32-chars
WORKSPACE_INVITE_SECRET=another-random-secret
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
PERPLEXITY_API_KEY=pplx-...
ENABLE_COST_ESTIMATES=true
```
