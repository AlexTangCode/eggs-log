
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Loader2, Trophy, Calendar, TrendingUp, Star, Award, Crown, Egg } from 'lucide-react';
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
    const localToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const currentDay = localToday.getDay(); 
    
    const diffToMonday = localToday.getDate() - (currentDay === 0 ? 6 : currentDay - 1);
    const monday = new Date(localToday.setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekRange = `${monday.getMonth() + 1}/${monday.getDate()} - ${sunday.getMonth() + 1}/${sunday.getDate()}`;

    const thisWeekLogs = logs.filter(l => l.timestamp >= monday.getTime() && l.timestamp <= sunday.getTime());
    const weeklyTotal = thisWeekLogs.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
    const daysPassed = (currentDay === 0 ? 7 : currentDay);
    const weeklyAvg = (weeklyTotal / daysPassed).toFixed(1);

    const todayLogs = logs.filter(l => getLocalYMD(new Date(l.timestamp)) === todayStr);
    const todayTotal = todayLogs.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
    
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
      weekRange,
      weeklyTotal,
      weeklyAvg,
      todayTotal,
      lifetimeTotal: logs.reduce((acc, curr) => acc + (curr.quantity || 1), 0),
      topHenName: topHen?.name || '暂无',
      topHenColor: topHen?.color || '#D48C45'
    };
  }, [hens, logs]);

  const handleSaveToGallery = async () => {
    const element = document.getElementById('weekly-report-poster');
    if (!element) return;

    try {
      setIsSaving(true);
      // Wait for layout stabilization
      await new Promise(r => setTimeout(r, 200));
      
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 4, // High quality output
        backgroundColor: '#F9F5F0',
        logging: false,
        width: 375,
        height: 667,
        onclone: (clonedDoc) => {
          const clonedEl = clonedDoc.getElementById('weekly-report-poster');
          if (clonedEl) {
            clonedEl.style.width = '375px';
            clonedEl.style.height = '667px';
            clonedEl.style.transform = 'none';
            clonedEl.style.webkitFontSmoothing = 'antialiased';
            clonedEl.style.position = 'relative';
          }
        }
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Weekly_Report_${getLocalYMD(new Date())}.png`;
      link.href = dataUrl;
      link.click();
      
      onNotify('✨ 已成功存入相册', 'success');
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      onNotify('保存失败，请检查权限', 'info');
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
          className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-[#2D2D2D]/80 backdrop-blur-xl overflow-hidden"
        >
          <div className="relative w-full max-w-[340px] flex flex-col items-center">
            <button
              onClick={onClose}
              className="absolute -top-14 right-0 p-3 text-white/60 hover:text-white transition-colors"
            >
              <X size={28} />
            </button>

            {/* Poster Card - Locked to 375x667 Viewport */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              style={{ width: '375px', height: '667px', transformOrigin: 'center center' }}
              className="bg-[#F9F5F0] rounded-[40px] overflow-hidden shadow-2xl relative border border-white/20 scale-[0.75] sm:scale-[0.85]"
              id="weekly-report-poster"
            >
              {/* Background Accents */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D48C45]/5 rounded-bl-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#B66649]/5 rounded-tr-[80px] pointer-events-none" />

              <div className="p-10 h-full flex flex-col relative z-10">
                <header className="flex items-center justify-between h-16 mb-8">
                  <div className="flex flex-col">
                    <h1 className="font-serif text-2xl font-black text-[#D48C45] leading-none m-0">Chloe's</h1>
                    <h1 className="font-serif text-2xl font-black text-[#B66649] leading-none mt-1 m-0">Chicken</h1>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-widest block leading-none">Weekly Report</span>
                    <span className="text-[11px] font-bold text-[#D48C45] tabular-nums mt-1 block leading-none">{weeklyData.weekRange}</span>
                  </div>
                </header>

                <div className="space-y-6 flex-1">
                  {/* Main Achievement */}
                  <div className="bg-white/90 h-36 rounded-[32px] border border-white/60 shadow-sm flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center gap-2 mb-2 text-[#D48C45]">
                      <Trophy size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none">本周成就</span>
                    </div>
                    <div className="text-5xl font-black text-[#2D2D2D] tabular-nums tracking-tighter leading-none">
                      {weeklyData.weeklyTotal}<span className="text-base ml-1 font-bold text-[#A0A0A0]">枚</span>
                    </div>
                    <p className="text-[10px] font-bold text-[#A0A0A0] mt-3 uppercase tracking-widest leading-none">平均每日 {weeklyData.weeklyAvg} 枚</p>
                  </div>

                  {/* Today Status */}
                  <div className="flex gap-4 h-28">
                    <div className="flex-1 bg-[#D48C45] rounded-[28px] text-white shadow-lg shadow-[#D48C45]/20 p-5 flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 mb-2 opacity-80">
                        <Star size={12} fill="currentColor" />
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">今日收获</span>
                      </div>
                      <div className="text-3xl font-black tabular-nums leading-none">{weeklyData.todayTotal}</div>
                    </div>
                    <div className="flex-1 bg-white/90 rounded-[28px] border border-white/60 p-5 flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 mb-2 text-[#A0A0A0]">
                        <Crown size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">历史总计</span>
                      </div>
                      <div className="text-3xl font-black text-[#2D2D2D] tabular-nums leading-none">{weeklyData.lifetimeTotal}</div>
                    </div>
                  </div>

                  {/* MVP Honor */}
                  <div className="bg-[#B66649]/5 h-24 rounded-[32px] border border-[#B66649]/10 px-6 flex items-center justify-between">
                    <div className="flex flex-col flex-1 min-w-0 pr-2 text-left">
                      <span className="text-[9px] font-black text-[#B66649] uppercase tracking-widest mb-1 leading-none">MVP 母鸡</span>
                      <span className="text-xl font-black text-[#2D2D2D] cn-relaxed truncate block leading-tight">{weeklyData.topHenName}</span>
                    </div>
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-[#B66649]/5 flex-shrink-0">
                      <HenGraphic size={45} color={weeklyData.topHenColor} />
                    </div>
                  </div>
                </div>

                {/* Fixed Positioned Footer */}
                <div className="h-16 flex flex-col items-center justify-center mt-auto">
                   <div className="flex items-center gap-3 opacity-20 mb-3">
                      <div className="w-8 h-[1px] bg-[#D48C45]" />
                      <Egg size={14} fill="#D48C45" />
                      <div className="w-8 h-[1px] bg-[#D48C45]" />
                   </div>
                   <p className="text-[10px] font-bold text-[#D48C45] italic opacity-60 leading-none">"Fresh eggs, happy life."</p>
                </div>
              </div>
            </motion.div>

            {/* Action Button */}
            <div className="mt-8 w-full">
              <button
                onClick={handleSaveToGallery}
                disabled={isSaving}
                className="w-full py-5 bg-[#D48C45] text-white rounded-[28px] font-extrabold text-lg flex items-center justify-center gap-3 shadow-xl shadow-[#D48C45]/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    <Download size={24} />
                    <span className="cn-relaxed">保存到相册</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PosterModal;
