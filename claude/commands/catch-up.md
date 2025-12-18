Goal: Generate a comprehensive summary of workplace activity during your absence, focusing on project updates and Slack conversations

Parse the command arguments to extract the time period (e.g., "/catch-up last 2 weeks" or "/catch-up past month"). Default to "last week" if no period specified.

Execute this sequence:

1. **Calculate Date Range**:
   - Use `date` command to get current date
   - Calculate start_date based on the specified period (e.g., "2 weeks" = current_date - 14 days)
   - Set end_date to current date
   - Use GNU date for calculations: `date -d "X days ago" +"%Y-%m-%d"`
   - Announce the date range: "Analyzing activity from [start_date] to [end_date]"

2. **Identify User and Projects**:
   - Search Vault for current user's details using mcp__vault-mcp__vault_get_user
   - Get list of active projects using mcp__vault-mcp__vault_search_projects with user's name
   - For each project, use mcp__vault-mcp__vault_get_project to get full details including Slack channels
   
3. **Discover User's Channels**:
   Since we cannot directly query channel memberships, use multiple strategies:
   
   a) **From Recent History** (if available):
      - Search messages from user in the 30 days BEFORE the vacation period: 
        `from:@me after:[30_days_before_start] before:[start_date]`
      - Extract unique channel names from these historical messages
   
   b) **From Mentions During Absence**:
      - Search for mentions of the user during their absence:
        `to:@me OR @[username] after:[start_date] before:[end_date]`
      - Extract channels where user was mentioned
   
   c) **From Vault Team/Project Data**:
      - Get user's team from Vault using mcp__vault-mcp__vault_get_team
      - Teams often have standard channels like #team-[teamname]
      - Check for location-based channels based on user's location from Vault profile
   
   d) **Common Organizational Channels**:
      - Include standard company-wide channels that everyone monitors:
        - #announcements, #company-all, #engineering (if in engineering)
        - Location channels based on user's office (e.g., #montreal, #ottawa)
   
   Categorize discovered channels by type based on naming patterns:
   - Project channels: #proj-*, #gsd-*, #mission-*  
   - Team channels: #team-*, department names
   - Social/Location: city names, #coffee, #gaming, #random
   - Announcement: #announce*, #all-*, #company-*
   - Support: #help*, #support*, #questions*

4. **Gather General Updates**:
   - Query user's Vault feed for the period using mcp__vault-mcp__vault_get_user_feed
   - Search for direct Slack mentions using: `to:@me OR @[username] after:[start_date] before:[end_date]`
   - Check for DMs and important threads involving the user

5. **Channel-Specific Analysis**:
   
   a) **Project Channels** (Full Detail):
   For each project channel identified:
   - Get project updates from Vault (status changes, milestones, blockers)
   - Launch slack-summarizer with channel_type="project":
     ```
     Use Task tool with:
     - subagent_type: "slack-summarizer"
     - description: "Summarize #[channel-name] project activity"
     - prompt: "Analyze Slack channel #[channel-name] from [start_date] to [end_date]. Channel type: project. Focus on decisions, blockers, technical discussions, and progress updates. Provide a detailed summary with action items."
     ```
   
   b) **Team Channels** (Moderate Detail):
   For team channels:
   - Launch slack-summarizer with channel_type="team":
     ```
     Use Task tool with:
     - subagent_type: "slack-summarizer"
     - description: "Summarize #[channel-name] team updates"
     - prompt: "Analyze Slack channel #[channel-name] from [start_date] to [end_date]. Channel type: team. Focus on team decisions, personnel updates, and significant issues. Skip routine standups."
     ```
   
   c) **Social/Location Channels** (Minimal Detail):
   For social and location channels:
   - Launch slack-summarizer with channel_type="social":
     ```
     Use Task tool with:
     - subagent_type: "slack-summarizer"
     - description: "Extract key announcements from #[channel-name]"
     - prompt: "Analyze Slack channel #[channel-name] from [start_date] to [end_date]. Channel type: social. Only report important announcements, events, or practical information. Skip all casual conversation."
     ```
   
   d) **Announcement Channels** (Highlights Only):
   For announcement channels:
   - Launch slack-summarizer with channel_type="announcement":
     ```
     Use Task tool with:
     - subagent_type: "slack-summarizer"
     - description: "Capture announcements from #[channel-name]"
     - prompt: "Analyze Slack channel #[channel-name] from [start_date] to [end_date]. Channel type: announcement. Focus only on official announcements, policy changes, and important deadlines."
     ```

6. **Compile Comprehensive Report**:
   Present as structured markdown with:
   
   ```markdown
   # Catch-Up Summary: [Start Date] to [End Date]
   *Generated on [Current Date & Time]*
   
   ## 📊 Overview
   - Period analyzed: [X] days
   - Projects tracked: [Count] - [List names]
   - Total channels analyzed: [Count] across [X] categories
     - Project channels: [Count]
     - Team channels: [Count]
     - Social/Location channels: [Count]
     - Announcement channels: [Count]
   
   ## 🚨 Immediate Action Required
   [Items needing urgent attention with context and deadlines, aggregated from all sources]
   
   ## 🎯 Project Updates
   
   ### [Project Name 1]
   #### Vault Updates
   - Status: [Current status and any changes]
   - Recent milestones: [Completed items]
   - Active blockers: [Current impediments]
   - Upcoming deadlines: [Near-term deliverables]
   
   #### Slack Activity Summary
   [Insert output from slack-summarizer agent for this project's channel]
   
   ### [Project Name 2]
   [Similar structure for each project]
   
   ## 👥 Team Channels Summary
   [Consolidated important updates from team channels]
   
   ### #[team-channel-1]
   [Insert condensed output from slack-summarizer]
   
   ### #[team-channel-2]
   [Insert condensed output from slack-summarizer]
   
   ## 📣 Company-Wide Announcements
   [Aggregated from all announcement channels]
   - [Date]: [Key announcement with impact]
   - [Date]: [Policy change or important update]
   
   ## 🌍 Location/Social Updates
   [Only if there were important announcements]
   
   ### #[location-channel]
   [Brief summary of any important practical information]
   
   ## 💬 Direct Communications
   - Messages requiring response: [List with context]
   - Decisions pending your input: [Items waiting for you]
   - New assignments: [Tasks assigned during absence]
   - Threads you were mentioned in: [Key discussions]
   
   ## 📅 Week Ahead
   - Immediate priorities: [Next 2-3 days, compiled from all channels]
   - Upcoming meetings: [Key sessions to attend]
   - Deadlines this week: [Deliverables due]
   
   ## 📈 Activity Metrics
   - Channels with highest activity: [Top 3 with message counts]
   - Your mention frequency: [How often you were referenced]
   - Key contributors in your absence: [People who drove discussions]
   
   ## 🔗 Important Links
   - Must-read Slack threads: [Links with descriptions]
   - Updated Vault documents: [Pages that changed]
   - PRs needing attention: [If applicable]
   ```

7. **Quality Checks**:
   - Verify all dates are correctly calculated
   - Ensure all mentioned projects have been analyzed
   - Confirm Slack summaries were generated for each project channel
   - Include links to source materials where possible

Error Handling:
- If no time period specified, default to "last week" and inform user
- If projects can't be determined, ask user to specify project names
- If Slack channels are missing from project info, attempt to infer from project name
- If rate limited on Slack API, notify user and continue with available data