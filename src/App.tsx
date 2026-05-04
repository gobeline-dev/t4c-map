import { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';

const MapViewer = lazy(() => import('./components/MapViewer'));
const Legal = lazy(() => import('./pages/Legal'));
const Wiki = lazy(() => import('./pages/Wiki'));

const LoadingSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full animate-spin border-2" style={{ borderColor: 'hsl(var(--border))', borderTopColor: 'hsl(var(--primary))' }} />
      <p className="text-sm text-muted-foreground animate-pulse">Chargement...</p>
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
              <Route path="/wiki" element={<Navigate to="/wiki/quests" replace />} />
              <Route path="/wiki/:section" element={<Wiki />} />
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