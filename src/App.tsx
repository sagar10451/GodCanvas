import { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { PortalProvider, usePortal } from './data/portalContext';
import { PresentationProvider } from './data/presentationContext';
import Header from './components/Header';
import PortalPage from './pages/PortalPage';
import { BookOpen, Code2 } from 'lucide-react';

function PortalPicker() {
  return (
    <div className="min-h-screen bg-[#e2e8f0] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose a Portal</h1>
        <p className="text-gray-500 mb-8">Select which content you want to explore</p>
        <div className="flex gap-6">
          <Link
            to="/devStack"
            className="group block bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-indigo-400 transition-all duration-300 w-64"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
              <Code2 className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">dev<span className="text-blue-600">Stack</span></h2>
            <p className="text-sm text-gray-500 mt-1">IT / CS Topics</p>
          </Link>
          <Link
            to="/chapterBreakdown"
            className="group block bg-white rounded-2xl p-8 border-2 border-indigo-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-indigo-400 transition-all duration-300 w-64"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Chapter<span className="text-blue-600">Breakdown</span></h2>
            <p className="text-sm text-gray-500 mt-1">School — Class 10, 12</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const { site } = usePortal();

  // No portal selected — show picker
  if (!site) {
    return <PortalPicker />;
  }

  return (
    <div className={`min-h-screen bg-[#e2e8f0] pt-[78px]`}>
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <Routes>
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
