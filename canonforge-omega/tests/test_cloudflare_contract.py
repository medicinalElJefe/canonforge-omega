from pathlib import Path
import json

from scripts.check_cloudflare_contract import evaluate


def test_live_contract_holds_when_required_durable_object_export_is_missing(tmp_path: Path):
    contract = tmp_path / "contract.json"
    source = tmp_path / "src"
    source.mkdir()
    contract.write_text(json.dumps({"required_exports": ["OmegaRuntime"]}), encoding="utf-8")
    (source / "index.ts").write_text("export default { fetch() {} }", encoding="utf-8")
    result = evaluate(contract, source)
    assert result["status"] == "HOLD"
    assert result["compatible"] is False
    assert result["missing_exports"] == ["OmegaRuntime"]


def test_live_contract_passes_only_when_required_export_is_preserved(tmp_path: Path):
    contract = tmp_path / "contract.json"
    source = tmp_path / "src"
    source.mkdir()
    contract.write_text(json.dumps({"required_exports": ["OmegaRuntime"]}), encoding="utf-8")
    (source / "index.ts").write_text("export class OmegaRuntime {}\nexport default { fetch() {} }", encoding="utf-8")
    result = evaluate(contract, source)
    assert result["status"] == "PASS"
    assert result["compatible"] is True
    assert result["missing_exports"] == []
