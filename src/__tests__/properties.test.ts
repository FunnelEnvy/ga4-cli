import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import nock from 'nock';

const ADMIN_API_BASE = 'https://analyticsadmin.googleapis.com';

describe('properties commands', () => {
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

  describe('properties list', () => {
    it('fetches and formats properties list', async () => {
      const mockResponse = {
        properties: [
          {
            name: 'properties/123456',
            displayName: 'My Website',
            createTime: '2024-01-01T00:00:00Z',
            updateTime: '2024-06-01T00:00:00Z',
            timeZone: 'America/New_York',
            currencyCode: 'USD',
            industryCategory: 'TECHNOLOGY',
            serviceLevel: 'GOOGLE_ANALYTICS_STANDARD',
          },
          {
            name: 'properties/789012',
            displayName: 'My App',
            createTime: '2024-02-01T00:00:00Z',
            updateTime: '2024-06-15T00:00:00Z',
            timeZone: 'Europe/London',
            currencyCode: 'GBP',
            industryCategory: 'BUSINESS_INDUSTRIAL_MARKETS',
            serviceLevel: 'GOOGLE_ANALYTICS_STANDARD',
          },
        ],
      };

      const scope = nock(ADMIN_API_BASE)
        .get('/v1beta/properties')
        .query(true)
        .matchHeader('authorization', 'Bearer test-token-123')
        .reply(200, mockResponse);

      const { request } = await import('../lib/http.js');
      const data = await request<typeof mockResponse>(
        `${ADMIN_API_BASE}/v1beta/properties?pageSize=50`,
        { headers: { Authorization: 'Bearer test-token-123' } },
      );

      expect(data.properties).toHaveLength(2);
      expect(data.properties[0].displayName).toBe('My Website');
      expect(data.properties[0].name).toBe('properties/123456');
      expect(data.properties[1].displayName).toBe('My App');
      expect(scope.isDone()).toBe(true);
    });

    it('handles paginated response', async () => {
      const mockResponse = {
        properties: [
          {
            name: 'properties/111111',
            displayName: 'Site 1',
            createTime: '2024-01-01T00:00:00Z',
            updateTime: '2024-01-01T00:00:00Z',
          },
        ],
        nextPageToken: 'abc123',
      };

      const scope = nock(ADMIN_API_BASE)
        .get('/v1beta/properties')
        .query(true)
        .reply(200, mockResponse);

      const { request } = await import('../lib/http.js');
      const data = await request<typeof mockResponse>(
        `${ADMIN_API_BASE}/v1beta/properties?pageSize=1`,
        { headers: { Authorization: 'Bearer test-token-123' } },
      );

      expect(data.nextPageToken).toBe('abc123');
      expect(data.properties).toHaveLength(1);
      expect(scope.isDone()).toBe(true);
    });

    it('handles empty response', async () => {
      nock(ADMIN_API_BASE)
        .get('/v1beta/properties')
        .query(true)
        .reply(200, { properties: [] });

      const { request } = await import('../lib/http.js');
      const data = await request<{ properties: unknown[] }>(
        `${ADMIN_API_BASE}/v1beta/properties?pageSize=50`,
        { headers: { Authorization: 'Bearer test-token-123' } },
      );

      expect(data.properties).toHaveLength(0);
    });
  });

  describe('properties get', () => {
    it('fetches a single property', async () => {
      const mockProperty = {
        name: 'properties/123456',
        displayName: 'My Website',
        createTime: '2024-01-01T00:00:00Z',
        updateTime: '2024-06-01T00:00:00Z',
        timeZone: 'America/New_York',
        currencyCode: 'USD',
        industryCategory: 'TECHNOLOGY',
        serviceLevel: 'GOOGLE_ANALYTICS_STANDARD',
        propertyType: 'PROPERTY_TYPE_ORDINARY',
      };

      const scope = nock(ADMIN_API_BASE)
        .get('/v1beta/properties/123456')
        .matchHeader('authorization', 'Bearer test-token-123')
        .reply(200, mockProperty);

      const { request } = await import('../lib/http.js');
      const data = await request<typeof mockProperty>(
        `${ADMIN_API_BASE}/v1beta/properties/123456`,
        { headers: { Authorization: 'Bearer test-token-123' } },
      );

      expect(data.displayName).toBe('My Website');
      expect(data.name).toBe('properties/123456');
      expect(data.timeZone).toBe('America/New_York');
      expect(scope.isDone()).toBe(true);
    });

    it('handles 404 for non-existent property', async () => {
      nock(ADMIN_API_BASE)
        .get('/v1beta/properties/999999')
        .reply(404, {
          error: {
            code: 404,
            message: 'Property not found.',
            status: 'NOT_FOUND',
          },
        });

      const { request, HttpError } = await import('../lib/http.js');
      await expect(
        request(`${ADMIN_API_BASE}/v1beta/properties/999999`, {
          headers: { Authorization: 'Bearer test-token-123' },
        }),
      ).rejects.toThrow(HttpError);
    });
  });
});
