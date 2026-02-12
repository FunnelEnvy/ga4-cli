# GA4 CLI — Agent Reference

## Command Inventory

### Authentication

```
ga4 auth login --client-id <id> --client-secret <secret>
ga4 auth login --service-account <path>
ga4 auth status [-o json|table|csv]
ga4 auth logout
```

### Properties (Admin API)

```
ga4 properties list [--filter <expr>] [--page-size <n>] [--page-token <token>] [-o json|table|csv]
ga4 properties get --property-id <id> [-o json|table|csv]
```

### Reports (Data API)

```
ga4 reports run --property-id <id> --metrics <m1,m2> --start-date <date> --end-date <date> [--dimensions <d1,d2>] [--limit <n>] [--offset <n>] [--order-by <field>] [-o json|table|csv]
```

### Realtime Reports (Data API)

```
ga4 realtime run --property-id <id> --metrics <m1,m2> [--dimensions <d1,d2>] [--limit <n>] [-o json|table|csv]
```

### Dimensions Metadata

```
ga4 dimensions list --property-id <id> [--category <cat>] [--custom-only] [-o json|table|csv]
```

### Metrics Metadata

```
ga4 metrics list --property-id <id> [--category <cat>] [--custom-only] [-o json|table|csv]
```

## Auth Requirements

**OAuth2 (interactive):** Requires Google Cloud project with Analytics API enabled.
- Set `GA4_CLIENT_ID` and `GA4_CLIENT_SECRET` env vars, then run `ga4 auth login`
- Or pass `--client-id` and `--client-secret` flags

**Service Account:** Requires service account JSON key file.
- Run `ga4 auth login --service-account /path/to/key.json`

**Direct Token:** For scripting/CI.
- Set `GA4_ACCESS_TOKEN` env var
- Or pass `--access-token` flag on any command

**Token resolution order:** `--access-token` flag > `GA4_ACCESS_TOKEN` env > config file

## Common Workflows

### Get an overview of all properties

```bash
ga4 properties list --output table
```

### Run a traffic report for the last 7 days

```bash
ga4 reports run \
  --property-id 123456 \
  --metrics activeUsers,sessions,screenPageViews \
  --dimensions date \
  --start-date 7daysAgo \
  --end-date today \
  --output table
```

### Get top pages by pageviews

```bash
ga4 reports run \
  --property-id 123456 \
  --metrics screenPageViews \
  --dimensions pagePath \
  --start-date 30daysAgo \
  --end-date today \
  --order-by -screenPageViews \
  --limit 20 \
  --output table
```

### Check realtime active users by country

```bash
ga4 realtime run \
  --property-id 123456 \
  --metrics activeUsers \
  --dimensions country \
  --output table
```

### Export report data as CSV

```bash
ga4 reports run \
  --property-id 123456 \
  --metrics activeUsers,sessions \
  --dimensions city,country \
  --start-date 2024-01-01 \
  --end-date 2024-01-31 \
  --output csv > report.csv
```

### List available dimensions for a property

```bash
ga4 dimensions list --property-id 123456 --output table
ga4 metrics list --property-id 123456 --category Session --output table
```

## Output Format Notes

### JSON output (default)

All commands return arrays of flat objects:

```json
[
  {
    "city": "New York",
    "country": "United States",
    "activeUsers": "1234",
    "sessions": "5678"
  }
]
```

Report values are always strings (GA4 API returns strings for all values).

### Properties list JSON

```json
[
  {
    "property_id": "123456",
    "name": "My Website",
    "time_zone": "America/New_York",
    "currency": "USD",
    "industry": "TECHNOLOGY",
    "service_level": "GOOGLE_ANALYTICS_STANDARD",
    "created": "2024-01-01T00:00:00Z"
  }
]
```

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `AUTH_FAILED` | Invalid or expired credentials | Run `ga4 auth login` |
| `RATE_LIMITED` | API rate limit exceeded | Wait and retry (auto-retry built in) |
| `API_ERROR` | General API error | Check error message for details |

## Rate Limits

- Google Analytics Data API: 10 concurrent requests, 10,000 requests per day per project
- Auto-retry with exponential backoff on 429 responses
- Use `--quiet` to suppress retry status messages

## Date Formats

Reports support both absolute and relative dates:
- Absolute: `YYYY-MM-DD` (e.g., `2024-01-01`)
- Relative: `today`, `yesterday`, `NdaysAgo` (e.g., `7daysAgo`, `30daysAgo`)
