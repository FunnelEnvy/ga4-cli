import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import nock from 'nock';

const DATA_API_BASE = 'https://analyticsdata.googleapis.com';

describe('reports commands', () => {
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

  describe('reports run', () => {
    it('runs a report with dimensions and metrics', async () => {
      const mockResponse = {
        dimensionHeaders: [{ name: 'city' }, { name: 'country' }],
        metricHeaders: [
          { name: 'activeUsers', type: 'TYPE_INTEGER' },
          { name: 'sessions', type: 'TYPE_INTEGER' },
        ],
        rows: [
          {
            dimensionValues: [{ value: 'New York' }, { value: 'United States' }],
            metricValues: [{ value: '1234' }, { value: '5678' }],
          },
          {
            dimensionValues: [{ value: 'London' }, { value: 'United Kingdom' }],
            metricValues: [{ value: '987' }, { value: '2345' }],
          },
        ],
        rowCount: 2,
        metadata: {
          currencyCode: 'USD',
          timeZone: 'America/New_York',
        },
      };

      const scope = nock(DATA_API_BASE)
        .post('/v1beta/properties/123456:runReport', (body) => {
          return (
            body.metrics?.length === 2 &&
            body.metrics[0].name === 'activeUsers' &&
            body.dimensions?.length === 2 &&
            body.dateRanges?.[0]?.startDate === '2024-01-01'
          );
        })
        .matchHeader('authorization', 'Bearer test-token-123')
        .reply(200, mockResponse);

      const { request } = await import('../lib/http.js');
      const data = await request<typeof mockResponse>(
        `${DATA_API_BASE}/v1beta/properties/123456:runReport`,
        {
          method: 'POST',
          headers: { Authorization: 'Bearer test-token-123' },
          body: {
            metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
            dimensions: [{ name: 'city' }, { name: 'country' }],
            dateRanges: [{ startDate: '2024-01-01', endDate: '2024-01-31' }],
            limit: 100,
            offset: 0,
          },
        },
      );

      expect(data.dimensionHeaders).toHaveLength(2);
      expect(data.metricHeaders).toHaveLength(2);
      expect(data.rows).toHaveLength(2);
      expect(data.rows[0].dimensionValues[0].value).toBe('New York');
      expect(data.rows[0].metricValues[0].value).toBe('1234');
      expect(scope.isDone()).toBe(true);
    });

    it('runs a report with metrics only (no dimensions)', async () => {
      const mockResponse = {
        dimensionHeaders: [],
        metricHeaders: [{ name: 'activeUsers', type: 'TYPE_INTEGER' }],
        rows: [
          {
            dimensionValues: [],
            metricValues: [{ value: '42000' }],
          },
        ],
        rowCount: 1,
        metadata: {},
      };

      const scope = nock(DATA_API_BASE)
        .post('/v1beta/properties/123456:runReport', (body) => {
          return body.metrics?.length === 1 && !body.dimensions;
        })
        .reply(200, mockResponse);

      const { request } = await import('../lib/http.js');
      const data = await request<typeof mockResponse>(
        `${DATA_API_BASE}/v1beta/properties/123456:runReport`,
        {
          method: 'POST',
          headers: { Authorization: 'Bearer test-token-123' },
          body: {
            metrics: [{ name: 'activeUsers' }],
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            limit: 100,
            offset: 0,
          },
        },
      );

      expect(data.rows).toHaveLength(1);
      expect(data.rows[0].metricValues[0].value).toBe('42000');
      expect(scope.isDone()).toBe(true);
    });

    it('handles API error response', async () => {
      nock(DATA_API_BASE)
        .post('/v1beta/properties/123456:runReport')
        .reply(400, {
          error: {
            code: 400,
            message: 'Invalid dimension name: "invalid_dim".',
            status: 'INVALID_ARGUMENT',
          },
        });

      const { request, HttpError } = await import('../lib/http.js');
      await expect(
        request(`${DATA_API_BASE}/v1beta/properties/123456:runReport`, {
          method: 'POST',
          headers: { Authorization: 'Bearer test-token-123' },
          body: {
            metrics: [{ name: 'activeUsers' }],
            dimensions: [{ name: 'invalid_dim' }],
            dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          },
        }),
      ).rejects.toThrow(HttpError);
    });

    it('handles auth error', async () => {
      nock(DATA_API_BASE)
        .post('/v1beta/properties/123456:runReport')
        .reply(401, {
          error: {
            code: 401,
            message: 'Request had invalid authentication credentials.',
            status: 'UNAUTHENTICATED',
          },
        });

      const { request, HttpError } = await import('../lib/http.js');
      try {
        await request(`${DATA_API_BASE}/v1beta/properties/123456:runReport`, {
          method: 'POST',
          headers: { Authorization: 'Bearer bad-token' },
          body: {
            metrics: [{ name: 'activeUsers' }],
            dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          },
        });
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as InstanceType<typeof HttpError>).code).toBe('AUTH_FAILED');
      }
    });
  });
});
