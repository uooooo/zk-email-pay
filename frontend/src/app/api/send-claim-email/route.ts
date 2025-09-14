import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { to, fundId, amount, tokenSymbol, txHash, senderAddress } = await request.json();

    // バリデーション
    if (!to || !fundId || !amount || !tokenSymbol || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields: to, fundId, amount, tokenSymbol, txHash' },
        { status: 400 }
      );
    }

    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // 環境変数をチェック
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;
    
    if (!gmailUser || !gmailPassword) {
      console.error('Gmail credentials not configured');
      return NextResponse.json(
        { error: 'メール送信サービスが設定されていません。GMAIL_USERとGMAIL_APP_PASSWORDを設定してください。' },
        { status: 500 }
      );
    }

    // createAccountと同じ件名形式を使用（fundIdをcodeとして使用）
    const subject = `Email Wallet Account Creation. Code ${fundId}`;

    // mail.rsと同じスタイルで作成
    const senderShort = senderAddress 
      ? `${senderAddress.slice(0, 6)}...${senderAddress.slice(-4)}`
      : 'Unknown';
    const explorerUrl = `https://sepolia.basescan.org/tx/${txHash}`;
    const relayerEmail = 'zkemailpay@gmail.com'; // リレイヤーのメールアドレス
    
    // URLエンコード関数（mail.rsのpct_encodeと同じ）
    const pctEncode = (s: string) => s.replace(/%/g, "%25").replace(/ /g, "%20").replace(/\n/g, "%0A").replace(/"/g, "%22");
    const mailto = `mailto:${relayerEmail}?subject=${pctEncode(subject)}`;
    
    const html = `<!doctype html>
<html><body style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;padding:18px 20px;">
      <h2 style="margin:0;font-size:18px;">💰 You received ${tokenSymbol}!</h2>
    </div>
    <div style="padding:20px;">
      <p style="margin:0 0 12px 0;">${to}, someone sent you ${amount} ${tokenSymbol}. You can claim your tokens by replying to this email.</p>
      <div style="background:#ecfdf5;border:1px solid #10b981;border-radius:8px;padding:16px;">
        <ul style="margin:0;padding-left:18px;">
          <li><strong>Amount:</strong> ${amount} ${tokenSymbol}</li>
          <li><strong>From:</strong> ${senderShort}</li>
          <li><strong>Transfer ID:</strong> ${fundId}</li>
          <li><strong>Transaction:</strong> <a href="${explorerUrl}" style="color:#065f46;text-decoration:none;">${txHash.slice(0, 10)}...</a></li>
        </ul>
      </div>
      <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:12px;margin:16px 0;">
        <div style="font-weight:700;margin-bottom:6px;">Reply Subject (required)</div>
        <code style="display:block;background:#fff;padding:10px;border-radius:6px;border:1px solid #e5e7eb;">${subject}</code>
        <div style="color:#64748b;font-size:12px;margin-top:6px;">⚠️ Your wallet will be created and tokens claimed only if the subject exactly matches. The body can be empty.</div>
      </div>
      <div style="text-align:center;margin:22px 0;">
        <a href="${mailto}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:8px;font-weight:700;">
          ✉️ Reply to claim
        </a>
      </div>
      <p style="color:#6b7280;font-size:12px;">Code: ${fundId}</p>
    </div>
    <div style="padding:14px 20px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;text-align:center;">
      This transfer expires in 30 days. Your Email Wallet will be created automatically when you reply.
    </div>
  </div>
</body></html>`;

    const plainTextBody = `${to}, someone sent you ${amount} ${tokenSymbol}. You can claim your tokens by replying to this email.

Amount: ${amount} ${tokenSymbol}
From: ${senderShort}
Transfer ID: ${fundId}
Transaction: ${explorerUrl}

Reply Subject (required): ${subject}

⚠️ Your wallet will be created and tokens claimed only if the subject exactly matches. The body can be empty.

This transfer expires in 30 days.`;

    // NodemailerでGmail SMTP使用
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword
      }
    });

    const mailOptions = {
      from: `Email Wallet <${gmailUser}>`,
      to: to,
      subject: subject,
      text: plainTextBody,
      html: html,
      replyTo: relayerEmail
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Claim email sent successfully:', result);

    return NextResponse.json({
      success: true,
      message: `クレーム通知メールを ${to} に送信しました`,
      messageId: result.messageId,
      fundId: fundId
    });

  } catch (error) {
    console.error('Claim email sending error:', error);
    return NextResponse.json(
      { 
        error: 'クレーム通知メール送信中にエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}