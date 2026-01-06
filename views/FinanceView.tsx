
import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Plus, Trash2, X, Wallet, Tag, Banknote, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import { Expense, ExpenseCategory } from '../types';
import { addExpense, deleteExpense, updateExpense } from '../services/firebase';

interface FinanceViewProps {
  expenses: Expense[];
  onRefresh: () => void;
  onNotify: (message: string, type?: 'success' | 'info') => void;
}

const ExpenseItem = React.memo(({ 
  expense, 
  onDeleteRequest, 
  onEdit 
}: { 
  expense: Expense; 
  onDeleteRequest: (expense: Expense) => void; 
  onEdit: (expense: Expense) => void 
}) => {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, -20], [1, 0]);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-[32px] mb-5"
    >
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
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.05}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) {
            onDeleteRequest(expense);
            x.set(0);
          } else {
            x.set(0);
          }
        }}
        style={{ x }}
        onClick={() => onEdit(expense)}
        className="bg-white p-6 rounded-[32px] border border-[#E5D3C5]/20 flex items-center justify-between shadow-sm relative z-10 touch-pan-x cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-[#F9F5F0] rounded-2xl flex items-center justify-center text-[#D48C45]">
            <Tag size={20} />
          </div>
          <div className="flex flex-col items-start">
            <h3 className="font-bold text-[#2D2D2D] text-lg cn-relaxed">{expense.category}</h3>
            <p className="text-[#A0A0A0] text-[10px] font-bold uppercase tracking-widest">{expense.date}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold text-[#2D2D2D] tabular-nums">${expense.amount.toFixed(2)}</span>
        </div>
      </motion.div>
    </motion.div>
  );
});

const FinanceView: React.FC<FinanceViewProps> = ({ expenses, onRefresh, onNotify }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.FEED);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const resetForm = () => {
    setAmount('');
    setCategory(ExpenseCategory.FEED);
    setDate(new Date().toISOString().split('T')[0]);
    setEditingExpense(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDate(expense.date);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount)) return;

    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          amount: numAmount,
          category,
          date,
          timestamp: new Date(date).getTime()
        });
        onNotify('支出记录已更新。');
      } else {
        await addExpense({
          amount: numAmount,
          category,
          date,
          timestamp: new Date(date).getTime()
        });
        onNotify('支出已记录。');
      }
      setShowModal(false);
      resetForm();
      onRefresh();
    } catch (err) {
      onNotify('保存支出时出错。', 'info');
    }
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;
    try {
      await deleteExpense(expenseToDelete.id);
      onNotify('支出已删除。');
      setExpenseToDelete(null);
      onRefresh();
    } catch (err) {
      onNotify('删除支出时出错。', 'info');
      setExpenseToDelete(null);
    }
  };

  return (
    <div className="p-10 pb-44 bg-[#F9F5F0] min-h-full overflow-y-auto scroll-native">
      <div className="flex items-center justify-between mb-12">
        <div className="flex flex-col items-start">
          <h1 className="font-serif text-4xl font-extrabold text-[#2D2D2D] tracking-tighter">支出管理</h1>
          <p className="text-[#A0A0A0] text-[11px] mt-2 uppercase tracking-[0.3em] font-bold cn-relaxed opacity-60">支出记录管理</p>
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={handleOpenAdd} 
          className="bg-[#D48C45] text-white w-14 h-14 rounded-3xl flex items-center justify-center shadow-xl shadow-[#D48C45]/20 active:scale-95"
        >
          <Plus size={28} />
        </motion.button>
      </div>

      <div className="space-y-1">
        <AnimatePresence mode="popLayout" initial={false}>
          {expenses.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 bg-white/40 rounded-[40px] border border-dashed border-[#E5D3C5]/40"
            >
              <Wallet size={48} className="mx-auto text-[#A0A0A0] mb-4 opacity-20" />
              <p className="text-[#A0A0A0] font-bold text-[11px] tracking-[0.3em] uppercase cn-relaxed">暂无支出记录</p>
            </motion.div>
          ) : (
            expenses.map((expense) => (
              <ExpenseItem 
                key={expense.id}
                expense={expense}
                onEdit={handleOpenEdit}
                onDeleteRequest={(e) => setExpenseToDelete(e)}
              />
            ))
          )}
        </AnimatePresence>
        
        {expenses.length > 0 && (
          <p className="text-center text-[10px] text-[#A0A0A0] font-bold uppercase tracking-[0.3em] mt-8 opacity-40 cn-relaxed">
            向左滑动删除 • 点击记录编辑
          </p>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[150] bg-[#2D2D2D]/10 backdrop-blur-2xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ y: 50, scale: 0.95 }} 
              animate={{ y: 0, scale: 1 }} 
              className="bg-white rounded-[44px] w-full max-w-md p-10 shadow-2xl relative border border-[#E5D3C5]/20 h-fit max-h-[90vh] overflow-y-auto scroll-native"
            >
              <button 
                onClick={() => setShowModal(false)} 
                className="absolute top-8 right-8 text-gray-300 hover:text-[#2D2D2D] transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex flex-col items-start w-full">
                <h2 className="font-serif text-3xl font-extrabold text-[#2D2D2D] mb-10 tracking-tighter">
                  {editingExpense ? '修改支出' : '新增支出'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-8 w-full">
                  {/* Category Row */}
                  <div className="flex items-start gap-4 w-full">
                    <label className="w-20 flex-shrink-0 text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider pt-3 cn-relaxed">类别</label>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      {Object.values(ExpenseCategory).map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`py-3 rounded-2xl font-bold text-[10px] transition-all uppercase tracking-wider ${
                            category === cat 
                              ? 'bg-[#D48C45] text-white shadow-lg shadow-[#D48C45]/20' 
                              : 'bg-[#F9F5F0] text-[#A0A0A0] border border-[#E5D3C5]/20'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount Row */}
                  <div className="flex items-center gap-4 w-full">
                    <label className="w-20 flex-shrink-0 text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider cn-relaxed">金额 ($)</label>
                    <div className="flex-1 relative min-w-0">
                      <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0]" size={18} />
                      <input 
                        type="number" 
                        step="0.01"
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                        placeholder="0.00" 
                        className="w-full p-4 pl-12 bg-[#F9F5F0]/60 border border-[#E5D3C5]/30 rounded-2xl outline-none font-bold text-[#2D2D2D] cn-relaxed tabular-nums text-sm" 
                        required 
                      />
                    </div>
                  </div>

                  {/* Date Row */}
                  <div className="flex items-center gap-4 w-full">
                    <label className="w-20 flex-shrink-0 text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider cn-relaxed">日期</label>
                    <div className="flex-1 relative min-w-0">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A0A0A0]" size={18} />
                      <input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)} 
                        className="w-full p-4 pl-12 bg-[#F9F5F0]/60 border border-[#E5D3C5]/30 rounded-2xl outline-none font-bold text-[#2D2D2D] cn-relaxed text-sm truncate" 
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4">
                    <button 
                      type="submit" 
                      className="w-full py-6 bg-[#D48C45] text-white rounded-[32px] font-bold text-lg shadow-xl shadow-[#D48C45]/20 active:scale-95 transition-transform cn-relaxed flex items-center justify-center gap-3"
                    >
                      <CheckCircle size={22} />
                      {editingExpense ? '保存修改' : '保存记录'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expenseToDelete && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[200] bg-[#2D2D2D]/20 backdrop-blur-3xl flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} 
              animate={{ scale: 1, y: 0 }} 
              className="bg-white rounded-[44px] w-full max-sm p-10 shadow-2xl relative border border-[#E5D3C5]/20 text-center h-fit"
            >
              <div className="w-16 h-16 bg-[#B66649]/10 rounded-[28px] flex items-center justify-center text-[#B66649] mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h2 className="font-serif text-2xl font-extrabold text-[#2D2D2D] mb-4 tracking-tighter">
                确认删除？
              </h2>
              <p className="text-sm text-[#A0A0A0] leading-relaxed mb-8 font-medium cn-relaxed">
                删除后将重新计算您的净利润。确定要删除此笔支出吗？
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setExpenseToDelete(null)}
                  className="py-4 bg-[#F9F5F0] text-[#2D2D2D] rounded-[24px] font-bold text-sm transition-transform active:scale-95 cn-relaxed"
                >
                  取消
                </button>
                <button 
                  onClick={handleDelete}
                  className="py-4 bg-[#D48C45] text-white rounded-[24px] font-bold text-sm shadow-lg shadow-[#D48C45]/20 transition-transform active:scale-95 cn-relaxed"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinanceView;
