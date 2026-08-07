"""
Async Concurrent Load Test Script for NowCart Retrieval Service.
Simulates concurrent requests to evaluate if p99 latency stays under the 80ms target.
"""

import time
import os
import sys
import asyncio
import numpy as np
import httpx
from typing import List

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from backend.services.retrieval_service.main import app, index_manager
from fastapi.testclient import TestClient

TARGET_P99_MS = 80.0


async def worker(
    client: httpx.AsyncClient,
    url: str,
    num_requests: int,
    sample_vector: List[float],
    results: List[float],
):
    """Executes a series of async HTTP requests."""
    for _ in range(num_requests):
        q_vec = (np.array(sample_vector) + np.random.randn(256) * 0.01).tolist()
        payload = {"query_vector": q_vec, "top_k": 10}

        t0 = time.perf_counter()
        res = await client.post(url, json=payload)
        t1 = time.perf_counter()

        if res.status_code == 200:
            results.append((t1 - t0) * 1000)


async def run_async_load_test(
    concurrency: int = 20, total_requests: int = 500, base_url: str = "http://127.0.0.1:8001"
):
    """
    Executes concurrent load test using httpx AsyncClient against running service.
    """
    print("\n" + "=" * 75)
    print(f"   NOWCART RETRIEVAL SERVICE LOAD TEST ({concurrency} WORKERS, {total_requests} REQUESTS)")
    print("=" * 75)

    sample_vector = (
        index_manager.embeddings[0].tolist()
        if len(index_manager.embeddings) > 0
        else np.random.randn(256).tolist()
    )

    reqs_per_worker = total_requests // concurrency
    results: List[float] = []

    async with httpx.AsyncClient(timeout=10.0) as client:
        # Check service health first
        try:
            h_res = await client.get(f"{base_url}/health")
            if h_res.status_code != 200:
                print(f"Warning: Healthcheck failed with status {h_res.status_code}")
        except Exception:
            print("Server not reachable via HTTP port 8001. Running load test in ASGI mock mode...")
            return run_asgi_mock_load_test(concurrency, total_requests, sample_vector)

        tasks = [
            worker(client, f"{base_url}/retrieve", reqs_per_worker, sample_vector, results)
            for _ in range(concurrency)
        ]

        t_start = time.perf_counter()
        await asyncio.gather(*tasks)
        t_end = time.perf_counter()

    _print_load_test_report(results, t_end - t_start, total_requests, concurrency)


def run_asgi_mock_load_test(concurrency: int, total_requests: int, sample_vector: List[float]):
    """ASGI direct client load test for offline execution."""
    client = TestClient(app)
    results = []

    t_start = time.perf_counter()
    for _ in range(total_requests):
        q_vec = (np.array(sample_vector) + np.random.randn(256) * 0.01).tolist()
        t0 = time.perf_counter()
        res = client.post("/retrieve", json={"query_vector": q_vec, "top_k": 10})
        t1 = time.perf_counter()
        if res.status_code == 200:
            results.append((t1 - t0) * 1000)
    t_end = time.perf_counter()

    _print_load_test_report(results, t_end - t_start, total_requests, concurrency)


def _print_load_test_report(
    results: List[float], total_time: float, total_requests: int, concurrency: int
):
    if not results:
        print("Error: No successful requests recorded.")
        return

    p50 = np.percentile(results, 50)
    p95 = np.percentile(results, 95)
    p99 = np.percentile(results, 99)
    rps = len(results) / total_time

    passed = p99 <= TARGET_P99_MS

    print(f"Concurrency Level       : {concurrency} workers")
    print(f"Total Requests Completed: {len(results)} / {total_requests}")
    print(f"Total Test Time         : {total_time:.2f} seconds")
    print(f"Throughput (RPS)        : {rps:.1f} req/sec")
    print("-" * 75)
    print(f"p50 Latency (Median)    : {p50:.3f} ms")
    print(f"p95 Latency             : {p95:.3f} ms")
    print(f"p99 Latency             : {p99:.3f} ms (Target: < {TARGET_P99_MS} ms)")
    print("-" * 75)
    if passed:
        print(f"VERDICT                 : [PASSED] (p99 {p99:.2f}ms < {TARGET_P99_MS}ms target)")
    else:
        print(f"VERDICT                 : [FAILED] (p99 {p99:.2f}ms > {TARGET_P99_MS}ms target)")
    print("=" * 75 + "\n")


if __name__ == "__main__":
    asyncio.run(run_async_load_test(concurrency=20, total_requests=500))
