"""
Mock Data Generator - MOCK_DATA_STRATEGY.md specification.

Generates synthetic:
- Elections
- Protest events (weighted probability)
- Sentiment volatility
- Currency shock events

Data updates every 30 seconds.
"""
import random
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.models import Country, Election, ProtestEvent, SentimentScore, MarketIndicator, PSIScore
from app.psi_engine import calculate_psi, calculate_escalation_probability, RISK_LEVELS


# Election types with weights
ELECTION_TYPES = [
    ("presidential", 0.35),
    ("parliamentary", 0.30),
    ("regional", 0.20),
    ("referendum", 0.15),
]

# Protest locations by region
PROTEST_LOCATIONS = {
    "Europe": ["Capital Square", "Parliament", "Main Boulevard", "University District"],
    "Americas": ["National Plaza", "Congress", "Downtown", "Industrial Zone"],
    "Asia": ["City Center", "Government Complex", "Financial District", "Port Area"],
    "Africa": ["Independence Square", "Presidential Palace", "Market District", "Stadium"],
    "Oceania": ["Parliament House", "CBD", "Harbour", "University Campus"],
}


def _weighted_choice(choices: list[tuple]) -> str:
    """Select from weighted choices."""
    total = sum(w for _, w in choices)
    r = random.uniform(0, total)
    for item, weight in choices:
        r -= weight
        if r <= 0:
            return item
    return choices[-1][0]


def _get_region_location(region: str) -> str:
    """Get random protest location for region."""
    region_key = next((k for k in PROTEST_LOCATIONS if k in region or region in k), "Europe")
    locations = PROTEST_LOCATIONS.get(region_key, PROTEST_LOCATIONS["Europe"])
    return random.choice(locations)


def seed_countries(db: Session) -> list[Country]:
    """Seed initial countries with coordinates."""
    countries_data = [
        ("United States", "USA", "Americas", 37.09, -95.71),
        ("United Kingdom", "GBR", "Europe", 55.38, -3.44),
        ("France", "FRA", "Europe", 46.23, 2.21),
        ("Germany", "DEU", "Europe", 51.17, 10.45),
        ("Brazil", "BRA", "Americas", -14.24, -51.93),
        ("India", "IND", "Asia", 20.59, 78.96),
        ("China", "CHN", "Asia", 35.86, 104.20),
        ("Japan", "JPN", "Asia", 36.20, 138.25),
        ("Nigeria", "NGA", "Africa", 9.08, 8.68),
        ("South Africa", "ZAF", "Africa", -30.56, 22.94),
        ("Mexico", "MEX", "Americas", 23.63, -102.55),
        ("Indonesia", "IDN", "Asia", -0.79, 113.92),
        ("Turkey", "TUR", "Europe", 38.96, 35.24),
        ("Argentina", "ARG", "Americas", -38.42, -63.62),
        ("Poland", "POL", "Europe", 51.92, 19.15),
        ("Ukraine", "UKR", "Europe", 48.38, 31.17),
        ("Egypt", "EGY", "Africa", 26.82, 30.80),
        ("Pakistan", "PAK", "Asia", 30.38, 69.35),
        ("Bangladesh", "BGD", "Asia", 23.68, 90.36),
        ("Philippines", "PHL", "Asia", 12.88, 121.77),
    ]
    countries = []
    for name, iso, region, lat, lon in countries_data:
        country = Country(
            name=name,
            iso_code=iso,
            region=region,
            latitude=lat,
            longitude=lon,
        )
        db.add(country)
        countries.append(country)
    db.commit()
    for c in countries:
        db.refresh(c)
    return countries


def generate_election(db: Session, country: Country) -> Optional[Election]:
    """Generate synthetic election within 60-day window."""
    if random.random() > 0.6:  # 60% chance of upcoming election
        return None
    days_ahead = random.randint(5, 60)
    election_date = datetime.utcnow() + timedelta(days=days_ahead)
    election_type = _weighted_choice(ELECTION_TYPES)
    election = Election(
        country_id=country.id,
        date=election_date,
        type=election_type,
        days_remaining=days_ahead,
    )
    db.add(election)
    return election


def generate_protest(db: Session, country: Country) -> Optional[ProtestEvent]:
    """Generate protest with weighted probability."""
    if random.random() > 0.4:  # 40% chance per country per cycle
        return None
    severity = random.uniform(0.2, 4.5)
    location = _get_region_location(country.region)
    protest = ProtestEvent(
        country_id=country.id,
        severity_score=round(severity, 1),
        location=location,
        date=datetime.utcnow() - timedelta(days=random.randint(0, 7)),
    )
    db.add(protest)
    return protest


def generate_sentiment(db: Session, country: Country) -> SentimentScore:
    """Simulate sentiment volatility."""
    score = random.uniform(-0.8, 0.6)
    volatility = random.uniform(0.1, 0.9)
    sentiment = SentimentScore(
        country_id=country.id,
        score=round(score, 2),
        volatility_index=round(volatility, 2),
    )
    db.add(sentiment)
    return sentiment


def generate_market_indicator(db: Session, country: Country) -> MarketIndicator:
    """Simulate currency shock events (10% chance of spike)."""
    base_vol = random.uniform(0.5, 3.0)
    if random.random() < 0.1:
        base_vol *= random.uniform(2, 5)  # Currency shock
    bond_change = random.uniform(-0.5, 1.5)
    indicator = MarketIndicator(
        country_id=country.id,
        currency_volatility=round(base_vol, 2),
        bond_yield_change=round(bond_change, 2),
    )
    db.add(indicator)
    return indicator


def update_psi_scores(db: Session) -> None:
    """Recalculate and update all PSI scores."""
    countries = db.query(Country).all()
    for country in countries:
        # Get latest election (closest upcoming)
        election = (
            db.query(Election)
            .filter(Election.country_id == country.id, Election.days_remaining > 0)
            .order_by(Election.days_remaining)
            .first()
        )
        election_days = election.days_remaining if election else None

        # Aggregate protests
        protests = db.query(ProtestEvent).filter(
            ProtestEvent.country_id == country.id,
            ProtestEvent.date >= datetime.utcnow() - timedelta(days=30),
        ).all()
        protest_severity = sum(p.severity_score for p in protests) / max(len(protests), 1)
        protest_count = len(protests)

        # Latest sentiment
        sentiment = (
            db.query(SentimentScore)
            .filter(SentimentScore.country_id == country.id)
            .order_by(SentimentScore.timestamp.desc())
            .first()
        )
        sentiment_score = sentiment.score if sentiment else 0.0
        sentiment_vol = sentiment.volatility_index if sentiment else 0.5

        # Latest market
        market = (
            db.query(MarketIndicator)
            .filter(MarketIndicator.country_id == country.id)
            .order_by(MarketIndicator.timestamp.desc())
            .first()
        )
        currency_vol = market.currency_volatility if market else 1.0

        # News negativity (simulated)
        news_negativity = random.uniform(0.1, 0.6)

        psi, risk_level = calculate_psi(
            election_days_remaining=election_days,
            protest_severity=protest_severity,
            protest_count=protest_count,
            sentiment_score=sentiment_score,
            sentiment_volatility=sentiment_vol,
            currency_volatility=currency_vol,
            news_negativity=news_negativity,
        )

        escalation = calculate_escalation_probability(
            psi_trend_slope=random.uniform(0, 0.5),
            event_clustering=min(protest_count / 5, 1.0),
            volatility_spike=min(currency_vol / 5, 1.0),
        )

        # Upsert PSI score
        existing = (
            db.query(PSIScore)
            .filter(PSIScore.country_id == country.id)
            .first()
        )
        if existing:
            existing.psi_score = psi
            existing.risk_level = risk_level
            existing.escalation_probability = escalation
            existing.updated_at = datetime.utcnow()
        else:
            psi_record = PSIScore(
                country_id=country.id,
                psi_score=psi,
                risk_level=risk_level,
                escalation_probability=escalation,
            )
            db.add(psi_record)

    db.commit()


def run_mock_cycle(db: Session) -> None:
    """Run one full mock data generation cycle."""
    countries = db.query(Country).all()
    if not countries:
        seed_countries(db)
        countries = db.query(Country).all()

    for country in countries:
        generate_election(db, country)
        generate_protest(db, country)
        generate_sentiment(db, country)
        generate_market_indicator(db, country)

    update_psi_scores(db)
    db.commit()
