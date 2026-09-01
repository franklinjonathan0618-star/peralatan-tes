
import React from 'react';
import NavBar from './NavBar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      <main className="flex-1 relative">
        {children}
      </main>
      <footer className="py-6 border-t bg-card/50">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-gray-600">
            {new Date().getFullYear()} Cabang Papua
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
