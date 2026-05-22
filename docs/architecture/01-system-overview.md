# System Overview — Complete Website Architecture

High-level view of **NexAura (VibeTalk)**: clients, edge hosting, API server, data stores, and real-time infrastructure.

---

## 1. Production deployment topology

```mermaid
flowchart TB
  subgraph Client["Client devices"]
    Browser["Web browser<br/>(React SPA)"]
  end

  subgraph Vercel["Vercel — Frontend hosting"]
    CDN["Static CDN<br/>frontend/dist"]
    SPA["SPA routes → index.html"]
  end

  subgraph Clerk["Clerk — Identity"]
    ClerkUI["Sign-in / Sign-up UI"]
    JWKS["JWT issuer + JWKS"]
  end

  subgraph Render["Render — Backend hosting"]
    API["Node.js API<br/>Express + Socket.IO<br/>Port 5001"]
    Workers["BullMQ workers<br/>(in-process or standalone)"]
  end

  subgraph Data["Data & messaging infra"]
    MongoDB[("MongoDB Atlas<br/>Users · Messages · Groups")]
    Redis[("Redis<br/>Presence · Cache · Queues · Socket adapter")]
    Cloudinary["Cloudinary<br/>(optional media)"]
  end

  Browser -->|"HTTPS — app UI"| CDN
  CDN --> SPA
  Browser -->|"Clerk SDK"| ClerkUI
  ClerkUI --> JWKS

  Browser -->|"REST /api/*<br/>Bearer JWT"| API
  Browser -->|"WebSocket<br/>Socket.IO + auth.token"| API

  API --> MongoDB
  API --> Redis
  API --> Cloudinary
  Workers --> Redis
  Workers --> MongoDB

  API -.->|"JWT verify"| JWKS

  classDef edge fill:#ede9fe,stroke:#7c3aed,color:#1e1b4b
  classDef data fill:#ecfdf5,stroke:#059669,color:#064e3b
  classDef auth fill:#fef3c7,stroke:#d97706,color:#78350f
  class Vercel,CDN,SPA edge
  class MongoDB,Redis,Cloudinary data
  class Clerk,ClerkUI,JWKS auth
```

| Layer | Technology | Role |
|-------|------------|------|
| **Frontend** | React 18 + Vite + Zustand | Chat UI, calls, watch party, settings |
| **Auth** | Clerk (`@clerk/clerk-react`) | Login; backend validates Clerk JWT |
| **API** | Express 4 | REST: auth, messages, friends, groups |
| **Realtime** | Socket.IO 4 | Live messages, presence, calls, watch party |
| **Primary DB** | MongoDB (Mongoose) | Persistent users, DMs, groups |
| **Redis** | ioredis + BullMQ | Online set, thread cache, job queues, multi-instance sockets |
| **Deploy** | `vercel.json` + `render.yaml` | Frontend on Vercel, backend on Render |

---

## 2. Application layers (logical architecture)

```mermaid
flowchart LR
  subgraph Presentation["Presentation layer — Frontend"]
    Pages["Pages<br/>Home · WatchParty · Settings"]
    Components["Components<br/>Chat · Sidebar · VideoCall"]
    Stores["Zustand stores<br/>auth · chat · group · friends"]
    Providers["Providers<br/>ClerkAuthBridge · AuthSocket · WatchParty"]
  end

  subgraph Gateway["Gateway layer — Backend HTTP + WS"]
    Routes["REST routes<br/>/api/auth · messages · friends · groups"]
    SocketIO["Socket.IO server<br/>authenticateSocket middleware"]
    Health["/health · /ready · /metrics"]
  end

  subgraph Application["Application layer — Services"]
    AuthSvc["auth.service"]
    MsgPipe["messagePipeline.service"]
    GrpPipe["groupPipeline.service"]
    ReceiptSvc["receipt.service"]
    PresenceSvc["presence.service"]
    CallSig["callSignaling.service"]
    WatchCtrl["watchPartyController"]
  end

  subgraph Infrastructure["Infrastructure layer"]
    Repos["Repositories<br/>user · message · group · friend"]
    Queues["BullMQ queues<br/>delivery · fanout · receipt"]
    Notifier["SocketNotifier / redis-emitter"]
    Workers["Workers<br/>messageDelivery · group · receipt"]
  end

  subgraph Domain["Domain layer"]
    Policy["deliveryPolicy.planDelivery"]
    Rules["group.rules · ids · DTOs"]
    Events["socketEvents constants"]
  end

  subgraph Persistence["Persistence"]
    Mongo[("MongoDB")]
    RedisStore[("Redis")]
  end

  Pages --> Components --> Stores --> Providers
  Providers -->|"axios + socket.io-client"| Routes
  Providers --> SocketIO

  Routes --> AuthSvc
  Routes --> MsgPipe
  SocketIO --> MsgPipe
  SocketIO --> GrpPipe
  SocketIO --> CallSig
  SocketIO --> WatchCtrl

  MsgPipe --> Policy
  MsgPipe --> Repos
  MsgPipe --> Queues
  Queues --> Workers
  Workers --> Notifier
  Workers --> Repos

  Repos --> Mongo
  PresenceSvc --> RedisStore
  Queues --> RedisStore
  Notifier --> SocketIO
```

---

## 3. Frontend module map

```mermaid
flowchart TB
  subgraph Core["App shell"]
    main["main.jsx<br/>ClerkProvider + Router"]
    App["App.jsx<br/>routes + lazy pages"]
  end

  subgraph Realtime["Realtime bootstrap"]
    Bridge["ClerkAuthBridge<br/>syncUser + token"]
    AuthSock["AuthSocketProvider<br/>useAuthSocket"]
    SockCtx["SocketContext<br/>single connection"]
  end

  subgraph Features["Feature modules"]
    Home["HomePage<br/>Sidebar + ChatContainer"]
    WP["WatchPartyPage<br/>WatchPartyContext"]
    Call["VideoCall + CallListener<br/>useVideoCallStore"]
    Music["MusicPlayerDrawer<br/>music-sync room"]
    WB["Whiteboard<br/>join-room + draw events"]
  end

  main --> App
  App --> Bridge --> AuthSock --> SockCtx
  App --> Home
  App --> WP
  App --> Call
  Home --> Music
  Home --> WB
  SockCtx --> WP
  AuthSock --> Home
```

---

## 4. Backend boot sequence

```mermaid
sequenceDiagram
  autonumber
  participant Index as index.js
  participant DB as MongoDB
  participant Redis as Redis
  participant Bus as realtimeBus
  participant Adapter as socket Redis adapter
  participant IO as Socket.IO
  participant W as Bull workers

  Index->>Index: assertRequiredEnv()
  Index->>DB: connectDB()
  Index->>Redis: connectRedis()
  Index->>Bus: initRealtimeBus()
  Index->>IO: createSocketServer(httpServer)
  Index->>Adapter: attachSocketRedisAdapter(io)
  Index->>W: startAllWorkers()

  Note over Index,W: SIGTERM → stop workers, close queues,<br/>close adapter, disconnect Redis
```

---

## Key environment links

| Frontend (Vercel) | Backend (Render) |
|-------------------|------------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | `CLERK_JWT_ISSUER` |
| `VITE_BACKEND_URL` → API base | `MONGODB_URI` |
| `VITE_SOCKET_URL` (optional) | `REDIS_URL` |
| | `CORS_ORIGINS` (must include Vercel URL) |

**Related diagrams:** [Messaging](./02-messaging.md) · [WebRTC](./03-webrtc.md) · [Socket](./04-socket-realtime.md) · [Redis & Watch Party](./05-redis-pipeline-and-watch-party.md)
