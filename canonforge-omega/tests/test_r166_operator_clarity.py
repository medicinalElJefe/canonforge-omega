from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def text(name: str) -> str:
    return (SRC / name).read_text(encoding="utf-8")


def test_r166_root_field_is_not_overridden_by_legacy_mobile_recovery_rules():
    recovered = text("recoveredExperienceOrchestrator.ts")
    assert 'html:not(.omega-root-field-active)[data-omega-experience="recovered-r159"] .gmaRail' in recovered
    assert 'html:not(.omega-root-field-active)[data-omega-experience="recovered-r159"] .gmaInfo{display:none!important}' in recovered
    assert 'root.dataset.omegaComposition=\'r166-operator-clarity\'' in recovered


def test_r166_primary_field_deduplicates_old_chrome_without_deleting_capability():
    env = text("omegaEnvironmentShell.ts")
    atlas = text("governedModeAtlas.ts")
    field = text("fieldExperience.ts")

    for legacy in [
        "#omegaSpatialCore",
        "#omegaMobileContext",
        ".omegaMobileWorkspaceRail",
        "#omegaLivePhaseRail",
        "#orsfIntegrity",
    ]:
        assert legacy in env
    assert "left:-10000px!important" in env
    assert 'id="omegaEnvironmentDeck"' in env
    assert 'id="gmaModeToggle"' in atlas
    assert 'id="gmaLayerToggle"' in atlas
    assert 'id="gmaDetailsToggle"' in atlas
    assert 'id="gmaToolsToggle"' in atlas
    assert "omega-field-tools" in atlas
    assert "omega-field-tools-open" in field
    assert "Advanced Field Tools" in field


def test_r166_operator_surface_removes_debug_copy_from_primary_field():
    atlas = text("governedModeAtlas.ts")
    env = text("omegaEnvironmentShell.ts")

    assert 'id="gmaTitle">LIVING FIELD' in atlas
    assert "ONE PACKET / ONE RENDERER" not in atlas
    assert 'LAYER <b>USER_DEFINED_MODEL</b>' not in atlas
    assert 'SOURCE <b id="gmaAge"' not in atlas
    assert ">DETAILS</button>" in atlas
    assert "<span>DETAILS</span>" in atlas
    assert "<h4>CURRENT STATE</h4>" in atlas
    assert "<h4>SOURCE & PROOF</h4>" in atlas
    assert ">SYSTEM " in env
    assert "ONE ENVIRONMENT" not in env
    assert "AUTHORITY MAP · ONE PACKET" not in env


def test_r166_hidden_advanced_renderer_suspends_work_until_opened():
    archive = text("archiveRecoveredWorkstation.ts")
    assert "presentationVisible=rootView!=='field'" in archive
    assert "omega-archive-visible" in archive
    assert "if(!presentationVisible){requestAnimationFrame(tick);return}" in archive


def test_r166_integrity_still_tracks_live_field():
    integrity = text("visualRuntimeIntegrity.ts")
    assert "['r163','r164','r166'].includes(h.dataset.omegaFieldExperience||'')" in integrity
