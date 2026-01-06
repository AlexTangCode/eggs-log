
import React, { useState, useMemo } from 'react';
import { Trash2, Egg, Calendar, Edit3, X, Save, Eraser, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
// Fixed: updateEggLog does not exist in firebase services, using updateEggLogDetailed instead
import { deleteEggLog, updateEggLogDetailed, clearAllEggLogs } from '../services/firebase';
import { EggLog } from '../types';

// Defined missing HistoryViewProps interface to fix compilation error
interface HistoryViewProps {
  logs: EggLog[];
  onRefresh: () => void;
  onNotify: (message: string, type?: 'success' | 'info') => void;
}

const HistoryItem: React.FC<{ 
  log: EggLog; 
  onRefresh: () => void; 
  onEdit: (log: EggLog) => void;
  onNotify: (message: string, type?: 'success' | 'info') => void;
}> = ({ log, onRefresh, onEdit, onNotify }) => {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, -50, 0], [1, 1, 0]);

  const handleDelete = async () => {
    try {
      if (!log.id) {
        console.error("Missing log ID for deletion");
        return;
      }
      await deleteEggLog(log.id);
      onNotify(`Record deleted successfully.`);
      onRefresh();
    } catch (err) {
      onNotify("Failed to delete record.", "info");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[24px]">
      <motion.div 
        style={{ opacity }}
        className="absolute inset-0 bg-red-400 flex items-center justify-end px-8 text-white"
      >
        <Trash2 size={24} />
      </motion.div>

      <motion.div 
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        style={{ x }}
        onDragEnd={(_, info) => { if (info.offset.x < -80) handleDelete(); }}
        className="bg-white p-5 rounded-[24px] flex items-center justify-between group relative z-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-white/40"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#FFF8E1] rounded-full flex items-center justify-center text-orange-400">
            <Egg size={20} fill="currentColor" />
          </div>
          <div>
            <h4 className="font-bold text-gray-800">{log.henName}</h4>
            <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">
              {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xl font-black text-gray-800">{log.weight}</span>
            <span className="text-[10px] text-gray-200 ml-0.5 font-black uppercase">g</span>
          </div>
          <button onClick={() => onEdit(log)} className="p-2 text-gray-100 group-hover:text-gray-300 transition-colors">
            <Edit3 size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const HistoryView: React.FC<HistoryViewProps> = ({ logs, onRefresh, onNotify }) => {
  const [editingLog, setEditingLog] = useState<EggLog | null>(null);
  const [editWeight, setEditWeight] = useState<number>(0);

  const stats = useMemo(() => {
    if (logs.length === 0) return { total: 0, avg: 0 };
    const sum = logs.reduce((acc, curr) => acc + curr.weight, 0);
    return {
      total: logs.length,
      avg: Math.round(sum / logs.length)
    };
  }, [logs]);

  const handleClearAll = async () => {
    if (confirm('Clear all data?')) {
      try {
        // Fixed: now clearAllEggLogs is exported from services/firebase.ts
        await clearAllEggLogs();
        onNotify("History cleared.");
        onRefresh();
      } catch (err) {
        onNotify("Failed to clear history.", "info");
      }
    }
  }

  return (
    <div className="p-8 pb-32 min-h-full bg-[#FFF8E1]">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-light text-gray-800 tracking-tight">Activity</h1>
        {logs.length > 0 && (
          <button onClick={handleClearAll} className="text-gray-300 hover:text-red-400">
            <Eraser size={20} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-[32px] p-8 mb-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-white/50 flex justify-between items-center">
        <div>
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] block mb-1">Total Harvest</span>
          <div className="text-4xl font-black text-gray-800">{stats.total}<span className="text-sm font-bold ml-1 text-gray-200">Eggs</span></div>
        </div>
        <div className="h-12 w-[1px] bg-gray-100" />
        <div>
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] block mb-1">Avg. Weight</span>
          <div className="text-4xl font-black text-gray-800">{stats.avg}<span className="text-sm font-bold ml-1 text-gray-200">G</span></div>
        </div>
      </div>
      
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-gray-300">
          <Egg size={48} strokeWidth={1} className="mb-4 opacity-30" />
          <p className="text-[10px] font-black uppercase tracking-widest">No history recorded yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <motion.div key={log.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                <HistoryItem 
                  log={log} 
                  onRefresh={onRefresh} 
                  onNotify={onNotify}
                  onEdit={(l) => { setEditingLog(l); setEditWeight(l.weight); }} 
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Modal (Minimalist) */}
      <AnimatePresence>
        {editingLog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-white/60 backdrop-blur-md flex items-center justify-center p-8">
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-white rounded-[32px] w-full max-w-sm p-10 shadow-2xl">
              <div className="flex justify-between items-start mb-10">
                <h3 className="text-2xl font-light text-gray-800">Edit Log</h3>
                <button onClick={() => setEditingLog(null)} className="text-gray-300"><X size={24} /></button>
              </div>
              <div className="text-center mb-10">
                <div className="text-5xl font-black text-gray-800">{editWeight}g</div>
                <input type="range" min="30" max="90" value={editWeight} onChange={(e) => setEditWeight(parseInt(e.target.value))} className="w-full accent-orange-400 mt-8" />
              </div>
              <button onClick={async () => {
                try {
                  // Fixed: using updateEggLogDetailed which is the exported member for egg log updates
                  await updateEggLogDetailed(editingLog.id, {
                    weight: editWeight,
                    quantity: editingLog.quantity || 1,
                    timestamp: editingLog.timestamp
                  });
                  onNotify("Log updated.");
                  setEditingLog(null);
                  onRefresh();
                } catch (err) {
                  onNotify("Update failed.", "info");
                }
              }} className="w-full py-5 bg-orange-500 text-white rounded-[20px] font-bold shadow-lg shadow-orange-100">Update</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HistoryView;
