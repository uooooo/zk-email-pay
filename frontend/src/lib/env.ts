export const env = {
  RELAYER_API_URL: process.env.NEXT_PUBLIC_RELAYER_API_URL ?? "",
  CORE_CONTRACT_ADDRESS:
    process.env.NEXT_PUBLIC_CORE_CONTRACT_ADDRESS ?? "0x0000000000000000000000000000000000000000",
  CHAIN_ID: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 0),
  SUBGRAPH_URL: process.env.NEXT_PUBLIC_SUBGRAPH_URL ?? "",
  MODE: (process.env.NEXT_PUBLIC_MODE ?? "dev") as "dev" | "prod",
};

export function requireEnv<K extends keyof typeof env>(key: K): (typeof env)[K] {
  const v = env[key];
  if (v === undefined || v === null || v === "" || (typeof v === "number" && Number.isNaN(v))) {
    throw new Error(`Missing environment variable: NEXT_PUBLIC_${String(key)}`);
  }
  return v as (typeof env)[K];
}

