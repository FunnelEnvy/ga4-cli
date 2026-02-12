import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import nock from 'nock';

const DATA_API_BASE = 'https://analyticsdata.googleapis.com';

describe('dimensions commands', () => {
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

  describe('dimensions list', () => {
    it('fetches and lists dimensions from metadata', async () => {
      const mockResponse = {
        name: 'properties/123456/metadata',
        dimensions: [
          {
            apiName: 'city',
            uiName: 'City',
            description: 'The city from which the user activity originated.',
            category: 'Geography',
            customDefinition: false,
          },
          {
            apiName: 'country',
            uiName: 'Country',
            description: 'The country from which the user activity originated.',
            category: 'Geography',
            customDefinition: false,
          },
          {
            apiName: 'deviceCategory',
            uiName: 'Device category',
            description: 'The type of device: desktop, tablet, or mobile.',
            category: 'Platform / Device',
            customDefinition: false,
          },
          {
            apiName: 'customUser:membership_level',
            uiName: 'Membership Level',
            description: 'Custom user-scoped dimension for membership level.',
            category: 'Custom',
            customDefinition: true,
          },
        ],
        metrics: [],
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

      expect(data.dimensions).toHaveLength(4);
      expect(data.dimensions[0].apiName).toBe('city');
      expect(data.dimensions[0].category).toBe('Geography');
      expect(data.dimensions[3].customDefinition).toBe(true);
      expect(scope.isDone()).toBe(true);
    });

    it('handles empty dimensions list', async () => {
      nock(DATA_API_BASE)
        .get('/v1beta/properties/123456/metadata')
        .reply(200, {
          name: 'properties/123456/metadata',
          dimensions: [],
          metrics: [],
        });

      const { request } = await import('../lib/http.js');
      const data = await request<{ dimensions: unknown[] }>(
        `${DATA_API_BASE}/v1beta/properties/123456/metadata`,
        { headers: { Authorization: 'Bearer test-token-123' } },
      );

      expect(data.dimensions).toHaveLength(0);
    });
  });
});
