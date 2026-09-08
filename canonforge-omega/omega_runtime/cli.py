from __future__ import annotations

import argparse
import uvicorn


def main() -> None:
    parser = argparse.ArgumentParser(description="OMEGA V6 sovereign runtime launcher")
    parser.add_argument("--host", default="127.0.0.1", help="Bind address; use 0.0.0.0 only on a trusted network/tunnel")
    parser.add_argument("--port", type=int, default=8127)
    parser.add_argument("--reload", action="store_true")
    args = parser.parse_args()
    # R222 composes the preserved FastAPI application with the localhost-only
    # outbound Hybrid enrollment contract. The canonical 8127 identity remains
    # unchanged; only the bootstrap route is added.
    uvicorn.run("api.runtime_r222:app", host=args.host, port=args.port, reload=args.reload)


if __name__ == "__main__":
    main()
