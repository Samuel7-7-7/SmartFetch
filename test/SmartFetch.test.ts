import { describe, it, expect, vi, beforeEach } from 'vitest';
import smartFetch, { SmartFetch, create } from '../src/index';

describe('SmartFetch', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    globalThis.fetch = vi.fn();
  });

  it('should format params correctly', async () => {
    const mockResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
    });
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

    const client = create();
    await client.get('https://api.example.com/data', {
      params: { search: 'test', page: 1 }
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/data?search=test&page=1',
      expect.anything()
    );
  });

  it('should timeout and abort request', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementation(async (url, config) => {
      return new Promise((resolve, reject) => {
        config?.signal?.addEventListener('abort', () => {
          const err = new Error('AbortError');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });

    const client = create({ timeout: 1000 });
    
    const promise = client.get('https://api.example.com/data');
    promise.catch(() => {});
    await vi.advanceTimersByTimeAsync(1100);
    
    await expect(promise).rejects.toThrow(/Request timeout/);
    vi.useRealTimers();
  });

  it('should retry on 5xx errors', async () => {
    const errorResponse = new Response(JSON.stringify({ error: 'Server Error' }), {
      status: 500,
      headers: new Headers({ 'content-type': 'application/json' }),
    });
    const successResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    vi.mocked(fetch)
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(successResponse);

    const client = create({ retries: 1 });
    const res = await client.get('https://api.example.com/data');

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(res.data).toEqual({ ok: true });
  });

  it('should run interceptors correctly', async () => {
    const mockResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
    });
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

    const client = create();
    
    client.interceptors.request.use((config) => {
      config.headers = { ...config.headers, 'X-Test': 'true' };
      return config;
    });

    client.interceptors.response.use((response) => {
      response.data = { ...response.data, intercepted: true };
      return response;
    });

    const res = await client.get('https://api.example.com/data');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/data',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Test': 'true' })
      })
    );
    expect(res.data).toEqual({ ok: true, intercepted: true });
  });
});
