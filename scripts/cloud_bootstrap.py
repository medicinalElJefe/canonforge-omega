from __future__ import annotations

import argparse
from pathlib import Path
import secrets


def main() -> None:
    ap = argparse.ArgumentParser(description="Create an OMEGA Cloud environment file with fresh secrets.")
    ap.add_argument("--out", default="cloud/omega-cloud/.env.cloud")
    ap.add_argument("--domain", default="omega.example.com")
    args = ap.parse_args()

    path = Path(args.out)
    if path.exists():
        raise SystemExit(f"refusing to overwrite existing cloud secrets: {path}")

    admin = secrets.token_urlsafe(32)
    session = secrets.token_urlsafe(48)
    gateway = secrets.token_urlsafe(32)
    text = f"""OMEGA_CLOUD_MODE=1
OMEGA_DOMAIN={args.domain}
OMEGA_PUBLIC_URL=https://{args.domain}
OMEGA_CLOUD_ADMIN_TOKEN={admin}
OMEGA_SESSION_SECRET={session}
OMEGA_GATEWAY_TOKEN={gateway}
OMEGA_SESSION_TTL=43200
OMEGA_COOKIE_SECURE=1
OMEGA_DATA=/data
OMEGA_HOST=0.0.0.0
OMEGA_PORT=8127
OMEGA_STREAM_ENABLED=1
OMEGA_STREAM_HOST=0.0.0.0
OMEGA_STREAM_PORT=8128
OMEGA_HYBRID_ROOTS=/workspace
"""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    try:
        path.chmod(0o600)
    except OSError:
        pass
    print(f"Created {path}")
    print("OMEGA Cloud operator token (store securely; shown once):")
    print(admin)


if __name__ == "__main__":
    main()
