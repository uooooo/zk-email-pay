import { z } from 'zod';

export const HeadersSchema = z.object({
  d: z.string().min(1), // domain
  s: z.string().min(1), // selector
  bh: z.string().optional(), // body hash
  b: z.string().optional(), // signature
  from: z.string().optional(),
  to: z.string().optional(),
  subject: z.string().optional(),
  date: z.string().optional(),
  messageId: z.string().optional(),
  rawHeaderChunks: z.array(z.string()).optional(),
});

export const BodySchema = z.object({
  maxLen: z.number().int().nonnegative().optional(),
  hHash: z.string().optional(),
  excerpt: z.string().optional(),
});

export const ClaimSchema = z.object({
  amount: z.string().or(z.number()),
  token: z.string().min(1),
  unclaimedId: z.string().or(z.number()),
  expiry: z.string().or(z.number()).optional(),
  nullifier: z.string().optional(),
});

export const ProveEmailRequestSchema = z.object({
  headers: HeadersSchema,
  body: BodySchema.optional(),
  claim: ClaimSchema,
});

export type ProveEmailRequest = z.infer<typeof ProveEmailRequestSchema>;

