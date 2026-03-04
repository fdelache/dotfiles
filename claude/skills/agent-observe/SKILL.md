---
name: agent-observe
description: Use when querying Observe for errors, logs, traces, or metrics. Covers listing error groups, investigating specific errors by grouping hash, running Investigate queries across datasets, and executing PromQL metrics queries.
---

# agent-observe CLI

An Observe observability companion CLI for AI agents. Queries Shopify's Observe platform via the MCP endpoint for error groups, logs, traces, and metrics.

## Installation

```bash
npm install -g @shopify-internal/agent-observe
```

### Authentication

Authentication is automatic via the Shopify LLM Gateway token. No manual setup is needed if `devx` is available.

Alternatively, set `LLM_GATEWAY_TOKEN` environment variable (also accepts legacy `OBSERVE_MCP_TOKEN`).

## Commands

### Error Groups

```bash
# List top error groups (last 4 hours by default)
agent-observe errors list

# Filter by service and slice
agent-observe errors list --service shopify-production --slice admin-web

# Wider time range
agent-observe errors list --time now-1d

# Get details for a specific error group by grouping hash
agent-observe errors get 5508128240230791689
agent-observe errors get 5508128240230791689 --time now-1d
```

### Freeform Investigate Queries

```bash
# Count errors by slice
agent-observe query error-analytics-events --filter slice_name=admin-web --calc COUNT --time now-4h

# Top endpoints by request volume
agent-observe query core --filter name=http_request_finish --filter component=platform --breakdown entrypoint --calc COUNT

# Slowest endpoints by P95 duration
agent-observe query otel_traces --filter resource.service.name=shopify --filter kind=Server --calc P95:duration --breakdown name --limit 10

# Raw events (no aggregation)
agent-observe query error-analytics-events --filter grouping_hash_resolved=5508128240230791689 --raw --time now-7d

# Advanced: pass raw JSON query
agent-observe query error-analytics-events --query-json '{"filters":[{"column":"grouping_hash_resolved","op":"=","value":"123"}],"limit":1,"raw_data_mode":true}'
```

### Datasets

```bash
# List datasets and columns by signal type
agent-observe datasets error_analytics
agent-observe datasets logging
agent-observe datasets tracing
```

### Metrics (PromQL)

```bash
# Search for available metrics
agent-observe metrics search "request_duration"

# Instant query
agent-observe metrics query 'sum(rate(http_requests_total[5m]))'

# Range query
agent-observe metrics range 'sum(rate(http_requests_total[5m]))' --time now-4h --step 5m
```

## JSON Output

Every command supports structured output:

```bash
# JSON output (auto-detected when called by AI agents)
agent-observe errors list --output json

# JSON with field projection
agent-observe errors list --json groupingHash,errorClass,count

# Pipe through jq
agent-observe errors list --json --jq '.[0:5]'
```

## Common Workflows

### Investigate an error from its grouping hash
```bash
agent-observe errors get <hash>
```

### Find top errors for a team's slice
```bash
agent-observe errors list --slice <slice-name> --time now-1d
```

### Query request logs for an endpoint
```bash
agent-observe query core --filter name=http_request_finish --filter entrypoint=Admin::ProductsController#index --calc COUNT --time now-1h
```

### Check trace performance for a service
```bash
agent-observe query otel_traces --filter resource.service.name=shopify --filter kind=Server --calc P95:duration --breakdown name --limit 10
```

## Available Datasets

| Signal | Dataset | Description |
|--------|---------|-------------|
| error_analytics | error-analytics-events | Exception events with stack traces |
| logging | core | Core app logs (requests, jobs) |
| logging | catchall | Non-core service logs |
| logging | nginx | Web server logs |
| logging | edge | Cloudflare Edge logs |
| logging | sfr | Storefront renderer logs |
| tracing | otel_traces | OpenTelemetry distributed traces |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Failure or general error |
