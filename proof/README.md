# Load test

A [k6](https://k6.io) harness that drives the WebSocket server with many
concurrent games and measures move-propagation latency.

`loadtest-chess.js` mints one guest token per virtual user via
`POST /auth/guest`, connects each VU to the WS server, pairs them through
matchmaking, and plays a short opening line — timing the round trip from a
client's `move` send to the broadcast it receives back.

## Prerequisites

- The backend and WS server running (`npm run dev` from the repo root works).
- [`k6`](https://k6.io/docs/get-started/installation/) on your PATH.

## Run it

Start the backend with `RATE_LIMIT_DISABLED=true` so `setup()` can mint guest
tokens in bulk, then run k6 against the WS server:

```powershell
$env:BACKEND_URL = "http://localhost:3000"
$env:WS_URL = "ws://localhost:8080"
k6 run --vus 220 --duration 60s proof/loadtest-chess.js
```

The script defaults (20 VUs / 30s) are fine for a quick check; the headline
numbers below come from the 220-VU / 60s run.

## Results

`concurrency.txt` is the saved output of a 220-VU, 60-second run against a
single WS replica:

| Metric                        | Value        |
| ----------------------------- | ------------ |
| Concurrent games (peak)       | ~110         |
| Moves processed               | 305 / sec    |
| Move-propagation latency (p95) | 112 ms       |
| Failed checks                 | 0            |

## Scope

The WS server keeps game state and the matchmaking queue in memory, so this
harness load-tests a **single replica**. Setting `REDIS_URL` adds a pub/sub
broadcast relay (see the main README's "Scaling notes"), but running multiple
replicas correctly would also need shared matchmaking and game state — so there
is intentionally no multi-replica throughput comparison here.
