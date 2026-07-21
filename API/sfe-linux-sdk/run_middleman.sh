#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Starting SFE Linux Biometric Middleman ==="

if [ ! -f "./sfe_linux_middleman" ]; then
    echo "Binary not found. Building sfe_linux_middleman..."
    make sfe_linux_middleman
fi

PORT="${1:-5000}"

echo "Launching sfe_linux_middleman on port ${PORT}..."
exec ./sfe_linux_middleman "$PORT"
