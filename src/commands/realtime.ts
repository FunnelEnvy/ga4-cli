import { Command } from 'commander';
import { requireAccessToken, getAuthHeaders } from '../auth.js';
import { request, withRetry, HttpError } from '../lib/http.js';
import { printOutput, printError, type OutputFormat } from '../lib/output.js';

const DATA_API_BASE = 'https://analyticsdata.googleapis.com/v1beta';

interface RunRealtimeReportRequest {
  dimensions?: Array<{ name: string }>;
  metrics: Array<{ name: string }>;
  limit?: number;
  dimensionFilter?: unknown;
  metricFilter?: unknown;
}

interface RunRealtimeReportResponse {
  dimensionHeaders: Array<{ name: string }>;
  metricHeaders: Array<{ name: string; type: string }>;
  rows: Array<{
    dimensionValues: Array<{ value: string }>;
    metricValues: Array<{ value: string }>;
  }>;
  rowCount: number;
}

export function registerRealtimeCommands(program: Command): void {
  const realtime = program
    .command('realtime')
    .description('Run realtime reports on GA4 properties');

  realtime
    .command('run')
    .description('Run a realtime report on a GA4 property')
    .requiredOption('--property-id <id>', 'GA4 property ID (numeric)')
    .requiredOption('--metrics <metrics>', 'Comma-separated metric names (e.g., "activeUsers")')
    .option('--dimensions <dims>', 'Comma-separated dimension names (e.g., "city,country")')
    .option('--limit <n>', 'Maximum number of rows to return', '100')
    .option('--access-token <token>', 'Access token for authentication')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-q, --quiet', 'Suppress non-essential output')
    .action(async (options) => {
      const format = options.output as OutputFormat;
      try {
        const token = await requireAccessToken(options.accessToken);
        const headers = getAuthHeaders(token);

        const metrics = options.metrics.split(',').map((m: string) => ({ name: m.trim() }));
        const dimensions = options.dimensions
          ? options.dimensions.split(',').map((d: string) => ({ name: d.trim() }))
          : undefined;

        const body: RunRealtimeReportRequest = {
          metrics,
          dimensions,
          limit: parseInt(options.limit),
        };

        const url = `${DATA_API_BASE}/properties/${options.propertyId}:runRealtimeReport`;

        const data = await withRetry(() =>
          request<RunRealtimeReportResponse>(url, {
            method: 'POST',
            headers,
            body,
          }),
        );

        const dimHeaders = data.dimensionHeaders?.map((h) => h.name) ?? [];
        const metricHeaders = data.metricHeaders?.map((h) => h.name) ?? [];

        const rows = (data.rows ?? []).map((row) => {
          const record: Record<string, string> = {};
          dimHeaders.forEach((name, i) => {
            record[name] = row.dimensionValues?.[i]?.value ?? '';
          });
          metricHeaders.forEach((name, i) => {
            record[name] = row.metricValues?.[i]?.value ?? '';
          });
          return record;
        });

        if (!options.quiet) {
          console.error(`Realtime rows: ${rows.length}`);
        }

        printOutput(rows, format);
      } catch (error) {
        if (error instanceof HttpError) {
          printError(
            { code: error.code, message: error.message, retry_after: error.retryAfter },
            format,
          );
          process.exit(1);
        }
        throw error;
      }
    });
}
