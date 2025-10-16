import fs from 'fs/promises';
import path from 'path';
import LogEntryModel from '../Database/Schemas/logEntry';

type Level = 'info' | 'warn' | 'error' | 'debug';

async function writeFileLog(line: string) {
  try {
    const logsDir = path.resolve(__dirname, '../../devLogs');
    await fs.mkdir(logsDir, { recursive: true });
    await fs.appendFile(path.join(logsDir, 'logs.log'), line);
  } catch (e) {
    // swallow file errors to avoid cascading failures
    // eslint-disable-next-line no-console
    console.error('logger: failed to write file log', e);
  }
}

export async function log(level: Level, message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const line = `${timestamp} [${level.toUpperCase()}] ${message} ${meta ? JSON.stringify(meta) : ''}\n`;

  // Console output
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);

  // Write to file for persistence
  await writeFileLog(line);

  // Save to DB (best-effort)
  try {
    await LogEntryModel.create({ level, message, meta, createdAt: new Date() });
  } catch (e) {
    // ignore DB errors to keep logging non-blocking
    // eslint-disable-next-line no-console
    console.error('logger: failed to write DB log', e);
  }
}

export const info = (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta);
export const warn = (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta);
export const error = (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta);
export const debug = (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta);
