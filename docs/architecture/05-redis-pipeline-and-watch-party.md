# Redis, Message Pipeline & Watch Party Architecture

Async **message delivery** via BullMQ, **Redis** data structures, and **Watch Party** real-time rooms (in-memory, socket-only).

---

## Part A — Redis & Message Delivery Pipeline

### 1. Redis usage map

```mermaid
flowchart TB
  subgraph Clients["Redis clients — separate connections"]
    C1["lib/redis.js<br/>App cache + presence"]
    C2["bullConnection.js<br/>BullMQ IORedis"]
    C3["socketAdapter.js<br/>Socket.IO pub/sub"]
    C4["realtimeBus.js<br/>redis-emitter"]
  end

  subgraph Keys["Key patterns & structures"]
    K1["presence:online_users — SET"]
    K2["thread:{idA}:{idB} — LIST (50 msgs, TTL 600s)"]
    K3["user:{id} · sender:{id} · sidebar:{id}<br/>friendIds:{id} — STRING cache"]
  end

  subgraph Queues["BullMQ queue names"]
    Q1["nexaura-message-delivery"]
    Q2["nexaura-group-message-delivery"]
    Q3["nexaura-delivery-receipt"]
  end

  C1 --> K1 & K2 & K3
  C2 --> Q1 & Q2 & Q3
  C3 --> Adapter["Cross-pod socket sync"]
  C4 --> Adapter

  Workers["Workers"] --> C2
  Workers --> C4
```

| Redis role | When unavailable |
|------------|------------------|
| Presence SET | Falls back; delivery uses socket room membership |
| Thread LIST | Skip cache append; DB still authoritative |
| Bull queues | **Inline delivery** in API process |
| Socket adapter | Single-instance sockets only |

---

### 2. Message pipeline — direct message

```mermaid
flowchart TB
  subgraph Ingress["Ingress"]
    Sock["Socket sendMessage"]
    REST["REST POST /messages/send/:id"]
  end

  subgraph Pipeline["messagePipeline.service"]
    Dedup["Dedup by clientMessageId"]
    Create["messageRepository.create"]
    Enrich["enrichMessageDoc"]
    Cache["conversationCache.appendMessage"]
    Ack["Emit messageAck + newMessage → sender"]
    Enq{"Queues ready?"}
    Inline["deliverToReceiver inline"]
    Queue["enqueueDirectMessageDelivery"]
  end

  subgraph Worker["messageDelivery.worker"]
    Plan["planDelivery() — deliveryPolicy"]
    Online{"Receiver in room<br/>user:{id}?"}
    Push["SocketNotifier → newMessage"]
    Mark["markDeliveredIfPending"]
    Receipt["enqueueDeliveryReceipt"]
    Retry["schedule offline retry job"]
  end

  Sock & REST --> Dedup --> Create --> Enrich --> Cache --> Ack --> Enq
  Enq -->|No| Inline --> Plan
  Enq -->|Yes| Queue --> Worker --> Plan
  Plan --> Online
  Online -->|Yes| Push --> Mark --> Receipt
  Online -->|No| Retry
```

---

### 3. Delivery policy (pure domain logic)

```mermaid
flowchart TD
  Start["planDelivery()"]
  Start --> D1{"alreadyDelivered?"}
  D1 -->|Yes| A1["SKIP_ALREADY_DELIVERED"]
  D1 -->|No| D2{"receiverOnline?"}
  D2 -->|Yes| A2["PUSH_TO_RECEIVER<br/>emit newMessage"]
  D2 -->|No| D3{"attempt < maxRetries<br/>AND queue ready?"}
  D3 -->|Yes| A3["SCHEDULE_OFFLINE_RETRY<br/>delayed Bull job"]
  D3 -->|No| A4["PENDING_SYNC<br/>wait for reconnect / REST sync"]

  style A1 fill:#f3f4f6,stroke:#6b7280
  style A2 fill:#ecfdf5,stroke:#059669
  style A3 fill:#fef3c7,stroke:#d97706
  style A4 fill:#fee2e2,stroke:#dc2626
```

*Source: `backend/src/domain/deliveryPolicy.js`*

---

### 4. Group fan-out pipeline

```mermaid
sequenceDiagram
  autonumber
  participant Client as Sender client
  participant GP as groupPipeline
  participant DB as GroupMessage collection
  participant Q as nexaura-group-message-delivery
  participant W as groupMessageDelivery.worker
  participant IO as Socket.IO rooms

  Client->>GP: sendGroupMessage
  GP->>DB: createMessage + populate
  GP->>GP: enrichGroupMessage

  alt Queue ready
    GP->>Q: enqueueGroupFanout (jobId gmsg-{id})
    Q->>W: fanout-group job
    W->>IO: newGroupMessage → each user:{memberId}
  else Inline
    GP->>IO: fanOutToMembers sync
  end
```

---

### 5. Receipt worker chain

```mermaid
flowchart LR
  Delivered["Message marked delivered in DB"]
  Delivered --> Enq["enqueueDeliveryReceipt<br/>jobId receipt-{messageId}"]
  Enq --> RW["deliveryReceipt.worker"]
  RW --> Emit["emitDeliveryReceipt()"]
  Emit --> Evt["msg-delivered-update → sender room"]

  Seen["Client msg-seen"] --> RS["receipt.service.markSeen"]
  RS --> Evt2["msg-seen-update → peer"]
```

---

### 6. Worker deployment modes

```mermaid
flowchart TB
  subgraph ModeA["RUN_WORKERS_IN_API=true (default Render)"]
    A1["Single process"]
    A2["Express + Socket.IO + Bull consumers"]
  end

  subgraph ModeB["WORKER_ONLY=true — standalone.js"]
    B1["No HTTP"]
    B2["DB + Redis + workers only"]
  end

  subgraph ModeC["Scale compose — docker-compose.scale.yml"]
    C1["Multiple API replicas"]
    C2["Dedicated worker replicas"]
  end

  Env["env: REDIS_URL required for queues"] --> ModeA & ModeB & ModeC
```

---

## Part B — Watch Party Architecture

Watch Party is **socket-only** and **in-memory** (not stored in MongoDB).

### 7. Watch Party — component diagram

```mermaid
flowchart TB
  subgraph Frontend["Frontend — Vercel"]
    Page["WatchPartyPage<br/>lobby: create / join"]
    Ctx["WatchPartyContext"]
    WP["WatchParty.jsx"]
    VP["VideoPlayer — YouTube or local blob"]
    Chat["WatchPartyChatPanel"]
    React["ReactionOverlay"]
  end

  subgraph Backend["Backend — in-memory"]
    Handler["watchParty.handler.js"]
    Ctrl["watchPartyController.js"]
    Map["activeRooms Map"]
    Model["WatchPartyRoom class"]
  end

  Page --> Ctx --> WP
  WP --> VP & Chat & React
  Ctx -->|"single shared socket"| Handler
  Handler --> Ctrl --> Map --> Model
```

---

### 8. Watch Party — room lifecycle

```mermaid
stateDiagram-v2
  [*] --> Lobby: User opens /watch-party

  Lobby --> Active: watchparty:create<br/>OR watchparty:join
  Active --> Active: watchparty:sync (host only)
  Active --> Active: watchparty:chat / reaction
  Active --> Lobby: watchparty:leave
  Active --> [*]: Room empty → delete from activeRooms

  note right of Active
    Room ID generated on create
    Host = hostSocketId
    Participants Map by socket.id
  end note
```

---

### 9. Watch Party — event flow

```mermaid
sequenceDiagram
  autonumber
  actor Host as Host client
  actor Guest as Guest client
  participant Ctx as WatchPartyContext
  participant S as Socket.IO
  participant Ctrl as watchPartyController

  Host->>Ctx: createRoom(videoUrl)
  Ctx->>S: watchparty:create { videoUrl, videoType, user }
  S->>Ctrl: createRoom()
  Ctrl->>Ctrl: new WatchPartyRoom → activeRooms
  S-->>Ctx: watchparty:room-created { roomId }

  Guest->>Ctx: joinRoom(roomId)
  Ctx->>S: watchparty:join { roomId, user }
  S->>Ctrl: joinRoom()
  Ctrl-->>Guest: watchparty:room-joined
  Ctrl-->>Host: watchparty:participants-updated

  Host->>Ctx: Video play / seek
  Ctx->>S: watchparty:sync { roomId, state }
  Ctrl->>Ctrl: verify hostSocketId
  S-->>Guest: watchparty:state-synced

  Guest->>Ctx: chat message
  Ctx->>S: watchparty:chat
  S-->>Host: watchparty:chat-received
  S-->>Guest: watchparty:chat-received
```

---

### 10. Watch Party vs messaging comparison

```mermaid
flowchart LR
  subgraph DM["Direct messaging"]
    DM1["MongoDB persist"]
    DM2["BullMQ delivery"]
    DM3["user:{id} rooms"]
  end

  subgraph WP["Watch Party"]
    WP1["In-memory Map only"]
    WP2["No BullMQ"]
    WP3["io.to(roomId) broadcast"]
  end

  DM --> Durable["Survives restart: Yes"]
  WP --> Volatile["Survives restart: No"]

  style Durable fill:#ecfdf5,stroke:#059669
  style Volatile fill:#fef3c7,stroke:#d97706
```

| Aspect | Messaging | Watch Party |
|--------|-----------|-------------|
| Persistence | MongoDB | `activeRooms` Map |
| Delivery | BullMQ + policy | Immediate socket broadcast |
| Auth | Clerk JWT on socket | Same socket + optional client `user` payload |
| Host rules | N/A | Only host can `watchparty:sync` |

---

## Quick reference — queue jobs

| Queue | Job name | Job ID pattern | Processor |
|-------|----------|----------------|-----------|
| `nexaura-message-delivery` | `deliver-direct` | `msg-{messageId}` | `deliverToReceiver` |
| `nexaura-group-message-delivery` | `fanout-group` | `gmsg-{messageId}` | `fanOutToMembers` |
| `nexaura-delivery-receipt` | `emit-receipt` | `receipt-{messageId}` | `emitDeliveryReceipt` |

**Related:** [Messaging](./02-messaging.md) · [Socket](./04-socket-realtime.md) · [System overview](./01-system-overview.md)
