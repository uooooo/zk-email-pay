// Lightweight mail module for the miniapp.
// ここを書き換えるだけでメールの見た目・本文を差し替えできるように、
// 外部依存を持たない最小実装にしています。

#[derive(Debug, Clone)]
pub struct EmailAttachment {
    pub inline_id: String,
    pub content_type: String,
    pub contents: Vec<u8>,
}

#[derive(Debug, Clone)]
pub struct EmailMessage {
    pub to: String,
    pub subject: String,
    pub body_plain: String,
    pub body_html: String,
    pub reference: Option<String>,
    pub reply_to: Option<String>,
    pub body_attachments: Option<Vec<EmailAttachment>>,
}

fn pct_encode(s: &str) -> String {
    s.replace('%', "%25")
        .replace(' ', "%20")
        .replace('\n', "%0A")
        .replace('"', "%22")
}

fn gen_hex_code() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos() as u128)
        .unwrap_or(0);
    format!("{:x}", nanos).chars().take(16).collect()
}

// 送金確認メール: 返信ボタン（mailto）と、返信時件名（コマンド形式）を明示
pub fn build_send_confirm_email(
    sender: &str,
    amount: &str,
    token: &str,
    recipient: &str,
    relayer_email: &str,
) -> EmailMessage {
    let command_subject = format!("Send {} {} to {}", amount, token, recipient);
    let mailto = format!(
        "mailto:{}?subject={}",
        relayer_email,
        pct_encode(&command_subject)
    );
    let body_html = format!(
        r#"<!doctype html>
<html><body style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#eab308,#ca8a04);color:#fff;padding:18px 20px;">
      <h2 style="margin:0;font-size:18px;">ZK Email Transfer Confirmation</h2>
    </div>
    <div style="padding:20px;">
      <p style="margin:0 0 12px 0;">{sender}, would you like to execute the following transfer?</p>
      <div style="background:#fffbeb;border:1px solid #facc15;border-radius:8px;padding:16px;">
        <ul style="margin:0;padding-left:18px;">
          <li><strong>Amount:</strong> {amount} {token}</li>
          <li><strong>Recipient:</strong> {recipient}</li>
          <li><strong>Sender:</strong> {sender}</li>
        </ul>
      </div>
      <div style="text-align:center;margin:22px 0;">
        <a href="{mailto}" style="display:inline-block;background:#eab308;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:8px;font-weight:700;">
          🚀 Reply to execute
        </a>
      </div>
      <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:12px;">
        <div style="font-weight:700;margin-bottom:6px;">Reply Subject (required)</div>
        <code style="display:block;background:#fff;padding:10px;border-radius:6px;border:1px solid #e5e7eb;">{command_subject}</code>
        <div style="color:#64748b;font-size:12px;margin-top:6px;">⚠️ The transfer will be processed only if the subject exactly matches. The body can be empty.</div>
      </div>
    </div>
    <div style="padding:14px 20px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;text-align:center;">
      This message was generated for testing with Mailpit. Final confirmation happens by replying with DKIM.
    </div>
  </div>
</body></html>"#,
        sender = sender,
        amount = amount,
        token = token,
        recipient = recipient,
        mailto = mailto,
        command_subject = command_subject
    );
    EmailMessage {
        to: sender.to_string(),
        // 返信で使う推奨件名＝そのままコマンド形式
        subject: command_subject.clone(),
        body_plain: format!(
            "以下の送金を実行しますか？\n- 金額: {} {}\n- 受信者: {}\n- 送信者: {}\n\n返信用件名(重要): {}",
            amount, token, recipient, sender, command_subject
        ),
        body_html,
        reference: None,
        reply_to: None,
        body_attachments: None,
    }
}

// Account creation: reply with Code subject
pub fn build_account_creation_email(sender: &str, relayer_email: &str) -> EmailMessage {
    let code = gen_hex_code();
    let code_subject = format!("Email Wallet Account Creation. Code {}", code);
    let mailto = format!(
        "mailto:{}?subject={}",
        relayer_email,
        pct_encode(&code_subject)
    );
    let body_html = format!(
        r#"<!doctype html>
<html><body style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;padding:18px 20px;">
      <h2 style="margin:0;font-size:18px;">Create Your Email Wallet</h2>
    </div>
    <div style="padding:20px;">
      <p style="margin:0 0 12px 0;">{sender}, you can activate your wallet by replying to this email.</p>
      <div style="background:#ecfdf5;border:1px solid #10b981;border-radius:8px;padding:16px;">
        <div style="font-weight:700;margin-bottom:6px;">Reply Subject (required)</div>
        <code style="display:block;background:#fff;padding:10px;border-radius:6px;border:1px solid #e5e7eb;">{code_subject}</code>
        <div style="color:#065f46;font-size:12px;margin-top:6px;">⚠️ The wallet will be created only if the subject exactly matches. The body can be empty.</div>
      </div>
      <div style="text-align:center;margin:22px 0;">
        <a href="{mailto}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:8px;font-weight:700;">
          ✉️ Reply to create
        </a>
      </div>
      <p style="color:#6b7280;font-size:12px;">Code: {code_display}</p>
    </div>
    <div style="padding:14px 20px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;text-align:center;">
      This message was generated for testing with Mailpit. Final confirmation happens by replying with DKIM.
    </div>
  </div>
</body></html>"#,
        sender = sender,
        mailto = mailto,
        code_subject = code_subject,
        code_display = code
    );
    EmailMessage {
        to: sender.to_string(),
        // 返信で使う推奨件名＝Code 付き件名
        subject: code_subject.clone(),
        body_plain: format!(
            "ウォレット作成を開始します。\n返信用件名(重要): {}\nこのメールにそのまま返信するか、本文のボタンを押してください。",
            code_subject
        ),
        body_html,
        reference: None,
        reply_to: None,
        body_attachments: None,
    }
}

// Existing account (sign-in)
pub fn build_account_already_exist_email(
    sender: &str,
    account_code: &str,
    wallet_addr: &str,
    explorer: &str,
) -> EmailMessage {
    let body_html = format!(
        r#"<!doctype html>
<html><body style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#6d28d9,#5b21b6);color:#fff;padding:18px 20px;">
      <h2 style="margin:0;font-size:18px;">Wallet Already Created</h2>
    </div>
    <div style="padding:20px;">
      <p style="margin:0 0 12px 0;">{sender}, please sign in with the information below.</p>
      <div style="background:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;padding:16px;">
        <ul style="margin:0;padding-left:18px;">
          <li><strong>Account Code:</strong> {account_code}</li>
          <li><strong>Wallet:</strong> <a href="{explorer}/address/{wallet}" style="color:#6d28d9;text-decoration:none;">{wallet_short}</a></li>
        </ul>
      </div>
    </div>
  </div>
</body></html>"#,
        sender = sender,
        account_code = account_code,
        wallet = wallet_addr,
        wallet_short = format!("{}...{}", &wallet_addr[..6], &wallet_addr[wallet_addr.len().saturating_sub(4)..]),
        explorer = explorer,
    );
    EmailMessage {
        to: sender.to_string(),
        subject: "Sign in to your Email Wallet".to_string(),
        body_plain: format!(
            "Your wallet is already created.\nAccount Code: {}\nWallet: {}\nExplorer: {}/address/{}",
            account_code, wallet_addr, explorer, wallet_addr
        ),
        body_html,
        reference: None,
        reply_to: None,
        body_attachments: None,
    }
}

// Account recovery (re-send code)
pub fn build_account_recovery_email(
    sender: &str,
    account_code: &str,
    wallet_addr: &str,
    explorer: &str,
) -> EmailMessage {
    let body_html = format!(
        r#"<!doctype html>
<html><body style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0ea5e9,#0369a1);color:#fff;padding:18px 20px;">
      <h2 style="margin:0;font-size:18px;">Account Recovery</h2>
    </div>
    <div style="padding:20px;">
      <div style="background:#f0f9ff;border:1px solid #7dd3fc;border-radius:8px;padding:16px;">
        <ul style="margin:0;padding-left:18px;">
          <li><strong>Account Code:</strong> {account_code}</li>
          <li><strong>Wallet:</strong> <a href="{explorer}/address/{wallet}" style="color:#0369a1;text-decoration:none;">{wallet_short}</a></li>
        </ul>
      </div>
      <p style="color:#0f172a;font-size:12px;margin-top:8px;">Please keep your Account Code secure.</p>
    </div>
  </div>
</body></html>"#,
        account_code = account_code,
        wallet = wallet_addr,
        wallet_short = format!("{}...{}", &wallet_addr[..6], &wallet_addr[wallet_addr.len().saturating_sub(4)..]),
        explorer = explorer,
    );
    EmailMessage {
        to: sender.to_string(),
        subject: "Email Wallet Account Login".to_string(),
        body_plain: format!(
            "Your account key is {}. Keep it safe.\nWallet: {}/address/{}",
            account_code, explorer, wallet_addr
        ),
        body_html,
        reference: None,
        reply_to: None,
        body_attachments: None,
    }
}

// Acknowledgement (Ack)
pub fn build_ack_email(sender: &str, original_subject: &str) -> EmailMessage {
    let body_html = format!(
        r#"<!doctype html>
<html><body style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#475569,#334155);color:#fff;padding:18px 20px;">
      <h2 style="margin:0;font-size:18px;">We received your request</h2>
    </div>
    <div style="padding:20px;">
      <p style="margin:0;">Hi {sender},</p>
      <p style="margin:8px 0 0 0;">We have received your email with subject <strong>{subject}</strong>.</p>
    </div>
  </div>
</body></html>"#,
        sender = sender,
        subject = original_subject,
    );
    EmailMessage {
        to: sender.to_string(),
        subject: format!("Re: {}", original_subject),
        body_plain: format!("Your email '{}' is received.", original_subject),
        body_html,
        reference: None,
        reply_to: None,
        body_attachments: None,
    }
}

// Voided notification
pub fn build_voided_email(
    sender: &str,
    wallet_addr: &str,
    explorer: &str,
    tx_hash: &str,
) -> EmailMessage {
    let body_html = format!(
        r#"<!doctype html>
<html><body style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff;padding:18px 20px;">
      <h2 style="margin:0;font-size:18px;">Transfer Voided</h2>
    </div>
    <div style="padding:20px;">
      <p style="margin:0 0 8px 0;">{sender}, the following transaction has been voided.</p>
      <ul style="margin:0;padding-left:18px;">
        <li><a href="{explorer}/tx/{tx}" style="color:#ef4444;text-decoration:none;">View transaction</a></li>
        <li><a href="{explorer}/address/{wallet}" style="color:#ef4444;text-decoration:none;">View wallet</a></li>
      </ul>
    </div>
  </div>
</body></html>"#,
        sender = sender,
        wallet = wallet_addr,
        explorer = explorer,
        tx = tx_hash,
    );
    EmailMessage {
        to: sender.to_string(),
        subject: "Email Wallet Notification: Transfer Voided".to_string(),
        body_plain: format!("Tx: {}/tx/{}", explorer, tx_hash),
        body_html,
        reference: None,
        reply_to: None,
        body_attachments: None,
    }
}
