# Global Election & Political Stability Command Center

A cinematic intelligence-style dashboard visualizing global elections,
protests, and political instability in real-time using a 3D globe.

## Quick Start

```bash
# Backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

Open http://localhost:3000

## Core Features

- 3D rotating WebGL globe with clickable risk hotspots
- Political Stability Index (PSI) with weighted components
- Election proximity tracking (60-day window)
- Protest heat mapping
- Risk leaderboard (top 10 unstable)
- Country detail panel with animated gauge
- Breaking news ticker
- Real-time WebSocket updates (mock data every 30s)

## Stack (MVP)

Frontend: Next.js, Three.js, TailwindCSS, Framer Motion
Backend: FastAPI, SQLite, WebSockets

## API Endpoints

- `GET /countries` - All countries with PSI
- `GET /country/{id}` - Country detail
- `GET /leaderboard` - Top 10 unstable
- `GET /elections/upcoming` - Elections in 60 days
- `GET /timeline?days=30` - Historical PSI
- `POST /alerts` - Create PSI threshold alert
- `WS /live` - Real-time PSI stream

## Modes

- Globe View ✓
- Risk Leaderboard ✓
- Alert System ✓
- Timeline Replay (Phase 2)

This project aims to feel like a Bloomberg Terminal meets CIA command center.