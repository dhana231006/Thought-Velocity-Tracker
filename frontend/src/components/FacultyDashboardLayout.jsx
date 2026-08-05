import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import AIChatbox from './AIChatbox';
import { Toaster } from 'sonner';

const FacultyDashboardLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden z-10 relative bg-[#050505] text-text">
      <Toaster position="bottom-right" theme="dark" richColors />
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 px-8 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md">
          <div>
            <h1 className="font-display font-bold text-xl tracking-wide bg-gradient-to-r from-secondaryAccent to-primaryAccent bg-clip-text text-transparent">
              TVT Faculty & Early Warning System
            </h1>
            <p className="text-xs text-textMuted mt-0.5">Cohort Longitudinal Monitoring Portal</p>
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
