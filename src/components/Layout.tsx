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

  const isMaps = location.pathname === '/maps' || location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col text-foreground" style={{ background: 'hsl(var(--background))' }}>
      <HeaderNav />

      <main ref={mainRef} className="flex-1 pt-16">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={isMaps ? 'h-[calc(100vh-64px)]' : 'mx-auto max-w-7xl px-6 lg:px-8 py-10'}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {!isMaps && <Footer />}
    </div>
  );
};

export default Layout;
