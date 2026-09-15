import importlib.util
from pathlib import Path
import sys
import urllib.error

SCRIPT = Path(__file__).parents[1] / "scripts" / "release_live_probe_r226.py"
MODULE_NAME = "release_live_probe_r226"
spec = importlib.util.spec_from_file_location(MODULE_NAME, SCRIPT)
assert spec and spec.loader
r226 = importlib.util.module_from_spec(spec)
sys.modules[MODULE_NAME] = r226
spec.loader.exec_module(r226)


def packets(sha="abc", lease="lease", run_id="1", attempt="1"):
    r217_boundaries = {key: True for key in r226.R217_BOUNDARIES}
    r211_boundaries = {key: True for key in r226.R211_BOUNDARIES}
    return {
        "r217": {
            "ok": True, "schema": "OMEGA_RELEASE_PROVENANCE_R217", "state": "DEPLOYMENT_PROVENANCE_BOUND",
            "canonicalGitSha": sha, "releaseLease": lease, "releaseRunId": run_id, "releaseRunAttempt": attempt,
            "authority": "DEPLOYMENT_PROVENANCE_ONLY_NOT_AUTHORIZATION", "truthBoundaries": r217_boundaries,
            "canonicalMutation": False, "promotionAuthorized": False,
        },
        "r211_manifest": {
            "ok": True, "schema": "OMEGA_OPERATIONAL_PROVENANCE_FABRIC_R211",
            "release": "r211-operational-provenance-fabric", "canonicalGitSha": sha,
            "receiptSha256": "a" * 64, "truthBoundaries": r211_boundaries,
        },
        "r211_status": {
            "schema": "OMEGA_OPERATIONAL_PROVENANCE_STATUS_R211", "canonicalGitSha": sha, "ok": True,
            "physicalHost": {"pcOnline": False, "heartbeatCurrent": False, "authenticated": False},
        },
        "r211_earth": {
            "schema": "OMEGA_OPERATIONAL_PROVENANCE_QUERY_R211", "canonicalGitSha": sha,
            "results": [{"id": "earthSar", "evidenceClass": "UNAVAILABLE"}],
        },
        "r205": {"schema": "OMEGA_WHOLE_SYSTEM_CONTROL_MANIFEST_R205", "canonicalGitSha": sha},
        "r204": {"schema": "OMEGA_VERIFIED_HYBRID_RETURN_MANIFEST_R204", "canonicalGitSha": sha},
        "r181": {"canonicalGitSha": sha},
        "r201": {"ok": True, "verified": True, "failures": []},
        "health": {"ok": True},
    }


def mismatch(mutator, expected):
    p = packets()
    mutator(p)
    try:
        r226.validate(p, "abc", "lease", "1", "1")
    except r226.DeterministicMismatch as exc:
        assert expected in str(exc)
    else:
        raise AssertionError(f"mismatch admitted: {expected}")


def test_validate_accepts_full_cumulative_truth():
    r226.validate(packets(), "abc", "lease", "1", "1")


def test_validate_rejects_release_identity_and_authority_inflation():
    mismatch(lambda p: p["r217"].__setitem__("canonicalGitSha", "wrong"), "RELEASE_LEASE_OR_SHA_MISMATCH")
    mismatch(lambda p: p["r217"].__setitem__("promotionAuthorized", True), "R217_AUTHORITY_INFLATION")
    mismatch(lambda p: p["r217"]["truthBoundaries"].__setitem__(r226.R217_BOUNDARIES[0], False), "R217_TRUTH_BOUNDARY_MISMATCH")


def test_validate_rejects_r211_truth_receipt_and_host_inflation():
    mismatch(lambda p: p["r211_manifest"].__setitem__("receiptSha256", "bad"), "R211_RECEIPT_INVALID")
    mismatch(lambda p: p["r211_manifest"]["truthBoundaries"].__setitem__(r226.R211_BOUNDARIES[0], False), "R211_TRUTH_BOUNDARY_MISMATCH")
    def bad_host(p):
        p["r211_status"]["physicalHost"] = {"pcOnline": True, "heartbeatCurrent": False, "authenticated": True}
    mismatch(bad_host, "PHYSICAL_HOST_HEARTBEAT_AUTH_MISMATCH")


def test_validate_rejects_earth_and_cumulative_identity_failures():
    mismatch(lambda p: p["r211_earth"]["results"][0].__setitem__("evidenceClass", "DERIVED"), "EARTH_SAR_EVIDENCE_CLASS_MISMATCH")
    mismatch(lambda p: p["r205"].__setitem__("canonicalGitSha", "wrong"), "R205_IDENTITY_MISMATCH")
    mismatch(lambda p: p["r204"].__setitem__("schema", "wrong"), "R204_IDENTITY_MISMATCH")
    mismatch(lambda p: p["r181"].__setitem__("canonicalGitSha", "wrong"), "R181_IDENTITY_MISMATCH")
    mismatch(lambda p: p["r201"].__setitem__("verified", False), "R201_VERIFY_MISMATCH")
    mismatch(lambda p: p["health"].__setitem__("ok", False), "HEALTH_MISMATCH")


def test_probe_does_not_retry_deterministic_mismatch(monkeypatch, tmp_path):
    calls = {"n": 0}
    p = packets()
    p["r217"]["releaseLease"] = "wrong"
    def fake_fetch(url, timeout):
        calls["n"] += 1
        name = next(name for name, (path, _) in r226.ENDPOINTS.items() if path in url)
        return p[name]
    monkeypatch.setattr(r226, "fetch_json", fake_fetch)
    result = r226.probe("https://example.invalid", "abc", "lease", "1", "1", 30, 0, tmp_path)
    assert result.admitted is False
    assert result.attempts == 1
    assert result.classification.startswith("DETERMINISTIC:")
    assert calls["n"] == len(r226.ENDPOINTS)


def test_probe_retries_transient_then_succeeds(monkeypatch, tmp_path):
    p = packets()
    state = {"failed": False}
    def fake_fetch(url, timeout):
        if not state["failed"]:
            state["failed"] = True
            raise urllib.error.URLError("propagation")
        name = next(name for name, (path, _) in r226.ENDPOINTS.items() if path in url)
        return p[name]
    monkeypatch.setattr(r226, "fetch_json", fake_fetch)
    monkeypatch.setattr(r226.time, "sleep", lambda _: None)
    result = r226.probe("https://example.invalid", "abc", "lease", "1", "1", 30, 0, tmp_path)
    assert result.admitted is True
    assert result.attempts == 2
    assert (tmp_path / "r226-live-probe.json").exists()


def test_non_object_response_is_deterministic_mismatch(monkeypatch):
    class Response:
        status = 200
        def __enter__(self): return self
        def __exit__(self, *args): return False
        def read(self): return b"[]"
    monkeypatch.setattr(r226.urllib.request, "urlopen", lambda req, timeout: Response())
    try:
        r226.fetch_json("https://example.invalid", 1)
    except r226.DeterministicMismatch as exc:
        assert "NON_OBJECT_RESPONSE" in str(exc)
    else:
        raise AssertionError("non-object response admitted")
