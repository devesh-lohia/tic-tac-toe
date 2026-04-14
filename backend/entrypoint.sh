#!/bin/sh

# Fail immediately on error
set -e

echo "--- Backend Initialization ---"

# Step 1: Validate Environment
if [ -z "$NAKAMA_DATABASE_URL" ]; then
    echo "ERROR: NAKAMA_DATABASE_URL is not set."
    exit 1
fi

# Step 2: Extract protocol for Nakama
# Nakama expects --database.address as 'postgres://user:pass@host:port/dbname'
# We use NAKAMA_DATABASE_ADDRESS natively if available, or fall back to NAKAMA_DATABASE_URL
export NAKAMA_DATABASE_ADDRESS=${NAKAMA_DATABASE_ADDRESS:-$NAKAMA_DATABASE_URL}

# Step 3: Run Migrations
echo "Checking database migrations..."
/nakama/nakama migrate up --database.address "$NAKAMA_DATABASE_ADDRESS"
echo "Migrations completed successfully."

# Step 4: Start Nakama
echo "Starting Nakama server..."
# Using 'exec' to ensure Nakama receives SIGTERM/SIGINT signals from the container runtime
# Adding --socket.server_key and CORS overrides for production hardening
exec /nakama/nakama \
    --config /nakama/data/local.yml \
    --database.address "$NAKAMA_DATABASE_ADDRESS" \
    --logger.level "${NAKAMA_LOGGER_LEVEL:-DEBUG}" \
    --socket.server_key "${NAKAMA_SERVER_KEY:-defaultkey}" \
    --session.encryption_key "${NAKAMA_SESSION_KEY:-default-encryption-key}" \
    --console.username "${NAKAMA_CONSOLE_USERNAME:-admin}" \
    --console.password "${NAKAMA_CONSOLE_PASSWORD:-password}" \
    --runtime.http_key "${NAKAMA_SERVER_KEY:-defaultkey}" \
    --socket.port "${PORT:-7350}" \
    --socket.address "0.0.0.0"
