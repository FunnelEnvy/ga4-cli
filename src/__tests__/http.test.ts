import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import nock from 'nock';
import { request, HttpError } from '../lib/http.js';

describe('http client', () => {
  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('makes a GET request and returns parsed JSON', async () => {
    nock('https://api.example.com')
      .get('/test')
      .reply(200, { success: true });

    const data = await request<{ success: boolean }>('https://api.example.com/test');
    expect(data.success).toBe(true);
  });

  it('makes a POST request with body', async () => {
    nock('https://api.example.com')
      .post('/test', { key: 'value' })
      .reply(200, { created: true });

    const data = await request<{ created: boolean }>('https://api.example.com/test', {
      method: 'POST',
      body: { key: 'value' },
    });
    expect(data.created).toBe(true);
  });

  it('throws HttpError on 401', async () => {
    nock('https://api.example.com')
      .get('/test')
      .reply(401, { error: { message: 'Unauthorized' } });

    await expect(request('https://api.example.com/test')).rejects.toThrow(HttpError);

    try {
      nock('https://api.example.com')
        .get('/test2')
        .reply(401, {});
      await request('https://api.example.com/test2');
    } catch (error) {
      expect((error as HttpError).code).toBe('AUTH_FAILED');
      expect((error as HttpError).status).toBe(401);
    }
  });

  it('throws HttpError on 429 with retry_after', async () => {
    nock('https://api.example.com')
      .get('/test')
      .reply(429, {}, { 'retry-after': '30' });

    try {
      await request('https://api.example.com/test');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).code).toBe('RATE_LIMITED');
      expect((error as HttpError).retryAfter).toBe(30);
    }
  });

  it('throws HttpError on 500 with error message', async () => {
    nock('https://api.example.com')
      .get('/test')
      .reply(500, { error: { message: 'Internal server error' } });

    try {
      await request('https://api.example.com/test');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).message).toBe('Internal server error');
    }
  });
});
