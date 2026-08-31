from __future__ import annotations

from hashlib import sha256
import json
from pathlib import Path


def evaluate_renderer(root: Path) -> dict:
    root = Path(root)
    path = root / "web" / "field3d.js"
    text = path.read_text(encoding="utf-8")
    checks = {
        "webgl2_required": 'getContext("webgl2"' in text,
        "canonical_state_bound": "getSnapshot" in text and "snap?.state?.index0" in text and "snap?.state?.address" in text,
        "full_20736_projection": "const POINT_COUNT=20736" in text and "gl.drawArrays(gl.POINTS,0,POINT_COUNT)" in text,
        "dpr_capped": "Math.min(raw,mobile?1.5:2)" in text,
        "offscreen_pause": "IntersectionObserver" in text and "if(stopped||!visible||!pageVisible)return" in text,
        "background_pause": 'document.addEventListener("visibilitychange"' in text,
        "resize_observer": "ResizeObserver" in text,
        "active_buffer_reuse": "if(activeIndex!==lastActive)" in text,
        "reduced_motion": "prefers-reduced-motion: reduce" in text,
        "adaptive_frame_interval": "targetInterval" in text and "33.333" in text and "16.667" in text,
        "context_loss_boundary": "webglcontextlost" in text and 'canvas.dataset.renderState="context-lost"' in text,
        "telemetry_emitted": 'omega.render.telemetry.v1' in text and 'omega-render-telemetry' in text,
        "hardware_truth_boundary": "hardware_execution_verified:false" in text,
        "derived_authority_boundary": 'authority:"derived view only"' in text,
        "resource_cleanup": "gl.deleteBuffer(buf)" in text and "gl.deleteProgram(p)" in text,
    }
    failures = sorted(k for k, ok in checks.items() if not ok)
    return {
        "schema": "omega.render.acceptance.v1",
        "status": "PASS" if not failures else "FAIL",
        "checks": checks,
        "failures": failures,
        "renderer_sha256": sha256(path.read_bytes()).hexdigest(),
        "point_count": 20736,
        "boundary": "Code-level deterministic WebGL performance/state-binding proof only; hardware GPU execution and target-device frame-rate evidence remain external until observed on an authorized device.",
    }


def main() -> int:
    result = evaluate_renderer(Path(__file__).resolve().parents[1])
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
