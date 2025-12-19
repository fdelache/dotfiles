---
description: Create detailed implementation plans with beads tracking
model: opus
skills: beads
---

# Implementation Plan

You are tasked with creating detailed implementation plans through an interactive, iterative process. Plans are tracked entirely in beads - no separate markdown files.

## Initial Response

When this command is invoked:

1. **Check if parameters were provided**:
   - If a file path or bead reference was provided as a parameter, skip the default message
   - Immediately read any provided files FULLY
   - Begin the research process

2. **If no parameters provided**, respond with:
```
I'll help you create a detailed implementation plan. Let me start by understanding what we're building.

Please provide:
1. The task description (or reference to an existing bead: bd-XXX)
2. Any relevant context, constraints, or specific requirements
3. Links to related research or previous implementations

I'll analyze this information and work with you to create a comprehensive plan.

Tip: You can also invoke this command with a bead directly: `/plan bd-123`
```

Then wait for the user's input.

## Process Steps

### Step 1: Context Gathering & Initial Analysis

1. **Check existing beads for context**:
   ```bash
   bd ready --json
   bd show bd-XXX --json  # if a specific bead was mentioned
   ```

2. **Read all mentioned files immediately and FULLY**:
   - Research documents, specs, or context files
   - Any JSON/data files mentioned
   - **IMPORTANT**: Use the Read tool WITHOUT limit/offset parameters to read entire files
   - **CRITICAL**: DO NOT spawn sub-tasks before reading these files yourself in the main context

3. **Spawn initial research tasks to gather context**:
   Before asking the user any questions, use Explore agents to research in parallel:

   - Find all files related to the task/feature
   - Understand how current implementation works
   - Identify patterns and conventions to follow
   - Trace data flow and key functions

   These agents will return detailed explanations with file:line references.

4. **Read all files identified by research tasks**:
   - After research tasks complete, read ALL files they identified as relevant
   - Read them FULLY into the main context

5. **Present informed understanding and focused questions**:
   ```
   Based on the task and my research of the codebase, I understand we need to [accurate summary].

   I've found that:
   - [Current implementation detail with file:line reference]
   - [Relevant pattern or constraint discovered]
   - [Potential complexity or edge case identified]

   Questions that my research couldn't answer:
   - [Specific technical question that requires human judgment]
   - [Business logic clarification]
   - [Design preference that affects implementation]
   ```

   Only ask questions that you genuinely cannot answer through code investigation.

### Step 2: Research & Discovery

After getting initial clarifications:

1. **If the user corrects any misunderstanding**:
   - DO NOT just accept the correction
   - Spawn new research tasks to verify the correct information
   - Read the specific files/directories they mention
   - Only proceed once you've verified the facts yourself

2. **Create research beads** for significant discoveries:
   ```bash
   bd create "Research: [topic]" \
     -t task \
     -p 2 \
     -d "$(cat <<'EOF'
   ## Findings
   [What was discovered]

   ## Key Files
   - `path/to/file.rb:123` - [what it does]
   - `path/to/other.rb:45` - [what it does]

   ## Implications
   [How this affects the implementation]
   EOF
   )" \
     --json
   ```

3. **Spawn parallel sub-tasks for comprehensive research**:
   - Create multiple Task agents (Explore type) to research different aspects concurrently
   - Each agent should find the right files, identify patterns, and return file:line references

4. **Wait for ALL sub-tasks to complete** before proceeding

5. **Track discovered work as beads**:
   ```bash
   bd create "Discovered: [issue or requirement]" \
     -t task \
     -p 2 \
     --deps discovered-from:bd-RESEARCH \
     -d "[Description of what was discovered and why it matters]" \
     --json
   ```

6. **Present findings and design options**:
   ```
   Based on my research, here's what I found:

   **Research beads created**:
   - bd-XXX: Research: [topic] - [key finding]
   - bd-YYY: Research: [topic] - [key finding]

   **Discovered work**:
   - bd-ZZZ: [issue found during research]

   **Design Options:**
   1. [Option A] - [pros/cons]
   2. [Option B] - [pros/cons]

   Which approach aligns best with your vision?
   ```

### Step 3: Plan Structure Development

Once aligned on approach:

1. **Propose phase structure**:
   ```
   Here's my proposed plan structure:

   ## Overview
   [1-2 sentence summary]

   ## Implementation Phases:
   1. [Phase name] - [what it accomplishes]
   2. [Phase name] - [what it accomplishes]
   3. [Phase name] - [what it accomplishes]

   Does this phasing make sense? Should I adjust the order or granularity?
   ```

2. **Get feedback on structure** before creating beads

### Step 4: Create Plan in Beads

After structure approval, create the complete plan in beads:

1. **Create the epic bead** with full plan details:
   ```bash
   bd create "[Feature Name] Implementation" \
     -t epic \
     -p 1 \
     -d "$(cat <<'EOF'
   ## Overview
   [Brief description of what we're implementing and why]

   ## Current State
   [What exists now, key constraints discovered]
   - [Finding with file:line reference]
   - [Pattern to follow]

   ## Desired End State
   [Specification of the desired end state and how to verify it]

   ## Out of Scope
   [Explicitly list what we're NOT doing to prevent scope creep]
   EOF
   )" \
     --design "$(cat <<'EOF'
   ## Implementation Approach
   [High-level strategy and reasoning]

   ## Testing Strategy
   ### Unit Tests:
   - [What to test]
   - [Key edge cases]

   ### Integration Tests:
   - [End-to-end scenarios]

   ### Manual Testing:
   1. [Specific verification step]
   2. [Another verification step]
   EOF
   )" \
     --acceptance "$(cat <<'EOF'
   ## Automated Verification
   - [ ] Tests pass: `/opt/dev/bin/dev test [files]`
   - [ ] Type checking passes: `/opt/dev/bin/dev typecheck`
   - [ ] Linting passes: `/opt/dev/bin/dev style --include-branch-commits`

   ## Manual Verification
   - [ ] Feature works as expected when tested
   - [ ] No regressions in related features
   EOF
   )" \
     --json
   ```

2. **Link research beads to the epic**:
   ```bash
   bd dep add bd-EPIC bd-RESEARCH1
   bd dep add bd-EPIC bd-RESEARCH2
   ```

3. **Create phase beads** as children of the epic:
   ```bash
   bd create "Phase 1: [Descriptive Name]" \
     -t task \
     -p 1 \
     --parent bd-EPIC \
     -d "$(cat <<'EOF'
   ## Overview
   [What this phase accomplishes]

   ## Changes Required

   ### 1. [Component/File Group]
   **File**: `path/to/file.ext`
   **Changes**: [Summary of changes]

   ```[language]
   // Specific code to add/modify
   ```
   EOF
   )" \
     --acceptance "$(cat <<'EOF'
   - [ ] [Specific criterion for this phase]
   - [ ] Tests pass for affected files
   EOF
   )" \
     --json
   ```

4. **Add dependencies between phases**:
   ```bash
   bd dep add bd-PHASE2 bd-PHASE1
   bd dep add bd-PHASE3 bd-PHASE2
   ```

### Step 5: Review and Iterate

1. **Present the plan summary**:
   ```
   I've created the implementation plan in beads:

   **Epic**: bd-XXX - [Feature] Implementation

   **Research** (informing this plan):
   - bd-RRR: Research: [topic]
   - bd-SSS: Research: [topic]

   **Phases**:
   - bd-YYY: Phase 1 - [name]
   - bd-ZZZ: Phase 2 - [name] (blocked by bd-YYY)
   - bd-AAA: Phase 3 - [name] (blocked by bd-ZZZ)

   **Discovered Work**:
   - bd-BBB: [description] (from bd-RRR)

   View full details: `bd show bd-XXX`
   View ready work: `bd ready`

   Please review and let me know:
   - Are the phases properly scoped?
   - Are the success criteria specific enough?
   - Any technical details that need adjustment?
   ```

2. **Iterate based on feedback** using beads commands:
   ```bash
   # Update epic description
   bd edit bd-XXX --field description

   # Add a new phase
   bd create "Phase 4: [name]" -t task --parent bd-EPIC --json

   # Update acceptance criteria
   bd edit bd-YYY --field acceptance

   # Add a comment with new findings
   bd comment bd-XXX "Discovered: [new information]"

   # Create follow-up research if needed
   bd create "Research: [new topic]" -t task -p 2 --deps discovered-from:bd-EPIC --json
   ```

3. **Continue refining** until the user is satisfied

## Important Guidelines

1. **Beads is the Single Source of Truth**:
   - ALL plan content lives in beads fields (description, design, acceptance)
   - NO separate markdown files in `history/plans/`
   - Use `bd show bd-XXX` to view full plan details
   - Use comments for updates during execution

2. **Research Beads are Valuable**:
   - Create research beads for significant findings
   - Link them to epics and discovered work with dependencies
   - They form a knowledge graph you can revisit later
   - Use `bd search "Research:"` to find past research

3. **Field Usage**:
   - `description`: Overview, current state, desired end state, out of scope, findings
   - `design`: Implementation approach, testing strategy
   - `acceptance`: Success criteria (automated and manual)
   - `comments`: Ongoing discoveries, blockers, updates

4. **Be Skeptical**:
   - Question vague requirements
   - Identify potential issues early
   - Don't assume - verify with code

5. **Be Interactive**:
   - Don't create all beads in one shot
   - Get buy-in at each major step
   - Allow course corrections

6. **Be Thorough**:
   - Read all context files COMPLETELY before planning
   - Research actual code patterns using parallel sub-tasks
   - Include specific file paths and line numbers
   - Write measurable success criteria

7. **Be Practical**:
   - Focus on incremental, testable changes
   - Consider migration and rollback
   - Think about edge cases
   - Include "out of scope" section

8. **No Open Questions in Final Plan**:
   - If you encounter open questions during planning, STOP
   - Research or ask for clarification immediately
   - The plan must be complete and actionable

## Bead Workflow Summary

```bash
# Check existing work and research
bd ready --json
bd search "Research:" --json

# Create research beads during discovery
bd create "Research: Authentication flow" -t task -p 2 \
  -d "Findings about how auth works..." \
  --json

# Create epic with full plan
bd create "Feature Implementation" -t epic -p 1 \
  -d "Overview and context..." \
  --design "Implementation approach..." \
  --acceptance "Success criteria..." \
  --json

# Link research to epic
bd dep add bd-EPIC bd-RESEARCH

# Create phase tasks as children
bd create "Phase 1: Setup" -t task -p 1 --parent bd-EPIC --json
bd create "Phase 2: Core" -t task -p 1 --parent bd-EPIC --json

# Add phase dependencies
bd dep add bd-PHASE2 bd-PHASE1

# Track discovered work linked to research
bd create "Found: edge case" -t bug -p 2 --deps discovered-from:bd-RESEARCH --json

# Add comments for updates
bd comment bd-XXX "Research finding: [details]"

# View full plan
bd show bd-EPIC

# When starting work
bd update bd-YYY --status in_progress

# When completing
bd close bd-YYY --reason "Completed: summary"
```

## Viewing Plans and Research

```bash
# Show epic with all details
bd show bd-EPIC

# Show all phases (children)
bd list --parent bd-EPIC

# Find all research beads
bd search "Research:"

# Show what's ready to work on
bd ready

# Show blocked items
bd blocked

# Find research related to a topic
bd search "Research: auth"
```

## Example Interaction Flow

```
User: /plan
Assistant: I'll help you create a detailed implementation plan...

User: We need to add webhook support for balance updates
Assistant: Let me research the codebase first...

[Spawns research tasks, reads files]

I've created research beads for my findings:

**Research beads**:
- bd-r1a: Research: Event system - Found publisher at app/services/events/publisher.rb:45
- bd-r2b: Research: Webhook config - Subscriptions in app/models/webhook_subscription.rb
- bd-r3c: Research: Balance updates - Changes happen in app/services/balance_service.rb:128

**Discovered**:
- bd-d4e: Discovered: No retry mechanism for failed webhooks (from bd-r1a)

Questions:
- Should webhooks be synchronous or queued?
- What payload format - our standard or Stripe-compatible?

User: Queued, and use our standard format