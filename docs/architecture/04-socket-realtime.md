# Socket.IO Realtime Architecture

How **Socket.IO** connects browsers to the backend, authenticates sessions, routes events to handlers, and scales across multiple API instances.

---

## 1. Connection & authentication flow

```mermaid
sequenceDiagram
  autonumber
  participant App as React App
  participant Bridge as ClerkAuthBridge
  participant Hook as useAuthSocket
  participant Clerk as Clerk session
  participant IO as Socket.IO server
  participant Auth as socketAuth + auth.service
  participant DB as MongoDB User
  participant Conn as connection.handler

  App->>Bridge: User signed in
  Bridge->>Bridge: syncUser() → authUser in store
  Bridge->>Hook: authUser._id present

  Hook->>Clerk: getClerkToken()
  Hook->>IO: io(socketUrl, { auth: { token, userId, username } })

  IO->>Auth: authenticateSocket middleware
  Auth->>Auth: verifySession(token) — Clerk JWT
  Auth->>DB: findByClerkIdLean(sub)
  Auth->>IO: socket.userId, socket.username set

  IO->>Conn: connection event
  Conn->>IO: socket.join("user:{userId}")
  Conn->>Conn: presenceService.setOnline (first tab)
  Conn->>IO: emit connection-success
  Conn->>Conn: registerSocketHandlers(io, socket)
  Conn->>Conn: scheduleBroadcastOnlineUsers()
```

---

## 2. Server socket stack

```mermaid
flowchart TB
  subgraph HTTP["HTTP server — index.js"]
    Express["Express createApp()"]
    HTTPSrv["http.createServer(app)"]
  end

  subgraph SocketLayer["Socket layer"]
    Create["socketServer.createSocketServer()"]
    CORS["socketCorsOptions<br/>vercel.app · onrender.com"]
    Scale["scale.config<br/>ping · transports · recovery"]
    Mid["io.use(authenticateSocket)"]
    ConnH["attachConnectionHandler"]
  end

  subgraph Handlers["Event handlers — registerHandlers.js"]
    H1["messaging — sendMessage"]
    H2["typing"]
    H3["group — sendGroupMessage"]
    H4["receipt — msg-delivered · msg-seen"]
    H5["mediaRoom — join-room · whiteboard · music-sync"]
    H6["call — call-* events"]
    H7["watchParty — watchparty:*"]
  end

  subgraph Support["Support services"]
    Pres["presence.service<br/>Redis SET presence:online_users"]
    Online["onlineBroadcast<br/>getOnlineUsers debounced"]
    Hold["ioHolder.getIO()"]
  end

  HTTPSrv --> Create
  Create --> CORS --> Scale --> Mid --> ConnH
  ConnH --> H1 & H2 & H3 & H4 & H5 & H6 & H7
  ConnH --> Pres --> Online
  Create --> Hold
```

---

## 3. Socket rooms & targeting

```mermaid
flowchart LR
  subgraph Rooms["Socket.IO rooms"]
    UR["user:{userId}<br/>Per-user inbox<br/>DMs · calls · receipts"]
    MR["media / whiteboard rooms<br/>join-room event"]
    WP["watch party<br/>io.to(roomId)"]
  end

  subgraph EmitPaths["Emit paths"]
    N1["SocketNotifier.emitToUser(userId, event, data)"]
    N2["io.to(userRoom(id)).emit(...)"]
    N3["realtimeBus redis-emitter<br/>(workers on other pods)"]
  end

  N1 --> UR
  N2 --> UR
  N3 --> UR

  subgraph ClientJoin["On connect — every socket"]
    J1["join user:{ownUserId}"]
  end

  J1 --> UR
```

| Room pattern | Joined when | Used for |
|--------------|-------------|----------|
| `user:{mongoUserId}` | Every authenticated connect | `newMessage`, `incoming-call`, `messageAck`, friend events |
| Ad-hoc room id | `join-room` (DM sorted ids, music) | Whiteboard, `music-sync` |
| Watch party `roomId` | `watchparty:join` | Playback sync, chat, reactions |

---

## 4. Handler → service map

```mermaid
flowchart TB
  subgraph Inbound["Client → Server events"]
    E1["sendMessage"]
    E2["sendGroupMessage"]
    E3["typing"]
    E4["msg-delivered / msg-seen"]
    E5["call-initiated · call-signal · …"]
    E6["watchparty:create · join · sync · chat"]
    E7["join-room · whiteboard-draw · music-sync"]
  end

  subgraph Services["Application services"]
    MP["messagePipeline"]
    GP["groupPipeline"]
    RS["receipt.service"]
    CS["callSignaling + relay"]
    WP["watchPartyController"]
    MR["mediaRoom handler — relay only"]
  end

  E1 --> MP
  E2 --> GP
  E3 --> MP
  E4 --> RS
  E5 --> CS
  E6 --> WP
  E7 --> MR
```

---

## 5. Outbound events (server → client)

```mermaid
flowchart LR
  subgraph Pipeline["Message pipeline emits"]
    P1["newMessage"]
    P2["messageAck"]
    P3["msg-delivered-update"]
    P4["newGroupMessage"]
  end

  subgraph Presence["Presence"]
    P5["getOnlineUsers"]
    P6["connection-success"]
  end

  subgraph Social["Friends — socket"]
    P7["friend-request-received"]
    P8["friend-request-accepted"]
    P9["friend-removed"]
  end

  subgraph Calls["Calls"]
    P10["incoming-call"]
    P11["call-failed"]
  end

  subgraph WPOut["Watch party"]
    P12["watchparty:room-created"]
    P13["watchparty:state-synced"]
    P14["watchparty:chat-received"]
  end

  Pipeline --> Client["Browser Zustand stores"]
  Presence --> Client
  Social --> Client
  Calls --> Client
  WPOut --> Client
```

*Canonical names: `backend/src/shared/events/socketEvents.js`*

---

## 6. Horizontal scaling (multi-instance)

```mermaid
flowchart TB
  subgraph Pod1["Render instance 1"]
    IO1["Socket.IO + Express"]
    W1["Workers optional"]
  end

  subgraph Pod2["Render instance 2"]
    IO2["Socket.IO + Express"]
    W2["Workers optional"]
  end

  subgraph RedisCluster["Redis"]
    Adapter["@socket.io/redis-adapter<br/>pub/sub — sync rooms"]
    Emitter["redis-emitter<br/>workers emit cross-pod"]
    Bull["BullMQ queues"]
    PresKey["presence:online_users SET"]
  end

  Browser1["User A browser"] --> IO1
  Browser2["User B browser"] --> IO2

  IO1 <--> Adapter
  IO2 <--> Adapter
  W1 --> Emitter
  W2 --> Emitter
  Emitter --> Adapter

  W1 & W2 --> Bull
  IO1 & IO2 --> PresKey
```

**Rule:** Any worker delivering a message uses `realtimeEmitToUser` so the correct pod receives the emit target.

---

## 7. Disconnect cleanup

```mermaid
flowchart TB
  DC["socket disconnect"]
  DC --> Q1{"Last socket in<br/>user:{id} room?"}
  Q1 -->|Yes| Off["presenceService.setOffline"]
  Q1 -->|Yes| Rel["callSignaling.releaseAllForUser"]
  Q1 -->|Yes| WP["watchPartyController.handleDisconnect"]
  Q1 -->|No| Keep["Stay online — other tabs open"]
  Off --> Broadcast["scheduleBroadcastOnlineUsers"]
  Rel --> Broadcast
  WP --> Broadcast
```

**Frontend:** single socket in `useAuthSocket` → `AuthSocketProvider` → `SocketContext`; reconnect refreshes Clerk token and calls `refetchOpenChat()`.

**Related:** [Messaging](./02-messaging.md) · [Redis pipeline](./05-redis-pipeline-and-watch-party.md)
