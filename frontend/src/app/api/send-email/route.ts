import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html } = await request.json();

    // バリデーション
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
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

    // NodemailerでGmail SMTP使用（SSL/TLS直接接続）
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword
      }
    });

    const mailOptions = {
      from: `ZK Email <${gmailUser}>`,
      to: to,
      subject: subject,
      html: html,
      replyTo: 'zkemailpay@gmail.com'
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result);

    return NextResponse.json({
      success: true,
      message: `メールを ${to} に送信しました`,
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { 
        error: 'メール送信中にエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}