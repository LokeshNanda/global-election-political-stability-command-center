"""FastAPI application entry point."""
import os
from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import get_db, engine, Base
from app.models import (
    Country,
    Election as ElectionModel,
    ProtestEvent as ProtestEventModel,
    SentimentScore as SentimentScoreModel,
    MarketIndicator as MarketIndicatorModel,
    PSIScore,
    Alert,
)
from app.schemas import (
    CountryWithPSI,
    CountryDetail,
    LeaderboardEntry,
    TimelineEntry,
    AlertCreate,
    AlertResponse,
    Election,
    ProtestEvent as ProtestEventSchema,
    SentimentScore as SentimentScoreSchema,
    MarketIndicator as MarketIndicatorSchema,
)
from app.services.mock_data import run_mock_cycle, seed_countries


# Background task for mock data updates (every 30 seconds)
async def mock_data_updater():
    from app.database import SessionLocal
    while True:
        await asyncio.sleep(30)
        db = SessionLocal()
        try:
            run_mock_cycle(db)
        except Exception as e:
            print(f"Mock data update error: {e}")
        finally:
            db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB and start background tasks."""
    from app.database import SessionLocal
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Country).count() == 0:
            seed_countries(db)
            run_mock_cycle(db)
    finally:
        db.close()

    # Start mock data updater
    task = asyncio.create_task(mock_data_updater())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Global Election & Political Stability Command Center API",
    description="Bloomberg Terminal meets CIA command center - real-time political intelligence",
    version="1.0.0",
    lifespan=lifespan,
)

_cors_origins = os.getenv(
    "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# REST API Endpoints - API_SPEC.md

@app.get("/countries", response_model=list[CountryWithPSI])
def get_countries(db: Session = Depends(get_db)):
    """Returns all countries with latest PSI score."""
    countries = db.query(Country).all()
    result = []
    for c in countries:
        psi = db.query(PSIScore).filter(PSIScore.country_id == c.id).order_by(PSIScore.updated_at.desc()).first()
        result.append(CountryWithPSI(
            id=c.id,
            name=c.name,
            iso_code=c.iso_code,
            region=c.region,
            latitude=c.latitude,
            longitude=c.longitude,
            psi_score=psi.psi_score if psi else 0.0,
            risk_level=psi.risk_level if psi else "Stable",
        ))
    return result


@app.get("/country/{country_id}", response_model=CountryDetail)
def get_country(country_id: int, db: Session = Depends(get_db)):
    """Returns detailed breakdown: PSI components, election, protest, sentiment, market."""
    country = db.query(Country).filter(Country.id == country_id).first()
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")

    psi = db.query(PSIScore).filter(PSIScore.country_id == country_id).order_by(PSIScore.updated_at.desc()).first()
    elections = db.query(ElectionModel).filter(ElectionModel.country_id == country_id).order_by(ElectionModel.days_remaining).limit(5).all()
    protests = db.query(ProtestEventModel).filter(ProtestEventModel.country_id == country_id).order_by(ProtestEventModel.date.desc()).limit(10).all()
    sentiment = db.query(SentimentScoreModel).filter(SentimentScoreModel.country_id == country_id).order_by(SentimentScoreModel.timestamp.desc()).first()
    market = db.query(MarketIndicatorModel).filter(MarketIndicatorModel.country_id == country_id).order_by(MarketIndicatorModel.timestamp.desc()).first()

    return CountryDetail(
        id=country.id,
        name=country.name,
        iso_code=country.iso_code,
        region=country.region,
        latitude=country.latitude,
        longitude=country.longitude,
        psi_score=psi.psi_score if psi else 0.0,
        risk_level=psi.risk_level if psi else "Stable",
        escalation_probability=psi.escalation_probability if psi else 0.0,
        elections=[Election.model_validate(e) for e in elections],
        protests=[ProtestEventSchema.model_validate(p) for p in protests],
        sentiment=SentimentScoreSchema.model_validate(sentiment) if sentiment else None,
        market_indicator=MarketIndicatorSchema.model_validate(market) if market else None,
    )


@app.get("/elections/upcoming")
def get_upcoming_elections(db: Session = Depends(get_db)):
    """Returns elections in the next 60 days."""
    from datetime import datetime, timedelta
    cutoff = datetime.utcnow() + timedelta(days=60)
    elections = (
        db.query(ElectionModel, Country)
        .join(Country, ElectionModel.country_id == Country.id)
        .filter(ElectionModel.date <= cutoff, ElectionModel.days_remaining > 0)
        .order_by(ElectionModel.days_remaining)
        .limit(15)
        .all()
    )
    psi_scores = db.query(PSIScore).filter(PSIScore.country_id.in_([c.id for _, c in elections])).all()
    psi_map = {p.country_id: p for p in psi_scores}
    return [
        {
            "country_id": c.id,
            "country_name": c.name,
            "iso_code": c.iso_code,
            "days_remaining": e.days_remaining,
            "type": e.type,
            "psi_score": (psi_map[c.id].psi_score if c.id in psi_map else 0.0),
            "risk_level": (psi_map[c.id].risk_level if c.id in psi_map else "Stable"),
        }
        for e, c in elections
    ]


@app.get("/leaderboard", response_model=list[LeaderboardEntry])
def get_leaderboard(db: Session = Depends(get_db)):
    """Returns top 10 unstable countries."""
    psi_scores = (
        db.query(PSIScore, Country)
        .join(Country, PSIScore.country_id == Country.id)
        .order_by(PSIScore.psi_score.desc())
        .limit(10)
        .all()
    )
    return [
        LeaderboardEntry(
            rank=i + 1,
            country_id=c.id,
            country_name=c.name,
            iso_code=c.iso_code,
            psi_score=psi.psi_score,
            risk_level=psi.risk_level,
        )
        for i, (psi, c) in enumerate(psi_scores)
    ]


@app.get("/timeline", response_model=list[TimelineEntry])
def get_timeline(days: int = Query(30, ge=1, le=90), db: Session = Depends(get_db)):
    """Returns historical PSI data (mock: returns current snapshot for MVP)."""
    countries = db.query(Country).all()
    psi_scores = db.query(PSIScore).filter(PSIScore.country_id.in_([c.id for c in countries])).all()
    psi_map = {p.country_id: p for p in psi_scores}
    from datetime import datetime
    date_str = datetime.utcnow().strftime("%Y-%m-%d")
    return [
        TimelineEntry(
            date=date_str,
            country_id=c.id,
            psi_score=psi_map.get(c.id).psi_score if c.id in psi_map else 0.0,
            risk_level=psi_map.get(c.id).risk_level if c.id in psi_map else "Stable",
        )
        for c in countries
    ]


@app.get("/alerts", response_model=list[AlertResponse])
def list_alerts(db: Session = Depends(get_db)):
    """List all active alerts."""
    return db.query(Alert).order_by(Alert.created_at.desc()).all()


@app.post("/alerts", response_model=AlertResponse)
def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    """Create alert for country PSI threshold."""
    db_alert = Alert(country_id=alert.country_id, psi_threshold=alert.psi_threshold)
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


@app.delete("/alerts/{alert_id}")
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    """Delete an alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return {"ok": True}


# WebSocket /live - streams PSI updates and breaking events
from fastapi import WebSocket, WebSocketDisconnect
import json
from datetime import datetime

active_connections: list[WebSocket] = []


@app.websocket("/live")
async def websocket_live(websocket: WebSocket):
    """Streams PSI updates and breaking events."""
    await websocket.accept()
    active_connections.append(websocket)
    try:
        from app.database import SessionLocal
        while True:
            await asyncio.sleep(5)  # Broadcast every 5 seconds
            db = SessionLocal()
            try:
                countries = db.query(Country).all()
                psi_scores = db.query(PSIScore).filter(PSIScore.country_id.in_([c.id for c in countries])).all()
                psi_map = {p.country_id: p for p in psi_scores}
                for conn in active_connections[:]:
                    try:
                        await conn.send_json({
                            "type": "psi_update",
                            "data": [
                                {
                                    "country_id": c.id,
                                    "psi_score": psi_map.get(c.id).psi_score if c.id in psi_map else 0.0,
                                    "risk_level": psi_map.get(c.id).risk_level if c.id in psi_map else "Stable",
                                    "timestamp": datetime.utcnow().isoformat(),
                                }
                                for c in countries
                            ],
                        })
                    except Exception:
                        active_connections.remove(conn)
            finally:
                db.close()
    except WebSocketDisconnect:
        active_connections.remove(websocket)


@app.get("/health")
def health():
    """Health check."""
    return {"status": "ok"}
