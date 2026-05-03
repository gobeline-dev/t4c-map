import { ShieldCheck, Info, Lock, Globe } from 'lucide-react';

const Legal = () => {
  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl border surface-card p-8 md:p-12">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'hsl(var(--primary) / 0.12)' }} />
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium status-pill">
            <ShieldCheck size={14} className="text-primary-strong" />
            Informations légales
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-foreground">
            Mentions Légales
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            Conformément aux dispositions de l'article 6 de la Loi n° 2004-575 du 21 juin 2004 (LCEN).
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Édition */}
        <section className="surface-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.12)', border: '1px solid hsl(var(--primary) / 0.3)' }}>
              <Info size={18} className="text-primary-strong" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Édition du site</h2>
          </div>
          <div className="border-b" style={{ borderColor: 'hsl(var(--border) / 0.5)' }} />
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>Le présent site est édité à titre non-professionnel par :</p>
            <p className="font-semibold text-foreground">Bignole</p>
            <p className="italic text-xs pt-2">
              Conformément à l'article 6, III, 2° de la loi n° 2004-575 du 21 juin 2004, l'éditeur a choisi
              de rester anonyme. Les informations d'identification personnelle ont été transmises à l'hébergeur.
            </p>
          </div>
        </section>

        {/* Hébergement */}
        <section className="surface-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.12)', border: '1px solid hsl(var(--primary) / 0.3)' }}>
              <Globe size={18} className="text-primary-strong" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Hébergement</h2>
          </div>
          <div className="border-b" style={{ borderColor: 'hsl(var(--border) / 0.5)' }} />
          <div className="text-sm text-muted-foreground leading-relaxed space-y-1">
            <p>Le site est hébergé par :</p>
            <p className="font-semibold text-foreground">GitHub Inc.</p>
            <p>88 Colin P Kelly Jr St</p>
            <p>San Francisco, CA 94107, USA</p>
            <p>Téléphone : +1 (415) 448-6673</p>
          </div>
        </section>

        {/* Propriété intellectuelle */}
        <section className="md:col-span-2 surface-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.12)', border: '1px solid hsl(var(--primary) / 0.3)' }}>
              <ShieldCheck size={18} className="text-primary-strong" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Propriété intellectuelle et crédits</h2>
          </div>
          <div className="border-b" style={{ borderColor: 'hsl(var(--border) / 0.5)' }} />
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              <strong className="text-foreground">The 4th Coming (T4C)</strong> est une marque déposée et une propriété
              intellectuelle de <span className="text-primary-strong font-semibold">Dialsoft LLC</span>. Les noms d'objets,
              statistiques de sorts, caractéristiques de monstres et tout autre élément issu de l'univers du jeu sont
              la propriété exclusive de leurs auteurs respectifs.
            </p>
            <p>
              Ce site est une « Fan-App » non officielle à but purement informatif. Il contient des assets visuels
              originaux du jeu (images, textures, icônes) issus des fichiers du jeu, et n'est en aucun cas affilié,
              approuvé ou soutenu par Dialsoft ou les exploitants officiels des serveurs T4C.
            </p>
            <p>
              Le code source de l'application est mis à disposition à des fins éducatives et communautaires.
            </p>
          </div>
        </section>

        {/* Données personnelles */}
        <section className="md:col-span-2 surface-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.12)', border: '1px solid hsl(var(--primary) / 0.3)' }}>
              <Lock size={18} className="text-primary-strong" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Données personnelles</h2>
          </div>
          <div className="border-b" style={{ borderColor: 'hsl(var(--border) / 0.5)' }} />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ce site ne collecte aucune donnée personnelle et n'utilise aucun cookie de traçage ou de publicité.
            Aucune donnée n'est stockée de manière persistante dans votre navigateur.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Legal;
