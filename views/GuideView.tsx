
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Egg, Plus, RefreshCcw, Sparkles, ChefHat, Info, X, Utensils } from 'lucide-react';
import { getEggInventory, incrementEggInventory, decrementEggInventory } from '../services/firebase';
import { getChloeRecipe } from '../services/geminiService';

const GuideView: React.FC = () => {
  const [eggCount, setEggCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<any>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [crackingIndex, setCrackingIndex] = useState<number | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    const count = await getEggInventory();
    setEggCount(count);
    setLoading(false);
  };

  const fetchRecipe = async () => {
    if (eggCount === 0) return;
    setRecipeLoading(true);
    const data = await getChloeRecipe(eggCount);
    setRecipe(data);
    setRecipeLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleEatEgg = async (index: number) => {
    if (eggCount <= 0 || crackingIndex !== null) return;
    setCrackingIndex(index);
    setTimeout(async () => {
      await decrementEggInventory(1);
      setEggCount(prev => Math.max(0, prev - 1));
      setCrackingIndex(null);
    }, 800);
  };

  const handleAddEgg = async () => {
    await incrementEggInventory(1);
    setEggCount(prev => prev + 1);
  };

  // 2x6 Grid slots
  const slots = useMemo(() => Array.from({ length: 12 }), []);

  return (
    <div className="p-10 pb-44 bg-[#F9F5F0] min-h-full scroll-native overflow-y-auto">
      <header className="mb-10 flex flex-col items-start">
        <h1 className="font-serif text-4xl font-extrabold text-[#2D2D2D] tracking-tighter">吃蛋指南</h1>
        <p className="text-[#A0A0A0] text-[11px] mt-2 uppercase tracking-[0.3em] font-bold cn-relaxed opacity-60">储蛋盒与营养厨乐园</p>
      </header>

      {/* 1. Egg Carton Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#D48C45] uppercase tracking-widest">储蛋盒</span>
            <span className="bg-[#D48C45] text-white text-[10px] font-black px-2 py-0.5 rounded-full tabular-nums">
              {eggCount}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleAddEgg}
            className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-[#D48C45] shadow-sm border border-[#E5D3C5]/20"
          >
            <Plus size={20} />
          </motion.button>
        </div>

        <div className="bg-[#E5D3C5]/30 p-4 rounded-[40px] border border-[#E5D3C5]/50 shadow-inner grid grid-cols-6 gap-3 relative">
          {slots.map((_, i) => (
            <div key={i} className="aspect-square bg-[#F9F5F0] rounded-full border border-[#E5D3C5]/40 flex items-center justify-center relative overflow-hidden">
              {eggCount > i && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => handleEatEgg(i)}
                  className="w-full h-full flex items-center justify-center relative"
                >
                  {crackingIndex === i ? (
                    <motion.div 
                      initial={{ scale: 1 }}
                      animate={{ scale: 1.2, opacity: 0 }}
                      className="text-[#D48C45]"
                    >
                      <X size={24} strokeWidth={3} />
                    </motion.div>
                  ) : (
                    <Egg fill="#D48C45" stroke="none" size={20} className="opacity-90 drop-shadow-sm" />
                  )}
                </motion.button>
              )}
            </div>
          ))}
          {eggCount > 12 && (
             <div className="absolute -bottom-2 -right-2 bg-[#B66649] text-white text-[9px] font-bold px-3 py-1 rounded-full shadow-lg">
                +{eggCount - 12} 枚溢出
             </div>
          )}
        </div>
        <p className="text-center text-[9px] text-[#A0A0A0] font-bold uppercase tracking-[0.2em] mt-4 opacity-40 cn-relaxed">
          点击一枚鸡蛋代表已食用
        </p>
      </section>

      {/* 2. AI Recipe Section */}
      <section>
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-2 text-[#B66649]">
            <Utensils size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Chloe 的今日灵感</span>
          </div>
          <button
            onClick={fetchRecipe}
            disabled={recipeLoading || eggCount === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
              eggCount === 0 ? 'bg-gray-100 text-gray-300' : 'bg-[#B66649]/10 text-[#B66649] hover:bg-[#B66649]/20'
            }`}
          >
            <RefreshCcw size={14} className={recipeLoading ? 'animate-spin' : ''} />
            {recipe ? '换个灵感' : '获取今日灵感'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {recipeLoading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-[40px] p-10 border border-[#E5D3C5]/20 text-center"
            >
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#D48C45] mx-auto mb-4 animate-bounce">
                <ChefHat size={24} />
              </div>
              <p className="text-sm font-bold text-[#A0A0A0] cn-relaxed">正在为 Chloe 构思美味食谱...</p>
            </motion.div>
          ) : recipe ? (
            <motion.div
              key="recipe-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[40px] p-8 border border-[#E5D3C5]/20 shadow-[0_20px_60px_rgba(45,45,45,0.03)]"
            >
              <div className="flex items-start justify-between mb-6">
                <h3 className="font-serif text-2xl font-black text-[#2D2D2D] leading-tight">
                  {recipe.recipeName} 🌈
                </h3>
                <div className="bg-[#D48C45]/10 text-[#D48C45] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                  需要 {recipe.eggsNeeded} 枚蛋
                </div>
              </div>

              <div className="space-y-6">
                <div>
                   <label className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-widest mb-2 block">制作秘诀 🧸</label>
                   <p className="text-sm text-[#2D2D2D] font-medium leading-relaxed cn-relaxed">{recipe.secret}</p>
                </div>
                
                <div>
                   <label className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-widest mb-2 block">为什么 Chloe 会喜欢 🍼</label>
                   <p className="text-sm text-[#2D2D2D] font-medium leading-relaxed cn-relaxed">{recipe.whyChloeLikes}</p>
                </div>

                <div className="pt-4 border-t border-[#F9F5F0]">
                  <label className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-widest mb-4 block">制作步骤</label>
                  <ul className="space-y-3">
                    {recipe.steps.map((step: string, idx: number) => (
                      <li key={idx} className="flex gap-4 items-start text-sm text-[#2D2D2D]/80 leading-relaxed cn-relaxed">
                        <span className="w-5 h-5 bg-[#F9F5F0] rounded-lg flex items-center justify-center text-[10px] font-black text-[#D48C45] flex-shrink-0">
                          {idx + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty-recipe"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white/40 rounded-[40px] border border-dashed border-[#E5D3C5]/40"
            >
              <ChefHat size={32} className="mx-auto text-[#A0A0A0] mb-4 opacity-20" />
              <p className="text-[#A0A0A0] font-bold text-[11px] tracking-[0.3em] uppercase cn-relaxed">
                {eggCount === 0 ? '储蛋盒是空的，快去捡鸡蛋吧！' : '点击上方按钮获取营养食谱灵感'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default GuideView;
