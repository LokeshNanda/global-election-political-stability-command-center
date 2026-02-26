export interface CountryWithPSI {
  id: number;
  name: string;
  iso_code: string;
  region: string;
  latitude: number;
  longitude: number;
  psi_score: number;
  risk_level: string;
}

export interface CountryDetail extends CountryWithPSI {
  escalation_probability: number;
  elections: Election[];
  protests: ProtestEvent[];
  sentiment: SentimentScore | null;
  market_indicator: MarketIndicator | null;
}

export interface Election {
  id: number;
  country_id: number;
  date: string;
  type: string;
  days_remaining: number;
}

export interface ProtestEvent {
  id: number;
  country_id: number;
  severity_score: number;
  location: string;
  date: string;
}

export interface SentimentScore {
  id: number;
  country_id: number;
  score: number;
  volatility_index: number;
  timestamp: string;
}

export interface MarketIndicator {
  id: number;
  country_id: number;
  currency_volatility: number;
  bond_yield_change: number;
  timestamp: string;
}

export interface LeaderboardEntry {
  rank: number;
  country_id: number;
  country_name: string;
  iso_code: string;
  psi_score: number;
  risk_level: string;
}

export type RiskLevel = 'Stable' | 'Moderate' | 'Elevated' | 'High' | 'Crisis';
