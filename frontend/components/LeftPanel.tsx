'use client';

import { motion } from 'framer-motion';
import type { LeaderboardEntry } from '@/app/types';
import type { UpcomingElection } from '@/lib/api';

const RISK_CLASSES: Record<string, string> = {
  Stable: 'text-psi-stable',
  Moderate: 'text-psi-moderate',
  Elevated: 'text-psi-elevated',
  High: 'text-psi-high',
  Crisis: 'text-psi-crisis animate-pulse',
};

interface LeftPanelProps {
  leaderboard: LeaderboardEntry[];
  upcomingElections: UpcomingElection[];
}

export default function LeftPanel({ leaderboard, upcomingElections }: LeftPanelProps) {
  return (
    <div className="absolute left-4 top-4 bottom-24 w-72 flex flex-col gap-4 z-10">
      {/* Risk Leaderboard */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel rounded-lg p-4"
      >
        <h3 className="text-sm font-bold text-neon-blue uppercase tracking-wider mb-3 border-b border-slate-700 pb-2">
          Global Risk Leaderboard
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {leaderboard.map((entry) => (
            <div
              key={entry.country_id}
              className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-800/50 transition-colors"
            >
              <span className="text-slate-400 text-xs w-5">#{entry.rank}</span>
              <span className="text-sm font-medium truncate flex-1">{entry.country_name}</span>
              <span className={`text-sm font-bold ${RISK_CLASSES[entry.risk_level] || 'text-slate-400'}`}>
                {entry.psi_score.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Upcoming Elections (60-day window) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-panel rounded-lg p-4"
      >
        <h3 className="text-sm font-bold text-neon-green uppercase tracking-wider mb-3 border-b border-slate-700 pb-2">
          Upcoming Elections (60d)
        </h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {upcomingElections.length === 0 ? (
            <p className="text-slate-500 text-xs">No elections in next 60 days</p>
          ) : (
            upcomingElections.map((e, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-800/50 transition-colors"
              >
                <span className="text-sm truncate flex-1">{e.country_name}</span>
                <span className="text-xs text-slate-400">{e.days_remaining}d</span>
                <span className="text-xs text-slate-500 capitalize">{e.type}</span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
