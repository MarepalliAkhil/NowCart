import React from 'react';
import { ShieldCheck, BarChart3 } from 'lucide-react';
import { Product } from '../types';

interface DiversityWidgetProps {
  products: Product[];
}

export const DiversityWidget: React.FC<DiversityWidgetProps> = ({ products }) => {
  if (!products || products.length === 0) return null;

  const total = products.length;
  const categoryCounts: Record<string, number> = {};

  products.forEach((p) => {
    const cat = p.category || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categoryPcts = Object.entries(categoryCounts).map(([cat, count]) => ({
    category: cat,
    count,
    pct: Math.round((count / total) * 100),
  }));

  const maxPct = Math.max(...categoryPcts.map((c) => c.pct));
  const isGuardrailRespected = maxPct <= 35 || products.length <= 3;

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Category Diversity & Guardrail Monitor
            </h3>
            <p className="text-xs text-slate-400">
              Live category breakdown across {total} active recommendations
            </p>
          </div>
        </div>

        {/* Guardrail Compliance Badge */}
        <div className="flex items-center gap-2">
          {isGuardrailRespected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              Guardrail Active: Max Category Cap &le; 35%
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-semibold">
              Max Category: {maxPct}%
            </span>
          )}
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {categoryPcts.map((item) => (
          <div key={item.category} className="space-y-1.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300 truncate max-w-[120px]">{item.category}</span>
              <span className="font-mono text-teal-400 font-bold">{item.pct}% ({item.count})</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(item.pct, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
