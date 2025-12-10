"""
Example usage of CanonForge Omega 144D core.
"""

from omega_144d_core import Omega144Core


def main():
    eng = Omega144Core()
    eng.initialize([1, 0, 1, 1])
    for k in range(5):
        out = eng.step(tag=f"step_{k}")
        print(out["t"], out["coherence"], out["regime"])


if __name__ == "__main__":
    main()
