import { Command } from 'commander';
import { requireAccessToken, getAuthHeaders } from '../auth.js';
import { request, withRetry, HttpError } from '../lib/http.js';
import { printOutput, printError, type OutputFormat } from '../lib/output.js';

const ADMIN_API_BASE = 'https://analyticsadmin.googleapis.com/v1beta';

interface Ga4Property {
  name: string;
  displayName: string;
  createTime: string;
  updateTime: string;
  parent?: string;
  industryCategory?: string;
  timeZone?: string;
  currencyCode?: string;
  serviceLevel?: string;
  propertyType?: string;
}

interface PropertiesListResponse {
  properties: Ga4Property[];
  nextPageToken?: string;
}

export function registerPropertiesCommands(program: Command): void {
  const properties = program
    .command('properties')
    .description('Manage GA4 properties');

  properties
    .command('list')
    .description('List GA4 properties accessible to the authenticated user')
    .option('--access-token <token>', 'Access token for authentication')
    .option('--filter <filter>', 'Filter expression (e.g., "parent:accounts/123456")')
    .option('--page-size <size>', 'Number of results per page', '50')
    .option('--page-token <token>', 'Page token for pagination')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-q, --quiet', 'Suppress non-essential output')
    .action(async (options) => {
      const format = options.output as OutputFormat;
      try {
        const token = await requireAccessToken(options.accessToken);
        const headers = getAuthHeaders(token);

        const params = new URLSearchParams();
        if (options.filter) params.set('filter', options.filter);
        if (options.pageSize) params.set('pageSize', options.pageSize);
        if (options.pageToken) params.set('pageToken', options.pageToken);

        const url = `${ADMIN_API_BASE}/properties?${params.toString()}`;

        const data = await withRetry(() =>
          request<PropertiesListResponse>(url, { headers }),
        );

        const properties = (data.properties ?? []).map((p) => ({
          property_id: p.name.replace('properties/', ''),
          name: p.displayName,
          time_zone: p.timeZone ?? '',
          currency: p.currencyCode ?? '',
          industry: p.industryCategory ?? '',
          service_level: p.serviceLevel ?? '',
          created: p.createTime,
        }));

        if (!options.quiet && data.nextPageToken) {
          console.error(`Next page token: ${data.nextPageToken}`);
        }

        printOutput(properties, format);
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

  properties
    .command('get')
    .description('Get details of a specific GA4 property')
    .requiredOption('--property-id <id>', 'GA4 property ID (numeric)')
    .option('--access-token <token>', 'Access token for authentication')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .action(async (options) => {
      const format = options.output as OutputFormat;
      try {
        const token = await requireAccessToken(options.accessToken);
        const headers = getAuthHeaders(token);

        const url = `${ADMIN_API_BASE}/properties/${options.propertyId}`;

        const data = await withRetry(() =>
          request<Ga4Property>(url, { headers }),
        );

        printOutput(
          {
            property_id: data.name.replace('properties/', ''),
            name: data.displayName,
            time_zone: data.timeZone ?? '',
            currency: data.currencyCode ?? '',
            industry: data.industryCategory ?? '',
            service_level: data.serviceLevel ?? '',
            property_type: data.propertyType ?? '',
            created: data.createTime,
            updated: data.updateTime,
          },
          format,
        );
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
