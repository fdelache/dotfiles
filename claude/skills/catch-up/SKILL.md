---
name: catch-up
description: Generate a comprehensive summary of workplace activity during your absence. Use when the user says "catch up", "what did I miss", "catch me up", "absence summary", or wants to review activity from a time period they were away.
---

# Catch-Up Summary

Generate a comprehensive summary of workplace activity during the user's absence, focusing on project updates and Slack conversations.

## Input

Parse the user's request to extract the time period (e.g., "catch up on last 2 weeks", "what did I miss past month"). Default to "last week" if no period specified.

## Process

### 1. Calculate Date Range
- Determine start_date and end_date based on the specified period
- Announce: "Analyzing activity from [start_date] to [end_date]"

### 2. Identify User and Projects
- Look up the current user's details in Vault
- Get list of active projects the user is involved in
- For each project, get full details including associated Slack channels

### 3. Discover Relevant Channels
Since we cannot directly query channel memberships, use multiple strategies:

a) **From Vault Team/Project Data**:
   - Get user's team and associated channels
   - Teams often have standard channels like #team-[teamname]
   - Check for location-based channels based on user's profile

b) **From Mentions During Absence**:
   - Search for mentions of the user during their absence
   - Extract channels where user was mentioned

c) **Common Organizational Channels**:
   - Include standard company-wide channels the user likely monitors
   - #announcements, #company-all, #engineering (if in engineering)
   - Location channels based on user's office

Categorize discovered channels by type:
- **Project channels**: #proj-*, #gsd-*, #mission-*
- **Team channels**: #team-*, department names
- **Social/Location**: city names, #coffee, #random
- **Announcement**: #announce*, #all-*, #company-*

### 4. Gather Updates

For each channel category, adjust the level of detail:

- **Project Channels** (Full Detail): Decisions, blockers, technical discussions, progress updates
- **Team Channels** (Moderate Detail): Team decisions, personnel updates, significant issues. Skip routine standups.
- **Announcement Channels** (Highlights Only): Official announcements, policy changes, important deadlines
- **Social/Location** (Minimal): Only important announcements, events, or practical information

Also gather:
- Direct mentions and messages requiring response
- Vault feed updates (project status changes, milestones)
- PRs needing attention

### 5. Compile Report

Present as structured markdown:

```markdown
# Catch-Up Summary: [Start Date] to [End Date]
*Generated on [Current Date & Time]*

## 📊 Overview
- Period analyzed: [X] days
- Projects tracked: [Count] - [List names]
- Channels analyzed: [Count]

## 🚨 Immediate Action Required
[Items needing urgent attention with context and deadlines]

## 🎯 Project Updates

### [Project Name 1]
#### Status
- Current status and any changes
- Recent milestones completed
- Active blockers
- Upcoming deadlines

#### Key Discussions
[Summary of important Slack activity in project channel]

### [Project Name 2]
[Similar structure]

## 👥 Team Updates
[Consolidated important updates from team channels]

## 📣 Company-Wide Announcements
- [Date]: [Key announcement with impact]
- [Date]: [Policy change or important update]

## 💬 Direct Communications
- Messages requiring response: [List with context]
- Decisions pending your input
- New assignments
- Threads you were mentioned in

## 📅 Week Ahead
- Immediate priorities (next 2-3 days)
- Upcoming meetings
- Deadlines this week

## 🔗 Important Links
- Must-read Slack threads (with links)
- Updated Vault documents
- PRs needing attention
```

## Quality Checks
- Verify all dates are correctly calculated
- Ensure all mentioned projects have been analyzed
- Include links to source materials where possible

## Error Handling
- If no time period specified, default to "last week" and inform user
- If projects can't be determined, ask user to specify project names
- If Slack channels are missing from project info, attempt to infer from project name
- If rate limited on any API, notify user and continue with available data
