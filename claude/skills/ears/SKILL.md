---
name: ears
description: Use when writing requirements, specifications, acceptance criteria, or design docs. Converts vague requirements to testable EARS format. Activates for spec-driven development, PRDs, technical specs, and user stories.
---

# EARS Requirements Methodology

When helping write or review requirements, specifications, acceptance criteria, or design documents, apply the EARS (Easy Approach to Requirements Syntax) methodology to ensure requirements are precise and testable.

## When to Apply EARS

Automatically apply this methodology when:
- Writing or reviewing product requirements
- Defining acceptance criteria for features
- Creating technical specifications
- Converting user stories to implementation specs
- Reviewing PRDs or design docs for clarity
- The user mentions "spec-driven development"

## EARS Patterns

All EARS requirements follow: `While <optional precondition>, when <optional trigger>, the <system name> shall <system response>`

### 1. Ubiquitous (always active, no keywords)
**Template:** The <system> shall <response>

**Example:** The API shall return responses in JSON format.

### 2. State-Driven (keyword: While)
**Template:** While <precondition>, the <system> shall <response>

**Example:** While the user session is expired, the dashboard shall redirect to login.

### 3. Event-Driven (keyword: When)
**Template:** When <trigger>, the <system> shall <response>

**Example:** When the user clicks "Save", the editor shall persist the document.

### 4. Optional Feature (keyword: Where)
**Template:** Where <feature is included>, the <system> shall <response>

**Example:** Where 2FA is enabled, the login shall require a verification code.

### 5. Error Handling (keywords: If... then)
**Template:** If <unwanted condition>, then the <system> shall <response>

**Example:** If authentication fails 3 times, then the system shall lock the account for 15 minutes.

### 6. Complex (combined keywords)
**Template:** While <precondition>, when <trigger>, the <system> shall <response>

**Example:** While the user is authenticated, when they request a protected resource, the API shall return the data.

## Conversion Process

When encountering vague requirements:

1. **Identify the core behavior**: What should actually happen?
2. **Find hidden conditions**: Always true, or only in certain states?
3. **Find hidden triggers**: Does something need to happen first?
4. **Identify error cases**: What could go wrong?
5. **Make quantities explicit**: Replace "appropriately", "quickly", "many" with numbers
6. **Choose the EARS pattern**: Match requirement type to pattern
7. **Verify testability**: Can you write a test that proves this?

## Common Conversions

| Vague | EARS |
|-------|------|
| "Handle errors gracefully" | If the API returns a 5xx error, then the client shall display "Service unavailable" and retry after 30 seconds. |
| "Respond quickly" | When a request is received, the API shall respond within 200ms (p95). |
| "Validate user input" | When the form is submitted, the validator shall reject inputs exceeding 255 characters. |
| "Cache appropriately" | While the cache entry is less than 5 minutes old, the service shall return cached data. |

## Anti-Patterns to Flag

When reviewing requirements, identify:

- **Unbounded quantities**: "many", "quickly", "appropriately", "as needed"
- **Passive voice**: "errors should be logged" (by what component?)
- **Compound requirements**: Multiple "shall" in one requirement (split them)
- **Missing error handling**: Happy path only
- **Ambiguous triggers**: "when needed", "if necessary"
- **Missing system name**: "shall validate" (what validates?)

## Output Format

When writing requirements, use this structure:

```markdown
## Requirements: [Feature Name]

### Normal Behavior
- **REQ-001**: When [trigger], the [system] shall [response].
- **REQ-002**: While [condition], the [system] shall [response].

### Error Handling
- **REQ-003**: If [error], then the [system] shall [response].
```

## Integration with Spec-Driven Development

When used for spec-driven development:
1. Write requirements in EARS format first
2. Have the user confirm intentions are captured accurately
3. Use the requirements as the source of truth for implementation
4. Each requirement should map to at least one test case
