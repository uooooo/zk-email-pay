import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ProveEmailRequestSchema } from './types';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const startedAt = Date.now();
const VERSION = '0.1.0';

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', version: VERSION, uptimeSec: Math.floor((Date.now() - startedAt) / 1000) });
});

app.post('/prove/email', async (req, res) => {
  const t0 = Date.now();
  const parsed = ProveEmailRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_request', details: parsed.error.flatten() });
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
  res.json({ proof, publicSignals, vkeyHash, circuit: 'email_sender+claim (stub)', timings });
});

const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[prover] listening on http://localhost:${PORT}`);
});

