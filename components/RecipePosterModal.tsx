
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Loader2, ChefHat, Sparkles, Utensils, Quote, Egg } from 'lucide-react';
import { Recipe } from '../types';
import html2canvas from 'html2canvas';

interface RecipePosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  onNotify: (message: string, type?: 'success' | 'info') => void;
}

const getLocalYMD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const RecipePosterModal: React.FC<RecipePosterModalProps> = ({ isOpen, onClose, recipe, onNotify }) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveToGallery = async () => {
    const element = document.getElementById('recipe-share-poster');
    if (!element) return;

    try {
      setIsSaving(true);
      await new Promise(r => setTimeout(r, 200));
      
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 4,
        backgroundColor: '#FFFFFF',
        logging: false,
        width: 375,
        height: 667,
        onclone: (clonedDoc) => {
          const clonedEl = clonedDoc.getElementById('recipe-share-poster');
          if (clonedEl) {
            clonedEl.style.width = '375px';
            clonedEl.style.height = '667px';
            clonedEl.style.transform = 'none';
            clonedEl.style.position = 'relative';
          }
        }
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Recipe_Card_${getLocalYMD(new Date())}.png`;
      link.href = dataUrl;
      link.click();
      
      onNotify('✨ 食谱已存入相册', 'success');
      onClose();
    } catch (err) {
      onNotify('保存失败', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  const displayedSteps = recipe.steps.slice(0, 4);

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
              className="bg-white rounded-[40px] overflow-hidden shadow-2xl relative border border-white/20 scale-[0.75] sm:scale-[0.85]"
              id="recipe-share-poster"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#D48C45] via-[#B66649] to-[#D48C45] z-20" />

              <div className="p-10 h-full flex flex-col relative z-10">
                <header className="mb-8 flex justify-between items-start h-20">
                  <div className="flex-1 pr-4 text-left">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles size={12} className="text-[#D48C45]" />
                      <span className="text-[10px] font-black text-[#D48C45] uppercase tracking-widest leading-none">Daily Recipe</span>
                    </div>
                    <h1 className="font-serif text-3xl font-black text-[#2D2D2D] leading-tight m-0 line-clamp-2">
                      {recipe.recipeName}
                    </h1>
                  </div>
                  <div className="bg-[#F9F5F0] w-14 h-14 rounded-2xl flex items-center justify-center text-[#D48C45] flex-shrink-0">
                    <ChefHat size={28} />
                  </div>
                </header>

                <div className="space-y-6 flex-1">
                  {/* Chloe's Recommendation Box */}
                  <div className="relative min-h-[60px] text-left">
                    <Quote className="absolute -top-2 -left-2 text-[#D48C45]/10" size={32} />
                    <p className="text-[14px] text-[#2D2D2D] font-medium leading-relaxed italic relative z-10 cn-relaxed pl-5 line-clamp-3 m-0">
                      {recipe.whyChloeLikes}
                    </p>
                  </div>

                  {/* Highlights Grid */}
                  <div className="flex gap-4 h-20">
                     <div className="flex-1 bg-[#F9F5F0] rounded-[20px] flex flex-col items-center justify-center">
                        <span className="text-[9px] font-bold text-[#A0A0A0] uppercase block mb-1 leading-none">用蛋量</span>
                        <span className="text-xl font-black text-[#D48C45] leading-none">{recipe.eggsNeeded} 枚</span>
                     </div>
                     <div className="flex-1 bg-[#F9F5F0] rounded-[20px] flex flex-col items-center justify-center">
                        <span className="text-[9px] font-bold text-[#A0A0A0] uppercase block mb-1 leading-none">营养级别</span>
                        <span className="text-xl font-black text-[#D48C45] leading-none">⭐⭐⭐</span>
                     </div>
                  </div>

                  {/* Steps */}
                  <div className="flex-1 min-h-0 overflow-hidden text-left">
                    <span className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-widest mb-4 block leading-none">制作要点</span>
                    <ul className="space-y-4 m-0 p-0">
                      {displayedSteps.map((step, idx) => (
                        <li key={idx} className="flex gap-3 items-start m-0 p-0">
                          <span className="w-5 h-5 bg-[#D48C45] text-white rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0">
                            {idx + 1}
                          </span>
                          <p className="flex-1 text-[13px] text-[#2D2D2D]/90 leading-snug cn-relaxed line-clamp-2 m-0">
                            {step}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Secret Tip Box */}
                  <div className="bg-[#B66649]/5 h-16 rounded-2xl border border-[#B66649]/10 px-5 flex flex-col justify-center text-left">
                    <span className="text-[9px] font-black text-[#B66649] uppercase block mb-1 flex items-center gap-1 leading-none">
                      <Utensils size={10} /> 秘诀
                    </span>
                    <p className="text-[11px] font-bold text-[#2D2D2D] cn-relaxed truncate m-0">{recipe.secret}</p>
                  </div>
                </div>

                <footer className="h-16 mt-8 border-t border-[#F9F5F0] flex justify-between items-center relative">
                   <div className="flex flex-col text-left">
                      <span className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-widest leading-none mb-1">Chloe's Chicken</span>
                      <span className="text-[9px] font-bold text-[#D48C45] tabular-nums leading-none">{getLocalYMD(new Date())}</span>
                   </div>
                   <div className="w-10 h-10 opacity-30 flex items-center justify-end">
                      <Utensils size={20} className="text-[#D48C45]" />
                   </div>
                </footer>
              </div>
            </motion.div>

            {/* Action Button */}
            <div className="mt-8 w-full">
              <button
                onClick={handleSaveToGallery}
                disabled={isSaving}
                className="w-full py-5 bg-[#B66649] text-white rounded-[28px] font-extrabold text-lg flex items-center justify-center gap-3 shadow-xl shadow-[#B66649]/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    <Download size={24} />
                    <span className="cn-relaxed">保存精美食谱</span>
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

export default RecipePosterModal;
