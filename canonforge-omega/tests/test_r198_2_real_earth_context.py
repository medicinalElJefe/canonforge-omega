from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKER = ROOT / "cloudflare" / "omega-v6-worker"
CTX = (WORKER / "src" / "earthSarVisualContextR198_2.ts").read_text(encoding="utf-8")
ENTRY = (WORKER / "src" / "runtimeEntryR169.ts").read_text(encoding="utf-8")


def test_r198_2_uses_real_nasa_gibs_true_color_context():
    assert 'EARTH_SAR_VISUAL_CONTEXT_R198_2 = "r198.2-nasa-gibs-true-color-context"' in CTX
    assert "gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi" in CTX
    assert "VIIRS_SNPP_CorrectedReflectance_TrueColor" in CTX
    assert "SRS=EPSG%3A4326" in CTX
    assert "BBOX=-180,-90,180,90" in CTX
    assert "TIME=" in CTX


def test_r198_2_context_is_explicitly_not_sar_measurement():
    assert "OPTICAL CONTEXT" in CTX
    assert "CONTEXT_ONLY" in CTX
    assert "SAR_MEASUREMENT=SEPARATE" in CTX
    assert "INFERENCE=WITHHELD" in CTX
    assert "NASA GIBS VIIRS true-color optical Earth context" in CTX


def test_r198_2_layers_after_native_r198_1_only_on_earth():
    assert 'import { enhanceEarthSarVisualContextR198_2 } from "./earthSarVisualContextR198_2"' in ENTRY
    assert "const nativeSarEarth = await enhanceEarthSarIntegratedRepairR198_1(oneSystemEarth, request.url);" in ENTRY
    assert "return enhanceEarthSarVisualContextR198_2(nativeSarEarth, request.url);" in ENTRY
    assert "if (!earthRoute || !html.includes(\"omegaSarIntegratedR198_1Runtime\"))" in CTX


def test_r198_2_preserves_exact_legacy_wrapper_chain():
    for line in [
        "const r192 = await enhanceUniversalNavigationR192(response, new URL(request.url).pathname);",
        "const r193 = await enhanceUniversalWorkspaceR193(r192, new URL(request.url).pathname);",
        "const r194 = await enhanceEvidencePlaneR194(r193, new URL(request.url).pathname);",
        "const dewey = await enhanceDeweyComputeSurfaceR195(r194, new URL(request.url).pathname);",
        "if (calibrated !== dewey) return enhanceOneSystemNavigationR195(calibrated, new URL(request.url).pathname);",
        "return enhanceOneSystemNavigationR195(dewey, new URL(request.url).pathname);",
    ]:
        assert line in ENTRY


def test_r198_2_context_has_user_control_and_recent_date_fallback():
    assert "EARTH CONTEXT · ON" in CTX
    assert "EARTH CONTEXT · "+"'" not in CTX  # ensure static initial marker is retained separately
    assert "maxAttempts=8" in CTX
    assert "isoDay(attempt+1)" in CTX
    assert "tryDate()" in CTX
    assert "NASA CONTEXT · UNAVAILABLE" in CTX
