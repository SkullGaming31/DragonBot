import { describe, it, expect, vi } from 'vitest';
import type { Mock } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('axios');
import axios from 'axios';
const mockedAxios = axios as unknown as { get: Mock };

import router from '../src/routes/health';
import mongoose from 'mongoose';

describe('Health route', () => {
  it('returns 200 when gateway ok and mongo connected', async () => {
    // simulate axios responses
    mockedAxios.get = vi.fn((url: string) => {
      if (url.includes('gateway')) return Promise.resolve({ status: 200, headers: { 'x-ratelimit-remaining': '10' } });
      if (url.includes('summary.json')) return Promise.resolve({ status: 200, data: { status: 'ok' } });
      return Promise.reject(new Error('unknown'));
    });

    // ensure mongoose shows connected state
    const orig = mongoose.connection.readyState;
    // monkey patch readyState to 1
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    mongoose.connection.readyState = 1;

    const app = express();
    app.use('/api', router);
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');

    // restore readyState
    // @ts-ignore
    mongoose.connection.readyState = orig;
  });

  it('returns 503 when gateway down or mongo disconnected', async () => {
    mockedAxios.get = vi.fn(() => Promise.reject(new Error('network')));
    const orig = mongoose.connection.readyState;
    // @ts-ignore
    mongoose.connection.readyState = 0;
    const app = express();
    app.use('/api', router);
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    // @ts-ignore
    mongoose.connection.readyState = orig;
  });
});
