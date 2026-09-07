from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def text(path: str) -> str:
    return (SRC / path).read_text(encoding="utf-8")


def test_r189_is_additive_and_routed_before_canonical_fallback():
    router = text("runtimeEntryR169.ts")
    surface = text("wholeInstrumentR189.ts")
    assert 'handleWholeInstrumentR189' in router
    assert '"/instrument"' in surface
    assert '"/api/instrument/r189/manifest"' in surface
    assert router.index("handleWholeInstrumentR189(request)") < router.index("return canonical.fetch(request, env, ctx)")
    assert "additiveSuccessor: true" in surface
    assert "inheritedRoutesPreserved: true" in surface
    assert "inheritedVisualShellPreserved: true" in surface
    assert "durableObjectNamespacesPreserved: true" in surface


def test_r189_preserves_established_execution_depth():
    surface = text("wholeInstrumentR189.ts")
    for profile in ("PULSE", "FLOCK", "ORGAN", "WARP", "FULL"):
        assert f'id: "{profile}"' in surface
    for scale in ("12", "144", "1728", "20736"):
        assert scale in surface
    for phase in (
        "FRAME", "PARTITION", "TRANSFORM", "EXCHANGE", "INVARIANT_CARRY", "SCAR_CARRY",
        "RECONTEXTUALIZE", "FORECAST", "SYNTHESIZE", "EXECUTE", "OBSERVE", "PROVE",
    ):
        assert f'"{phase}"' in surface


def test_r189_surfaces_every_major_admitted_organ_without_relabeling_truth():
    surface = text("wholeInstrumentR189.ts")
    required = (
        "FIELD", "EARTH", "MODES", "SKINS", "COMPUTE", "VALIDATE", "CROSS_RUNTIME", "RCWA",
        "FEDERATION", "SWARM", "CLOUD172", "SAI", "HYBRID", "MOTION", "BUILD", "SUCCESSOR",
        "DISCOVERY", "EVIDENCE", "PATCH", "MEMORY", "RECOVERY",
    )
    for domain in required:
        assert f'id: "{domain}"' in surface
    for boundary in (
        "visual motion is not execution proof",
        "model synthesis is not CanonState",
        "cross-runtime parity is not independent solver-family evidence",
        "independent RCWA evidence is not fabrication measurement",
        "self-patch materialization cannot commit, deploy, or promote Canon",
    ):
        assert boundary in surface
    assert "canonicalMutation: false" in surface
    assert "autonomousPromotion: false" in surface


def test_r189_does_not_remove_the_existing_specialized_route_handlers():
    router = text("runtimeEntryR169.ts")
    inherited = (
        "computeLabResponse", "warpComputationLabResponse", "warpBuildCandidateLabResponse", "saiLabResponse",
        "validationLabResponse", "crossRuntimeLabResponse", "independentSolverLabResponse", "federatedOrganLabResponse",
        "handleCloudSwarmR185", "handleLiveAcceptanceR181", "handleSaiAiFusionR179", "handleFederatedOrganRequest",
        "handleMotionTimeR188", "handleSourcePatchR187", "handleSuccessorEvidenceR186", "handleImprovementDiscoveryR184",
        "handleSuccessorGateR183", "handleWarpBuildCandidateRequest", "handleWarpComputationRequest", "handleSwarmRequest",
        "handleIndependentSolverValidationRequest", "handleCrossRuntimeValidationRequest", "handleValidationRequest",
        "handleAtlasComputeRequest", "handleComputeRequest",
    )
    for marker in inherited:
        assert marker in router
