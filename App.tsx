import React from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  return (
    <div className="flex h-full w-full font-sans bg-base text-secondary overflow-hidden rounded-md">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <ChatInterface />
        </main>
      </div>
    </div>
  );
};

export default App;