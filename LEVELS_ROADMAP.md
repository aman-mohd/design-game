# 🗺️ DesignQuest Level Roadmap

A plan to grow DesignQuest's curriculum from **7 shipped levels** to a full
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

## ✅ Wave 0 & 1 — Shipped (7 levels)

| # | Level | ByteByteGo grounding | Teaches |
|---|-------|----------------------|---------|
| 1 | **Your First Web App** (URL shortener) | Unique ID Generator, KV stores, Caching strategies | persistence, read-through cache, when a load balancer earns its keep |
| 2 | **Going Viral** (social profile / feed under a spike) | Twitter "For You" timeline, CDNs, Scaling for millions | cache, read replicas, CDN + object storage for media, autoscaling |
| 3 | **Around the World** (global app + region outage) | CAP theorem, High availability, Read replica pattern | multi-region, GeoDNS/edge, replication, CAP trade-off, chaos/redundancy |
| 4 | **Hold the Line** (public API under abuse) | API Gateway 101, Designing Effective & Safe APIs | API gateway as front door, rate limiting, autoscaling under bursts — `tag: gateway` |
| 5 | **Ping Everyone** (notifications at fan-out scale) | Push Notification System, Message Queues | async fan-out via queue + workers, accept-fast/deliver-steadily — `tag: fanout` |
| 6 | **Find It Fast** (search & autocomplete) | How Search Engines Work, Elasticsearch use cases | search index vs DB scan, caching hot queries — `tag: search` |
| 7 | **Lights, Camera, Upload** (video platform, capstone) | YouTube upload handling, Large file to S3, CDNs | object storage + CDN for media, off-request-path transcoding — `tag: transcode` |

New engine work these added: a tag-gated `domainChecks` module
(`src/engine/checks/domain.ts`) for the gateway / search / fan-out / transcode
lessons, an optional `tags` field on `Level`, and a handful of requirement
keywords. No new tools were needed — the existing catalog covered them.

---

## 🌊 Wave 2 — More building blocks & content systems (next up)

| Level | ByteByteGo source | New tools | New checks |
|-------|-------------------|-----------|------------|
| **Design a Key-Value Store** | "Consistent Hashing", "Data Sharding Algorithms", "7 Strategies to Scale Your Database" | `shard`/`coordinator` | `shardingChecks`: hot-shard / uneven partitioning, consistent hashing nudge |
| **Design a Unique ID Generator** | "5 Unique ID Generators in Distributed Systems" | — | `idChecks`: single-DB sequence as a bottleneck/SPOF; Snowflake-style hint |
| **Design a News Feed** (Twitter/Reddit) | "Twitter For You", "Reddit Core Architecture" | `feed_cache` | fan-out-on-write vs read; celebrity-fanout hint (`tag: feed`) |
| **Design Google Maps / Proximity Service** | "Design Google Maps", "Proximity Service", "Quadtree" | `geo_index` (quadtree) | geospatial index vs full scan; sharding by region (`tag: geo`) |

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
