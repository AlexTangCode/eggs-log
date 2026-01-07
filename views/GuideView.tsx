
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Egg, Plus, RefreshCcw, ChefHat, X, Utensils, Loader2, Sparkles, Share2 } from 'lucide-react';
import { getEggInventory, incrementEggInventory, decrementEggInventory } from '../services/firebase';
// Fixed: Switch from OpenAI service to Gemini service
import { getChloeRecipe } from '../services/geminiService';
import { Recipe } from '../types';
import RecipePosterModal from '../components/RecipePosterModal';

interface GuideViewProps {
  onNotify?: (message: string, type?: 'success' | 'info') => void;
}

const GuideView: React.FC<GuideViewProps> = ({ onNotify }) => {
  const [eggCount, setEggCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [crackingIndex, setCrackingIndex] = useState<number | null>(null);
  
  // Share state
  const [showShareRecipe, setShowShareRecipe] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    const count = await getEggInventory();
    setEggCount(count);
    setLoading(false);
  };

  const fetchRecipe = async () => {
    if (eggCount === 0) {
      onNotify?.("储蛋盒空空如也，先去捡鸡蛋吧！", "info");
      return;
    }
    setRecipeLoading(true);
    try {
      // Fixed: Using Gemini service with internal API key management
      const data = await getChloeRecipe(eggCount);
      setRecipe(data);
    } catch (err: any) {
      console.error(err);
      onNotify?.(`无法连接到食谱服务: ${err.message || '未知错误'}`, "info");
    } finally {
      setRecipeLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleEatEgg = async (index: number) => {
    if (eggCount <= 0 || crackingIndex !== null) return;
    setCrackingIndex(index);
    setTimeout(async () => {
      try {
        await decrementEggInventory(1);
        setEggCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        onNotify?.("更新库存失败。", "info");
      } finally {
        setCrackingIndex(null);
      }
    }, 600);
  };

  const handleAddEgg = async () => {
    try {
      await incrementEggInventory(1);
      setEggCount(prev => prev + 1);
    } catch (err) {
      onNotify?.("增加库存失败。", "info");
    }
  };

  // 2x6 Grid slots for the carton
  const slots = useMemo(() => Array.from({ length: 12 }), []);

  return (
    <div className="p-10 pb-44 bg-[#F9F5F0] min-h-full scroll-native overflow-y-auto">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex flex-col items-start">
          <h1 className="font-serif text-4xl font-extrabold text-[#2D2D2D] tracking-tighter">吃蛋指南</h1>
          <p className="text-[#A0A0A0] text-[11px] mt-2 uppercase tracking-[0.3em] font-bold cn-relaxed opacity-60">储蛋盒与 Gemini 营养餐</p>
        </div>
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
            className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-[#D48C45] shadow-sm border border-[#E5D3C5]/20 active:bg-[#F9F5F0]"
          >
            <Plus size={20} />
          </motion.button>
        </div>

        <div className="bg-[#E5D3C5]/30 p-5 rounded-[40px] border border-[#E5D3C5]/50 shadow-inner grid grid-cols-6 gap-3 relative overflow-hidden">
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
                      animate={{ scale: 1.3, opacity: 0 }}
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
             <div className="absolute -bottom-1 -right-1 bg-[#B66649] text-white text-[9px] font-bold px-3 py-1 rounded-full shadow-lg">
                +{eggCount - 12} 枚
             </div>
          )}
        </div>
        <p className="text-center text-[9px] text-[#A0A0A0] font-bold uppercase tracking-[0.2em] mt-4 opacity-40 cn-relaxed">
          点击一枚鸡蛋代表已食用
        </p>
      </section>

      {/* 2. Gemini Recipe Section */}
      <section>
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-2 text-[#B66649]">
            <Utensils size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Chloe 的营养乐园</span>
          </div>
          <button
            onClick={fetchRecipe}
            disabled={recipeLoading || eggCount === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm ${
              eggCount === 0 ? 'bg-gray-100 text-gray-300' : 'bg-[#B66649]/10 text-[#B66649] hover:bg-[#B66649]/20'
            }`}
          >
            {recipeLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
            {recipe ? '换个灵感' : 'Gemini 灵感'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {recipeLoading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-[40px] p-12 border border-[#E5D3C5]/20 text-center shadow-[0_10px_30px_rgba(45,45,45,0.02)]"
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center text-[#D48C45] mx-auto mb-6"
              >
                <ChefHat size={32} />
              </motion.div>
              <h4 className="text-[#2D2D2D] font-bold text-lg mb-2">正在咨询营养师...</h4>
              <p className="text-sm font-medium text-[#A0A0A0] cn-relaxed">正在为 3 岁的 Chloe 量身定制食谱</p>
            </motion.div>
          ) : recipe ? (
            <motion.div
              key="recipe-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[40px] p-8 border border-[#E5D3C5]/20 shadow-[0_20px_60px_rgba(45,45,45,0.03)] relative"
            >
              <button 
                onClick={() => setShowShareRecipe(true)}
                className="absolute top-6 right-6 p-2 text-[#A0A0A0] hover:text-[#D48C45] transition-colors"
                title="生成分享卡片"
              >
                <Share2 size={20} />
              </button>

              <div className="flex items-start justify-between mb-8 pr-10">
                <div className="flex-1">
                  <h3 className="font-serif text-2xl font-black text-[#2D2D2D] leading-tight mb-2">
                    {recipe.recipeName}
                  </h3>
                  <div className="flex items-center gap-1 text-[#D48C45]">
                    <Sparkles size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Gemini 精选</span>
                  </div>
                </div>
                <div className="bg-[#D48C45] text-white px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-md shadow-[#D48C45]/20">
                  {recipe.eggsNeeded} 枚蛋
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-[#F9F5F0] p-6 rounded-3xl border border-[#E5D3C5]/10">
                   <label className="text-[10px] font-black text-[#B66649] uppercase tracking-[0.2em] mb-3 block">宝宝喜欢的原因 🧸</label>
                   <p className="text-sm text-[#2D2D2D] font-medium leading-relaxed cn-relaxed italic">"{recipe.whyChloeLikes}"</p>
                </div>
                
                <div className="px-1">
                   <label className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-widest mb-4 block flex items-center gap-2">
                      <Utensils size={12} /> 制作秘诀
                   </label>
                   <p className="text-sm text-[#2D2D2D] font-bold leading-relaxed cn-relaxed">{recipe.secret}</p>
                </div>

                <div className="pt-6 border-t border-[#F9F5F0]">
                  <label className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-widest mb-6 block">准备步骤</label>
                  <ul className="space-y-4">
                    {recipe.steps.map((step: string, idx: number) => (
                      <li key={idx} className="flex gap-4 items-start text-sm text-[#2D2D2D]/80 leading-relaxed cn-relaxed">
                        <span className="w-6 h-6 bg-[#D48C45]/10 rounded-xl flex items-center justify-center text-[11px] font-black text-[#D48C45] flex-shrink-0">
                          {idx + 1}
                        </span>
                        <p className="flex-1">{step}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 text-center opacity-40">
                  <p className="text-[9px] font-bold text-[#A0A0A0] uppercase tracking-widest italic">由 Google Gemini 3 提供温馨支持</p>
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
              <p className="text-[#A0A0A0] font-bold text-[11px] tracking-[0.3em] uppercase cn-relaxed px-10">
                {eggCount === 0 ? '储蛋盒是空的，快去捡鸡蛋吧！' : '点击灵感按钮，看看 Gemini 今天为 Chloe 准备了什么惊喜'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Recipe Share Modal */}
      {recipe && (
        <RecipePosterModal
          isOpen={showShareRecipe}
          onClose={() => setShowShareRecipe(false)}
          recipe={recipe}
          onNotify={onNotify || (() => {})}
        />
      )}
    </div>
  );
};

export default GuideView;
