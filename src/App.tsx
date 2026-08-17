import React, { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { AppSidebar } from './components/AppSidebar';
import { ThemeToggle } from './components/ThemeToggle';
import { SplashScreen } from './components/SplashScreen';
import { Index } from './pages/Index';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  return (
    <div className="flex h-screen bg-background">
      {showSplash ? (
        <SplashScreen onFinish={handleSplashFinish} />
      ) : (
        <>
          <AppSidebar />
          <div className="flex-1 overflow-auto">
            <div className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4">
              <ThemeToggle />
              <h1 className="text-xl font-semibold">Alse Bold</h1>
            </div>
            <main className="p-6">
              <Index />
            </main>
          </div>
          <Toaster />
        </>
      )}
    </div>
  );
}

export default App;