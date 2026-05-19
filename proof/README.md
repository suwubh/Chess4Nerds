# Benchmarks

Two-replica WebSocket throughput vs single-node baseline. Replicas share
game-broadcast state through Redis pub/sub.

## Prereqs

- Docker Desktop running (used for Redis + nginx)
- [`k6`](https://k6.io/docs/get-started/installation/) on PATH
- The full repo dev environment working (`npm run dev` from the repo root)

The WS replicas run natively on the host so they pick up the workspace
packages without dockerization. nginx (in Docker) reverse-proxies to them via
`host.docker.internal`. The backend stays up too — `loadtest-chess.js` calls
`POST /auth/guest` to mint a unique JWT per VU.

## 1. Build the WS bundle

```powershell
cd apps\ws
npm run build
cd ..\..
```

## 2. Start Redis + nginx

```powershell
docker compose -f proof\docker-compose.bench.yml up -d
```

## 3. Single-node baseline

`cd` into `apps\ws` first — Prisma's native query engine resolves relative to
cwd. Then start a single ws replica on port 8081:

```powershell
cd apps\ws
$env:WS_PORT = "8081"
$env:REDIS_URL = "redis://localhost:6379"
$env:JWT_SECRET = "<same value as apps\ws\.env>"
$env:DATABASE_URL = "<same value as apps\ws\.env>"
node dist\index.js
```

In a second window (from the repo root), run k6:

```powershell
$env:BACKEND_URL = "http://localhost:3000"
$env:WS_URL = "ws://localhost:8080"
k6 run --out json=proof\single-node.json proof\loadtest-chess.js | Tee-Object proof\single-node.txt
```

Note the `chess_moves_played` value. `Ctrl+C` the replica.

## 4. Two-replica run

Replica 1 (from `apps\ws`):

```powershell
cd apps\ws
$env:WS_PORT = "8081"
$env:REDIS_URL = "redis://localhost:6379"
$env:JWT_SECRET = "<same>"
$env:DATABASE_URL = "<same>"
node dist\index.js
```

Replica 2 (also from `apps\ws`, second window):

```powershell
cd apps\ws
$env:WS_PORT = "8082"
$env:REDIS_URL = "redis://localhost:6379"
$env:JWT_SECRET = "<same>"
$env:DATABASE_URL = "<same>"
node dist\index.js
```

Both should log `Redis pub/sub connected`. Third window for k6:

```powershell
$env:BACKEND_URL = "http://localhost:3000"
$env:WS_URL = "ws://localhost:8080"
k6 run --out json=proof\multi-node.json proof\loadtest-chess.js | Tee-Object proof\multi-node.txt
```

## 5. Compute the ratio

`multi-node` ÷ `single-node` = the throughput multiplier.

If both numbers look equal, nginx is probably pinning everything to one
replica via `ip_hash` (every k6 VU comes from `127.0.0.1`). Swap to plain
round-robin in `nginx.conf` and restart nginx:

```powershell
docker compose -f proof\docker-compose.bench.yml restart nginx
```

## 6. Tear down

```powershell
docker compose -f proof\docker-compose.bench.yml down
```
