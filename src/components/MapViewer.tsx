import React, { useState, useRef, memo, useEffect, useCallback } from 'react';
import { Maximize, ZoomIn, ZoomOut, MousePointer2, Loader2, Fullscreen, Minimize, RotateCw } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import ScrollContainer from '../components/shared/ScrollContainer';
import { MAPS } from '../config/maps';
import type { MapInfo } from '../config/maps';

const CoordsOverlay = memo(({ gx, gy, worldId, isFullscreen }: { gx: number, gy: number, worldId: number, isFullscreen: boolean }) => (
  <div className={`absolute bottom-3 left-3 flex flex-col items-start gap-1.5 pointer-events-none z-20 ${isFullscreen ? 'pl-safe pb-safe' : ''}`}>
    <div className="backdrop-blur-md px-3 py-1.5 rounded-md flex items-center gap-2 shadow-md" style={{ background: 'hsl(var(--card) / 0.85)', border: '1px solid hsl(var(--border) / 0.6)' }}>
      <MousePointer2 size={12} className="text-primary-strong" />
      <span className="text-xs font-mono font-medium text-foreground tracking-tight">{gx}.{gy}.{worldId}</span>
    </div>
    <div className="backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] text-muted-foreground flex items-center gap-1.5" style={{ background: 'hsl(var(--card) / 0.6)', border: '1px solid hsl(var(--border) / 0.4)' }}>
      <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: 'hsl(var(--primary))' }} />
      Double-clic copier · Flèches/+/-/0
    </div>
  </div>
));

const MINIMAP_W = 160;

const Minimap = memo(({
  mapPath, scale, positionX, positionY, viewportW, viewportH, imageW, imageH, onNavigate, isFullscreen,
}: {
  mapPath: string; scale: number; positionX: number; positionY: number;
  viewportW: number; viewportH: number; imageW: number; imageH: number;
  onNavigate: (imgX: number, imgY: number) => void; isFullscreen: boolean;
}) => {
  if (imageW === 0 || imageH === 0) return null;

  const minimapScale = MINIMAP_W / imageW;
  const minimapH = Math.min(imageH * minimapScale, 120);

  const rectX = (-positionX / scale) * minimapScale;
  const rectY = (-positionY / scale) * minimapScale;
  const rectW = (viewportW / scale) * minimapScale;
  const rectH = (viewportH / scale) * minimapScale;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onNavigate((e.clientX - rect.left) / minimapScale, (e.clientY - rect.top) / minimapScale);
  };

  return (
    <div
      className={`hidden md:block absolute z-20 backdrop-blur-md rounded-md overflow-hidden cursor-pointer transition-colors ${isFullscreen ? 'bottom-8 right-6' : 'bottom-4 right-4'}`}
      style={{ width: MINIMAP_W, height: minimapH, background: 'hsl(var(--card) / 0.85)', border: '1px solid hsl(var(--border) / 0.6)' }}
      onClick={handleClick}
    >
      <img src={mapPath} alt="" className="w-full h-full object-cover pointer-events-none opacity-70" draggable={false} />
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
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
  const [copyFlash, setCopyFlash] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapViewportRef = useRef<HTMLDivElement>(null);
  const transformWrapperRef = useRef<any>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0, gx: 0, gy: 0 });
  const transformStateRef = useRef({ scale: 0.1, positionX: 0, positionY: 0 });
  const [transformState, setTransformState] = useState({ scale: 0.1, positionX: 0, positionY: 0 });
  const rafId = useRef(0);
  const [coverScale, setCoverScale] = useState(0.5);

  const updateCoverScale = useCallback(() => {
    if (imgRef.current && mapViewportRef.current) {
      const vw = mapViewportRef.current.offsetWidth;
      const vh = mapViewportRef.current.offsetHeight;
      const iw = imgRef.current.naturalWidth;
      const ih = imgRef.current.naturalHeight;
      if (iw > 0 && ih > 0) {
        setCoverScale(Math.max(vw / iw, vh / ih));
      }
    }
  }, []);

  useEffect(() => {
    const el = mapViewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateCoverScale());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateCoverScale]);

  const fitToView = (instance: any) => {
    if (imgRef.current && mapViewportRef.current) {
      const vw = mapViewportRef.current.offsetWidth;
      const vh = mapViewportRef.current.offsetHeight;
      const scale = Math.max(vw / imgRef.current.naturalWidth, vh / imgRef.current.naturalHeight);
      const x = (vw - imgRef.current.naturalWidth * scale) / 2;
      const y = (vh - imgRef.current.naturalHeight * scale) / 2;
      instance.setTransform(x, y, scale, 400, "easeOut");
    }
  };

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('t4c-fullscreen-change', { detail: isFullscreen }));
    if (isFullscreen) {
        document.body.style.overflow = 'hidden';
        window.scrollTo(0, 0);
    } else {
        document.body.style.overflow = '';
    }

    const timer = setTimeout(() => {
      if (transformWrapperRef.current) {
        fitToView(transformWrapperRef.current);
      }
    }, 500);

    return () => {
      document.body.style.overflow = '';
      clearTimeout(timer);
    };
  }, [isFullscreen]);

  useEffect(() => {
    const checkOrientation = () => {
      const isPortrait = window.matchMedia('(orientation: portrait)').matches;
      setOrientation(isPortrait ? 'portrait' : 'landscape');
    };

    checkOrientation();

    const mql = window.matchMedia('(orientation: portrait)');
    const handleOrientationChange = (e: MediaQueryListEvent) => {
      setOrientation(e.matches ? 'portrait' : 'landscape');
    };

    mql.addEventListener('change', handleOrientationChange);
    window.addEventListener('resize', checkOrientation);

    const handleLegacyOrientationChange = () => {
       setTimeout(checkOrientation, 100);
       setTimeout(checkOrientation, 500);
    };
    window.addEventListener('orientationchange', handleLegacyOrientationChange);

    return () => {
        mql.removeEventListener('change', handleOrientationChange);
        window.removeEventListener('resize', checkOrientation);
        window.removeEventListener('orientationchange', handleLegacyOrientationChange);
    };
  }, []);

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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      const scaleX = imgRef.current.naturalWidth / rect.width;
      const scaleY = imgRef.current.naturalHeight / rect.height;
      const localX = (e.clientX - rect.left) * scaleX;
      const localY = (e.clientY - rect.top) * scaleY;
      if (localX >= 0 && localY >= 0 && localX <= imgRef.current.naturalWidth && localY <= imgRef.current.naturalHeight) {
        setCoords({ x: Math.floor(localX), y: Math.floor(localY), gx: Math.floor(localX / 2), gy: Math.floor(localY) });
      }
    }
  };

  const handleMapClick = () => {
    const coordString = `${coords.gx}.${coords.gy}.${selectedMap.worldId}`;
    navigator.clipboard.writeText(coordString).then(() => {
      setCopyFlash(coordString);
      setTimeout(() => setCopyFlash(null), 1500);
    });
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col gap-3 md:gap-4 overflow-hidden transition-all duration-500 ${isFullscreen ? 'fixed !inset-0 !z-[9999] !w-screen !h-[100dvh] !max-w-none !m-0 p-safe touch-none' : 'h-full p-4 md:p-6'}`}
      style={isFullscreen ? { touchAction: 'none', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'hsl(var(--background))' } : { background: 'hsl(var(--background))' }}
    >
      {orientation === 'portrait' && (
        <div className="fixed inset-0 z-[10000] bg-slate-950 flex flex-col items-center justify-center p-8 text-center sm:hidden p-safe">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse"><RotateCw size={40} className="text-amber-500" /></div>
          <h2 className="text-xl font-black text-white uppercase italic mb-2">Mode Paysage Requis</h2>
          <p className="text-slate-500 text-sm leading-relaxed">Faites pivoter votre téléphone pour utiliser la cartographie HD.</p>
        </div>
      )}

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
                  selectedMap.id === map.id
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
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
          {(orientation === 'landscape' || !window.matchMedia('(max-width: 768px)').matches) && (
            <button
              onClick={toggleFullscreen}
              className="inline-flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              style={{ background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border) / 0.5)' }}
              title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            >
              {isFullscreen ? <Minimize size={16} /> : <Fullscreen size={16} />}
            </button>
          )}
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
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 backdrop-blur-md rounded-md text-xs font-medium shadow-lg animate-in fade-in slide-in-from-top-2 duration-200" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
              Copié : {copyFlash}
            </div>
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
            onTransformed={(_ref, state) => {
              transformStateRef.current = state;
              cancelAnimationFrame(rafId.current);
              rafId.current = requestAnimationFrame(() => setTransformState({ ...state }));
            }}
            ref={transformWrapperRef}>
            {(instance) => (
              <>
                <div className={`absolute top-3 right-3 md:top-4 md:right-4 z-20 flex flex-col gap-1.5 ${isFullscreen ? 'pr-safe pt-safe' : ''}`}>
                  <button onClick={() => instance.zoomIn()} className="inline-flex items-center justify-center w-9 h-9 backdrop-blur-md rounded-md text-muted-foreground hover:text-foreground transition-colors" style={{ background: 'hsl(var(--card) / 0.85)', border: '1px solid hsl(var(--border) / 0.6)' }} title="Zoom +"><ZoomIn size={16} /></button>
                  <button onClick={() => instance.zoomOut()} className="inline-flex items-center justify-center w-9 h-9 backdrop-blur-md rounded-md text-muted-foreground hover:text-foreground transition-colors" style={{ background: 'hsl(var(--card) / 0.85)', border: '1px solid hsl(var(--border) / 0.6)' }} title="Zoom −"><ZoomOut size={16} /></button>
                  <button onClick={() => fitToView(instance)} className="inline-flex items-center justify-center w-9 h-9 backdrop-blur-md rounded-md text-muted-foreground hover:text-foreground transition-colors" style={{ background: 'hsl(var(--card) / 0.85)', border: '1px solid hsl(var(--border) / 0.6)' }} title="Recadrer"><Maximize size={16} /></button>
                </div>

                <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                  <div onMouseMove={handleMouseMove} onDoubleClick={handleMapClick} className="relative cursor-crosshair">
                    <img
                      ref={imgRef}
                      src={selectedMap.path}
                      alt={selectedMap.name}
                      className="max-w-none"
                      onLoad={() => {
                        setIsLoading(false);
                        updateCoverScale();
                        setTimeout(() => {
                          if (transformWrapperRef.current) {
                            fitToView(transformWrapperRef.current);
                          }
                        }, 100);
                      }}
                      draggable={false}
                    />
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
          {!isLoading && (
            <Minimap
              mapPath={selectedMap.path}
              scale={transformState.scale}
              positionX={transformState.positionX}
              positionY={transformState.positionY}
              viewportW={mapViewportRef.current?.offsetWidth ?? 0}
              viewportH={mapViewportRef.current?.offsetHeight ?? 0}
              imageW={imgRef.current?.naturalWidth ?? 0}
              imageH={imgRef.current?.naturalHeight ?? 0}
              onNavigate={handleMinimapNavigate}
              isFullscreen={isFullscreen}
            />
          )}
          <CoordsOverlay gx={coords.gx} gy={coords.gy} worldId={selectedMap.worldId} isFullscreen={isFullscreen} />
        </div>
      </div>
    </div>
  );
};

export default MapViewer;
