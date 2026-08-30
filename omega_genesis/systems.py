from __future__ import annotations

import json
from pathlib import Path
from typing import Any

CONFIG = Path(__file__).resolve().parents[1] / "config" / "software_systems.json"


def catalog() -> list[dict[str, Any]]:
    data = json.loads(CONFIG.read_text(encoding="utf-8"))
    return list(data["systems"])


def family_catalog() -> list[dict[str, Any]]:
    data = json.loads(CONFIG.read_text(encoding="utf-8"))
    return list(data["families"])


def coverage() -> dict[str, Any]:
    systems = catalog()
    families = family_catalog()
    ids = [row["id"] for row in systems]
    return {
        "status": "PASS" if len(systems) == 24 and len(set(ids)) == 24 and len(families) == 6 else "FAIL",
        "systems": len(systems),
        "families": len(families),
        "unique_ids": len(set(ids)),
        "ids": ids,
        "source": "OMEGA_ALL_SOFTWARE_61917364224D_FULL_BUILD_v22.xlsx",
        "boundary": "software registry; presence in the registry does not imply every target-specific adapter is active",
    }
