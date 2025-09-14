mod mail;

use anyhow::{anyhow, Result};
use clap::{Parser, Subcommand};
use dotenvy::dotenv;
use serde_json::{json, Value};
use lettre::message::{header, MultiPart, SinglePart};
use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};
use std::env;
use std::path::PathBuf;
use tokio::fs::read_to_string;

use crate::mail::EmailMessage;

#[derive(Parser, Debug)]
#[command(name = "test-mail", version, about = "Minimal mail/rest_api renderer for Email Wallet templates")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Render an arbitrary template with simple key=value pairs
    Render {
        /// Template filename, e.g. acknowledgement.html
        template: String,
        /// Key=Value pairs to be injected, e.g. userEmailAddr=alice@example.com
        #[arg(short = 'D', long = "define")]
        kv: Vec<String>,
    },
    /// Simulate REST API flows that generate emails
    Api {
        #[command(subcommand)]
        api: ApiCmd,
    },
    /// Simulate event-driven flows (ack, account_created etc.)
    Event {
        #[command(subcommand)]
        ev: EventCmd,
    },
}

#[derive(Subcommand, Debug)]
enum ApiCmd {
    /// New account flow -> account_creation.html
    CreateNew { email: String },
    /// Existing account flow -> account_already_exist.html
    CreateExisting { email: String },
    /// Send flow -> send_request.html
    Send {
        email: String,
        amount: String,
        token: String,
        to: String,
    },
    /// Recovery -> account_recovery.html
    Recover { email: String },
}

#[derive(Subcommand, Debug)]
enum EventCmd {
    /// Acknowledgement -> acknowledgement.html
    Ack { email: String, subject: String },
    /// Account created -> account_created.html
    AccountCreated { email: String },
    /// Voided -> voided.html
    Voided { email: String },
}

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();
    let cli = Cli::parse();

    match cli.command {
        Commands::Render { template, kv } => {
            let render_data = kv_to_json(kv);
            let html = render_html(&template, render_data).await?;
            println!("{}", html);
        }
        Commands::Api { api } => match api {
            ApiCmd::CreateNew { email } => {
                let msg = api_create_account_new(email).await?;
                send_out(&msg).await?;
            }
            ApiCmd::CreateExisting { email } => {
                let msg = api_create_account_existing(email).await?;
                send_out(&msg).await?;
            }
            ApiCmd::Send {
                email,
                amount,
                token,
                to,
            } => {
                let msg = api_send(email, amount, token, to).await?;
                send_out(&msg).await?;
            }
            ApiCmd::Recover { email } => {
                let msg = api_recover(email).await?;
                send_out(&msg).await?;
            }
        },
        Commands::Event { ev } => match ev {
            EventCmd::Ack { email, subject } => {
                let msg = mail::build_ack_email(&email, &subject);
                send_out(&msg).await?;
            }
            EventCmd::AccountCreated { email } => {
                let msg = mail::build_account_already_exist_email(
                    &email,
                    "deadbeef",
                    "0x000000000000000000000000000000000000cafe",
                    "https://etherscan.io",
                );
                send_out(&msg).await?;
            }
            EventCmd::Voided { email } => {
                let msg = mail::build_voided_email(
                    &email,
                    "0x000000000000000000000000000000000000c0de",
                    "https://etherscan.io",
                    "0x1234",
                );
                send_out(&msg).await?;
            }
        },
    }
    Ok(())
}

fn kv_to_json(pairs: Vec<String>) -> serde_json::Value {
    let mut obj = serde_json::Map::new();
    for p in pairs {
        if let Some((k, v)) = p.split_once('=') {
            obj.insert(k.to_string(), serde_json::Value::String(v.to_string()));
        }
    }
    serde_json::Value::Object(obj)
}

// ===== Inline API shims (do not depend on rest_api.rs) =====

async fn api_create_account_new(email: String) -> Result<EmailMessage> {
    let relayer_addr = env::var("RELAYER_EMAIL").unwrap_or_else(|_| "zkemailpay@gmail.com".to_string());
    Ok(mail::build_account_creation_email(&email, &relayer_addr))
}

async fn api_create_account_existing(email: String) -> Result<EmailMessage> {
    Ok(mail::build_account_already_exist_email(
        &email,
        "0xabc123",
        "0x000000000000000000000000000000000000dead",
        "https://etherscan.io",
    ))
}

async fn api_send(email: String, amount: String, token: String, to: String) -> Result<EmailMessage> {
    let relayer_addr = env::var("RELAYER_EMAIL").unwrap_or_else(|_| "zkemailpay@gmail.com".to_string());
    Ok(mail::build_send_confirm_email(
        &email, &amount, &token, &to, &relayer_addr,
    ))
}

async fn api_recover(email: String) -> Result<EmailMessage> {
    Ok(mail::build_account_recovery_email(
        &email,
        "deadbeef",
        "0x000000000000000000000000000000000000babe",
        "https://etherscan.io",
    ))
}

async fn send_out(email: &EmailMessage) -> Result<()> {
    if let Ok(host) = env::var("SMTP_HOST") {
        let port: u16 = env::var("SMTP_PORT").ok().and_then(|p| p.parse().ok()).unwrap_or(1025);
        let from = env::var("SMTP_FROM").unwrap_or_else(|_| "test-mail@example.com".to_string());

        let msg = Message::builder()
            .from(from.parse().map_err(|e| anyhow!("invalid SMTP_FROM: {}", e))?)
            .to(email.to.parse().map_err(|e| anyhow!("invalid to: {}", e))?)
            .subject(&email.subject)
            .multipart(
                MultiPart::alternative()
                    .singlepart(SinglePart::plain(email.body_plain.clone()))
                    .singlepart(
                        SinglePart::builder()
                            .header(header::ContentType::TEXT_HTML)
                            .body(email.body_html.clone()),
                    ),
            )?;

        let mailer = AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous(host)
            .port(port)
            .build();
        mailer.send(msg).await.map_err(|e| anyhow!("SMTP send failed: {}", e))?;
        println!("[test-mail] sent via SMTP {}:{} -> {}", env::var("SMTP_HOST").unwrap_or_default(), port, email.to);
        Ok(())
    } else {
        // fallback: stdout dump
        println!("=== EMAIL OUT ===");
        println!("to: {}", email.to);
        println!("subject: {}", email.subject);
        println!("-- body_plain --\n{}", email.body_plain);
        println!("-- body_html  --\n{}", email.body_html);
        Ok(())
    }
}

// === local template renderer ===
async fn render_html(_template_name: &str, _render_data: Value) -> Result<String> { Ok(String::new()) }
