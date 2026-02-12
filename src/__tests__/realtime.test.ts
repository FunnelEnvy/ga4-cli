import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import nock from 'nock';

const DATA_API_BASE = 'https://analyticsdata.googleapis.com';

describe('realtime commands', () => {
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

  describe('realtime run', () => {
    it('runs a realtime report', async () => {
      const mockResponse = {
        dimensionHeaders: [{ name: 'city' }],
        metricHeaders: [{ name: 'activeUsers', type: 'TYPE_INTEGER' }],
        rows: [
          {
            dimensionValues: [{ value: 'San Francisco' }],
            metricValues: [{ value: '42' }],
          },
          {
            dimensionValues: [{ value: 'New York' }],
            metricValues: [{ value: '38' }],
          },
        ],
        rowCount: 2,
      };

      const scope = nock(DATA_API_BASE)
        .post('/v1beta/properties/123456:runRealtimeReport', (body) => {
          return body.metrics?.length === 1 && body.metrics[0].name === 'activeUsers';
        })
        .matchHeader('authorization', 'Bearer test-token-123')
        .reply(200, mockResponse);

      const { request } = await import('../lib/http.js');
      const data = await request<typeof mockResponse>(
        `${DATA_API_BASE}/v1beta/properties/123456:runRealtimeReport`,
        {
          method: 'POST',
          headers: { Authorization: 'Bearer test-token-123' },
          body: {
            metrics: [{ name: 'activeUsers' }],
            dimensions: [{ name: 'city' }],
            limit: 100,
          },
        },
      );

      expect(data.rows).toHaveLength(2);
      expect(data.rows[0].dimensionValues[0].value).toBe('San Francisco');
      expect(data.rows[0].metricValues[0].value).toBe('42');
      expect(scope.isDone()).toBe(true);
    });

    it('runs a realtime report without dimensions', async () => {
      const mockResponse = {
        dimensionHeaders: [],
        metricHeaders: [{ name: 'activeUsers', type: 'TYPE_INTEGER' }],
        rows: [
          {
            dimensionValues: [],
            metricValues: [{ value: '150' }],
          },
        ],
        rowCount: 1,
      };

      const scope = nock(DATA_API_BASE)
        .post('/v1beta/properties/123456:runRealtimeReport')
        .reply(200, mockResponse);

      const { request } = await import('../lib/http.js');
      const data = await request<typeof mockResponse>(
        `${DATA_API_BASE}/v1beta/properties/123456:runRealtimeReport`,
        {
          method: 'POST',
          headers: { Authorization: 'Bearer test-token-123' },
          body: {
            metrics: [{ name: 'activeUsers' }],
            limit: 100,
          },
        },
      );

      expect(data.rows).toHaveLength(1);
      expect(data.rows[0].metricValues[0].value).toBe('150');
      expect(scope.isDone()).toBe(true);
    });
  });
});
