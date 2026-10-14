import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { axiosGet } = vi.hoisted(() => ({ axiosGet: vi.fn() }));

vi.mock('axios', () => ({ default: { get: axiosGet } }));
vi.mock('mongoose', () => ({ default: { connection: { readyState: 1 } } }));

import Health from '../src/routes/health';

describe('health router', () => {
	beforeEach(() => {
		axiosGet
			.mockResolvedValueOnce({ status: 200, headers: { 'x-ratelimit-remaining': '99' } })
			.mockResolvedValueOnce({ status: 200, data: { status: 'operational' } });
	});

	it('serves the mounted health path and keeps the nested path available', async () => {
		const app = express();
		app.use('/api/v1/health', Health);

		await request(app).get('/api/v1/health').expect(200).then((response) => {
			expect(response.body.status).toBe('ok');
		});
		await request(app)
			.get('/api/v1/health')
			.set('Accept', 'text/html')
			.expect('Content-Type', /text\/html/)
			.expect(200)
			.then((response) => {
				expect(response.text).toContain('<title>DragonBot Health</title>');
				expect(response.text).toContain('All systems operational');
			});
		await request(app).get('/api/v1/health/health').expect(200);
	});
});
