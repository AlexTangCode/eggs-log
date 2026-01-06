
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Egg, Trash2 } from 'lucide-react';
import { addDoc } from 'firebase/firestore';
import { Hen } from '../types';
import { eggLogsRef, deleteHenAndLogs } from '../services/firebase';
import HenGraphic from '../components/HenGraphic';

interface HomeViewProps {
  hens: Hen[];
  onRefresh: () => void;
}

interface MagicDust {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

const HomeView: React.FC<HomeViewProps> = ({ hens, onRefresh }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLaying, setIsLaying] = useState(false);
  const [isSquishing, setIsSquishing] = useState(false);
  const [dustParticles, setDustParticles] = useState<MagicDust[]>([]);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [weight, setWeight] = useState<number>(55);

  const safeIndex = Math.min(currentIndex, Math.max(0, hens.length - 1));
  const currentHen = hens[safeIndex];

  const handleLayEgg = () => {
    if (isLaying || isSquishing || !currentHen) return;
    
    // 1. Pronounced Squash & Stretch Effect (Anticipation)
    setIsSquishing(true);
    
    setTimeout(() => {
      setIsSquishing(false);
      setIsLaying(true);
      
      // 2. Trigger magic dust (4 delicate dots)
      const newParticles = Array.from({ length: 4 }).map((_, i) => ({
        id: Date.now() + i,
        x: -145 + (Math.random() - 0.5) * 40, 
        y: 110 + (Math.random() - 0.5) * 15,
        size: Math.random() * 2.5 + 1.5,
        delay: Math.random() * 0.15
      }));
      setDustParticles(newParticles);

      // 3. Landing transition - Wait for the egg to "fall" before showing modal
      setTimeout(() => {
        setShowWeightModal(true);
        setDustParticles([]);
      }, 1100);
    }, 300); // Increased anticipation duration
  };

  const saveEgg = async () => {
    if (!currentHen) return;
    try {
      await addDoc(eggLogsRef, {
        henId: currentHen.id,
        henName: currentHen.name,
        weight: weight,
        quantity: 1,
        timestamp: Date.now()
      });
      setShowWeightModal(false);
      setIsLaying(false);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteHen = async () => {
    if (!currentHen) return;
    try {
      await deleteHenAndLogs(currentHen.id);
      setShowDeleteConfirm(false);
      if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  if (hens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-10 bg-[#F9F5F0]">
        <div className="bg-white/40 p-12 rounded-[50px] mb-10 shadow-[0_30px_60px_rgba(45,45,45,0.02)] border border-[#E5D3C5]/30">
          <HenGraphic color="#E5D3C5" size={160} />
        </div>
        <h2 className="text-3xl font-bold text-[#2D2D2D] mb-4 tracking-tight">Your Coop Awaits</h2>
        <p className="text-[#A0A0A0] text-sm mb-12 font-medium italic leading-relaxed">The nest is empty. Add your first hen to begin the journey of harvest.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F9F5F0] relative overflow-hidden">
      {/* Header with Hen Info */}
      <div className="pt-20 pb-4 px-10 text-center relative z-10">
        <motion.div
          key={currentHen?.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <h1 className="text-5xl font-bold text-[#2D2D2D] tracking-tighter mb-2">{currentHen?.name}</h1>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#D48C45] bg-[#D48C45]/10 px-3 py-1 rounded-full">
              {currentHen?.breed}
            </span>
            <span className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-widest">
              Age {currentHen?.age}
            </span>
          </div>
        </motion.div>
        
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className="absolute top-20 right-8 p-3 text-gray-300 hover:text-[#B66649] transition-colors"
        >
          <Trash2 size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Interactive Main Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-4">
        <button 
          disabled={safeIndex === 0}
          onClick={() => setCurrentIndex(prev => prev - 1)}
          className="absolute left-4 z-20 p-4 text-[#E5D3C5] hover:text-[#D48C45] disabled:opacity-0 transition-colors"
        >
          <ChevronLeft size={44} strokeWidth={1} />
        </button>

        <div className="relative mb-24 w-full flex justify-center">
          <motion.div 
            className="cursor-pointer relative z-10"
            animate={{ 
              scaleY: isSquishing ? 0.82 : 1, // More pronounced squash
              scaleX: isSquishing ? 1.15 : 1, // More pronounced stretch
              y: isSquishing ? 15 : 0         // Sinks down slightly
            }}
            transition={{ 
              duration: isSquishing ? 0.3 : 0.6, 
              type: "spring", 
              stiffness: isSquishing ? 300 : 120,
              damping: 15
            }}
            onClick={handleLayEgg}
          >
            <AnimatePresence mode="wait">
               <motion.div
                 key={currentHen?.id}
                 initial={{ opacity: 0, scale: 0.96 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.96 }}
                 className="drop-shadow-[0_40px_100px_rgba(212,140,69,0.06)]"
               >
                 <HenGraphic color={currentHen?.color || '#E5D3C5'} size={360} />
               </motion.div>
            </AnimatePresence>

            {/* Magic Dust Particles */}
            <AnimatePresence>
              {dustParticles.map(p => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: p.x, y: p.y, scale: 0 }}
                  animate={{ opacity: [0, 0.7, 0], y: p.y - 70, scale: [0, 1.4, 0] }}
                  transition={{ duration: 0.6, delay: p.delay, ease: "easeOut" }}
                  className="absolute left-1/2 bg-white rounded-full blur-[3px]"
                  style={{ width: p.size, height: p.size }}
                />
              ))}
            </AnimatePresence>

            {/* Elegant Egg Drop Animation */}
            <AnimatePresence>
              {isLaying && (
                <motion.div
                  initial={{ opacity: 0, x: -140, y: 110, scale: 0.4 }}
                  animate={{ 
                    opacity: [0, 1, 1],
                    x: -280, 
                    y: 135, 
                    scale: 1,
                    rotate: -20
                  }}
                  transition={{ 
                    duration: 0.85,
                    ease: [0.7, 0, 0.84, 0] // Steep Curves.easeInExpo behavior
                  }}
                  className="absolute left-1/2 top-0 pointer-events-none"
                >
                  <div className="bg-[#D48C45] rounded-full w-14 h-18 shadow-[0_15px_30px_rgba(212,140,69,0.25)] flex items-center justify-center">
                    <Egg size={32} fill="white" stroke="none" />
                  </div>
                  
                  {/* Subtle Impact Shadow Effect */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.1 }}
                    animate={{ 
                      opacity: [0, 0.08, 0], 
                      scale: [0.3, 1.8, 1.2] 
                    }}
                    transition={{ 
                      delay: 0.75, 
                      duration: 0.5,
                      ease: "easeOut" 
                    }}
                    className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 w-16 h-4 bg-[#2D2D2D] rounded-full blur-2xl"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <button 
          disabled={safeIndex === hens.length - 1}
          onClick={() => setCurrentIndex(prev => prev + 1)}
          className="absolute right-4 z-20 p-4 text-[#E5D3C5] hover:text-[#D48C45] disabled:opacity-0 transition-colors"
        >
          <ChevronRight size={44} strokeWidth={1} />
        </button>

        {/* Pagination Pips */}
        <div className="flex gap-3 mb-16">
          {hens.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-500 ${idx === safeIndex ? 'w-8 bg-[#D48C45]' : 'w-1.5 bg-[#E5D3C5]'}`}
            />
          ))}
        </div>
      </div>

      <div className="pb-40 text-center">
        <p className="text-[#A0A0A0] text-[10px] font-black uppercase tracking-[0.6em] italic opacity-30">Tap hen to collect egg</p>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showWeightModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-[#F9F5F0]/60 backdrop-blur-2xl flex items-end justify-center">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white rounded-t-[50px] w-full max-w-md p-12 shadow-[0_-20px_100px_rgba(45,45,45,0.08)] border-t border-[#E5D3C5]/20">
              <div className="text-center mb-12">
                <h3 className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-[0.4em] mb-4">Production Weight</h3>
                <div className="text-8xl font-black text-[#D48C45] tracking-tighter tabular-nums mb-2">
                  {weight}<span className="text-lg font-black text-[#A0A0A0] ml-2">G</span>
                </div>
              </div>

              <input 
                type="range" min="30" max="90" value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#F9F5F0] rounded-full appearance-none cursor-pointer mb-16"
              />

              <div className="flex gap-4">
                <button onClick={() => { setShowWeightModal(false); setIsLaying(false); }} className="flex-1 py-5 font-black text-[#A0A0A0] uppercase tracking-widest text-[10px] active:opacity-50 transition-opacity">Discard</button>
                <button onClick={saveEgg} className="flex-1 py-6 bg-[#D48C45] text-white rounded-[32px] font-bold text-lg shadow-xl shadow-[#D48C45]/20 active:scale-95 transition-transform">Record harvest</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[210] bg-[#2D2D2D]/10 backdrop-blur-xl flex items-center justify-center p-8">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[44px] w-full max-sm p-10 shadow-2xl border border-[#E5D3C5]/20 text-center">
              <h3 className="text-2xl font-bold text-[#2D2D2D] mb-3">Remove {currentHen?.name}?</h3>
              <p className="text-[#A0A0A0] text-sm mb-12 leading-relaxed italic">This will permanently delete her profile and all harvest records.</p>
              <div className="flex flex-col gap-3">
                <button onClick={handleDeleteHen} className="w-full py-5 bg-[#B66649] text-white rounded-3xl font-bold active:scale-95 transition-transform shadow-lg shadow-[#B66649]/20">Confirm Removal</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-5 text-[#A0A0A0] font-black uppercase tracking-widest text-[10px]">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomeView;
