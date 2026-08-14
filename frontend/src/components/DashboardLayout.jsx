import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AIChatbox from './AIChatbox';
import { Toaster } from 'sonner';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden z-10 relative bg-[#050505] text-text">
      <Toaster position="bottom-right" theme="dark" richColors />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <AIChatbox />
    </div>
  );
};

export default DashboardLayout;
