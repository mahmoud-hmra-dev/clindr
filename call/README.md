# Clindoctor Call

Clindoctor Call delivers secure, low‑latency video consultations between patients and doctors. It is built on WebRTC with end‑to‑end encryption, browser and mobile support, and a workflow tailored for telehealth visits (room links, host protection, waiting rooms, chat, screen share, whiteboard, file exchange, and visit summaries).

## Key Capabilities
- Browser‑based calls with no installs; works on desktop and mobile.
- Host/doctor controls: waiting room, room/password protection, mute/eject, lock/unlock, screen share controls.
- Patient controls: audio/video toggles, screen share (when allowed), chat, reactions, file and document sharing.
- Secure identity: OIDC support, JWT session protection, optional presenter whitelists.
- Quality: up to 8K/60fps where bandwidth allows, adaptive settings, device selection for mic/camera/speakers.
- Collaboration: shared whiteboard, shared media, snapshots, captions, ChatGPT assist, meeting stats.
- Branding: configurable titles/meta, icons, themes, and “powered by” text for Clindoctor Call.
- Integrations: REST API, Slack/Mattermost notifications, webhooks, SMTP email invites, Sentry error reporting.

## Quick Start (local)
1) Copy `.env.template` to `.env` and set required keys (host login, JWT secret, SMTP/webhook options, etc.).  
2) Install dependencies: `npm install`.  
3) Run in dev: `npm run start-dev` (nodemon) or `npm start`.  
4) Open `http://localhost:3000/newcall` to start a visit; share the room link with the patient.  

## Docker
- Build and run locally (from repo root):  
  `docker build -t clindoctorcall/p2p:local .`  
  `docker run -d -p 3000:3000 -v ./.env:/src/.env:ro --name clindoctorcall clindoctorcall/p2p:local`
- With compose (top-level `docker-compose.yml`): `docker-compose up --build mirotalk`

## API
- REST endpoints and OpenAPI spec live under `app/api`. See `app/api/README.md` and `app/api/swagger.yaml` for details on creating, joining, and managing rooms in Clindoctor Call.

## Theming and Branding
- Update `app/src/config.template.js` and `public/js/brand.js` to set titles, meta tags, icons, footer text, and widget strings to your clinic’s wording.  
- Session branding is cached in `sessionStorage` under `brandDataClindoctorCall` and fetched via `/brand` when enabled.

## Telehealth Notes
- Use host credentials to control room entry for doctor-led sessions.  
- Enable password protection or waiting-room style flows with the room security settings.  
- Use the whiteboard and file share for treatment plans, and the snapshot/recording tools for follow-up notes where allowed by policy.  
- Configure SMTP to send patient invitations with time-bound room links.  

## License
Clindoctor Call derives from an AGPLv3 codebase. Respect the license requirements when modifying and deploying. See `LICENSE` for details.
