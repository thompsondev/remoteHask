# remoteHask Desktop Agent

Rust persistent agent for endpoint enrollment, heartbeat, screen capture, and WebRTC.

## Status

Scaffold only. Implementation will follow [SYSTEM_ARCHITECTURE.md](../../SYSTEM_ARCHITECTURE.md) and [API_SPECIFICATION.md](../../API_SPECIFICATION.md).

## Build

```bash
cargo build --release
```

## Run

```bash
RUST_LOG=info cargo run
```

## Layout (planned)

```text
src/
  main.rs
  config/
  connection/     # Socket.IO client
  enrollment/
  capture/
  webrtc/
  input/
```
