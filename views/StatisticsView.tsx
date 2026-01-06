
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { Hen, EggLog, Expense, ExpenseCategory } from '../types';
import { 
  Scale, Egg, TrendingUp, Edit3, Trash2, X, Clock, ListFilter, Hash, 
  CheckCircle, AlertTriangle, Trophy, CalendarDays, Coins, 
  ReceiptText, ChevronLeft, ChevronRight, Save, Loader2
} from 'lucide-react';
import { 
  deleteEggLog, updateEggLogDetailed, getGlobalSettings, updateGlobalSettings 
} from '../services/firebase';

interface StatisticsViewProps {
  hens: Hen[];
  logs: EggLog[];
  expenses: Expense[];
  onRefresh?: () => void;
}

const LogItem: React.FC<{ 
  log: EggLog; 
  henName: string;
  onDeleteRequest: (id: string) => void; 
  onEdit: (log: EggLog) => void 
}> = ({ log, henName, onDeleteRequest, onEdit }) => {
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
              <h5 className="font-bold text-[#2D2D2D] text-lg leading-tight tracking-tight cn-relaxed">{henName}</h5>
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

const StatisticsView: React.FC<StatisticsViewProps> = ({ hens, logs, expenses, onRefresh }) => {
  const [timeRange, setTimeRange] = useState<'month' | 'year' | 'all'>('month');
  const [offset, setOffset] = useState(0); 
  
  const [editingLog, setEditingLog] = useState<EggLog | null>(null);
  const [logToDeleteId, setLogToDeleteId] = useState<string | null>(null);
  const [showFullHistory, setShowFullHistory] = useState(false);
  
  const [eggPrice, setEggPrice] = useState(1.5);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const [editWeight, setEditWeight] = useState<number>(0);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Initial load of global settings
  useEffect(() => {
    getGlobalSettings().then(settings => {
      if (settings && settings.eggPrice) {
        setEggPrice(settings.eggPrice);
      }
    });
  }, []);

  // Map hen ID to its current name for consistent display
  const henNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    hens.forEach(h => { map[h.id] = h.name; });
    return map;
  }, [hens]);

  // Auto-save logic for eggPrice
  const handlePriceChange = (newPrice: number) => {
    setEggPrice(newPrice);
    setSaveStatus('saving');
    
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    
    debounceTimeout.current = setTimeout(async () => {
      try {
        await updateGlobalSettings({ eggPrice: newPrice });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        console.error("Auto-save failed", e);
        setSaveStatus('idle');
      }
    }, 800);
  };

  const periodLabel = useMemo(() => {
    const d = new Date();
    if (timeRange === 'all') return '所有时间';
    
    if (timeRange === 'month') {
      d.setMonth(d.getMonth() + offset);
      return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
    } else {
      d.setFullYear(d.getFullYear() + offset);
      return `${d.getFullYear()} 年度`;
    }
  }, [timeRange, offset]);

  const activeWindow = useMemo(() => {
    if (timeRange === 'all') return null;
    
    const start = new Date();
    const end = new Date();
    
    if (timeRange === 'month') {
      start.setMonth(start.getMonth() + offset);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      
      end.setMonth(start.getMonth() + 1);
      end.setDate(1);
      end.setHours(0, 0, 0, 0);
    } else {
      start.setFullYear(start.getFullYear() + offset);
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      
      end.setFullYear(start.getFullYear() + 1);
      end.setMonth(0, 1);
      end.setHours(0, 0, 0, 0);
    }
    
    return { start: start.getTime(), end: end.getTime() };
  }, [timeRange, offset]);

  const stats = useMemo(() => {
    let activeLogs = logs;
    let activeExpenses = expenses;

    if (activeWindow) {
      activeLogs = logs.filter(l => l.timestamp >= activeWindow.start && l.timestamp < activeWindow.end);
      activeExpenses = expenses.filter(e => e.timestamp >= activeWindow.start && e.timestamp < activeWindow.end);
    }
    
    const activeTotal: number = activeLogs.reduce((acc: number, l) => acc + (l.quantity || 1), 0);
    const totalEggs: number = logs.reduce((acc: number, l) => acc + (l.quantity || 1), 0);
    const totalWeight: number = logs.reduce((acc: number, l: EggLog) => acc + (Number(l.weight) * (Number(l.quantity) || 1)), 0);
    const avgWeight = totalEggs > 0 ? Math.round(totalWeight / totalEggs) : 0;

    const totalExp = activeExpenses.reduce((acc, e) => acc + e.amount, 0);
    const totalRev = activeTotal * eggPrice;
    const netProfit = totalRev - totalExp;
    const costPerEgg = activeTotal > 0 ? (totalExp / activeTotal).toFixed(2) : '0.00';

    const expByCategory = activeExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(expByCategory).map(([name, value]) => ({ name, value }));

    // Grouping by henId ensures that renaming a hen doesn't split their statistics
    const henCounts = activeLogs.reduce((acc, l) => {
      const id = l.henId;
      acc[id] = (acc[id] || 0) + (l.quantity || 1);
      return acc;
    }, {} as Record<string, number>);

    const rankings = Object.entries(henCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({ 
        id, 
        name: henNameMap[id] || '已移除的母鸡', // Fallback name if hen was deleted
        count 
      }));

    return { 
      activeLogs,
      activeTotal, 
      totalEggs, 
      avgWeight, 
      rankings, 
      totalExp,
      totalRev,
      netProfit,
      costPerEgg,
      pieData
    };
  }, [logs, expenses, activeWindow, timeRange, eggPrice, henNameMap]);

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

  const displayedLogs = showFullHistory ? stats.activeLogs : stats.activeLogs.slice(0, 10);

  const getRangeBgStyle = () => {
    switch (timeRange) {
      case 'month': return { left: '6px', width: 'calc(33.33% - 6px)' };
      case 'year': return { left: '33.33%', width: '33.33%' };
      case 'all': return { left: '66.66%', width: 'calc(33.33% - 6px)' };
      default: return { left: '6px', width: 'calc(33.33% - 6px)' };
    }
  };

  return (
    <div className="p-10 pb-44 min-h-full bg-[#F9F5F0] scroll-native overflow-y-auto">
      <header className="mb-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-[#2D2D2D] tracking-tighter font-serif">产蛋实验室</h1>
            <p className="text-[#A0A0A0] text-[10px] mt-2 uppercase tracking-[0.4em] font-semibold cn-relaxed opacity-60">数据透视</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-[#E5D3C5]/20 flex flex-col items-end shadow-sm">
            <span className="text-[8px] font-bold text-[#A0A0A0] uppercase tracking-widest mb-1 flex items-center gap-1">
              单个蛋价 ($) 
              {saveStatus === 'saving' && <Loader2 size={8} className="animate-spin text-[#D48C45]" />}
              {saveStatus === 'saved' && <CheckCircle size={8} className="text-green-500" />}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-[#D48C45]">$</span>
              <input 
                type="number" 
                step="0.1" 
                value={eggPrice} 
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                className="w-12 bg-transparent outline-none font-bold text-lg text-[#2D2D2D] tabular-nums text-right"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-1.5 rounded-[24px] border border-[#E5D3C5]/20 shadow-sm flex relative overflow-hidden h-14">
          <motion.div 
            layoutId="range-bg"
            className="absolute top-1.5 bottom-1.5 bg-[#D48C45] rounded-[18px]"
            initial={false}
            animate={getRangeBgStyle()}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
          <button 
            onClick={() => { setTimeRange('month'); setOffset(0); }}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider relative z-10 transition-colors cn-relaxed ${timeRange === 'month' ? 'text-white' : 'text-[#A0A0A0]'}`}
          >
            月度
          </button>
          <button 
            onClick={() => { setTimeRange('year'); setOffset(0); }}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider relative z-10 transition-colors cn-relaxed ${timeRange === 'year' ? 'text-white' : 'text-[#A0A0A0]'}`}
          >
            年度
          </button>
          <button 
            onClick={() => { setTimeRange('all'); setOffset(0); }}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider relative z-10 transition-colors cn-relaxed ${timeRange === 'all' ? 'text-white' : 'text-[#A0A0A0]'}`}
          >
            所有时间
          </button>
        </div>

        {timeRange !== 'all' && (
          <div className="flex items-center justify-between bg-white/50 border border-[#E5D3C5]/10 rounded-2xl p-4">
            <button onClick={() => setOffset(o => o - 1)} className="p-2 text-[#D48C45] hover:bg-[#D48C45]/10 rounded-full transition-all active:scale-90">
              <ChevronLeft size={24} />
            </button>
            <div className="text-sm font-bold text-[#2D2D2D] cn-relaxed tracking-tight">{periodLabel}</div>
            <button onClick={() => setOffset(o => o + 1)} className="p-2 text-[#D48C45] hover:bg-[#D48C45]/10 rounded-full transition-all active:scale-90">
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </header>

      {/* Financial Summary Card */}
      <div className="bg-white p-10 rounded-[48px] border border-[#E5D3C5]/20 shadow-xl mb-8 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
            <Coins size={20} />
          </div>
          <span className="text-[11px] font-bold text-[#2D2D2D] uppercase tracking-wider cn-relaxed">
            财务概览 ({timeRange === 'all' ? '终身' : periodLabel})
          </span>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <span className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-2">总支出</span>
            <div className="text-3xl font-bold text-red-500 tabular-nums">${stats.totalExp.toFixed(2)}</div>
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-2">总收益</span>
            <div className="text-3xl font-bold text-green-600 tabular-nums">${stats.totalRev.toFixed(2)}</div>
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-2">净利润</span>
            <div className={`text-3xl font-bold tabular-nums ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              ${stats.netProfit.toFixed(2)}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-2">单枚成本</span>
            <div className="text-3xl font-bold text-[#2D2D2D] tabular-nums">${stats.costPerEgg}</div>
          </div>
        </div>

        {stats.pieData.length > 0 && (
          <div className="h-40 w-full mt-4 flex items-center justify-center relative">
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <ReceiptText size={16} className="text-[#D48C45] opacity-20" />
             </div>
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#D48C45', '#E5D3C5', '#C2974D', '#2D2D2D'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                  />
                </PieChart>
             </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Production Card */}
      <div className="bg-white p-10 rounded-[48px] border border-[#E5D3C5]/20 shadow-sm mb-8 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#D48C45]/10 rounded-2xl flex items-center justify-center text-[#D48C45]">
            <CalendarDays size={20} />
          </div>
          <span className="text-[11px] font-bold text-[#D48C45] uppercase tracking-wider cn-relaxed">
            该时段产量
          </span>
        </div>

        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-6xl font-bold text-[#2D2D2D] tracking-tighter tabular-nums leading-none">
              {stats.activeTotal}
            </div>
            <p className="text-[#A0A0A0] text-[11px] font-semibold uppercase tracking-wider mt-3 cn-relaxed opacity-70">
              枚记录
            </p>
          </div>
        </div>

        <div className="h-[2px] w-full bg-[#F9F5F0] mb-8" />

        <div className="flex justify-around items-center">
          <div className="text-center">
             <span className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1 cn-relaxed">历史总量</span>
             <div className="text-xl font-bold text-[#2D2D2D] tabular-nums">{stats.totalEggs}</div>
          </div>
          <div className="w-[1px] h-8 bg-[#E5D3C5]/30" />
          <div className="text-center">
             <span className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-1 cn-relaxed">全期平均</span>
             <div className="text-xl font-bold text-[#2D2D2D] tabular-nums">{stats.avgWeight}g</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[48px] border border-[#E5D3C5]/20 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-8">
          <span className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider flex items-center gap-2 cn-relaxed">
            <Trophy size={14} className="text-[#D48C45]" /> 产蛋达人榜
          </span>
        </div>

        {stats.rankings.length > 0 ? (
          <div className="space-y-6">
            {stats.rankings.map((hen, idx) => (
              <div key={hen.id} className="flex items-center gap-4">
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
          <p className="text-[#A0A0A0] text-sm italic text-center py-4 cn-relaxed">当前时段暂无记录。</p>
        )}
      </div>

      <div className="mb-8 flex items-center justify-between px-2">
        <p className="text-[#A0A0A0] text-[11px] uppercase tracking-wider font-bold flex items-center gap-2 cn-relaxed">
           <ListFilter size={14} /> 产蛋详细日志
        </p>
        {stats.activeLogs.length > 10 && (
          <button 
            onClick={() => setShowFullHistory(!showFullHistory)}
            className="text-[10px] font-bold text-[#D48C45] uppercase tracking-wider bg-[#D48C45]/10 px-5 py-2 rounded-full active:scale-95 transition-transform cn-relaxed"
          >
            {showFullHistory ? "收起" : "展开"}
          </button>
        )}
      </div>

      <div className="mb-20">
        <AnimatePresence initial={false}>
          {stats.activeLogs.length === 0 ? (
            <div className="text-center py-24 bg-white/40 rounded-[48px] border border-dashed border-[#E5D3C5]/40 text-[#A0A0A0] text-sm font-medium cn-relaxed">
              当前时段暂无产蛋数据。
            </div>
          ) : (
            displayedLogs.map((log) => (
              <LogItem 
                key={log.id} 
                log={log} 
                henName={henNameMap[log.henId] || log.henName} // Use the latest name if available
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
              <p className="text-sm text-[#A0A0A0] leading-relaxed mb-8 font-medium cn-relaxed">记录删除后无法恢复。</p>
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
                    <h2 className="text-3xl font-bold text-[#2D2D2D] mb-12 tracking-tighter font-serif">编辑产蛋记录</h2>
                    <div className="space-y-10">
                        <div>
                            <div className="flex items-center justify-between mb-5 px-1">
                              <label className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider flex items-center gap-2 cn-relaxed"><Scale size={14} /> 重量 (g)</label>
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
                            <CheckCircle size={22} /> 保存更新
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
