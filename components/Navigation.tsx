
import React from 'react';
import { Home, BarChart3, Activity, Users } from 'lucide-react';
import { View } from '../types';
import { motion } from 'framer-motion';

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const tabs = [
    { id: View.HOME, label: '首页', icon: Home },
    { id: View.STATISTICS, label: '统计', icon: BarChart3 },
    { id: View.HEALTH, label: '健康', icon: Activity },
    { id: View.HENS, label: '鸡群', icon: Users },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[100] pointer-events-none">
      <div className="bg-white/70 backdrop-blur-2xl border border-white/40 flex justify-around items-center h-20 px-3 rounded-[40px] shadow-[0_20px_60px_rgba(45,45,45,0.12)] pointer-events-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className="flex flex-col items-center justify-center relative flex-1 h-16 min-w-[64px] transition-transform active:scale-90"
            >
              {isActive && (
                <motion.div 
                  layoutId="nav-glow"
                  className="absolute inset-0 bg-[#D48C45]/10 rounded-3xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className={`transition-all duration-300 relative z-10 ${isActive ? 'text-[#D48C45]' : 'text-[#A0A0A0]'}`}>
                <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] relative z-10 mt-1.5 ${isActive ? 'text-[#D48C45]' : 'text-[#A0A0A0]'}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="nav-dot"
                  className="absolute -bottom-1 w-1 h-1 bg-[#D48C45] rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Navigation;
