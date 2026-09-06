from pathlib import Path
import json

from scripts.check_cloudflare_contract import evaluate

ROOT = Path(__file__).resolve().parents[1]
WRANGLER = ROOT / "cloudflare" / "omega-v6-worker" / "wrangler.toml"
CONTRACT = ROOT / "config" / "cloudflare_live_contract.json"
SRC = ROOT / "cloudflare" / "omega-v6-worker" / "src"


def test_r168_uses_declarative_sqlite_lifecycle_without_replaying_legacy_migrations():
    wrangler = WRANGLER.read_text(encoding="utf-8")
    assert '[[durable_objects.bindings]]' in wrangler
    assert 'name = "OMEGA_RUNTIME"' in wrangler
    assert 'class_name = "OmegaRuntime"' in wrangler
    assert '[exports.OmegaRuntime]' in wrangler
    assert 'type = "durable-object"' in wrangler
    assert 'storage = "sqlite"' in wrangler
    assert '[[migrations]]' not in wrangler
    assert 'new_sqlite_classes' not in wrangler


def test_r168_live_contract_accepts_declarative_namespace_preservation():
    result = evaluate(CONTRACT, SRC, WRANGLER)
    assert result["status"] == "PASS"
    assert result["compatible"] is True
    assert result["binding_preserved"] is True
    assert result["lifecycle_mode"] == "exports"
    assert result["lifecycle_preserved"] is True
    assert result["lifecycle_reason"] == "declarative exports / sqlite"


def test_r168_contract_holds_when_exports_storage_is_wrong(tmp_path: Path):
    contract = tmp_path / "contract.json"
    source = tmp_path / "src"
    source.mkdir()
    (source / "index.ts").write_text("export class OmegaRuntime {}", encoding="utf-8")
    contract.write_text(json.dumps({
        "required_exports": ["OmegaRuntime"],
        "recovery": {
            "binding_name": "OMEGA_RUNTIME",
            "lifecycle_mode": "exports",
            "storage_backend": "sqlite",
        },
    }), encoding="utf-8")
    wrangler = tmp_path / "wrangler.toml"
    wrangler.write_text('''[[durable_objects.bindings]]\nname = "OMEGA_RUNTIME"\nclass_name = "OmegaRuntime"\n[exports.OmegaRuntime]\ntype = "durable-object"\nstorage = "legacy-kv"\n''', encoding="utf-8")
    result = evaluate(contract, source, wrangler)
    assert result["status"] == "HOLD"
    assert result["lifecycle_preserved"] is False
