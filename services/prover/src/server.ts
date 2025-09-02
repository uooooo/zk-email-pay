import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from '@hono/cors';
import dotenv from 'dotenv';
import { ProveEmailRequestSchema } from './types';

dotenv.config();

const app = new Hono();
app.use('*', cors());

const startedAt = Date.now();
const VERSION = '0.1.0';

app.get('/healthz', (c) => c.json({ status: 'ok', version: VERSION, uptimeSec: Math.floor((Date.now() - startedAt) / 1000) }));

app.post('/prove/email', async (c) => {
  const t0 = Date.now();
  const body = await c.req.json().catch(() => null);
  const parsed = ProveEmailRequestSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return c.json({ error: 'invalid_request', details: parsed.error.flatten() }, 400);
  }
  // Stub proof/publicSignals (replace with snarkjs integration later)
  const proof = '0x' + '00'.repeat(64);
  const publicSignals = [
    parsed.data.headers.d,
    parsed.data.headers.s,
    String(parsed.data.claim.unclaimedId),
  ];
  const vkeyHash = 'stub-vkeyhash';
  const timings = { receivedMs: t0, proveMs: 0, totalMs: Date.now() - t0 };
  return c.json({ proof, publicSignals, vkeyHash, circuit: 'email_sender+claim (stub)', timings });
});

const PORT = Number(process.env.PORT || 8080);
serve({ fetch: app.fetch, port: PORT });
// eslint-disable-next-line no-console
console.log(`[prover] listening on http://localhost:${PORT}`);

