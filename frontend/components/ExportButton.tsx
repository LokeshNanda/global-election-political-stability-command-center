'use client';

import { useState, useRef, useEffect } from 'react';
import type { CountryWithPSI } from '@/app/types';
import type { LeaderboardEntry } from '@/app/types';

function toCSV(rows: string[][]): string {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface ExportButtonProps {
  countries: CountryWithPSI[];
  leaderboard: LeaderboardEntry[];
}

export default function ExportButton({ countries, leaderboard }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);
  const exportCountries = () => {
    const headers = ['Name', 'ISO', 'Region', 'PSI Score', 'Risk Level'];
    const rows = countries.map((c) => [c.name, c.iso_code, c.region, c.psi_score.toFixed(1), c.risk_level]);
    downloadCSV(toCSV([headers, ...rows]), `psi-countries-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportLeaderboard = () => {
    const headers = ['Rank', 'Country', 'ISO', 'PSI Score', 'Risk Level'];
    const rows = leaderboard.map((l) => [String(l.rank), l.country_name, l.iso_code, l.psi_score.toFixed(1), l.risk_level]);
    downloadCSV(toCSV([headers, ...rows]), `psi-leaderboard-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-slate-400 hover:text-neon-blue text-xs uppercase tracking-wider px-2 py-1 rounded hover:bg-slate-800/50"
      >
        Export ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 py-1 glass-panel rounded shadow-lg z-20 min-w-[140px]">
          <button
            onClick={() => {
              exportCountries();
              setOpen(false);
            }}
            className="block w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50 hover:text-white"
          >
            Countries CSV
          </button>
          <button
            onClick={() => {
              exportLeaderboard();
              setOpen(false);
            }}
            className="block w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50 hover:text-white"
          >
            Leaderboard CSV
          </button>
        </div>
      )}
    </div>
  );
}
