#!/usr/bin/env python3
"""Brain-dead EigenTunnel lab echo: UDP server or RTT client. Stdlib only."""
from __future__ import annotations

import argparse
import json
import math
import socket
import statistics
import struct
import sys
import time


def die(msg: str, code: int = 1) -> None:
    print(f"FAIL: {msg}", file=sys.stderr, flush=True)
    sys.exit(code)


def pct(sorted_vals, p: float):
    if not sorted_vals:
        return None
    idx = min(len(sorted_vals) - 1, max(0, math.ceil(len(sorted_vals) * p / 100) - 1))
    return sorted_vals[idx]


def run_server(bind: str, port: int) -> None:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind((bind, port))
    print(f"UDP echo on {bind}:{port} (Ctrl-C to stop)", flush=True)
    while True:
        data, addr = sock.recvfrom(65535)
        sock.sendto(data, addr)


def run_client(host: str, port: int, count: int, payload: int, timeout: float) -> None:
    body = b"E" * max(0, payload)
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(timeout)
    samples = []
    lost = 0
    for i in range(count):
        msg = struct.pack("!Q", i) + body
        t0 = time.perf_counter()
        try:
            sock.sendto(msg, (host, port))
            data, _ = sock.recvfrom(65535)
            t1 = time.perf_counter()
            if data != msg:
                lost += 1
                continue
            samples.append((t1 - t0) * 1000.0)
        except socket.timeout:
            lost += 1
    sock.close()
    if lost or not samples:
        die(f"echo lost={lost}/{count} to {host}:{port} (tunnel down or wrong overlay IP)")
    samples.sort()
    out = {
        "ok": count,
        "lost": lost,
        "host": host,
        "port": port,
        "payload": payload,
        "median_ms": round(statistics.median(samples), 3),
        "p95_ms": round(pct(samples, 95), 3),
        "min_ms": round(samples[0], 3),
        "max_ms": round(samples[-1], 3),
    }
    print(json.dumps(out, indent=2))
    print(
        f"OK: {out['ok']}/{count} median {out['median_ms']} ms  "
        f"p95 {out['p95_ms']} ms  (Eigen hairpin)",
        flush=True,
    )


def main() -> None:
    ap = argparse.ArgumentParser(description="EigenTunnel lab UDP echo (server|client)")
    sub = ap.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("server", help="run UDP echo server")
    s.add_argument("--bind", default="0.0.0.0")
    s.add_argument("--port", type=int, default=9700)

    c = sub.add_parser("client", help="RTT probe; fail-loud on any loss")
    c.add_argument("--host", required=True, help="other leaf overlay IP, e.g. 10.66.0.2")
    c.add_argument("--port", type=int, default=9700)
    c.add_argument("--count", type=int, default=50)
    c.add_argument("--payload", type=int, default=64)
    c.add_argument("--timeout", type=float, default=2.0)

    args = ap.parse_args()
    if args.cmd == "server":
        run_server(args.bind, args.port)
    else:
        run_client(args.host, args.port, args.count, args.payload, args.timeout)


if __name__ == "__main__":
    main()
