'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { fetchAlerts, createAlert, deleteAlert, type Alert } from '@/lib/api';
import type { CountryWithPSI } from '@/app/types';

interface AlertsPanelProps {
  countries: CountryWithPSI[];
}

export default function AlertsPanel({ countries }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [countryId, setCountryId] = useState<number>(countries[0]?.id ?? 0);
  const [threshold, setThreshold] = useState(70);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const loadAlerts = useCallback(async () => {
    try {
      const data = await fetchAlerts();
      setAlerts(data);
    } catch {
      setAlerts([]);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    if (countries.length > 0 && !countryId) setCountryId(countries[0].id);
  }, [countries, countryId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cid = countryId || countries[0]?.id;
    if (!cid) return;
    setLoading(true);
    try {
      await createAlert(cid, threshold);
      await loadAlerts();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const countryNames = new Map(countries.map((c) => [c.id, c.name]));

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
        <h3 className="text-sm font-bold text-neon-red uppercase tracking-wider">
          Alerts
        </h3>
        <span className="text-slate-500 text-xs">{expanded ? '▼' : '▶'}</span>
      </button>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 space-y-3"
        >
          <p className="text-xs text-slate-500" title="Notify when country PSI exceeds threshold">
            Notify when a country&apos;s PSI exceeds your threshold.
          </p>
          <form onSubmit={handleCreate} className="space-y-2">
            <select
              value={countryId || countries[0]?.id}
              onChange={(e) => setCountryId(Number(e.target.value))}
              disabled={countries.length === 0}
              className="w-full bg-slate-800/80 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue disabled:opacity-50"
            >
              {countries.length === 0 && <option value="">No countries</option>}
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="flex-1 bg-slate-800/80 border border-slate-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon-blue"
                placeholder="PSI threshold"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1.5 bg-neon-red/20 text-neon-red rounded text-xs font-medium hover:bg-neon-red/30 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </form>
          <div className="space-y-1 max-h-28 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-slate-500 text-xs">No alerts set</p>
            ) : (
              alerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded bg-slate-800/50 text-xs"
                >
                  <span className="truncate flex-1">
                    {countryNames.get(a.country_id) ?? `#${a.country_id}`} &gt; {a.psi_threshold}
                  </span>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-slate-500 hover:text-neon-red text-xs"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
