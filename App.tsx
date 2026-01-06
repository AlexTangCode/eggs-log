
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { View, Hen, EggLog } from './types';
import { getHens, getEggLogs } from './services/firebase';
import Navigation from './components/Navigation';
import HomeView from './views/HomeView';
import StatisticsView from './views/StatisticsView';
import HealthView from './views/HealthView';
import HensView from './views/HensView';
import { CheckCircle, Info } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [hens, setHens] = useState<Hen[]>([]);
  const [logs, setLogs] = useState<EggLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const refreshData = async () => {
    try {
      const [fetchedHens, fetchedLogs] = await Promise.all([
        getHens(),
        getEggLogs()
      ]);
      setHens(fetchedHens as Hen[]);
      setLogs(fetchedLogs as EggLog[]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const renderView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full bg-[#F9F5F0]">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-10 h-10 rounded-full border-2 border-[#D48C45]/20 border-t-[#D48C45]" 
          />
        </div>
      );
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="h-full w-full"
        >
          {(() => {
            switch (currentView) {
              case View.HOME:
                return <HomeView hens={hens} onRefresh={refreshData} />;
              case View.STATISTICS:
                return <StatisticsView hens={hens} logs={logs} onRefresh={refreshData} />;
              case View.HEALTH:
                return <HealthView hens={hens} logs={logs} />;
              case View.HENS:
                return <HensView hens={hens} onRefresh={refreshData} onNotify={showNotification} />;
              default:
                return <HomeView hens={hens} onRefresh={refreshData} />;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-[#F9F5F0] flex flex-col relative overflow-hidden shadow-[0_0_80px_rgba(45,45,45,0.08)] font-['Quicksand'] selection:bg-[#D48C45]/20">
      <main className="flex-1 overflow-y-auto pb-32">
        {renderView()}
      </main>
      
      <Navigation 
        currentView={currentView} 
        onViewChange={(v) => {
          setCurrentView(v);
          refreshData(); 
        }} 
      />

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[200] w-[85%] max-w-[300px]"
          >
            <div className={`flex items-center gap-3 p-4 rounded-3xl shadow-[0_15px_40px_rgba(45,45,45,0.12)] border border-white/40 backdrop-blur-xl ${
              notification.type === 'success' ? 'bg-[#D48C45] text-white' : 'bg-[#2D2D2D] text-white'
            }`}>
              {notification.type === 'success' ? <CheckCircle size={18} /> : <Info size={18} />}
              <span className="text-xs font-bold tracking-tight">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
