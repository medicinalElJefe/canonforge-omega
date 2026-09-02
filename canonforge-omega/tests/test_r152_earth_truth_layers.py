from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
WORKFLOW = ROOT.parent / ".github" / "workflows" / "omega-v6-visual-delivery.yml"


def test_r152_earth_truth_lens_is_source_bound_and_non_mutating():
    src = (SRC / "earthTruthLayers.ts").read_text(encoding="utf-8")
    for marker in [
        "/api/earth/catalog",
        "/api/omega/state",
        "OBSERVED_SOURCE",
        "DERIVED_FRAMEWORK_MATH",
        "FORECAST_PROJECTION",
        "Missing coordinates and missing state are explicitly withheld",
        "cannot mutate canonical state",
        "coordinates:'not invented when absent'",
    ]:
        assert marker in src
    assert "fetch('/api/earth/catalog'" in src
    assert "fetch('/api/omega/state'" in src
    assert "method:'POST'" not in src
    assert "coordinates:'not invented when absent'" in src


def test_r152_visibly_changes_truth_class_and_horizon():
    src = (SRC / "earthTruthLayers.ts").read_text(encoding="utf-8")
    for marker in [
        'data-etl-view="observed"',
        'data-etl-view="derived"',
        'data-etl-view="forecast"',
        'data-etl-view="compare"',
        "etlHorizon",
        "showObs",
        "showDer",
        "showFc",
        "horizon/155",
    ]:
        assert marker in src
    assert "@media(max-width:620px)" in src
    assert "scroll-snap-type:x mandatory" in src


def test_r152_wires_over_r151_without_replacing_protected_runtime():
    wrapper = (SRC / "virtualLatticeDisplay.ts").read_text(encoding="utf-8")
    assert 'r152-earth-truth-layers' in wrapper
    assert 'r151-sovereign-devices-compute' in wrapper
    assert 'enhanceSovereignDevicesCompute(rendered)' in wrapper
    assert 'enhanceEarthTruthLayers(rendered)' in wrapper
    assert wrapper.index('enhanceSovereignDevicesCompute(rendered)') < wrapper.index('enhanceEarthTruthLayers(rendered)')
    for marker in [
        "heartbeatTruth",
        "OmegaRuntime",
        "Hybrid/Genesis authority boundaries",
        "route-before-generation",
        "finite-difference gradient",
        "Hessian/Laplacian curvature",
        "RK2 integral trajectories",
        "UTC render time is not evidence time",
        "device-DPR 3",
        "61.9-billion-pixel panel",
        "physical 20,736 dimensions",
    ]:
        assert marker in wrapper


def test_r152_public_delivery_requires_earth_truth_classes():
    workflow = WORKFLOW.read_text(encoding="utf-8")
    for marker in [
        "r152-earth-truth-layers",
        "omegaEarthTruthLayersRuntime",
        "EARTH TRUTH LENS",
        "OBSERVED_SOURCE",
        "DERIVED_FRAMEWORK_MATH",
        "FORECAST_PROJECTION",
        "/api/earth/catalog",
        "PUBLIC_EARTH_TRUTH_LAYERS_VERIFIED",
    ]:
        assert marker in workflow
