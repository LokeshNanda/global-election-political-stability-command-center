'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchTimeline, type TimelineEntry } from '@/lib/api';
import type { CountryWithPSI } from '@/app/types';

const RISK_CLASSES: Record<string, string> = {
  Stable: 'text-psi-stable',
  Moderate: 'text-psi-moderate',
  Elevated: 'text-psi-elevated',
  High: 'text-psi-high',
  Crisis: 'text-psi-crisis',
};

interface TimelineSliderProps {
  countries: CountryWithPSI[];
}

export default function TimelineSlider({ countries }: TimelineSliderProps) {
  const [days, setDays] = useState(30);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchTimeline(days)
      .then(setTimeline)
      .catch(() => setTimeline([]))
      .finally(() => setLoading(false));
  }, [days]);

  const countryNames = new Map(countries.map((c) => [c.id, c.name]));
  const topRisks = [...timeline]
    .sort((a, b) => b.psi_score - a.psi_score)
    .slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-lg p-4"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-sm font-bold text-neon-blue uppercase tracking-wider">
          PSI Timeline
        </h3>
        <span className="text-slate-500 text-xs">{expanded ? '▼' : '▶'}</span>
      </button>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 space-y-3"
        >
          <div>
            <label className="text-xs text-slate-400 block mb-1">
              Lookback: {days} days
            </label>
            <input
              type="range"
              min={7}
              max={90}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
            />
          </div>
          {loading ? (
            <p className="text-slate-500 text-xs">Loading...</p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {topRisks.map((t) => (
                <div
                  key={`${t.date}-${t.country_id}`}
                  className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-800/50 text-xs"
                >
                  <span className="truncate flex-1">
                    {countryNames.get(t.country_id) ?? `Country ${t.country_id}`}
                  </span>
                  <span className={`font-bold ${RISK_CLASSES[t.risk_level] || 'text-slate-400'}`}>
                    {t.psi_score.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
