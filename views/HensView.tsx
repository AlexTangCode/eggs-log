
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, X, Users } from 'lucide-react';
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
  onDelete: (hen: Hen) => void; 
  onEdit: (hen: Hen) => void 
}> = ({ hen, onDelete, onEdit }) => {
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
          <span className="text-[9px] font-black uppercase tracking-widest">Remove</span>
        </div>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.05}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) onDelete(hen);
        }}
        style={{ x }}
        className="bg-white p-6 rounded-[32px] border border-[#E5D3C5]/20 flex items-center justify-between shadow-[0_10px_30px_rgba(45,45,45,0.01)] relative z-10 touch-pan-x"
      >
        <div className="flex items-center gap-6 flex-1">
          <div className="w-16 h-16 rounded-[24px] overflow-hidden bg-[#F9F5F0] flex items-center justify-center border border-[#E5D3C5]/20">
            <HenGraphic color={hen.color} size={65} />
          </div>
          <div>
            <h3 className="font-bold text-[#2D2D2D] text-xl leading-tight tracking-tight">{hen.name}</h3>
            <div className="flex gap-2 text-[10px] font-black text-[#A0A0A0] uppercase tracking-[0.2em] mt-2">
              <span className="bg-[#F9F5F0] px-3 py-1 rounded-full">{hen.breed}</span>
              <span className="bg-[#F9F5F0] px-3 py-1 rounded-full">{hen.age}</span>
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
        onNotify(`${name} updated.`);
      } else {
        await addDoc(hensRef, { 
          name, 
          breed: breed || 'Heritage', 
          age: age || '1', 
          color, 
          createdAt: Date.now() 
        });
        onNotify(`${name} registered!`);
      }
      setEditingHen(null);
      setShowAdd(false);
      setName('');
      setBreed('');
      setAge('');
      onRefresh();
    } catch (err) {
      onNotify("Error saving profile.", "info");
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

  const handleDeleteHen = async (hen: Hen) => {
    if (!hen.id) return;
    try {
      await deleteHenAndLogs(hen.id);
      onNotify(`${hen.name} removed.`);
      onRefresh();
    } catch (e) {
      onNotify("Deletion error.", "info");
    }
  };

  return (
    <div className="p-10 pb-40 bg-[#F9F5F0] min-h-full scroll-native overflow-y-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold text-[#2D2D2D] tracking-tighter">The Flock</h1>
          <p className="text-[#A0A0A0] text-[10px] mt-2 uppercase tracking-[0.4em] font-black">Coop Management</p>
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
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[#A0A0A0]">Empty Coop</p>
            </motion.div>
          ) : (
            hens.map((hen) => (
              <HenItem 
                key={hen.id} 
                hen={hen} 
                onDelete={handleDeleteHen} 
                onEdit={openEdit} 
              />
            ))
          )}
        </AnimatePresence>
        
        {hens.length > 0 && (
          <p className="text-center text-[9px] text-[#A0A0A0] font-black uppercase tracking-[0.6em] mt-8 opacity-40">
            Swipe left to remove
          </p>
        )}
      </div>

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
              <h2 className="text-3xl font-bold text-[#2D2D2D] mb-10 tracking-tighter">
                {editingHen ? `Edit Profile` : 'New Member'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-[0.3em] block mb-3 px-1">Coop Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Vanessa" 
                    className="w-full p-5 bg-[#F9F5F0]/60 border border-[#E5D3C5]/30 rounded-2xl outline-none font-bold text-[#2D2D2D]" 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-[0.3em] block mb-2 px-1">Breed</label>
                    <input 
                      type="text" 
                      value={breed} 
                      onChange={e => setBreed(e.target.value)} 
                      placeholder="Legacy" 
                      className="w-full p-5 bg-[#F9F5F0]/60 border border-[#E5D3C5]/30 rounded-2xl outline-none text-xs font-bold" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-[0.3em] block mb-2 px-1">Age</label>
                    <input 
                      type="text" 
                      value={age} 
                      onChange={e => setAge(e.target.value)} 
                      placeholder="1 yr" 
                      className="w-full p-5 bg-[#F9F5F0]/60 border border-[#E5D3C5]/30 rounded-2xl outline-none text-xs font-bold" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#A0A0A0] uppercase tracking-[0.3em] block mb-5 px-1">Coat Color</label>
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
                  className="w-full py-6 bg-[#D48C45] text-white rounded-[32px] font-bold text-lg shadow-xl shadow-[#D48C45]/20 transition-transform active:scale-95"
                >
                  {editingHen ? 'Save Updates' : 'Welcome Home'}
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
