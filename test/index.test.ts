import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock modules used by src/index.ts before importing it so top-level code uses our stubs
vi.mock('../src/Structures/Client', () => {
  return {
    ExtendedClient: class {
      public __reactionCleanupStop?: () => void;
      async start() { /* noop */ }
      async destroy() { /* noop */ }
    }
  };
});
vi.mock('../src/Database', () => ({ connectDatabase: vi.fn(async () => { }) }));
vi.mock('../src/Structures/checkVariables', () => ({ checkVariables: vi.fn(() => { }) }));
vi.mock('../src/routes/health', () => {
  // export a simple middleware handler to avoid overload/type issues in tests
  return { default: ((req: any, res: any) => res.status(200).json({ ok: true })) as any };
});
vi.mock('../src/routes/apiv1', () => {
  return { default: ((req: any, res: any) => res.status(200).json({ api: true })) as any };
});
vi.mock('../src/Utilities/logger', () => ({ info: vi.fn(), error: vi.fn() }));

describe('index.ts bootstrapping', () => {
  beforeEach(() => {
    // Clear any cached module to ensure fresh import per test run
    vi.resetModules();
  });

  it('imports module and can start app without side effects', async () => {
    const { appInstance } = await import('../src/index');
    expect(appInstance).toBeDefined();

    // Replace app.listen with a stub that calls the callback synchronously and returns an object with close()
    const listenStub = (appInstance as any).app.listen = (port: number, cb: () => void) => {
      // call callback to simulate server start
      cb();
      return { close: (cb2: () => void) => cb2() };
    };

    // Start should complete without throwing (our mocks prevent external side-effects)
    await expect(appInstance.start()).resolves.not.toThrow();

    // Ensure port is set (default 3000 or from env)
    expect((appInstance as any).port).toBeDefined();
  });

  it('exposes root and health endpoints and respects API key middleware in dev', async () => {
    process.env.Enviroment = 'dev';
    vi.resetModules();
    const { appInstance } = await import('../src/index');

    // stub listen so start doesn't open a real port
    (appInstance as any).app.listen = (port: number, cb: () => void) => {
      cb();
      return { close: (cb2: () => void) => cb2() };
    };

    await appInstance.start();

    // root
    await request((appInstance as any).app).get('/').expect(200).then(r => expect(r.text).toContain('Hello'));

    // health (mounted without API key)
    await request((appInstance as any).app).get('/api/v1/health').expect(200).then(r => expect(r.body).toEqual({ ok: true }));

    // api root — in dev the middleware should allow through even without API key
    await request((appInstance as any).app).get('/api/v1/').expect(200).then(r => expect(r.body).toEqual({ api: true }));
  });

  it('enforces API key in non-dev environments', async () => {
    process.env.Enviroment = 'prod';
    process.env.API_KEY = 's3cret';
    vi.resetModules();
    const { appInstance } = await import('../src/index');
    (appInstance as any).app.listen = (port: number, cb: () => void) => { cb(); return { close: (cb2: () => void) => cb2() }; };
    await appInstance.start();

    // missing header -> 401
    await request((appInstance as any).app).get('/api/v1/').expect(401);

    // wrong key -> 401
    await request((appInstance as any).app).get('/api/v1/').set('x-api-key', 'wrong').expect(401);

    // correct key -> 200
    await request((appInstance as any).app).get('/api/v1/').set('x-api-key', 's3cret').expect(200);
  });

  it('runs graceful shutdown handlers for process events', async () => {
    // Prepare clean module environment and mocks
    process.env.Enviroment = 'dev';
    vi.resetModules();

    const destroySpy = vi.fn(async () => { });
    vi.doMock('../src/Structures/Client', () => ({
      ExtendedClient: class {
        public __reactionCleanupStop?: () => void;
        async start() { /* noop */ }
        async destroy() { await destroySpy(); }
      }
    }));
    vi.doMock('../src/Database', () => ({ connectDatabase: vi.fn(async () => { }) }));
    vi.doMock('../src/Structures/checkVariables', () => ({ checkVariables: vi.fn(() => { }) }));
    vi.doMock('../src/routes/health', () => ({ default: ((req: any, res: any) => res.status(200).json({ ok: true })) as any }));
    vi.doMock('../src/routes/apiv1', () => ({ default: ((req: any, res: any) => res.status(200).json({ api: true })) as any }));
    vi.doMock('../src/Utilities/logger', () => ({ info: vi.fn(), error: vi.fn() }));

    // Prevent the process from actually exiting in the test runner
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => { /* noop */ }) as any);

    const { appInstance } = await import('../src/index');
    // stub listen so start doesn't open a real port
    (appInstance as any).app.listen = (port: number, cb: () => void) => { cb(); return { close: (cb2: () => void) => cb2() }; };
    await appInstance.start();

    // Trigger unhandledRejection handler
    process.emit('unhandledRejection', new Error('test-unhandled'), Promise.resolve());
    await new Promise(r => setImmediate(r));
    expect(destroySpy).toHaveBeenCalled();

    // Reset spy call count and trigger uncaughtException handler
    destroySpy.mockClear();
    process.emit('uncaughtException', new Error('test-uncaught'));
    await new Promise(r => setImmediate(r));
    expect(destroySpy).toHaveBeenCalled();

    // Trigger SIGINT shutdown path
    destroySpy.mockClear();
    process.emit('SIGINT');
    await new Promise(r => setImmediate(r));
    expect(destroySpy).toHaveBeenCalled();

    exitSpy.mockRestore();
  });
});
