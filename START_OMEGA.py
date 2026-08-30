from __future__ import annotations
import os, sys, webbrowser, threading
from pathlib import Path

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
os.chdir(ROOT)

def open_browser():
    import time; time.sleep(0.8)
    webbrowser.open(f"http://127.0.0.1:{os.environ.get('OMEGA_PORT','8127')}")

if __name__ == "__main__":
    from omega_genesis.server import main
    threading.Thread(target=open_browser,daemon=True).start()
    main()
