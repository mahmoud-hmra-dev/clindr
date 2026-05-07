# Clindr — Telemedicine Platform

## Project Overview
Clindr (Clindoctor) is a multi-service telemedicine platform connecting doctors and patients for video consultations, appointment scheduling, and medical record management.

## Services Architecture
| Service | Tech | Port | Directory |
|---------|------|------|-----------|
| Main API | Laravel 12 / PHP 8.2 | 8000 | `/backend` |
| Frontend SPA | Angular 19 | 4200 | `/frontend` |
| Payment API | Laravel 10 / PHP 8.1 | 8001 | `/payment` |
| Call/WebRTC | Node.js 22 + Socket.io | 8082 | `/call` |
| WebSocket relay | Node.js `ws` | 6001 | `backend/websocket-server.cjs` |

## Quick Start
```bash
docker-compose up -d          # start all services
docker-compose logs -f        # follow all logs
docker-compose exec backend php artisan migrate
docker-compose exec backend php artisan db:seed
```

## User Roles
- **admin** — full platform management
- **doctor** — manage appointments, availability, patient records
- **patient** — book appointments, view medical records, pay invoices

## Agent Team
Use the specialized agents in `.claude/agents/` for domain-specific work:
- **frontend-agent** — Angular 19 UI, components, services, routing
- **backend-agent** — Laravel 12 API, models, RBAC, queues
- **tester-agent** — PHPUnit, Karma/Jasmine, Mocha test writing
- **security-agent** — Security audits, OWASP, vulnerability fixes
- **devops-agent** — Docker, CI/CD, Nginx, deployment
- **payment-agent** — Areeba gateway, invoices, wallet system
- **realtime-agent** — WebRTC calls, Socket.io, WebSocket chat

## Key Files
- `docker-compose.yml` — service orchestration
- `backend/routes/api.php` — all API routes
- `frontend/src/environments/` — API URLs config
- `docs/clindoctor-spec.md` — full feature specification
- `.env.example` — environment variable template

## Code Standards
- **PHP**: Laravel Pint formatting (`./vendor/bin/pint`)
- **TypeScript**: strict mode, no `any`
- **Angular**: standalone components, OnPush where possible
- **Tests**: always cover happy path + 403/422/404 error cases
- **Security**: validate all input, RBAC on every endpoint, never log PHI
