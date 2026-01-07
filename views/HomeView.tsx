
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Egg, Calendar, Scale, Hash, X, Check, TrendingUp, CalendarDays, Share2 } from 'lucide-react';
import { addDoc } from 'firebase/firestore';
import { Hen, EggLog, View } from '../types';
import { eggLogsRef, incrementEggInventory } from '../services/firebase';
import HenGraphic from '../components/HenGraphic';
import PosterModal from '../components/PosterModal';

interface HomeViewProps {
  hens: Hen[];
  logs: EggLog[];
  onRefresh: () => void;
  onNotify: (message: string, type?: 'success' | 'info') => void;
  onNavigate: (view: View) => void;
}

interface MagicDust {
  id: number;
  x: number;
  y: number;
  size: number;
}

const HenHeroItem: React.FC<{
  hen: Hen;
  onTap: (hen: Hen) => void;
  isLaying: boolean;
  isSquishing: boolean;
  hasLaidToday: boolean;
  dustParticles: MagicDust[];
  size?: number;
  totalEggs: number;
}> = ({ hen, onTap, isLaying, isSquishing, hasLaidToday, dustParticles, size = 140, totalEggs }) => {
  return (
    <div className="relative flex flex-col items-center flex-shrink-0 select-none pb-12 w-[160px] h-full justify-center">
      <div className="relative">
        {/* Hen Body */}
        <motion.div
          onTap={() => onTap(hen)}
          whileTap={{ scale: 0.94 }}
          animate={{
            scaleY: isSquishing ? 0.82 : 1,
            scaleX: isSquishing ? 1.15 : 1,
            y: isSquishing ? 12 : 0
          }}
          transition={{ duration: 0.3 }}
          className="cursor-pointer relative z-10"
        >
          <div className="drop-shadow-[0_20px_40px_rgba(212,140,69,0.18)]">
            <HenGraphic color={hen.color || '#E5D3C5'} size={size} />
          </div>
        </motion.div>

        {/* Magic Dust Particles during laying */}
        <AnimatePresence>
          {dustParticles.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: p.x * (size / 380), y: p.y * (size / 380), scale: 0 }}
              animate={{
                opacity: [0, 0.6, 0],
                y: (p.y - 120) * (size / 380),
                scale: [0, 1.6, 0]
              }}
              transition={{ duration: 2.2, ease: "easeOut" }}
              className="absolute left-1/2 bg-white rounded-full blur-[1.2px]"
              style={{ width: p.size, height: p.size }}
            />
          ))}
        </AnimatePresence>

        {/* Falling Egg Animation */}
        <AnimatePresence>
          {isLaying && (
            <motion.div
              key={`falling-egg-${hen.id}`}
              initial={{ 
                opacity: 0, 
                x: -75 * (size / 180), 
                y: 60 * (size / 180), 
                scale: 0.6 
              }}
              animate={{
                opacity: [0, 1, 1, 1, 1],
                x: -75 * (size / 180),
                y: 240 * (size / 180),
                scale: [0.6, 1.1, 1, 1, 1],
              }}
              transition={{
                duration: 1.2,
                ease: "easeOut",
                times: [0, 0.2, 0.6, 0.9, 1]
              }}
              className="absolute left-1/2 top-0 pointer-events-none z-20"
            >
              <div className="bg-[#FDF5E6] rounded-full w-10 h-13 shadow-[0_10px_20px_rgba(45,45,45,0.1)] flex items-center justify-center border-2 border-[#D48C45]/10">
                <Egg size={18} fill="#D48C45" stroke="none" className="opacity-80" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Static Resting Egg (remains after laying) */}
        {hasLaidToday && !isLaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 180 * (size / 180) }}
            animate={{ opacity: 1, scale: 1, y: 240 * (size / 180) }}
            className="absolute left-1/2 top-0 pointer-events-none z-0"
            style={{ x: -75 * (size / 180) }}
          >
            <div className="bg-[#FDF5E6] rounded-full w-9 h-11 shadow-[0_4px_10px_rgba(45,45,45,0.05)] flex items-center justify-center border border-[#D48C45]/5">
              <Egg size={16} fill="#D48C45" stroke="none" className="opacity-40" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Hen Info Panel */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 text-center px-1"
      >
        <h3 className="text-xl font-bold text-[#2D2D2D] tracking-tight leading-tight truncate w-[140px] cn-relaxed">
          {hen.name}
        </h3>
        <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#D48C45] bg-[#D48C45]/10 px-3 py-1 rounded-full inline-block mt-2 cn-relaxed">
          累计下蛋: {totalEggs} 枚
        </span>
      </motion.div>
    </div>
  );
};

const HomeView: React.FC<HomeViewProps> = ({ hens, logs, onRefresh, onNotify, onNavigate }) => {
  const [isLayingId, setIsLayingId] = useState<string | null>(null);
  const [isSquishingId, setIsSquishingId] = useState<string | null>(null);
  const [dustParticles, setDustParticles] = useState<MagicDust[]>([]);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showPoster, setShowPoster] = useState(false);
  const [activeHen, setActiveHen] = useState<Hen | null>(null);

  const [entryWeight, setEntryWeight] = useState<number>(60);
  const [entryQuantity, setEntryQuantity] = useState<number>(1);
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const HEN_DISPLAY_SIZE = 140;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Derive which hens have laid eggs today based on logs
  const laidTodayIds = useMemo(() => {
    const today = new Date().toDateString();
    const ids = new Set<string>();
    logs.forEach(log => {
      if (new Date(log.timestamp).toDateString() === today) {
        ids.add(log.henId);
      }
    });
    return ids;
  }, [logs]);

  const henTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    logs.forEach(log => {
      totals[log.henId] = (totals[log.henId] || 0) + (log.quantity || 1);
    });
    return totals;
  }, [logs]);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const weeklyTotal = logs.filter(l => l.timestamp >= startOfWeek.getTime())
      .reduce((sum, l) => sum + (l.quantity || 1), 0);
    const monthlyTotal = logs.filter(l => l.timestamp >= startOfMonth.getTime())
      .reduce((sum, l) => sum + (l.quantity || 1), 0);

    return { weeklyTotal, monthlyTotal };
  }, [logs]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleHenTap = useCallback((hen: Hen) => {
    if (isLayingId || isSquishingId) return;
    setActiveHen(hen);
    setShowEntryModal(true);
  }, [isLayingId, isSquishingId]);

  const handleConfirmHarvest = async () => {
    if (!activeHen) return;
    setShowEntryModal(false);
    setIsSquishingId(activeHen.id);

    setTimeout(async () => {
      setIsSquishingId(null);
      setIsLayingId(activeHen.id);

      const newParticles = Array.from({ length: 14 }).map((_, i) => ({
        id: Date.now() + i,
        x: -120 + (Math.random() - 0.5) * 70,
        y: 100,
        size: Math.random() * 2.5 + 1,
      }));
      setDustParticles(newParticles);

      const [year, month, day] = entryDate.split('-').map(Number);
      const now = new Date();
      const finalDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
      const selectedTimestamp = finalDate.getTime();
      
      try {
        await addDoc(eggLogsRef, {
          henId: activeHen.id,
          henName: activeHen.name,
          weight: Number(entryWeight),
          quantity: Number(entryQuantity),
          timestamp: selectedTimestamp
        });
        // NEW: Increment inventory!
        await incrementEggInventory(Number(entryQuantity));
        onRefresh();
      } catch (err) {
        console.error("Firestore Error:", err);
      }

      setTimeout(() => {
        setIsLayingId(null);
        setDustParticles([]);
        setActiveHen(null);
      }, 1300);
    }, 450);
  };

  return (
    <div className="flex flex-col h-full bg-[#F9F5F0] relative overflow-hidden pt-safe">
      <header className="pt-10 pb-4 px-10 flex items-center justify-between relative z-20">
        <div className="w-10"></div> {/* Spacer */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          className="font-serif text-xl text-[#D48C45] tracking-[0.15em] font-extrabold"
        >
          Chloes Chicken
        </motion.h2>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowPoster(true)}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#D48C45] shadow-sm border border-[#E5D3C5]/20 active:bg-[#F9F5F0]"
        >
          <Share2 size={18} />
        </motion.button>
      </header>

      {hens.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center px-10">
          <div className="bg-white/40 p-12 rounded-[50px] mb-10 shadow-sm border border-[#E5D3C5]/30">
            <HenGraphic color="#E5D3C5" size={160} />
          </div>
          <h1 className="font-serif text-3xl font-extrabold text-[#2D2D2D] mb-4 tracking-tighter">Chloes Chicken</h1>
          <p className="text-[#A0A0A0] text-sm mb-12 font-medium leading-relaxed cn-relaxed">鸡舍目前空空如也。</p>
          <button 
            onClick={() => onNavigate(View.HENS)}
            className="px-8 py-4 bg-[#D48C45] text-white rounded-3xl font-bold shadow-lg shadow-[#D48C45]/20"
          >
            添加第一只母鸡
          </button>
        </div>
      ) : (
        <>
          <div className="px-10 mt-4 mb-8 flex-shrink-0">
            <div className="bg-white/70 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 shadow-[0_15px_35px_rgba(45,45,45,0.03)] flex justify-around items-center">
              <div className="text-center">
                <div className="flex items-center gap-1.5 justify-center mb-1 text-[#D48C45]">
                  <TrendingUp size={14} strokeWidth={2.5} />
                  <span className="text-[10px] font-bold uppercase tracking-wider cn-relaxed">本周统计</span>
                </div>
                <div className="text-3xl font-bold text-[#2D2D2D] tracking-tighter tabular-nums">{stats.weeklyTotal}</div>
              </div>
              <div className="w-[1px] h-10 bg-[#E5D3C5]/30" />
              <div className="text-center">
                <div className="flex items-center gap-1.5 justify-center mb-1 text-[#B66649]">
                  <CalendarDays size={14} strokeWidth={2.5} />
                  <span className="text-[10px] font-bold uppercase tracking-wider cn-relaxed">本月统计</span>
                </div>
                <div className="text-3xl font-bold text-[#2D2D2D] tracking-tighter tabular-nums">{stats.monthlyTotal}</div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center relative overflow-hidden min-h-[420px]">
            <div className="text-center mb-4">
              <p className="text-[#A0A0A0] text-[10px] font-semibold uppercase tracking-[0.3em] opacity-60 cn-relaxed">
                点击母鸡记录产蛋
              </p>
            </div>

            <div 
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className="w-full overflow-x-auto scroll-native flex items-center h-[380px] cursor-grab active:cursor-grabbing overscroll-x-contain select-none pb-8"
            >
              <div 
                className={`flex flex-nowrap min-w-full px-12 gap-[30px] items-center h-full ${
                  hens.length <= 2 ? 'justify-center' : 'justify-start'
                }`}
              >
                {hens.map((hen) => (
                  <HenHeroItem
                    key={hen.id}
                    hen={hen}
                    onTap={handleHenTap}
                    isLaying={isLayingId === hen.id}
                    isSquishing={isSquishingId === hen.id}
                    hasLaidToday={laidTodayIds.has(hen.id)}
                    dustParticles={isLayingId === hen.id ? dustParticles : []}
                    size={HEN_DISPLAY_SIZE}
                    totalEggs={henTotals[hen.id] || 0}
                  />
                ))}
                {hens.length > 2 && <div className="w-12 flex-shrink-0" />}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Entry Modal */}
      <AnimatePresence>
        {showEntryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-[#F9F5F0]/80 backdrop-blur-3xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] w-full max-sm p-10 shadow-2xl border border-[#E5D3C5]/10 relative h-fit"
            >
              <button
                onClick={() => setShowEntryModal(false)}
                className="absolute top-8 right-8 p-2 text-gray-300 hover:text-[#2D2D2D]"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-start w-full">
                <div className="flex items-center gap-4 mb-10 w-full">
                  <div className="w-16 h-16 bg-[#D48C45]/10 rounded-[28px] flex items-center justify-center text-[#D48C45]">
                    <Egg size={32} />
                  </div>
                  <div className="flex flex-col items-start">
                    <h3 className="font-serif text-3xl font-extrabold text-[#2D2D2D] tracking-tight">录入产蛋记录</h3>
                    <p className="text-[#A0A0A0] text-[11px] font-semibold uppercase tracking-wider mt-1.5 opacity-80 cn-relaxed">为 {activeHen?.name} 记录</p>
                  </div>
                </div>

                <div className="space-y-8 w-full">
                  <div className="flex flex-col items-stretch">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <label className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider flex items-center gap-2 cn-relaxed">
                        <Scale size={14} /> 重量 (克)
                      </label>
                      <span className="text-2xl font-bold text-[#D48C45] tabular-nums tracking-tighter">{entryWeight}g</span>
                    </div>
                    <input
                      type="range" min="30" max="90" value={entryWeight}
                      onChange={(e) => setEntryWeight(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-[#F9F5F0] rounded-full appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col items-start">
                      <label className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-2 flex items-center gap-2 cn-relaxed">
                        <Hash size={14} /> 数量
                      </label>
                      <select
                        value={entryQuantity}
                        onChange={(e) => setEntryQuantity(parseInt(e.target.value))}
                        className="w-full p-4 bg-[#F9F5F0]/60 border border-[#E5D3C5]/20 rounded-2xl outline-none font-bold text-sm text-[#2D2D2D] appearance-none text-center"
                      >
                        {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col items-start">
                      <label className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-2 flex items-center gap-2 cn-relaxed">
                        <Calendar size={14} /> 产蛋日期
                      </label>
                      <input
                        type="date"
                        value={entryDate}
                        onChange={(e) => setEntryDate(e.target.value)}
                        className="w-full p-4 bg-[#F9F5F0]/60 border border-[#E5D3C5]/30 rounded-2xl outline-none font-bold text-[11px] text-[#2D2D2D]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmHarvest}
                    className="w-full py-6 bg-[#D48C45] text-white rounded-[28px] font-bold text-xl shadow-xl shadow-[#D48C45]/20 active:scale-95 transition-all flex items-center justify-center gap-3 cn-relaxed"
                  >
                    <Check size={24} />
                    保存记录
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Poster Modal */}
      <PosterModal
        isOpen={showPoster}
        onClose={() => setShowPoster(false)}
        hens={hens}
        logs={logs}
        onNotify={onNotify}
      />
    </div>
  );
};

export default HomeView;
