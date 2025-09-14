# syntax=docker/dockerfile:1

## Builder
FROM rust:1-bookworm AS builder
WORKDIR /app/test-mail

# Copy minimal sources for caching
COPY test-mail/Cargo.toml ./Cargo.toml
COPY test-mail/src ./src

# Build release binary
RUN cargo build --release --verbose

## Runtime
FROM debian:bookworm-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Default templates inside the image (can be overridden by bind mount)
COPY email-wallet/packages/relayer/eml_templates /app/eml_templates

# Copy binary
COPY --from=builder /app/test-mail/target/release/test-mail /usr/local/bin/test-mail

ENV EMAIL_TEMPLATES_PATH=/app/eml_templates
ENTRYPOINT ["test-mail"]
CMD ["--help"]
