FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    OMEGA_CLOUD_MODE=1 \
    OMEGA_HOST=0.0.0.0 \
    OMEGA_PORT=8127 \
    OMEGA_STREAM_ENABLED=1 \
    OMEGA_STREAM_HOST=0.0.0.0 \
    OMEGA_STREAM_PORT=8128 \
    OMEGA_DATA=/data \
    OMEGA_HYBRID_ROOTS=/workspace \
    OMEGA_COOKIE_SECURE=1

WORKDIR /opt/omega
COPY . /opt/omega
RUN python -m pip install --no-cache-dir --upgrade pip && \
    python -m pip install --no-cache-dir . && \
    python scripts/verify_release.py

RUN mkdir -p /data /workspace /backups
EXPOSE 8127 8128
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8127/api/health', timeout=3).read()" || exit 1

CMD ["python", "-m", "omega_genesis.server"]
