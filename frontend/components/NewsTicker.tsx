'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const MOCK_HEADLINES = [
  'BREAKING: Political tensions rise ahead of key regional vote',
  'Currency volatility spikes in emerging markets',
  'Protest activity reported in capital district',
  'Election commission announces polling schedule',
  'Bond yields widen amid political uncertainty',
  'Sentiment indicators show negative shift',
  'IMF monitors political stability in target nations',
  'Market analysts flag election-related risk',
  'Government announces emergency session',
  'Opposition coalition forms ahead of vote',
];

export default function NewsTicker() {
  const [headlines, setHeadlines] = useState<string[]>([]);

  useEffect(() => {
    const shuffled = [...MOCK_HEADLINES].sort(() => Math.random() - 0.5);
    setHeadlines([...shuffled, ...shuffled]);
  }, []);

  if (headlines.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-10 bg-slate-900/90 border-t border-slate-700 overflow-hidden z-20">
      <div className="flex items-center h-full">
        <span className="px-4 py-2 bg-neon-red/20 text-neon-red text-xs font-bold uppercase tracking-wider whitespace-nowrap">
          Live
        </span>
        <div className="flex-1 overflow-hidden">
          <motion.div
            className="flex gap-8 text-sm text-slate-300 whitespace-nowrap"
            initial={{ x: 0 }}
            animate={{ x: '-50%' }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          >
            {headlines.map((h, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                <span className="text-slate-500">•</span>
                {h}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
