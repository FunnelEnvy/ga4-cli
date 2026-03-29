import { Command } from 'commander';
import { requireAccessToken, getAuthHeaders } from '../auth.js';
import { request, withRetry, HttpError } from '../lib/http.js';
import { printOutput, printError, type OutputFormat } from '../lib/output.js';

const DATA_API_BASE = 'https://analyticsdata.googleapis.com/v1beta';

interface RunReportRequest {
  dimensions?: Array<{ name: string }>;
  metrics: Array<{ name: string }>;
  dateRanges: Array<{ startDate: string; endDate: string }>;
  limit?: number;
  offset?: number;
  orderBys?: Array<{
    dimension?: { dimensionName: string; orderType?: string };
    metric?: { metricName: string };
    desc?: boolean;
  }>;
  dimensionFilter?: unknown;
  metricFilter?: unknown;
}

interface RunReportResponse {
  dimensionHeaders: Array<{ name: string }>;
  metricHeaders: Array<{ name: string; type: string }>;
  rows: Array<{
    dimensionValues: Array<{ value: string }>;
    metricValues: Array<{ value: string }>;
  }>;
  rowCount: number;
  metadata: {
    currencyCode?: string;
    timeZone?: string;
    samplingMetadatas?: Array<{
      samplesReadCount: string;
      samplingSpaceSize: string;
    }>;
    dataLossFromOtherRow?: boolean;
  };
}

export function registerReportsCommands(program: Command): void {
  const reports = program
    .command('reports')
    .description('Run GA4 reports');

  reports
    .command('run')
    .description('Run a report on a GA4 property')
    .requiredOption('--property-id <id>', 'GA4 property ID (numeric)')
    .requiredOption('--metrics <metrics>', 'Comma-separated metric names (e.g., "activeUsers,sessions")')
    .requiredOption('--start-date <date>', 'Start date (YYYY-MM-DD or relative: "7daysAgo", "30daysAgo", "yesterday")')
    .requiredOption('--end-date <date>', 'End date (YYYY-MM-DD or relative: "today", "yesterday")')
    .option('--dimensions <dims>', 'Comma-separated dimension names (e.g., "city,country")')
    .option('--limit <n>', 'Maximum number of rows to return', '100')
    .option('--offset <n>', 'Row offset for pagination', '0')
    .option('--order-by <field>', 'Field to order by (prefix with "-" for descending)')
    .option('--dimension-filter <json>', 'Dimension filter as JSON (GA4 REST API format)')
    .option('--metric-filter <json>', 'Metric filter as JSON (GA4 REST API format)')
    .option('--include-metadata', 'Include metadata envelope in output (rows, metadata, rowCount)')
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

        const body: RunReportRequest = {
          metrics,
          dimensions,
          dateRanges: [
            {
              startDate: options.startDate,
              endDate: options.endDate,
            },
          ],
          limit: parseInt(options.limit),
          offset: parseInt(options.offset),
        };

        if (options.dimensionFilter) {
          try {
            body.dimensionFilter = JSON.parse(options.dimensionFilter);
          } catch {
            console.error('Error: --dimension-filter must be valid JSON');
            process.exit(1);
          }
        }

        if (options.metricFilter) {
          try {
            body.metricFilter = JSON.parse(options.metricFilter);
          } catch {
            console.error('Error: --metric-filter must be valid JSON');
            process.exit(1);
          }
        }

        if (options.orderBy) {
          const desc = options.orderBy.startsWith('-');
          const fieldName = desc ? options.orderBy.slice(1) : options.orderBy;
          const isMetric = metrics.some((m: { name: string }) => m.name === fieldName);

          body.orderBys = [
            {
              ...(isMetric
                ? { metric: { metricName: fieldName } }
                : { dimension: { dimensionName: fieldName } }),
              desc,
            },
          ];
        }

        const url = `${DATA_API_BASE}/properties/${options.propertyId}:runReport`;

        const data = await withRetry(() =>
          request<RunReportResponse>(url, {
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
          console.error(`Rows returned: ${rows.length} (total: ${data.rowCount ?? rows.length})`);
        }

        if (options.includeMetadata) {
          printOutput(
            { rows, metadata: data.metadata ?? {}, rowCount: data.rowCount ?? rows.length },
            format,
          );
        } else {
          printOutput(rows, format);
        }
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
