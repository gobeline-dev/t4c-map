import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t backdrop-blur-md mt-auto" style={{ background: 'hsl(var(--background) / 0.8)', borderColor: 'hsl(var(--border) / 0.5)' }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© {currentYear} T4C Cartographie</p>

          <div className="flex items-center gap-6 text-sm">
            <Link to="/legal" className="text-muted-foreground hover:text-foreground transition-colors">
              Mentions Légales
            </Link>
            <span className="text-muted-foreground/60 italic text-xs">
              T4C est une marque déposée de Dialsoft LLC
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
