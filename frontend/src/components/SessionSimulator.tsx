import React, { useState } from 'react';
import { Play, Sparkles, Zap, Footprints, ShoppingBag } from 'lucide-react';
import { sendClickstreamEvent } from '../services/api';

interface SessionSimulatorProps {
  userId: string;
  onSessionUpdated: () => void;
}

export const SessionSimulator: React.FC<SessionSimulatorProps> = ({ userId, onSessionUpdated }) => {
  const [isSimulating, setIsSimulating] = useState(false);

  const handleRunScenario = async (
    _scenarioName: string,
    events: { productId: string; eventType: string; label: string }[]
  ) => {
    setIsSimulating(true);

    try {
      for (const evt of events) {
        await sendClickstreamEvent(userId, evt.productId, evt.eventType);
        // Small delay to visualize sequential processing
        await new Promise((r) => setTimeout(r, 200));
      }
      // Trigger feed refresh in parent component
      onSessionUpdated();
    } catch (err) {
      console.error('Session simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-teal-500/30 rounded-2xl p-5 shadow-2xl mb-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/15 border border-teal-500/30 text-teal-400 rounded-xl">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">
                Interactive Session Intent Simulator
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 rounded-full border border-teal-500/30">
                Live Session Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Simulate shopping activity sequences to trigger real-time intent shift for user{' '}
              <span className="font-mono text-teal-300 font-bold">{userId}</span>
            </p>
          </div>
        </div>

        {isSimulating && (
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-semibold animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> Updating Style Intent...
          </span>
        )}
      </div>

      {/* Preset Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        
        {/* Scenario 1 */}
        <div className="bg-slate-950/70 border border-slate-800 hover:border-teal-500/50 rounded-xl p-4 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <h4 className="font-semibold text-sm text-slate-100">Summer Evening Dresses</h4>
            </div>
            <p className="text-xs text-slate-400">
              Simulates viewing and adding a Floral Summer Dress + Strap top to cart.
            </p>
          </div>
          <button
            disabled={isSimulating}
            onClick={() =>
              handleRunScenario('dresses', [
                { productId: '0111565005', eventType: 'view', label: 'Viewed Floral Dress' },
                { productId: '0108775015', eventType: 'cart', label: 'Added Strap top' },
                { productId: '0111565005', eventType: 'cart', label: 'Added Floral Dress' },
              ])
            }
            className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-teal-500/10 hover:bg-teal-500/20 active:bg-teal-500/30 border border-teal-500/30 text-teal-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Simulate Dress Intent
          </button>
        </div>

        {/* Scenario 2 */}
        <div className="bg-slate-950/70 border border-slate-800 hover:border-teal-500/50 rounded-xl p-4 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Footprints className="w-4 h-4 text-teal-400" />
              <h4 className="font-semibold text-sm text-slate-100">Menswear &amp; Footwear</h4>
            </div>
            <p className="text-xs text-slate-400">
              Simulates viewing Leather Chelsea Boots + Chino Trousers.
            </p>
          </div>
          <button
            disabled={isSimulating}
            onClick={() =>
              handleRunScenario('footwear', [
                { productId: '0112000001', eventType: 'view', label: 'Viewed Chelsea Boots' },
                { productId: '0110065002', eventType: 'view', label: 'Viewed Chino Trousers' },
                { productId: '0112000001', eventType: 'cart', label: 'Added Boots to Cart' },
              ])
            }
            className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-teal-500/10 hover:bg-teal-500/20 active:bg-teal-500/30 border border-teal-500/30 text-teal-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Simulate Footwear Intent
          </button>
        </div>

        {/* Scenario 3 */}
        <div className="bg-slate-950/70 border border-slate-800 hover:border-teal-500/50 rounded-xl p-4 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-4 h-4 text-teal-400" />
              <h4 className="font-semibold text-sm text-slate-100">Living Room &amp; Accessories</h4>
            </div>
            <p className="text-xs text-slate-400">
              Simulates purchasing a Canvas Tote Bag and browsing denim jackets.
            </p>
          </div>
          <button
            disabled={isSimulating}
            onClick={() =>
              handleRunScenario('living_room', [
                { productId: '0112000008', eventType: 'view', label: 'Viewed Canvas Tote' },
                { productId: '0112000008', eventType: 'purchase', label: 'Purchased Tote' },
                { productId: '0111565001', eventType: 'view', label: 'Viewed Denim Jacket' },
              ])
            }
            className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-teal-500/10 hover:bg-teal-500/20 active:bg-teal-500/30 border border-teal-500/30 text-teal-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Simulate Accessory Intent
          </button>
        </div>

      </div>
    </div>
  );
};
