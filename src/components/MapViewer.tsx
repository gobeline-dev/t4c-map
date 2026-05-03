import React, { useState, useRef, memo, useEffect, useCallback } from 'react';
import { Maximize, ZoomIn, ZoomOut, MousePointer2, Loader2, Fullscreen, Minimize, RotateCw } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import ScrollContainer from '../components/shared/ScrollContainer';
import { MAPS } from '../config/maps';
import type { MapInfo } from '../config/maps';

const CoordsOverlay = memo(({ gx, gy, worldId, isFullscreen }: { gx: number, gy: number, worldId: number, isFullscreen: boolean }) => (
  <div className={`absolute bottom-3 left-3 flex flex-col items-start gap-1.5 pointer-events-none z-20 ${isFullscreen ? 'pl-safe pb-safe' : ''}`}>
    <div className="bg-slate-900/90 backdrop-blur-md border border-amber-500/20 px-2.5 py-1.5 rounded-lg shadow-xl flex items-center gap-2 border-l-2 border-l-amber-500">
      <MousePointer2 size={12} className="text-amber-500" />
      <span className="text-xs font-mono font-black text-white tracking-tighter">{gx}.{gy}.{worldId}</span>
    </div>
    <div className="bg-slate-950/50 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10 text-[8px] font-bold text-slate-500 flex items-center gap-1.5">
      <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
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
      className={`hidden md:block absolute z-20 bg-slate-950/80 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl cursor-pointer hover:border-amber-500/30 transition-colors ${isFullscreen ? 'bottom-8 right-6' : 'bottom-4 right-4'}`}
      style={{ width: MINIMAP_W, height: minimapH }}
      onClick={handleClick}
    >
      <img src={mapPath} alt="" className="w-full h-full object-cover pointer-events-none opacity-60" draggable={false} />
      <div
        className="absolute border-2 border-amber-500/80 bg-amber-500/15 rounded-sm pointer-events-none"
        style={{
          left: Math.max(0, Math.min(rectX, MINIMAP_W)) + 'px',
          top: Math.max(0, Math.min(rectY, minimapH)) + 'px',
          width: Math.max(4, Math.min(rectW, MINIMAP_W - Math.max(0, rectX))) + 'px',
          height: Math.max(4, Math.min(rectH, minimapH - Math.max(0, rectY))) + 'px',
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
      className={`relative flex flex-col space-y-2 md:space-y-4 overflow-hidden bg-[#0a0a0c] transition-all duration-500 ${isFullscreen ? 'fixed !inset-0 !z-[9999] !w-screen !h-[100dvh] !max-w-none !m-0 p-safe touch-none' : 'h-[calc(100vh-80px)] md:h-[calc(100vh-140px)]'}`}
      style={isFullscreen ? { touchAction: 'none', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 } : {}}
    >
      {orientation === 'portrait' && (
        <div className="fixed inset-0 z-[10000] bg-slate-950 flex flex-col items-center justify-center p-8 text-center sm:hidden p-safe">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse"><RotateCw size={40} className="text-amber-500" /></div>
          <h2 className="text-xl font-black text-white uppercase italic mb-2">Mode Paysage Requis</h2>
          <p className="text-slate-500 text-sm leading-relaxed">Faites pivoter votre téléphone pour utiliser la cartographie HD.</p>
        </div>
      )}

      <div className={`flex gap-2 md:gap-6 items-center bg-slate-800/30 p-2 md:p-4 rounded-xl md:rounded-2xl border border-slate-700/50 shadow-xl shrink-0 transition-all ${isFullscreen ? 'py-1 md:py-2 px-safe-top' : ''}`}>
        <div className="flex items-center gap-3 shrink-0">
          <div className={`${isFullscreen ? 'hidden' : 'hidden lg:flex items-center gap-3'}`}>
            <h2 className="text-lg font-black text-slate-100 uppercase tracking-tight italic leading-none">Cartographie</h2>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="hidden lg:flex flex-wrap gap-2">
            {MAPS.map(map => (
              <button key={map.id} onClick={() => { setSelectedMap(map); setIsLoading(true); }} className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[7px] md:text-[10px] font-black uppercase tracking-wider transition-all border ${selectedMap.id === map.id ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg scale-105' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-200'}`}>
                {map.name.split(' / ')[0]}
              </button>
            ))}
          </div>
          <div className="lg:hidden">
            <ScrollContainer className="flex gap-1 px-1">
              {MAPS.map(map => (
                <button key={map.id} onClick={() => { setSelectedMap(map); setIsLoading(true); }} className={`shrink-0 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${selectedMap.id === map.id ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg scale-105' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-200'}`}>
                  {map.name.split(' / ')[0]}
                </button>
              ))}
            </ScrollContainer>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(orientation === 'landscape' || !window.matchMedia('(max-width: 768px)').matches) && (
            <button onClick={toggleFullscreen} className="p-2 md:p-3 bg-slate-900 border border-slate-800 rounded-lg md:rounded-xl text-slate-400 hover:text-amber-500 transition-all shadow-xl">
              {isFullscreen ? <Minimize size={18} /> : <Fullscreen size={18} />}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 gap-2 md:gap-4 min-h-0 relative">
        <div ref={mapViewportRef} className="relative flex-1 bg-slate-950 rounded-xl md:rounded-2xl border border-slate-800 overflow-hidden select-none group shadow-inner">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
              <Loader2 size={24} className="md:w-12 md:h-12 text-amber-500 animate-spin mb-2 md:mb-4" /><p className="text-slate-400 font-black uppercase tracking-widest animate-pulse text-[8px] md:text-xs">Chargement...</p>
            </div>
          )}
          {copyFlash && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-emerald-500/90 backdrop-blur-md border border-emerald-300 rounded-xl text-slate-950 text-xs font-black uppercase tracking-wider shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
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
                <div className={`absolute top-2 right-2 md:top-4 md:right-4 z-20 flex flex-col gap-1 md:gap-2 ${isFullscreen ? 'pr-safe pt-safe' : ''}`}>
                  <button onClick={() => instance.zoomIn()} className="p-2 md:p-3 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg md:rounded-xl text-slate-300 hover:text-amber-500 transition-all shadow-2xl"><ZoomIn size={16} className="md:w-5 md:h-5" /></button>
                  <button onClick={() => instance.zoomOut()} className="p-2 md:p-3 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg md:rounded-xl text-slate-300 hover:text-amber-500 transition-all shadow-2xl"><ZoomOut size={16} className="md:w-5 md:h-5" /></button>
                  <button onClick={() => fitToView(instance)} className="p-2 md:p-3 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg md:rounded-xl text-slate-300 hover:text-amber-500 transition-all shadow-2xl" title="Recadrer"><Maximize size={16} className="md:w-5 md:h-5" /></button>
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
