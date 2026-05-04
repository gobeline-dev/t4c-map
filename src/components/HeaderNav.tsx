import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, ShieldCheck, Sun, Moon, Menu, X, BookOpen } from 'lucide-react';
import { useTheme, type ThemeName } from '../context/ThemeContext';

const HeaderNav = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const themeMeta: Record<ThemeName, { label: string; icon: typeof Sun }> = {
    classic:   { label: 'Thème Classique',  icon: Moon },
    parchment: { label: 'Thème Parchemin',  icon: Sun },
  };
  const ThemeIcon = themeMeta[theme].icon;

  useEffect(() => {
    const handleNativeFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    const handleCustomFSChange = (e: any) => setIsFullscreen(e.detail);

    document.addEventListener('fullscreenchange', handleNativeFSChange);
    window.addEventListener('t4c-fullscreen-change', handleCustomFSChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleNativeFSChange);
      window.removeEventListener('t4c-fullscreen-change', handleCustomFSChange);
    };
  }, []);

  const navItems = [
    { name: 'Cartographie', icon: Map, path: '/maps' },
    { name: 'Wiki', icon: BookOpen, path: '/wiki' },
    { name: 'Mentions Légales', icon: ShieldCheck, path: '/legal' },
  ];

  const isActive = (path: string) =>
    location.pathname === path
    || location.pathname.startsWith(`${path}/`)
    || (path === '/maps' && location.pathname === '/');

  if (isFullscreen) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b" style={{ background: 'hsl(var(--background) / 0.8)', borderColor: 'hsl(var(--border) / 0.5)' }}>
      <nav className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/maps" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.12)', border: '1px solid hsl(var(--primary) / 0.3)' }}>
              <Map size={16} className="text-primary-strong" />
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground group-hover:opacity-80 transition-opacity">
              T4C <span className="text-primary-strong">Cartographie</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map(item => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center gap-2 px-4 h-9 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'text-foreground bg-muted'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <item.icon size={16} />
                  {item.name}
                </Link>
              );
            })}

            <button
              onClick={toggleTheme}
              className="ml-2 inline-flex items-center justify-center w-9 h-9 rounded-md border transition-all hover:border-primary-soft"
              style={{ borderColor: 'hsl(var(--border) / 0.6)', background: 'hsl(var(--card) / 0.6)' }}
              title={`Changer de thème (actuel : ${themeMeta[theme].label})`}
              aria-label="Basculer le thème"
            >
              <ThemeIcon size={16} className="text-primary-strong" />
            </button>
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Menu"
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-1">
            {navItems.map(item => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`inline-flex items-center gap-2 px-4 h-10 rounded-md text-sm font-medium transition-colors ${
                    active ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <item.icon size={16} />
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <ThemeIcon size={16} className="text-primary-strong" />
              {themeMeta[theme].label}
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default HeaderNav;
