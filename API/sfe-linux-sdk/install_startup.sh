#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "================================================="
echo " SFE Linux Biometric Middleman Installation     "
echo "================================================="

chmod +x run_middleman.sh 2>/dev/null || true

echo "1. Building binaries..."
make clean && make

echo ""
echo "2. Setting up udev rules for USB Fingerprint Scanner..."
if [ -d "/etc/udev/rules.d" ]; then
    if [ -w "/etc/udev/rules.d" ]; then
        cp 99-fingerprint.rules /etc/udev/rules.d/
        udevadm control --reload-rules && udevadm trigger 2>/dev/null || true
        echo "   -> udev rules installed successfully."
    else
        echo "   -> [Notice] To install udev rules for non-root USB device access, run:"
        echo "      sudo cp $SCRIPT_DIR/99-fingerprint.rules /etc/udev/rules.d/"
        echo "      sudo udevadm control --reload-rules && sudo udevadm trigger"
    fi
fi

echo ""
echo "3. Setting up optional systemd user service..."
SERVICE_DIR="$HOME/.config/systemd/user"
mkdir -p "$SERVICE_DIR"

SERVICE_FILE="$SERVICE_DIR/sfe-middleman.service"
cat << EOF > "$SERVICE_FILE"
[Unit]
Description=SFE Linux Biometric Middleman Proxy Server
After=network.target

[Service]
Type=simple
WorkingDirectory=$SCRIPT_DIR
ExecStart=$SCRIPT_DIR/sfe_linux_middleman 5000
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
EOF

echo "   -> Created systemd user service: $SERVICE_FILE"
systemctl --user daemon-reload 2>/dev/null || true

echo ""
echo "================================================="
echo " Installation Complete!                          "
echo " To run server manually: ./run_middleman.sh      "
echo " To run as systemd service:                      "
echo "   systemctl --user enable --now sfe-middleman   "
echo "================================================="
