# 🗺️ DesignQuest Level Roadmap

A plan to grow DesignQuest's curriculum from **3 shipped levels** to a full
system-design course, drawing every level from
[**ByteByteGo / system-design-101**](https://github.com/ByteByteGoHq/system-design-101).

Each level is **pure data** in `src/data/levels.ts` (brief, requirements,
pre-placed nodes, available tools, default traffic, rubric, references). The
React Flow canvas, simulation engine, and scoring are **generic**, so most new
levels need *no code*. When a level introduces a genuinely new concept, the
table notes the new **tool** (`src/data/tools.ts`) and/or **engine check**
(`src/engine/checks/`) to add first.

Levels are grouped into **waves** of increasing difficulty. Within a wave, ship
in listed order. A wave is "done" when its levels are playable end-to-end with
sensible bottlenecks and hints.

---

## ✅ Wave 0 — Shipped (the vertical slice)

| # | Level | ByteByteGo grounding | Teaches |
|---|-------|----------------------|---------|
| 1 | **Your First Web App** (URL shortener) | Unique ID Generator, KV stores, Caching strategies | persistence, read-through cache, when a load balancer earns its keep |
| 2 | **Going Viral** (social profile / feed under a spike) | Twitter "For You" timeline, CDNs, Scaling for millions | cache, read replicas, CDN + object storage for media, autoscaling |
| 3 | **Around the World** (global app + region outage) | CAP theorem, High availability, Read replica pattern | multi-region, GeoDNS/edge, replication, CAP trade-off, chaos/redundancy |

---

## 🌊 Wave 1 — Core building blocks (next up)

Reinforces the fundamentals every interview leans on. Mostly reuses existing
tools/checks.

| Level | ByteByteGo source | New tools | New checks |
|-------|-------------------|-----------|------------|
| **Design a Rate Limiter** | "API Gateway 101", "Designing Effective & Safe APIs" | `rate_limiter` (or reuse `api_gateway`) | `apiChecks`: public traffic with no gateway/rate limit; abuse/burst protection |
| **Design a Notification System** | "Push Notification System Architecture", "How are Notifications Pushed…" | `push_provider` (APNs/FCM) | extend `messagingChecks`: fan-out via queue + workers, retry/delivery semantics |
| **Design a Key-Value Store** | "Consistent Hashing", "Data Sharding Algorithms", "7 Strategies to Scale Your Database" | `shard`/`coordinator` | `shardingChecks`: hot-shard / uneven partitioning, consistent hashing nudge |
| **Design a Unique ID Generator** | "5 Unique ID Generators in Distributed Systems" | — | `idChecks`: single-DB sequence as a bottleneck/SPOF; Snowflake-style hint |

## 🌊 Wave 2 — Read-heavy & content systems

| Level | ByteByteGo source | New tools | New checks |
|-------|-------------------|-----------|------------|
| **Design a News Feed** (Twitter/Reddit) | "Twitter For You", "Reddit Core Architecture" | `pubsub` (have it), `feed_cache` | fan-out-on-write vs read; celebrity-fanout hint |
| **Design YouTube / Video Upload** | "YouTube Massive Video Upload Handling", "Upload a Large File to S3" | `transcoder` worker, `object_storage` (have) | large-file path, async transcoding via queue, CDN delivery |
| **Design a Search Engine / Autocomplete** | "How Do Search Engines Work?", "Elasticsearch use cases" | `search_index` (have), `crawler` | search index vs DB scan; indexing pipeline |
| **Design Google Maps / Proximity Service** | "Design Google Maps", "Proximity Service", "Quadtree" | `geo_index` (quadtree) | geospatial index vs full scan; sharding by region |

## 🌊 Wave 3 — Real-time & stateful systems

| Level | ByteByteGo source | New tools | New checks |
|-------|-------------------|-----------|------------|
| **Design a Chat App** (WhatsApp/Discord) | "Designing a Chat Application", "Discord trillions of messages" | `websocket_gateway`, `presence_service` | persistent connections vs request/response; message store choice |
| **Design Google Docs** (collaboration) | "Design Google Docs" | `collab_service` (OT/CRDT) | conflict resolution, low-latency sync, consistency trade-off |
| **Design a Live Streaming System** | "Live Streaming Explained" | `ingest`, `edge_cache` | latency vs scale, fan-out to millions, CDN tiers |
| **Design Gmail / Email Delivery** | "Design Gmail", "How is Email Delivered?" | `smtp_gateway`, `mailbox_store` | queue-backed delivery, spam/processing pipeline, storage scale |

## 🌊 Wave 4 — Transactions, money & correctness

| Level | ByteByteGo source | New tools | New checks |
|-------|-------------------|-----------|------------|
| **Design a Payment System** | "Payment System", "How to Avoid Double Payment", "Reconciliation in Payment" | `ledger_db`, `idempotency_store` | idempotency keys, exactly-once, reconciliation, strong consistency required |
| **Design a Stock Exchange** | "Design Stock Exchange", "Low Latency Stock Exchange" | `matching_engine`, `sequencer` | ultra-low latency, ordering guarantees, in-memory + durability |
| **Design a Digital Wallet** | "Digital Wallets: Banks vs Blockchain", "Handling Hotspot Accounts" | `hot_account_shard` | hotspot accounts, contention, balanced consistency |

## 🌊 Wave 5 — Resilience, scale & operations

| Level | ByteByteGo source | New tools | New checks |
|-------|-------------------|-----------|------------|
| **Design for Fault Tolerance** | "Cheat Sheet for Designing Fault-Tolerant Systems", "Resiliency Patterns" | circuit-breaker config on edges | cascading failure, bulkheads, retries/backoff |
| **Design Event-Driven Architecture** | "McDonald's Event-Driven Architecture", "Event Sourcing" | `event_store` | choreography vs orchestration, replayability |
| **Design a Metrics/Logging Pipeline** | "ELK Stack", "Push vs Pull metrics", "Logging, Tracing, Metrics" | `log_collector`, `tsdb` | ingestion backpressure, sampling, storage tiering |
| **Design a Distributed Lock / Config** | "Why Use a Distributed Lock?", "Manage configurations" | `coordination_service` (ZK/etcd) | split-brain, leader election |

---

## How to add a level (checklist)

1. **Pick** the next item from the current wave.
2. **Add new tools** to `src/data/tools.ts` if the table calls for them (id,
   name, category, icon from `src/components/ui/Icon.tsx`, blurb).
3. **Add new checks** to `src/engine/checks/` if a new failure mode is taught —
   a pure `(graph, traffic, level) => Finding[]`, registered in
   `src/engine/simulate.ts`, with tiered Socratic `hints`.
4. **Author the level** in `src/data/levels.ts`: brief, functional &
   non-functional requirements, locked pre-placed nodes (the "must-knows"),
   `availableToolIds`, tuned `trafficDefaults`, `rubric` (ideal components +
   complexity budget), and `references` linking back to ByteByteGo.
5. **Test**: add a Vitest case in `src/engine/simulate.test.ts` proving the new
   check fires on a flawed design and stays silent on a good one.
6. **Map unlocks**: levels unlock sequentially by `id`
   (`isLevelUnlocked` in `src/store/gameStore.ts`) — just append in order.

## Engine growth needed (cross-cutting, do as waves demand)

- **Idempotency / exactly-once** modeling (Wave 4) — add a notion of write
  semantics to `TrafficConfig`.
- **Persistent connections** (Wave 3) — a "concurrent connections" traffic knob
  distinct from RPS.
- **Pipeline/async depth** — represent worker pools and queue backpressure for
  ingestion-heavy levels (Waves 2 & 5).
- **Per-node light config** (optional) — replica counts, cache TTL — to deepen
  scoring without losing determinism.
