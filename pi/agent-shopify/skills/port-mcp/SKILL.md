---
name: port-mcp
description: Port an MCP server into a native Pi extension using mcporter for schema discovery. Use when the user says "port MCP", "convert MCP to extension", "create extension from MCP", "add MCP tool to pi", or wants to make an MCP server's tools available natively in Pi.
---

# Port MCP Server to Pi Extension

Generate a native Pi extension from an MCP server definition, using `mcporter` for schema discovery and type generation. The result is a standalone `.ts` file that calls the service's REST API directly — no MCP runtime dependency.

---

## Prerequisites

- **mcporter** must be installed: `npm install -g mcporter`
- The target MCP server should be configured in one of: `~/.cursor/mcp.json`, `~/.claude/.mcp.json`, Claude Desktop, or a local `config/mcporter.json`
- Alternatively, the user can provide an npm package name, HTTP URL, or stdio command

---

## Step 1: Identify the MCP Server

Ask the user which MCP server to port. Accept any of:
- A configured server name (e.g., `fellow-mcp`, `playground-slack-mcp`)
- An npm package (e.g., `fellow-mcp`)
- An HTTP MCP URL (e.g., `https://fellow.app/mcp`)
- A stdio command (e.g., `npx -y some-mcp-server`)

Store the server identifier in `$SERVER`.

---

## Step 2: Discover Tools and Schemas

Run mcporter to get the full tool list with schemas:

```bash
mcporter list $SERVER --schema --json
```

If the server isn't configured, try connecting ad-hoc:

```bash
mcporter list $SERVER --schema --json --adhoc
```

Or for an npm package, temporarily configure and list:

```bash
mcporter config add $SERVER --command "npx -y $PACKAGE_NAME"
mcporter list $SERVER --schema --json
```

Parse the JSON output to extract:
- Tool names and descriptions
- Parameter schemas (types, required/optional, enums, descriptions)
- Any output schema hints

Present a summary to the user:
- "Found N tools: tool_a, tool_b, tool_c..."
- "Which tools should the extension include?" (default: all)

---

## Step 3: Discover the Underlying API

Before generating code, determine what REST API the MCP server wraps. This is critical because the Pi extension calls the API directly, not through MCP.

1. **Check the MCP server's source code** — if it's an npm package:
   ```bash
   npm pack $PACKAGE_NAME --pack-destination /tmp
   tar -xzf /tmp/$PACKAGE_NAME-*.tgz -C /tmp/mcp-source
   ```
   Then read the source to find:
   - Base URL pattern (e.g., `https://{subdomain}.fellow.app/api/v1`)
   - Authentication method (API key header, OAuth, bearer token)
   - HTTP method and endpoint for each tool
   - Response shape (the actual API shape, not the MCP wrapper)

2. **Check the service's developer docs** — use `perplexity_search` or `web_search` to find REST API documentation.

3. **If the MCP server uses HTTP transport** (like `https://fellow.app/mcp`), note that the Pi extension should call the underlying REST API, not the MCP endpoint — MCP adds protocol overhead.

Present findings to the user:
- "The API uses X-API-KEY header auth"
- "Base URL is https://..."
- "I found N endpoints matching the MCP tools"

---

## Step 4: Generate the Pi Extension

Generate a TypeScript file following Pi's extension conventions. Use the reference template below and adapt it to the discovered API.

### Output Path

Default: `~/.pi/agent-shopify/extensions/{server-name}.ts`

If the user's dotfiles repo is available (check for `~/src/github.com/*/dotfiles/pi/agent-shopify/extensions/`), prefer writing there so it's version-controlled.

### Extension Template

The generated extension MUST follow this structure:

```typescript
/**
 * {Service Name} Extension for Pi
 *
 * Tools: {list of tool names}
 *
 * Generated from MCP server: {server identifier}
 * Auth: {auth method description}
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
// Use StringEnum for string enums (Google compatibility)
// import { StringEnum } from "@mariozechner/pi-ai";
import * as fs from "fs";
import * as path from "path";

// ── Credential Management ──────────────────────────────────────────
// Pattern: persist to ~/.{service}-pi/config.json
// On first use: open browser + prompt for credentials
// Support env var override: {SERVICE}_API_KEY

const CONFIG_DIR = path.join(process.env.HOME ?? "~", ".{service}-pi");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

interface ServiceConfig {
  // ... auth fields
}

function loadConfig(): ServiceConfig | null {
  // 1. Check env vars
  // 2. Check persisted config file
  // Return null if not configured
}

function saveConfig(config: ServiceConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

// ── API Client ─────────────────────────────────────────────────────
// Thin wrapper over fetch() calling the service's REST API directly

class ServiceClient {
  private baseUrl: string;
  private auth: string; // or whatever auth mechanism

  constructor(config: ServiceConfig) { ... }

  private async request(method: string, endpoint: string, body?: unknown): Promise<unknown> {
    // fetch() with auth headers, error handling, retries for 5xx
  }

  // One method per MCP tool, calling the REST endpoint
  async toolName(params: { ... }): Promise<ResponseType> { ... }
}

// ── Extension ──────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  let client: ServiceClient | null = null;

  // Load existing config at startup
  const initialConfig = loadConfig();
  if (initialConfig) client = new ServiceClient(initialConfig);

  // Interactive setup flow
  async function runSetup(ctx: ExtensionContext): Promise<ServiceClient | null> {
    if (!ctx.hasUI) { ctx.ui.notify("Setup requires interactive mode.", "error"); return null; }
    ctx.ui.notify("Opening {service} in your browser...", "info");
    await pi.exec("open", ["{setup-url}"]);
    ctx.ui.notify("{setup instructions}", "info");
    // Prompt for credentials using ctx.ui.input()
    // Validate with a test API call
    // Save config
    // Return new client
  }

  async function ensureClient(ctx: ExtensionContext): Promise<ServiceClient> {
    if (client) return client;
    const newClient = await runSetup(ctx);
    if (!newClient) throw new Error("{Service} not configured. Use /{service}-setup to configure.");
    return newClient;
  }

  // Setup/reset commands
  pi.registerCommand("{service}-setup", {
    description: "Configure {service} API credentials",
    handler: async (_args, ctx) => { await runSetup(ctx); },
  });

  pi.registerCommand("{service}-reset", {
    description: "Remove stored {service} credentials",
    handler: async (_args, ctx) => {
      try { if (fs.existsSync(CONFIG_FILE)) fs.unlinkSync(CONFIG_FILE); client = null;
        ctx.ui.notify("{Service} credentials removed.", "info");
      } catch (e) { ctx.ui.notify(`Failed: ${e}`, "error"); }
    },
  });

  // ── Tools ──────────────────────────────────────────────────────
  // One pi.registerTool() per MCP tool

  pi.registerTool({
    name: "{service}_{tool_name}",
    label: "{Service}: {Tool Label}",
    description: "{MCP tool description}",
    parameters: Type.Object({
      // Map MCP inputSchema to TypeBox:
      //   string          → Type.String()
      //   number/integer  → Type.Number()
      //   boolean         → Type.Boolean()
      //   enum strings    → StringEnum(["a", "b"] as const)
      //   optional        → Type.Optional(Type.String())
      //   array           → Type.Array(Type.String())
      // Always include { description: "..." } from MCP schema
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const c = await ensureClient(ctx);
      const result = await c.toolName(params);
      // Format result as readable text for the LLM
      const text = `...formatted output...`;
      return { content: [{ type: "text", text }], details: { ...result } };
    },
  });
}
```

### Key Conventions

1. **Tool naming**: Prefix all tools with `{service}_` (e.g., `fellow_search_meetings`)
2. **TypeBox parameters**: Use `Type.Object`, `Type.String`, `Type.Number`, `Type.Boolean`, `Type.Optional`, `Type.Array`. Use `StringEnum` from `@mariozechner/pi-ai` for string enums (required for Google model compatibility).
3. **Credential persistence**: Store at `~/.{service}-pi/config.json` with `0o600` permissions. Never store in the dotfiles repo.
4. **Interactive setup**: Open browser + `ctx.ui.input()` prompts. Validate credentials before saving.
5. **Error handling**: Throw errors from `execute()` to signal failures. Include actionable messages (e.g., "Use /{service}-setup to reconfigure").
6. **Output truncation**: If responses can be large, truncate at 50KB with a notice.
7. **Auth errors**: Detect 401/403 and suggest re-setup.

---

## Step 5: Test the API

Before declaring done, validate the extension by testing the actual API:

1. **Check if credentials exist** — look for the config file or env vars
2. **Make a test API call** — use `bash` with `curl` to call one endpoint with the user's credentials
3. **Compare response shape** — verify the API returns the fields the extension expects
4. **Fix mismatches** — API responses often differ from what the MCP source code suggests (extra nesting, different field names). Fix the client methods.

Common pitfalls:
- API wraps responses in an extra object (e.g., `{ recordings: { data: [...] } }` instead of `{ data: [...] }`)
- Field names differ between MCP schema and actual API (e.g., `segments` vs `speech_segments`)
- Pagination uses cursors, not page numbers
- Dates may need format adjustment

---

## Step 6: Present to User

Show the user:
1. The generated file path
2. A summary of tools registered
3. Setup instructions (what env vars or interactive setup is needed)
4. How to activate: `/reload` in Pi

Ask if they want to:
- Test any specific tool right now (via curl)
- Adjust tool names or descriptions
- Add/remove tools
- Commit the file

---

## Notes

- This skill generates extensions for **Pi only**. The generated code calls REST APIs directly and has no MCP dependency.
- If the MCP server has no discoverable REST API (pure MCP with no backing API), consider using `mcporter call` via `bash` as a fallback approach instead of generating a native extension.
- For services using OAuth (like Google), the credential management section will be more complex. Reference the `gdrive.ts` extension pattern which includes browser-based OAuth flows.
- Generated code is a starting point. The user should review and may need to iterate, especially on response formatting and auth flows.
