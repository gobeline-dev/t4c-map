import { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';

const MapViewer = lazy(() => import('./components/MapViewer'));
const Legal = lazy(() => import('./pages/Legal'));

const LoadingSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      <p className="text-slate-500 text-sm font-fantasy animate-pulse">Chargement...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Suspense fallback={<LoadingSkeleton />}>
            <Routes>
              <Route path="/" element={<Navigate to="/maps" replace />} />
              <Route path="/maps" element={<MapViewer />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="*" element={<Navigate to="/maps" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </ThemeProvider>
  );
};

export default App;