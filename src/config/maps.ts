export interface MapInfo {
  id: string;
  worldId: number;
  name: string;
  path: string;
}

const BASE = import.meta.env.BASE_URL;

// Conversion coordonnée de jeu → pixel sur l'image HD.
// Le monde de jeu fait 3072×3072 unités ; les cartes HD font 24576×12288 px,
// soit 8 px par unité en X et 4 px par unité en Y (les anciennes cartes
// 6144×3072 utilisaient 2 et 1 — les cartes HD sont 4× plus grandes).
//   pixelX = gx * PX_PER_GX ; pixelY = gy * PX_PER_GY
//   gx = pixelX / PX_PER_GX ; gy = pixelY / PX_PER_GY
export const PX_PER_GX = 8;
export const PX_PER_GY = 4;

export const MAPS: MapInfo[] = [
  { id: 'arakas',     worldId: 0, name: "Arakas - Stoneheim - Raven's Dust", path: `${BASE}assets/maps/map_HD_0_Arakas.png` },
  { id: 'leoworld',   worldId: 1, name: 'Leoworld',                          path: `${BASE}assets/maps/map_HD_1_Leoworld.png` },
  { id: 'underworld', worldId: 2, name: 'Underworld',                        path: `${BASE}assets/maps/map_HD_2_Underworld.png` },
  { id: 'ravendust',  worldId: 3, name: 'Dungeons',                          path: `${BASE}assets/maps/map_HD_3_RavenDust.png` },
  { id: 'stoneheim',  worldId: 4, name: 'Ile de Glace',                      path: `${BASE}assets/maps/map_HD_4_Stoneheim.png` },
  { id: 'ext4',       worldId: 5, name: 'Extension 4',                       path: `${BASE}assets/maps/map_HD_5_Extension4.png` },
  { id: 'ext5',       worldId: 6, name: 'Extension 5',                       path: `${BASE}assets/maps/map_HD_6_Extension5.png` },
  { id: 'ext6',       worldId: 7, name: 'Extension 6',                       path: `${BASE}assets/maps/map_HD_7_Extension6.png` },
];
