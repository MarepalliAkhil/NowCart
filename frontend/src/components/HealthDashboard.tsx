import React, { useEffect, useState } from 'react';
import { Activity, X, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { ServiceHealth } from '../types';

interface HealthDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_SERVICES: ServiceHealth[] = [
  { name: 'API Gateway', port: 8000, description: 'Central entrypoint routing & correlation tracing', status: 'checking' },
  { name: 'Retrieval Service', port: 8001, description: 'Faiss/ANN candidate vector search', status: 'checking' },
  { name: 'Session Service', port: 8002, description: 'Real-time session intent GRU model', status: 'checking' },
  { name: 'Rerank Service', port: 8003, description: 'LightGBM scoring & category diversity cap', status: 'checking' },
  { name: 'Search Service', port: 8004, description: 'Semantic search & complexity routing', status: 'checking' },
  { name: 'Bundle Service', port: 8005, description: 'Product Graph & RAG outfit generator', status: 'checking' },
  { name: 'Guardrail Service', port: 8006, description: 'DPDP compliance, PII filtering & explainability', status: 'checking' },
];

export const HealthDashboard: React.FC<HealthDashboardProps> = ({ isOpen, onClose }) => {
  const [services, setServices] = useState<ServiceHealth[]>(INITIAL_SERVICES);
  const [lastCheck, setLastCheck] = useState<string>('');

  const checkHealth = async () => {
    setServices((prev) => prev.map((s) => ({ ...s, status: 'checking' })));
    setLastCheck(new Date().toLocaleTimeString());

    const updated = await Promise.all(
      INITIAL_SERVICES.map(async (svc) => {
        try {
          const res = await fetch(`http://localhost:${svc.port}/health`, { method: 'GET' });
          if (res.ok) {
            const data = await res.json();
            return {
              ...svc,
              status: 'healthy' as const,
              timestamp: data.timestamp,
              version: data.version,
            };
          } else {
            return { ...svc, status: 'unhealthy' as const };
          }
        } catch {
          return { ...svc, status: 'error' as const };
        }
      })
    );

    setServices(updated);
  };

  useEffect(() => {
    if (isOpen) {
      checkHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-xl">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-100">Microservices Health</h3>
                <p className="text-xs text-slate-400">Ports 8000 &ndash; 8006 System Monitor</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-4 mb-4">
            <span className="text-xs text-slate-400">Last checked: {lastCheck || 'Checking...'}</span>
            <button
              onClick={checkHealth}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 rounded-lg text-xs font-medium transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-check
            </button>
          </div>

          {/* Microservices List */}
          <div className="space-y-4">
            {services.map((svc) => (
              <div
                key={svc.name}
                className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{svc.name}</h4>
                    <span className="text-[11px] text-slate-500 font-mono">Port {svc.port}</span>
                  </div>
                  {svc.status === 'healthy' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Online
                    </span>
                  )}
                  {svc.status === 'unhealthy' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" /> Degraded
                    </span>
                  )}
                  {svc.status === 'checking' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 bg-slate-800 text-slate-400 rounded-full animate-pulse">
                      Checking...
                    </span>
                  )}
                  {svc.status === 'error' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full">
                      <XCircle className="w-3.5 h-3.5" /> Offline
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-normal">{svc.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 text-center text-xs text-slate-500 font-mono">
          NowCart Microservice Gateway Topology v0.1.0
        </div>
      </div>
    </div>
  );
};
