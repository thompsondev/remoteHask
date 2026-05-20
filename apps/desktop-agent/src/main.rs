//! remoteHask desktop agent — scaffold
//!
//! See SYSTEM_ARCHITECTURE.md for agent responsibilities (capture, WebRTC, Socket.IO).

use tracing::{info, Level};
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env().add_directive(Level::INFO.into()))
        .init();

    info!("remoteHask agent starting (scaffold)");

    tokio::signal::ctrl_c()
        .await
        .expect("failed to listen for ctrl-c");

    info!("remoteHask agent shutting down");
}
