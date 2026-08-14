import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import AIChatbox from './AIChatbox';
import { Toaster } from 'sonner';
import { Menu } from 'lucide-react';

const FacultyDashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden z-10 relative bg-[#050505] text-text">
      <Toaster position="bottom-right" theme="dark" richColors />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        <header className="h-20 px-4 md:px-8 flex items-center border-b border-white/5 bg-black/20 backdrop-blur-md shrink-0 space-x-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden glass-button p-2.5 rounded-xl border border-white/10 bg-white/5 hover:border-primaryAccent/40 transition-colors text-textMuted hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display font-bold text-lg md:text-xl tracking-wide bg-gradient-to-r from-secondaryAccent to-primaryAccent bg-clip-text text-transparent">
              TVT Faculty & Early Warning System
            </h1>
            <p className="text-[10px] md:text-xs text-textMuted mt-0.5 hidden sm:block">Cohort Longitudinal Monitoring Portal</p>
          </div>
        </header>
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-6">
          <Outlet />
        </main>
      </div>
      <AIChatbox />
    </div>
  );
};

export default FacultyDashboardLayout;
