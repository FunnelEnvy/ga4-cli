import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import nock from 'nock';

const DATA_API_BASE = 'https://analyticsdata.googleapis.com';

describe('metrics commands', () => {
  beforeAll(() => {
    nock.disableNetConnect();
    vi.stubEnv('GA4_ACCESS_TOKEN', 'test-token-123');
  });

  afterAll(() => {
    nock.enableNetConnect();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('metrics list', () => {
    it('fetches and lists metrics from metadata', async () => {
      const mockResponse = {
        name: 'properties/123456/metadata',
        dimensions: [],
        metrics: [
          {
            apiName: 'activeUsers',
            uiName: 'Active users',
            description: 'The number of distinct users who visited your site or app.',
            category: 'User',
            type: 'TYPE_INTEGER',
            customDefinition: false,
          },
          {
            apiName: 'sessions',
            uiName: 'Sessions',
            description: 'The number of sessions that began on your site or app.',
            category: 'Session',
            type: 'TYPE_INTEGER',
            customDefinition: false,
          },
          {
            apiName: 'bounceRate',
            uiName: 'Bounce rate',
            description: 'The percentage of sessions that were not engaged.',
            category: 'Session',
            type: 'TYPE_FLOAT',
            customDefinition: false,
          },
          {
            apiName: 'totalRevenue',
            uiName: 'Total revenue',
            description: 'The sum of revenue from purchases, subscriptions, and advertising.',
            category: 'Revenue',
            type: 'TYPE_CURRENCY',
            customDefinition: false,
          },
        ],
      };

      const scope = nock(DATA_API_BASE)
        .get('/v1beta/properties/123456/metadata')
        .matchHeader('authorization', 'Bearer test-token-123')
        .reply(200, mockResponse);

      const { request } = await import('../lib/http.js');
      const data = await request<typeof mockResponse>(
        `${DATA_API_BASE}/v1beta/properties/123456/metadata`,
        { headers: { Authorization: 'Bearer test-token-123' } },
      );

      expect(data.metrics).toHaveLength(4);
      expect(data.metrics[0].apiName).toBe('activeUsers');
      expect(data.metrics[0].type).toBe('TYPE_INTEGER');
      expect(data.metrics[2].type).toBe('TYPE_FLOAT');
      expect(scope.isDone()).toBe(true);
    });
  });
});
