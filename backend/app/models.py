"""SQLAlchemy models matching DATA_MODEL.md specification."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from .database import Base


class Country(Base):
    __tablename__ = "countries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    iso_code = Column(String(3), unique=True, nullable=False)
    region = Column(String(50), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    elections = relationship("Election", back_populates="country")
    protests = relationship("ProtestEvent", back_populates="country")
    sentiment_scores = relationship("SentimentScore", back_populates="country")
    market_indicators = relationship("MarketIndicator", back_populates="country")
    psi_scores = relationship("PSIScore", back_populates="country")


class Election(Base):
    __tablename__ = "elections"

    id = Column(Integer, primary_key=True, index=True)
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    type = Column(String(50), nullable=False)  # presidential, parliamentary, etc.
    days_remaining = Column(Integer, nullable=False)

    country = relationship("Country", back_populates="elections")


class ProtestEvent(Base):
    __tablename__ = "protests"

    id = Column(Integer, primary_key=True, index=True)
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=False)
    severity_score = Column(Float, nullable=False)
    location = Column(String(200), nullable=False)
    date = Column(DateTime, nullable=False)

    country = relationship("Country", back_populates="protests")


class SentimentScore(Base):
    __tablename__ = "sentiment_scores"

    id = Column(Integer, primary_key=True, index=True)
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=False)
    score = Column(Float, nullable=False)  # -1 to 1
    volatility_index = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    country = relationship("Country", back_populates="sentiment_scores")


class MarketIndicator(Base):
    __tablename__ = "market_indicators"

    id = Column(Integer, primary_key=True, index=True)
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=False)
    currency_volatility = Column(Float, nullable=False)
    bond_yield_change = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    country = relationship("Country", back_populates="market_indicators")


class PSIScore(Base):
    __tablename__ = "psi_scores"

    id = Column(Integer, primary_key=True, index=True)
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=False)
    psi_score = Column(Float, nullable=False)  # 0-100
    risk_level = Column(String(20), nullable=False)
    escalation_probability = Column(Float, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow)

    country = relationship("Country", back_populates="psi_scores")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=False)
    psi_threshold = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
