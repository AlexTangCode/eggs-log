
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Loader2, Trophy, Calendar, TrendingUp, Star, Award, Crown } from 'lucide-react';
import { Hen, EggLog } from '../types';
import HenGraphic from './HenGraphic';
import html2canvas from 'html2canvas';

interface PosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  hens: Hen[];
  logs: EggLog[];
  onNotify: (message: string, type?: 'success' | 'info') => void;
}

const getLocalYMD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const PosterModal: React.FC<PosterModalProps> = ({ isOpen, onClose, hens, logs, onNotify }) => {
  const [isSaving, setIsSaving] = useState(false);

  const weeklyData = useMemo(() => {
    if (hens.length === 0) return null;

    const now = new Date();
    const todayStr = getLocalYMD(now);
    
    // Start of current day in local time
    const localToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const currentDay = localToday.getDay(); // 0 is Sunday
    
    // Calculate Monday of this week
    const diffToMonday = localToday.getDate() - (currentDay === 0 ? 6 : currentDay - 1);
    const monday = new Date(localToday.setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekStartStr = monday.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
    const weekEndStr = sunday.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
    const dateRange = `${weekStartStr} - ${weekEndStr}`;

    // 1. Weekly Stats
    const thisWeekLogs = logs.filter(l => l.timestamp >= monday.getTime() && l.timestamp <= sunday.getTime());
    const weeklyTotal = thisWeekLogs.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
    
    const daysPassed = (currentDay === 0 ? 7 : currentDay);
    const weeklyAvg = (weeklyTotal / daysPassed).toFixed(1);

    // 2. Today's Stats
    const todayLogs = logs.filter(l => getLocalYMD(new Date(l.timestamp)) === todayStr);
    const todayTotal = todayLogs.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
    
    const todayHenCounts: Record<string, number> = {};
    todayLogs.forEach(l => {
      todayHenCounts[l.henId] = (todayHenCounts[l.henId] || 0) + (l.quantity || 1);
    });
    let todayChampId = '';
    let todayMax = 0;
    Object.entries(todayHenCounts).forEach(([id, count]) => {
      if (count > todayMax) {
        todayMax = count;
        todayChampId = id;
      }
    });
    const todayChampion = hens.find(h => h.id === todayChampId)?.name || '暂无';

    // 3. All-Time Stats
    const lifetimeTotal = logs.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
    const allHenCounts: Record<string, number> = {};
    logs.forEach(l => {
      allHenCounts[l.henId] = (allHenCounts[l.henId] || 0) + (l.quantity || 1);
    });
    let topHenId = '';
    let topHenMax = 0;
    Object.entries(allHenCounts).forEach(([id, count]) => {
      if (count > topHenMax) {
        topHenMax = count;
        topHenId = id;
      }
    });
    const topHen = hens.find(h => h.id === topHenId);

    return {
      dateRange,
      weeklyTotal,
      weeklyAvg,
      todayTotal,
      todayChampion,
      lifetimeTotal,
      topHenName: topHen?.name || '暂无',
      topHenCount: topHenMax,
      topHenColor: topHen?.color || '#D48C45'
    };
  }, [hens, logs]);

  const handleDownload = async () => {
    const element = document.getElementById('weekly-report-poster');
    if (!element) return;

    try {
      setIsSaving(true);
      await new Promise(r => setTimeout(r, 100));
      
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 3,
        backgroundColor: '#FFF9C4',
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight,
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `chloes_chicken_weekly_report_${getLocalYMD(new Date())}.png`;
      link.href = dataUrl;
      link.click();
      
      onNotify('本周战报已成功保存！');
    } catch (err) {
      console.error('Download error:', err);
      onNotify('下载失败，请手动截图。', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  if (!weeklyData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-[#2D2D2D]/70 backdrop-blur-md overflow-y-auto"
        >
          <div className="relative w-full max-w-[380px] my-auto flex flex-col items-center">
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors"
            >
              <X size={28} />
            </button>

            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full bg-gradient-to-b from-[#FFF9C4] to-[#FFECB3] rounded-[48px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.3)] border border-white/40 flex flex-col"
              id="weekly-report-poster"
            >
              <div className="pt-12 pb-8 text-center px-8">
                <div className="w-16 h-16 bg-white/40 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/40">
                  <TrendingUp size={32} className="text-[#D48C45]" />
                </div>
                <h1 className="font-serif text-3xl font-black text-[#D48C45] tracking-tight">Chloes Chicken</h1>
                <h2 className="text-[#B66649] text-lg font-black mt-1">本周战报</h2>
                <p className="text-[#B66649]/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-3 bg-white/30 px-4 py-1.5 rounded-full inline-block">
                  {weeklyData.dateRange}
                </p>
              </div>

              <div className="px-8 pb-12 space-y-6">
                <div className="bg-white/50 rounded-[32px] p-6 border border-white/40 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-[#D48C45]">
                    <Calendar size={18} strokeWidth={2.5} />
                    <span className="text-xs font-black uppercase tracking-widest">本周总览</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-[#A0A0A0] uppercase mb-1">本周下蛋</span>
                      <div className="text-3xl font-black text-[#2D2D2D] tabular-nums">
                        {weeklyData.weeklyTotal}<span className="text-sm ml-1 opacity-50">枚</span>
                      </div>
                    </div>
                    <div className="flex flex-col border-l border-[#E5D3C5]/40 pl-4">
                      <span className="text-[10px] font-bold text-[#A0A0A0] uppercase mb-1">日均产量</span>
                      <div className="text-3xl font-black text-[#2D2D2D] tabular-nums">
                        {weeklyData.weeklyAvg}<span className="text-sm ml-1 opacity-50">枚</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#D48C45] rounded-[32px] p-6 shadow-lg shadow-[#D48C45]/20 text-white">
                  <div className="flex items-center gap-2 mb-4 opacity-80">
                    <Star size={18} fill="currentColor" />
                    <span className="text-xs font-black uppercase tracking-widest">今日战报</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-white/60 uppercase mb-1 block">今日收获</span>
                      <div className="text-4xl font-black tabular-nums">
                        {weeklyData.todayTotal}<span className="text-base ml-1">枚</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-white/60 uppercase mb-1 block">今日冠军</span>
                      <div className="flex items-center gap-2 justify-end">
                        <Award size={16} />
                        <span className="text-lg font-bold truncate max-w-[100px]">{weeklyData.todayChampion}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 rounded-[40px] p-8 border border-white/50 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-6 text-[#B66649]">
                    <Crown size={18} strokeWidth={2.5} />
                    <span className="text-xs font-black uppercase tracking-widest">历史荣誉</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <span className="text-[10px] font-bold text-[#A0A0A0] uppercase mb-1 block">历史总数</span>
                      <div className="text-3xl font-black text-[#2D2D2D] tabular-nums">
                        {weeklyData.lifetimeTotal}<span className="text-sm ml-1 opacity-40">枚</span>
                      </div>
                    </div>
                    <div className="w-14 h-14 bg-[#F9F5F0] rounded-2xl flex items-center justify-center border border-[#E5D3C5]/20">
                       <HenGraphic size={50} color={weeklyData.topHenColor} />
                    </div>
                  </div>

                  <div className="bg-[#B66649]/5 rounded-2xl p-4 border border-[#B66649]/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#B66649] uppercase tracking-wider">最高产母鸡</span>
                      <span className="text-[10px] font-black text-[#B66649] bg-white px-2 py-0.5 rounded-lg border border-[#B66649]/10">TOP 1</span>
                    </div>
                    <div className="mt-2 flex items-end justify-between">
                      <span className="text-xl font-black text-[#2D2D2D] cn-relaxed">{weeklyData.topHenName}</span>
                      <span className="text-base font-black text-[#B66649] tabular-nums">累计 {weeklyData.topHenCount} 枚</span>
                    </div>
                  </div>

                  <div className="mt-10 flex flex-col items-center gap-2 opacity-30">
                    <p className="text-[11px] font-bold text-[#D48C45] italic cn-relaxed">"家有神鸡，鸡蛋自由！"</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Trophy size={10} className="text-[#D48C45]" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#2D2D2D]">Chloes Chicken</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="mt-8 w-full">
              <button
                onClick={handleDownload}
                disabled={isSaving}
                className="w-full py-5 bg-[#D48C45] text-white rounded-[32px] font-extrabold text-lg flex items-center justify-center gap-3 shadow-2xl shadow-[#D48C45]/30 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    <span className="cn-relaxed">正在生成战报...</span>
                  </>
                ) : (
                  <>
                    <Download size={24} />
                    <span className="cn-relaxed">下载本周战报</span>
                  </>
                )}
              </button>
              <p className="text-white/40 text-[10px] text-center mt-4 font-bold uppercase tracking-widest">
                PNG 高清导出 • 保存至相册
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PosterModal;
