import type { Response } from 'express';

/**
 * Minimal SSE fan-out hub. One hub per (channel) — channels are project-scoped or agent-scoped.
 * Subscribers are Express Response objects we keep open and write SSE frames to.
 */
type Subscriber = {
  res: Response;
  channel: string;
};

const subs = new Set<Subscriber>();

export function attach(res: Response, channel: string): () => void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');     // disable nginx proxy_buffering for SSE
  res.flushHeaders?.();
  res.write(`: connected ${new Date().toISOString()}\n\n`);

  const sub: Subscriber = { res, channel };
  subs.add(sub);

  const heartbeat = setInterval(() => {
    try {
      res.write(`: hb ${Date.now()}\n\n`);
    } catch {
      /* will be cleaned up on close */
    }
  }, 15_000);

  const cleanup = () => {
    clearInterval(heartbeat);
    subs.delete(sub);
  };
  res.on('close', cleanup);
  return cleanup;
}

export function publish(channel: string, eventName: string, payload: unknown): void {
  const data = JSON.stringify(payload);
  const frame = `event: ${eventName}\ndata: ${data}\n\n`;
  for (const sub of subs) {
    if (sub.channel === channel || sub.channel === '*') {
      try {
        sub.res.write(frame);
      } catch {
        /* ignore broken pipe; close handler will remove */
      }
    }
  }
}

export function publishMany(channels: string[], eventName: string, payload: unknown): void {
  const data = JSON.stringify(payload);
  const frame = `event: ${eventName}\ndata: ${data}\n\n`;
  const set = new Set(channels);
  for (const sub of subs) {
    if (set.has(sub.channel) || sub.channel === '*') {
      try {
        sub.res.write(frame);
      } catch {
        /* ignore */
      }
    }
  }
}

export function subscriberCount(channel?: string): number {
  if (!channel) return subs.size;
  let n = 0;
  for (const s of subs) if (s.channel === channel) n += 1;
  return n;
}
