from __future__ import annotations

from dataclasses import dataclass
import base64
import hashlib
import hmac
import json
import os
import time


def _b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64d(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


@dataclass(frozen=True)
class CloudAuth:
    admin_token: str
    session_secret: str
    ttl_seconds: int = 43_200
    secure_cookie: bool = True
    cloud_mode: bool = False

    @classmethod
    def from_env(cls) -> "CloudAuth":
        admin = os.environ.get("OMEGA_CLOUD_ADMIN_TOKEN") or os.environ.get("OMEGA_GATEWAY_TOKEN", "")
        secret = os.environ.get("OMEGA_SESSION_SECRET") or admin
        ttl = max(300, min(604_800, int(os.environ.get("OMEGA_SESSION_TTL", "43200"))))
        secure = os.environ.get("OMEGA_COOKIE_SECURE", "1").lower() not in {"0", "false", "off", "no"}
        cloud = os.environ.get("OMEGA_CLOUD_MODE", "0").lower() in {"1", "true", "on", "yes"}
        return cls(admin, secret, ttl, secure, cloud)

    @property
    def enabled(self) -> bool:
        return bool(self.admin_token and self.session_secret)

    def verify_admin_token(self, candidate: str) -> bool:
        return bool(self.admin_token) and hmac.compare_digest(
            candidate.encode("utf-8"), self.admin_token.encode("utf-8")
        )

    def issue_session(self, subject: str = "operator", *, now: int | None = None) -> str:
        if not self.enabled:
            raise RuntimeError("cloud authentication is not configured")
        issued = int(time.time() if now is None else now)
        payload = json.dumps(
            {"sub": subject, "iat": issued, "exp": issued + self.ttl_seconds, "v": 1},
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
        body = _b64e(payload)
        signature = hmac.new(
            self.session_secret.encode("utf-8"), body.encode("ascii"), hashlib.sha256
        ).digest()
        return f"{body}.{_b64e(signature)}"

    def verify_session(self, token: str, *, now: int | None = None) -> bool:
        if not self.enabled or not token or "." not in token:
            return False
        body, encoded_sig = token.split(".", 1)
        expected = hmac.new(
            self.session_secret.encode("utf-8"), body.encode("ascii"), hashlib.sha256
        ).digest()
        try:
            supplied = _b64d(encoded_sig)
            payload = json.loads(_b64d(body).decode("utf-8"))
        except Exception:
            return False
        if not hmac.compare_digest(expected, supplied):
            return False
        current = int(time.time() if now is None else now)
        return (
            payload.get("v") == 1
            and payload.get("sub") == "operator"
            and isinstance(payload.get("exp"), int)
            and isinstance(payload.get("iat"), int)
            and payload["iat"] <= current < payload["exp"]
        )

    def session_cookie(self, token: str) -> str:
        flags = ["Path=/", "HttpOnly", "SameSite=Strict", f"Max-Age={self.ttl_seconds}"]
        if self.secure_cookie:
            flags.append("Secure")
        return "omega_session=" + token + "; " + "; ".join(flags)

    def clear_cookie(self) -> str:
        flags = ["Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=0"]
        if self.secure_cookie:
            flags.append("Secure")
        return "omega_session=; " + "; ".join(flags)

    @staticmethod
    def cookie_value(header: str, name: str = "omega_session") -> str:
        for part in (header or "").split(";"):
            key, sep, value = part.strip().partition("=")
            if sep and key == name:
                return value
        return ""
