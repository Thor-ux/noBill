#!/usr/bin/env bash
set -euo pipefail

SRC="$(cd "$(dirname "$0")/.." && pwd)"
APP=/opt/nobill
CONF=/etc/nobill
ENV_FILE=/etc/nobill.env
TLS_DIR=$CONF/tls

DOMAIN=""
MODE=""
for arg in "$@"; do
  case "$arg" in
    --cloudflare) MODE=cloudflare ;;
    --letsencrypt) MODE=letsencrypt ;;
    -*) echo "Unknown option: $arg"; exit 1 ;;
    *) DOMAIN="$arg" ;;
  esac
done

[ "$(id -u)" -eq 0 ] || { echo "Please run as root: sudo bash deploy/install.sh $*"; exit 1; }
[ -f "$SRC/server/index.js" ] && [ -d "$SRC/dist" ] || { echo "Run this from the extracted nobill folder."; exit 1; }
mkdir -p "$CONF" && chmod 755 "$CONF"

[ -n "$DOMAIN" ] || DOMAIN="$(cat "$CONF/domain" 2>/dev/null || true)"
[ -n "$MODE" ] || MODE="$(cat "$CONF/mode" 2>/dev/null || echo letsencrypt)"
if [ -z "$DOMAIN" ]; then
  echo "First install needs your domain: sudo bash deploy/install.sh yourdomain.com --cloudflare"; exit 1
fi
DOMAIN="${DOMAIN,,}"
if ! [[ "$DOMAIN" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]]; then
  echo "\"$DOMAIN\" doesn't look like a domain (example: mysite.com, without https:// or www)."; exit 1
fi
echo "$DOMAIN" > "$CONF/domain"
echo "$MODE" > "$CONF/mode"

export DEBIAN_FRONTEND=noninteractive
step() { printf '\n==> %s\n' "$1"; }

CF_IPS="173.245.48.0/20 103.21.244.0/22 103.22.200.0/22 103.31.4.0/22 141.101.64.0/18 108.162.192.0/18 190.93.240.0/20 188.114.96.0/20 197.234.240.0/22 198.41.128.0/17 162.158.0.0/15 104.16.0.0/13 104.24.0.0/14 172.64.0.0/13 131.0.72.0/22 2400:cb00::/32 2606:4700::/32 2803:f800::/32 2405:b500::/32 2405:8100::/32 2a06:98c0::/29 2c0f:f248::/32"

if [ ! -f "$CONF/.packages-done" ]; then
  step "Installing system updates and security tools"
  apt-get update
  apt-get upgrade -y
  apt-get install -y ca-certificates curl gnupg openssl ufw fail2ban python3-systemd unattended-upgrades
  touch "$CONF/.packages-done"
fi

if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  step "Installing Node.js 22"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

if ! command -v caddy >/dev/null; then
  step "Installing Caddy"
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install -y caddy
fi

step "Hardening the server"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
mkdir -p /etc/fail2ban/jail.d
cat > /etc/fail2ban/jail.d/nobill.local <<'EOF'
[sshd]
enabled  = true
backend  = systemd
maxretry = 5
findtime = 10m
bantime  = 1h
EOF
systemctl enable --quiet fail2ban && systemctl restart fail2ban || echo "  (fail2ban didn't start; check: systemctl status fail2ban)"
if [ -s /root/.ssh/authorized_keys ] || ls /home/*/.ssh/authorized_keys >/dev/null 2>&1; then
  cat > /etc/ssh/sshd_config.d/10-nobill.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
MaxAuthTries 4
EOF
  mkdir -p /run/sshd
  if sshd -t 2>/dev/null; then
    systemctl reload ssh 2>/dev/null || systemctl reload sshd 2>/dev/null || true
    echo "  SSH: password logins disabled (SSH key only)."
  else
    rm -f /etc/ssh/sshd_config.d/10-nobill.conf
  fi
else
  echo "  SSH: no SSH key found, so password login stays on. Add a key and re-run to lock it down."
fi
cat > /etc/sysctl.d/90-nobill.conf <<'EOF'
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 4096
net.core.somaxconn = 4096
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1
EOF
sysctl -q --system >/dev/null || true

if [ ! -f /swapfile ] && [ "$(free -m | awk '/^Mem:/{print $2}')" -lt 2000 ]; then
  step "Adding 1 GB swap"
  if fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  else
    rm -f /swapfile; echo "  (swap not supported here; skipped)"
  fi
fi

step "Copying the app to $APP"
id nobill >/dev/null 2>&1 || useradd --system --home-dir "$APP" --shell /usr/sbin/nologin nobill
mkdir -p "$APP/.cache"
rm -rf "$APP/api" "$APP/server" "$APP/dist"
cp -r "$SRC/api" "$SRC/server" "$SRC/dist" "$SRC/package.json" "$APP/"
chown -R root:root "$APP" && chmod -R go-w "$APP"
chown -R nobill:nobill "$APP/.cache"
chmod 700 "$APP/.cache"

if [ ! -f "$ENV_FILE" ]; then
  step "OMDb key"
  read -rsp "Paste your OMDb API key (it won't show on screen), then press Enter: " KEY; echo
  KEY="$(printf '%s' "$KEY" | tr -d '[:space:]')"
  [[ "$KEY" =~ ^[A-Za-z0-9]+$ ]] || { echo "That doesn't look like an OMDb key. Run the script again."; exit 1; }
  ( umask 077
    cat > "$ENV_FILE" <<EOF
OMDB_API_KEY=$KEY
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
BEHIND_CLOUDFLARE=false
OMDB_DAILY_BUDGET=90000
OMDB_MAX_PER_MINUTE=300
EOF
  )
  unset KEY
fi
if [ "$MODE" = cloudflare ]; then
  sed -i 's/^BEHIND_CLOUDFLARE=.*/BEHIND_CLOUDFLARE=true/' "$ENV_FILE"
else
  sed -i 's/^BEHIND_CLOUDFLARE=.*/BEHIND_CLOUDFLARE=false/' "$ENV_FILE"
fi
grep -q '^BLOCKLIST_FILE=' "$ENV_FILE" || echo "BLOCKLIST_FILE=$CONF/blocked.txt" >> "$ENV_FILE"
if [ ! -f "$CONF/blocked.txt" ]; then
  cat > "$CONF/blocked.txt" <<'EOF'
EOF
  chmod 644 "$CONF/blocked.txt"
fi
chown root:root "$ENV_FILE" && chmod 600 "$ENV_FILE"

read_pem() {
  echo "Paste the $1 (all lines, including -----BEGIN and -----END), then press Enter:"
  local line out=""
  while IFS= read -r line; do
    line="${line%$'\r'}"
    out+="$line"$'\n'
    [[ "$line" == -----END* ]] && break
  done
  printf '%s' "$out" > "$2"
}
if [ "$MODE" = cloudflare ] && [ ! -s "$TLS_DIR/origin.key" ]; then
  step "Cloudflare Origin Certificate (Cloudflare → SSL/TLS → Origin Server → Create Certificate)"
  mkdir -p "$TLS_DIR"
  ( umask 077
    read_pem "Origin Certificate" "$TLS_DIR/origin.pem"
    read_pem "Private Key" "$TLS_DIR/origin.key"
  )
  if ! openssl x509 -noout -in "$TLS_DIR/origin.pem" 2>/dev/null || ! openssl pkey -noout -in "$TLS_DIR/origin.key" 2>/dev/null; then
    rm -f "$TLS_DIR/origin.pem" "$TLS_DIR/origin.key"
    echo "That certificate or key isn't valid. Run the script again and paste them carefully."; exit 1
  fi
  if [ "$(openssl x509 -noout -pubkey -in "$TLS_DIR/origin.pem")" != "$(openssl pkey -pubout -in "$TLS_DIR/origin.key")" ]; then
    rm -f "$TLS_DIR/origin.pem" "$TLS_DIR/origin.key"
    echo "The private key doesn't belong to that certificate. Run the script again."; exit 1
  fi
fi
if [ -d "$TLS_DIR" ]; then
  chown -R root:caddy "$TLS_DIR" && chmod 750 "$TLS_DIR" && chmod 640 "$TLS_DIR"/*
fi

step "Starting noBill"
cp "$SRC/deploy/nobill.service" /etc/systemd/system/nobill.service
systemctl daemon-reload
systemctl enable --quiet nobill
systemctl restart nobill

step "Firewall"
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw limit OpenSSH >/dev/null
for _ in $(seq 1 60); do
  num="$(ufw status numbered | grep -E '^\[ *[0-9]+\] +(80|443|80,443)(/tcp)?( \(v6\))? ' | head -1 | sed -E 's/^\[ *([0-9]+)\].*/\1/' || true)"
  [ -n "$num" ] || break
  ufw --force delete "$num" >/dev/null
done
if [ "$MODE" = cloudflare ]; then
  for ip in $CF_IPS; do
    ufw allow proto tcp from "$ip" to any port 80,443 >/dev/null
  done
  echo "  Web ports open to Cloudflare only (direct visits to the server IP are blocked)."
else
  ufw allow 80/tcp >/dev/null
  ufw allow 443/tcp >/dev/null
fi
ufw --force enable >/dev/null

step "HTTPS for $DOMAIN ($MODE)"
if [ "$MODE" = cloudflare ]; then
  TLS_LINE="tls $TLS_DIR/origin.pem $TLS_DIR/origin.key"
else
  TLS_LINE="# automatic Let's Encrypt certificate"
fi
sed -e "s/example\.com/$DOMAIN/g" -e "s|#TLS_LINE#|$TLS_LINE|" "$SRC/deploy/Caddyfile" > /etc/caddy/Caddyfile
if ! caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1; then
  caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile; exit 1
fi
mkdir -p /var/log/caddy && chown -R caddy:caddy /var/log/caddy
systemctl enable --quiet caddy
systemctl reload caddy 2>/dev/null || systemctl restart caddy
sleep 2
if ! systemctl is-active --quiet caddy; then
  echo "⚠ Caddy (the HTTPS server) didn't start:"; journalctl -u caddy -n 20 --no-pager; exit 1
fi

step "Health check"
out=""
for _ in $(seq 1 15); do
  out="$(curl -sS http://127.0.0.1:3000/api/health 2>/dev/null || true)"
  [ -n "$out" ] && break
  sleep 1
done
if [ -n "$out" ]; then
  echo "$out"
  echo
  echo "✓ noBill is running. Open https://$DOMAIN/ in a minute."
  [ "$MODE" = cloudflare ] && echo "  (Cloudflare's DNS records must be Proxied (orange cloud), with SSL/TLS mode Full (strict).)"
else
  echo "⚠ noBill didn't answer. See the log: journalctl -u nobill -n 50"
  exit 1
fi
