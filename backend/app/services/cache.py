"""
Simple async in-memory TTL cache for LuxeShake.
No Redis required — suitable for single-instance production usage.
Invalidation helpers allow cache busting on mutations.
"""

import asyncio
import time
from typing import Any

_cache: dict[str, tuple[Any, float]] = {}
_lock = asyncio.Lock()


async def cache_get(key: str) -> Any | None:
    """Return cached value if still fresh, else None."""
    async with _lock:
        entry = _cache.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if time.monotonic() > expires_at:
            del _cache[key]
            return None
        return value


async def cache_set(key: str, value: Any, ttl_seconds: int = 60) -> None:
    """Store value in cache with a TTL."""
    async with _lock:
        _cache[key] = (value, time.monotonic() + ttl_seconds)


async def cache_invalidate(prefix: str) -> None:
    """Remove all keys that start with the given prefix."""
    async with _lock:
        to_delete = [k for k in _cache if k.startswith(prefix)]
        for k in to_delete:
            del _cache[k]


async def cache_clear() -> None:
    """Wipe the entire cache (for testing / restart)."""
    async with _lock:
        _cache.clear()
