
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, X, Users, AlertTriangle } from 'lucide-react';
import { addDoc } from 'firebase/firestore';
import { hensRef, deleteHenAndLogs, updateHen } from '../services/firebase';
import { Hen } from '../types';
import HenGraphic from '../components/HenGraphic';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

interface HensViewProps {
  hens: Hen[];
  onRefresh: () => void;
  onNotify: (message: string, type?: 'success' | 'info') => void;
}

const HenItem: React.FC<{ 
  hen: Hen; 
  onDeleteRequest: (hen: Hen) => void; 
  onEdit: (hen: Hen) => void 
}> = ({ hen, onDeleteRequest, onEdit }) => {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, -20], [1, 0]);

  return (
    <div className="relative overflow-hidden rounded-[32px] mb-5">
      <motion.div 
        style={{ opacity }}
        className="absolute inset-0 bg-[#FFEBEE] flex items-center justify-end px-12 text-[#B66649] z-0"
      >
        <div className="flex flex-col items-center gap-1">
          <Trash2 size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-center cn-relaxed">删除</span>
        </div>
      </motion.div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.05}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) {
            onDeleteRequest(hen);
            x.set(0);
          }
        }}
        style={{ x }}
        className="bg-white p-6 rounded-[32px] border border-[#E5D3C5]/20 flex items-center justify-between shadow-[0_10px_30px_rgba(45,45,45,0.01)] relative z-10 touch-pan-x"
      >
        <div className="flex items-center gap-6 flex-1">
          <div className="w-16 h-16 rounded-[24px] overflow-hidden bg-[#F9F5F0] flex items-center justify-center border border-[#E5D3C5]/20">
            <HenGraphic color={hen.color} size={65} />
          </div>
          <div>
            <h3 className="font-bold text-[#2D2D2D] text-xl leading-tight tracking-tight cn-relaxed">{hen.name}</h3>
            <div className="flex gap-2 text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider mt-2 cn-relaxed">
              <span className="bg-[#F9F5F0] px-3 py-1 rounded-full">{hen.breed}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => onEdit(hen)} 
          className="p-4 text-gray-200 hover:text-[#D48C45] transition-colors border-l border-[#F9F5F0] pl-6 ml-2"
        >
          <Edit2 size={20} />
        </button>
      </motion.div>
    </div>
  );
};

const HensView: React.FC<HensViewProps> = ({ hens, onRefresh, onNotify }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingHen, setEditingHen] = useState<Hen | null>(null);
  const [henToDelete, setHenToDelete] = useState<Hen | null>(null);

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [color, setColor] = useState('#E5D3C5');

  const colors = [
    { name: 'Caramel', hex: '#D48C45' },
    { name: 'Clay', hex: '#E5D3C5' },
    { name: 'Ochre', hex: '#C2974D' },
    { name: 'Charcoal', hex: '#2D2D2D' },
    { name: 'Sand', hex: '#FDF5E6' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      if (editingHen) {
        await updateHen(editingHen.id, { name, breed, age, color });
        onNotify(`${name} 资料已更新。`);
      } else {
        await addDoc(hensRef, { 
          name, 
          breed: breed || '传统品种', 
          age: age || '1', 
          color, 
          createdAt: Date.now() 
        });
        onNotify(`欢迎 ${name} 加入！`);
      }
      setEditingHen(null);
      setShowAdd(false);
      setName('');
      setBreed('');
      setAge('');
      onRefresh();
    } catch (err) {
      onNotify("保存档案时出错。", "info");
    }
  };

  const openEdit = (hen: Hen) => {
    setEditingHen(hen);
    setName(hen.name);
    setBreed(hen.breed);
    setAge(hen.age.toString());
    setColor(hen.color);
    setShowAdd(false);
  };

  const handleDeleteHen = async () => {
    if (!henToDelete || !henToDelete.id) return;
    try {
      await deleteHenAndLogs(henToDelete.id);
      onNotify(`${henToDelete.name} 已移除。`);
      setHenToDelete(null);
      onRefresh();
    } catch (e) {
      onNotify("移除成员时出错。", "info");
      setHenToDelete(null);
    }
  };

  return (
    <div className="p-10 pb-40 bg-[#F9F5F0] min-h-full scroll-native overflow-y-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="font-serif text-4xl font-extrabold text-[#2D2D2D] tracking-tighter">我的鸡群</h1>
          <p className="text-[#A0A0A0] text-[11px] mt-2 uppercase tracking-[0.3em] font-bold cn-relaxed opacity-60">鸡舍管理</p>
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={() => {
            setEditingHen(null);
            setName('');
            setBreed('');
            setAge('');
            setColor('#D48C45');
            setShowAdd(true);
          }} 
          className="bg-[#D48C45] text-white w-14 h-14 rounded-3xl flex items-center justify-center shadow-xl shadow-[#D48C45]/20 active:scale-95"
        >
          <Plus size={28} />
        </motion.button>
      </div>

      <div className="space-y-1 mb-12">
        <AnimatePresence initial={false}>
          {hens.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center opacity-30 bg-white/30 rounded-[50px] border border-dashed border-[#E5D3C5]/40"
            >
              <Users size={48} strokeWidth={1} className="mb-5 text-[#A0A0A0]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#A0A0A0] cn-relaxed">暂无成员</p>
            </motion.div>
          ) : (
            hens.map((hen) => (
              <HenItem 
                key={hen.id} 
                hen={hen} 
                onDeleteRequest={(h) => setHenToDelete(h)} 
                onEdit={openEdit} 
              />
            ))
          )}
        </AnimatePresence>
        
        {hens.length > 0 && (
          <p className="text-center text-[10px] text-[#A0A0A0] font-bold uppercase tracking-[0.3em] mt-8 opacity-40 cn-relaxed">
            向左滑动移除成员
          </p>
        )}
      </div>

      <AnimatePresence>
        {henToDelete && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[200] bg-[#2D2D2D]/20 backdrop-blur-3xl flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} 
              animate={{ scale: 1, y: 0 }} 
              className="bg-white rounded-[44px] w-full max-w-sm p-10 shadow-2xl relative border border-[#E5D3C5]/20 text-center"
            >
              <div className="w-16 h-16 bg-[#B66649]/10 rounded-[28px] flex items-center justify-center text-[#B66649] mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h2 className="font-serif text-2xl font-extrabold text-[#2D2D2D] mb-4 tracking-tighter">
                确认移除？
              </h2>
              <p className="text-sm text-[#A0A0A0] leading-relaxed mb-8 font-medium cn-relaxed">
                确定要移除 <span className="text-[#2D2D2D] font-bold">{henToDelete.name}</span> 吗？此操作将同时删除她所有的产蛋记录。
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setHenToDelete(null)}
                  className="py-4 bg-[#F9F5F0] text-[#2D2D2D] rounded-[24px] font-bold text-sm transition-transform active:scale-95 cn-relaxed"
                >
                  取消
                </button>
                <button 
                  onClick={handleDeleteHen}
                  className="py-4 bg-[#D48C45] text-white rounded-[24px] font-bold text-sm shadow-lg shadow-[#D48C45]/20 transition-transform active:scale-95 cn-relaxed"
                >
                  确认移除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(showAdd || editingHen) && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[150] bg-[#2D2D2D]/10 backdrop-blur-2xl flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ y: 50, scale: 0.95 }} 
              animate={{ y: 0, scale: 1 }} 
              className="bg-white rounded-[44px] w-full max-w-md p-10 shadow-2xl relative border border-[#E5D3C5]/20"
            >
              <button 
                onClick={() => { setShowAdd(false); setEditingHen(null); }} 
                className="absolute top-10 right-10 text-gray-300 hover:text-[#2D2D2D]"
              >
                <X size={24} />
              </button>
              <h2 className="font-serif text-3xl font-extrabold text-[#2D2D2D] mb-10 tracking-tighter">
                {editingHen ? `档案详情` : '添加新成员'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-3 px-1 cn-relaxed">名字</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="输入名字" 
                    className="w-full p-5 bg-[#F9F5F0]/60 border border-[#E5D3C5]/30 rounded-2xl outline-none font-bold text-[#2D2D2D] cn-relaxed" 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-2 px-1 cn-relaxed">品种</label>
                    <input 
                      type="text" 
                      value={breed} 
                      onChange={e => setBreed(e.target.value)} 
                      placeholder="输入品种" 
                      className="w-full p-5 bg-[#F9F5F0]/60 border border-[#E5D3C5]/30 rounded-2xl outline-none text-xs font-bold cn-relaxed" 
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-2 px-1 cn-relaxed">破壳日期/周期</label>
                    <input 
                      type="text" 
                      value={age} 
                      onChange={e => setAge(e.target.value)} 
                      placeholder="如：1年" 
                      className="w-full p-5 bg-[#F9F5F0]/60 border border-[#E5D3C5]/30 rounded-2xl outline-none text-xs font-bold cn-relaxed" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-5 px-1 cn-relaxed">羽毛颜色</label>
                  <div className="flex gap-4 justify-between px-2">
                    {colors.map(c => (
                      <button 
                        key={c.hex} 
                        type="button" 
                        onClick={() => setColor(c.hex)} 
                        style={{ backgroundColor: c.hex }} 
                        className={`w-11 h-11 rounded-2xl border-4 transition-all ${color === c.hex ? 'border-[#2D2D2D] scale-110 shadow-lg' : 'border-transparent opacity-60'}`} 
                      />
                    ))}
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full py-6 bg-[#D48C45] text-white rounded-[32px] font-bold text-lg shadow-xl shadow-[#D48C45]/20 active:scale-95 transition-transform cn-relaxed"
                >
                  {editingHen ? '更新资料' : '加入鸡群'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HensView;
