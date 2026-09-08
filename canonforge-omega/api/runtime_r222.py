from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import hmac
import json
import os
import secrets
import time

from fastapi import HTTPException
from starlette.routing import Mount

from api.app import APPROVED_BUILD_ROOT, GATEWAY_TOKEN, _pairing, app

R222_ENROLLMENT_SCHEMA = "OMEGA_HYBRID_OUTBOUND_ENROLLMENT_R222"
R222_ENROLLMENT_TTL_SECONDS = 120


def _device_id() -> str:
    raw = (os.environ.get("OMEGA_AGENT_ID") or os.environ.get("COMPUTERNAME") or "omega-pc").strip()
    safe = "".join(ch for ch in raw if ch.isalnum() or ch in "._:-")[:120]
    return safe or "omega-pc"


def _signing_message(
    issued_at: int,
    expires_at: int,
    nonce: str,
    device_id: str,
    approved_root: str,
    token_sha256: str,
) -> str:
    return "\n".join([
        R222_ENROLLMENT_SCHEMA,
        str(issued_at),
        str(expires_at),
        nonce,
        device_id,
        approved_root,
        token_sha256,
    ])


@app.get("/api/hybrid/enrollment")
def hybrid_outbound_enrollment_r222() -> dict:
    """Mint a local pairing credential plus a short-lived HMAC enrollment assertion.

    The assertion is created only by the localhost sovereign runtime and is signed with
    OMEGA_GATEWAY_TOKEN. The cloud verifies it with the corresponding
    SOVEREIGN_GATEWAY_TOKEN before accepting the credential into the existing durable
    OMEGA_RUNTIME identity. No inbound cloud-to-PC callback is required.
    """
    if not GATEWAY_TOKEN:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "LOCAL_GATEWAY_ENROLLMENT_KEY_NOT_CONFIGURED",
                "boundary": "R222 refuses unsigned public pairing. OMEGA_GATEWAY_TOKEN must match the cloud SOVEREIGN_GATEWAY_TOKEN.",
            },
        )

    issued_at = int(time.time())
    expires_at = issued_at + R222_ENROLLMENT_TTL_SECONDS
    nonce = secrets.token_hex(18)
    device_id = _device_id()
    approved_root = str(APPROVED_BUILD_ROOT.expanduser().resolve())
    token = _pairing.issue(datetime.now(timezone.utc).isoformat())
    token_sha256 = hashlib.sha256(token.encode("utf-8")).hexdigest()
    message = _signing_message(issued_at, expires_at, nonce, device_id, approved_root, token_sha256)
    signature = hmac.new(GATEWAY_TOKEN.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()

    return {
        "ok": True,
        "schema": R222_ENROLLMENT_SCHEMA,
        "issuedAt": issued_at,
        "expiresAt": expires_at,
        "nonce": nonce,
        "deviceId": device_id,
        "approvedRoot": approved_root,
        "token": token,
        "tokenSha256": token_sha256,
        "signature": signature,
        "transport": "LOCALHOST_MINTED_OUTBOUND_HMAC_ENROLLMENT",
        "inboundCloudToPcRequired": False,
        "executionAuthorityGranted": False,
        "boundary": "This packet establishes an authenticated outbound bridge credential only. Native execution remains separately locally authorized and time bounded.",
    }


@app.get("/api/hybrid/r222/local-contract")
def hybrid_local_contract_r222() -> dict:
    return {
        "ok": True,
        "schema": R222_ENROLLMENT_SCHEMA,
        "approvedRoot": str(APPROVED_BUILD_ROOT.expanduser().resolve()),
        "gatewayEnrollmentKeyConfigured": bool(GATEWAY_TOKEN),
        "pairingGeneration": _pairing.generation,
        "inboundCloudToPcRequired": False,
        "canonicalPort": 8127,
    }


def _ensure_successor_api_precedes_ui_mount() -> None:
    """Keep the catch-all static UI behind API routes added by successor modules.

    `api.app` intentionally mounts the UI last relative to its own routes. R222 imports
    that preserved app and extends it, which means the inherited `/` Mount would
    otherwise sit ahead of the new R222 API routes and can truthfully return a static
    404 before FastAPI reaches them. Move only the named UI mount to the tail. This does
    not replace the app, duplicate a runtime, or alter any authority/evidence state.
    """
    ui_mounts = [
        route
        for route in app.router.routes
        if isinstance(route, Mount) and getattr(route, "name", None) == "ui"
    ]
    for route in ui_mounts:
        app.router.routes.remove(route)
        app.router.routes.append(route)


_ensure_successor_api_precedes_ui_mount()
