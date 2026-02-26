'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence } from 'framer-motion';
import { fetchCountries, fetchCountry, fetchLeaderboard, fetchUpcomingElections, getWebSocketUrl } from '@/lib/api';
import type { CountryWithPSI, CountryDetail, LeaderboardEntry } from '@/app/types';
import LeftPanel from '@/components/LeftPanel';
import RightPanel from '@/components/RightPanel';
import NewsTicker from '@/components/NewsTicker';

const Globe = dynamic(() => import('@/components/Globe'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]">
      <div className="text-neon-blue animate-pulse">Loading globe...</div>
    </div>
  ),
});

export default function Home() {
  const [countries, setCountries] = useState<CountryWithPSI[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [upcomingElections, setUpcomingElections] = useState<import('@/lib/api').UpcomingElection[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [countriesData, leaderboardData, electionsData] = await Promise.all([
        fetchCountries(),
        fetchLeaderboard(),
        fetchUpcomingElections(),
      ]);
      setCountries(countriesData);
      setLeaderboard(leaderboardData);
      setUpcomingElections(electionsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const wsUrl = getWebSocketUrl();
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'psi_update' && msg.data) {
          setCountries((prev) => {
            const map = new Map(prev.map((c) => [c.id, c]));
            for (const u of msg.data) {
              const existing = map.get(u.country_id);
              if (existing) {
                map.set(u.country_id, { ...existing, psi_score: u.psi_score, risk_level: u.risk_level });
              }
            }
            return Array.from(map.values());
          });
          loadData();
        }
      };
      ws.onerror = () => {};
    } catch {
      // WebSocket not available, use polling
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
    return () => ws?.close();
  }, [loadData]);

  const handleCountryClick = useCallback(async (country: CountryWithPSI) => {
    try {
      const detail = await fetchCountry(country.id);
      setSelectedCountry(detail);
    } catch {
      setSelectedCountry(null);
    }
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0e17]">
        <div className="text-neon-blue animate-pulse">Initializing command center...</div>
      </div>
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <Globe countries={countries} onCountryClick={handleCountryClick} />
      <LeftPanel leaderboard={leaderboard} upcomingElections={upcomingElections} />
      <AnimatePresence>
        <RightPanel country={selectedCountry} onClose={() => setSelectedCountry(null)} />
      </AnimatePresence>
      <NewsTicker />

      {/* Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <h1 className="text-lg font-bold text-white/90 tracking-widest uppercase">
          Global Election & Political Stability Command Center
        </h1>
        <p className="text-xs text-slate-500 text-center mt-1">PSI • Real-time • Intelligence</p>
      </div>
    </main>
  );
}
