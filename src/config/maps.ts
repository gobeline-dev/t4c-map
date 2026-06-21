export interface MapInfo {
  id: string;
  worldId: number;
  name: string;
  path: string;
}

const BASE = import.meta.env.BASE_URL;

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
