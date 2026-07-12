import importlib.util
import os

from fastapi.testclient import TestClient

spec = importlib.util.spec_from_file_location(
    "f1api", os.path.join(os.path.dirname(__file__), "main.py")
)
main = importlib.util.module_from_spec(spec)
spec.loader.exec_module(main)

client = TestClient(main.app)


# --- pure helpers ---------------------------------------------------------

def test_downsample_thins_large_list():
    rows = [{"i": i} for i in range(1000)]
    out = main._downsample(rows, 100)
    assert len(out) <= 110
    assert out[0] == rows[0]  # keeps the first sample


def test_downsample_noop_when_already_small():
    rows = [1, 2, 3]
    assert main._downsample(rows, 100) is rows


def test_cache_set_and_get():
    main._cache.clear()
    main._cache_set("k", 42, ttl=10)
    assert main._cache_get("k") == 42


def test_cache_expires(monkeypatch):
    main._cache.clear()
    main._cache_set("k", 42, ttl=10)
    base = main.time.monotonic()
    monkeypatch.setattr(main.time, "monotonic", lambda: base + 100)
    assert main._cache_get("k") is None


# --- routes (upstream mocked, no network) --------------------------------

def test_team_radio_requires_session_key():
    assert client.get("/team-radio").status_code == 400


def test_car_data_caps_points(monkeypatch):
    async def fake(endpoint, params=None, ttl=0):
        return [{"n": i} for i in range(50000)]

    monkeypatch.setattr(main, "fetch_openf1", fake)
    r = client.get("/car-data", params={"points": 5000})
    assert r.status_code == 200
    assert len(r.json()) <= 1000


def test_standings_flattens_ergast_shape(monkeypatch):
    async def fake(url, params=None, ttl=0):
        return {
            "MRData": {
                "StandingsTable": {
                    "StandingsLists": [{"season": "2026", "DriverStandings": []}]
                }
            }
        }

    monkeypatch.setattr(main, "_get", fake)
    r = client.get("/standings/drivers")
    assert r.status_code == 200
    assert r.json()["season"] == "2026"
