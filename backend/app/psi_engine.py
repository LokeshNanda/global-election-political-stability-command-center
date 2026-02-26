"""
Political Stability Index (PSI) Engine - RISK_ENGINE.md specification.

PSI = Weighted Composite Score (0–100)
Components:
- Election Proximity Weight: 20%
- Protest Intensity Weight: 25%
- Sentiment Volatility Weight: 20%
- Currency Volatility Weight: 20%
- News Negativity Weight: 15%

Risk Levels:
0–30 → Stable (Green)
31–50 → Moderate (Yellow)
51–70 → Elevated (Orange)
71–85 → High (Red)
86–100 → Crisis (Flashing Red)
"""
from typing import Optional

# Component weights (must sum to 1.0)
ELECTION_WEIGHT = 0.20
PROTEST_WEIGHT = 0.25
SENTIMENT_WEIGHT = 0.20
CURRENCY_WEIGHT = 0.20
NEWS_WEIGHT = 0.15

RISK_LEVELS = [
    (0, 30, "Stable"),
    (31, 50, "Moderate"),
    (51, 70, "Elevated"),
    (71, 85, "High"),
    (86, 100, "Crisis"),
]


def _clamp(value: float, low: float, high: float) -> float:
    """Clamp value to range [low, high]."""
    return max(low, min(high, value))


def _election_proximity_score(days_remaining: Optional[int]) -> float:
    """
    Convert days until election to 0-100 instability score.
    Closer elections = higher instability.
    """
    if days_remaining is None or days_remaining > 365:
        return 0.0
    if days_remaining <= 0:
        return 100.0
    # Inverse relationship: 365 days = ~5, 30 days = ~75, 0 days = 100
    return _clamp(100 - (days_remaining / 365) * 95, 0, 100)


def _protest_intensity_score(severity: float, count: int) -> float:
    """Convert protest severity and count to 0-100 score."""
    base = _clamp(severity * 20, 0, 80)  # severity 0-5 maps to 0-80
    count_bonus = min(count * 5, 20)  # up to 4 protests add 20
    return _clamp(base + count_bonus, 0, 100)


def _sentiment_volatility_score(volatility: float, score: float) -> float:
    """Convert sentiment volatility (-1 to 1) and score to 0-100."""
    # Negative sentiment + high volatility = instability
    negativity = (1 - score) / 2  # -1→1, 1→0
    return _clamp(negativity * 50 + volatility * 50, 0, 100)


def _currency_volatility_score(volatility: float) -> float:
    """Convert currency volatility to 0-100 score."""
    return _clamp(volatility * 25, 0, 100)


def _news_negativity_score(negativity: float) -> float:
    """Convert news negativity (0-1) to 0-100 score."""
    return _clamp(negativity * 100, 0, 100)


def calculate_psi(
    election_days_remaining: Optional[int] = None,
    protest_severity: float = 0.0,
    protest_count: int = 0,
    sentiment_score: float = 0.0,
    sentiment_volatility: float = 0.0,
    currency_volatility: float = 0.0,
    news_negativity: float = 0.0,
) -> tuple[float, str]:
    """
    Calculate PSI score and risk level.
    Returns (psi_score, risk_level).
    """
    election_score = _election_proximity_score(election_days_remaining)
    protest_score = _protest_intensity_score(protest_severity, protest_count)
    sentiment_score_val = _sentiment_volatility_score(sentiment_volatility, sentiment_score)
    currency_score = _currency_volatility_score(currency_volatility)
    news_score = _news_negativity_score(news_negativity)

    psi = (
        election_score * ELECTION_WEIGHT
        + protest_score * PROTEST_WEIGHT
        + sentiment_score_val * SENTIMENT_WEIGHT
        + currency_score * CURRENCY_WEIGHT
        + news_score * NEWS_WEIGHT
    )
    psi = _clamp(psi, 0, 100)

    risk_level = "Stable"
    for low, high, level in RISK_LEVELS:
        if low <= psi <= high:
            risk_level = level
            break

    return round(psi, 1), risk_level


def calculate_escalation_probability(
    psi_trend_slope: float,
    event_clustering: float,
    volatility_spike: float,
) -> float:
    """
    Escalation probability based on 7-day trend, event clustering, volatility.
    Returns 0-1 probability.
    """
    # Normalize inputs (assume 0-1 range for each)
    slope_factor = _clamp(psi_trend_slope, 0, 1)
    cluster_factor = _clamp(event_clustering, 0, 1)
    vol_factor = _clamp(volatility_spike, 0, 1)
    return round((slope_factor * 0.4 + cluster_factor * 0.35 + vol_factor * 0.25), 2)
