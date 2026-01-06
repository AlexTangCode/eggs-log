
import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, BarChart3, TrendingUp, RefreshCcw, Trophy, HeartPulse, Zap } from 'lucide-react';
import { Hen, EggLog } from '../types';
import { getSmartInsights } from '../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

interface InsightsViewProps {
  hens: Hen[];
  logs: EggLog[];
}

const InsightsView: React.FC<InsightsViewProps> = ({ hens, logs }) => {
  const [insightText, setInsightText] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    if (hens.length === 0) return;
    setLoading(true);
    const text = await getSmartInsights(hens, logs);
    setInsightText(text);
    setLoading(false);
  };

  useEffect(() => { fetchInsights(); }, [hens.length]);

  const flockAnalytics = useMemo(() => {
    if (hens.length === 0) return null;
    const eggCounts: Record<string, number> = {};
    logs.forEach(log => { eggCounts[log.henId] = (eggCounts[log.henId] || 0) + 1; });
    let topHenId = ''; let maxEggs = 0;
    Object.entries(eggCounts).forEach(([id, count]) => { if (count > maxEggs) { maxEggs = count; topHenId = id; } });
    const starPerformer = hens.find(h => h.id === topHenId);
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const alertingHens = hens.filter(hen => {
      const henLogs = logs.filter(l => l.henId === hen.id);
      return henLogs.length === 0 || henLogs[0].timestamp < threeDaysAgo;
    });
    return {
      starPerformer: starPerformer?.name || '-',
      starCount: maxEggs,
      alertCount: alertingHens.length
    };
  }, [hens, logs]);

  const chartData = useMemo(() => {
    return [...Array(10)].map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (9 - i));
      return { name: d.toLocaleDateString([], { month: 'short', day: 'numeric' }), count: logs.filter(l => new Date(l.timestamp).toDateString() === d.toDateString()).length };
    });
  }, [logs]);

  return (
    <div className="p-8 pb-32 min-h-full bg-[#FFF8E1]">
      <h1 className="text-4xl font-light text-gray-800 mb-8 tracking-tight">Insights</h1>

      {/* Highlights Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <motion.div whileHover={{ y: -2 }} className="bg-white p-6 rounded-[32px] shadow-[0_10px_20px_rgba(0,0,0,0.02)] text-center border border-white/40">
          <Trophy size={28} className="text-orange-300 mx-auto mb-3" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 block mb-1">Star</span>
          <div className="font-bold text-gray-800 truncate">{flockAnalytics?.starPerformer}</div>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="bg-white p-6 rounded-[32px] shadow-[0_10px_20px_rgba(0,0,0,0.02)] text-center border border-white/40">
          <HeartPulse size={28} className={`${flockAnalytics?.alertCount ? 'text-red-300' : 'text-green-300'} mx-auto mb-3`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 block mb-1">Alerts</span>
          <div className="font-bold text-gray-800">{flockAnalytics?.alertCount || 'Flock OK'}</div>
        </motion.div>
      </div>

      {/* AI Block - Frosted Minimalist */}
      <div className="bg-white rounded-[32px] p-8 mb-8 shadow-[0_15px_30px_rgba(0,0,0,0.03)] border border-white/50 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500">
            <Sparkles size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">AI Flock Report</span>
          <button onClick={fetchInsights} disabled={loading} className="ml-auto text-gray-200 hover:text-orange-400">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-3 bg-gray-50 rounded w-3/4"></div>
            <div className="h-3 bg-gray-50 rounded w-full"></div>
            <div className="h-3 bg-gray-50 rounded w-2/3"></div>
          </div>
        ) : (
          <p className="text-lg font-light leading-relaxed text-gray-600 italic">
            "{insightText || 'Connecting to Gemini for your daily report...'}"
          </p>
        )}
      </div>

      {/* Chart Section - Ensure stable height and min-width for Recharts */}
      <div className="bg-white p-8 rounded-[32px] shadow-[0_15px_30px_rgba(0,0,0,0.03)] border border-white/50">
        <div className="flex items-center justify-between mb-8">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Daily Production</span>
          <TrendingUp size={16} className="text-gray-200" />
        </div>
        <div className="h-44 w-full relative min-h-[176px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
            <AreaChart data={chartData}>
              <defs><linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FB923C" stopOpacity={0.1}/><stop offset="95%" stopColor="#FB923C" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8' }} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }} />
              <Area type="monotone" dataKey="count" stroke="#FB923C" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default InsightsView;
