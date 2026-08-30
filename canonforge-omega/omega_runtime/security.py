from __future__ import annotations

from hmac import compare_digest
from ipaddress import ip_address


def is_loopback(host: str | None) -> bool:
    if not host:
        return False
    normalized = host.strip().strip("[]")
    try:
        return ip_address(normalized).is_loopback
    except ValueError:
        return normalized.lower() in {"localhost"}


def gateway_authorized(*, client_host: str | None, presented_token: str | None, configured_token: str | None) -> bool:
    """Authorize a sovereign API request without weakening localhost operation.

    Local loopback clients are permitted because the Windows runtime binds to
    127.0.0.1 by default. Any non-loopback ingress requires an explicitly
    configured shared gateway token and a constant-time exact match.
    """
    if is_loopback(client_host):
        return True
    if not configured_token or not presented_token:
        return False
    return compare_digest(presented_token, configured_token)
