import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';

const okJson = (data: unknown) => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  json: async () => data,
});

describe('api client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests /sessions and returns the payload', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(okJson([{ session_key: 1 }]));
    const data = await api.getSessions();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/sessions'));
    expect(data).toEqual([{ session_key: 1 }]);
  });

  it('builds the car-data query with session_key and driver_number', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(okJson([]));
    await api.getCarData(9158, 44);
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('/car-data?');
    expect(url).toContain('session_key=9158');
    expect(url).toContain('driver_number=44');
  });

  it('omits query params when none are given', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(okJson([]));
    await api.getCarData();
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url.endsWith('/car-data')).toBe(true);
  });

  it('throws on a non-ok response', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: async () => ({}),
    });
    await expect(api.getSessions()).rejects.toThrow(/500/);
  });

  it('throws when the payload is an error-detail object', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(okJson({ detail: 'No results found.' }));
    await expect(api.getWeather()).rejects.toThrow(/No results found/);
  });
});
