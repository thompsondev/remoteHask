# remoteHask

Production-grade remote desktop and device management platform.

## Monorepo

| Path | Description |
|------|-------------|
| [apps/frontend](./apps/frontend) | Next.js operator console (HeroUI + shadcn/ui) |
| [apps/backend](./apps/backend) | NestJS REST API |
| [apps/desktop-agent](./apps/desktop-agent) | Rust desktop agent |
| [packages/shared-types](./packages/shared-types) | Shared TypeScript types and API contracts |
| [packages/shared-utils](./packages/shared-utils) | Shared utilities |
| [packages/shared-config](./packages/shared-config) | ESLint, Prettier, TypeScript configs |

## Documentation

- [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md)
- [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
- [API_SPECIFICATION.md](./API_SPECIFICATION.md)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- [CODING_STANDARDS.md](./CODING_STANDARDS.md)

## Prerequisites

- Node.js ≥ 20.11
- pnpm ≥ 9.15
- Rust ≥ 1.78 (agent only)

## Setup

```bash
pnpm install
pnpm build
```

## Development

```bash
# All apps (Turbo)
pnpm dev

# Individual apps
pnpm --filter @remotehask/backend dev
pnpm --filter @remotehask/frontend dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000/api/v1 |
| Swagger | http://localhost:4000/docs |

Copy environment files:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages and apps |
| `pnpm dev` | Start dev servers |
| `pnpm lint` | ESLint across workspace |
| `pnpm typecheck` | TypeScript check |
| `pnpm format` | Prettier write |

## Git hooks

Husky runs `lint-staged` on commit (ESLint + Prettier on staged files).

## License

UNLICENSED — private
