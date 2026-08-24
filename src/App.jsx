import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { WelcomePage } from './pages/WelcomePage';
import { OverviewPage } from './pages/OverviewPage';
import { ReceivablesPage } from './pages/ReceivablesPage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { CustomersPage } from './pages/CustomersPage';
import { CashFlowPage } from './pages/CashFlowPage';
import { ActionCenterPage } from './pages/ActionCenterPage';

function AppContent() {
  const { isAuthenticated, loading, business, isDemo } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F4] flex items-center justify-center font-mono text-xs text-gray-500 gap-3">
        <span className="material-symbols-outlined animate-spin text-brand-gold text-2xl">progress_activity</span>
        <span>Initializing DuesOS Workspace...</span>
      </div>
    );
  }

  // If not authenticated and not in demo mode, show the Welcome / Login screen
  if (!isAuthenticated) {
    return <WelcomePage />;
  }

  const businessDisplayName = business?.name || (isDemo ? 'Sharma Engineering Pvt. Ltd.' : 'My Business');

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background selection:bg-brand-gold selection:text-[#151D1C]">
      {/* Global Consistent Top Navbar */}
      <Navbar />

      {/* Dynamic Route Content */}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/receivables" element={<ReceivablesPage />} />
          <Route path="/invoice/:id" element={<InvoiceDetailPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/cash-flow" element={<CashFlowPage />} />
          <Route path="/action-center" element={<ActionCenterPage />} />
          {/* Fallback to Overview */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Minimal Editorial Footer */}
      <footer className="w-full border-t border-[#E0DED7] bg-[#F5F3EE] py-4 px-edge-margin text-xs text-gray-500 font-sans">
        <div className="max-w-container-max mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1B1C19]">DuesOS</span>
            <span>— Receivables & Risk Intelligence Operating System</span>
          </div>
          <div className="font-mono text-[11px] text-gray-400">
            {businessDisplayName} • {isDemo ? 'Live Demonstration Sandbox' : 'Private Workspace'}
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
