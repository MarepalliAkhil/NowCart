import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Zap, BarChart3, ShieldCheck, Layers, Activity } from 'lucide-react';
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative z-10 w-full max-w-lg bg-slate-950 text-slate-100 border-l border-slate-800 h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-2xl">
                    <Cpu className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-100">Discovery Engine AI Panel</h3>
                    <p className="text-xs text-slate-400 font-mono">Multi-Task CF & Two-Tower Vector Pipeline</p>
                  </div>
                </div>
                <button onClick={toggleDevPanel} className="p-2 text-slate-400 hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <Zap className="w-4 h-4" /> Current Session Intent
                  </span>
                  <span className="text-emerald-400 font-mono text-[10px]">LIVE UPDATING</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold text-slate-200">
                  "{aiSession.sessionIntent}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-400" /> Vector Retrieval
                  </span>
                  <div className="text-xl font-black text-slate-100 font-mono">
                    {aiSession.retrievalCandidates} <span className="text-xs text-slate-400 font-normal">candidates</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Two-Tower 256-d ANN</span>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> Rerank Score
                  </span>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {aiSession.rerankScore}
                  </div>
                  <span className="text-[10px] text-slate-500 block">Multi-Task Neural CF</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-cyan-400" /> Recommendation Latency
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-400">{aiSession.latencyMs} ms</span>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Cold-Start User Path</span>
                    <span className="text-[10px] text-slate-400 font-medium">Fallback popularity path for cold sessions</span>
                  </div>
                  <button
                    onClick={toggleColdStart}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      aiSession.isColdStart
                        ? 'bg-orange-500 text-white shadow-orange-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {aiSession.isColdStart ? 'Cold Start ON' : 'Cold Start OFF'}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-100 block">DPDP Privacy Compliance</span>
                    <span className="text-[10px] text-slate-400 font-medium">Zero raw PII stored in embeddings</span>
                  </div>
                </div>
                <button
                  onClick={toggleDpdpConsent}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                    aiSession.dpdpConsent
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {aiSession.dpdpConsent ? 'Consent: ACTIVE' : 'Consent: OFF'}
                </button>
              </div>

              <div className="p-4 bg-blue-950/60 border border-blue-500/30 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                  LLM-Generated RAG Explanation
                </span>
                <p className="text-xs text-blue-200 leading-relaxed italic">
                  "{aiSession.topRagExplanation}"
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">35% Category Diversity Guardrail</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    CAP ENFORCED
                  </span>
                </div>
                <div className="space-y-2">
                  {categoryPcts.map((item) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">{item.category}</span>
                        <span className="font-mono text-blue-400 font-bold">{item.pct}% ({item.count})</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.pct}%` }}
                          transition={{ duration: 0.6 }}
                          className="h-full bg-blue-500 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>NowCart Discovery Pipeline v0.1.0</span>
              <span>Target &lt; 80ms</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
