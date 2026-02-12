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
    customDefinition?: boolean;
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

export function registerDimensionsCommands(program: Command): void {
  const dimensions = program
    .command('dimensions')
    .description('List available GA4 dimensions');

  dimensions
    .command('list')
    .description('List all available dimensions for a GA4 property')
    .requiredOption('--property-id <id>', 'GA4 property ID (numeric)')
    .option('--category <category>', 'Filter by category')
    .option('--custom-only', 'Show only custom dimensions')
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

        let dims = data.dimensions ?? [];

        if (options.category) {
          dims = dims.filter(
            (d) => d.category.toLowerCase() === options.category.toLowerCase(),
          );
        }

        if (options.customOnly) {
          dims = dims.filter((d) => d.customDefinition);
        }

        const rows = dims.map((d) => ({
          api_name: d.apiName,
          ui_name: d.uiName,
          category: d.category,
          custom: d.customDefinition ? 'yes' : 'no',
          description: d.description,
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
