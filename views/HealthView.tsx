
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Sparkles, RefreshCcw, Info, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { Hen, EggLog } from '../types';
import { getSmartInsights } from '../services/geminiService';
import HenGraphic from '../components/HenGraphic';

interface HealthViewProps {
  hens: Hen[];
  logs: EggLog[];
}

const HealthView: React.FC<HealthViewProps> = ({ hens, logs }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const healthData = useMemo(() => {
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const fiveDays = 5 * 24 * 60 * 60 * 1000;

    return hens.map(hen => {
      const henLogs = logs.filter(l => l.henId === hen.id).sort((a, b) => b.timestamp - a.timestamp);
      const lastLay = henLogs[0]?.timestamp || 0;
      const daysSince = lastLay ? (now - lastLay) : Infinity;

      let status: 'Optimal' | 'Observation' | 'Critical' = 'Optimal';
      if (daysSince >= fiveDays) status = 'Critical';
      else if (daysSince >= threeDays) status = 'Observation';

      let weightTrend: 'stable' | 'down' | 'up' = 'stable';
      if (henLogs.length >= 2) {
        const diff = henLogs[0].weight - henLogs[1].weight;
        if (diff < -5) weightTrend = 'down';
        else if (diff > 5) weightTrend = 'up';
      }

      return { hen, status, lastLay, weightTrend, daysSince };
    });
  }, [hens, logs]);

  const fetchAdvice = async () => {
    setLoading(true);
    const text = await getSmartInsights(hens, logs);
    setAdvice(text);
    setLoading(false);
  };

  useEffect(() => {
    if (hens.length > 0) fetchAdvice();
  }, [hens.length]);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'Optimal': return <div className="px-3 py-1 rounded-full bg-[#B66649]/10 text-[#B66649] text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"><CheckCircle size={10} /> Active</div>;
      case 'Observation': return <div className="px-3 py-1 rounded-full bg-[#C2974D]/10 text-[#C2974D] text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"><AlertCircle size={10} /> Passive</div>;
      case 'Critical': return <div className="px-3 py-1 rounded-full bg-[#B66649]/20 text-[#B66649] text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"><AlertCircle size={10} /> Stalled</div>;
      default: return null;
    }
  };

  return (
    <div className="p-10 pb-36 min-h-full bg-[#F9F5F0]">
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-[#2D2D2D] tracking-tighter">Health Lab</h1>
          <p className="text-[#A0A0A0] text-[10px] mt-2 uppercase tracking-[0.4em] font-black">AI Diagnostics</p>
        </div>
        <Activity size={32} className="text-[#D48C45] opacity-20" />
      </div>

      {/* AI Block */}
      <div className="bg-white rounded-[40px] p-8 mb-12 shadow-[0_25px_60px_rgba(45,45,45,0.03)] border border-[#E5D3C5]/20 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-8 relative z-10">
          <div className="w-9 h-9 bg-[#D48C45]/10 rounded-2xl flex items-center justify-center text-[#D48C45]">
            <Sparkles size={18} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D48C45]">Gemini Insights</span>
          <button onClick={fetchAdvice} disabled={loading} className="ml-auto text-[#A0A0A0] hover:text-[#D48C45] transition-colors">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-3 bg-[#F9F5F0] rounded-full w-full animate-pulse"></div>
            <div className="h-3 bg-[#F9F5F0] rounded-full w-11/12 animate-pulse"></div>
            <div className="h-3 bg-[#F9F5F0] rounded-full w-2/3 animate-pulse"></div>
          </div>
        ) : (
          <p className="text-xl font-light leading-relaxed text-[#2D2D2D] italic relative z-10">
            "{advice || 'Observing flock behavior for analysis...'}"
          </p>
        )}
      </div>

      <div className="mb-8">
        <p className="text-[#A0A0A0] text-[10px] uppercase tracking-[0.4em] font-black">Coop Status Cards</p>
      </div>

      <div className="space-y-6">
        {healthData.map(({ hen, status, weightTrend, daysSince }) => (
          <motion.div 
            key={hen.id} 
            className="bg-white p-7 rounded-[32px] border border-[#E5D3C5]/20 shadow-[0_20px_45px_rgba(45,45,45,0.02)] relative overflow-hidden group"
            whileHover={{ y: -6, shadow: "0 30px 60px rgba(45,45,45,0.05)" }}
          >
            <div className={`absolute top-0 right-0 w-2.5 h-full ${
              status === 'Optimal' ? 'bg-[#D48C45]' : status === 'Observation' ? 'bg-[#C2974D]' : 'bg-[#B66649]'
            } opacity-20`} />
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[24px] bg-[#F9F5F0] flex items-center justify-center border border-[#E5D3C5]/20">
                  <HenGraphic color={hen.color} size={65} />
                </div>
                <div>
                  <h4 className="font-bold text-[#2D2D2D] text-xl leading-tight tracking-tight">{hen.name}</h4>
                  <div className="mt-2">{statusBadge(status)}</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-[#A0A0A0] uppercase tracking-[0.2em] block mb-1">Growth</span>
                <div className={`text-xs font-black uppercase tracking-widest ${
                  weightTrend === 'down' ? 'text-[#B66649]' : weightTrend === 'up' ? 'text-[#D48C45]' : 'text-[#A0A0A0]'
                }`}>
                  {weightTrend}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-[#F9F5F0] text-[10px]">
              <span className="text-[#A0A0A0] font-bold uppercase tracking-widest">
                {daysSince === Infinity ? 'Initial cycle' : `${Math.floor(daysSince / 86400000)} Days idle`}
              </span>
              <button className="flex items-center gap-1.5 text-[#D48C45] font-black uppercase tracking-widest hover:opacity-70 transition-opacity">
                <Info size={14} /> Reports
              </button>
            </div>
          </motion.div>
        ))}
        
        {hens.length === 0 && (
          <div className="text-center py-20 bg-white/40 rounded-[40px] border border-dashed border-[#E5D3C5]/40">
            <HelpCircle size={32} className="mx-auto text-[#A0A0A0] mb-4 opacity-20" />
            <p className="text-[#A0A0A0] font-black text-[10px] tracking-[0.4em] uppercase">No hens registered</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthView;
