# Product Requirements Document

## Remote Desktop & Remote Device Management Platform

| Field | Value |
|-------|-------|
| **Document Version** | 1.0 |
| **Status** | Draft for Engineering & Security Review |
| **Classification** | Internal — Product & Architecture |
| **Last Updated** | 2026-05-20 |
| **Product Codename** | remoteHask |
| **Technical companions** | [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md), [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md), [MIGRATIONS_PLAN.md](./MIGRATIONS_PLAN.md), [API_SPECIFICATION.md](./API_SPECIFICATION.md), [CODING_STANDARDS.md](./CODING_STANDARDS.md) |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Goals, Non-Goals, and Success Metrics](#3-goals-non-goals-and-success-metrics)
4. [User Personas and Roles](#4-user-personas-and-roles)
5. [Core Features](#5-core-features)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Scalability Requirements](#7-scalability-requirements)
8. [Security Requirements](#8-security-requirements)
9. [System Modules](#9-system-modules)
10. [Enterprise Requirements](#10-enterprise-requirements)
11. [Risks and Mitigations](#11-risks-and-mitigations)
12. [Future Expansion Plans](#12-future-expansion-plans)
13. [Appendices](#13-appendices)

---

## 1. Executive Summary

This document defines the product requirements for a **production-grade, web-based remote desktop and remote device management platform** comparable in capability to industry leaders such as AnyDesk, RustDesk, and TeamViewer, with a modern cloud-native architecture and emphasis on **unattended access**, **organizational multi-tenancy**, and **enterprise security**.

The platform enables IT teams, managed service providers (MSPs), and internal support organizations to **discover, monitor, connect to, and manage fleets of endpoints** (Windows, macOS, Linux, and later mobile/embedded) through a unified web console and lightweight persistent agents.

Primary differentiators targeted at launch:

- **Browser-first control plane** — no mandatory thick client for operators; optional native viewer for performance-critical sessions.
- **Unattended, policy-governed access** — devices remain manageable when users are absent, subject to explicit consent and organizational policy.
- **Real-time presence** — authoritative online/offline state with heartbeat and last-seen semantics.
- **Audit-ready operations** — session logs, file transfer records, and administrative actions suitable for compliance review.

---

## 2. Product Overview

### 2.1 Problem Statement

Organizations struggle to support distributed workforces and heterogeneous device estates. Legacy remote tools often lack centralized policy, weak audit trails, poor multi-tenant isolation, or dependence on end-user presence. IT needs:

- Reliable **unattended** remediation and provisioning.
- A **single dashboard** for device health, connectivity, and remote intervention.
- **Provable accountability** for who accessed what, when, and what changed.

### 2.2 Product Vision

Deliver a secure, scalable platform where authorized users can **see device status at a glance**, **initiate encrypted remote desktop sessions** with low latency, **transfer files**, and **manage organizational access** — all governed by role-based policies and comprehensive logging.

### 2.3 Target Customers

| Segment | Primary Use Cases |
|---------|-------------------|
| **Internal IT** | Help desk, workstation support, software rollout verification |
| **MSPs** | Multi-customer device management under strict tenant isolation |
| **Enterprise security & ops** | Incident response, privileged access workflows, compliance evidence |
| **SMB** | Simple unattended support without on-prem infrastructure |

### 2.4 Supported Platforms (Phased)

| Phase | Agent / Endpoint | Operator Console |
|-------|------------------|------------------|
| **MVP** | Windows 10+, Windows Server 2019+; macOS 12+; Ubuntu 22.04 LTS | Modern evergreen browsers (Chrome, Edge, Firefox, Safari) |
| **Phase 2** | RHEL derivatives; headless Linux servers | Optional native desktop viewer (Windows/macOS) |
| **Phase 3** | iOS/Android (view-only or limited control per policy) | Mobile-responsive console (read-heavy) |

### 2.5 Deployment Models

- **SaaS (multi-tenant)** — default; regional data residency options for enterprise.
- **Private cloud / dedicated tenant** — single-tenant control plane and signaling; customer-managed object storage for recordings optional.
- **Hybrid relay** — customer-operated relay nodes at network edge for NAT traversal and bandwidth optimization; control plane remains cloud or self-hosted.

### 2.6 High-Level Architecture (Conceptual)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Web Console (SPA)                                 │
│   Dashboard · Devices · Sessions · Users · Orgs · Audit · Settings       │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS / WSS
┌───────────────────────────────▼─────────────────────────────────────────┐
│                     Control Plane API & Real-Time Gateway                │
│   Auth · RBAC · Device Registry · Session Orchestration · Billing        │
└───────┬─────────────────────────────┬───────────────────────────────────┘
        │                             │
        │                             │ Signaling / ICE / TURN coordination
        ▼                             ▼
┌───────────────┐              ┌──────────────────┐
│  Agent Fleet  │◄────────────►│  Media / Relay   │
│  (persistent)│   encrypted  │  Infrastructure  │
└───────────────┘   streams    └──────────────────┘
```

Agents maintain **persistent registration** with the control plane, report **heartbeat and telemetry**, and establish **encrypted media channels** for desktop streaming and file transfer when sessions are authorized.

---

## 3. Goals, Non-Goals, and Success Metrics

### 3.1 Goals

| ID | Goal |
|----|------|
| G1 | Enable unattended remote desktop with organizational policy enforcement |
| G2 | Provide sub-second perceived connect time on favorable networks (target: P95 &lt; 3s to first frame) |
| G3 | Support organizations with hundreds of thousands of registered devices |
| G4 | Deliver audit-grade session and administrative logs |
| G5 | Achieve enterprise security baseline (SSO, MFA, encryption, tenant isolation) |

### 3.2 Non-Goals (MVP)

- Full mobile device remote control parity with desktop OS.
- Built-in RMM patch management, MDM enrollment, or SIEM replacement (integrations only).
- On-premise control plane as default SKU (enterprise add-on later).
- Screen recording by default in all tiers (policy-gated feature).

### 3.3 Success Metrics (KPIs)

| Metric | Target (12 months post-GA) |
|--------|----------------------------|
| Session connect success rate | ≥ 99.5% (excluding client network failures) |
| Median time to interactive desktop | ≤ 2s (LAN); ≤ 5s (typical WAN) |
| Agent heartbeat accuracy (online state) | ≥ 99.9% correlation with ground truth within 60s |
| Platform availability (control plane) | 99.95% monthly |
| Critical security findings (production) | Zero unmitigated criticals &gt; 7 days |
| Enterprise customer SSO adoption | ≥ 80% of enterprise seats |

---

## 4. User Personas and Roles

### 4.1 Personas

| Persona | Description | Needs |
|---------|-------------|-------|
| **Support Technician** | Front-line help desk | Fast connect, clipboard, file transfer, session notes |
| **IT Administrator** | Manages org, agents, policies | Bulk deploy, groups, unattended rules, user provisioning |
| **Security Officer** | Governance and audit | Logs, MFA enforcement, IP restrictions, data retention |
| **MSP Operator** | Manages multiple customer orgs | Tenant switching, per-customer RBAC, billing visibility |
| **End User (Device Owner)** | Host machine user | Consent prompts, session visibility, disconnect control |
| **Platform Super Admin** | Vendor operations | Global health, abuse prevention, support impersonation (break-glass) |

### 4.2 Role Model (RBAC)

Roles are **scoped to organization** unless noted. Permissions are additive; custom roles may be defined in enterprise tiers.

| Role | Scope | Capabilities (summary) |
|------|-------|-------------------------|
| **Organization Owner** | Org | Full org settings, billing, delete org, assign all roles |
| **Organization Admin** | Org | Users, groups, devices, policies, integrations; no billing delete |
| **Device Manager** | Org / assigned groups | Register agents, assign groups, configure unattended policy |
| **Technician** | Org / assigned groups | Initiate sessions, file transfer, view devices in scope |
| **Viewer** | Org / assigned groups | Read-only dashboard, device list, logs (no connect) |
| **Auditor** | Org | Read-only access to audit logs and session metadata (no live connect) |
| **End User Consent Holder** | Device | Approve/deny attended sessions; optional notification on unattended |
| **MSP Admin** | MSP parent + child orgs | Create child orgs, cross-tenant reporting (policy-limited) |
| **Platform Super Admin** | Global | Internal ops only; all actions logged and dual-controlled |

### 4.3 Permission Dimensions

Access decisions MUST evaluate:

1. **Organization membership**
2. **Group / device tag assignment**
3. **Session type** (attended vs unattended)
4. **Time-bound elevation** (optional JIT access)
5. **Network context** (IP allowlist, geo policy — enterprise)
6. **Device policy** (unattended allowed, file transfer allowed, etc.)

### 4.4 Multi-User Organizations

- Hierarchical **organizations** with optional **child orgs** (MSP model).
- **Groups** (static and dynamic via tags) for device and user assignment.
- **Invitation workflow** with email verification and SSO domain claim.
- **Seat licensing** and role quotas per subscription tier.

---

## 5. Core Features

### 5.1 Feature Map

| Area | Feature | Priority | Notes |
|------|---------|----------|-------|
| Agent | Persistent agent install & auto-update | P0 | Signed binaries, tamper detection |
| Agent | Unattended access mode | P0 | Policy + optional host consent artifact |
| Presence | Online/offline & last seen | P0 | Heartbeat + graceful offline |
| Remote | Desktop streaming | P0 | Adaptive bitrate, multi-monitor |
| Remote | Keyboard & mouse control | P0 | Modifier keys, lock states |
| Remote | Clipboard sync (policy-gated) | P1 | Directional allow/deny |
| Dashboard | Device inventory & search | P0 | Filters, tags, bulk actions |
| Files | Bidirectional file transfer | P0 | Size limits, malware scan hook |
| Audit | Session logs & admin audit trail | P0 | Immutable storage option |
| Org | Multi-user RBAC | P0 | See Section 4 |
| Session | Attended connect (user present) | P0 | Consent UI on host |
| Session | Session recording (optional) | P2 | Enterprise policy |
| Notify | Webhooks & email alerts | P1 | Device offline, session start |
| Deploy | Mass agent deployment | P1 | MSI/PKG, GPO, Intune, script |

---

### 5.2 Persistent Device Agents

**Description:** Lightweight agents install on endpoints and maintain long-lived secure registration with the control plane.

**Requirements:**

| ID | Requirement |
|----|-------------|
| AG-01 | Agent SHALL start at boot (configurable) and reconnect with exponential backoff. |
| AG-02 | Agent SHALL authenticate using per-device credentials rotatable by admin. |
| AG-03 | Agent SHALL support silent install parameters for enterprise deployment. |
| AG-04 | Agent SHALL report: hostname, OS version, agent version, logged-in user(s), IP addresses, tags. |
| AG-05 | Agent SHALL support configurable update channel (stable/beta) with staged rollout. |
| AG-06 | Agent SHALL expose local uninstall protection optional via org policy (admin password / cert). |
| AG-07 | Agent resource usage: idle CPU &lt; 1% average on reference hardware; RAM &lt; 150 MB typical. |

**Acceptance:** Device appears in dashboard within 60s of successful install; survives reboot and network change without manual re-pairing.

---

### 5.3 Unattended Remote Access

**Description:** Authorized technicians connect without end-user interaction when organizational and device policy permit.

**Requirements:**

| ID | Requirement |
|----|-------------|
| UA-01 | Unattended mode SHALL be disabled by default; enabled only via org or device policy. |
| UA-02 | Policy SHALL define: allowed roles, hours of access, require MFA for session start, file transfer allowed. |
| UA-03 | Optional **host consent artifact** (one-time or periodic re-consent) for regulated environments. |
| UA-04 | Host SHALL display optional system tray indicator when unattended is enabled. |
| UA-05 | All unattended sessions SHALL be labeled distinctly in logs and live session UI. |
| UA-06 | Emergency kill switch: org admin can disable all unattended connects globally. |

---

### 5.4 Online / Offline Tracking

**Description:** Authoritative presence for fleet visibility and automation.

**Requirements:**

| ID | Requirement |
|----|-------------|
| PR-01 | Agent SHALL send heartbeat every 30s (configurable 15–120s). |
| PR-02 | Device marked **offline** after 3 missed heartbeats (configurable). |
| PR-03 | Dashboard SHALL show: status, last seen timestamp, last known IP, active session indicator. |
| PR-04 | Historical uptime reports (7/30/90 days) for enterprise tier. |
| PR-05 | Webhooks for transitions: online→offline, offline→online, agent version change. |

---

### 5.5 Remote Desktop Streaming

**Description:** Real-time capture, encode, transmit, decode, and render remote desktop in browser (or native viewer).

**Requirements:**

| ID | Requirement |
|----|-------------|
| RD-01 | Support resolutions up to 4K per display; multi-monitor selection and switch. |
| RD-02 | Adaptive encoding (H.264/AV1 or equivalent) based on bandwidth and CPU. |
| RD-03 | Target interactive latency: P50 &lt; 50ms LAN, P50 &lt; 150ms intercontinental (best effort). |
| RD-04 | Bandwidth throttle configurable per session and org policy. |
| RD-05 | Blank screen / privacy mode for attended sessions (user-initiated). |
| RD-06 | Session quality indicator (RTT, FPS, packet loss) visible to technician. |
| RD-07 | Graceful degradation: reduce color depth/FPS before disconnect. |
| RD-08 | Lock screen and login screen visibility per OS policy and legal constraints. |

---

### 5.6 Keyboard and Mouse Control

**Requirements:**

| ID | Requirement |
|----|-------------|
| IO-01 | Full keyboard mapping including modifiers, function keys, and international layouts. |
| IO-02 | Relative and absolute mouse modes where applicable (games/CAD out of scope for MVP). |
| IO-03 | Local input lock option (technician-only control) policy-gated. |
| IO-04 | Ctrl+Alt+Del and equivalent secure attention sequences per OS. |
| IO-05 | Input events SHALL NOT be logged in session content logs (metadata only). |

---

### 5.7 Device Management Dashboard

**Requirements:**

| ID | Requirement |
|----|-------------|
| DM-01 | Searchable device list with filters: status, OS, tag, group, version, last user. |
| DM-02 | Device detail page: hardware summary, network, agent logs (tail), assigned policies, session history. |
| DM-03 | Bulk actions: assign tags, move groups, trigger agent update, revoke device. |
| DM-04 | Custom fields and tags (enterprise). |
| DM-05 | Map view optional (geo from IP; accuracy disclaimer). |
| DM-06 | Export device inventory CSV/JSON API. |

---

### 5.8 File Transfer

**Requirements:**

| ID | Requirement |
|----|-------------|
| FT-01 | Bidirectional transfer during active session. |
| FT-02 | Configurable max file size per org (default 5 GB; enterprise higher). |
| FT-03 | Transfer progress, pause/resume, cancel. |
| FT-04 | Audit log entry: filename, hash (SHA-256), size, direction, user, device, timestamp. |
| FT-05 | Integration point for async malware scanning before delivery to technician workstation. |
| FT-06 | Block list for extensions and paths (e.g., system directories) via policy. |

---

### 5.9 Session Logs and Audit

**Requirements:**

| ID | Requirement |
|----|-------------|
| LG-01 | **Session metadata log:** start/end, initiator, device, type (attended/unattended), IP, MFA used, bytes transferred. |
| LG-02 | **Administrative audit log:** CRUD on users, policies, devices, org settings. |
| LG-03 | Logs SHALL be queryable by time range, actor, device, event type. |
| LG-04 | Retention defaults: 90 days (standard), 1–7 years (enterprise configurable). |
| LG-05 | Export formats: JSON Lines, CSV; SIEM integration via syslog/HTTPS (enterprise). |
| LG-06 | Optional **session recording** (video) with explicit banner and consent policy. |
| LG-07 | Tamper-evident storage option (append-only/WORM bucket) for regulated customers. |

---

### 5.10 Session Lifecycle (Attended & Unattended)

| Step | Behavior |
|------|----------|
| Request | Technician selects device; policy pre-check |
| Authorize | MFA step-up if required; JIT elevation if configured |
| Signal | Control plane negotiates peer/relay path |
| Connect | Agent accepts; host UI shows banner (attended) |
| Active | Stream, input, file transfer per policy |
| End | User/technician disconnect; logs finalized |
| Fail | Timeout, policy deny, network failure — structured error codes |

---

### 5.11 Integrations (MVP+)

| Integration | Purpose |
|-------------|---------|
| **SSO (SAML 2.0 / OIDC)** | Enterprise authentication |
| **SCIM 2.0** | User/group provisioning |
| **Microsoft Entra ID / Okta** | Reference IdP implementations |
| **Webhooks** | Automation |
| **REST API** | Device and session automation |
| **Intune / GPO** | Agent deployment |

---

## 6. Non-Functional Requirements

### 6.1 Availability and Reliability

| ID | Requirement |
|----|-------------|
| NFR-A1 | Control plane monthly uptime ≥ 99.95% (excluding announced maintenance). |
| NFR-A2 | Maintenance windows announced ≥ 72h; critical security patches excepted. |
| NFR-A3 | Session establishment SHALL survive single relay node failure via retry on alternate node. |
| NFR-A4 | RPO for control plane data ≤ 15 minutes; RTO ≤ 4 hours (enterprise may contract stricter). |

### 6.2 Performance

| ID | Requirement |
|----|-------------|
| NFR-P1 | API P95 latency &lt; 300ms for read operations under nominal load. |
| NFR-P2 | Dashboard initial load &lt; 3s on 10 Mbps connection. |
| NFR-P3 | Support ≥ 50 concurrent sessions per technician browser tab without degradation of UI responsiveness (streaming may reduce quality). |
| NFR-P4 | Agent heartbeat processing at scale (see Section 7). |

### 6.3 Usability and Accessibility

| ID | Requirement |
|----|-------------|
| NFR-U1 | Console WCAG 2.1 Level AA for core flows. |
| NFR-U2 | Localized UI: English (MVP); French, German, Spanish (Phase 2). |
| NFR-U3 | Consistent error messages with remediation hints and support correlation IDs. |

### 6.4 Maintainability and Operability

| ID | Requirement |
|----|-------------|
| NFR-O1 | Full observability: metrics, distributed tracing, structured logs. |
| NFR-O2 | Feature flags for gradual rollout. |
| NFR-O3 | Agent and server version compatibility matrix published; N-1 support minimum. |
| NFR-O4 | Runbooks for incident classes: control plane outage, relay saturation, auth failure spike. |

### 6.5 Compatibility

| ID | Requirement |
|----|-------------|
| NFR-C1 | Browser support: last two major versions of Chrome, Edge, Firefox, Safari. |
| NFR-C2 | API versioning via URL prefix (`/v1/`) with 12-month deprecation notice. |

### 6.6 Legal and Compliance Posture

| ID | Requirement |
|----|-------------|
| NFR-L1 | GDPR-ready: data export, deletion, DPA, subprocessors list. |
| NFR-L2 | Configurable session banner for regulated industries (HIPAA-style workflows). |
| NFR-L3 | Data processing region selection (EU, US, APAC) for enterprise. |

---

## 7. Scalability Requirements

### 7.1 Scale Targets (36-Month Horizon)

| Dimension | Target |
|-----------|--------|
| Registered devices per region | 5,000,000 |
| Concurrent active sessions per region | 100,000 |
| Organizations | 500,000 |
| Heartbeats per second (per region) | 150,000+ (with aggregation) |
| API requests per second (peak) | 50,000 |
| Audit log ingest | 1M events/minute |

### 7.2 Horizontal Scaling Principles

- **Stateless control plane** services behind load balancers; session state in distributed cache.
- **Sharding** device registry by `org_id` and optionally geographic shard.
- **Dedicated signaling pools** per region; cross-region only when policy allows.
- **Relay fleet** auto-scales on CPU, bandwidth, and connection count.
- **Event pipeline** (Kafka/Pulsar or equivalent) for heartbeats, audit, and analytics decoupling.

### 7.3 Multi-Region Strategy

| Requirement | Detail |
|-------------|--------|
| Active-active regions | EU-West, US-East, AP-Southeast minimum |
| Data residency | Device metadata and logs stored in selected region; no cross-border without config |
| Global DNS | Geo-routed console and API; agent pinned to provisioned region |
| DR | Cross-region backup for control data; relay state ephemeral |

### 7.4 Hot Path Optimization

- Heartbeat **aggregation** at edge gateway where possible.
- **WebSocket** connection multiplexing for agent control channel.
- **UDP-based media** (WebRTC or custom) with TCP/TURN fallback.
- **CDN** for static console assets only; no caching of authenticated API responses.

### 7.5 Tenant Noisy Neighbor Controls

- Per-org rate limits on API, session starts, and file transfer bandwidth.
- Fair queuing on relay resources.
- Circuit breaker for orgs exhibiting abuse patterns.

---

## 8. Security Requirements

Security is a **primary product feature**, not an afterthought. All designs assume hostile networks and malicious insiders.

### 8.1 Identity and Access

| ID | Requirement |
|----|-------------|
| SEC-I1 | MFA required for all technician roles (TOTP/WebAuthn); enforceable org-wide. |
| SEC-I2 | SSO via SAML 2.0 and OIDC; support enforced SSO for enterprise. |
| SEC-I3 | Session tokens: short-lived access tokens; refresh rotation; binding to device fingerprint optional. |
| SEC-I4 | Step-up authentication before unattended session or file transfer if policy requires. |
| SEC-I5 | Break-glass super admin behind hardware MFA and dual approval. |

### 8.2 Cryptography

| ID | Requirement |
|----|-------------|
| SEC-C1 | TLS 1.3 for all HTTP and WebSocket control traffic. |
| SEC-C2 | End-to-end encryption for desktop stream and file transfer (DTLS-SRTP or equivalent E2EE scheme); relay nodes cannot decrypt media when E2EE enabled. |
| SEC-C3 | Per-device asymmetric keys; certificate pinning for agent-to-control-plane. |
| SEC-C4 | Secrets stored in HSM-backed KMS; no plaintext secrets in logs. |
| SEC-C5 | Cryptographic agility: algorithm negotiation with deprecation schedule. |

### 8.3 Agent and Endpoint Security

| ID | Requirement |
|----|-------------|
| SEC-A1 | Code-signed agents; signature verification on install and update. |
| SEC-A2 | Tamper detection and reporting (debugged agent, modified binary). |
| SEC-A3 | Agent runs with least privilege; elevation only for input injection and capture via OS APIs. |
| SEC-A4 | Remote kill / revoke device credentials instantly from dashboard. |

### 8.4 Network and Infrastructure

| ID | Requirement |
|----|-------------|
| SEC-N1 | Default deny network policies between services; mTLS service mesh. |
| SEC-N2 | WAF and DDoS protection on public endpoints. |
| SEC-N3 | IP allowlisting for console access (enterprise). |
| SEC-N4 | Private Link / VPN attachment option for enterprise control plane access. |

### 8.5 Application Security

| ID | Requirement |
|----|-------------|
| SEC-P1 | OWASP ASVS Level 2 minimum for console and API. |
| SEC-P2 | Annual third-party penetration test; critical findings remediated per SLA. |
| SEC-P3 | Dependency scanning and SBOM for agent and server artifacts. |
| SEC-P4 | CSP, HSTS, and secure cookie flags on console. |

### 8.6 Tenant Isolation

| ID | Requirement |
|----|-------------|
| SEC-T1 | Logical isolation: every query scoped by `org_id` from signed token context. |
| SEC-T2 | Encryption at rest per-tenant keys (enterprise) or per-region keys (standard). |
| SEC-T3 | No cross-tenant device IDs in APIs; UUIDs non-enumerable. |
| SEC-T4 | Penetration tests include cross-tenant escalation scenarios. |

### 8.7 Privacy and Data Handling

| ID | Requirement |
|----|-------------|
| SEC-D1 | Minimize PII in logs; configurable redaction. |
| SEC-D2 | Right to erasure workflow for device and user data. |
| SEC-D3 | Optional on-prem storage for session recordings. |

### 8.8 Compliance Roadmap

| Framework | Target |
|-----------|--------|
| SOC 2 Type II | Within 12 months of GA |
| ISO 27001 | Enterprise sales enabler — 18 months |
| HIPAA BAA | Available for healthcare tier with recording controls |
| FedRAMP | Long-term; dedicated partition |

---

## 9. System Modules

The platform decomposes into the following **logical modules**. Each module owns specific APIs, data stores, and operational SLOs.

### 9.1 Module Overview

| Module | Responsibility | Key Dependencies |
|--------|----------------|------------------|
| **M1 — Web Console** | SPA for operators; session viewer | M2, M3, M5 |
| **M2 — Identity & Access** | AuthN, AuthZ, MFA, SSO, SCIM | M10 |
| **M3 — Organization & Policy** | Orgs, groups, RBAC, device policies | M2, M4 |
| **M4 — Device Registry** | Device CRUD, tags, presence state | M6, M10 |
| **M5 — Session Orchestrator** | Session lifecycle, policy checks, signaling tokens | M2, M3, M4, M7 |
| **M6 — Agent Gateway** | Agent connections, heartbeats, commands | M4, M7, M10 |
| **M7 — Media & Relay** | WebRTC/UDP relay, TURN, bitrate adaptation | M5 |
| **M8 — File Transfer Service** | Chunked transfer, scan hooks, audit | M5, M9 |
| **M9 — Audit & Logging** | Immutable logs, export, SIEM | M10 |
| **M10 — Platform Services** | Billing, notifications, feature flags, KMS | — |
| **M11 — Agent (Endpoint)** | Capture, encode, input, updates, local policy | M6, M7 |
| **M12 — Deployment & Update** | Agent packages, auto-update, staged rollout | M6, M10 |
| **M13 — Analytics & Reporting** | Uptime, usage, capacity dashboards | M4, M9 |
| **M14 — Public API** | REST/GraphQL for automation | M2–M5, M9 |

### 9.2 Module Interaction (Session Start)

```
Technician → M1 Console
    → M2 Auth (MFA)
    → M5 Session Orchestrator
        → M3 Policy check
        → M4 Device state verify (online)
        → M6 Agent Gateway (session offer)
        → M7 Media path setup
    → M1 renders stream
    → M9 logs session start
```

### 9.3 Data Ownership

| Module | Primary Data |
|--------|--------------|
| M4 | Device records, presence, tags |
| M5 | Active session state (ephemeral), session history index |
| M9 | Audit events, file transfer records |
| M10 | Subscriptions, invoices, org limits |
| M7 | No persistent user content (ephemeral relay metrics only) |

### 9.4 Agent Internal Components

| Component | Function |
|-----------|----------|
| **Connection Manager** | TLS/WebSocket to M6, reconnect logic |
| **Capture Pipeline** | Screen capture, GPU encoding where available |
| **Input Injector** | OS-specific keyboard/mouse |
| **Policy Enforcer** | Local cache of unattended and feature flags |
| **Update Client** | Pull from M12, verify signatures |
| **Host UI** | Consent banners, tray icon, session indicator |

---

## 10. Enterprise Requirements

### 10.1 Licensing and Packaging

| Tier | Devices | Features |
|------|---------|----------|
| **Starter** | Up to 25 | Attended only, 30-day logs, community support |
| **Professional** | Up to 500 | Unattended, file transfer, 90-day logs, SSO add-on |
| **Enterprise** | Unlimited* | SCIM, IP allowlist, custom retention, dedicated relay, BAA |
| **MSP** | Multi-tenant | Child orgs, consolidated billing, white-label console |

*Fair use and technical limits per contract.

### 10.2 Contractual and Support

| Requirement | Enterprise Standard |
|-------------|---------------------|
| SLA | 99.95% with service credits |
| Support | 24/7 Sev-1 for production down |
| Account team | Named TAM for &gt; 5,000 seats |
| Onboarding | Deployment workshop and architecture review |

### 10.3 Advanced Security Features

- **Customer-managed encryption keys (CMEK)** for data at rest.
- **SAML forced** + disable local passwords.
- **Session approval workflow** — second approver for unattended access.
- **Privileged access management (PAM) integration** — CyberArk, BeyondTrust (Phase 2).
- **Custom session banners** and watermarking on stream (Phase 2).

### 10.4 Deployment Flexibility

| Option | Description |
|--------|-------------|
| **SaaS multi-tenant** | Default |
| **Single-tenant SaaS** | Isolated DB and keys |
| **Customer-managed relay** | Traffic stays on customer network edge |
| **Air-gapped update mirror** | Offline agent updates |

### 10.5 Reporting and Governance

- Scheduled compliance reports (who accessed unattended devices).
- Data residency certificate and subprocessors DPA.
- **Legal hold** on audit logs.
- Admin **impersonation** disabled by default; read-only support access with customer approval.

### 10.6 Rate Limits and Quotas (Configurable)

| Quota | Default Enterprise |
|-------|-------------------|
| Concurrent sessions per org | 500 (raiseable) |
| API requests/min | 10,000 |
| File transfer/day | 1 TB aggregate |
| Webhook endpoints | 50 |

---

## 11. Risks and Mitigations

| ID | Risk | Impact | Likelihood | Mitigation |
|----|------|--------|------------|------------|
| R1 | **NAT/firewall traversal failure** | Failed sessions | High | TURN infrastructure, customer relay, clear network prerequisites doc |
| R2 | **Credential theft on endpoint** | Unauthorized access | Medium | Device cert rotation, MFA for sessions, E2EE, anomaly detection |
| R3 | **Insider abuse of unattended access** | Data breach | Medium | Audit logs, JIT access, approval workflows, behavior analytics |
| R4 | **Relay cost at scale** | Margin erosion | High | UDP-first, regional relays, bandwidth policies, peer connect when possible |
| R5 | **Regulatory restriction on covert access** | Legal exposure | Medium | Consent artifacts, banners, geo policy packs, legal review per market |
| R6 | **Agent AV false positives** | Deployment friction | High | Code signing, reputation program, IT-whitelisting guides |
| R7 | **WebRTC browser limitations** | Poor UX | Medium | Native viewer fallback, codec negotiation |
| R8 | **Multi-tenant data leak** | Critical | Low | Mandatory tenant scoping tests, chaos drills, bug bounty |
| R9 | **DDoS on signaling** | Outage | Medium | Rate limits, CAPTCHA on auth, anycast, autoscale |
| R10 | **Dependency on third-party IdP** | Login outage | Medium | Cached session grace, status page, multiple IdP support |

---

## 12. Future Expansion Plans

### 12.1 Product Roadmap (Indicative)

| Horizon | Capabilities |
|---------|--------------|
| **H1 (0–6 mo post-MVP)** | Clipboard policies, wake-on-LAN, chat sidebar, Android viewer |
| **H2 (6–12 mo)** | Linux server headless, scripted automation (runbook), API webhooks GA |
| **H3 (12–18 mo)** | Mobile agents, AR assistance overlay, AI session summary |
| **H4 (18–24 mo)** | On-prem control plane GA, white-label MSP portal, marketplace integrations |

### 12.2 Technical Evolution

- **AV1** and hardware encode paths for bandwidth reduction.
- **Peer-to-peer first** signaling to minimize relay costs.
- **Zero-trust network integration** (ZTNA vendors) for agent-less browser extension path (evaluation).
- **eBPF-based** diagnostics on Linux agents.

### 12.3 Market Expansion

- Vertical packs: healthcare (HIPAA), finance (enhanced logging), education (lab device pools).
- Government partition with FedRAMP Moderate.
- OEM partnerships with hardware vendors for preinstalled agent.

### 12.4 Ecosystem

- Plugin SDK for post-session ticketing (ServiceNow, Jira).
- Community relay operators (RustDesk-inspired) with trust model — business decision required.
- Open-core agent protocol documentation for interoperability (optional).

---

## 13. Appendices

### 13.1 Glossary

| Term | Definition |
|------|------------|
| **Agent** | Persistent software on managed endpoint |
| **Attended session** | End user present; explicit consent typically required |
| **Control plane** | APIs and services for auth, registry, orchestration — not media path |
| **E2EE** | End-to-end encryption; media opaque to infrastructure |
| **Relay** | Infrastructure forwarding encrypted packets when P2P fails |
| **Unattended session** | Connect without interactive user approval on host |

### 13.2 Reference User Stories (Sample)

1. **As a Technician**, I want to filter offline devices in my group so that I can prioritize callbacks.
2. **As an Org Admin**, I want to disable file transfer for contractors so that data exfiltration risk is reduced.
3. **As an Auditor**, I want to export all unattended sessions last quarter so that compliance can review access.
4. **As an End User**, I want a visible indicator when someone is connected so that I maintain trust in the tool.

### 13.3 Open Questions

| # | Question | Owner | Due |
|---|----------|-------|-----|
| OQ-1 | Default E2EE on vs opt-in for performance troubleshooting? | Security / Product | Pre-GA |
| OQ-2 | Open-source agent component strategy? | Leadership | Q3 |
| OQ-3 | Minimum viable markets for host lock screen capture? | Legal | Pre-GA |
| OQ-4 | Pricing model: per device vs per technician seat vs hybrid? | Product / Finance | Beta |

### 13.4 Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product | | | |
| Engineering | | | |
| Security | | | |
| Legal | | | |

---

*End of Document*
