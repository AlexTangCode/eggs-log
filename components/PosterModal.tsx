
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Egg, Heart, Trophy, Download, Loader2 } from 'lucide-react';
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

const PosterModal: React.FC<PosterModalProps> = ({ isOpen, onClose, hens, logs, onNotify }) => {
  const [isSaving, setIsSaving] = useState(false);
  const todayDate = new Date().toDateString();

  const posterData = useMemo(() => {
    if (hens.length === 0) return null;

    // Get stats for all hens
    const stats = hens.map(hen => {
      const henLogs = logs.filter(l => l.henId === hen.id);
      const todayLogs = henLogs.filter(l => new Date(l.timestamp).toDateString() === todayDate);
      
      return {
        ...hen,
        todayCount: todayLogs.reduce((acc, curr) => acc + (curr.quantity || 1), 0),
        lifetimeCount: henLogs.reduce((acc, curr) => acc + (curr.quantity || 1), 0)
      };
    });

    // Pick top two or first two
    const topTwo = [...stats]
      .sort((a, b) => b.todayCount - a.todayCount || b.lifetimeCount - a.lifetimeCount)
      .slice(0, 2);

    const todayTotal = stats.reduce((acc, curr) => acc + curr.todayCount, 0);

    return {
      topTwo,
      todayTotal,
      dateStr: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    };
  }, [hens, logs, todayDate]);

  const handleSaveImage = async () => {
    const element = document.getElementById('share-poster');
    if (!element) return;

    try {
      setIsSaving(true);
      // Small delay to ensure any layout shifts are settled
      await new Promise(r => setTimeout(r, 100));
      
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 3, // High quality
        backgroundColor: '#FFF9C4',
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `chloe_chicken_report_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
      
      onNotify('战报图片已保存至相册/下载！');
    } catch (err) {
      console.error('Save error:', err);
      onNotify('保存图片失败，请重试或手动截图。', 'info');
    } finally {
      setIsSaving(false);
    }
  };

  if (!posterData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-[#2D2D2D]/60 backdrop-blur-md"
        >
          <div className="relative w-full max-w-[360px] flex flex-col items-center">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors"
            >
              <X size={28} />
            </button>

            {/* Poster Card */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full bg-gradient-to-b from-[#FFF9C4] to-[#FFECB3] rounded-[48px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.2)] border border-white/40 flex flex-col"
              id="share-poster"
            >
              {/* Header */}
              <div className="pt-10 pb-6 text-center px-8">
                <h1 className="font-serif text-2xl font-black text-[#D48C45] tracking-tight">Chloes Chicken 每日战报</h1>
                <p className="text-[#B66649]/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">{posterData.dateStr}</p>
              </div>

              {/* Showdown Section */}
              <div className="px-6 py-4 flex-1">
                <div className="bg-white/40 rounded-[40px] p-6 backdrop-blur-sm border border-white/30 flex items-center relative">
                  
                  {/* Hen A */}
                  <div className="flex-1 flex flex-col items-center">
                    <div className="mb-2 scale-75">
                      <HenGraphic color={posterData.topTwo[0]?.color || '#D48C45'} size={100} />
                    </div>
                    <h3 className="font-bold text-[#2D2D2D] text-sm cn-relaxed truncate w-full text-center">
                      {posterData.topTwo[0]?.name || '母鸡 A'}
                    </h3>
                    <div className="mt-3 space-y-1 text-center">
                      <div className="text-[10px] text-[#A0A0A0] font-bold uppercase tracking-wider">今日产蛋</div>
                      <div className="text-2xl font-black text-[#D48C45] tabular-nums">{posterData.topTwo[0]?.todayCount || 0}</div>
                      <div className="text-[8px] text-[#A0A0A0] font-bold uppercase tracking-widest mt-1">累计: {posterData.topTwo[0]?.lifetimeCount || 0}</div>
                    </div>
                  </div>

                  {/* VS Divider */}
                  <div className="absolute left-1/2 -translate-x-1/2 z-10">
                    <div className="w-10 h-10 bg-[#FFECB3] rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                      <Heart size={16} fill="#B66649" stroke="none" className="animate-pulse" />
                    </div>
                  </div>

                  {/* Hen B */}
                  <div className="flex-1 flex flex-col items-center">
                    <div className="mb-2 scale-75">
                      <HenGraphic color={posterData.topTwo[1]?.color || '#E5D3C5'} size={100} />
                    </div>
                    <h3 className="font-bold text-[#2D2D2D] text-sm cn-relaxed truncate w-full text-center">
                      {posterData.topTwo[1]?.name || '母鸡 B'}
                    </h3>
                    <div className="mt-3 space-y-1 text-center">
                      <div className="text-[10px] text-[#A0A0A0] font-bold uppercase tracking-wider">今日产蛋</div>
                      <div className="text-2xl font-black text-[#B66649] tabular-nums">{posterData.topTwo[1]?.todayCount || 0}</div>
                      <div className="text-[8px] text-[#A0A0A0] font-bold uppercase tracking-widest mt-1">累计: {posterData.topTwo[1]?.lifetimeCount || 0}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="px-8 pb-10">
                <div className="bg-[#B66649] rounded-[32px] p-6 text-center shadow-lg shadow-[#B66649]/20">
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.3em] mb-2 block cn-relaxed">今日总收货</span>
                  <div className="text-3xl font-black text-white flex items-center justify-center gap-2">
                    {posterData.todayTotal} <span className="text-lg">枚</span> 🥚
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-center gap-2 opacity-60">
                  <p className="text-[11px] font-bold text-[#D48C45] italic cn-relaxed">"家有神鸡，鸡蛋自由！"</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Trophy size={10} className="text-[#D48C45]" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#2D2D2D]">Chloes Chicken</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <div className="mt-8 flex gap-3 w-full">
              <button
                onClick={handleSaveImage}
                disabled={isSaving}
                className="flex-1 py-4 bg-white/20 backdrop-blur-md rounded-3xl text-white font-bold text-sm flex items-center justify-center gap-2 border border-white/20 active:scale-95 transition-transform disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                保存图片
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Chloes Chicken 每日战报',
                      text: `我家鸡舍今天收获了 ${posterData.todayTotal} 枚鸡蛋！`,
                      url: window.location.href
                    }).catch(console.error);
                  } else {
                    alert('请手动截图分享您的战报！');
                  }
                }}
                className="flex-1 py-4 bg-white/10 backdrop-blur-md rounded-3xl text-white font-bold text-sm flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-transform"
              >
                <Share2 size={18} /> 分享战报
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PosterModal;
