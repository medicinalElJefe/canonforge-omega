from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def test_r216_is_the_outer_entrypoint_but_delegates_canonical_r169():
    wrangler = (ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml").read_text(encoding="utf-8")
    entry = (SRC / "runtimeEntryR216.ts").read_text(encoding="utf-8")
    assert 'main = "src/runtimeEntryR216.ts"' in wrangler
    assert 'import runtimeR169 from "./runtimeEntryR169"' in entry
    assert 'export * from "./runtimeEntryR169"' in entry
    assert "canonicalR169.fetch(request, env, ctx)" in entry
    assert "enhanceSurfaceBindingIntegrityR216(response" in entry


def test_r216_surface_is_fail_closed_until_r211_and_r205_are_both_healthy():
    source = (SRC / "surfaceBindingIntegrityR216.ts").read_text(encoding="utf-8")
    for required in (
        "/api/system/r211/status",
        "/api/system/r205/health",
        "OMEGA_OPERATIONAL_PROVENANCE_STATUS_R211",
        "OMEGA_WHOLE_SYSTEM_HEALTH_R205",
        "r211.ok===true",
        "r205.ok===true",
        "LIVE BINDING INCOMPLETE — CONTROLS WITHHELD",
        "VERIFYING LIVE BINDINGS",
        "cache:'no-store'",
        "EXPECTED_SHA",
        "R211 deployment identity does not match the HTML deployment",
        "R211/R205 deployment identities disagree",
    ):
        assert required in source, required

    # A screenshot-worthy but disconnected surface must never become interactive.
    assert "visibility:hidden!important" in source
    assert "event.preventDefault()" in source
    assert "event.stopImmediatePropagation()" in source
    assert "root.dataset.omegaSurfaceBinding='WITHHELD'" in source
    assert "root.dataset.omegaSurfaceBinding='VERIFIED'" in source
    assert "overlay.hidden=true" in source


def test_r216_does_not_inflate_physical_host_or_execution_truth():
    source = (SRC / "surfaceBindingIntegrityR216.ts").read_text(encoding="utf-8")
    entry = (SRC / "runtimeEntryR216.ts").read_text(encoding="utf-8")
    combined = source + "\n" + entry
    assert "pcOnline=true" not in combined
    assert "pcOnline: true" not in combined
    assert "authenticated=true" not in combined
    assert "promotionAuthorized: true" not in combined
    assert "canonicalMutation: true" not in combined
    assert "create a second runtime" in entry
