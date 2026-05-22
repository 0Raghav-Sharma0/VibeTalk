# Messaging Architecture

How **direct messages (1:1)** and **group messages** flow from the UI through REST/Socket.IO to MongoDB and back to recipients.

---

## 1. Direct message — end-to-end flow

```mermaid
sequenceDiagram
  autonumber
  actor UserA as User A (sender)
  participant UI as MessageInput / useChatStore
  participant Sock as Socket.IO client
  participant Handler as messaging.handler
  participant Pipe as messagePipeline.service
  participant DB as MongoDB (Message)
  participant Cache as Redis thread cache
  participant Queue as BullMQ message-delivery
  participant Worker as messageDelivery.worker
  participant Notifier as SocketNotifier
  actor UserB as User B (receiver)

  UserA->>UI: Type + send
  UI->>UI: Optimistic message<br/>(clientMessageId, status: pending)
  UI->>Sock: emit sendMessage
  Sock->>Handler: sendMessage payload
  Handler->>Pipe: sendDirectMessage()

  Pipe->>DB: findByClientMessageId (dedup)
  Pipe->>DB: create Message document
  Pipe->>Cache: appendMessage(thread key)
  Pipe->>Sock: emit newMessage + messageAck → User A room

  alt Redis queues available
    Pipe->>Queue: enqueueDirectMessageDelivery
    Queue->>Worker: job deliver-direct
    Worker->>Pipe: deliverToReceiver()
  else Queue offline
    Pipe->>Pipe: deliverToReceiver() inline
  end

  Pipe->>Pipe: planDelivery() — online?
  alt Receiver online (room user:{receiverId})
    Worker->>Notifier: emitToUser newMessage
    Notifier->>UserB: newMessage
    Worker->>DB: markDeliveredIfPending
    Worker->>UserA: msg-delivered-update
  else Receiver offline
    Worker->>Queue: schedule offline retry
  end

  UserB->>Sock: msg-seen (optional)
  Sock->>UserA: msg-seen-update
```

---

## 2. Group message — fan-out flow

```mermaid
flowchart TB
  subgraph Client["Group sender client"]
    GInput["GroupMessageInput"]
    GStore["useGroupStore.sendGroupMessage"]
    Emit["socket.emit sendGroupMessage"]
  end

  subgraph Server["Backend"]
    GH["group.handler"]
    GP["groupPipeline.sendGroupMessage"]
    GRepo["groupRepository.createMessage"]
    Q["Queue: nexaura-group-message-delivery"]
    GW["groupMessageDelivery.worker"]
    Fan["fanOutToMembers()"]
  end

  subgraph Members["Each member socket room user:{memberId}"]
    M1["Member 1"]
    M2["Member 2"]
    Mn["Member N"]
  end

  GInput --> GStore --> Emit --> GH --> GP
  GP --> GRepo
  GP --> Q --> GW --> Fan
  Fan --> M1
  Fan --> M2
  Fan --> Mn

  Fan -->|"emit"| Ev["newGroupMessage"]
```

| Step | Component | Output event / data |
|------|-----------|---------------------|
| Send | `sendGroupMessage` socket event | Validates membership |
| Persist | `GroupMessage` model | `groupId`, `senderId`, content |
| Fan-out | Worker or sync path | `newGroupMessage` per member |
| Sidebar | REST `GET /groups` | Group list + unread counts |

---

## 3. Client-side messaging state

```mermaid
flowchart LR
  subgraph AuthStore["useAuthStore"]
    AU["authUser"]
    SK["socket"]
    OL["onlineUsers[]"]
  end

  subgraph ChatStore["useChatStore"]
    US["users — sidebar list"]
    SU["selectedUser"]
    MS["messages[]"]
    UM["unreadMessages map"]
    PN["pending by clientMessageId"]
    TY["typing map"]
  end

  subgraph Subscriptions["App.jsx on socket connect"]
    Sub1["subscribeToMessages()"]
    Sub2["subscribeToGroupMessages()"]
  end

  SK --> Sub1 --> ChatStore
  SK --> Sub2
  OL -->|"patch isOnline"| US
  AU --> ChatStore

  subgraph EventsIn["Inbound socket events — DM"]
    E1["newMessage"]
    E2["messageAck"]
    E3["msg-delivered-update"]
    E4["msg-seen-update"]
    E5["typing"]
    E6["message-error"]
  end

  EventsIn --> ChatStore
```

---

## 4. REST fallback & history sync

```mermaid
flowchart TB
  subgraph REST["REST API — message.route.js"]
    R1["GET /messages/users — sidebar"]
    R2["GET /messages/:userId — history"]
    R3["POST /messages/send/:userId — fallback send"]
    R4["POST /messages/reaction"]
    R5["POST /messages/upload-file"]
  end

  subgraph When["Used when"]
    W1["Initial page load"]
    W2["Socket disconnected"]
    W3["message-error → HTTP retry"]
    W4["Reconnect → refetchOpenChat / syncMessages"]
  end

  R1 --> W1
  R2 --> W1
  R3 --> W2
  R3 --> W3
  R2 --> W4
```

---

## 5. Message lifecycle & delivery states

```mermaid
stateDiagram-v2
  [*] --> Pending: Client optimistic send
  Pending --> Queued: messageAck (server accepted)
  Pending --> Failed: message-error

  Queued --> Sent: DB saved, enqueue delivery
  Sent --> Delivered: Receiver online + newMessage pushed
  Delivered --> Seen: Receiver emits msg-seen

  Sent --> PendingSync: Receiver offline (max retries)
  PendingSync --> Delivered: User comes online + retry worker

  note right of Pending
    clientMessageId dedup
  end note
  note right of Delivered
    msg-delivered-update to sender
  end note
```

---

## Data models (MongoDB)

| Model | File | Purpose |
|-------|------|---------|
| **Message** | `models/message.model.js` | 1:1 DMs: senderId, receiverId, text/media, delivered, seen, reactions |
| **Group** | `models/group.model.js` | members[], roles (admin/member) |
| **GroupMessage** | `models/groupMessage.model.js` | Group channel messages |
| **FriendRequest** | `models/friendRequest.model.js` | Friend graph (no separate Friend collection) |

**Thread cache (Redis):** `thread:{idA}:{idB}` — last 50 messages, TTL 600s (`conversationCache.service.js`).

**Related:** [Socket architecture](./04-socket-realtime.md) · [Redis pipeline](./05-redis-pipeline-and-watch-party.md)
