import { useEffect, useState, useMemo, useRef } from 'react'
import { motion, useMotionValueEvent, AnimatePresence, PanInfo } from 'framer-motion'
import { useAudio } from './hooks/useAudio'
import { tracks } from './data'
import LoadingScreen from './components/LoadingScreen'

function formatTime(s: number) {
  if (!s || !Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// --- Helper Components ---

const TypewriterText = ({ text, onComplete }: { text: string; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    let i = 0;
    setDisplayedText(''); // Reset on new text
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 20); // Faster typing speed
    return () => clearInterval(interval);
  }, [text, onComplete]);

  return <span>{displayedText}</span>;
};
const FullscreenCarousel = ({ track, onClose }: { track: any; onClose: () => void }) => {
  const [photoIndex, setPhotoIndex] = useState(0);

  const nextPhoto = () => setPhotoIndex(prev => (prev + 1) % track.photos.length);
  const prevPhoto = () => setPhotoIndex(prev => (prev - 1 + track.photos.length) % track.photos.length);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center backdrop-blur-sm"
    >
      <button onClick={onClose} className="absolute top-4 right-4 text-white font-bold mono text-lg p-4 z-20">[ CLOSE ]</button>
      <div className="w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.img
            key={photoIndex}
            src={track.photos[photoIndex].src || track.photos[photoIndex]}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="max-w-[90vw] max-h-[80vh] object-contain border-4 border-black shadow-2xl"
          />
        </AnimatePresence>
      </div>
      <div className="absolute bottom-10 flex gap-4">
        <button onClick={prevPhoto} className="btn-mechanical text-white px-8 py-3 mono">PREV</button>
        <button onClick={nextPhoto} className="btn-mechanical text-white px-8 py-3 mono">NEXT</button>
      </div>
    </motion.div>
  );
};

// --- Main App Component ---

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [fullscreen, setFullscreen] = useState(false);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-5), msg]); // Keep log shorter
  };

  const audio = useAudio({
    onEnded: () => {
      addLog("Playback sequence complete.");
      const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
      if (currentIndex !== -1 && currentIndex < tracks.length - 1) {
        selectTrack(tracks[currentIndex + 1]);
      }
    }
  });

  const {
    currentTrack,
    isPlaying,
    time,
    duration,
    selectTrack,
    toggle,
  } = audio;
  
  useEffect(() => {
    addLog(`[${new Date().toLocaleTimeString()}] System sequence initiated...`);
  }, []);

  const [currentTimeStr, setCurrentTimeStr] = useState("0:00");
  const [durationStr, setDurationStr] = useState("0:00");

  useMotionValueEvent(time, "change", (latest) => setCurrentTimeStr(formatTime(latest)));
  useEffect(() => setDurationStr(formatTime(duration)), [duration]);

  useEffect(() => {
    if (currentTrack) {
      addLog(`Loading track: ${currentTrack.title}`);
      if (window.innerWidth < 1024) setShowArchive(false);
    }
  }, [currentTrack]);
  
  const [clock, setClock] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const progressPct = duration > 0 ? (time.get() / duration) * 100 : 0;

  const allAssets = useMemo(() => tracks.flatMap(t => [t.coverArt, ...t.photos.map(p => typeof p === 'string' ? p : p.src)]), []);

  const handleSwipe = (info: PanInfo) => {
    if (Math.abs(info.offset.x) < 50) return;
    const direction = info.offset.x > 0 ? 'right' : 'left';
    const idx = tracks.findIndex(t => t.id === currentTrack?.id);
    if (direction === 'left' && idx < tracks.length - 1) {
      selectTrack(tracks[idx + 1]);
    } else if (direction === 'right' && idx > 0) {
      selectTrack(tracks[idx - 1]);
    }
  };

  return (
    <>
      <AnimatePresence>{!isReady && <LoadingScreen onReady={() => setIsReady(true)} assets={allAssets} />}</AnimatePresence>
      <AnimatePresence>{fullscreen && currentTrack && <FullscreenCarousel track={currentTrack} onClose={() => setFullscreen(false)} />}</AnimatePresence>
      
      <div className="flex flex-col h-screen bg-[#1a1a1a] text-[#e5e5e5] font-sans overflow-hidden">
        <div className="crt-overlay" />
        {/* ... Header and Footer are mostly the same but with refined classes ... */}
        <header className="h-12 bg-black border-b-2 border-[#404040] flex items-center justify-between px-4 z-[60] shrink-0">
             <div className="flex items-center gap-3">
                 <span className="mono text-glow text-sm md:text-base">NS_SPOOL //</span>
             </div>
             <div className="flex gap-3 md:gap-5 items-center">
                 <button onClick={() => setShowArchive(!showArchive)} className="lg:hidden btn-mechanical text-white h-8 px-3 text-[10px] mono uppercase">ARCHIVE</button>
                 <div className="bg-[#262626] border border-[#404040] px-2 py-0.5 text-[10px] uppercase hidden sm:flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full online-indicator"></div>
                     <span className="mono text-glow">SYSTEM_ONLINE</span>
                 </div>
                 <div className="mono text-xs">{clock}</div>
             </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {/* ARCHIVE */}
          <aside className={`fixed inset-0 top-12 z-50 lg:static lg:w-80 lg:shrink-0 lg:translate-x-0 bg-[#111] border-r-2 border-[#404040] transition-transform duration-300 flex flex-col ${showArchive ? 'translate-x-0' : '-translate-x-full'}`}>
             <div className="p-4 border-b-2 border-[#404040] bg-[#262626] flex justify-between items-center">
                 <span className="mono text-xs font-bold uppercase">DB_ARCHIVE</span>
                 <button onClick={() => setShowArchive(false)} className="lg:hidden p-1 text-glow mono">[X]</button>
             </div>
             <ul className="flex-1 overflow-y-auto">
                {tracks.map((track) => (
                  <li key={track.id} onClick={() => selectTrack(track)} className={`btn-mechanical w-full justify-start p-4 border-b border-[#404040] ${currentTrack?.id === track.id ? 'bg-accent text-black' : 'hover:bg-surface'}`}>
                    <div className="flex-1 text-left"><h3 className="text-sm font-extrabold uppercase truncate">{track.title}</h3></div>
                    <span className={`mono text-[10px] ${currentTrack?.id === track.id ? 'text-black' : 'text-glow'}`}>{track.era}</span>
                  </li>
                ))}
             </ul>
          </aside>

          {/* MAIN CONTENT & PLAYER */}
          <main className="flex-1 flex flex-col overflow-y-auto bg-grid">
              <div className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 place-content-start">
                  {/* Photo-centric view when track is playing */}
                  {currentTrack ? (
                      <>
                        <motion.section 
                          className="panel order-first lg:order-last cursor-pointer"
                          onClick={() => setFullscreen(true)}
                          onPanEnd={(_, info) => handleSwipe(info)}
                        >
                          <div className="panel-label">IMG_REPO</div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                            {currentTrack.photos.slice(0, 6).map((p, i) => (
                              <div key={i} className="aspect-square bg-black border border-border overflow-hidden">
                                <img src={typeof p === 'string' ? p : p.src} className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all" alt="" />
                              </div>
                            ))}
                          </div>
                        </motion.section>
                        
                        <section className="panel flex flex-col justify-between">
                            <div>
                              <div className="panel-label">MD_DATA_STREAM</div>
                              <h1 className="font-black uppercase truncate">{currentTrack.title}</h1>
                              <p className="text-text-dim uppercase tracking-widest mb-4">{currentTrack.artist}</p>
                            </div>
                            <div className="h-24 mono text-[10px] leading-relaxed overflow-hidden flex flex-col-reverse">
                              {logs.slice().reverse().map((log, i) => <div key={i}>{i === 0 ? <TypewriterText text={log} /> : log}</div>)}
                              <div className="blink mt-1">_</div>
                            </div>
                        </section>
                      </>
                  ) : (
                      <div className="panel lg:col-span-2 text-center">
                          <div className="panel-label">AWAIT_INPUT</div>
                          <p className="mono text-text-dim">No track selected. Please access DB_ARCHIVE.</p>
                      </div>
                  )}
              </div>
              
              {/* STICKY PLAYER CONTROLS */}
              <div className="panel shrink-0 p-2 md:p-4 border-t-2 border-black rounded-none">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  
                  {/* Left: Track Info */}
                  <div className="hidden lg:block truncate">
                    <h4 className="font-bold uppercase truncate mono">{currentTrack?.title || 'NO_TRACK'}</h4>
                    <p className="text-xs text-text-dim truncate mono">{currentTrack?.artist || 'UNKNOWN'}</p>
                  </div>

                  {/* Center: Controls & Scrubber */}
                  <div className="w-full max-w-sm mx-auto">
                    <div className="flex justify-center items-center gap-px">
                        <button onClick={() => handleSwipe({ offset: { x: 51 } } as PanInfo)} className="btn-mechanical flex-1 bg-surface text-white p-3">PRV</button>
                        <button onClick={toggle} className="btn-mechanical flex-[1.5] bg-accent text-black font-extrabold p-3">{isPlaying ? 'HALT' : 'PLAY'}</button>
                        <button onClick={() => handleSwipe({ offset: { x: -51 } } as PanInfo)} className="btn-mechanical flex-1 bg-surface text-white p-3">NXT</button>
                    </div>
                    <div className="w-full h-3 bg-black border-2 border-black relative cursor-pointer mt-2" onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        audio.seek((e.clientX - rect.left) / rect.width * duration);
                    }}>
                      <motion.div className="h-full bg-accent" style={{ width: `${progressPct}%` }}/>
                      <div className="absolute inset-0 flex justify-between items-center px-2">
                        <span className="font-bold mono text-[9px] text-white mix-blend-difference">{currentTimeStr}</span>
                        <span className="font-bold mono text-[9px] text-white mix-blend-difference">{durationStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Visualizer */}
                  <div className="hidden lg:flex items-center justify-end h-10 gap-1">
                      <AudioVisualizer analyser={audio.analyser} isPlaying={isPlaying} />
                  </div>
                </div>
              </div>
          </main>
        </div>
      </div>
    </>
  )
}

const AudioVisualizer = ({ analyser, isPlaying }: { analyser: React.MutableRefObject<AnalyserNode | null>, isPlaying: boolean }) => {
  const bars = Array.from({ length: 16 });
  const data = useRef(new Uint8Array(128));

  const update = () => {
    if (isPlaying && analyser.current) {
      analyser.current.getByteFrequencyData(data.current);
      // Force a re-render by creating a new array copy
      r(Date.now());
    }
    requestAnimationFrame(update);
  };
  
  const [, r] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(update);
    return () => cancelAnimationFrame(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, analyser]);

  return (
    <>
      {bars.map((_, i) => {
        const barHeight = isPlaying ? Math.max(2, (data.current[i * 4] / 255) * 100) : 0;
        return (
          <motion.div
            key={i}
            className="w-2 bg-accent"
            style={{ height: `${barHeight}%`, transition: 'height 0.1s ease-out' }}
          />
        );
      })}
    </>
  );
};
