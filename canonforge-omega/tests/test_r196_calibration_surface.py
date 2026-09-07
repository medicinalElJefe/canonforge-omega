from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"
SURFACE = SRC / "deweyCalibrationSurfaceR196.ts"
ENTRY = SRC / "runtimeEntryR169.ts"


def text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_r196_surface_is_additive_to_existing_calculus_destination():
    surface = text(SURFACE)
    entry = text(ENTRY)
    assert 'id="odc196"' in surface
    assert 'id="odc195"' in surface
    assert 'data-view="Calculus"' in surface
    assert 'enhanceDeweyCalibrationSurfaceR196' in entry
    assert entry.index('enhanceDeweyComputeSurfaceR195') < entry.index('enhanceDeweyCalibrationSurfaceR196')
    assert entry.index('enhanceDeweyCalibrationSurfaceR196') < entry.index('enhanceOneSystemNavigationR195')


def test_r196_surface_exposes_real_calibration_controls_without_auto_promotion():
    surface = text(SURFACE)
    for marker in (
        '/api/compute/dewey/r196/calibrate',
        '/api/compute/dewey/r196/evaluate',
        '/api/compute/dewey/r196/benchmark',
        '/api/compute/dewey/r196/representation',
        'Group-aware SHA-256',
        'Group-aware temporal',
        'Required holdout lift',
        'GENERALIZATION GAP',
        'HOLDOUT LIFT',
        'EVIDENCE',
        'CALIBRATE ROWS',
    ):
        assert marker in surface
    assert 'automatically' not in surface.lower() or 'automatic' not in surface.lower()
    assert 'cannot turn user-entered observations into independently verified physical measurements' in surface


def test_r196_surface_does_not_label_template_rows_as_measured():
    surface = text(SURFACE)
    assert 'evidenceClass:"USER_DECLARED_UNVERIFIED"' in surface
    assert 'evidenceClass:"MEASURED"' not in surface


def test_r196_surface_is_mobile_responsive_and_receipt_visible():
    surface = text(SURFACE)
    assert '@media(max-width:960px)' in surface
    assert '@media(max-width:620px)' in surface
    assert 'receiptChain:d.receiptChain' in surface
    assert 'receiptSha256:d.receiptSha256' in surface
    assert 'oc196Params' in surface
    assert 'oc196Errors' in surface
