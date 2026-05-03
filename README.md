# T4C Cartographie

Visualiseur de cartes HD pour **The 4th Coming (T4C)**. Application web minimaliste centrée sur la consultation des cartes des 8 mondes du jeu, avec zoom, déplacement, mini-carte et lecture de coordonnées.

## Fonctionnalités

- **Cartes HD des 8 mondes** : Arakas, Leoworld, Underworld, Drake Island, Île de Lune / Nieve, Extension 4/5/6.
- **Zoom & Pan** : molette, boutons à l'écran, raccourcis clavier (`+` / `-` / `0` / flèches).
- **Mini-carte** : aperçu de la zone visible, clic pour se téléporter sur la carte principale.
- **Lecture de coordonnées** : suivi en temps réel de la position du curseur sous la forme `gx.gy.worldId`. Double-clic pour copier les coordonnées dans le presse-papier.
- **Plein écran** : mode immersif sur desktop.
- **Thème** : bascule clair/parchemin.

## Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 3
- React Router 7 (Hash Router)
- `react-zoom-pan-pinch` pour le zoom/pan
- Framer Motion pour les transitions
- `lucide-react` pour les icônes

## Design

Esthétique sombre et épurée inspirée d'une approche « shadcn/ui » : palette teal-cyan pour les accents, surfaces `card` avec bordures discrètes, header fixe avec backdrop-blur, typographie Inter `font-semibold`.

## Installation

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build production
npm run preview  # prévisualisation du build
```

## Structure du projet

```
src/
  App.tsx                  # Routes (/maps, /legal)
  main.tsx                 # Entrée
  index.css                # Tailwind + variables CSS du thème
  components/
    Layout.tsx             # Layout général (header + main + footer)
    HeaderNav.tsx          # Navigation top fixe
    Footer.tsx             # Pied de page
    MapViewer.tsx          # Composant principal de cartographie
    shared/ScrollContainer.tsx
  pages/
    Legal.tsx              # Mentions légales
  config/
    maps.ts                # Définition des 8 mondes
  context/
    ThemeContext.tsx       # Bascule de thème
public/
  assets/maps/             # Images PNG haute résolution des cartes
```

## Mentions légales

The 4th Coming (T4C) est une marque déposée et une propriété intellectuelle de **Dialsoft LLC**. Ce projet est une application non officielle à but informatif, non affiliée à Dialsoft.
