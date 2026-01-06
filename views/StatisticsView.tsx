import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Hen, EggLog } from '../types';
// Added missing CheckCircle import from lucide-react to resolve "Cannot find name 'CheckCircle'" error
import { Scale, Egg, TrendingUp, Edit3, Trash2, X, Clock, ListFilter, Hash, ChevronRight, CheckCircle } from 'lucide-react';
import { deleteEggLog, updateEggLogDetailed } from '../services/firebase';

interface StatisticsViewProps {
  hens: Hen[];
  logs: EggLog[];
  onRefresh?: () => void;
}

const LogItem: React.FC<{ 
  log: EggLog; 
  onDelete: (id: string) => void; 
  onEdit: (log: EggLog) => void 
}> = ({ log, onDelete, onEdit }) => {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, -20], [1, 0]);

  return (
    <div className="relative overflow-hidden rounded-[32px] mb-4">
      {/* Swipe Background */}
      <motion.div 
        style={{ opacity }}
        className="absolute inset-0 bg-[#FFEBEE] flex items-center justify-end px-12 text-[#B66649] z-0"
      >
        <div className="flex flex-col items-center gap-1">
          <Trash2 size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Delete</span>
        </div>
      </motion.div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.05}
        onDragEnd={(_, info) => {
          if (info.offset.x < -100) onDelete(log.id);
        }}
        style={{ x }}
        className="bg-white p-6 rounded-[32px] border border-[#E5D3C5]/20 flex items-center justify-between shadow-[0_15px_40px_rgba(45,45,45,0.015)] relative z-10 touch-pan-x"
      >
        <div className="flex items-center gap-5 flex-1">
          <div className="w-14 h-14 bg-[#F9F5F0] rounded-[24px] flex items-center justify-center text-[#D48C45] border border-[#E5D3C5]/20">
             <Egg size={24} fill="currentColor" stroke="none" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h5 className="font-bold text-[#2D2D2D] text-lg leading-tight tracking-tight">{log.henName}</h5>
              {log.quantity > 1 && (
                <span className="text-[10px] bg-[#D48C45] text-white px-2 py-0.5 rounded-full font-black">×{log.quantity}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-[#A0A0A0] uppercase tracking-[0.2em] mt-2 opacity-80">
              <Clock size={11} />
              {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
              <div className="text-2xl font-black text-[#2D2D2D] leading-none tabular-nums tracking-tighter">
                  {log.weight}<span className="text-[10px] ml-1 text-[#A0A0A0] uppercase">G</span>
              </div>
          </div>
          <button 
            onClick={() => onEdit(log)} 
            className="p-3 text-gray-200 hover:text-[#D48C45] transition-colors border-l border-[#F9F5F0] pl-6"
          >
            <Edit3 size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const StatisticsView: React.FC<StatisticsViewProps> = ({ hens, logs, onRefresh }) => {
  const [editingLog, setEditingLog] = useState<EggLog | null>(null);
  const [showFullHistory, setShowFullHistory] = useState(false);
  
  const [editWeight, setEditWeight] = useState<number>(0);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');

  const globalStats = useMemo(() => {
    const totalEggs = logs.reduce((acc, l) => acc + (l.quantity || 1), 0);
    const totalWeight = logs.reduce((acc, l) => acc + (l.weight * (l.quantity || 1)), 0);
    const avgWeight = totalEggs > 0 ? Math.round(totalWeight / totalEggs) : 0;
    
    const dailyCounts: Record<string, number> = {};
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toDateString();
    }).reverse();

    last7Days.forEach(dateStr => {
      dailyCounts[dateStr] = logs
        .filter(l => new Date(l.timestamp).toDateString() === dateStr)
        .reduce((acc, l) => acc + (l.quantity || 1), 0);
    });

    const chartData = last7Days.map(dateStr => ({
      name: dateStr.split(' ')[1] + ' ' + dateStr.split(' ')[2],
      eggs: dailyCounts[dateStr]
    }));

    return { total: totalEggs, avgWeight, chartData };
  }, [logs]);

  const handleDeleteLog = async (id: string) => {
    if (!id) return;
    try {
      await deleteEggLog(id);
      onRefresh?.();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateLog = async () => {
    if (!editingLog) return;
    try {
      const newTimestamp = new Date(`${editDate}T${editTime}`).getTime();
      await updateEggLogDetailed(editingLog.id, {
        weight: editWeight,
        quantity: editQuantity,
        timestamp: newTimestamp
      });
      setEditingLog(null);
      onRefresh?.();
    } catch (e) {
      console.error(e);
    }
  };

  const displayedLogs = showFullHistory ? logs : logs.slice(0, 10);

  return (
    <div className="p-10 pb-44 min-h-full bg-[#F9F5F0] scroll-native overflow-y-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-[#2D2D2D] tracking-tighter">Production Lab</h1>
        <p className="text-[#A0A0A0] text-[10px] mt-2 uppercase tracking-[0.5em] font-black">History & Analytics</p>
      </header>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 gap-5 mb-10">
        <div className="bg-white p-8 rounded-[40px] border border-[#E5D3C5]/20 shadow-[0_20px_50px_rgba(45,45,45,0.02)]">
          <div className="w-12 h-12 bg-[#D48C45]/10 rounded-[20px] flex items-center justify-center text-[#D48C45] mb-6">
            <Egg size={24} />
          </div>
          <span className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-widest block mb-2">Total Harvest</span>
          <div className="text-5xl font-black text-[#2D2D2D] tracking-tighter tabular-nums">{globalStats.total}</div>
        </div>
        <div className="bg-white p-8 rounded-[40px] border border-[#E5D3C5]/20 shadow-[0_20px_50px_rgba(45,45,45,0.02)]">
          <div className="w-12 h-12 bg-[#D48C45]/10 rounded-[20px] flex items-center justify-center text-[#D48C45] mb-6">
            <Scale size={24} />
          </div>
          <span className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-widest block mb-2">Avg. Mass</span>
          <div className="text-5xl font-black text-[#2D2D2D] tracking-tighter tabular-nums">{globalStats.avgWeight}<span className="text-[14px] ml-1 uppercase text-[#A0A0A0]">G</span></div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-10 rounded-[48px] border border-[#E5D3C5]/20 shadow-[0_30px_70px_rgba(45,45,45,0.04)] mb-12 overflow-hidden">
        <div className="flex items-center justify-between mb-12">
          <span className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-[0.4em]">Yield Velocity</span>
          <TrendingUp size={18} className="text-[#D48C45] opacity-50" />
        </div>
        <div className="h-48 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={globalStats.chartData}>
              <defs>
                <linearGradient id="farmTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D48C45" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#D48C45" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F9F5F0" />
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#A0A0A0', fontWeight: 600 }} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 15px 45px rgba(45,45,45,0.1)', backgroundColor: '#FFFFFF', padding: '16px' }} 
              />
              <Area type="monotone" dataKey="eggs" stroke="#D48C45" strokeWidth={4} fillOpacity={1} fill="url(#farmTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* List Header */}
      <div className="mb-8 flex items-center justify-between px-2">
        <p className="text-[#A0A0A0] text-[10px] uppercase tracking-[0.5em] font-black flex items-center gap-2">
           <ListFilter size={14} /> Log History
        </p>
        {logs.length > 10 && (
          <button 
            onClick={() => setShowFullHistory(!showFullHistory)}
            className="text-[10px] font-black text-[#D48C45] uppercase tracking-widest bg-[#D48C45]/10 px-5 py-2 rounded-full active:scale-95 transition-transform"
          >
            {showFullHistory ? "Hide Older" : "Show All"}
          </button>
        )}
      </div>

      {/* List Items */}
      <div className="mb-20">
        <AnimatePresence initial={false}>
          {logs.length === 0 ? (
            <div className="text-center py-24 bg-white/40 rounded-[48px] border border-dashed border-[#E5D3C5]/40 text-[#A0A0A0] italic text-xs font-medium">
              No historical records found.
            </div>
          ) : (
            displayedLogs.map((log) => (
              <LogItem 
                key={log.id} 
                log={log} 
                onDelete={handleDeleteLog} 
                onEdit={(l) => {
                  setEditingLog(l);
                  setEditWeight(l.weight);
                  setEditQuantity(l.quantity || 1);
                  const d = new Date(l.timestamp);
                  setEditDate(d.toISOString().split('T')[0]);
                  setEditTime(d.toTimeString().split(' ')[0].slice(0, 5));
                }} 
              />
            ))
          )}
        </AnimatePresence>
        {logs.length > 0 && (
          <p className="text-center text-[9px] text-[#A0A0A0] font-black uppercase tracking-[0.7em] mt-10 opacity-30">
            Swipe left to remove record
          </p>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingLog && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 z-[400] bg-[#2D2D2D]/20 backdrop-blur-3xl flex items-center justify-center p-8"
            >
                <motion.div 
                  initial={{ scale: 0.9, y: 30 }} 
                  animate={{ scale: 1, y: 0 }} 
                  className="bg-white rounded-[44px] w-full max-w-md p-12 shadow-2xl relative border border-[#E5D3C5]/20"
                >
                    <button onClick={() => setEditingLog(null)} className="absolute top-10 right-10 text-gray-300 hover:text-[#2D2D2D] transition-colors"><X size={24} /></button>
                    <h2 className="text-3xl font-bold text-[#2D2D2D] mb-12 tracking-tighter">Adjust Record</h2>
                    
                    <div className="space-y-10">
                        <div>
                            <div className="flex items-center justify-between mb-5 px-1">
                              <label className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-[0.3em] flex items-center gap-2">
                                <Scale size={14} /> Weight (Grams)
                              </label>
                              <span className="text-4xl font-black text-[#D48C45] tabular-nums">{editWeight}</span>
                            </div>
                            <input 
                                type="range" min="30" max="90" 
                                value={editWeight} 
                                onChange={(e) => setEditWeight(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-[#F9F5F0] rounded-full appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                           <div>
                              <label className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-[0.3em] block mb-3 px-1 flex items-center gap-2">
                                <Hash size={14} /> Count
                              </label>
                              <select 
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(parseInt(e.target.value))}
                                className="w-full p-5 bg-[#F9F5F0]/60 border border-[#E5D3C5]/30 rounded-2xl outline-none font-bold text-sm text-[#2D2D2D] appearance-none"
                              >
                                {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                              </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-[0.3em] block mb-3 px-1">Date</label>
                                <input 
                                    type="date" 
                                    value={editDate} 
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className="w-full p-5 bg-[#F9F5F0]/60 border border-[#E5D3C5]/30 rounded-2xl outline-none font-bold text-[11px] text-[#2D2D2D]"
                                />
                            </div>
                        </div>

                        <button 
                          onClick={handleUpdateLog}
                          className="w-full py-6 bg-[#D48C45] text-white rounded-[32px] font-bold text-xl shadow-2xl shadow-[#D48C45]/25 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <CheckCircle size={22} />
                            Save Changes
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatisticsView;