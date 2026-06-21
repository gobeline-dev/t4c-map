import { useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import HeaderNav from './HeaderNav';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // The interactive map lives at /wiki/carte and needs a full-height, padding-free
  // container (and no footer) so the MapViewer can fill the viewport.
  const isFullBleed = location.pathname === '/wiki/carte';

  return (
    <div className="min-h-screen flex flex-col text-foreground" style={{ background: 'hsl(var(--background))' }}>
      <HeaderNav />

      <main ref={mainRef} className="flex-1 pt-16">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={isFullBleed ? 'h-[calc(100vh-64px)]' : 'mx-auto max-w-7xl px-6 lg:px-8 py-10'}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {!isFullBleed && <Footer />}
    </div>
  );
};

export default Layout;
