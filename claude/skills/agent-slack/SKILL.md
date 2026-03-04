---
name: agent-slack
description: Use when reading Slack messages, searching conversations, looking up users or channels, or checking thread replies. Also supports write operations (sending messages, reacting) with explicit user consent. Covers searching, reading messages/threads, channel info, user profiles, and write operations.
---

# agent-slack CLI

A Slack companion CLI for AI agents. Searches messages, reads channels and threads, looks up users, and supports write operations (send, reply, react) with user consent — all using Slack client tokens that work on Shopify's enterprise grid.

## Installation

**Install globally (recommended):**

```bash
npm install -g @shopify-internal/agent-slack
```

**Important:** Always use the globally installed `agent-slack` command directly. Do NOT use `npx @shopify-internal/agent-slack` as it introduces unnecessary overhead and slower startup times.

### Authentication

The CLI uses Slack client tokens (`xoxc-`) and session cookies (`xoxd-`) from a browser session.

**Automatic setup (recommended):**

```bash
agent-slack auth setup
```

This runs `@shopify-internal/get-slack-creds` which launches Chrome, navigates to shopify.slack.com, and extracts credentials automatically once you're logged in.

**Manual alternatives:**

```bash
# Curl method — copy "Copy as cURL" from browser DevTools Network tab
agent-slack auth setup --curl

# Direct — if you already have the values
agent-slack auth setup --token "xoxc-..." --cookie "xoxd-..."

# Environment variables
export SLACK_TOKEN="xoxc-..."
export SLACK_COOKIE="xoxd-..."
```

**Check auth status:**

```bash
agent-slack auth status
```

Credentials are stored in `~/.agent-slack/credentials.json`.

## Name Resolution

The CLI resolves human-readable names to Slack IDs automatically. You almost never need raw IDs.

**Channels** — use names like `polaris-social`, `#eng-announcements`, or IDs like `C0ACMKCS6UW`. Names are resolved via `search.messages in:#name` (works on enterprise) and cached locally in `~/.agent-slack/channels.json`.

**Users** — use handles like `aubron.wood`, `@aubron.wood`, or IDs like `U08109D3FMK`. Handles are resolved via `search.messages from:name` and cached in `~/.agent-slack/users.json`.

**Messages** — use Slack permalink URLs instead of `channel + timestamp` pairs wherever possible. All commands that accept a channel + timestamp also accept a permalink URL. All message output includes a `permalink` field.

Caches grow automatically as you search and interact with Slack.

## Commands

### Search messages

```bash
# Basic search
agent-slack search "deploy failed"

# Slack search operators work in the query string
agent-slack search "from:aubron.wood in:polaris-social after:2025-02-01"
agent-slack search "has:reaction in:eng-announcements"
agent-slack search "before:2025-01-01 in:incidents"

# Limit results and project fields
agent-slack search "outage" --limit 5 --json channel,user,text,permalink
```

Slack search syntax reference:
- `from:username` — messages from a specific user
- `in:channel-name` — messages in a specific channel
- `has:reaction` / `has:link` / `has:pin` — messages with specific attributes
- `after:YYYY-MM-DD` / `before:YYYY-MM-DD` — date filtering
- `during:month` / `during:today` / `during:yesterday`
- Combine freely: `from:alice in:engineering has:reaction after:2025-01-01`

### Search files

```bash
agent-slack search files "quarterly report"
agent-slack search files "design" --type images --from alice
```

### Read channel messages

```bash
# Recent messages (channel name or ID)
agent-slack message list polaris-social --limit 10

# Messages in a time range
agent-slack message list polaris-social --oldest 1772100000.000000 --latest 1772140000.000000
```

### Get a specific message

```bash
# By permalink URL (preferred — copy from search results or Slack)
agent-slack message get https://shopify.slack.com/archives/C0ACMKCS6UW/p1772132415861669

# By channel + timestamp
agent-slack message get polaris-social 1772132415.861669
```

### Read a thread

```bash
# By permalink URL (preferred)
agent-slack message thread https://shopify.slack.com/archives/C0ACMKCS6UW/p1772132415861669

# By channel + timestamp
agent-slack message thread polaris-social 1772132415.861669 --limit 50
```

### Channel info

```bash
# By name
agent-slack channel info polaris-social

# List cached channels (grows as you use search/message/channel commands)
agent-slack channel list
```

### User profiles

```bash
# By username
agent-slack user get aubron.wood

# By ID with field projection
agent-slack user get U08109D3FMK --json realName,title,email

# List cached users
agent-slack user list
```

### Reactions

```bash
# Get reactions on a message (by URL)
agent-slack reactions get https://shopify.slack.com/archives/C0ACMKCS6UW/p1772132415861669

# List messages you've reacted to
agent-slack reactions list
```

### Emoji

```bash
# List custom workspace emoji
agent-slack emoji list --filter party
```

## Write Commands

Write commands allow sending messages and adding reactions on behalf of the user. When called by an AI agent, these commands require explicit user consent via `AGENT_SLACK_WRITE_ENABLED=1`.

**Consent flow for AI agents:**
1. Agent calls a write command (e.g., `agent-slack send ...`)
2. Command detects AI agent environment and outputs `WRITE_CONSENT_REQUIRED` with instructions
3. Agent MUST ask the user for explicit permission
4. If user consents, agent sets `AGENT_SLACK_WRITE_ENABLED=1` and retries

Humans running the CLI directly can use write commands without the env var.

### Send a message

```bash
# Send to a channel
agent-slack send polaris-social "Hello from agent-slack!"

# With JSON output
agent-slack send polaris-social "Hello!" --json channel,ts
```

### Reply in a thread

```bash
# Reply to a thread (using channel + timestamp)
agent-slack reply polaris-social 1772132415.861669 "Thanks for the update!"
```

### Add a reaction

```bash
# React to a message (emoji name without colons)
agent-slack react polaris-social 1772132415.861669 thumbsup

# Colons are stripped automatically if provided
agent-slack react polaris-social 1772132415.861669 :eyes:
```

### Remove a reaction

```bash
agent-slack unreact polaris-social 1772132415.861669 thumbsup
```

## JSON Output and Scripting

Every command supports structured JSON output for programmatic use.

```bash
# JSON with field projection
agent-slack search "deploy" --json channel,user,text,permalink

# Discover available fields
agent-slack search "test" --json

# Pipe through jq
agent-slack search "error" --json channel,user,text --jq '.[] | select(.user == "aubron.wood")'

# Other formats
agent-slack search "test" --output text
```

**IMPORTANT:** Do NOT use `2>/dev/null` when running agent-slack. Error messages and progress info go to stderr and are essential for debugging. If you need to separate stdout from stderr, use `2>&1` instead.

Available `--json` fields by command (use ONLY these exact names — the timestamp field is `ts`, NOT `timestamp`):
- **search**: ts, channel, channelName, user, text, permalink
- **search files**: id, name, title, mimetype, size, user, permalink
- **message get**: ts, channel, user, text, threadTs, replyCount, reactions, permalink
- **message list/thread**: ts, user, text, threadTs, replyCount, reactions, permalink
- **channel info**: id, name, topic, purpose, memberCount, isArchived, isPrivate, created
- **channel list**: id, name
- **user get**: id, name, realName, displayName, title, email, isBot, isAdmin, timezone, statusText, statusEmoji, deleted
- **user list**: id, name
- **reactions get/list**: ts, channel, user, text, reactions, permalink
- **send/reply**: ok, channel, ts, message

If you use an invalid field name, the command prints the available fields to stderr and exits with code 1.

## Common Agentic Workflows

### Find what someone said about a topic

```bash
# Search for their messages
agent-slack search "from:aubron.wood deploy"

# Read the thread for context
agent-slack message thread <permalink-from-results>
```

### Catch up on a channel

```bash
# Read recent messages
agent-slack message list eng-announcements --limit 20

# Drill into an interesting thread
agent-slack message thread <permalink-from-message-list>
```

### Look up a person

```bash
# Get their profile
agent-slack user get aubron.wood

# See what they've been talking about recently
agent-slack search "from:aubron.wood" --limit 10
```

### Find context for an incident

```bash
# Search incident channels
agent-slack search "in:incidents outage after:2025-02-01" --limit 20

# Read a specific incident thread
agent-slack message thread <permalink>

# Check who was involved
agent-slack user get <user-id-from-thread>
```

## Enterprise Limitations

Shopify's Slack enterprise grid restricts some APIs with client tokens:

- `conversations.list` and `users.list` are blocked — the CLI uses search-based resolution and local caching instead
- `users.lookupByEmail` is blocked — use `user get <username>` instead
- All `search.*` APIs work across the full enterprise grid

The local cache (`~/.agent-slack/channels.json` and `~/.agent-slack/users.json`) grows automatically as you interact with Slack, making subsequent lookups instant.
