# Device presence & agent connectivity

This document explains architecture decisions, scaling, and security for device registration, WebSocket gateways, and heartbeat/presence.

---

## 1. Architecture decisions

### 1.1 Split WebSocket namespaces (`/console` vs `/agents`)

| Namespace | Clients | Auth | Purpose |
|-----------|---------|------|---------|
| `/console` | Next.js dashboard | JWT (user) | Org-wide `device:presence` fan-out, session signaling (future) |
| `/agents` | Desktop agent | Device token + `X-Device-Id` | Persistent connection, `agent:heartbeat`, commands (future) |

**Why:** Different trust models, rate limits, and connection lifetimes. Operators and agents never share the same auth path or room semantics.

### 1.2 Redis as source of truth for live presence

Postgres stores durable device records (`last_seen_at`, `last_known_presence`, metadata). **Online/stale/offline** for the dashboard is read from Redis first, then merged into API responses.

**Why:** Heartbeats every 15s across thousands of devices would hammer Postgres. Redis TTL + sets give O(1) lookups and natural expiry.

### 1.3 Redis pub/sub + Socket.IO Redis adapter

- **`presence:change` channel:** Any API/gateway instance can publish; all instances broadcast to console rooms.
- **`@socket.io/redis-adapter`:** Room membership and emits work across horizontal replicas.

**Why:** NestJS replicas are stateless; without pub/sub, presence updates would only reach consoles connected to the same pod.

### 1.4 Device lifecycle manager (stale → offline grace)

On disconnect, presence moves to **stale** immediately, then **offline** after `PRESENCE_STALE_GRACE_SECONDS` (default 30s) if no reconnect/heartbeat.

**Why:** Avoids flapping UI on brief network blips while still marking true outages within ~TTL + grace.

### 1.5 Throttled Postgres writes

Lifecycle persists device rows at most every **5 minutes** unless presence status changes or `force` (connect/disconnect).

**Why:** Heartbeats are frequent; metadata drift is acceptable between writes for MVP scale.

### 1.6 One-time enrollment tokens

Agents enroll via `POST /devices/enroll` with a short-lived, hashed enrollment token. Server returns a **device token** (bcrypt-stored hash) used for WS and HTTP heartbeat.

**Why:** No long-lived org secrets on installers; tokens are scoped, revocable, and auditable.

### 1.7 HTTP heartbeat fallback

`POST /devices/heartbeat` mirrors WS heartbeat for agents behind strict proxies.

**Why:** Operational resilience without duplicating business logic (both call `DeviceLifecycleService`).

### 1.8 Shared contracts (`@remotehask/shared-types`)

REST DTOs, WS envelopes (`WsEventEnvelope<T>`), and Zod validators live in one package consumed by backend, frontend, and contract tests.

**Why:** End-to-end type safety and runtime validation at boundaries.

---

## 2. Scaling considerations

### 2.1 Horizontal API/gateway replicas

- Run N NestJS instances behind a load balancer (HTTP sticky **not** required for REST).
- WebSockets: use LB with **connection affinity** or terminate WS at a dedicated gateway tier.
- Redis adapter + pub/sub required when `N > 1`.

### 2.2 Redis memory & keys

| Key pattern | Purpose |
|-------------|---------|
| `presence:device:{id}` | Hash: status, last_seen, gateway_id, socket_id |
| `presence:org:{orgId}:online` | Set of online device IDs |
| `device:conn:{id}` | Connection metadata |

Size ≈ `(devices × hash overhead) + (online set members)`. Plan Redis memory accordingly; set `maxmemory-policy` appropriately in production.

### 2.3 Heartbeat fan-out cost

Each heartbeat: 1× Redis HSET, optional SADD, 1× pub/sub message, 1× Socket.IO emit to org room.

At 10k devices / 15s → ~667 heartbeats/s cluster-wide. Scale Redis and gateway CPU linearly; consider aggregating presence UI updates (debounce) on the frontend if needed.

### 2.4 Postgres

Enrollment and list endpoints hit Postgres; heartbeats mostly do not. Index `devices(organization_id)` and paginate list APIs for large fleets.

### 2.5 Stale/offline timers

`setTimeout` grace per disconnect is in-process. At very large scale, move grace sweeps to a Redis keyspace notification or scheduled worker so disconnect bursts do not pile timers on one pod.

### 2.6 Multi-region (future)

Presence is inherently regional (Redis latency). Prefer regional Redis + gateway clusters; replicate Postgres for DR, not active-active presence without conflict resolution.

---

## 3. Security implications

### 3.1 Device token storage

Device tokens are shown **once** at enroll; only bcrypt hashes are stored. Compromise of DB does not reveal active tokens.

**Implication:** Token rotation/revocation APIs should be added before production; treat leaked tokens like passwords.

### 3.2 Enrollment tokens

- Stored hashed (`hashToken`).
- Expire (default 15 minutes), max uses, revocable.
- **Risk:** Token in URL/logs during install — use secure install channels, short TTL.

### 3.3 WebSocket authentication

- **Console:** JWT verified on connect; org membership checked before `org:{id}` join.
- **Agent:** Device token verified against credential row; `deviceId` in handshake must match credential.

**Implication:** Stolen JWT grants org presence stream, not agent impersonation. Stolen device token grants heartbeat + future command channel — scope agent permissions tightly.

### 3.4 Room isolation

Console clients join `org:{organizationId}` only after RBAC check. Device rooms `device:{id}` are available but should gate on `device.read` before sensitive session events.

### 3.5 Rate limiting (recommended, not yet enforced)

Apply per-device heartbeat rate limits and per-IP enroll limits to mitigate token brute force and heartbeat floods.

### 3.6 TLS and cookies

Production: `wss://`, `https://`, `Secure` + `SameSite` refresh cookies. `CORS_ORIGIN` must not be `*` when using credentials.

### 3.7 Redis security

Redis holds live socket IDs and usernames. Use ACLs, TLS (`rediss://`), private network. Pub/sub messages contain presence payloads — treat Redis as confidential.

### 3.8 Audit

Enrollment and presence changes should emit audit events (partially via seed patterns; extend for compliance).

---

## 4. Event reference (WebSocket)

### Console (`/console`)

| Event | Direction | Payload |
|-------|-----------|---------|
| `connected` | Server → client | `SocketConnectedPayload` (no envelope) |
| `device:presence` | Server → client | `WsEventEnvelope<DevicePresencePayload>` |
| `org:join` | Client → server | `{ organizationId }` |
| `device:join` / `device:leave` | Client → server | `{ deviceId }` |

### Agents (`/agents`)

| Event | Direction | Payload |
|-------|-----------|---------|
| `agent:heartbeat` | Client → server (ack) | `AgentHeartbeatPayload` → ack `AgentHeartbeatAckPayload` |

See `packages/shared-types/src/ws/index.ts` and OpenAPI at `/docs` for REST.

---

## 5. Configuration reference

| Env | Default | Role |
|-----|---------|------|
| `HEARTBEAT_INTERVAL_SECONDS` | 15 | Ack `nextHeartbeatSeconds` |
| `HEARTBEAT_TTL_SECONDS` | 45 | Redis key TTL |
| `PRESENCE_STALE_GRACE_SECONDS` | 30 | Disconnect → offline delay |
| `WS_PUBLIC_URL` | API origin | Returned to agents at enroll |
| `GATEWAY_INSTANCE_ID` | `gw-{pid}` | Stored in presence hash for debugging |
