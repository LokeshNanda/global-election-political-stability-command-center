'use client';

import { motion } from 'framer-motion';
import type { CountryDetail } from '@/app/types';

const RISK_CLASSES: Record<string, string> = {
  Stable: 'text-psi-stable',
  Moderate: 'text-psi-moderate',
  Elevated: 'text-psi-elevated',
  High: 'text-psi-high',
  Crisis: 'text-psi-crisis',
};

const RISK_GLOW: Record<string, string> = {
  Stable: 'shadow-neon-green',
  Moderate: 'shadow-yellow-500/50',
  Elevated: 'shadow-orange-500/50',
  High: 'shadow-neon-red',
  Crisis: 'shadow-neon-red',
};

interface RightPanelProps {
  country: CountryDetail | null;
  onClose: () => void;
}

function RiskGauge({ psi, riskLevel }: { psi: number; riskLevel: string }) {
  const rotation = (psi / 100) * 180 - 90;
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#1e293b"
          strokeWidth="8"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(psi / 100) * 251.2} 251.2`}
          initial={{ strokeDasharray: '0 251.2' }}
          animate={{ strokeDasharray: `${(psi / 100) * 251.2} 251.2` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={RISK_CLASSES[riskLevel] || 'text-slate-400'}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-2xl font-bold ${RISK_CLASSES[riskLevel]}`}>
          {psi.toFixed(0)}
        </span>
      </div>
    </div>
  );
}

export default function RightPanel({ country, onClose }: RightPanelProps) {
  if (!country) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute right-4 top-4 bottom-24 w-80 glass-panel rounded-lg p-4 z-10 flex items-center justify-center"
      >
        <p className="text-slate-500 text-sm">Select a country on the globe</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute right-4 top-4 bottom-24 w-80 glass-panel rounded-lg p-4 z-10 overflow-y-auto"
    >
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-lg font-bold text-white">{country.name}</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Risk Meter */}
      <div className="mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">PSI Score</h3>
        <RiskGauge psi={country.psi_score} riskLevel={country.risk_level} />
        <p className={`text-center text-sm font-medium ${RISK_CLASSES[country.risk_level]}`}>
          {country.risk_level}
        </p>
        <p className="text-center text-xs text-slate-500 mt-1">
          Escalation: {(country.escalation_probability * 100).toFixed(0)}%
        </p>
      </div>

      {/* AI Briefing placeholder */}
      <div className="mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Briefing</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {country.risk_level === 'Crisis' && 'Heightened political tension. Monitor closely.'}
          {country.risk_level === 'High' && 'Elevated risk. Key events may drive volatility.'}
          {country.risk_level === 'Elevated' && 'Moderate instability. Watch for catalysts.'}
          {country.risk_level === 'Moderate' && 'Stable with some volatility. Routine monitoring.'}
          {country.risk_level === 'Stable' && 'Low risk environment. Standard oversight.'}
        </p>
      </div>

      {/* Trend sparkline placeholder */}
      <div className="mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">7-Day Trend</h3>
        <div className="h-12 bg-slate-800/50 rounded flex items-end justify-around gap-1 p-2">
          {[65, 58, 72, 68, 75, 70, country.psi_score].map((v, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${v}%` }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="w-2 bg-neon-blue/70 rounded-t"
            />
          ))}
        </div>
      </div>

      {/* Elections */}
      {country.elections.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Elections</h3>
          <div className="space-y-1">
            {country.elections.slice(0, 3).map((e) => (
              <div key={e.id} className="text-xs flex justify-between">
                <span className="capitalize">{e.type}</span>
                <span className="text-neon-green">{e.days_remaining} days</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Protests */}
      {country.protests.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recent Protests</h3>
          <div className="space-y-1">
            {country.protests.slice(0, 3).map((p) => (
              <div key={p.id} className="text-xs flex justify-between">
                <span>{p.location}</span>
                <span className="text-psi-elevated">Sev: {p.severity_score.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
