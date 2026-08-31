from __future__ import annotations

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from dataclasses import asdict
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import json
import mimetypes
import os
import math
import hmac

from .runtime import OmegaRuntime
from .schema import Address20736, CanonicalMetrics, EvidenceClass
from .modes import catalog as mode_catalog, evaluate as evaluate_mode
from .capabilities import CAPABILITIES, MENUS, GATES
from .capacity import (
    CAPACITY_TIERS,
    CAPACITY_61917364224,
    CAPACITY_145152,
    CapacityAddress61917364224,
    StarAddress145152,
    capacity_packet,
)
from .systems import catalog as system_catalog, family_catalog, coverage as system_coverage
from .host import compile_observation
from .shell import route_packet
from .stream import start_state_stream, status as stream_status
from .corpus import classify_name
from .forecast import frozen_prior
from .plugins import inspect_plugin, run_isolated
from .adapters.hybrid import HybridStep, validate_plan, execute_plan
from .adapters.workbook import inspect_workbook, roundtrip_workbook
from .adapters.earth import GeoPoint, destination, haversine_m
from .calculus import quantize_heading
from .orchestrator import evaluate_all
from .release import verify_manifest
from .acceptance import evaluate as evaluate_acceptance
from .language import decode_packet
from .intelligence import plan as plan_objective
from .adapters.biology import from_dicts as analyze_biology
from .mission import plan_prompt, validate_mission
from .reality import RealityConfig, analyze_delimited
from .training import retrieve as retrieve_training
from .observations import earth_context
from .cloud_auth import CloudAuth
from .provenance import public_catalog as provenance_catalog, capability_sources as provenance_capability_sources, summary as provenance_summary

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "web"
DATA = Path(os.environ.get("OMEGA_DATA", ROOT / "runtime-data"))
RUNTIME = OmegaRuntime(DATA)
AUTH = CloudAuth.from_env()
PLUGIN_ROOT = (ROOT / "plugins").resolve()


def _approved_hybrid_roots():
    raw = os.environ.get("OMEGA_HYBRID_ROOTS", str(ROOT))
    parts = [x.strip() for x in raw.replace(os.pathsep, ";").split(";") if x.strip()]
    return [Path(x).expanduser().resolve() for x in parts] or [ROOT.resolve()]


def _resolve_approved_root(requested):
    approved = _approved_hybrid_roots()
    if not requested:
        return approved[0]
    path = Path(str(requested)).expanduser().resolve()
    for root in approved:
        if path == root or root in path.parents:
            return path
    raise PermissionError("requested root is outside OMEGA_HYBRID_ROOTS")


def _plugin_catalog():
    out = []
    if not PLUGIN_ROOT.is_dir():
        return out
    for manifest in sorted(PLUGIN_ROOT.rglob("plugin.json")):
        info = inspect_plugin(manifest.parent)
        row = {"path": str(manifest.parent.relative_to(PLUGIN_ROOT)), "status": info.get("status", "FAIL")}
        if "manifest" in info:
            data = info["manifest"]
            row.update({k: data.get(k) for k in ("id", "name", "version", "api_version", "permissions", "capabilities", "mutations", "deterministic")})
        if info.get("errors"):
            row["errors"] = info["errors"]
        out.append(row)
    return out


def _plugin_by_id(plugin_id):
    matches = []
    for manifest in PLUGIN_ROOT.rglob("plugin.json") if PLUGIN_ROOT.is_dir() else []:
        try:
            data = json.loads(manifest.read_text(encoding="utf-8"))
            if data.get("id") == plugin_id:
                matches.append(manifest.parent.resolve())
        except Exception:
            pass
    return matches[0] if len(matches) == 1 else None


def _json_safe(value):
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if isinstance(value, dict):
        return {k: _json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(v) for v in value]
    return value


class Handler(BaseHTTPRequestHandler):
    server_version = "OmegaGenesis/1.1"

    def _json(self, status, obj, head_only=False, extra_headers=None):
        raw = json.dumps(_json_safe(obj), ensure_ascii=False, default=str, allow_nan=False, separators=(",", ":")).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        for key, value in (extra_headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        if not head_only:
            self.wfile.write(raw)

    def _body(self):
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length > 16 * 1024 * 1024:
            raise ValueError("request body exceeds 16 MiB")
        return json.loads(self.rfile.read(length) or b"{}")

    def _auth(self):
        host = self.client_address[0]
        if host in {"127.0.0.1", "::1"}:
            return True
        cookie = AUTH.cookie_value(self.headers.get("Cookie", ""))
        if AUTH.verify_session(cookie):
            return True
        supplied = self.headers.get("X-Omega-Gateway-Token", "")
        gateway = os.environ.get("OMEGA_GATEWAY_TOKEN", "")
        return bool((gateway and hmac.compare_digest(supplied, gateway)) or AUTH.verify_admin_token(supplied))

    def _governed_path(self, path: str) -> bool:
        return path.startswith("/api/") or path.startswith("/host/")

    def do_HEAD(self):
        path = urlparse(self.path).path
        if self._governed_path(path):
            if not self._auth():
                return self._json(401, {"error": "unauthorized_sovereign_ingress"}, head_only=True)
            if path in {"/api/health", "/host/current"}:
                return self._json(200, {"status": "OK", "runtime": "OMEGA_GENESIS", "version": "1.1.0"}, head_only=True)
            return self._json(405, {"error": "head_not_supported_for_endpoint"}, head_only=True)
        return self._static(path, head_only=True)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)
        if path == "/api/auth/status":
            authenticated = self._auth() if AUTH.enabled else True
            return self._json(200, {
                "auth_enabled": AUTH.enabled,
                "authenticated": authenticated,
                "cloud_mode": AUTH.cloud_mode,
                "public_url": os.environ.get("OMEGA_PUBLIC_URL"),
            })
        if self._governed_path(path) and not self._auth():
            return self._json(401, {"error": "unauthorized_sovereign_ingress"})

        try:
            if path == "/api/health":
                return self._json(200, {
                    "status": "OK",
                    "runtime": "OMEGA_GENESIS",
                    "version": "1.1.0",
                    "canonical_digest": RUNTIME.state.digest,
                    "state_id": RUNTIME.state.address.state_id,
                    "proof": RUNTIME.ledger.verify(),
                    "replay": RUNTIME.verify_replay(),
                    "stream": stream_status(),
                    "provenance": provenance_summary(ROOT),
                })
            if path == "/api/cloud/status":
                return self._json(200, {
                    "status": "PASS",
                    "authority": "OMEGA_CLOUD" if AUTH.cloud_mode else "LOCAL_HOST",
                    "cloud_mode": AUTH.cloud_mode,
                    "auth_enabled": AUTH.enabled,
                    "public_url": os.environ.get("OMEGA_PUBLIC_URL"),
                    "data_root": str(DATA),
                    "canonical_digest": RUNTIME.state.digest,
                    "state_id": RUNTIME.state.address.state_id,
                    "proof": RUNTIME.ledger.verify(),
                    "replay": RUNTIME.verify_replay(),
                    "stream": stream_status(),
                    "provenance": provenance_summary(ROOT),
                    "desktop_required": False,
                })
            if path == "/api/self-build/status":
                status_path = DATA / "self-build" / "status.json"
                if not status_path.is_file():
                    return self._json(200, {
                        "status": "PENDING",
                        "authority": "OMEGA_CLOUD" if AUTH.cloud_mode else "LOCAL_HOST",
                        "detail": "cloud self-build supervisor has not published a cycle yet",
                    })
                report = json.loads(status_path.read_text(encoding="utf-8"))
                return self._json(200, {
                    "status": "PASS" if report.get("decision") == "PASS" else "QUARANTINE",
                    "authority": report.get("authority", "OMEGA_CLOUD"),
                    "report": report,
                })
            if path in {"/api/state", "/host/current"}:
                return self._json(200, RUNTIME.snapshot())
            if path == "/host/projection/current":
                return self._json(200, RUNTIME.snapshot()["projection"])
            if path == "/host/proof/current":
                return self._json(200, {
                    "verify": RUNTIME.ledger.verify(),
                    "replay": RUNTIME.verify_replay(),
                    "records": RUNTIME.ledger.read()[-100:],
                })
            if path in {"/api/shell/current", "/host/shell/current"}:
                return self._json(200, route_packet(RUNTIME.state))
            if path == "/api/authority":
                return self._json(200, RUNTIME.authority_report())
            if path == "/api/history":
                return self._json(200, {"history": RUNTIME.history(int(query.get("limit", [100])[0]))})
            if path == "/api/stream/status":
                return self._json(200, stream_status())
            if path == "/api/acceptance":
                return self._json(200, evaluate_acceptance(ROOT, RUNTIME))
            if path == "/api/language/current":
                return self._json(200, decode_packet(RUNTIME.state))
            if path == "/api/modes":
                return self._json(200, {"modes": mode_catalog()})
            if path == "/api/orchestrate":
                return self._json(200, evaluate_all(RUNTIME.state))
            if path == "/api/capabilities":
                return self._json(200, {"menus": MENUS, "capabilities": CAPABILITIES, "acceptance_gates": GATES})
            if path == "/api/systems":
                return self._json(200, {
                    "coverage": system_coverage(),
                    "families": family_catalog(),
                    "systems": system_catalog(),
                })
            if path == "/api/capacity/tiers":
                return self._json(200, {
                    "tiers": CAPACITY_TIERS,
                    "boundary": "software representation/design tiers; no physical-dimension claim",
                })
            if path == "/api/capacity":
                index0 = int(query.get("index", [0])[0])
                return self._json(200, capacity_packet(index0))
            if path == "/api/star":
                index0 = int(query.get("index", [0])[0])
                star = StarAddress145152.from_index0(index0)
                return self._json(200, {
                    "index0": star.index0,
                    "state_id": star.state_id,
                    "capacity": CAPACITY_145152,
                    "star": star.star,
                    "canonical": {
                        "state_id": star.address.state_id,
                        "address": star.address.as_tuple(),
                    },
                    "boundary": "seven-host software layer; domain-specific representation, not universal physical proof",
                })
            if path == "/api/plugins":
                return self._json(200, {
                    "policy": "plugins propose/read/render within declared leases; kernel retains commit authority",
                    "plugins": _plugin_catalog(),
                })
            if path == "/api/proof":
                return self._json(200, {
                    "verify": RUNTIME.ledger.verify(),
                    "replay": RUNTIME.verify_replay(),
                    "records": RUNTIME.ledger.read()[-100:],
                })
            if path == "/api/replay":
                return self._json(200, RUNTIME.verify_replay())
            if path == "/api/forecast":
                return self._json(200, {
                    **asdict(frozen_prior(RUNTIME.state, int(query.get("horizon", [1])[0]))),
                    "evidence_class": "FORECAST",
                })
            if path == "/api/mode":
                mode_id = query.get("id", ["MODE188"])[0]
                return self._json(200, {
                    "mode": mode_id,
                    "result": evaluate_mode(mode_id, RUNTIME.state),
                    "state_digest": RUNTIME.state.digest,
                })
            if path == "/api/atlas":
                index0 = max(0, min(20735, int(query.get("index", [RUNTIME.state.address.index0])[0])))
                address = Address20736.from_index0(index0)
                return self._json(200, {
                    "index0": index0,
                    "state_id": address.state_id,
                    "address": address.as_tuple(),
                    "opposite": tuple(((v + 5) % 12) + 1 for v in address.as_tuple()),
                    "phase_portal_size": 12 ** 3,
                })
            if path == "/api/provenance":
                return self._json(200, provenance_catalog(ROOT))
            if path == "/api/provenance/capability":
                name = query.get("name", [""])[0]
                return self._json(200, provenance_capability_sources(ROOT, name))
            if path == "/api/corpus/classify":
                name = query.get("name", [""])[0]
                disposition, authority, role, why = classify_name(name)
                return self._json(200, {
                    "name": name,
                    "disposition": disposition,
                    "authority": authority,
                    "role": role,
                    "reason": why,
                })
            if path == "/api/release/verify":
                return self._json(200, verify_manifest(ROOT))
            if path == "/api/earth/context":
                lat = float(query.get("lat", [0])[0])
                lon = float(query.get("lon", [0])[0])
                return self._json(200, earth_context(lat, lon))
            if path == "/api/link/status":
                return self._json(200, {
                    "status": "OPTIONAL_NODE_LINK",
                    "authority": "OMEGA Cloud canonical host" if AUTH.cloud_mode else "local node/development host",
                    "cloud_pairing": "desktop and mobile nodes are optional; cloud state survives independently",
                    "canonical_mutation": False,
                    "desktop_required": False,
                })
            if path == "/api/host/status":
                import platform
                return self._json(200, {
                    "status": "PASS",
                    "host": platform.node(),
                    "platform": platform.platform(),
                    "python": platform.python_version(),
                    "cpu_count": os.cpu_count(),
                    "hybrid_roots": [str(x) for x in _approved_hybrid_roots()],
                    "canonical_digest": RUNTIME.state.digest,
                    "stream": stream_status(),
                })
        except Exception as exc:
            return self._json(422, {"error": type(exc).__name__, "detail": str(exc)})

        return self._static(path)

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/auth/login":
            try:
                body = self._body()
            except Exception as exc:
                return self._json(400, {"error": "invalid_json", "detail": str(exc)})
            if not AUTH.enabled:
                return self._json(503, {"error": "cloud_auth_not_configured"})
            if not AUTH.verify_admin_token(str(body.get("token", ""))):
                return self._json(401, {"error": "invalid_operator_token"})
            session = AUTH.issue_session()
            return self._json(200, {"status": "PASS", "authenticated": True}, extra_headers={"Set-Cookie": AUTH.session_cookie(session)})
        if path == "/api/auth/logout":
            return self._json(200, {"status": "PASS", "authenticated": False}, extra_headers={"Set-Cookie": AUTH.clear_cookie()})
        if self._governed_path(path) and not self._auth():
            return self._json(401, {"error": "unauthorized_sovereign_ingress"})
        try:
            body = self._body()
        except Exception as exc:
            return self._json(400, {"error": "invalid_json", "detail": str(exc)})

        try:
            if path == "/api/transition":
                address = Address20736(*body["address"])
                metrics = CanonicalMetrics(**body["metrics"])
                evidence = EvidenceClass(body.get("evidence_class", "DERIVED"))
                return self._json(200, RUNTIME.propose(
                    address,
                    metrics,
                    evidence,
                    mode=body.get("mode", "MODE188"),
                    payload=body.get("payload"),
                    allow_conditional=bool(body.get("allow_conditional", False)),
                ))
            if path == "/api/recovery/rollback":
                result = RUNTIME.rollback_to_digest(str(body["digest"]), reason=str(body.get("reason", "operator recovery")))
                return self._json(200 if result.get("committed") else 422, result)
            if path == "/api/host/compile":
                packet = compile_observation(
                    evidence_class=body["evidence_class"],
                    source_id=body["source_id"],
                    authority=body["authority"],
                    payload=dict(body.get("payload") or {}),
                    observed_at=body.get("observed_at"),
                    retrieved_at=body.get("retrieved_at"),
                    immutable_ref=body.get("immutable_ref"),
                    checksum=body.get("checksum"),
                    note=str(body.get("note", "")),
                )
                return self._json(200, packet.public_dict())
            if path == "/api/ai/plan":
                return self._json(200, plan_objective(RUNTIME.state, str(body.get("objective", ""))))
            if path == "/api/hybrid/plan":
                return self._json(200, plan_prompt(str(body.get("prompt", "")), project_path=str(body.get("project_path", "."))))
            if path == "/api/mission/validate":
                result = validate_mission(dict(body))
                return self._json(200 if result.get("status") == "PASS" else 422, result)
            if path == "/api/reality/analyze":
                config = RealityConfig(**dict(body.get("config") or {}))
                return self._json(200, analyze_delimited(str(body.get("text", "")), config))
            if path == "/api/training/retrieve":
                root = _resolve_approved_root(body.get("root"))
                return self._json(200, retrieve_training(root, str(body.get("query", "")), limit=int(body.get("limit", 8))))
            if path == "/api/bio/analyze":
                return self._json(200, analyze_biology(list(body.get("nodes") or []), list(body.get("relations") or [])))
            if path == "/api/dewey-bal/validate":
                return self._json(200, RUNTIME.validate_dewey_bal_contract(
                    int(body["source_state"]),
                    int(body["target_state"]),
                    float(body["source_burden"]),
                    float(body["target_burden"]),
                    str(body["edge"]),
                ))
            if path == "/api/plugins/run":
                plugin_id = str(body.get("id", ""))
                plugin_dir = _plugin_by_id(plugin_id)
                if not plugin_dir:
                    return self._json(404, {"error": "plugin_not_found_or_ambiguous", "id": plugin_id})
                payload = dict(body.get("payload") or {})
                payload.setdefault("state_id", RUNTIME.state.address.state_id)
                payload.setdefault("state_digest", RUNTIME.state.digest)
                result = run_isolated(plugin_dir, payload, timeout=min(30, max(1, int(body.get("timeout", 10)))))
                return self._json(200, result)
            if path == "/api/hybrid/validate":
                root = _resolve_approved_root(body.get("root"))
                steps = [HybridStep(str(x["op"]), x.get("path"), x.get("output"), x.get("args")) for x in body.get("steps", [])]
                return self._json(200, {**validate_plan(root, steps), "root": str(root)})
            if path == "/api/hybrid/run":
                root = _resolve_approved_root(body.get("root"))
                steps = [HybridStep(str(x["op"]), x.get("path"), x.get("output"), x.get("args")) for x in body.get("steps", [])]
                result = execute_plan(root, steps)
                result["root"] = str(root)
                return self._json(200 if result.get("status") == "PASS" else 422, result)
            if path == "/api/workbook/inspect":
                root = _resolve_approved_root(body.get("root"))
                return self._json(200, inspect_workbook(root, str(body["path"])))
            if path == "/api/workbook/roundtrip":
                root = _resolve_approved_root(body.get("root"))
                result = roundtrip_workbook(root, str(body["path"]), str(body["output"]))
                return self._json(200 if result.get("status") == "PASS" else 422, result)
            if path == "/api/earth/destination":
                origin = GeoPoint(float(body["lat"]), float(body["lon"]))
                bearing = float(body.get("bearing_rad", 0))
                distance_m = float(body.get("distance_m", 0))
                target = destination(origin, bearing, distance_m)
                return self._json(200, {
                    "origin": asdict(origin),
                    "destination": asdict(target),
                    "requested_distance_m": distance_m,
                    "computed_distance_m": haversine_m(origin, target),
                    "bearing_rad": bearing,
                    "quantized_heading_rad": quantize_heading(bearing),
                    "evidence_class": "DERIVED",
                    "boundary": "geodesic computation only; not a claim about current ground conditions",
                })
        except Exception as exc:
            return self._json(422, {"error": type(exc).__name__, "detail": str(exc)})
        self._json(404, {"error": "not_found"})

    def _static(self, path, head_only=False):
        rel = "index.html" if path in {"/", ""} else path.lstrip("/")
        file_path = (WEB / rel).resolve()
        if WEB.resolve() != file_path and WEB.resolve() not in file_path.parents:
            return self._json(403, {"error": "forbidden"}, head_only=head_only)
        if not file_path.is_file():
            return self._json(404, {"error": "static_not_found", "path": path}, head_only=head_only)
        raw = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(str(file_path))[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if not head_only:
            self.wfile.write(raw)

    def log_message(self, fmt, *args):
        pass


def main():
    if AUTH.cloud_mode and not AUTH.enabled:
        raise RuntimeError("OMEGA_CLOUD_MODE requires OMEGA_CLOUD_ADMIN_TOKEN (or OMEGA_GATEWAY_TOKEN) and OMEGA_SESSION_SECRET")
    host = os.environ.get("OMEGA_HOST", "127.0.0.1")
    port = int(os.environ.get("OMEGA_PORT", "8127"))
    if os.environ.get("OMEGA_STREAM_ENABLED", "1").lower() not in {"0", "false", "off", "no"}:
        stream_host = os.environ.get("OMEGA_STREAM_HOST", "127.0.0.1")
        stream_port = int(os.environ.get("OMEGA_STREAM_PORT", "8128"))
        start_state_stream(RUNTIME, stream_host, stream_port, auth=AUTH if AUTH.cloud_mode else None)
    print(f"OMEGA Genesis → http://{host}:{port}")
    print(f"Canonical capacity namespace → {CAPACITY_61917364224:,} software addresses")
    ThreadingHTTPServer((host, port), Handler).serve_forever()


if __name__ == "__main__":
    main()
