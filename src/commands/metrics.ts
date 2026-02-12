import { Command } from 'commander';
import { requireAccessToken, getAuthHeaders } from '../auth.js';
import { request, withRetry, HttpError } from '../lib/http.js';
import { printOutput, printError, type OutputFormat } from '../lib/output.js';

const DATA_API_BASE = 'https://analyticsdata.googleapis.com/v1beta';

interface MetadataResponse {
  name: string;
  dimensions: Array<{
    apiName: string;
    uiName: string;
    description: string;
    category: string;
  }>;
  metrics: Array<{
    apiName: string;
    uiName: string;
    description: string;
    category: string;
    type: string;
    customDefinition?: boolean;
  }>;
}

export function registerMetricsCommands(program: Command): void {
  const metrics = program
    .command('metrics')
    .description('List available GA4 metrics');

  metrics
    .command('list')
    .description('List all available metrics for a GA4 property')
    .requiredOption('--property-id <id>', 'GA4 property ID (numeric)')
    .option('--category <category>', 'Filter by category')
    .option('--custom-only', 'Show only custom metrics')
    .option('--access-token <token>', 'Access token for authentication')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .action(async (options) => {
      const format = options.output as OutputFormat;
      try {
        const token = await requireAccessToken(options.accessToken);
        const headers = getAuthHeaders(token);

        const url = `${DATA_API_BASE}/properties/${options.propertyId}/metadata`;

        const data = await withRetry(() =>
          request<MetadataResponse>(url, { headers }),
        );

        let mets = data.metrics ?? [];

        if (options.category) {
          mets = mets.filter(
            (m) => m.category.toLowerCase() === options.category.toLowerCase(),
          );
        }

        if (options.customOnly) {
          mets = mets.filter((m) => m.customDefinition);
        }

        const rows = mets.map((m) => ({
          api_name: m.apiName,
          ui_name: m.uiName,
          category: m.category,
          type: m.type,
          custom: m.customDefinition ? 'yes' : 'no',
          description: m.description,
        }));

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
