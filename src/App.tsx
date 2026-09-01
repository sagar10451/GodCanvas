import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PortalProvider } from './data/portalContext';
import { PresentationProvider } from './data/presentationContext';
import Header from './components/Header';
import PortalPage from './pages/PortalPage';

function AppContent() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className={`min-h-screen bg-[#e2e8f0] pt-[78px]`}>
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <Routes>
        {/* Tech Notes portal — catch all depths */}
        <Route path="/" element={<PortalPage searchQuery={searchQuery} onSearchChange={setSearchQuery} />} />
        <Route path="/*" element={<PortalPage searchQuery={searchQuery} onSearchChange={setSearchQuery} />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <PortalProvider>
      <PresentationProvider>
        <AppContent />
      </PresentationProvider>
    </PortalProvider>
  );
}
