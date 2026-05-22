# WebRTC Architecture — Voice & Video Calls

NexAura uses **Socket.IO for signaling only**; audio/video media flows **peer-to-peer** via **simple-peer** in the browser.

---

## 1. High-level call architecture

```mermaid
flowchart TB
  subgraph Signaling["Signaling plane — Server (no media)"]
    SIO["Socket.IO server"]
    CS["callSignaling.service<br/>in-memory call locks"]
    CH["call.handler.js"]
  end

  subgraph Media["Media plane — P2P (browser)"]
    PeerA["simple-peer<br/>User A"]
    PeerB["simple-peer<br/>User B"]
    STUN["STUN<br/>stun.relay.metered.ca:80"]
    TURN["TURN optional<br/>VITE_TURN_* env"]
  end

  Caller["Caller browser<br/>VideoCall.jsx"] --> CH
  Callee["Callee browser<br/>VideoCall.jsx"] --> CH
  CH --> CS
  CH --> SIO

  Caller <-->|"SDP + ICE via call-signal"| SIO
  Callee <-->|"call-signal events"| SIO

  Caller <-->|"RTP / SRTP"| PeerA
  Callee <-->|"RTP / SRTP"| PeerB
  PeerA <-.->|"direct or via TURN"| PeerB

  PeerA --> STUN
  PeerB --> STUN
  PeerA -.-> TURN
  PeerB -.-> TURN
```

| Plane | Carries | Server role |
|-------|---------|-------------|
| **Signaling** | call-initiated, call-accepted, call-signal, call-ended | Relay + busy/online checks |
| **Media** | Camera/mic streams | None — WebRTC P2P |

---

## 2. Call setup sequence (successful path)

```mermaid
sequenceDiagram
  autonumber
  actor Caller as Caller (User A)
  participant VC_A as VideoCall A
  participant Server as call.handler + callSignaling
  participant VC_B as VideoCall B
  actor Callee as Callee (User B)

  Caller->>VC_A: Start call (audio/video)
  VC_A->>VC_A: getUserMedia()
  VC_A->>Server: call-initiated<br/>{ from, to, callType, callerName }

  Server->>Server: tryAcquire(from, to)
  Server->>Server: presenceService.isOnline(to)

  alt Callee offline
    Server-->>VC_A: call-failed
  else Callee online
    Server->>VC_B: incoming-call<br/>{ from, callType, offer? }
    VC_B->>VC_B: useVideoCallStore.setIncomingCall
  end

  Callee->>VC_B: Accept
  VC_B->>VC_B: getUserMedia()
  VC_B->>Server: call-accepted { by, to }
  Server->>VC_A: call-accepted

  VC_A->>VC_A: new Peer(initiator: true, trickle: false)
  VC_A->>Server: call-signal { data: SDP offer }
  Server->>VC_B: call-signal

  VC_B->>VC_B: new Peer(initiator: false)
  VC_B->>VC_B: peer.signal(offer)
  VC_B->>Server: call-signal { data: SDP answer }
  Server->>VC_A: call-signal

  Note over VC_A,VC_B: ICE bundled in SDP (trickle: false)

  VC_A-->>Callee: Media stream (P2P)
  Callee-->>VC_A: Media stream (P2P)
```

---

## 3. Signaling state machine (server-side lock)

```mermaid
stateDiagram-v2
  [*] --> Idle: No active call

  Idle --> Ringing: tryAcquire(caller, callee)<br/>+ callee online
  Idle --> Idle: tryAcquire fails OR callee offline<br/>→ call-failed

  Ringing --> Connected: call-accepted + signals exchanged
  Ringing --> Idle: call-rejected → release
  Ringing --> Idle: call-ended → release

  Connected --> Idle: call-ended → releaseAllForUser on disconnect

  note right of Ringing
    Key: {from}:{to}
    In-memory Map (callSignaling.service)
    Prevents duplicate calls
  end note
```

---

## 4. simple-peer configuration (client)

```mermaid
flowchart LR
  subgraph Config["Peer options — VideoCall.jsx"]
    Init["initiator: true|false"]
    Trick["trickle: false<br/>(single signal blob)"]
    Stream["stream: MediaStream"]
    ICE["config.iceServers"]
  end

  subgraph ICEList["ICE servers"]
    S1["STUN — stun.relay.metered.ca:80"]
    S2["TURN — optional<br/>env VITE_TURN_USERNAME/PASSWORD"]
  end

  Init --> Peer["simple-peer Peer instance"]
  Trick --> Peer
  Stream --> Peer
  ICE --> ICEList --> Peer

  Peer -->|on signal| Emit["socket.emit call-signal"]
  Peer -->|on stream| Video["<video> elements"]
```

---

## 5. Frontend components & events

```mermaid
flowchart TB
  subgraph UI["UI entry points"]
    CHdr["ChatHeader — call buttons"]
    CBtn["CallButtons"]
    CCont["ChatContainer — call-initiate"]
  end

  subgraph Global["Global overlays — App.jsx"]
    CL["CallListener<br/>browser Notification"]
    VC["VideoCall.jsx<br/>full-screen call UI"]
  end

  subgraph Store["useVideoCallStore"]
    S1["isIncomingCall / isCalling"]
    S2["isCallActive / callType"]
    S3["incomingCallFrom / peerId"]
  end

  subgraph SocketEvents["Socket events"]
    Out["OUT: call-initiated · call-initiate<br/>call-accepted · call-signal<br/>call-ended · call-rejected"]
    In["IN: incoming-call · call-accepted<br/>call-signal · call-failed<br/>call-ended · call-rejected"]
  end

  CHdr --> VC
  CBtn --> VC
  CCont --> VC
  CL --> Store
  VC --> Store
  VC --> SocketEvents
  CL --> SocketEvents

  subgraph AuthHook["useAuthSocket — parallel handlers"]
    AH["incoming-call → setIncomingCall"]
  end

  AuthHook --> Store
```

---

## 6. What the server does NOT do

```mermaid
flowchart LR
  Server["Backend server"]
  Server --> OK1["✓ Validate users online"]
  Server --> OK2["✓ Enforce one call per pair"]
  Server --> OK3["✓ Relay JSON signaling payloads"]
  Server --> NO1["✗ Terminate RTP"]
  Server --> NO2["✗ SFU / MCU mixing"]
  Server --> NO3["✗ Store recordings"]

  style NO1 fill:#fee2e2,stroke:#dc2626
  style NO2 fill:#fee2e2,stroke:#dc2626
  style NO3 fill:#fee2e2,stroke:#dc2626
  style OK1 fill:#ecfdf5,stroke:#059669
  style OK2 fill:#ecfdf5,stroke:#059669
  style OK3 fill:#ecfdf5,stroke:#059669
```

**Files:** `backend/src/handlers/call.handler.js` · `backend/src/services/callSignaling.service.js` · `frontend/src/components/VideoCall.jsx` · `frontend/src/components/CallListener.jsx`

**Related:** [Socket architecture](./04-socket-realtime.md) · [System overview](./01-system-overview.md)
