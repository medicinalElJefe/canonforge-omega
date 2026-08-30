from __future__ import annotations

from dataclasses import dataclass
from math import pi, sin
import wave
from pathlib import Path


@dataclass(frozen=True, slots=True)
class SonificationSpec:
    frequency_hz: float
    amplitude: float
    duration_s: float
    sample_rate: int = 44100

    def validate(self) -> "SonificationSpec":
        if not 20.0 <= self.frequency_hz <= 20000.0:
            raise ValueError("frequency_hz must be audible-range 20..20000")
        if not 0.0 <= self.amplitude <= 1.0:
            raise ValueError("amplitude must be 0..1")
        if not 0.01 <= self.duration_s <= 60.0:
            raise ValueError("duration_s must be 0.01..60")
        if not 8000 <= self.sample_rate <= 192000:
            raise ValueError("sample_rate outside supported range")
        return self


def state_to_sonification(continuity: float, contradiction: float, phase: int, duration_s: float = 1.0) -> SonificationSpec:
    """Deterministic derived sonification; not a therapeutic or physical-frequency claim."""
    c = max(0.0, min(1.0, continuity))
    q = max(0.0, min(1.0, contradiction))
    p = ((phase - 1) % 12) + 1
    frequency = 110.0 * (2.0 ** ((p - 1) / 12.0)) * (1.0 + 2.0*c)
    amplitude = min(0.9, 0.15 + 0.55*c + 0.20*q)
    return SonificationSpec(frequency, amplitude, duration_s)


def pcm16(spec: SonificationSpec) -> bytes:
    spec.validate()
    frames = int(spec.duration_s * spec.sample_rate)
    out = bytearray()
    for i in range(frames):
        value = int(32767.0 * spec.amplitude * sin(2*pi*spec.frequency_hz*i/spec.sample_rate))
        out += int(value).to_bytes(2, "little", signed=True)
    return bytes(out)


def write_wav(path: str | Path, spec: SonificationSpec) -> Path:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(target), "wb") as fh:
        fh.setnchannels(1); fh.setsampwidth(2); fh.setframerate(spec.sample_rate); fh.writeframes(pcm16(spec))
    return target
