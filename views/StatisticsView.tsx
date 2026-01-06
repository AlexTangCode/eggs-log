
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { Hen, EggLog } from '../types';
import { Scale, Egg, TrendingUp, Edit3, Trash2, X, Clock, ListFilter, Hash, CheckCircle, AlertTriangle, Trophy, CalendarDays, ArrowUpRight, ArrowDownRight, CalendarRange } from 'lucide-react';
import { deleteEggLog, updateEggLogDetailed } from '../services/firebase';

interface StatisticsViewProps {
  hens: Hen[];
  logs: EggLog[];
  onRefresh?: () => void;
}

const LogItem: React.FC<{ 
  log: EggLog; 
  onDeleteRequest: (id: string) => void; 
  onEdit: (log: EggLog) => void 
}> = ({ log, onDeleteRequest, onEdit }) => {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, -20], [1, 0]);

  return (
    <div className="relative overflow-hidden rounded-[32px] mb-4">
      <motion.div 
        style={{ opacity }}
        className="absolute inset-0 bg-[#FFEBEE] flex items-center justify-end px-12 text-[#B66649] z-0"
      >
        <div className="flex flex-col items-center gap-1">
          <Trash2 size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider cn-relaxed">删除</span>
        </div>
      </motion.div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.05}
        onDragEnd={(_, info) => {
          if (info.offset.x < -100) {
            onDeleteRequest(log.id);
            x.set(0); 
          }
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
              <h5 className="font-bold text-[#2D2D2D] text-lg leading-tight tracking-tight cn-relaxed">{log.henName}</h5>
              {log.quantity > 1 && (
                <span className="text-[9px] bg-[#D48C45] text-white px-2 py-0.5 rounded-full font-bold">×{log.quantity}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-semibold text-[#A0A0A0] uppercase tracking-[0.1em] mt-2 opacity-80 cn-relaxed">
              <Clock size={11} />
              {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
              <div className="text-2xl font-bold text-[#2D2D2D] leading-none tabular-nums tracking-tighter">
                  {log.weight}<span className="text-[11px] ml-1 text-[#A0A0A0] uppercase">克</span>
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
  const [timeRange, setTimeRange] = useState<'month' | 'year'>('month');
  const [editingLog, setEditingLog] = useState<EggLog | null>(null);
  const [logToDeleteId, setLogToDeleteId] = useState<string | null>(null);
  const [showFullHistory, setShowFullHistory] = useState(false);
  
  const [editWeight, setEditWeight] = useState<number>(0);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');

  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const startOfCurrentYear = new Date(currentYear, 0, 1);
    
    const startOfPrevMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfPrevMonth = new Date(currentYear, currentMonth, 0);
    const startOfPrevYear = new Date(currentYear - 1, 0, 1);
    const endOfPrevYear = new Date(currentYear - 1, 11, 31, 23, 59, 59);

    const monthLogs = logs.filter(l => l.timestamp >= startOfCurrentMonth.getTime());
    const prevMonthLogs = logs.filter(l => l.timestamp >= startOfPrevMonth.getTime() && l.timestamp <= endOfPrevMonth.getTime());

    const yearLogs = logs.filter(l => l.timestamp >= startOfCurrentYear.getTime());
    const prevYearLogs = logs.filter(l => l.timestamp >= startOfPrevYear.getTime() && l.timestamp <= endOfPrevYear.getTime());

    const activeLogs = timeRange === 'month' ? monthLogs : yearLogs;
    
    const activeTotal: number = activeLogs.reduce((acc: number, l) => acc + (l.quantity || 1), 0);
    
    const prevTotal: number = timeRange === 'month' 
      ? prevMonthLogs.reduce((acc: number, l) => acc + (l.quantity || 1), 0)
      : prevYearLogs.reduce((acc: number, l) => acc + (l.quantity || 1), 0);

    const diff: number = activeTotal - prevTotal;
    const diffPercent = prevTotal > 0 ? Math.round((diff / prevTotal) * 100) : null;

    const totalEggs: number = logs.reduce((acc: number, l) => acc + (l.quantity || 1), 0);
    const totalWeight: number = logs.reduce((acc: number, l: EggLog) => acc + (Number(l.weight) * (Number(l.quantity) || 1)), 0);
    const avgWeight = totalEggs > 0 ? Math.round(totalWeight / totalEggs) : 0;

    const henCounts = activeLogs.reduce((acc, l) => {
      acc[l.henName] = (acc[l.henName] || 0) + (l.quantity || 1);
      return acc;
    }, {} as Record<string, number>);

    const rankings = Object.entries(henCounts)
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    let chartData;
    if (timeRange === 'month') {
      chartData = [...Array(14)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        const dateStr = d.toDateString();
        const count = logs
          .filter(l => new Date(l.timestamp).toDateString() === dateStr)
          .reduce((acc, l) => acc + (l.quantity || 1), 0);
        return {
          name: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          eggs: count
        };
      });
    } else {
      chartData = [...Array(12)].map((_, i) => {
        const monthStart = new Date(currentYear, i, 1);
        const monthEnd = new Date(currentYear, i + 1, 0, 23, 59, 59);
        const count = logs
          .filter(l => l.timestamp >= monthStart.getTime() && l.timestamp <= monthEnd.getTime())
          .reduce((acc, l) => acc + (l.quantity || 1), 0);
        return {
          name: monthStart.toLocaleDateString([], { month: 'short' }),
          eggs: count
        };
      });
    }

    return { 
      activeTotal, 
      totalEggs, 
      avgWeight, 
      chartData, 
      rankings, 
      diffPercent 
    };
  }, [logs, timeRange]);

  const handleDeleteLog = async () => {
    if (!logToDeleteId) return;
    try {
      await deleteEggLog(logToDeleteId);
      setLogToDeleteId(null);
      onRefresh?.();
    } catch (e) {
      console.error(e);
      setLogToDeleteId(null);
    }
  };

  const handleUpdateLog = async () => {
    if (!editingLog) return;
    try {
      const newTimestamp = new Date(`${editDate}T${editTime}`).getTime();
      await updateEggLogDetailed(editingLog.id, {
        weight: Number(editWeight),
        quantity: Number(editQuantity),
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
      <header className="mb-10 flex flex-col gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-[#2D2D2D] tracking-tighter font-serif">产蛋实验室</h1>
          <p className="text-[#A0A0A0] text-[10px] mt-2 uppercase tracking-[0.4em] font-semibold cn-relaxed opacity-60">历史与分析</p>
        </div>

        <div className="bg-white p-1.5 rounded-[24px] border border-[#E5D3C5]/20 shadow-[0_4px_20px_rgba(45,45,45,0.02)] flex relative overflow-hidden">
          <motion.div 
            layoutId="range-bg"
            className="absolute top-1.5 bottom-1.5 bg-[#D48C45] rounded-[18px]"
            initial={false}
            animate={{ 
              left: timeRange === 'month' ? '6px' : '50%',
              right: timeRange === 'month' ? '50%' : '6px'
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
          <button 
            onClick={() => setTimeRange('month')}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider relative z-10 transition-colors cn-relaxed ${timeRange === 'month' ? 'text-white' : 'text-[#A0A0A0]'}`}
          >
            月度
          </button>
          <button 
            onClick={() => setTimeRange('year')}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider relative z-10 transition-colors cn-relaxed ${timeRange === 'year' ? 'text-white' : 'text-[#A0A0A0]'}`}
          >
            年度
          </button>
        </div>
      </header>

      <div className="bg-white p-10 rounded-[48px] border border-[#E5D3C5]/20 shadow-[0_30px_70px_rgba(45,45,45,0.04)] mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D48C45]/5 rounded-full -translate-y-12 translate-x-12" />
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#D48C45]/10 rounded-2xl flex items-center justify-center text-[#D48C45]">
            {timeRange === 'month' ? <CalendarDays size={20} /> : <CalendarRange size={20} />}
          </div>
          <span className="text-[11px] font-bold text-[#D48C45] uppercase tracking-wider cn-relaxed">
            {timeRange === 'month' ? '月度产量' : '年度产量'}
          </span>
        </div>

        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-6xl font-bold text-[#2D2D2D] tracking-tighter tabular-nums leading-none">
              {stats.activeTotal}
            </div>
            <p className="text-[#A0A0A0] text-[11px] font-semibold uppercase tracking-wider mt-3 cn-relaxed opacity-70">
              {timeRange === 'month' ? '本月共计' : '本年共计'}
            </p>
          </div>
          {stats.diffPercent !== null && (
            <div className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-wider ${
              stats.diffPercent >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {stats.diffPercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(stats.diffPercent)}%
            </div>
          )}
        </div>

        <div className="h-[2px] w-full bg-[#F9F5F0] mb-8" />

        <div className="flex justify-around items-center">
          <div className="text-center">
             <span className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1 cn-relaxed">终身总计</span>
             <div className="text-xl font-bold text-[#2D2D2D] tabular-nums">{stats.totalEggs}</div>
          </div>
          <div className="w-[1px] h-8 bg-[#E5D3C5]/30" />
          <div className="text-center">
             <span className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1 cn-relaxed">平均重量</span>
             <div className="text-xl font-bold text-[#2D2D2D] tabular-nums">{stats.avgWeight}克</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[48px] border border-[#E5D3C5]/20 shadow-[0_20px_50px_rgba(45,45,45,0.02)] mb-8">
        <div className="flex items-center justify-between mb-8">
          <span className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider flex items-center gap-2 cn-relaxed">
            <Trophy size={14} className="text-[#D48C45]" /> {timeRange === 'month' ? '月度产蛋榜' : '年度产蛋榜'}
          </span>
        </div>

        {stats.rankings.length > 0 ? (
          <div className="space-y-6">
            {stats.rankings.map((hen, idx) => (
              <div key={hen.name} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                  idx === 0 ? 'bg-[#D48C45] text-white' : 'bg-[#F9F5F0] text-[#A0A0A0]'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-[#2D2D2D] cn-relaxed">{hen.name}</span>
                    <span className="text-sm font-bold text-[#D48C45] tabular-nums">{hen.count} 枚</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#F9F5F0] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(hen.count / stats.rankings[0].count) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-[#D48C45] rounded-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#A0A0A0] text-sm italic text-center py-4 cn-relaxed">该时间段内暂无记录。</p>
        )}
      </div>

      <div className="bg-white p-10 rounded-[48px] border border-[#E5D3C5]/20 shadow-[0_30px_70px_rgba(45,45,45,0.04)] mb-12 overflow-hidden">
        <div className="flex items-center justify-between mb-12">
          <span className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider cn-relaxed">
            {timeRange === 'month' ? '14天产量趋势' : '年度分布情况'}
          </span>
          <TrendingUp size={18} className="text-[#D48C45] opacity-50" />
        </div>
        <div className="h-48 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            {timeRange === 'month' ? (
              <AreaChart data={stats.chartData}>
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
                  cursor={{ stroke: '#D48C45', strokeWidth: 1, strokeDasharray: '5 5' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 15px 45px rgba(45,45,45,0.1)', backgroundColor: '#FFFFFF', padding: '16px' }} 
                />
                <Area type="monotone" dataKey="eggs" stroke="#D48C45" strokeWidth={4} fillOpacity={1} fill="url(#farmTrend)" />
              </AreaChart>
            ) : (
              <BarChart data={stats.chartData} barSize={12}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F9F5F0" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#A0A0A0', fontWeight: 600 }} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 15px 45px rgba(45,45,45,0.1)', backgroundColor: '#FFFFFF', padding: '16px' }} 
                />
                <Bar dataKey="eggs" radius={[6, 6, 0, 0]}>
                  {stats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === new Date().getMonth() ? '#D48C45' : '#E5D3C5'} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-8 flex items-center justify-between px-2">
        <p className="text-[#A0A0A0] text-[11px] uppercase tracking-wider font-bold flex items-center gap-2 cn-relaxed">
           <ListFilter size={14} /> 产蛋日志
        </p>
        {logs.length > 10 && (
          <button 
            onClick={() => setShowFullHistory(!showFullHistory)}
            className="text-[10px] font-bold text-[#D48C45] uppercase tracking-wider bg-[#D48C45]/10 px-5 py-2 rounded-full active:scale-95 transition-transform cn-relaxed"
          >
            {showFullHistory ? "收起" : "展开全部"}
          </button>
        )}
      </div>

      <div className="mb-20">
        <AnimatePresence initial={false}>
          {logs.length === 0 ? (
            <div className="text-center py-24 bg-white/40 rounded-[48px] border border-dashed border-[#E5D3C5]/40 text-[#A0A0A0] italic text-sm font-medium cn-relaxed">
              日志目前为空。
            </div>
          ) : (
            displayedLogs.map((log) => (
              <LogItem 
                key={log.id} 
                log={log} 
                onDeleteRequest={(id) => setLogToDeleteId(id)} 
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
      </div>

      <AnimatePresence>
        {logToDeleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-[#2D2D2D]/20 backdrop-blur-3xl flex items-center justify-center p-8">
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[44px] w-full max-sm p-10 shadow-2xl relative border border-[#E5D3C5]/20 text-center">
              <div className="w-16 h-16 bg-[#B66649]/10 rounded-[28px] flex items-center justify-center text-[#B66649] mx-auto mb-6"><AlertTriangle size={32} /></div>
              <h2 className="font-serif text-2xl font-bold text-[#2D2D2D] mb-4 tracking-tighter">确认删除记录？</h2>
              <p className="text-sm text-[#A0A0A0] leading-relaxed mb-8 font-medium cn-relaxed">该记录将从日志中永久移除。</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setLogToDeleteId(null)} className="py-4 bg-[#F9F5F0] text-[#2D2D2D] rounded-[24px] font-bold text-sm active:scale-95 cn-relaxed">取消</button>
                <button onClick={handleDeleteLog} className="py-4 bg-[#D48C45] text-white rounded-[24px] font-bold text-sm shadow-lg shadow-[#D48C45]/20 active:scale-95 cn-relaxed">删除</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingLog && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] bg-[#2D2D2D]/20 backdrop-blur-3xl flex items-center justify-center p-8">
                <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[44px] w-full max-w-md p-12 shadow-2xl relative border border-[#E5D3C5]/20">
                    <button onClick={() => setEditingLog(null)} className="absolute top-10 right-10 text-gray-300 hover:text-[#2D2D2D] transition-colors"><X size={24} /></button>
                    <h2 className="text-3xl font-bold text-[#2D2D2D] mb-12 tracking-tighter font-serif">修改记录</h2>
                    <div className="space-y-10">
                        <div>
                            <div className="flex items-center justify-between mb-5 px-1">
                              <label className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider flex items-center gap-2 cn-relaxed"><Scale size={14} /> 重量 (克)</label>
                              <span className="text-4xl font-bold text-[#D48C45] tabular-nums tracking-tighter">{editWeight}</span>
                            </div>
                            <input type="range" min="30" max="90" value={editWeight} onChange={(e) => setEditWeight(parseInt(e.target.value))} className="w-full h-1.5 bg-[#F9F5F0] rounded-full appearance-none cursor-pointer" />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                           <div>
                              <label className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-3 px-1 cn-relaxed"><Hash size={14} /> 数量</label>
                              <select value={editQuantity} onChange={(e) => setEditQuantity(parseInt(e.target.value))} className="w-full p-5 bg-[#F9F5F0]/60 border border-[#E5D3C5]/30 rounded-2xl outline-none font-bold text-sm text-[#2D2D2D] appearance-none">
                                {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                              </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-3 px-1 cn-relaxed">日期</label>
                                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full p-5 bg-[#F9F5F0]/60 border border-[#E5D3C5]/30 rounded-2xl outline-none font-bold text-[11px] text-[#2D2D2D]" />
                            </div>
                        </div>
                        <button onClick={handleUpdateLog} className="w-full py-6 bg-[#D48C45] text-white rounded-[32px] font-bold text-lg shadow-2xl shadow-[#D48C45]/25 active:scale-95 flex items-center justify-center gap-3 cn-relaxed">
                            <CheckCircle size={22} /> 保存修改
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
