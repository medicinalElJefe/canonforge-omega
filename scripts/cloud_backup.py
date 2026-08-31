from __future__ import annotations

import argparse
from datetime import datetime, timezone
from pathlib import Path
import tarfile
import time


def snapshot(data: Path, out: Path, keep: int) -> Path:
    out.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    target = out / f"omega-data-{stamp}.tar.gz"
    with tarfile.open(target, "w:gz") as archive:
        if data.exists():
            archive.add(data, arcname="data", recursive=True)
    backups = sorted(out.glob("omega-data-*.tar.gz"), key=lambda p: p.stat().st_mtime, reverse=True)
    for old in backups[max(1, keep):]:
        old.unlink(missing_ok=True)
    return target


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="/data")
    ap.add_argument("--out", default="/backups")
    ap.add_argument("--keep", type=int, default=56)
    ap.add_argument("--watch", action="store_true")
    ap.add_argument("--interval", type=int, default=21600)
    args = ap.parse_args()

    while True:
        target = snapshot(Path(args.data), Path(args.out), args.keep)
        print(target, flush=True)
        if not args.watch:
            break
        time.sleep(max(300, args.interval))


if __name__ == "__main__":
    main()
