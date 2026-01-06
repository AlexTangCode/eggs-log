
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Wallet, Tag, Banknote, Calendar, CheckCircle } from 'lucide-react';
import { Expense, ExpenseCategory } from '../types';
import { addExpense, deleteExpense } from '../services/firebase';

interface FinanceViewProps {
  expenses: Expense[];
  onRefresh: () => void;
  onNotify: (message: string, type?: 'success' | 'info') => void;
}

const FinanceView: React.FC<FinanceViewProps> = ({ expenses, onRefresh, onNotify }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.FEED);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    try {
      await addExpense({
        amount: Number(amount),
        category,
        date,
        timestamp: new Date(date).getTime()
      });
      onNotify('支出已记录。');
      setShowAdd(false);
      setAmount('');
      onRefresh();
    } catch (err) {
      onNotify('保存支出时出错。', 'info');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      onNotify('支出已删除。');
      onRefresh();
    } catch (err) {
      onNotify('删除支出时出错。', 'info');
    }
  };

  return (
    <div className="p-10 pb-44 bg-[#F9F5F0] min-h-full overflow-y-auto scroll-native">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="font-serif text-4xl font-extrabold text-[#2D2D2D] tracking-tighter">支出记录</h1>
          <p className="text-[#A0A0A0] text-[11px] mt-2 uppercase tracking-[0.3em] font-bold cn-relaxed opacity-60">财务管理</p>
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={() => setShowAdd(true)} 
          className="bg-[#D48C45] text-white w-14 h-14 rounded-3xl flex items-center justify-center shadow-xl shadow-[#D48C45]/20 active:scale-95"
        >
          <Plus size={28} />
        </motion.button>
      </div>

      <div className="space-y-4">
        {expenses.length === 0 ? (
          <div className="text-center py-20 bg-white/40 rounded-[40px] border border-dashed border-[#E5D3C5]/40">
            <Wallet size={48} className="mx-auto text-[#A0A0A0] mb-4 opacity-20" />
            <p className="text-[#A0A0A0] font-bold text-[11px] tracking-[0.3em] uppercase cn-relaxed">暂无支出记录</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <motion.div 
              key={expense.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-[32px] border border-[#E5D3C5]/20 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-[#F9F5F0] rounded-2xl flex items-center justify-center text-[#D48C45]">
                  <Tag size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-[#2D2D2D] text-lg cn-relaxed">{expense.category}</h3>
                  <p className="text-[#A0A0A0] text-[10px] font-bold uppercase tracking-widest">{expense.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-xl font-bold text-[#2D2D2D] tabular-nums">¥{expense.amount}</span>
                </div>
                <button 
                  onClick={() => handleDelete(expense.id)}
                  className="p-2 text-gray-200 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
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
                onClick={() => setShowAdd(false)} 
                className="absolute top-10 right-10 text-gray-300 hover:text-[#2D2D2D]"
              >
                <X size={24} />
              </button>
              <h2 className="font-serif text-3xl font-extrabold text-[#2D2D2D] mb-10 tracking-tighter">新增支出</h2>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-3 px-1 cn-relaxed">类别</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.values(ExpenseCategory).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-4 rounded-2xl font-bold text-xs transition-all ${
                          category === cat 
                            ? 'bg-[#D48C45] text-white shadow-lg' 
                            : 'bg-[#F9F5F0] text-[#A0A0A0]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-3 px-1 cn-relaxed">金额 (¥)</label>
                  <div className="relative">
                    <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0]" size={18} />
                    <input 
                      type="number" 
                      step="0.01"
                      value={amount} 
                      onChange={e => setAmount(e.target.value)} 
                      placeholder="0.00" 
                      className="w-full p-5 pl-12 bg-[#F9F5F0]/60 border border-[#E5D3C5]/30 rounded-2xl outline-none font-bold text-[#2D2D2D] cn-relaxed tabular-nums" 
                      required 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider block mb-3 px-1 cn-relaxed">日期</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0]" size={18} />
                    <input 
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)} 
                      className="w-full p-5 pl-12 bg-[#F9F5F0]/60 border border-[#E5D3C5]/30 rounded-2xl outline-none font-bold text-[#2D2D2D] cn-relaxed" 
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full py-6 bg-[#D48C45] text-white rounded-[32px] font-bold text-lg shadow-xl shadow-[#D48C45]/20 active:scale-95 transition-transform cn-relaxed flex items-center justify-center gap-3"
                >
                  <CheckCircle size={22} />
                  保存记录
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinanceView;
