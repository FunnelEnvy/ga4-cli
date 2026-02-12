# ga4-cli

[![npm version](https://img.shields.io/npm/v/@funnelenvy/ga4-cli.svg)](https://www.npmjs.com/package/@funnelenvy/ga4-cli)
[![CI](https://github.com/FunnelEnvy/ga4-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/FunnelEnvy/ga4-cli/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Command-line interface for Google Analytics 4 — run reports, manage properties, and query realtime data from your terminal.

## Install

```bash
npm install -g @funnelenvy/ga4-cli
```

## Quick Start

```bash
# Authenticate with Google (OAuth2)
ga4 auth login --client-id YOUR_CLIENT_ID --client-secret YOUR_CLIENT_SECRET

# Or use a service account
ga4 auth login --service-account /path/to/service-account-key.json

# List your GA4 properties
ga4 properties list --output table

# Run a report
ga4 reports run --property-id 123456 --metrics activeUsers,sessions \
  --dimensions city,country --start-date 7daysAgo --end-date today --output table

# Check realtime active users
ga4 realtime run --property-id 123456 --metrics activeUsers --dimensions city --output table
```

## Authentication

ga4-cli supports two authentication methods:

### OAuth2 (Interactive)

Requires a Google Cloud project with the Analytics API enabled and an OAuth2 client ID:

```bash
# Via flags
ga4 auth login --client-id YOUR_CLIENT_ID --client-secret YOUR_CLIENT_SECRET

# Via environment variables
export GA4_CLIENT_ID=your_client_id
export GA4_CLIENT_SECRET=your_client_secret
ga4 auth login
```

### Service Account

```bash
ga4 auth login --service-account /path/to/key.json
```

### Access Token (Direct)

For scripting or CI/CD, pass a token directly:

```bash
export GA4_ACCESS_TOKEN=your_token
ga4 properties list

# Or via flag
ga4 properties list --access-token your_token
```

### Check Auth Status

```bash
ga4 auth status
ga4 auth logout
```

Credentials are stored at `~/.config/ga4-cli/config.json`.

## Command Reference

### `ga4 auth`

| Command | Description |
|---------|-------------|
| `ga4 auth login` | Authenticate via OAuth2 or service account |
| `ga4 auth status` | Show current authentication status |
| `ga4 auth logout` | Remove stored credentials |

### `ga4 properties`

| Command | Description |
|---------|-------------|
| `ga4 properties list` | List GA4 properties accessible to the authenticated user |
| `ga4 properties get --property-id <id>` | Get details of a specific property |

Options: `--filter`, `--page-size`, `--page-token`

### `ga4 reports`

| Command | Description |
|---------|-------------|
| `ga4 reports run` | Run a report on a GA4 property |

```bash
ga4 reports run \
  --property-id 123456 \
  --metrics activeUsers,sessions,bounceRate \
  --dimensions city,country \
  --start-date 2024-01-01 \
  --end-date 2024-01-31 \
  --limit 50 \
  --order-by -activeUsers \
  --output table
```

Options: `--metrics` (required), `--start-date` (required), `--end-date` (required), `--dimensions`, `--limit`, `--offset`, `--order-by`

### `ga4 realtime`

| Command | Description |
|---------|-------------|
| `ga4 realtime run` | Run a realtime report on a GA4 property |

```bash
ga4 realtime run \
  --property-id 123456 \
  --metrics activeUsers \
  --dimensions city \
  --output table
```

Options: `--metrics` (required), `--dimensions`, `--limit`

### `ga4 dimensions`

| Command | Description |
|---------|-------------|
| `ga4 dimensions list --property-id <id>` | List available dimensions |

Options: `--category`, `--custom-only`

### `ga4 metrics`

| Command | Description |
|---------|-------------|
| `ga4 metrics list --property-id <id>` | List available metrics |

Options: `--category`, `--custom-only`

## Output Formats

All data-returning commands support `--output` / `-o`:

- `json` (default) — machine-readable, pipe-friendly
- `table` — human-readable aligned columns
- `csv` — for spreadsheet/data pipeline use

Additional flags:
- `--quiet` / `-q` — suppress non-essential output

## Configuration

Config file location: `~/.config/ga4-cli/config.json`

```json
{
  "auth": {
    "oauth_token": "...",
    "oauth_refresh_token": "...",
    "oauth_expires_at": 1234567890,
    "client_id": "...",
    "client_secret": "..."
  },
  "defaults": {
    "output": "table",
    "property_id": "123456"
  }
}
```

## Development

```bash
git clone https://github.com/FunnelEnvy/ga4-cli.git
cd ga4-cli
pnpm install
pnpm run build
pnpm run test
pnpm run typecheck
pnpm run lint
```

## Part of Marketing CLIs

This tool is part of [Marketing CLIs](https://github.com/FunnelEnvy/marketing-clis) — open source CLIs for marketing tools that lack them. All CLIs share consistent auth, output formatting, and error handling patterns.

## License

MIT
