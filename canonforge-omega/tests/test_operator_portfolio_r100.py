from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'cloudflare'/'omega-v6-worker'/'src'

def test_r100_portfolio_contract_and_boundaries():
    s=(SRC/'operatorPortfolio.ts').read_text()
    for token in ['OMEGA_EVIDENCE_WEIGHTED_OPERATOR_PORTFOLIO_V1','EARNED_HELD_OUT_SUPPORT','DEPRIORITIZE','ABLATION_CANDIDATE','RETAIN_FOR_TESTING','uncertainty','explicit_promotion_required:true','automatic_canonical_weight_mutation:false','causation_claimed:false']:
        assert token in s
    assert 'require explicit governed promotion' in s

def test_r100_portfolio_depends_downward_only():
    s=(SRC/'operatorPortfolio.ts').read_text()
    assert 'from "./forecastProofLedger"' in s
    assert 'from "./calibrationWorkbench"' not in s

def test_r100_is_exposed_through_existing_calibration_surface():
    s=(SRC/'calibrationWorkbench.ts').read_text()
    assert 'import { evaluateOperatorPortfolio, OPERATOR_PORTFOLIO_BOUNDARY } from "./operatorPortfolio"' in s
    assert 'u.pathname==="/api/calibration/portfolio"' in s
    assert 'OMEGA_EVIDENCE_WEIGHTED_OPERATOR_PORTFOLIO_V1' in s
    assert 'Build operator portfolio' in s
    assert 'CALIBRATION_SCHEMA="OMEGA_CALIBRATION_LEARNING_WORKBENCH_V1"' in s

def test_r100_preserves_r99_ablation_identity():
    s=(SRC/'calibrationWorkbench.ts').read_text()
    assert 'OMEGA_HELD_OUT_ABLATION_LAB_V1' in s
    assert '/api/calibration/ablation' in s
    assert 'historical_predictions_rewritten:false' in s
    assert 'automatic_canonical_weight_mutation:false' in s
