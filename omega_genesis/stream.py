from __future__ import annotations

import asyncio
import json
import threading
import time
from typing import Any

try:
    from websockets.asyncio.server import serve
except Exception:  # pragma: no cover - dependency failure is surfaced by status
    serve = None

_STATUS: dict[str, Any] = {
    "status": "STOPPED",
    "host": None,
    "port": None,
    "clients": 0,
    "started_at": None,
    "error": None,
}
_LOCK = threading.RLock()


def status() -> dict[str, Any]:
    with _LOCK:
        return dict(_STATUS)


async def _client(websocket, runtime, interval: float) -> None:
    with _LOCK:
        _STATUS["clients"] += 1
    try:
        while True:
            snap = runtime.snapshot()
            await websocket.send(json.dumps({
                "type": "OMEGA_CANONICAL_HEARTBEAT",
                "state": snap["state"],
                "proof": snap["proof"],
                "replay": snap["replay"],
            }, separators=(",", ":"), allow_nan=False))
            await asyncio.sleep(interval)
    finally:
        with _LOCK:
            _STATUS["clients"] = max(0, int(_STATUS["clients"]) - 1)


async def _run(runtime, host: str, port: int, interval: float) -> None:
    if serve is None:
        raise RuntimeError("websockets dependency is unavailable")
    async with serve(lambda ws: _client(ws, runtime, interval), host, port, max_size=1_048_576, ping_interval=20, ping_timeout=20):
        with _LOCK:
            _STATUS.update(status="LIVE", host=host, port=port, started_at=time.time(), error=None)
        await asyncio.Future()


def start_state_stream(runtime, host: str = "127.0.0.1", port: int = 8128, interval: float = 1.0) -> threading.Thread:
    def runner() -> None:
        try:
            asyncio.run(_run(runtime, host, port, interval))
        except Exception as exc:
            with _LOCK:
                _STATUS.update(status="FAILED", host=host, port=port, error=f"{type(exc).__name__}: {exc}")

    with _LOCK:
        if _STATUS["status"] in {"STARTING", "LIVE"}:
            raise RuntimeError("state stream is already running")
        _STATUS.update(status="STARTING", host=host, port=port, clients=0, error=None)
    thread = threading.Thread(target=runner, name="omega-genesis-stream", daemon=True)
    thread.start()
    return thread
