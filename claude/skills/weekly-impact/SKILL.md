---
name: weekly-impact
description: Write a weekly impact recap by gathering data from GitHub, Fellow, and Slack, then interviewing the user for context and clarity. Use when the user asks for a weekly recap, weekly update, impact report, or brag doc entry.
---

# Weekly Impact Recap

An interview-based weekly recap skill. Gathers your activity from GitHub, Slack, and Fellow, then asks you targeted follow-up questions so you spend your time reflecting on impact — not scraping data.

If this is the last week of the month, a monthly summary is generated after the weekly entry.

---

## Prerequisites

This skill pulls data from three sources using MCP servers. Install any that are available to you from [vault.shopify.io/ai/mcp_servers](https://vault.shopify.io/ai/mcp_servers):

| Source | MCP Server | What it provides |
|--------|-----------|-----------------|
| GitHub | `gh` CLI (built-in) | PRs authored and reviewed |
| Slack | Slack MCP | Messages sent, channel activity, threads |
| Calendar | Fellow MCP | Meetings, summaries, action items |

**The skill works with whatever is available.** If a data source is missing, skip it and work with what you have. Ask the user to fill in gaps during the interview.

### Setup

After installing, update the values in **User Config** below.

---

## User Config

> **Update these values before first use.**

- **GitHub handle**: `YOUR_GITHUB_HANDLE`
- **Slack channels**: List 1-2 team or project channels to scan for context (e.g., `proj-my-project`, `my-team-channel`)
- **Output file**: Path to your impact notes file (default: `Impact Report.md`)
- **Output method**: Uses the **Obsidian MCP** by default. If you don't use Obsidian, use the `Read`/`Write` tools with a local file path instead.
- **Sync command**: If you have a command to publish/sync your notes (e.g., `sync_notes`), add it here. Otherwise, remove Step 6.

---

## Step 1: Gather Data (run in parallel where possible)

Collect raw activity for the current Monday–Friday (or the week specified in `$ARGUMENTS`).

### Git Activity (PRs authored and reviewed)
- Use `gh` CLI commands to find PRs authored and reviewed this week:
  - `gh search prs --author=GITHUB_HANDLE --created=YYYY-MM-DD..YYYY-MM-DD --json title,url,repository,state,createdAt`
  - `gh search prs --reviewed-by=GITHUB_HANDLE --created=YYYY-MM-DD..YYYY-MM-DD --json title,url,repository,state,createdAt`
- For important PRs, use `graphite-tools-mcp` `detailed-pr-info` if available to get richer context (description, comments, review status)
- Do NOT double-count — if PRs appear in both GitHub and Graphite, they mirror the same repo

### Calendar & Meetings
- Use `fellow-mcp` `search_meetings` to find meetings this week (set `user_has_calendar_event: true`, `from_date` and `to_date` for the week, `has_summary: true`)
- Use `get_meeting_summary` for meetings that look significant (1:1s, planning sessions, team syncs, reviews)
- Use `get_action_items` filtered to this week's date range

### Slack Activity
- Use Slack MCP `get_messages` with `action: my_messages` for the week (`after` and `before` dates)
- Scan the configured team/project channels for relevant threads and updates
- Look for: decisions made, blockers raised, help given/received, people updates, cross-team interactions

---

## Step 2: Synthesize — DO NOT WRITE YET

After gathering data, build an internal picture of the week organized by:
- **Impact areas**: What did the user drive, own, or unblock?
- **Collaboration**: Who did they help, pair with, mentor, or align with?
- **Challenges**: What was difficult, blocking, or required extra effort?
- **Growth**: What did they learn or how did they stretch?

Focus on IMPACT, not activity counts. "Drove alignment on X across the team" is useful. "Merged 5 PRs" is not.

---

## Step 3: Interview — ASK FOLLOW-UP QUESTIONS

**This step is required.** Before writing anything, present a summary of what you found and ask clarifying questions. The goal is an interview-style conversation:

- "I see you had a meeting with [person] about [topic] — what was the outcome?"
- "There was a lot of activity in [channel] around [topic] — were you driving that or supporting?"
- "This PR seemed significant — was there anything notable about the approach or difficulty?"
- "Any people updates, celebrations, or team dynamics worth capturing?"
- "Anything I missed that was important this week?"

Ask 3-5 targeted questions based on what you found. **Wait for answers before writing.**

---

## Step 4: Write the Recap

After the interview, write the weekly entry. Read the output file first to match existing formatting and tone. Place the new entry at the top of the current month's section, creating a new month header if this is the first week of a new month.

### Format (match existing tone, or use this as a starting point)

```
##### Week [N] – [Month] [Day], [Year]
- **Updates**
	- [People updates, team changes, project milestones]
- **Accomplishments**
	- [Impact-focused bullets with nested detail]
		- [Context, who was involved, why it mattered]
- **Top Learning**
	- [Reflection on growth, leadership, skills — written in first person]
- **Blockers**
	- [What slowed progress, what's unresolved]
- **Actions for next week**
	- [Forward-looking priorities]
```

### Tone Guidelines
- First person, reflective, honest
- Emphasize ownership, leadership, and collaboration — not task completion
- Nest detail under bullets to give context without bloating top-level items
- Keep it concise but substantive

---

## Step 5: Month-End Check

If this is the last Friday of the month (no more Fridays remain in the current month), generate a monthly summary after the weekly entry.

### Process
1. Read all weekly entries for the month
2. Ask the user 2-3 clarifying questions:
   - "Looking across the month, [theme X] came up repeatedly — is that the right top-level story?"
   - "Any accomplishment or learning you want to make sure stands out?"
   - "Anything you want to frame differently than how it was captured weekly?"
3. Wait for answers, then write the summary

### Monthly Format

Insert between the month header and the first weekly entry:

```
# [Month] [Year]
_[1-2 sentence italic summary capturing the overall arc of the month]_

**Top Accomplishments**
- [Up to 3 impact-focused bullets, drawing from multiple weeks]

**Top Learnings**
- [Up to 3 bullets summarizing growth, insights, and patterns]

---
```

### Guidelines
- Draw from ALL weeks in the month to identify themes and standout moments
- The italic summary should capture the narrative arc — not a list of things done
- Accomplishments should emphasize impact and ownership, not activity
- Learnings should reflect growth areas and insights, written in first person

### Year-End (December Only)

If the completed month is December, also add a Year in Review section between the new January header and the December monthly recap:

```
# [Year] Year in Review
_[1-2 sentence summary of the year]_

**Top Accomplishments**
- [Up to 5 bullets with more detail than monthly recaps]

**Top Learnings**
- [Up to 4 bullets summarizing key growth and insights]

**Top Challenges**
- [Up to 3 bullets reflecting on difficulties and areas for improvement]
```

---

## Step 6: Sync

If a sync command is configured above, run it after writing to publish the updates. Otherwise, skip this step.
