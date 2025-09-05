// Validation patterns
export const VALIDATION_PATTERNS = {
  // Basic email pattern; full RFC compliance is unnecessary here
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Ethereum address pattern (0x followed by 40 hex characters)
  HEX_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  
  // Decimal number pattern (integers and floats)
  DECIMAL_AMOUNT: /^\d+(?:\.\d+)?$/,
} as const;

// API configuration
export const API_CONFIG = {
  // Cache settings
  CACHE_POLICY: "no-store" as const,
  
  // Content type
  DEFAULT_CONTENT_TYPE: "application/json" as const,
  
  // HTTP methods that don't have body
  METHODS_WITHOUT_BODY: ["GET", "HEAD"] as const,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  VALIDATION: {
    INVALID_EMAIL: "有効なメールアドレスを入力してください",
    INVALID_ADDRESS: "有効なEthereumアドレス(0x...)を入力してください", 
    INVALID_AMOUNT: "有効な金額を入力してください",
  },
  API: {
    UPSTREAM_FAILED: "Relayerサービスへのリクエストが失敗しました",
    PATH_NOT_ALLOWED: "許可されていないAPIエンドポイントです",
    MISSING_CONFIG: "RELAYER_API_URLが設定されていません",
  },
  FORM: {
    REQUIRED_FIELD: "この項目は必須です",
    SEND_FAILED: "送信に失敗しました",
    CLAIM_FAILED: "クレームに失敗しました",
    ACCOUNT_CHECK_FAILED: "確認に失敗しました",
    ACCOUNT_CREATE_FAILED: "作成メールの送信に失敗しました",
  },
} as const;