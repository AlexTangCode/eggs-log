
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Egg, Trash2, Calendar, Scale, Hash, X, Check, TrendingUp, CalendarDays } from 'lucide-react';
import { addDoc } from 'firebase/firestore';
import { Hen, EggLog } from '../types';
import { eggLogsRef } from '../services/firebase';
import HenGraphic from '../components/HenGraphic';

interface HomeViewProps {
  hens: Hen[];
  logs: EggLog[];
  onRefresh: () => void;
}

interface MagicDust {
  id: number;
  x: number;
  y: number;
  size: number;
}

/**
 * HEN HERO ITEM
 * Locked width of 160px to ensure horizontal scroll triggering as per specifications.
 * Each item handles its own localized "Gentle Glide" animation and harvest state.
 */
const HenHeroItem: React.FC<{
  hen: Hen;
  onTap: (hen: Hen) => void;
  isLaying: boolean;
  isSquishing: boolean;
  dustParticles: MagicDust[];
  size?: number;
}> = ({ hen, onTap, isLaying, isSquishing, dustParticles, size = 140 }) => {
  return (
    <div className="relative flex flex-col items-center flex-shrink-0 select-none pb-6 w-[160px] h-full justify-center">
      <div className="relative">
        {/* Interaction Target */}
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
          <div className="drop-shadow-[0_15px_45px_rgba(212,140,69,0.15)]">
            <HenGraphic color={hen.color || '#E5D3C5'} size={size} />
          </div>
        </motion.div>

        {/* Localized Magic Dust */}
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

        {/* Gentle Glide Animation - Localized Position */}
        <AnimatePresence>
          {isLaying && (
            <motion.div
              initial={{ opacity: 0, x: -75 * (size / 180), y: 60 * (size / 180), scale: 0.7 }}
              animate={{
                opacity: [0, 1, 1, 0.5, 0],
                x: -75 * (size / 180),
                y: 220 * (size / 180),
                scale: [0.7, 1, 1, 0.8, 0.6],
              }}
              transition={{
                duration: 1.1,
                ease: [0.25, 0.46, 0.45, 0.94],
                times: [0, 0.2, 0.7, 0.9, 1]
              }}
              className="absolute left-1/2 top-0 pointer-events-none z-20"
            >
              <div className="bg-[#D48C45] rounded-full w-9 h-12 shadow-xl flex items-center justify-center border-none">
                <Egg size={16} fill="white" stroke="none" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Name Label */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 text-center px-1"
      >
        <h3 className="text-xl font-black text-[#2D2D2D] tracking-tighter leading-tight truncate w-[140px]">
          {hen.name}
        </h3>
        <span className="text-[8px] font-black uppercase tracking-[0.25em] text-[#D48C45] bg-[#D48C45]/10 px-3 py-1 rounded-full inline-block mt-2">
          {hen.breed}
        </span>
      </motion.div>
    </div>
  );
};

const HomeView: React.FC<HomeViewProps> = ({ hens, logs, onRefresh }) => {
  const [isLayingId, setIsLayingId] = useState<string | null>(null);
  const [isSquishingId, setIsSquishingId] = useState<string | null>(null);
  const [dustParticles, setDustParticles] = useState<MagicDust[]>([]);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [activeHen, setActiveHen] = useState<Hen | null>(null);

  const [entryWeight, setEntryWeight] = useState<number>(60);
  const [entryQuantity, setEntryQuantity] = useState<number>(1);
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const HEN_DISPLAY_SIZE = 140;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Mouse Drag to Scroll Implementation
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

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

      const selectedTimestamp = new Date(entryDate).getTime() + (new Date().getHours() * 3600000) + (new Date().getMinutes() * 60000);
      try {
        await addDoc(eggLogsRef, {
          henId: activeHen.id,
          henName: activeHen.name,
          weight: entryWeight,
          quantity: entryQuantity,
          timestamp: selectedTimestamp
        });
        onRefresh();
      } catch (err) {
        console.error("Firestore Error:", err);
      }

      setTimeout(() => {
        setIsLayingId(null);
        setDustParticles([]);
        setActiveHen(null);
      }, 1250);
    }, 450);
  };

  if (hens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-10 bg-[#F9F5F0]">
        <div className="bg-white/40 p-12 rounded-[50px] mb-10 shadow-sm border border-[#E5D3C5]/30">
          <HenGraphic color="#E5D3C5" size={160} />
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#2D2D2D] mb-4 italic">Chloes Chicken</h1>
        <p className="text-[#A0A0A0] text-sm mb-12 font-medium italic leading-relaxed">The coop is empty. Head to the Flock tab to welcome your first hen.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F9F5F0] relative overflow-hidden pt-safe">
      <header className="pt-10 pb-4 px-10 text-center relative z-20">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="font-serif text-xl italic text-[#D48C45] mb-2 tracking-[0.2em]"
        >
          Chloes Chicken
        </motion.h2>
      </header>

      {/* PRODUCTION DASHBOARD */}
      <div className="px-10 mb-8 flex-shrink-0">
        <div className="bg-white/70 backdrop-blur-xl rounded-[32px] p-6 border border-white/40 shadow-[0_15px_35px_rgba(45,45,45,0.03)] flex justify-around items-center">
          <div className="text-center">
            <div className="flex items-center gap-1.5 justify-center mb-1 text-[#D48C45]">
              <TrendingUp size={14} strokeWidth={3} />
              <span className="text-[9px] font-black uppercase tracking-widest">Weekly</span>
            </div>
            <div className="text-3xl font-black text-[#2D2D2D] tracking-tighter tabular-nums">{stats.weeklyTotal}</div>
          </div>
          <div className="w-[1px] h-10 bg-[#E5D3C5]/30" />
          <div className="text-center">
            <div className="flex items-center gap-1.5 justify-center mb-1 text-[#B66649]">
              <CalendarDays size={14} strokeWidth={3} />
              <span className="text-[9px] font-black uppercase tracking-widest">Monthly</span>
            </div>
            <div className="text-3xl font-black text-[#2D2D2D] tracking-tighter tabular-nums">{stats.monthlyTotal}</div>
          </div>
        </div>
      </div>

      {/* HERO SECTION - Mandatory Scroll Physics */}
      <div className="flex-1 flex flex-col justify-center relative overflow-hidden min-h-[400px]">
        <div className="text-center mb-6">
          <p className="text-[#A0A0A0] text-[10px] font-black uppercase tracking-[0.6em] italic opacity-50">
            Tap to record harvest
          </p>
        </div>

        {/* 
          SCROLL CONTAINER (The "SingleChildScrollView")
          Locked height and width triggers.
          Includes Mouse Drag logic for Desktop/Web compatibility.
        */}
        <div 
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`w-full overflow-x-auto scroll-native flex items-center h-[380px] cursor-grab active:cursor-grabbing overscroll-x-contain select-none`}
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
                dustParticles={isLayingId === hen.id ? dustParticles : []}
                size={HEN_DISPLAY_SIZE}
              />
            ))}
            {/* Horizontal Padding Buffer */}
            {hens.length > 2 && <div className="w-12 flex-shrink-0" />}
          </div>
        </div>
      </div>

      <div className="pb-32 flex-shrink-0" />

      {/* HARVEST DIALOG */}
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
              className="bg-white rounded-[40px] w-full max-sm p-10 shadow-2xl border border-[#E5D3C5]/10 relative"
            >
              <button
                onClick={() => setShowEntryModal(false)}
                className="absolute top-8 right-8 p-2 text-gray-300 hover:text-[#2D2D2D]"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-[#D48C45]/10 rounded-[28px] flex items-center justify-center text-[#D48C45] mx-auto mb-4">
                  <Egg size={32} />
                </div>
                <h3 className="font-serif text-3xl font-bold text-[#2D2D2D] italic">Harvest Entry</h3>
                <p className="text-[#A0A0A0] text-[11px] font-bold uppercase tracking-wider mt-1.5 opacity-80">Collecting for {activeHen?.name}</p>
              </div>

              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <label className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-widest flex items-center gap-2">
                      <Scale size={14} /> Average Mass
                    </label>
                    <span className="text-2xl font-black text-[#D48C45] tabular-nums tracking-tighter">{entryWeight}g</span>
                  </div>
                  <input
                    type="range" min="30" max="90" value={entryWeight}
                    onChange={(e) => setEntryWeight(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[#F9F5F0] rounded-full appearance-none cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                   <div>
                    <label className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-widest block mb-2 flex items-center gap-2">
                      <Hash size={14} /> Count
                    </label>
                    <select
                      value={entryQuantity}
                      onChange={(e) => setEntryQuantity(parseInt(e.target.value))}
                      className="w-full p-4 bg-[#F9F5F0]/60 border border-[#E5D3C5]/20 rounded-2xl outline-none font-bold text-sm text-[#2D2D2D] appearance-none text-center"
                    >
                      {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-widest block mb-2 flex items-center gap-2">
                      <Calendar size={14} /> Date
                    </label>
                    <input
                      type="date"
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full p-4 bg-[#F9F5F0]/60 border border-[#E5D3C5]/20 rounded-2xl outline-none font-bold text-[11px] text-[#2D2D2D]"
                    />
                  </div>
                </div>

                <button
                  onClick={handleConfirmHarvest}
                  className="w-full py-6 bg-[#D48C45] text-white rounded-[28px] font-bold text-xl shadow-xl shadow-[#D48C45]/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Check size={24} />
                  Record Harvest
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomeView;
