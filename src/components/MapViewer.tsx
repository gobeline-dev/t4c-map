import React, { useState, useRef, memo, useEffect, useCallback } from 'react';
import { Maximize, ZoomIn, ZoomOut, MousePointer2, Loader2, Fullscreen, Minimize, MapPin } from 'lucide-react';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef, type ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch';
import ScrollContainer from '../components/shared/ScrollContainer';
import { MAPS } from '../config/maps';
import type { MapInfo } from '../config/maps';
import { MapMarkers } from './MapMarkers';
import { MapMarkerPanel } from './MapMarkerPanel';

interface Coords { x: number; y: number; gx: number; gy: number; }
interface TransformLike { scale: number; positionX: number; positionY: number; }

const CoordsOverlay = memo(({ subscribe, worldId, isFullscreen }: {
  subscribe: (cb: (c: Coords) => void) => () => void;
  worldId: number;
  isFullscreen: boolean;
}) => {
  const [coords, setCoords] = useState<Coords>({ x: 0, y: 0, gx: 0, gy: 0 });
  useEffect(() => subscribe(setCoords), [subscribe]);

  return (
    <div className={`absolute bottom-3 left-3 flex flex-col items-start gap-1.5 pointer-events-none z-20 ${isFullscreen ? 'pl-safe pb-safe' : ''}`}>
      <div className="px-3 py-1.5 rounded-md flex items-center gap-2 shadow-md" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}>
        <MousePointer2 size={12} className="text-primary-strong" />
        <span className="text-xs font-mono font-medium text-foreground tracking-tight">{coords.gx}.{coords.gy}.{worldId}</span>
      </div>
      <div className="px-2 py-0.5 rounded-full text-[9px] text-muted-foreground flex items-center gap-1.5" style={{ background: 'hsl(var(--card) / 0.6)', border: '1px solid hsl(var(--border) / 0.4)' }}>
        <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: 'hsl(var(--primary))' }} />
        Double-clic copier · Flèches/+/-/0
      </div>
    </div>
  );
});

const MINIMAP_W = 160;

const Minimap = memo(({
  mapPath, subscribe, viewportW, viewportH, imageW, imageH, onNavigate, isFullscreen,
}: {
  mapPath: string;
  subscribe: (cb: (s: TransformLike) => void) => () => void;
  viewportW: number; viewportH: number; imageW: number; imageH: number;
  onNavigate: (imgX: number, imgY: number) => void; isFullscreen: boolean;
}) => {
  const [t, setT] = useState<TransformLike>({ scale: 1, positionX: 0, positionY: 0 });
  useEffect(() => subscribe(setT), [subscribe]);

  if (imageW === 0 || imageH === 0) return null;

  const minimapScale = MINIMAP_W / imageW;
  const minimapH = Math.min(imageH * minimapScale, 120);

  const rectX = (-t.positionX / t.scale) * minimapScale;
  const rectY = (-t.positionY / t.scale) * minimapScale;
  const rectW = (viewportW / t.scale) * minimapScale;
  const rectH = (viewportH / t.scale) * minimapScale;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onNavigate((e.clientX - rect.left) / minimapScale, (e.clientY - rect.top) / minimapScale);
  };

  return (
    <div
      className={`hidden md:block absolute z-20 rounded-md overflow-hidden cursor-pointer transition-colors ${isFullscreen ? 'bottom-8 right-6' : 'bottom-4 right-4'}`}
      style={{ width: MINIMAP_W, height: minimapH, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
      onClick={handleClick}
    >
      <img src={mapPath} alt="" className="w-full h-full object-cover pointer-events-none opacity-70" draggable={false} decoding="async" />
      <div
        className="absolute rounded-sm pointer-events-none"
        style={{
          left: Math.max(0, Math.min(rectX, MINIMAP_W)) + 'px',
          top: Math.max(0, Math.min(rectY, minimapH)) + 'px',
          width: Math.max(4, Math.min(rectW, MINIMAP_W - Math.max(0, rectX))) + 'px',
          height: Math.max(4, Math.min(rectH, minimapH - Math.max(0, rectY))) + 'px',
          border: '2px solid hsl(var(--primary))',
          background: 'hsl(var(--primary) / 0.15)',
        }}
      />
    </div>
  );
});

const MapViewer: React.FC = () => {
  const [selectedMap, setSelectedMap] = useState<MapInfo>(MAPS[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copyFlash, setCopyFlash] = useState<string | null>(null);
  const [coverScale, setCoverScale] = useState(0.5);
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 });
  const [viewportDims, setViewportDims] = useState({ w: 0, h: 0 });

  // Entity markers: the user opens a search panel, checks specific monsters /
  // NPCs / items, and only those are plotted. Data is loaded lazily per
  // category from inside the panel/overlay — nothing loads on plain map open.
  const [markersOpen, setMarkersOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const toggleKey = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);
  const clearKeys = useCallback(() => setSelectedKeys(new Set()), []);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapViewportRef = useRef<HTMLDivElement>(null);
  const transformWrapperRef = useRef<ReactZoomPanPinchRef | null>(null);
  const transformStateRef = useRef<TransformLike>({ scale: 1, positionX: 0, positionY: 0 });
  const coordsRef = useRef<Coords>({ x: 0, y: 0, gx: 0, gy: 0 });

  // Pub/sub registries — avoid re-rendering MapViewer on mouse/transform updates
  const coordsListenersRef = useRef<Set<(c: Coords) => void>>(new Set());
  const transformListenersRef = useRef<Set<(s: TransformLike) => void>>(new Set());

  const subscribeCoords = useCallback((cb: (c: Coords) => void) => {
    coordsListenersRef.current.add(cb);
    cb(coordsRef.current);
    return () => { coordsListenersRef.current.delete(cb); };
  }, []);

  const subscribeTransform = useCallback((cb: (s: TransformLike) => void) => {
    transformListenersRef.current.add(cb);
    cb(transformStateRef.current);
    return () => { transformListenersRef.current.delete(cb); };
  }, []);

  const updateDims = useCallback(() => {
    if (imgRef.current && mapViewportRef.current) {
      const vw = mapViewportRef.current.offsetWidth;
      const vh = mapViewportRef.current.offsetHeight;
      const iw = imgRef.current.naturalWidth;
      const ih = imgRef.current.naturalHeight;
      if (iw > 0 && ih > 0) {
        setCoverScale(Math.max(vw / iw, vh / ih));
        setImgDims(prev => prev.w === iw && prev.h === ih ? prev : { w: iw, h: ih });
        setViewportDims(prev => prev.w === vw && prev.h === vh ? prev : { w: vw, h: vh });
      }
    }
  }, []);

  useEffect(() => {
    const el = mapViewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateDims());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateDims]);

  const fitToView = (instance: ReactZoomPanPinchContentRef) => {
    if (imgRef.current && mapViewportRef.current) {
      const vw = mapViewportRef.current.offsetWidth;
      const vh = mapViewportRef.current.offsetHeight;
      const scale = Math.max(vw / imgRef.current.naturalWidth, vh / imgRef.current.naturalHeight);
      const x = (vw - imgRef.current.naturalWidth * scale) / 2;
      const y = (vh - imgRef.current.naturalHeight * scale) / 2;
      instance.setTransform(x, y, scale, 400, 'easeOut');
    }
  };

  // Center & zoom the camera onto a game coordinate (when a marker is placed).
  const centerOnPoint = useCallback((gx: number, gy: number) => {
    const instance = transformWrapperRef.current;
    const vp = mapViewportRef.current;
    if (!instance || !vp || (gx === 0 && gy === 0)) return;
    const px = gx * 2;
    const py = gy;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const scale = Math.max(isMobile ? 2 : 1.2, coverScale);
    const x = (vp.offsetWidth / 2) - (px * scale);
    const y = (vp.offsetHeight / 2) - (py * scale);
    instance.setTransform(x, y, scale, 600, 'easeOut');
  }, [coverScale]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('t4c-fullscreen-change', { detail: isFullscreen }));
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = '';
    }

    const timer = setTimeout(() => {
      if (transformWrapperRef.current) fitToView(transformWrapperRef.current);
    }, 500);

    return () => {
      document.body.style.overflow = '';
      clearTimeout(timer);
    };
  }, [isFullscreen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!transformWrapperRef.current) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const PAN_STEP = 120;
      const { positionX, positionY, scale } = transformStateRef.current;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          transformWrapperRef.current.setTransform(positionX, positionY + PAN_STEP, scale, 150, 'easeOut');
          break;
        case 'ArrowDown':
          e.preventDefault();
          transformWrapperRef.current.setTransform(positionX, positionY - PAN_STEP, scale, 150, 'easeOut');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          transformWrapperRef.current.setTransform(positionX + PAN_STEP, positionY, scale, 150, 'easeOut');
          break;
        case 'ArrowRight':
          e.preventDefault();
          transformWrapperRef.current.setTransform(positionX - PAN_STEP, positionY, scale, 150, 'easeOut');
          break;
        case '+':
        case '=':
          e.preventDefault();
          transformWrapperRef.current.zoomIn();
          break;
        case '-':
          e.preventDefault();
          transformWrapperRef.current.zoomOut();
          break;
        case '0':
          e.preventDefault();
          fitToView(transformWrapperRef.current);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMinimapNavigate = useCallback((imgX: number, imgY: number) => {
    if (!transformWrapperRef.current || !mapViewportRef.current) return;
    const { scale } = transformStateRef.current;
    const x = mapViewportRef.current.offsetWidth / 2 - imgX * scale;
    const y = mapViewportRef.current.offsetHeight / 2 - imgY * scale;
    transformWrapperRef.current.setTransform(x, y, scale, 300, 'easeOut');
  }, []);

  const toggleFullscreen = () => setIsFullscreen(v => !v);

  // Mouse move: rAF-throttled, never triggers MapViewer re-render
  const moveRafRef = useRef(0);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const localX = (e.clientX - rect.left) * scaleX;
    const localY = (e.clientY - rect.top) * scaleY;
    if (localX < 0 || localY < 0 || localX > img.naturalWidth || localY > img.naturalHeight) return;
    const next: Coords = { x: Math.floor(localX), y: Math.floor(localY), gx: Math.floor(localX / 2), gy: Math.floor(localY) };
    coordsRef.current = next;
    if (moveRafRef.current) return;
    moveRafRef.current = requestAnimationFrame(() => {
      moveRafRef.current = 0;
      coordsListenersRef.current.forEach(cb => cb(coordsRef.current));
    });
  }, []);

  const handleMapClick = useCallback(() => {
    const c = coordsRef.current;
    const coordString = `${c.gx}.${c.gy}.${selectedMap.worldId}`;
    navigator.clipboard.writeText(coordString).then(() => {
      setCopyFlash(coordString);
      setTimeout(() => setCopyFlash(null), 1500);
    });
  }, [selectedMap.worldId]);

  // rAF-throttled transform updates → notify listeners only
  const transformRafRef = useRef(0);
  const handleTransformed = useCallback((_ref: ReactZoomPanPinchRef, state: TransformLike) => {
    transformStateRef.current = state;
    if (transformRafRef.current) return;
    transformRafRef.current = requestAnimationFrame(() => {
      transformRafRef.current = 0;
      transformListenersRef.current.forEach(cb => cb(transformStateRef.current));
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col gap-3 md:gap-4 overflow-hidden ${isFullscreen ? 'fixed !inset-0 !z-[9999] !w-screen !h-[100dvh] !max-w-none !m-0 p-safe touch-none' : 'h-full p-4 md:p-6'}`}
      style={isFullscreen ? { touchAction: 'none', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'hsl(var(--background))' } : { background: 'hsl(var(--background))' }}
    >
      <div className={`flex gap-3 md:gap-4 items-center surface-card px-3 md:px-4 py-2 md:py-2.5 shrink-0 ${isFullscreen ? '!rounded-none !border-0 !border-b px-safe-top' : ''}`}>
        <div className="flex items-center gap-2 shrink-0">
          <div className={`${isFullscreen ? 'hidden' : 'hidden lg:flex items-center gap-2'}`}>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Cartographie</h2>
            <span className="w-1 h-1 rounded-full" style={{ background: 'hsl(var(--primary))' }} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="hidden lg:flex flex-wrap gap-1.5">
            {MAPS.map(map => (
              <button
                key={map.id}
                onClick={() => { setSelectedMap(map); setIsLoading(true); }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedMap.id === map.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                style={selectedMap.id === map.id ? { background: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary) / 0.4)' } : { background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border) / 0.5)' }}
              >
                {map.name.split(' / ')[0]}
              </button>
            ))}
          </div>
          <div className="lg:hidden">
            <ScrollContainer className="flex gap-1">
              {MAPS.map(map => (
                <button
                  key={map.id}
                  onClick={() => { setSelectedMap(map); setIsLoading(true); }}
                  className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${
                    selectedMap.id === map.id ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                  style={selectedMap.id === map.id ? { background: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary) / 0.4)' } : { background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border) / 0.5)' }}
                >
                  {map.name.split(' / ')[0]}
                </button>
              ))}
            </ScrollContainer>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleFullscreen}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            style={{ background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border) / 0.5)' }}
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            {isFullscreen ? <Minimize size={16} /> : <Fullscreen size={16} />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-2 md:gap-4 min-h-0 relative">
        <div ref={mapViewportRef} className="relative flex-1 rounded-xl border overflow-hidden select-none group" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border) / 0.6)' }}>
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm" style={{ background: 'hsl(var(--background) / 0.7)' }}>
              <Loader2 size={28} className="text-primary-strong animate-spin mb-3" />
              <p className="text-muted-foreground text-xs font-medium animate-pulse">Chargement...</p>
            </div>
          )}
          {copyFlash && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-md text-xs font-medium shadow-lg animate-in fade-in slide-in-from-top-2 duration-200" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
              Copié : {copyFlash}
            </div>
          )}

          {/* Marker search: open a panel to pick specific entities to plot */}
          {markersOpen ? (
            <MapMarkerPanel
              worldId={selectedMap.worldId}
              selectedKeys={selectedKeys}
              onToggleKey={toggleKey}
              onFocus={centerOnPoint}
              onClear={clearKeys}
              onClose={() => setMarkersOpen(false)}
            />
          ) : (
            <button
              onClick={() => setMarkersOpen(true)}
              className={`absolute z-20 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${isFullscreen ? 'top-8 left-6' : 'top-3 left-3'}`}
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)', color: 'hsl(var(--foreground))' }}
              title="Afficher des marqueurs sur la carte"
            >
              <MapPin size={13} className="text-primary-strong" />
              Marqueurs{selectedKeys.size > 0 ? ` (${selectedKeys.size})` : ''}
            </button>
          )}
          <TransformWrapper
            key={`${isFullscreen}-${selectedMap.id}-${coverScale}`}
            initialScale={coverScale}
            minScale={coverScale}
            maxScale={3}
            doubleClick={{ disabled: true }}
            limitToBounds={true}
            centerZoomedOut={false}
            wheel={{ step: 0.08 }}
            velocityAnimation={{ sensitivity: 1, animationTime: 300, animationType: 'easeOut' }}
            onTransformed={handleTransformed}
            ref={transformWrapperRef}>
            {(instance) => (
              <>
                <div className={`absolute top-3 right-3 md:top-4 md:right-4 z-20 flex flex-col gap-1.5 ${isFullscreen ? 'pr-safe pt-safe' : ''}`}>
                  <button onClick={() => instance.zoomIn()} className="inline-flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground transition-colors" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }} title="Zoom +"><ZoomIn size={16} /></button>
                  <button onClick={() => instance.zoomOut()} className="inline-flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground transition-colors" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }} title="Zoom −"><ZoomOut size={16} /></button>
                  <button onClick={() => fitToView(instance)} className="inline-flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground transition-colors" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }} title="Recadrer"><Maximize size={16} /></button>
                </div>

                <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                  <div onMouseMove={handleMouseMove} onDoubleClick={handleMapClick} className="relative cursor-crosshair" style={{ willChange: 'transform' }}>
                    <img
                      ref={imgRef}
                      src={selectedMap.path}
                      alt={selectedMap.name}
                      className="max-w-none"
                      decoding="async"
                      loading="eager"
                      onLoad={() => {
                        setIsLoading(false);
                        updateDims();
                        setTimeout(() => {
                          if (transformWrapperRef.current) fitToView(transformWrapperRef.current);
                        }, 100);
                      }}
                      draggable={false}
                    />
                    {selectedKeys.size > 0 && <MapMarkers worldId={selectedMap.worldId} selectedKeys={selectedKeys} />}
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
          {!isLoading && (
            <Minimap
              mapPath={selectedMap.path}
              subscribe={subscribeTransform}
              viewportW={viewportDims.w}
              viewportH={viewportDims.h}
              imageW={imgDims.w}
              imageH={imgDims.h}
              onNavigate={handleMinimapNavigate}
              isFullscreen={isFullscreen}
            />
          )}
          <CoordsOverlay subscribe={subscribeCoords} worldId={selectedMap.worldId} isFullscreen={isFullscreen} />
        </div>
      </div>
    </div>
  );
};

export default MapViewer;
