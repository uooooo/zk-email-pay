export const env = {
  RELAYER_API_URL: process.env.NEXT_PUBLIC_RELAYER_API_URL ?? "",
  RELAYER_EMAIL: process.env.NEXT_PUBLIC_RELAYER_EMAIL ?? "zkemailpay@gmail.com",
  CORE_CONTRACT_ADDRESS:
    // Hard-coded Base Sepolia EmailWalletCore as default
    process.env.NEXT_PUBLIC_CORE_CONTRACT_ADDRESS ??
    "0xF60Ce6F85eebF6279784A7F1acB7653dDFEF86a3",
  // Hard-coded Base Sepolia chain id as default
  CHAIN_ID: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 84532),
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
