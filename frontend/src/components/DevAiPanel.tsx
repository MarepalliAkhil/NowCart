import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, BarChart3, ShieldCheck, Layers, Activity } from 'lucide-react';
import { useNowCartStore } from '../store/useNowCartStore';

export const DevAiPanel: React.FC = () => {
  const isDevPanelOpen = useNowCartStore((state) => state.isDevPanelOpen);
  const toggleDevPanel = useNowCartStore((state) => state.toggleDevPanel);
  const aiSession = useNowCartStore((state) => state.aiSession);
  const toggleColdStart = useNowCartStore((state) => state.toggleColdStart);
  const toggleDpdpConsent = useNowCartStore((state) => state.toggleDpdpConsent);
  const products = useNowCartStore((state) => state.products);

  const total = products.length || 1;
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

  return (
    <AnimatePresence>
      {isDevPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleDevPanel}
            className="absolute inset-0 bg-ink/40 backdrop-blur-xs"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative z-10 w-full max-w-lg text-ink border-l border-subtle h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl"
            style={{
              backgroundColor: 'rgba(247, 245, 242, 0.96)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-subtle">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-plum-light text-plum border border-plum/20 rounded-2xl">
                    <Sparkles className="w-5 h-5 text-plum" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-ink font-sans">For You Recommendations</h3>
                    <p className="text-xs text-muted font-medium">Personalized Feed &amp; Style Insights</p>
                  </div>
                </div>
                <button
                  onClick={toggleDevPanel}
                  className="p-2 text-muted hover:text-ink hover:bg-white rounded-full transition-colors"
                  title="Close panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Session Intent */}
              <div className="p-4 bg-white border border-subtle rounded-2xl space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-plum">
                    <Zap className="w-4 h-4 text-plum" /> Current Session Intent
                  </span>
                  <span className="bg-gold-light text-gold border border-gold/30 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                    LIVE UPDATING
                  </span>
                </div>
                <div className="p-3 bg-bone rounded-xl border border-subtle text-xs font-extrabold text-ink leading-relaxed">
                  "{aiSession.sessionIntent}"
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white border border-subtle rounded-2xl space-y-1 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-plum" /> Retrieval Pool
                  </span>
                  <div className="text-xl font-black text-ink font-sans">
                    {aiSession.retrievalCandidates} <span className="text-xs text-muted font-normal">items</span>
                  </div>
                  <span className="text-[10px] text-muted font-medium block">Two-Tower Vector Index</span>
                </div>

                <div className="p-4 bg-white border border-subtle rounded-2xl space-y-1 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5 text-gold" /> Rerank Match
                  </span>
                  <div className="text-xl font-black text-plum font-sans">
                    {aiSession.rerankScore}
                  </div>
                  <span className="text-[10px] text-muted font-medium block">Multi-Task Neural Score</span>
                </div>
              </div>

              {/* Latency & Cold-Start Toggle */}
              <div className="p-4 bg-white border border-subtle rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-plum" /> Recommendation Latency
                  </span>
                  <span className="font-mono font-bold text-ink bg-bone px-2.5 py-1 rounded-lg border border-subtle">
                    {aiSession.latencyMs} ms
                  </span>
                </div>

                <div className="pt-3 border-t border-subtle flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-ink block">Cold-Start User Path</span>
                    <span className="text-[10px] text-muted font-medium">Fallback popularity feed for new sessions</span>
                  </div>
                  <button
                    onClick={toggleColdStart}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      aiSession.isColdStart
                        ? 'bg-plum text-white shadow-md shadow-plum/20'
                        : 'bg-bone text-ink border border-subtle hover:bg-subtle'
                    }`}
                  >
                    {aiSession.isColdStart ? 'Cold Start ON' : 'Cold Start OFF'}
                  </button>
                </div>
              </div>

              {/* Privacy Compliance */}
              <div className="p-4 bg-white border border-subtle rounded-2xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-success shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-ink block">Privacy &amp; Data Guardrail</span>
                    <span className="text-[10px] text-muted font-medium">Zero raw PII stored in embeddings</span>
                  </div>
                </div>
                <button
                  onClick={toggleDpdpConsent}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                    aiSession.dpdpConsent
                      ? 'bg-emerald-50 text-success border-emerald-200'
                      : 'bg-rose-50 text-error border-rose-200'
                  }`}
                >
                  {aiSession.dpdpConsent ? 'Consent: ACTIVE' : 'Consent: OFF'}
                </button>
              </div>

              {/* RAG Style Pairing Explanation */}
              <div className="p-4 bg-plum-light border border-plum/20 rounded-2xl space-y-1.5 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-plum flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-plum" /> Style Pairings &amp; Reasoning
                </span>
                <p className="text-xs text-plum font-medium leading-relaxed italic">
                  "{aiSession.topRagExplanation}"
                </p>
              </div>

              {/* Category Diversity Guardrail */}
              <div className="p-4 bg-white border border-subtle rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">35% Category Diversity Guardrail</span>
                  <span className="text-[10px] font-bold text-gold bg-gold-light border border-gold/30 px-2 py-0.5 rounded-full">
                    CAP ENFORCED
                  </span>
                </div>
                <div className="space-y-2">
                  {categoryPcts.map((item) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted font-medium">{item.category}</span>
                        <span className="font-mono text-ink font-bold">{item.pct}% ({item.count})</span>
                      </div>
                      <div className="h-1.5 bg-bone rounded-full overflow-hidden border border-subtle/50">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.pct}%` }}
                          transition={{ duration: 0.6 }}
                          className="h-full bg-plum rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-subtle flex items-center justify-between text-[11px] text-muted font-mono mt-4">
              <span>NowCart Style Engine v0.1.0</span>
              <span>Target &lt; 80ms</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
