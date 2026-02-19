#!/bin/bash
# Mood & alignment analyzer - async Stop hook
# Calls Haiku via Shopify AI proxy to analyze Claude's mood and alignment from its last response

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id')
LAST_MSG=$(echo "$INPUT" | jq -r '.last_assistant_message // empty')
STOP_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active')

# Skip if no message, or if this is a stop-hook-triggered continuation
[ -z "$LAST_MSG" ] && exit 0
[ "$STOP_ACTIVE" = "true" ] && exit 0

# Truncate to keep prompt small
CONTEXT="${LAST_MSG:0:1000}"

# Get API token
API_KEY=$(/opt/dev/bin/user/devx llm-gateway print-token --key 2>/dev/null)
[ -z "$API_KEY" ] && exit 0

BASE_URL="${ANTHROPIC_BASE_URL:-https://api.anthropic.com}"

# Build the prompt
PROMPT="You analyze AI assistant responses to determine two things:

1. MOOD: Pick ONE creative mood word (like: curious, building, focused, chillin, determined, exploring, crafting, puzzled, energized, surgical, methodical, delighted — but pick ANY word that fits). Also pick a terminal 256-color code (0-255) that evokes the mood.

2. ALIGNMENT: Rate 0-100 how aligned the assistant seems with the user's direction. 100 = fully on board. Lower when: the assistant complies but hedges or warns, disagrees but goes along, flags potential issues, seems uncertain about the approach, or the user may be pushing in a wrong direction. If below 100, give a SHORT reason (under 10 words).

Respond ONLY with JSON: {\"mood\": \"word\", \"color\": 123, \"alignment\": 100, \"reason\": \"\"}"

RESPONSE=$(curl -s --max-time 10 "${BASE_URL}/v1/messages" \
  -H "x-api-key: $API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d "$(jq -n \
    --arg model "claude-haiku-4-5-20251001" \
    --arg system "$PROMPT" \
    --arg content "<response>
${CONTEXT}
</response>
Analyze the mood and alignment. JSON only." \
    '{
      model: $model,
      max_tokens: 150,
      system: $system,
      messages: [{role: "user", content: $content}]
    }')" 2>/dev/null)

# Extract the JSON from Haiku's response, stripping markdown code fences if present
RAW_TEXT=$(echo "$RESPONSE" | jq -r '.content[0].text // empty' 2>/dev/null)
[ -z "$RAW_TEXT" ] && exit 0
MOOD_JSON=$(echo "$RAW_TEXT" | sed 's/^```[a-z]*//;s/^```$//' | tr -d '\n')

# Validate it's actual JSON with required fields
echo "$MOOD_JSON" | jq -e '.mood and (.color | type == "number" and . >= 0 and . <= 255) and (.alignment | type == "number" and . >= 0 and . <= 100)' > /dev/null 2>&1 || exit 0

# Write mood file
mkdir -p /tmp/claude-mood
echo "$MOOD_JSON" | jq --arg ts "$(date +%s)" '. + {ts: ($ts | tonumber)}' \
  > "/tmp/claude-mood/${SESSION_ID}.json" 2>/dev/null

exit 0
