import os
import time
from datetime import datetime, timedelta
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Load ../.env (repo root) so OPENF1_API / JOLPICA_API / CORS_ORIGINS are picked up.
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

app = FastAPI(title="F1 Dashboard API")

# Allowed origins are comma-separated in CORS_ORIGINS, defaulting to the Vite dev server.
_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_URL = os.getenv("OPENF1_API", "https://api.openf1.org/v1")
# Jolpica is the community successor to the (shut down) Ergast API — used for
# season standings, which OpenF1 does not provide.
JOLPICA_URL = os.getenv("JOLPICA_API", "https://api.jolpi.ca/ergast/f1")
REQUEST_TIMEOUT = float(os.getenv("OPENF1_TIMEOUT", "15"))

# --- Tiny in-memory TTL cache -------------------------------------------------
# Protects the upstream rate limits (OpenF1 ~30 req/min, Jolpica ~200 req/hr).
_cache: dict[str, tuple[float, object]] = {}


def _cache_get(key: str):
    hit = _cache.get(key)
    if hit and hit[0] > time.monotonic():
        return hit[1]
    return None


def _cache_set(key: str, value: object, ttl: float):
    _cache[key] = (time.monotonic() + ttl, value)


def _downsample(rows, target: int):
    """Evenly thin a list to ~target items, preserving chronological spread."""
    if not isinstance(rows, list) or len(rows) <= target:
        return rows
    step = max(1, len(rows) // target)
    return rows[::step]


async def _get(url: str, params: Optional[dict] = None, ttl: float = 0):
    params = params or {}
    key = f"{url}?{sorted(params.items())}"
    if ttl > 0:
        cached = _cache_get(key)
        if cached is not None:
            return cached
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as e:
        error_detail = e.response.text or "Unknown HTTP error"
        print(f"HTTP error while fetching {url}: {e.response.status_code} - {error_detail}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Upstream API error: {error_detail}",
        )
    except httpx.RequestError as e:
        print(f"Network error while fetching {url}: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to reach upstream: {e}")
    except Exception as e:
        print(f"Error while fetching {url}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error: " + str(e))

    if ttl > 0:
        _cache_set(key, data, ttl)
    return data


async def fetch_openf1(endpoint: str, params: Optional[dict] = None, ttl: float = 0):
    # OpenF1 expects plain values (e.g. session_key=9158 or session_key=latest),
    # NOT a PostgREST-style "eq." prefix.
    return await _get(f"{BASE_URL}/{endpoint}", params, ttl)


@app.get("/")
async def health():
    return {"status": "ok", "openf1": BASE_URL, "jolpica": JOLPICA_URL, "cached_keys": len(_cache)}


@app.get("/car-data")
async def get_car_data(
    session_key: Optional[str] = None,
    driver_number: Optional[int] = None,
    points: int = 200,
):
    # Telemetry is enormous (tens of thousands of samples per driver). Default to
    # the latest session, allow narrowing to one car, and thin server-side so the
    # browser receives ~`points` rows instead of multi-MB payloads.
    params = {"session_key": session_key or "latest"}
    if driver_number is not None:
        params["driver_number"] = driver_number
    data = await fetch_openf1("car_data", params, ttl=30)
    return _downsample(data, max(10, min(points, 1000)))


@app.get("/drivers")
async def get_drivers(session_key: Optional[str] = None):
    return await fetch_openf1("drivers", {"session_key": session_key or "latest"}, ttl=300)


@app.get("/sessions")
async def get_sessions():
    return await fetch_openf1("sessions", ttl=3600)


@app.get("/session-context")
async def get_session_context(session_key: Optional[str] = None):
    # One-call context for page banners: the session plus its human race name
    # (meeting_name, e.g. "British Grand Prix").
    sk = session_key or "latest"
    sessions = await fetch_openf1("sessions", {"session_key": sk}, ttl=300)
    if not isinstance(sessions, list) or not sessions:
        return {}
    session = dict(sessions[-1])
    meeting_name = None
    mk = session.get("meeting_key")
    if mk is not None:
        meetings = await fetch_openf1("meetings", {"meeting_key": mk}, ttl=3600)
        if isinstance(meetings, list) and meetings:
            meeting_name = meetings[-1].get("meeting_name")
    session["meeting_name"] = meeting_name
    return session


@app.get("/team-radio")
async def get_team_radio(session_key: Optional[str] = None):
    if session_key is None:
        raise HTTPException(status_code=400, detail="session_key is required for team radio data.")
    return await fetch_openf1("team_radio", {"session_key": session_key}, ttl=300)


@app.get("/weather")
async def get_weather(session_key: Optional[str] = None):
    return await fetch_openf1("weather", {"session_key": session_key or "latest"}, ttl=60)


@app.get("/race-control")
async def get_race_control(session_key: Optional[str] = None):
    return await fetch_openf1("race_control", {"session_key": session_key or "latest"}, ttl=30)


def _fast_lap_window(laps):
    """(start_iso, end_iso) of the driver's fastest clean flying lap, or None."""
    if not isinstance(laps, list):
        return None
    good = [
        l
        for l in laps
        if l.get("lap_duration") and l.get("date_start") and not l.get("is_pit_out_lap")
    ]
    if not good:
        return None
    fast = min(good, key=lambda l: l["lap_duration"])
    start = fast["date_start"]
    try:
        end = (datetime.fromisoformat(start) + timedelta(seconds=fast["lap_duration"] + 1)).isoformat()
    except ValueError:
        return None
    return start, end


@app.get("/track-laps")
async def get_track_laps(
    session_key: Optional[str] = None, driver_number: int = 1, per_lap: int = 140
):
    # For the animated timelapse: the static circuit outline (fastest lap) plus
    # each racing lap's ordered x/y points, downsampled per lap.
    sk = session_key or "latest"
    laps = await fetch_openf1("laps", {"session_key": sk, "driver_number": driver_number}, ttl=600)
    loc = await fetch_openf1("location", {"session_key": sk, "driver_number": driver_number}, ttl=600)
    if not isinstance(loc, list):
        return {"outline": [], "laps": []}
    pts = [p for p in loc if p.get("x") is not None and p.get("y") is not None and not (p["x"] == 0 and p["y"] == 0)]
    pts.sort(key=lambda p: p.get("date", ""))

    good = []
    if isinstance(laps, list):
        good = [l for l in laps if l.get("date_start") and l.get("lap_duration") and not l.get("is_pit_out_lap")]

    def lap_points(lap):
        start = lap["date_start"]
        try:
            end = (datetime.fromisoformat(start) + timedelta(seconds=lap["lap_duration"] + 1)).isoformat()
        except ValueError:
            return []
        return [{"x": p["x"], "y": p["y"]} for p in pts if start <= p.get("date", "") <= end]

    lap_list = []
    for lap in sorted(good, key=lambda l: l.get("lap_number", 0)):
        lp = _downsample(lap_points(lap), per_lap)
        if len(lp) > 20:
            lap_list.append({"lap": lap.get("lap_number"), "points": lp})

    outline = []
    if good:
        fastest = min(good, key=lambda l: l["lap_duration"])
        outline = _downsample(lap_points(fastest), 400)
    return {"outline": outline, "laps": lap_list}


@app.get("/track-map")
async def get_track_map(
    session_key: Optional[str] = None, driver_number: int = 1, points: int = 800
):
    # Plotting the whole session overlays every lap into a fuzzy blob. Instead,
    # isolate the driver's single fastest (clean) lap so the outline is crisp.
    sk = session_key or "latest"
    laps = await fetch_openf1("laps", {"session_key": sk, "driver_number": driver_number}, ttl=600)
    loc = await fetch_openf1(
        "location", {"session_key": sk, "driver_number": driver_number}, ttl=600
    )
    if not isinstance(loc, list):
        return []
    window = _fast_lap_window(laps)  # (start, end) ISO strings, comparable lexicographically
    pts = []
    for p in loc:
        x, y = p.get("x"), p.get("y")
        if x is None or y is None or (x == 0 and y == 0):
            continue
        if window and not (window[0] <= p.get("date", "") <= window[1]):
            continue
        pts.append({"x": x, "y": y})
    return _downsample(pts, max(100, min(points, 3000)))


@app.get("/driver-stats")
async def get_driver_stats(session_key: Optional[str] = None):
    # Aggregate laps + pit + position into a compact per-driver summary so the
    # frontend gets a few KB instead of three large raw datasets.
    sk = session_key or "latest"
    laps = await fetch_openf1("laps", {"session_key": sk}, ttl=60)
    pits = await fetch_openf1("pit", {"session_key": sk}, ttl=60)
    positions = await fetch_openf1("position", {"session_key": sk}, ttl=60)

    stats: dict = {}

    def bucket(dn):
        return stats.setdefault(
            dn,
            {"driver_number": dn, "best_lap": None, "pit_stops": 0, "position": None, "_pos_date": None},
        )

    for lap in laps if isinstance(laps, list) else []:
        dn, dur = lap.get("driver_number"), lap.get("lap_duration")
        if dn is None or dur is None:
            continue
        b = bucket(dn)
        if b["best_lap"] is None or dur < b["best_lap"]:
            b["best_lap"] = dur

    for pit in pits if isinstance(pits, list) else []:
        dn = pit.get("driver_number")
        if dn is not None:
            bucket(dn)["pit_stops"] += 1

    for pos in positions if isinstance(positions, list) else []:
        dn, date = pos.get("driver_number"), pos.get("date")
        if dn is None:
            continue
        b = bucket(dn)
        if b["_pos_date"] is None or (date and date > b["_pos_date"]):
            b["_pos_date"], b["position"] = date, pos.get("position")

    for b in stats.values():
        b.pop("_pos_date", None)
    return stats


@app.get("/results")
async def get_results(session_key: Optional[str] = None):
    # Final classification for a session (order, points, gap, laps, DNF/DSQ).
    return await fetch_openf1("session_result", {"session_key": session_key or "latest"}, ttl=300)


@app.get("/stints")
async def get_stints(session_key: Optional[str] = None):
    # Tyre stints (compound + lap range) for the strategy view.
    return await fetch_openf1("stints", {"session_key": session_key or "latest"}, ttl=300)


@app.get("/schedule")
async def get_schedule():
    # Full current-season calendar from Jolpica.
    data = await _get(f"{JOLPICA_URL}/current/", {"format": "json"}, ttl=3600)
    return data.get("MRData", {}).get("RaceTable", {}).get("Races", [])


@app.get("/qualifying")
async def get_qualifying():
    # Latest weekend's qualifying (Q1/Q2/Q3) from Jolpica.
    data = await _get(f"{JOLPICA_URL}/current/last/qualifying/", {"format": "json"}, ttl=600)
    races = data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
    return races[0] if races else {}


async def _jolpica_standings(kind: str):
    # kind is "driverStandings" or "constructorStandings". Jolpica mirrors the
    # Ergast response shape; flatten to the single current StandingsList.
    # Cached 10 min — standings only change once per race, and Jolpica's limit is tight.
    data = await _get(f"{JOLPICA_URL}/current/{kind}/", {"format": "json"}, ttl=600)
    lists = data.get("MRData", {}).get("StandingsTable", {}).get("StandingsLists", [])
    return lists[0] if lists else {}


@app.get("/standings/drivers")
async def get_driver_standings():
    return await _jolpica_standings("driverStandings")


@app.get("/standings/constructors")
async def get_constructor_standings():
    return await _jolpica_standings("constructorStandings")


@app.get("/standings/form")
async def get_form(rounds: int = 5):
    # Recent finishing positions per driver, for a "form guide" on the standings.
    # One request per round, each cached an hour (finished rounds never change).
    standings = await _jolpica_standings("driverStandings")
    current = int(standings.get("round") or 0)
    if current <= 0:
        return {}
    rounds = max(1, min(rounds, 10))
    start = max(1, current - rounds + 1)
    form: dict = {}
    for rnd in range(start, current + 1):
        data = await _get(f"{JOLPICA_URL}/current/{rnd}/results/", {"format": "json"}, ttl=3600)
        races = data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
        if not races:
            continue
        for res in races[0].get("Results", []):
            did = res.get("Driver", {}).get("driverId")
            if not did:
                continue
            form.setdefault(did, []).append(
                {"round": rnd, "position": res.get("positionText") or res.get("position")}
            )
    return form


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
