"""Pydantic schemas for API request/response validation."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CountryBase(BaseModel):
    name: str
    iso_code: str
    region: str
    latitude: float
    longitude: float


class Country(CountryBase):
    id: int

    class Config:
        from_attributes = True


class CountryWithPSI(Country):
    psi_score: float
    risk_level: str


class ElectionBase(BaseModel):
    date: datetime
    type: str
    days_remaining: int


class Election(ElectionBase):
    id: int
    country_id: int

    class Config:
        from_attributes = True


class ProtestEventBase(BaseModel):
    severity_score: float
    location: str
    date: datetime


class ProtestEvent(ProtestEventBase):
    id: int
    country_id: int

    class Config:
        from_attributes = True


class SentimentScoreBase(BaseModel):
    score: float
    volatility_index: float


class SentimentScore(SentimentScoreBase):
    id: int
    country_id: int
    timestamp: datetime

    class Config:
        from_attributes = True


class MarketIndicatorBase(BaseModel):
    currency_volatility: float
    bond_yield_change: float


class MarketIndicator(MarketIndicatorBase):
    id: int
    country_id: int
    timestamp: datetime

    class Config:
        from_attributes = True


class PSIScoreBase(BaseModel):
    psi_score: float
    risk_level: str
    escalation_probability: float


class PSIScore(PSIScoreBase):
    id: int
    country_id: int
    updated_at: datetime

    class Config:
        from_attributes = True


class CountryDetail(Country):
    psi_score: float
    risk_level: str
    escalation_probability: float
    elections: list[Election]
    protests: list[ProtestEvent]
    sentiment: Optional["SentimentScore"] = None
    market_indicator: Optional["MarketIndicator"] = None


class LeaderboardEntry(BaseModel):
    rank: int
    country_id: int
    country_name: str
    iso_code: str
    psi_score: float
    risk_level: str


class TimelineEntry(BaseModel):
    date: str
    country_id: int
    psi_score: float
    risk_level: str


class AlertCreate(BaseModel):
    country_id: int
    psi_threshold: float


class AlertResponse(BaseModel):
    id: int
    country_id: int
    psi_threshold: float
    created_at: datetime

    class Config:
        from_attributes = True


class LiveUpdate(BaseModel):
    type: str  # psi_update, breaking_event
    country_id: Optional[int] = None
    psi_score: Optional[float] = None
    risk_level: Optional[str] = None
    message: Optional[str] = None
    timestamp: datetime = None
