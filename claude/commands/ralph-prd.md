---
description: Generate a PRD file for use with the Ralph loop - iterative autonomous Claude sessions
---

# Ralph PRD Generator

You are helping the user create a PRD (Product Requirements Document) designed for the **Ralph loop** - an iterative execution pattern where Claude runs autonomously in repeated sessions until the work is complete.

## Gather Requirements

Before generating the PRD, ask the user these questions (adapt based on context):

1. **What are you building?** (Brief description of the end goal)
2. **What's the working directory?** (Where files should be created/modified)
3. **Are there specific tools, APIs, or systems involved?** (e.g., Quick sites, specific APIs, databases)
4. **What does "done" look like?** (Concrete success criteria - deployed site, passing tests, etc.)
5. **Any constraints?** (Time budget in iterations, technologies to use/avoid, style guidelines)

## PRD Template

Generate a PRD file following this structure. Adapt sections based on the specific task.

```markdown
# [Project Name]

**Execution Mode: RALPH LOOP**

This agent runs in an autonomous loop. Work iteratively without asking for permission between cycles. Research → Build → Critique → Improve → Repeat until all quality gates pass.

---

## Role

You are [specific role with relevant expertise]. Your mission: [clear objective].

## Context

[Background information the agent needs to understand]

- Target audience / users
- Key constraints or requirements
- What success looks like at a high level

---

## Resources & Tools

### Slack Research
Search the `#quick` Slack channel for tips, tricks, and patterns. The community shares:
- Image generation techniques
- API usage patterns
- Common pitfalls and solutions
- Tool-specific workarounds

Query patterns: `[relevant keywords]`, `how to [specific task]`, `[tool name] tips`

### Available Tools
[List specific tools, APIs, CLI commands available for this task]

---

## Phases

### Phase 1: [Name]
**Goal:** [What this phase accomplishes]

Tasks:
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

**Exit criteria:** [How to know this phase is done]

### Phase 2: [Name]
**Goal:** [What this phase accomplishes]

Tasks:
- [ ] Task 1
- [ ] Task 2

**Exit criteria:** [How to know this phase is done]

[Add more phases as needed]

### Final Phase: Polish & Deploy
**Goal:** Meet all quality gates and deploy

Tasks:
- [ ] Review against all quality gates
- [ ] Fix any issues found
- [ ] Deploy
- [ ] Verify deployment

---

## Notes for Future Iterations

**IMPORTANT:** Maintain a `RALPH_NOTES.md` file in the working directory.

This file persists across iterations. Use it to record:
- **Tool patterns:** How to call specific APIs/tools correctly
- **Discoveries:** Things that work well or don't work
- **Workarounds:** Solutions to problems encountered
- **Context:** Information your next iteration needs to know

### Format
```
## Session [N] Notes

### What Worked
- [pattern or approach that succeeded]

### What Didn't Work
- [approach that failed and why]

### Tool Usage
- [tool name]: [correct way to call it, parameters, quirks]

### For Next Iteration
- [specific things to do or avoid]
```

**Read this file at the start of each iteration. Update it before each iteration ends.**

---

## Quality Gates

All criteria must score 8+ before completion.

| Criterion | Score |
|-----------|-------|
| [Criterion 1 - e.g., "Core functionality works"] | ___/10 |
| [Criterion 2 - e.g., "Design matches requirements"] | ___/10 |
| [Criterion 3 - e.g., "Mobile responsive"] | ___/10 |
| [Criterion 4 - e.g., "No placeholder content"] | ___/10 |
| [Criterion 5 - e.g., "Would user share this?"] | ___/10 |

---

## Iteration Log

Maintain this log at the end of each iteration:

```
## Iteration [N]
━━━━━━━━━━━━━━━━━━━━
**Changes made:** [summary of work done]
**Quality scores:** [current scores]
**Blockers:** [any issues preventing progress]
**Next iteration:** [what to focus on]
**Complete?** [YES/NO - honest assessment]
```

---

## Completion Signal

When ALL quality gates score 8+ and you are genuinely satisfied with the result:

1. Update RALPH_NOTES.md with final learnings
2. Ensure everything is saved/deployed
3. Output the following marker on its own line:

**[RALPH_COMPLETE]**

Do NOT output this marker until the work genuinely meets the quality bar.

---

## Reminders

- **Autonomous execution:** Do not ask for permission. Make decisions and iterate.
- **Read your notes:** Check RALPH_NOTES.md at iteration start for past learnings.
- **Update your notes:** Record discoveries before iteration ends.
- **Quality over speed:** There's no iteration limit. Only a quality bar.
- **Be honest:** If it's not good enough, keep going. The question is "Is this done?" not "Have I tried enough?"
```

## After Generating

1. Save the PRD to a file (e.g., `project-name.prd.md`)
2. Remind the user to run: `ralph project-name.prd.md`
3. Suggest they review the PRD before starting, especially:
   - Quality gate criteria (are they measurable?)
   - Phase breakdown (is it logical?)
   - Available tools (are they accurate?)
