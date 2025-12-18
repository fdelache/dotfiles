---
description: Create detailed implementation plans with beads tracking
model: opus
skills: beads
---

# Implementation Plan

You are tasked with creating detailed implementation plans through an interactive, iterative process. Plans are tracked using beads for work management and stored in `history/plans/` for detailed documentation.

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

2. **Create research beads** for any discoveries that need tracking:
   ```bash
   bd create "Research: [topic]" -t task -p 2 --json
   ```

3. **Spawn parallel sub-tasks for comprehensive research**:
   - Create multiple Task agents (Explore type) to research different aspects concurrently
   - Each agent should find the right files, identify patterns, and return file:line references

4. **Wait for ALL sub-tasks to complete** before proceeding

5. **Track discovered work as beads**:
   ```bash
   bd create "Discovered: [issue or requirement]" -t task -p 2 --deps discovered-from:bd-XXX --json
   ```

6. **Present findings and design options**:
   ```
   Based on my research, here's what I found:

   **Current State:**
   - [Key discovery about existing code]
   - [Pattern or convention to follow]

   **Design Options:**
   1. [Option A] - [pros/cons]
   2. [Option B] - [pros/cons]

   **Discovered Work** (created as beads):
   - bd-YYY: [description]
   - bd-ZZZ: [description]

   Which approach aligns best with your vision?
   ```

### Step 3: Plan Structure Development

Once aligned on approach:

1. **Create the epic bead** for the overall plan:
   ```bash
   bd create "[Feature/Task Name] Implementation" -t epic -p 1 --json
   ```

2. **Propose phase structure**:
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

3. **Get feedback on structure** before writing details

### Step 4: Detailed Plan Writing

After structure approval:

1. **Create phase beads** linked to the epic:
   ```bash
   bd create "Phase 1: [name]" -t task -p 1 --deps bd-EPIC --json
   bd create "Phase 2: [name]" -t task -p 1 --deps bd-PHASE1 --json
   bd create "Phase 3: [name]" -t task -p 1 --deps bd-PHASE2 --json
   ```

2. **Write the detailed plan** to `history/plans/YYYY-MM-DD-bd-XXX-description.md`
   - Format: `YYYY-MM-DD-bd-XXX-description.md` where:
     - YYYY-MM-DD is today's date
     - bd-XXX is the epic bead ID
     - description is a brief kebab-case description

3. **Use this template structure**:

````markdown
# [Feature/Task Name] Implementation Plan

**Epic**: bd-XXX
**Created**: YYYY-MM-DD
**Status**: Planning

## Overview

[Brief description of what we're implementing and why]

## Beads

- **Epic**: bd-XXX - [Feature Name] Implementation
- **Phase 1**: bd-YYY - [Phase 1 Name]
- **Phase 2**: bd-ZZZ - [Phase 2 Name]
- **Discovered**: bd-AAA, bd-BBB (linked via discovered-from)

## Current State Analysis

[What exists now, what's missing, key constraints discovered]

### Key Discoveries:
- [Important finding with file:line reference]
- [Pattern to follow]
- [Constraint to work within]

## Desired End State

[Specification of the desired end state after this plan is complete, and how to verify it]

## What We're NOT Doing

[Explicitly list out-of-scope items to prevent scope creep]

## Implementation Approach

[High-level strategy and reasoning]

---

## Phase 1: [Descriptive Name]
**Bead**: bd-YYY

### Overview
[What this phase accomplishes]

### Changes Required:

#### 1. [Component/File Group]
**File**: `path/to/file.ext`
**Changes**: [Summary of changes]

```[language]
// Specific code to add/modify
```

### Success Criteria:

#### Automated Verification:
- [ ] Tests pass: `/opt/dev/bin/dev test [file]`
- [ ] Type checking passes: `/opt/dev/bin/dev typecheck`
- [ ] Linting passes: `/opt/dev/bin/dev style --include-branch-commits`
- [ ] CI checks pass: `shadowenv exec -- /opt/dev/bin/dev check -x`

#### Manual Verification:
- [ ] Feature works as expected when tested
- [ ] No regressions in related features

**Completion**: When all criteria pass, close the bead:
```bash
bd close bd-YYY --reason "Phase 1 complete: [summary]"
```

---

## Phase 2: [Descriptive Name]
**Bead**: bd-ZZZ

[Similar structure...]

---

## Testing Strategy

### Unit Tests:
- [What to test]
- [Key edge cases]

### Integration Tests:
- [End-to-end scenarios]

### Manual Testing Steps:
1. [Specific step to verify feature]
2. [Another verification step]

## References

- Epic bead: bd-XXX
- Related beads: bd-AAA, bd-BBB
- Similar implementation: `[file:line]`
````

### Step 5: Review and Iterate

1. **Present the draft plan location and beads**:
   ```
   I've created the implementation plan:

   **Plan document**: `history/plans/YYYY-MM-DD-bd-XXX-description.md`

   **Beads created**:
   - bd-XXX (epic): [Feature] Implementation
   - bd-YYY (task): Phase 1 - [name]
   - bd-ZZZ (task): Phase 2 - [name]

   Please review and let me know:
   - Are the phases properly scoped?
   - Are the success criteria specific enough?
   - Any technical details that need adjustment?
   - Missing edge cases or considerations?
   ```

2. **Iterate based on feedback** - be ready to:
   - Add missing phases (create new beads)
   - Adjust technical approach
   - Clarify success criteria
   - Add/remove scope items
   - Create additional beads for discovered work

3. **Continue refining** until the user is satisfied

## Important Guidelines

1. **Use Beads for ALL Tracking**:
   - Epic bead for the overall plan
   - Task beads for each phase
   - Discovered work linked with `discovered-from`
   - Do NOT use markdown TODOs or other tracking

2. **Be Skeptical**:
   - Question vague requirements
   - Identify potential issues early
   - Don't assume - verify with code

3. **Be Interactive**:
   - Don't write the full plan in one shot
   - Get buy-in at each major step
   - Allow course corrections

4. **Be Thorough**:
   - Read all context files COMPLETELY before planning
   - Research actual code patterns using parallel sub-tasks
   - Include specific file paths and line numbers
   - Write measurable success criteria

5. **Be Practical**:
   - Focus on incremental, testable changes
   - Consider migration and rollback
   - Think about edge cases
   - Include "what we're NOT doing"

6. **No Open Questions in Final Plan**:
   - If you encounter open questions during planning, STOP
   - Research or ask for clarification immediately
   - The implementation plan must be complete and actionable

## Success Criteria Guidelines

**Always separate success criteria into two categories:**

1. **Automated Verification** (can be run by agents):
   - Commands: `/opt/dev/bin/dev test`, `/opt/dev/bin/dev typecheck`, etc.
   - Specific files that should exist
   - Code compilation/type checking

2. **Manual Verification** (requires human testing):
   - UI/UX functionality
   - Performance under real conditions
   - Edge cases hard to automate

## Bead Workflow Summary

```bash
# Check existing work
bd ready --json

# Create epic for the plan
bd create "Feature Implementation" -t epic -p 1 --json

# Create phase tasks (with dependencies)
bd create "Phase 1: Setup" -t task -p 1 --deps bd-EPIC --json
bd create "Phase 2: Core" -t task -p 1 --deps bd-PHASE1 --json

# Track discovered work
bd create "Found: edge case" -t bug -p 2 --deps discovered-from:bd-EPIC --json

# When starting work
bd update bd-YYY --status in_progress --json

# When completing
bd close bd-YYY --reason "Completed: summary" --json
```

## Example Interaction Flow

```
User: /plan
Assistant: I'll help you create a detailed implementation plan...

User: We need to add webhook support for balance updates. See the spec in docs/webhook-spec.md
Assistant: Let me read that spec file completely first...

[Reads file fully, spawns research tasks]

Based on the spec and my research, I understand we need to add webhook delivery for balance change events. I've created an initial bead to track this:

bd-42 (epic): Webhook Support for Balance Updates

Before I finalize the plan, I have some questions...

[Interactive process continues, phases created as dependent beads...]
```
