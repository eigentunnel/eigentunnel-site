#!/bin/bash
# EigenTunnel leaf installer v5 (eigentunnel-core e7eb2ae) - bootstrap. Run through the one-line command only:
#   curl -fsSLo /tmp/et-install.sh https://eigentunnel.com/install/v5/et-install.sh && echo "<sha256>  /tmp/et-install.sh" | shasum -a 256 -c - && sudo bash /tmp/et-install.sh <activation-code>
# Downloads the package, checks its pinned sha256, and runs it. A wrong sha stops everything (no fallback).
set -euo pipefail
PKG_URL="https://eigentunnel.com/install/v5/eigentunnel-leaf-e7eb2ae-macos.tgz"
PKG_SHA256="d3139632b1f4d26641e27f66c1de171d869d6df88c049eb7b807af0eb62f5259"
stop() { printf '\nSTOPPED: %s\nNothing was installed. You can run the same command again later.\n' "$1"; exit 1; }
[ "$(uname -s)" = Darwin ] || stop "this installer is for macOS."
[ "$(id -u)" = 0 ] || stop "run it with sudo (the one-line command does this)."
echo "EigenTunnel installer v5 (build e7eb2ae). This takes a few minutes."
W=$(mktemp -d /var/root/.et-install.XXXXXX); chmod 700 "$W"; trap 'rm -rf "$W"' EXIT
/usr/bin/curl -fsSL --proto '=https' --tlsv1.2 -m 300 -o "$W/pkg.tgz" "$PKG_URL" || stop "could not download the EigenTunnel package (check the internet connection)."
GOT=$(/usr/bin/shasum -a 256 "$W/pkg.tgz" | cut -d' ' -f1)
[ "$GOT" = "$PKG_SHA256" ] || stop "the downloaded package failed its security check (sha256 $GOT). Do not retry on this network; reply to the email."
/usr/bin/tar -xzf "$W/pkg.tgz" -C "$W" || stop "the package could not be unpacked."
bash "$W/payload/install.sh" --token "${1:-}" --user "${SUDO_USER:-$(stat -f %Su /dev/console)}" "${@:2}"
